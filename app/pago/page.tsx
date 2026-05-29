'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '@/lib/supabase';
import { calcularPagoCliente, calcularPagoFlekser } from '@/lib/comisiones';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function PagoForm({ aplicacionId, servicio, aplicacion, usuario, onExito }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

  const precio = aplicacion?.precio_ofrecido || servicio?.presupuesto || 0;
  const cupos = servicio?.cupos || 1;
  const desglose = calcularPagoCliente(precio, servicio?.seguro);
  const desgloseFlekser = calcularPagoFlekser(precio);

  const totalSeguro = servicio?.seguro ? 45 * cupos : 0;
  const totalCliente = desglose.total - (servicio?.seguro ? 45 : 0) + totalSeguro;

  const handlePagar = async () => {
    if (!stripe || !elements) return;
    setProcesando(true);
    setError('');

    try {
      const response = await fetch('/api/crear-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto: totalCliente,
          descripcion: servicio.titulo,
          servicioId: servicio.id,
          clienteEmail: usuario?.email || '',
        }),
      });

      const { clientSecret, paymentIntentId, error: apiError } = await response.json();
      if (apiError) throw new Error(apiError);

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('No se encontró el elemento de tarjeta');

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: usuario?.nombre || 'Cliente',
            email: usuario?.email || '',
          },
        },
      });

      if (stripeError) throw new Error(stripeError.message);
      if (paymentIntent?.status !== 'requires_capture' && paymentIntent?.status !== 'succeeded') {
        throw new Error('Pago no completado');
      }

      await supabase.from('aplicaciones').update({
        estado: 'aceptado',
        payment_intent_id: paymentIntentId,
        pago_retenido: true,
        monto_cliente: totalCliente,
        monto_flekser: desgloseFlekser.total,
      }).eq('id', aplicacionId);

      const nuevosCuposTomados = (servicio.cupos_tomados || 0) + 1;
      const cuposLlenos = nuevosCuposTomados >= (servicio.cupos || 1);

      await supabase.from('servicios').update({
        cupos_tomados: nuevosCuposTomados,
        pago_retenido: true,
        estado: cuposLlenos ? 'en_proceso' : 'activo',
      }).eq('id', servicio.id);

      if (cuposLlenos) {
        await supabase.from('aplicaciones')
          .update({ estado: 'rechazado' })
          .eq('servicio_id', servicio.id)
          .eq('estado', 'pendiente')
          .neq('id', aplicacionId);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: existente } = await supabase.from('mensajes').select('id').eq('servicio_id', servicio.id).eq('destinatario_id', aplicacion.prestador_id).limit(1);
        if (!existente || existente.length === 0) {
          await supabase.from('mensajes').insert({
            servicio_id: servicio.id,
            remitente_id: user.id,
            destinatario_id: aplicacion.prestador_id,
            contenido: `¡Hola! Acepté tu propuesta para: ${servicio.titulo}. ¡Nos vemos el ${servicio.fecha}!`,
          });
        }
      }

      try {
        await fetch('/api/enviar-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: 'aplicacion_aceptada',
            destinatario: aplicacion?.usuarios?.email || 'fernando.najera.nm@gmail.com',
            datos: {
              prestador: aplicacion?.usuarios?.nombre || 'Flekser',
              prestador_id: aplicacion?.prestador_id,
              cliente: usuario?.nombre || 'Cliente',
              cliente_id: usuario?.id,
              trabajo: servicio.titulo,
              precio,
              fecha: servicio.fecha,
            },
          }),
        });
      } catch (e) {}

      onExito();
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">

      {/* Resumen del servicio */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-extrabold text-gray-900 mb-3">📋 Resumen</h3>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Servicio</span>
            <span className="font-semibold text-sm text-gray-900">{servicio?.titulo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Flekser</span>
            <span className="font-semibold text-sm text-gray-900">{aplicacion?.usuarios?.nombre}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Fecha</span>
            <span className="font-semibold text-sm text-gray-900">{servicio?.fecha} {servicio?.hora?.slice(0,5)}</span>
          </div>
          {servicio?.seguro && (
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">🛡️ Fleksi Protege</span>
              <span className="font-semibold text-sm text-gray-900">
                ${totalSeguro} MXN {cupos > 1 ? `(${cupos} × $45)` : ''}
              </span>
            </div>
          )}
          {cupos > 1 && (
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">👥 Cupos</span>
              <span className="font-semibold text-sm text-gray-900">{cupos} personas</span>
            </div>
          )}
          <div className="border-t border-gray-100 pt-2 flex justify-between">
            <span className="font-extrabold text-gray-900">Total a pagar</span>
            <span className="font-extrabold text-purple-600 text-lg">${totalCliente} MXN</span>
          </div>
        </div>
      </div>

      {/* Lo que recibirá el flekser */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-4">
        <p className="text-green-700 text-xs font-semibold mb-1">💰 El flekser recibirá</p>
        <p className="text-green-800 font-extrabold text-xl">${desgloseFlekser.total} MXN</p>
        <p className="text-green-600 text-xs mt-0.5">Pago garantizado al completar el trabajo</p>
      </div>

      {/* Info de cupos si aplica */}
      {servicio?.cupos > 1 && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-blue-700 text-xs font-semibold">
            👥 Cupos: {servicio.cupos_tomados || 0} de {servicio.cupos} ocupados.
            Quedan {servicio.cupos - (servicio.cupos_tomados || 0) - 1} después de este.
          </p>
        </div>
      )}

      {/* Tarjeta */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-extrabold text-gray-900 mb-4">💳 Datos de tu tarjeta</h3>
        <div className="p-4 border-2 border-gray-200 rounded-2xl focus-within:border-purple-400 transition">
          <CardElement options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#0D0D1A',
                fontFamily: 'system-ui, sans-serif',
                '::placeholder': { color: '#94a3b8' },
              },
              invalid: { color: '#ef4444' },
            },
            hidePostalCode: true,
          }}/>
        </div>
        <p className="text-xs text-gray-400 mt-2">🔒 Pago seguro procesado por Stripe</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm">{error}</div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <p className="text-blue-700 text-xs font-semibold">
          🔒 El pago quedará retenido por Fleksi hasta que confirmes que el trabajo quedó bien.
        </p>
      </div>

      <button onClick={handlePagar} disabled={procesando || !stripe}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-extrabold text-lg shadow-lg hover:opacity-90 transition disabled:opacity-50">
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

  if (exito) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🎉</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">¡Pago realizado!</h1>
          <p className="text-gray-400 mb-8 font-light">
            El pago está retenido de forma segura. Se liberará cuando confirmes el trabajo.
          </p>
          <a href="/aplicaciones" className="block w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:opacity-90 transition mb-3">
            Ver mis solicitudes
          </a>
          <a href="/chat" className="block w-full py-4 border-2 border-gray-200 text-gray-700 rounded-2xl font-bold text-lg hover:border-purple-400 transition">
            💬 Chatear con el flekser
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white px-6 pt-12 pb-4 shadow-sm">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <a href="/aplicaciones" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">←</a>
          <h1 className="font-extrabold text-gray-900 text-lg">Confirmar pago</h1>
        </div>
      </div>
      <div className="max-w-md mx-auto px-6 py-4">
        <Elements stripe={stripePromise}>
          <PagoForm
            aplicacionId={searchParams.get('aplicacion')}
            servicio={servicio}
            aplicacion={aplicacion}
            usuario={usuario}
            onExito={() => setExito(true)}
          />
        </Elements>
      </div>
    </main>
  );
}

export default function Pago() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </main>
    }>
      <PagoContent />
    </Suspense>
  );
}