'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Nav from '@/lib/nav';

const MORADO = '#7B2FE0';

export default function MetodosPagoPage() {
  const [usuario, setUsuario] = useState<any>(null);
  const [tab, setTab] = useState<'pago' | 'cobro'>('pago');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  // Pago (clientes)
  const [nombreTarjeta, setNombreTarjeta] = useState('');
  const [numTarjeta, setNumTarjeta] = useState('');
  const [expiracion, setExpiracion] = useState('');
  const [cvv, setCvv] = useState('');

  // Cobro (Fleksers)
  const [clabe, setClabe] = useState('');
  const [banco, setBanco] = useState('');
  const [titular, setTitular] = useState('');

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    const { data } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
    setUsuario(data);
    // Cargar datos guardados
    if (data?.metodo_pago_datos) {
      const p = data.metodo_pago_datos;
      setNombreTarjeta(p.nombre || '');
      setNumTarjeta(p.ultimos4 ? '•••• •••• •••• ' + p.ultimos4 : '');
      setExpiracion(p.expiracion || '');
    }
    if (data?.metodo_cobro_datos) {
      const c = data.metodo_cobro_datos;
      setClabe(c.clabe || '');
      setBanco(c.banco || '');
      setTitular(c.titular || '');
    }
    setCargando(false);
  };

  const guardarPago = async () => {
    if (!usuario || !nombreTarjeta.trim() || !numTarjeta.trim() || !expiracion.trim() || !cvv.trim()) return;
    setGuardando(true);
    try {
      const ultimos4 = numTarjeta.replace(/\s/g, '').slice(-4);
      await supabase.from('usuarios').update({
        metodo_pago_datos: { nombre: nombreTarjeta.trim(), ultimos4, expiracion: expiracion.trim() },
      }).eq('id', usuario.id);
      setCvv('');
      setNumTarjeta('•••• •••• •••• ' + ultimos4);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    } finally { setGuardando(false); }
  };

  const guardarCobro = async () => {
    if (!usuario || !clabe.trim() || clabe.replace(/\s/g, '').length !== 18) return;
    setGuardando(true);
    try {
      await supabase.from('usuarios').update({
        metodo_cobro_datos: { clabe: clabe.trim(), banco: banco.trim(), titular: titular.trim() },
      }).eq('id', usuario.id);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    } finally { setGuardando(false); }
  };

  const formatClabe = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 18);
    return nums.match(/.{1,6}/g)?.join(' ') || nums;
  };

  const formatCard = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 16);
    return nums.match(/.{1,4}/g)?.join(' ') || nums;
  };

  if (cargando) return (
    <main className="min-h-screen flex items-center justify-center" style={{background: '#F8FAFC'}}>
      <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{borderColor: MORADO, borderTopColor: 'transparent'}}/>
    </main>
  );

  return (
    <main className="min-h-screen pb-32" style={{background: '#F8FAFC'}}>
      <div className="bg-white px-5 pt-12 pb-4 shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button onClick={() => window.history.back()} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">←</button>
          <h1 className="font-extrabold text-gray-900 text-lg">Métodos de pago y cobro</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 py-5">
        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-5">
          <button onClick={() => setTab('pago')} className="flex-1 py-2.5 rounded-xl font-bold text-sm transition"
            style={{background: tab === 'pago' ? MORADO : 'transparent', color: tab === 'pago' ? 'white' : '#6B7280'}}>
            💳 Pago
          </button>
          <button onClick={() => setTab('cobro')} className="flex-1 py-2.5 rounded-xl font-bold text-sm transition"
            style={{background: tab === 'cobro' ? MORADO : 'transparent', color: tab === 'cobro' ? 'white' : '#6B7280'}}>
            💰 Cobro
          </button>
        </div>

        {guardado && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-3 mb-4 text-center">
            <p className="text-green-700 font-bold text-sm">✅ Datos guardados correctamente</p>
          </div>
        )}

        {tab === 'pago' && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-extrabold text-gray-900 mb-1">Tarjeta de pago</h2>
            <p className="text-gray-400 text-xs mb-4">Para pagar servicios en Fleksi</p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Nombre en la tarjeta</label>
                <input type="text" value={nombreTarjeta} onChange={e => setNombreTarjeta(e.target.value)} placeholder="FERNANDO NAJERA"
                  className="w-full p-3.5 rounded-xl border-2 border-gray-100 focus:border-purple-300 outline-none text-gray-900 text-sm bg-gray-50 uppercase"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Número de tarjeta</label>
                <input type="text" value={numTarjeta} onChange={e => setNumTarjeta(formatCard(e.target.value))}
                  placeholder="1234 5678 9012 3456" maxLength={19}
                  className="w-full p-3.5 rounded-xl border-2 border-gray-100 focus:border-purple-300 outline-none text-gray-900 text-sm bg-gray-50 font-mono"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Vencimiento</label>
                  <input type="text" value={expiracion} onChange={e => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setExpiracion(v.length > 2 ? v.slice(0,2) + '/' + v.slice(2) : v);
                  }} placeholder="MM/AA" maxLength={5}
                    className="w-full p-3.5 rounded-xl border-2 border-gray-100 focus:border-purple-300 outline-none text-gray-900 text-sm bg-gray-50 font-mono"/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">CVV</label>
                  <input type="password" value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="•••" maxLength={4}
                    className="w-full p-3.5 rounded-xl border-2 border-gray-100 focus:border-purple-300 outline-none text-gray-900 text-sm bg-gray-50 font-mono"/>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <p className="text-blue-700 text-xs font-semibold">🔒 Al pagar solo se te pedirá el CVV. Tus datos están encriptados y seguros.</p>
              </div>
              <button onClick={guardarPago} disabled={guardando || !nombreTarjeta.trim() || !numTarjeta.trim() || !expiracion.trim() || !cvv.trim()}
                className="w-full py-4 text-white rounded-2xl font-bold text-sm disabled:opacity-50 transition" style={{background: MORADO}}>
                {guardando ? 'Guardando...' : '💾 Guardar tarjeta'}
              </button>
            </div>
          </div>
        )}

        {tab === 'cobro' && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-extrabold text-gray-900 mb-1">Cuenta de cobro</h2>
            <p className="text-gray-400 text-xs mb-4">Para recibir tus pagos como Flekser</p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">CLABE interbancaria (18 dígitos)</label>
                <input type="text" value={clabe} onChange={e => setClabe(formatClabe(e.target.value))}
                  placeholder="000000 000000 000000" maxLength={20}
                  className="w-full p-3.5 rounded-xl border-2 border-gray-100 focus:border-purple-300 outline-none text-gray-900 text-sm bg-gray-50 font-mono"/>
                {clabe && clabe.replace(/\s/g, '').length !== 18 && (
                  <p className="text-red-500 text-xs mt-1">La CLABE debe tener exactamente 18 dígitos</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Banco</label>
                <input type="text" value={banco} onChange={e => setBanco(e.target.value)} placeholder="BBVA, Banorte, HSBC..."
                  className="w-full p-3.5 rounded-xl border-2 border-gray-100 focus:border-purple-300 outline-none text-gray-900 text-sm bg-gray-50"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Titular de la cuenta</label>
                <input type="text" value={titular} onChange={e => setTitular(e.target.value)} placeholder="Nombre completo del titular"
                  className="w-full p-3.5 rounded-xl border-2 border-gray-100 focus:border-purple-300 outline-none text-gray-900 text-sm bg-gray-50"/>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                <p className="text-green-700 text-xs font-semibold">💰 Los pagos se transfieren a esta CLABE dentro de 1–2 días hábiles tras confirmar el trabajo.</p>
              </div>
              <button onClick={guardarCobro} disabled={guardando || !clabe.trim() || clabe.replace(/\s/g, '').length !== 18}
                className="w-full py-4 text-white rounded-2xl font-bold text-sm disabled:opacity-50 transition" style={{background: MORADO}}>
                {guardando ? 'Guardando...' : '💾 Guardar cuenta'}
              </button>
            </div>
          </div>
        )}
      </div>

      <Nav activo="" />
    </main>
  );
}