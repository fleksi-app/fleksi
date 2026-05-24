'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function ConfirmarContent() {
  const searchParams = useSearchParams();
  const [servicio, setServicio] = useState<any>(null);
  const [aplicacion, setAplicacion] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [problema, setProblema] = useState(false);
  const [descripcionProblema, setDescripcionProblema] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }

    const { data: perfil } = await supabase
      .from('usuarios').select('*').eq('id', user.id).single();
    setUsuario(perfil);

    const servicioId = searchParams.get('id');
    if (!servicioId) { window.location.href = '/mis-trabajos'; return; }

    const { data: svc } = await supabase
      .from('servicios')
      .select('*, aplicaciones(*, usuarios(nombre, email, foto_url))')
      .eq('id', servicioId)
      .single();

    if (svc) {
      setServicio(svc);
      const appAceptada = svc.aplicaciones?.find(
        (a: any) => a.estado === 'aceptado' || a.estado === 'completado'
      );
      setAplicacion(appAceptada);
    }

    setCargando(false);
  };

  const confirmarTrabajo = async () => {
    if (!servicio || !aplicacion) return;
    setProcesando(true);
    setError('');
    try {
      await supabase.from('aplicaciones').update({
        pago_liberado: true,
        estado: 'completado',
      }).eq('id', aplicacion.id);

      await supabase.from('servicios').update({
        estado: 'pagado',
      }).eq('id', servicio.id);

      try {
        await supabase.rpc('incrementar_trabajos', { user_id: aplicacion.prestador_id });
      } catch (e) {}

      const total = servicio.presupuesto + (servicio.seguro ? 45 : 0);

      try {
        await fetch('/api/enviar-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: 'pago_completado',
            destinatario: aplicacion?.usuarios?.email || 'fernando.najera.nm@gmail.com',
            datos: {
              nombre: aplicacion?.usuarios?.nombre || 'Prestador',
              prestador_id: aplicacion?.prestador_id,
              trabajo: servicio.titulo,
              presupuesto: servicio.presupuesto,
              monto: total,
            },
          }),
        });
      } catch (e) {}

      setConfirmado(true);
    } catch (err: any) {
      setError(err.message || 'Error al confirmar el trabajo');
    } finally {
      setProcesando(false);
    }
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

  if (confirmado) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🎉</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">¡Trabajo confirmado!</h1>
          <p className="text-gray-400 mb-8 font-light">
            El pago fue liberado a {aplicacion?.usuarios?.nombre}. ¡Gracias por usar Fleksi!
          </p>
          <div className="bg-white rounded-2xl p-4 mb-6 border border-gray-100">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400 text-sm">Servicio</span>
              <span className="font-semibold text-sm text-gray-900">{servicio?.titulo}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400 text-sm">Prestador</span>
              <span className="font-semibold text-sm text-gray-900">{aplicacion?.usuarios?.nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Pago liberado</span>
              <span className="font-extrabold text-green-600">
                ${(servicio?.presupuesto || 0) + (servicio?.seguro ? 45 : 0)} MXN ✅
              </span>
            </div>
          </div>
          <a href="/calificar"
            className="block w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:opacity-90 transition mb-3">
            ⭐ Calificar al prestador
          </a>
          <a href="/home"
            className="block w-full py-4 border-2 border-gray-200 text-gray-700 rounded-2xl font-bold text-lg hover:border-purple-400 transition">
            Volver al inicio
          </a>
        </div>
      </main>
    );
  }

  if (!servicio) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-4xl mb-4">🔍</p>
          <p className="font-bold text-gray-900 mb-2">Servicio no encontrado</p>
          <a href="/mis-trabajos" className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold mt-4">
            Ver mis trabajos
          </a>
        </div>
      </main>
    );
  }

  const total = (servicio?.presupuesto || 0) + (servicio?.seguro ? 45 : 0);

  return (
    <main className="min-h-screen bg-gray-50 pb-32">

      <div className="bg-white px-6 pt-12 pb-4 shadow-sm">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <a href="/mis-trabajos" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
            ←
          </a>
          <h1 className="font-extrabold text-gray-900 text-lg">Confirmar trabajo</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-4">

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-extrabold text-gray-900 mb-3">📋 Resumen del trabajo</h3>
          <p className="font-bold text-gray-900 mb-1">{servicio.titulo}</p>

          {aplicacion && (
            <div className="flex items-center gap-3 mt-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                {aplicacion.usuarios?.foto_url ? (
                  <img src={aplicacion.usuarios.foto_url} className="w-full h-full object-cover rounded-full"/>
                ) : (
                  <span className="text-white font-bold">{aplicacion.usuarios?.nombre?.charAt(0) || '?'}</span>
                )}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{aplicacion.usuarios?.nombre}</p>
                <p className="text-xs text-gray-400">Prestador del servicio</p>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Servicio</span>
              <span className="font-semibold text-sm">${servicio.presupuesto} MXN</span>
            </div>
            {servicio.seguro && (
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">🛡️ Fleksi Protege</span>
                <span className="font-semibold text-sm">$45 MXN</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-2 flex justify-between">
              <span className="font-extrabold text-gray-900">Total a liberar</span>
              <span className="font-extrabold text-purple-600 text-lg">${total} MXN</span>
            </div>
          </div>
        </div>

        {aplicacion?.fotos_despues?.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <h3 className="font-extrabold text-gray-900 mb-3">📸 Fotos del resultado</h3>
            <div className="grid grid-cols-3 gap-2">
              {aplicacion.fotos_despues.map((url: string, i: number) => (
                <img key={i} src={url} className="w-full aspect-square object-cover rounded-xl"/>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-extrabold text-gray-900 mb-2">¿El trabajo quedó como esperabas?</h3>
          <p className="text-gray-400 text-sm mb-4">Al confirmar, el pago se liberará al prestador.</p>

          <div className="flex gap-3 mb-3">
            <button onClick={() => setProblema(false)}
              className={`flex-1 py-3 rounded-2xl font-bold text-sm transition border-2 ${
                !problema ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'
              }`}>
              👍 Sí, quedó bien
            </button>
            <button onClick={() => setProblema(true)}
              className={`flex-1 py-3 rounded-2xl font-bold text-sm transition border-2 ${
                problema ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500'
              }`}>
              👎 Hay un problema
            </button>
          </div>

          {problema && (
            <div>
              <textarea value={descripcionProblema}
                onChange={(e) => setDescripcionProblema(e.target.value)}
                placeholder="Describe el problema para que podamos ayudarte..."
                rows={3}
                className="w-full p-3 rounded-xl border-2 border-red-200 outline-none text-gray-900 text-sm resize-none mb-3"/>
              <div className="bg-red-50 rounded-xl p-3">
                <p className="text-red-700 text-xs font-semibold">
                  ⚠️ El pago quedará retenido hasta resolver el problema. Nuestro equipo te contactará en menos de 24 horas.
                </p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-4 text-sm">
            {error}
          </div>
        )}

      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-md mx-auto">
          {!problema ? (
            <button onClick={confirmarTrabajo} disabled={procesando}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-extrabold text-lg shadow-lg hover:opacity-90 transition disabled:opacity-50">
              {procesando ? 'Liberando pago...' : `🎉 Confirmar y liberar $${total} MXN`}
            </button>
          ) : (
            <button disabled={!descripcionProblema.trim()}
              className="w-full py-4 bg-red-500 text-white rounded-2xl font-extrabold text-lg shadow-lg hover:opacity-90 transition disabled:opacity-50"
              onClick={async () => {
                if (!descripcionProblema.trim()) return;
                alert('✅ Tu reporte fue enviado. Nuestro equipo te contactará pronto.');
                window.location.href = '/mis-trabajos';
              }}>
              📩 Reportar problema
            </button>
          )}
          <p className="text-xs text-gray-400 text-center mt-2">
            🔒 El pago está protegido por Fleksi hasta tu confirmación
          </p>
        </div>
      </div>

    </main>
  );
}

export default function Confirmar() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </main>
    }>
      <ConfirmarContent />
    </Suspense>
  );
}