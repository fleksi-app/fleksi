'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabase';
import Nav from '@/lib/nav';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function AplicacionesContent() {
  const searchParams = useSearchParams();
  const [servicios, setServicios] = useState<any[]>([]);
  const [servicioActivo, setServicioActivo] = useState<any>(null);
  const [aplicaciones, setAplicaciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState('');
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }

    const { data: perfil } = await supabase
      .from('usuarios').select('*').eq('id', user.id).single();
    setUsuario(perfil);

    const { data: svcs } = await supabase
      .from('servicios')
      .select('*')
      .eq('cliente_id', user.id)
      .order('created_at', { ascending: false });

    setServicios(svcs || []);

    const servicioId = searchParams.get('servicio');
    if (servicioId && svcs) {
      const svc = svcs.find(s => s.id === servicioId);
      if (svc) await verAplicaciones(svc);
    }

    setCargando(false);
  };

  const verAplicaciones = async (servicio: any) => {
    const { data: svcFresco } = await supabase
      .from('servicios').select('*').eq('id', servicio.id).single();
    setServicioActivo(svcFresco || servicio);
    const { data } = await supabase
      .from('aplicaciones')
      .select('*, usuarios(nombre, calificacion, trabajos_completados, habilidades, foto_url, email)')
      .eq('servicio_id', servicio.id)
      .order('created_at', { ascending: false });
    setAplicaciones(data || []);
  };

  const handleRechazar = async (aplicacionId: string) => {
    setProcesando(aplicacionId);
    try {
      await supabase.from('aplicaciones').update({ estado: 'rechazado' }).eq('id', aplicacionId);
      await verAplicaciones(servicioActivo);
    } finally {
      setProcesando('');
    }
  };

  const handleAceptarYPagar = async (aplicacionId: string) => {
    setProcesando(aplicacionId);
    try {
      const appAceptada = aplicaciones.find(a => a.id === aplicacionId);
      const monto = appAceptada?.precio_ofrecido || servicioActivo.presupuesto;
      const seguro = servicioActivo.seguro ? 45 : 0;
      const total = monto + seguro;

      const response = await fetch('/api/crear-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto: total,
          descripcion: servicioActivo.titulo,
          servicioId: servicioActivo.id,
          clienteEmail: usuario?.email || '',
        }),
      });

      const { clientSecret, paymentIntentId, error: apiError } = await response.json();
      if (apiError) throw new Error(apiError);

      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe no disponible');

      const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: { token: 'tok_visa' } },
      });
      if (stripeError) throw new Error(stripeError.message);

      await supabase.from('aplicaciones').update({
        estado: 'aceptado', payment_intent_id: paymentIntentId, pago_retenido: true,
      }).eq('id', aplicacionId);

      await supabase.from('servicios').update({
        estado: 'en_proceso', pago_retenido: true,
      }).eq('id', servicioActivo.id);

      await supabase.from('aplicaciones')
        .update({ estado: 'rechazado' })
        .eq('servicio_id', servicioActivo.id)
        .neq('id', aplicacionId);

      try {
        await fetch('/api/enviar-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: 'aplicacion_aceptada',
            destinatario: appAceptada?.usuarios?.email || 'fernando.najera.nm@gmail.com',
            datos: {
              prestador: appAceptada?.usuarios?.nombre || 'Prestador',
              cliente: usuario?.nombre || 'Cliente',
              trabajo: servicioActivo.titulo,
              precio: monto,
              fecha: servicioActivo.fecha,
            },
          }),
        });
      } catch (e) {}

      await verAplicaciones(servicioActivo);
    } catch (err: any) {
      alert('Error al procesar: ' + err.message);
    } finally {
      setProcesando('');
    }
  };

  const estadoColor: any = {
    pendiente: 'bg-yellow-100 text-yellow-600',
    aceptado: 'bg-green-100 text-green-600',
    rechazado: 'bg-red-100 text-red-600',
  };

  const estadoLabel: any = {
    pendiente: '⏳ Pendiente',
    aceptado: '✅ Aceptado',
    rechazado: '❌ Rechazado',
  };

  if (cargando) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando...</p>
        </div>
      </main>
    );
  }

  if (servicioActivo) {
    const prestadorTermino = aplicaciones.some(a => a.checkout_at);
    const puedeConfirmar = servicioActivo.pago_retenido && prestadorTermino;

    return (
      <main className="min-h-screen bg-gray-50 pb-32">
        <div className="bg-white px-6 pt-12 pb-4 shadow-sm">
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-4 mb-2">
              <button onClick={() => setServicioActivo(null)}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                ←
              </button>
              <div>
                <h1 className="font-extrabold text-gray-900 text-lg">Aplicaciones recibidas</h1>
                <p className="text-gray-400 text-xs truncate max-w-xs">{servicioActivo.titulo}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto px-6 py-4">

          {servicioActivo.pago_retenido && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="font-bold text-green-700 text-sm">Pago retenido por Fleksi</p>
                <p className="text-green-600 text-xs mt-0.5">
                  {prestadorTermino
                    ? 'El prestador terminó — confirma el trabajo para liberar el pago'
                    : 'El dinero se liberará cuando confirmes que el trabajo quedó bien'}
                </p>
              </div>
            </div>
          )}

          {puedeConfirmar && (
            <a href={`/confirmar?id=${servicioActivo.id}`}
              className="block w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-extrabold text-lg text-center shadow-lg hover:opacity-90 transition mb-4">
              🎉 Confirmar trabajo y liberar pago
            </a>
          )}

          {aplicaciones.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-4">⏳</p>
              <p className="font-bold text-gray-900 mb-2">Sin aplicaciones todavía</p>
              <p className="text-gray-400 text-sm">Los prestadores verán tu publicación y aplicarán pronto</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {aplicaciones.map((app) => (
                <div key={app.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                      {app.usuarios?.foto_url ? (
                        <img src={app.usuarios.foto_url} alt={app.usuarios.nombre} className="w-full h-full object-cover"/>
                      ) : (
                        <span className="text-white font-bold text-lg">{app.usuarios?.nombre?.charAt(0) || '?'}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{app.usuarios?.nombre || 'Prestador'}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-yellow-500">⭐ {app.usuarios?.calificacion || '5.0'}</p>
                        <p className="text-xs text-gray-400">· {app.usuarios?.trabajos_completados || 0} trabajos</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${estadoColor[app.estado]}`}>
                      {estadoLabel[app.estado]}
                    </span>
                  </div>

                  {app.usuarios?.habilidades?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {app.usuarios.habilidades.slice(0, 3).map((h: string) => (
                        <span key={h} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{h}</span>
                      ))}
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-xl p-3 mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-500">Precio ofrecido</span>
                      <span className="font-extrabold text-purple-600">${app.precio_ofrecido || servicioActivo.presupuesto} MXN</span>
                    </div>
                    {servicioActivo.seguro && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">+ Fleksi Protege</span>
                        <span className="text-xs text-gray-500">$45 MXN</span>
                      </div>
                    )}
                    {app.mensaje && <p className="text-sm text-gray-600 italic mt-2">"{app.mensaje}"</p>}
                  </div>

                  {app.checkout_at && (
                    <div className="bg-blue-50 rounded-xl p-3 mb-3 text-center">
                      <p className="text-blue-700 text-xs font-bold">
                        ✅ Trabajo terminado — Salida: {new Date(app.checkout_at).toLocaleTimeString('es-MX', {hour: '2-digit', minute: '2-digit'})}
                      </p>
                    </div>
                  )}

                  {app.estado === 'pendiente' && (
                    <div className="flex flex-col gap-2">
                      <div className="bg-blue-50 rounded-xl p-3 mb-1">
                        <p className="text-blue-700 text-xs font-semibold">
                          🔒 Al aceptar se retendrá el pago. Se liberará cuando confirmes que el trabajo quedó bien.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => handleRechazar(app.id)} disabled={procesando === app.id}
                          className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl font-bold hover:border-red-400 hover:text-red-500 transition disabled:opacity-50">
                          ❌ Rechazar
                        </button>
                        <button onClick={() => handleAceptarYPagar(app.id)} disabled={procesando === app.id}
                          className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold shadow-lg hover:opacity-90 transition disabled:opacity-50">
                          {procesando === app.id ? '⏳ Procesando...' : '✅ Aceptar y pagar'}
                        </button>
                      </div>
                    </div>
                  )}

                  {app.estado === 'aceptado' && (
                    <div className="bg-green-50 rounded-xl p-3">
                      <p className="text-green-600 font-bold text-sm text-center">✅ Trabajador confirmado</p>
                      <p className="text-green-500 text-xs text-center mt-1">
                        {app.pago_retenido ? '🔒 Pago retenido — se liberará al confirmar el trabajo' : 'El servicio está en proceso'}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <Nav activo="trabajos" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-white px-6 pt-12 pb-4 shadow-sm">
        <div className="max-w-md mx-auto">
          <h1 className="font-extrabold text-gray-900 text-xl mb-1">Mis solicitudes</h1>
          <p className="text-gray-400 text-sm">Gestiona las aplicaciones que has recibido</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-4">
        <a href="/publicar"
          className="block w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-center shadow-lg hover:opacity-90 transition mb-4">
          + Publicar nueva solicitud
        </a>

        {servicios.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">📋</p>
            <p className="font-bold text-gray-900 mb-2">Sin solicitudes todavía</p>
            <p className="text-gray-400 text-sm">Publica lo que necesitas y recibe ofertas</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {servicios.map((svc) => (
              <button key={svc.id} onClick={() => verAplicaciones(svc)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left w-full active:scale-95 transition">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 text-sm leading-tight flex-1 mr-2">{svc.titulo}</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                    svc.estado === 'activo' ? 'bg-blue-100 text-blue-600' :
                    svc.estado === 'en_proceso' ? 'bg-purple-100 text-purple-600' :
                    svc.estado === 'completado' ? 'bg-orange-100 text-orange-600' :
                    svc.estado === 'pagado' ? 'bg-green-100 text-green-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {svc.estado === 'activo' ? '🟢 Activo' :
                     svc.estado === 'en_proceso' ? '🔄 En proceso' :
                     svc.estado === 'completado' ? '⏳ Por confirmar' :
                     svc.estado === 'pagado' ? '💰 Pagado' : svc.estado}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-400">📅 {svc.fecha}</p>
                  <p className="font-extrabold text-purple-600 text-sm">${svc.presupuesto} MXN</p>
                </div>
                {svc.pago_retenido && (svc.estado === 'en_proceso' || svc.estado === 'completado') && (
                  <div className="mt-2 bg-orange-50 rounded-xl p-2 text-center">
                    <p className="text-orange-600 text-xs font-bold">⏳ Toca para ver y confirmar el trabajo</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <Nav activo="trabajos" />
    </main>
  );
}

export default function Aplicaciones() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </main>
    }>
      <AplicacionesContent />
    </Suspense>
  );
}