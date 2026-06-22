'use client';
import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '@/lib/supabase';

const MORADO = '#7B2FE0';
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
    if (!stripe || !elements || montoFinal < 50) { setError('El monto mínimo es $50 MXN'); return; }
    setProcesando(true); setError('');
    try {
      const response = await fetch('/api/crear-pago', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ monto: montoFinal, descripcion: 'Recarga Fleksi Wallet', servicioId: 'wallet', clienteEmail: usuario?.email || '' }) });
      const { clientSecret, error: apiError } = await response.json();
      if (apiError) throw new Error(apiError);
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Error con la tarjeta');
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, { payment_method: { card: cardElement, billing_details: { name: usuario?.nombre || 'Usuario', email: usuario?.email || '' } } });
      if (stripeError) throw new Error(stripeError.message);
      if (paymentIntent?.status !== 'succeeded' && paymentIntent?.status !== 'requires_capture') throw new Error('Pago no completado');
      const nuevoSaldo = (usuario?.wallet_saldo || 0) + montoFinal;
      await supabase.from('usuarios').update({ wallet_saldo: nuevoSaldo }).eq('id', usuario.id);
      await supabase.from('wallet_movimientos').insert({ usuario_id: usuario.id, tipo: 'recarga', monto: montoFinal, descripcion: `Recarga de $${montoFinal} MXN con tarjeta` });
      onExito(montoFinal);
    } catch (err: any) { setError(err.message || 'Error al procesar el pago'); }
    finally { setProcesando(false); }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-extrabold text-gray-900 mb-3 block">Elige un monto</label>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {montosSugeridos.map(m => (
            <button key={m} onClick={() => { setMonto(m); setMontoCustom(''); }}
              className="py-3 rounded-2xl font-extrabold text-sm transition border-2"
              style={{borderColor: monto === m && !montoCustom ? MORADO : '#E5E7EB', background: monto === m && !montoCustom ? '#F5F0FF' : 'white', color: monto === m && !montoCustom ? MORADO : '#6B7280'}}>
              ${m}
            </button>
          ))}
        </div>
        <input type="number" placeholder="Otro monto (mín. $50)" value={montoCustom} onChange={e => setMontoCustom(e.target.value)} min={50}
          className="w-full p-3 rounded-2xl border-2 border-gray-200 focus:border-purple-300 outline-none text-gray-900 text-sm bg-gray-50"/>
      </div>

      <div className="rounded-2xl p-4 border" style={{background: '#F5F0FF', borderColor: '#DDD6FE'}}>
        <div className="flex justify-between items-center">
          <span className="font-semibold text-sm" style={{color: MORADO}}>Recarga al wallet</span>
          <span className="font-extrabold text-lg" style={{color: MORADO}}>${montoFinal} MXN</span>
        </div>
        {montoFinal >= 50 && <p className="text-xs mt-1" style={{color: MORADO}}>✅ Habilitará pagos en efectivo</p>}
      </div>

      <div>
        <label className="text-sm font-extrabold text-gray-900 mb-2 block">💳 Datos de tu tarjeta</label>
        <div className="p-4 border-2 border-gray-200 rounded-2xl focus-within:border-purple-300 transition bg-gray-50">
          <CardElement options={{ style: { base: { fontSize: '16px', color: '#0D0D1A', fontFamily: 'system-ui, sans-serif', '::placeholder': { color: '#94a3b8' } }, invalid: { color: '#ef4444' } }, hidePostalCode: true }}/>
        </div>
        <p className="text-xs text-gray-400 mt-2">🔒 Pago seguro procesado por Stripe</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm">{error}</div>}

      <button onClick={handleRecargar} disabled={procesando || !stripe || montoFinal < 50}
        className="w-full py-4 text-white rounded-2xl font-extrabold text-lg hover:opacity-90 transition disabled:opacity-50" style={{background: MORADO}}>
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

  if (cargando) return (
    <main className="min-h-screen flex items-center justify-center" style={{background: '#F8FAFC'}}>
      <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{borderColor: MORADO, borderTopColor: 'transparent'}}/>
    </main>
  );

  if (exito > 0) return (
    <main className="min-h-screen flex items-center justify-center p-6" style={{background: '#F8FAFC'}}>
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{background: MORADO}}>
          <span className="text-4xl">💳</span>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">¡Recarga exitosa!</h1>
        <p className="text-gray-400 mb-2">Se acreditaron</p>
        <p className="text-4xl font-extrabold mb-6" style={{color: MORADO}}>${exito} MXN</p>
        <p className="text-gray-400 text-sm mb-8">Ya puedes usar pagos en efectivo en tus trabajos.</p>
        <a href="/wallet" className="block w-full py-4 text-white rounded-2xl font-bold text-lg hover:opacity-90 transition mb-3" style={{background: MORADO}}>Ver mi wallet</a>
        <a href="/home" className="block w-full py-4 border-2 border-gray-200 text-gray-700 rounded-2xl font-bold text-lg hover:border-purple-300 transition">Volver al inicio</a>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen pb-10" style={{background: '#F8FAFC'}}>
      <div className="bg-white px-6 pt-12 pb-4 shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <a href="/wallet" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">←</a>
          <div>
            <h1 className="font-extrabold text-gray-900 text-xl">Recargar Wallet</h1>
            <p className="text-gray-400 text-xs">Saldo actual: ${(usuario?.wallet_saldo || 0).toFixed(2)} MXN</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{background: '#F5F0FF'}}>💳</div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Fleksi Wallet</p>
              <p className="text-xs text-gray-400">Mantén $50+ para usar pagos en efectivo</p>
            </div>
            <div className="ml-auto text-right">
              <p className="font-extrabold" style={{color: MORADO}}>${(usuario?.wallet_saldo || 0).toFixed(2)}</p>
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