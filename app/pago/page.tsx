'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '@/lib/supabase';
import { calcularPagoCliente, calcularPagoFlekser } from '@/lib/comisiones';
import { notificarEvento } from '@/lib/notificaciones';

const MORADO = '#7B2FE0';
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function PagoForm({ aplicacionId, servicio, aplicacion, usuario, onExito }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

  const precio = aplicacion?.precio_ofrecido || servicio?.presupuesto || 0;
  const cupos = servicio?.cupos || 1;
  const desglose = calcularPagoCliente(precio, false);
  const desgloseFlekser = calcularPagoFlekser(precio);
  const totalCliente = desglose.total * cupos;

  const handlePagar = async () => {
    if (!stripe || !elements) return;
    setProcesando(true); setError('');
    try {
      const response = await fetch('/api/crear-pago', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ monto: totalCliente, descripcion: servicio.titulo, servicioId: servicio.id, clienteEmail: usuario?.email || '', prestadorId: aplicacion?.prestador_id || '' }) });
      const { clientSecret, paymentIntentId, error: apiError } = await response.json();
      if (apiError) throw new Error(apiError);
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('No se encontró el elemento de tarjeta');
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, { payment_method: { card: cardElement, billing_details: { name: usuario?.nombre || 'Cliente', email: usuario?.email || '' } } });
      if (stripeError) throw new Error(stripeError.message);
      if (paymentIntent?.status !== 'requires_capture' && paymentIntent?.status !== 'succeeded') throw new Error('Pago no completado');
      await supabase.from('aplicaciones').update({ estado: 'aceptado', payment_intent_id: paymentIntentId, pago_retenido: true, monto_cliente: totalCliente, monto_flekser: desgloseFlekser.total }).eq('id', aplicacionId);
      const nuevosCuposTomados = (servicio.cupos_tomados || 0) + 1;
      const cuposLlenos = nuevosCuposTomados >= (servicio.cupos || 1);
      await supabase.from('servicios').update({ cupos_tomados: nuevosCuposTomados, pago_retenido: true, estado: cuposLlenos ? 'en_proceso' : 'activo' }).eq('id', servicio.id);
      if (cuposLlenos) {
        const { data: rechazados } = await supabase.from('aplicaciones').update({ estado: 'rechazado' }).eq('servicio_id', servicio.id).eq('estado', 'pendiente').neq('id', aplicacionId).select('prestador_id');
        if (rechazados && rechazados.length > 0) {
          try { await supabase.from('notificaciones').insert(rechazados.map((r: any) => ({ usuario_id: r.prestador_id, tipo: 'aplicacion_rechazada', titulo: '❌ Tu aplicación fue rechazada', mensaje: `El cliente eligió a otro Flekser para: ${servicio.titulo}.`, link: '/home' }))); } catch (e) {}
        }
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: existente } = await supabase.from('mensajes').select('id').eq('servicio_id', servicio.id).eq('destinatario_id', aplicacion.prestador_id).limit(1);
        if (!existente || existente.length === 0) { await supabase.from('mensajes').insert({ servicio_id: servicio.id, remitente_id: user.id, destinatario_id: aplicacion.prestador_id, contenido: `¡Hola! Acepté tu propuesta para: ${servicio.titulo}. ¡Nos vemos el ${servicio.fecha}!` }); }
      }
      try { await notificarEvento('aplicacion_aceptada', aplicacion?.usuarios?.email || 'fernando.najera.nm@gmail.com', { prestador: aplicacion?.usuarios?.nombre || 'Flekser', prestador_id: aplicacion?.prestador_id, cliente: usuario?.nombre || 'Cliente', cliente_id: usuario?.id, trabajo: servicio.titulo, precio, fecha: servicio.fecha }); } catch (e) {}
      onExito();
    } catch (err: any) { setError(err.message || 'Error al procesar el pago'); }
    finally { setProcesando(false); }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-extrabold text-gray-900 mb-3">📋 Resumen</h3>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between"><span className="text-gray-400 text-sm">Servicio</span><span className="font-semibold text-sm text-gray-900">{servicio?.titulo}</span></div>
          <div className="flex justify-between"><span className="text-gray-400 text-sm">Flekser</span><span className="font-semibold text-sm text-gray-900">{aplicacion?.usuarios?.nombre}</span></div>
          <div className="flex justify-between"><span className="text-gray-400 text-sm">Fecha</span><span className="font-semibold text-sm text-gray-900">{servicio?.fecha} {servicio?.hora?.slice(0,5)}</span></div>
          {cupos > 1 && <div className="flex justify-between"><span className="text-gray-400 text-sm">👥 Cupos</span><span className="font-semibold text-sm text-gray-900">{cupos} personas</span></div>}
          <div className="border-t border-gray-100 pt-2 flex justify-between">
            <span className="font-extrabold text-gray-900">💳 Total a pagar</span>
            <span className="font-extrabold text-lg" style={{color: MORADO}}>${totalCliente} MXN</span>
          </div>
        </div>
      </div>

      {servicio?.cupos > 1 && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-blue-700 text-xs font-semibold">👥 Cupos: {servicio.cupos_tomados || 0} de {servicio.cupos} ocupados. Quedan {servicio.cupos - (servicio.cupos_tomados || 0) - 1} después de este.</p>
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-extrabold text-gray-900 mb-4">💳 Datos de tu tarjeta</h3>
        <div className="p-4 border-2 border-gray-200 rounded-2xl focus-within:border-purple-300 transition bg-gray-50">
          <CardElement options={{ style: { base: { fontSize: '16px', color: '#0D0D1A', fontFamily: 'system-ui, sans-serif', '::placeholder': { color: '#94a3b8' } }, invalid: { color: '#ef4444' } }, hidePostalCode: true }}/>
        </div>
        <p className="text-xs text-gray-400 mt-2">🔒 Pago seguro procesado por Stripe</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm">{error}</div>}

      <div className="rounded-2xl p-4 border" style={{background: '#F5F0FF', borderColor: '#DDD6FE'}}>
        <p className="text-sm font-semibold" style={{color: MORADO}}>🔒 El pago quedará retenido por Fleksi hasta que confirmes que el trabajo quedó bien.</p>
      </div>

      <button onClick={handlePagar} disabled={procesando || !stripe}
        className="w-full py-4 text-white rounded-2xl font-extrabold text-lg hover:opacity-90 transition disabled:opacity-50" style={{background: MORADO}}>
        {procesando ? '⏳ Procesando...' : `🔒 Pagar $${totalCliente} MXN`}
      </button>
    </div>
  );
}

function PagoContent() {
  const searchParams = useSearchParams();
  const [servicio, setServicio] = useState<any>(null);
  const [aplicacion, setAplicacion] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [exito, setExito] = useState(false);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    const { data: perfil } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
    setUsuario(perfil);
    const aplicacionId = searchParams.get('aplicacion');
    if (!aplicacionId) { window.location.href = '/aplicaciones'; return; }
    const { data: app } = await supabase.from('aplicaciones').select('*, usuarios(id, nombre, email, foto_url)').eq('id', aplicacionId).single();
    if (!app) { window.location.href = '/aplicaciones'; return; }
    setAplicacion(app);
    const { data: svc } = await supabase.from('servicios').select('*').eq('id', app.servicio_id).single();
    setServicio(svc);
    setCargando(false);
  };

  if (cargando) return (
    <main className="min-h-screen flex items-center justify-center" style={{background: '#F8FAFC'}}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{borderColor: MORADO, borderTopColor: 'transparent'}}/>
        <p className="text-gray-400">Cargando...</p>
      </div>
    </main>
  );

  if (exito) return (
    <main className="min-h-screen flex items-center justify-center p-6" style={{background: '#F8FAFC'}}>
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{background: MORADO}}>
          <span className="text-4xl">🎉</span>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">¡Pago realizado!</h1>
        <p className="text-gray-400 mb-8">El pago está retenido de forma segura. Se liberará cuando confirmes el trabajo.</p>
        <a href="/aplicaciones" className="block w-full py-4 text-white rounded-2xl font-bold text-lg hover:opacity-90 transition mb-3" style={{background: MORADO}}>Ver mis solicitudes</a>
        <a href="/chat" className="block w-full py-4 border-2 border-gray-200 text-gray-700 rounded-2xl font-bold text-lg hover:border-purple-300 transition">💬 Chatear con el flekser</a>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen pb-10" style={{background: '#F8FAFC'}}>
      <div className="bg-white px-6 pt-12 pb-4 shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <a href="/aplicaciones" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">←</a>
          <h1 className="font-extrabold text-gray-900 text-lg">Confirmar pago</h1>
        </div>
      </div>
      <div className="max-w-md mx-auto px-6 py-4">
        <Elements stripe={stripePromise}>
          <PagoForm aplicacionId={searchParams.get('aplicacion')} servicio={servicio} aplicacion={aplicacion} usuario={usuario} onExito={() => setExito(true)}/>
        </Elements>
      </div>
    </main>
  );
}

export default function Pago() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center" style={{background: '#F8FAFC'}}>
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{borderColor: MORADO, borderTopColor: 'transparent'}}/>
      </main>
    }>
      <PagoContent />
    </Suspense>
  );
}