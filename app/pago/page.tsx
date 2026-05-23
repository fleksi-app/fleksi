'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabase';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function PagoContent() {
  const searchParams = useSearchParams();
  const [cargando, setCargando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [servicio, setServicio] = useState<any>(null);
  const [aplicacion, setAplicacion] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    setCargando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }

    const { data: perfil } = await supabase
      .from('usuarios').select('*').eq('id', user.id).single();
    setUsuario(perfil);

    const servicioId = searchParams.get('id');

    let svc = null;

    if (servicioId) {
      const { data } = await supabase
        .from('servicios')
        .select('*, aplicaciones(*, usuarios(nombre, email))')
        .eq('id', servicioId)
        .single();
      svc = data;
    } else {
      const { data } = await supabase
        .from('servicios')
        .select('*, aplicaciones(*, usuarios(nombre, email))')
        .eq('cliente_id', user.id)
        .eq('estado', 'completado')
        .order('created_at', { ascending: false })
        .limit(1);
      svc = data?.[0] || null;
    }

    if (svc) {
      setServicio(svc);
      const appAceptada = svc.aplicaciones?.find(
        (a: any) => a.estado === 'completado' || a.estado === 'aceptado'
      );
      setAplicacion(appAceptada);
    }
    setCargando(false);
  };

  const handlePago = async () => {
    if (!servicio || !usuario) return;
    setProcesando(true);
    setError('');

    try {
      const seguro = servicio.seguro ? 45 : 0;
      const total = servicio.presupuesto + seguro;

      const response = await fetch('/api/crear-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto: total,
          descripcion: servicio.titulo,
          servicioId: servicio.id,
          clienteEmail: usuario.email || '',
        }),
      });

      const { clientSecret, error: apiError } = await response.json();
      if (apiError) throw new Error(apiError);

      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe no disponible');

      const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: { token: 'tok_visa' },
        },
      });

      if (stripeError) throw new Error(stripeError.message);

      await supabase.from('servicios')
        .update({ estado: 'pagado' })
        .eq('id', servicio.id);

      // Email de pago completado
      try {
        await fetch('/api/enviar-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: 'pago_completado',
            destinatario: aplicacion?.usuarios?.email || usuario.email,
            datos: {
              nombre: aplicacion?.usuarios?.nombre || 'Prestador',
              trabajo: servicio.titulo,
              presupuesto: servicio.presupuesto,
              monto: total,
            },
          }),
        });
      } catch (e) {}

      setExito(true);
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago');
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

  if (exito) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">💰</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">¡Pago completado!</h1>
          <p className="text-gray-400 mb-8 font-light">
            El pago fue procesado exitosamente. El trabajador recibirá su pago pronto.
          </p>
          <div className="bg-white rounded-2xl p-4 mb-6 text-left border border-gray-100">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400 text-sm">Servicio</span>
              <span className="font-semibold text-sm text-gray-900">{servicio?.titulo}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400 text-sm">Trabajador</span>
              <span className="font-semibold text-sm text-gray-900">{aplicacion?.usuarios?.nombre || 'Prestador'}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400 text-sm">Subtotal</span>
              <span className="font-semibold text-sm">${servicio?.presupuesto} MXN</span>
            </div>
            {servicio?.seguro && (
              <div className="flex justify-between mb-2">
                <span className="text-gray-400 text-sm">Fleksi Protege</span>
                <span className="font-semibold text-sm">$45 MXN</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-2 flex justify-between">
              <span className="font-extrabold text-gray-900">Total pagado</span>
              <span className="font-extrabold text-purple-600">
                ${(servicio?.presupuesto || 0) + (servicio?.seguro ? 45 : 0)} MXN
              </span>
            </div>
          </div>
          <a href="/calificar" className="block w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:opacity-90 transition mb-3">
            ⭐ Calificar al trabajador
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
          <p className="text-4xl mb-4">💳</p>
          <p className="font-bold text-gray-900 mb-2">No hay pagos pendientes</p>
          <p className="text-gray-400 text-sm mb-6">Los pagos aparecerán aquí cuando un servicio sea completado</p>
          <a href="/home" className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold">
            Volver al inicio
          </a>
        </div>
      </main>
    );
  }

  const total = (servicio?.presupuesto || 0) + (servicio?.seguro ? 45 : 0);
  const comision = Math.round(servicio?.presupuesto * 0.12);
  const pagoTrabajador = servicio?.presupuesto - comision;

  return (
    <main className="min-h-screen bg-gray-50 pb-32">

      <div className="bg-white px-6 pt-12 pb-4 shadow-sm">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <a href="/mis-trabajos" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
            ←
          </a>
          <h1 className="font-extrabold text-gray-900 text-lg">Confirmar pago</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-4">

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-extrabold text-gray-900 mb-3">📋 Resumen del servicio</h3>
          <p className="font-bold text-gray-900 mb-1">{servicio.titulo}</p>
          <p className="text-sm text-gray-400 mb-3">
            Trabajador: {aplicacion?.usuarios?.nombre || 'Trabajador'}
          </p>
          <div className="flex flex-col gap-2">
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
              <span className="font-extrabold text-gray-900">Total</span>
              <span className="font-extrabold text-purple-600 text-lg">${total} MXN</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-5 border border-purple-100 mb-4">
          <h3 className="font-extrabold text-gray-900 mb-3">💸 Desglose del pago</h3>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Pago al trabajador</span>
              <span className="font-semibold text-sm text-green-600">${pagoTrabajador} MXN</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Comisión Fleksi (12%)</span>
              <span className="font-semibold text-sm text-gray-600">${comision} MXN</span>
            </div>
            {servicio.seguro && (
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Fleksi Protege</span>
                <span className="font-semibold text-sm text-gray-600">$45 MXN</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-extrabold text-gray-900 mb-3">💳 Método de pago</h3>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border-2 border-purple-400">
            <span className="text-2xl">💳</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Tarjeta de prueba</p>
              <p className="text-xs text-gray-400">Visa •••• 4242 (modo test)</p>
            </div>
            <span className="ml-auto text-purple-600 text-xs font-bold">✓</span>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Modo de prueba — no se cobrarán cargos reales
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-4 text-sm">
            {error}
          </div>
        )}

      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-md mx-auto">
          <button onClick={handlePago} disabled={procesando}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-extrabold text-lg shadow-lg hover:opacity-90 transition disabled:opacity-50">
            {procesando ? 'Procesando pago...' : `💳 Pagar $${total} MXN`}
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">
            🔒 Pago seguro procesado por Stripe
          </p>
        </div>
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