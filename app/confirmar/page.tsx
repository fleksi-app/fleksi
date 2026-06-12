'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { calcularPagoCliente, calcularPagoFlekser } from '@/lib/comisiones';
import { notificarEvento } from '@/lib/notificaciones';

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
  const [enviandoDisputa, setEnviandoDisputa] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    const { data: perfil } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
    setUsuario(perfil);
    const servicioId = searchParams.get('id');
    if (!servicioId) { window.location.href = '/mis-trabajos'; return; }
    const { data: svc } = await supabase
      .from('servicios')
      .select('*, aplicaciones(*, usuarios(nombre, email, foto_url))')
      .eq('id', servicioId).single();
    if (svc) {
      setServicio(svc);
      const appAceptada = svc.aplicaciones?.find((a: any) => a.estado === 'aceptado' || a.estado === 'completado');
      setAplicacion(appAceptada);
    }
    setCargando(false);
  };

  const confirmarTrabajo = async () => {
    if (!servicio || !aplicacion) return;
    setProcesando(true);
    setError('');
    try {
      const precio = aplicacion.precio_ofrecido || servicio.presupuesto;
      const esEfectivo = servicio.metodo_pago === 'efectivo';
      const desgloseFlekser = calcularPagoFlekser(precio);
      const desgloseCliente = calcularPagoCliente(precio, false);

      await supabase.from('aplicaciones').update({
        pago_liberado: true,
        estado: 'completado',
      }).eq('id', aplicacion.id);

      await supabase.from('servicios').update({
        estado: 'pagado',
      }).eq('id', servicio.id);

      if (esEfectivo) {
        const comisionEfectivoCliente = Math.round(precio * 0.05);
        const comisionEfectivoFlekser = Math.round(precio * 0.05);

        const { data: clienteData } = await supabase.from('usuarios').select('wallet_saldo').eq('id', servicio.cliente_id).single();
        const saldoCliente = clienteData?.wallet_saldo || 0;
        await supabase.from('usuarios').update({ wallet_saldo: saldoCliente - comisionEfectivoCliente }).eq('id', servicio.cliente_id);
        await supabase.from('wallet_movimientos').insert({
          usuario_id: servicio.cliente_id,
          tipo: 'comision',
          monto: -comisionEfectivoCliente,
          descripcion: `Comisión Fleksi (5%) por pago en efectivo — ${servicio.titulo}`,
          servicio_id: servicio.id,
        });

        const { data: flekserData } = await supabase.from('usuarios').select('wallet_saldo').eq('id', aplicacion.prestador_id).single();
        const saldoFlekser = flekserData?.wallet_saldo || 0;
        await supabase.from('usuarios').update({ wallet_saldo: saldoFlekser - comisionEfectivoFlekser }).eq('id', aplicacion.prestador_id);
        await supabase.from('wallet_movimientos').insert({
          usuario_id: aplicacion.prestador_id,
          tipo: 'comision',
          monto: -comisionEfectivoFlekser,
          descripcion: `Comisión Fleksi (5%) por pago en efectivo — ${servicio.titulo}`,
          servicio_id: servicio.id,
        });

        await supabase.from('notificaciones').insert({
          usuario_id: aplicacion.prestador_id,
          tipo: 'pago_liberado',
          titulo: '💰 Trabajo confirmado',
          mensaje: `${usuario?.nombre} confirmó el trabajo. Cobraste $${precio} en efectivo.`,
          link: '/wallet',
        });
      } else {
        await supabase.from('notificaciones').insert({
          usuario_id: aplicacion.prestador_id,
          tipo: 'pago_liberado',
          titulo: '💰 Pago liberado',
          mensaje: `${usuario?.nombre} confirmó el trabajo. Recibirás $${desgloseFlekser.total} MXN.`,
          link: '/earnings',
        });
      }

      try { await supabase.rpc('incrementar_trabajos', { user_id: aplicacion.prestador_id }); } catch (e) {}

      try {
        await notificarEvento('pago_completado', aplicacion?.usuarios?.email || 'fernando.najera.nm@gmail.com', {
          nombre: aplicacion?.usuarios?.nombre || 'Prestador',
          prestador_id: aplicacion?.prestador_id,
          trabajo: servicio.titulo,
          presupuesto: precio,
          monto: desgloseFlekser.total,
          monto_cliente: desgloseCliente.total,
          es_efectivo: esEfectivo,
        });
      } catch (e) {}

      setConfirmado(true);
    } catch (err: any) {
      setError(err.message || 'Error al confirmar el trabajo');
    } finally {
      setProcesando(false);
    }
  };

  const reportarProblema = async () => {
    if (!descripcionProblema.trim() || !servicio) return;
    setEnviandoDisputa(true);
    try {
      await supabase.from('servicios').update({
        disputa_descripcion: descripcionProblema.trim(),
        disputa_at: new Date().toISOString(),
        estado: 'en_disputa',
      }).eq('id', servicio.id);

      await supabase.from('notificaciones').insert({
        usuario_id: usuario?.id,
        tipo: 'disputa',
        titulo: '⚠️ Disputa registrada',
        mensaje: 'Tu reporte fue recibido. Nuestro equipo revisará el caso en menos de 24 horas.',
        link: '/mis-trabajos',
      });

      try {
        await notificarEvento('disputa', 'fernando.najera.nm@gmail.com', {
          cliente: usuario?.nombre,
          trabajo: servicio.titulo,
          servicio_id: servicio.id,
          descripcion: descripcionProblema.trim(),
          monto: (aplicacion?.precio_ofrecido || servicio.presupuesto),
        });
      } catch (e) {}

      window.location.href = '/mis-trabajos';
    } catch (err: any) {
      setError('Error al enviar el reporte. Intenta de nuevo.');
    } finally {
      setEnviandoDisputa(false);
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

  const precio = aplicacion?.precio_ofrecido || servicio?.presupuesto || 0;
  const esEfectivo = servicio?.metodo_pago === 'efectivo';
  const desgloseCliente = calcularPagoCliente(precio, false);
  const desgloseFlekser = calcularPagoFlekser(precio);

  if (confirmado) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🎉</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">¡Trabajo confirmado!</h1>
          <p className="text-gray-400 mb-6 font-light">
            {esEfectivo ? 'Las comisiones fueron descontadas del wallet de ambas partes.' : `El pago fue liberado a ${aplicacion?.usuarios?.nombre}.`}
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
            <div className="flex justify-between mb-2">
              <span className="text-gray-400 text-sm">Tú pagaste</span>
              <span className="font-extrabold text-purple-600">
                {esEfectivo ? `$${precio} MXN (efectivo)` : `$${desgloseCliente.total} MXN`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Flekser recibe</span>
              <span className="font-extrabold text-green-600">${desgloseFlekser.total} MXN ✅</span>
            </div>
          </div>
          <a href={`/calificar?servicio=${servicio?.id}`}
            className="block w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:opacity-90 transition mb-3">
            ⭐ Calificar al prestador
          </a>
          <a href="/home" className="block w-full py-4 border-2 border-gray-200 text-gray-700 rounded-2xl font-bold text-lg hover:border-purple-400 transition">
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
          <a href="/mis-trabajos" className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold mt-4">Ver mis trabajos</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-white px-6 pt-12 pb-4 shadow-sm">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <a href="/mis-trabajos" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">←</a>
          <h1 className="font-extrabold text-gray-900 text-lg">Confirmar trabajo</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-4">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <span className="text-2xl">⏰</span>
          <div>
            <p className="font-bold text-blue-800 text-sm">Tienes 24 horas para revisar</p>
            <p className="text-blue-600 text-xs mt-0.5">Si no confirmas ni reportas, el pago se libera automáticamente.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-extrabold text-gray-900 mb-3">📋 Resumen del trabajo</h3>
          <p className="font-bold text-gray-900 mb-1">{servicio.titulo}</p>
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${esEfectivo ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>
              {esEfectivo ? '💵 Efectivo' : '💳 Stripe'}
            </span>
          </div>

          {aplicacion && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
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

          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Precio del servicio</span>
              <span className="font-semibold text-sm">${precio} MXN</span>
            </div>
            {!esEfectivo && (
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Comisión de plataforma</span>
                <span className="font-semibold text-sm">${desgloseCliente.comision} MXN</span>
              </div>
            )}
            {esEfectivo && (
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Comisión efectivo (wallet)</span>
                <span className="font-semibold text-sm text-orange-600">-${Math.round(precio * 0.05)} MXN</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-2 flex justify-between">
              <span className="font-extrabold text-gray-900">
                {esEfectivo ? 'Total en efectivo' : 'Total pagado'}
              </span>
              <span className="font-extrabold text-purple-600 text-lg">
                {esEfectivo ? `$${precio} MXN` : `$${desgloseCliente.total} MXN`}
              </span>
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
          <p className="text-gray-400 text-sm mb-4">
            {esEfectivo ? 'Al confirmar, se descontarán las comisiones de ambos wallets.' : 'Al confirmar, el pago se liberará al prestador.'}
          </p>
          <div className="flex gap-3 mb-3">
            <button onClick={() => setProblema(false)}
              className={`flex-1 py-3 rounded-2xl font-bold text-sm transition border-2 ${!problema ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'}`}>
              👍 Sí, quedó bien
            </button>
            <button onClick={() => setProblema(true)}
              className={`flex-1 py-3 rounded-2xl font-bold text-sm transition border-2 ${problema ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500'}`}>
              👎 Hay un problema
            </button>
          </div>

          {problema && (
            <div>
              <textarea value={descripcionProblema} onChange={(e) => setDescripcionProblema(e.target.value)}
                placeholder="Describe el problema detalladamente para que podamos ayudarte..."
                rows={4} className="w-full p-3 rounded-xl border-2 border-red-200 outline-none text-gray-900 text-sm resize-none mb-3"/>
              <div className="bg-red-50 rounded-xl p-3 mb-3">
                <p className="text-red-700 text-xs font-semibold">
                  ⚠️ Al reportar, el pago quedará congelado hasta que nuestro equipo resuelva el caso. Te contactaremos en menos de 24 horas.
                </p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-4 text-sm">{error}</div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-md mx-auto">
          {!problema ? (
            <button onClick={confirmarTrabajo} disabled={procesando}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-extrabold text-lg shadow-lg hover:opacity-90 transition disabled:opacity-50">
              {procesando ? 'Confirmando...' : '🎉 Confirmar y liberar pago'}
            </button>
          ) : (
            <button onClick={reportarProblema} disabled={!descripcionProblema.trim() || enviandoDisputa}
              className="w-full py-4 bg-red-500 text-white rounded-2xl font-extrabold text-lg shadow-lg hover:opacity-90 transition disabled:opacity-50">
              {enviandoDisputa ? 'Enviando reporte...' : '📩 Reportar problema y congelar pago'}
            </button>
          )}
          <p className="text-xs text-gray-400 text-center mt-2">
            🔒 El pago se libera automáticamente después de 24h si no hay reporte
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