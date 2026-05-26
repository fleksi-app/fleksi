'use client';
import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '@/lib/supabase';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const montosSugeridos = [50, 100, 200, 500];

function RecargarForm({ usuario, onExito }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [monto, setMonto] = useState(100);
  const [montoCustom, setMontoCustom] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

  const montoFinal = montoCustom ? Number(montoCustom) : monto;

  const handleRecargar = async () => {
    if (!stripe || !elements || montoFinal < 50) {
      setError('El monto mínimo es $50 MXN');
      return;
    }
    setProcesando(true);
    setError('');

    try {
      const response = await fetch('/api/crear-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto: montoFinal,
          descripcion: 'Recarga Fleksi Wallet',
          servicioId: 'wallet',
          clienteEmail: usuario?.email || '',
        }),
      });

      const { clientSecret, error: apiError } = await response.json();
      if (apiError) throw new Error(apiError);

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Error con la tarjeta');

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: usuario?.nombre || 'Usuario',
            email: usuario?.email || '',
          },
        },
      });

      if (stripeError) throw new Error(stripeError.message);
      if (paymentIntent?.status !== 'succeeded' && paymentIntent?.status !== 'requires_capture') {
        throw new Error('Pago no completado');
      }

      // Acreditar al wallet
      const nuevoSaldo = (usuario?.wallet_saldo || 0) + montoFinal;
      await supabase.from('usuarios')
        .update({ wallet_saldo: nuevoSaldo })
        .eq('id', usuario.id);

      // Registrar movimiento
      await supabase.from('wallet_movimientos').insert({
        usuario_id: usuario.id,
        tipo: 'recarga',
        monto: montoFinal,
        descripcion: `Recarga de $${montoFinal} MXN con tarjeta`,
      });

      onExito(montoFinal);
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">

      {/* Montos sugeridos */}
      <div>
        <label className="text-sm font-extrabold text-gray-900 mb-3 block">Elige un monto</label>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {montosSugeridos.map((m) => (
            <button key={m}
              onClick={() => { setMonto(m); setMontoCustom(''); }}
              className={`py-3 rounded-2xl font-extrabold text-sm transition border-2 ${
                monto === m && !montoCustom
                  ? 'border-teal-500 bg-teal-50 text-teal-700'
                  : 'border-gray-200 text-gray-600 hover:border-teal-300'
              }`}>
              ${m}
            </button>
          ))}
        </div>
        <input type="number" placeholder="Otro monto (mín. $50)"
          value={montoCustom} onChange={(e) => setMontoCustom(e.target.value)}
          min={50}
          className="w-full p-3 rounded-2xl border-2 border-gray-200 focus:border-teal-400 outline-none text-gray-900 text-sm"/>
      </div>

      {/* Resumen */}
      <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100">
        <div className="flex justify-between items-center">
          <span className="text-teal-700 font-semibold text-sm">Recarga al wallet</span>
          <span className="text-teal-700 font-extrabold text-lg">${montoFinal} MXN</span>
        </div>
        {montoFinal >= 50 && (
          <p className="text-teal-600 text-xs mt-1">
            ✅ Habilitará pagos en efectivo
          </p>
        )}
      </div>

      {/* Tarjeta */}
      <div>
        <label className="text-sm font-extrabold text-gray-900 mb-2 block">💳 Datos de tu tarjeta</label>
        <div className="p-4 border-2 border-gray-200 rounded-2xl focus-within:border-teal-400 transition">
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
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm">
          {error}
        </div>
      )}

      <button onClick={handleRecargar} disabled={procesando || !stripe || montoFinal < 50}
        className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-2xl font-extrabold text-lg shadow-lg hover:opacity-90 transition disabled:opacity-50">
        {procesando ? '⏳ Procesando...' : `💳 Recargar $${montoFinal} MXN`}
      </button>
    </div>
  );
}

export default function RecargarWallet() {
  const [usuario, setUsuario] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [exito, setExito] = useState(0);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    const { data } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
    setUsuario({ ...data, id: user.id });
    setCargando(false);
  };

  if (cargando) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"/>
      </main>
    );
  }

  if (exito > 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">💳</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">¡Recarga exitosa!</h1>
          <p className="text-gray-400 mb-2 font-light">Se acreditaron</p>
          <p className="text-4xl font-extrabold text-teal-600 mb-6">${exito} MXN</p>
          <p className="text-gray-400 text-sm mb-8">Ya puedes usar pagos en efectivo en tus trabajos.</p>
          <a href="/wallet" className="block w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:opacity-90 transition mb-3">
            Ver mi wallet
          </a>
          <a href="/home" className="block w-full py-4 border-2 border-gray-200 text-gray-700 rounded-2xl font-bold text-lg hover:border-teal-400 transition">
            Volver al inicio
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-gradient-to-br from-teal-500 to-cyan-600 px-6 pt-12 pb-6">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <a href="/wallet" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white">←</a>
          <div>
            <h1 className="font-extrabold text-white text-xl">Recargar Wallet</h1>
            <p className="text-white/70 text-xs">Saldo actual: ${(usuario?.wallet_saldo || 0).toFixed(2)} MXN</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-6">
        {/* Info wallet */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-xl">💳</div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Fleksi Wallet</p>
              <p className="text-xs text-gray-400">Mantén $50+ para usar pagos en efectivo</p>
            </div>
            <div className="ml-auto text-right">
              <p className="font-extrabold text-teal-600">${(usuario?.wallet_saldo || 0).toFixed(2)}</p>
              <p className="text-xs text-gray-400">Saldo</p>
            </div>
          </div>
        </div>

        <Elements stripe={stripePromise}>
          <RecargarForm usuario={usuario} onExito={(m: number) => setExito(m)} />
        </Elements>
      </div>
    </main>
  );
}