'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Nav from '@/lib/nav';

const MORADO = '#7B2FE0';

const bancos = ['BBVA','Banamex','Santander','Banorte','HSBC','Scotiabank','Inbursa','Bajío','Afirme','BanBajío','Mifel','Multiva','Banca Mifel','BBASE','CIBanco','Consubanco','Inmobiliario Mexicano','Invex','Ixe','Monexcb','Nu Bank (Nu México)','Spin by OXXO','Stori','Mercado Pago','KLAR','Otro'];

const tipoEmoji: any = { recarga:'💳', pago:'💸', comision:'📊', retiro:'🏦', reembolso:'↩️', ganancia:'💰' };
const estadoRetiroColor: any = { pendiente:'bg-yellow-100 text-yellow-700', procesando:'bg-blue-100 text-blue-700', completado:'bg-green-100 text-green-700', rechazado:'bg-red-100 text-red-700' };
const estadoRetiroLabel: any = { pendiente:'⏳ Pendiente', procesando:'🔄 Procesando', completado:'✅ Completado', rechazado:'❌ Rechazado' };

export default function Wallet() {
  const [usuario, setUsuario] = useState<any>(null);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [retiros, setRetiros] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [tabActiva, setTabActiva] = useState<'saldo'|'metodos'>('saldo');
  const [mostrarRetiro, setMostrarRetiro] = useState(false);
  const [paso, setPaso] = useState<'datos'|'monto'|'confirmar'>('datos');
  const [clabe, setClabe] = useState('');
  const [banco, setBanco] = useState('');
  const [titular, setTitular] = useState('');
  const [guardarDatos, setGuardarDatos] = useState(true);
  const [monto, setMonto] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [exitoRetiro, setExitoRetiro] = useState(false);
  const [errorRetiro, setErrorRetiro] = useState('');

  // Métodos de pago
  const [tabMetodo, setTabMetodo] = useState<'cobro'|'pago'>('cobro');
  const [nombreTarjeta, setNombreTarjeta] = useState('');
  const [numTarjeta, setNumTarjeta] = useState('');
  const [expiracion, setExpiracion] = useState('');
  const [cvv, setCvv] = useState('');
  const [guardandoMetodo, setGuardandoMetodo] = useState(false);
  const [guardadoMetodo, setGuardadoMetodo] = useState('');
  // Cobro separado para la sección de métodos
  const [clabeMetodo, setClabeMetodo] = useState('');
  const [bancoMetodo, setBancoMetodo] = useState('');
  const [titularMetodo, setTitularMetodo] = useState('');

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    const { data: perfil } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
    setUsuario({ ...perfil, id: user.id });
    if (perfil?.clabe) { setClabe(perfil.clabe); setClabeMetodo(perfil.clabe); }
    if (perfil?.banco) { setBanco(perfil.banco); setBancoMetodo(perfil.banco); }
    if (perfil?.titular_cuenta) { setTitular(perfil.titular_cuenta); setTitularMetodo(perfil.titular_cuenta); }
    if (perfil?.metodo_pago_datos) {
      const p = perfil.metodo_pago_datos;
      setNombreTarjeta(p.nombre || '');
      setNumTarjeta(p.ultimos4 ? '•••• •••• •••• ' + p.ultimos4 : '');
      setExpiracion(p.expiracion || '');
    }
    const { data: movs } = await supabase.from('wallet_movimientos').select('*').eq('usuario_id', user.id).order('created_at', { ascending: false }).limit(50);
    setMovimientos(movs || []);
    const { data: retirosData } = await supabase.from('retiros').select('*').eq('usuario_id', user.id).order('created_at', { ascending: false }).limit(10);
    setRetiros(retirosData || []);
    setCargando(false);
  };

  const saldoDisponible = usuario?.wallet_saldo || 0;
  const montoNum = parseFloat(monto) || 0;
  const MINIMO_RETIRO = 50;
  const MAXIMO_RETIRO = 50000;
  const validarClabe = (c: string) => /^\d{18}$/.test(c.replace(/\s/g, ''));
  const tieneRetiroPendiente = retiros.some(r => r.estado === 'pendiente' || r.estado === 'procesando');

  const avanzarPaso = () => {
    setErrorRetiro('');
    if (paso === 'datos') {
      if (!clabe.trim()) { setErrorRetiro('Ingresa tu CLABE interbancaria'); return; }
      if (!validarClabe(clabe)) { setErrorRetiro('La CLABE debe tener exactamente 18 dígitos'); return; }
      if (!banco) { setErrorRetiro('Selecciona tu banco'); return; }
      if (!titular.trim()) { setErrorRetiro('Ingresa el nombre del titular'); return; }
      if (titular.trim().length < 5) { setErrorRetiro('El nombre del titular parece muy corto'); return; }
      setPaso('monto');
    } else if (paso === 'monto') {
      if (!monto || montoNum <= 0) { setErrorRetiro('Ingresa un monto válido'); return; }
      if (montoNum < MINIMO_RETIRO) { setErrorRetiro(`El monto mínimo es $${MINIMO_RETIRO} MXN`); return; }
      if (montoNum > MAXIMO_RETIRO) { setErrorRetiro(`El monto máximo es $${MAXIMO_RETIRO.toLocaleString()} MXN`); return; }
      if (montoNum > saldoDisponible) { setErrorRetiro('No tienes suficiente saldo'); return; }
      setPaso('confirmar');
    }
  };

  const solicitarRetiro = async () => {
    if (procesando) return;
    setProcesando(true); setErrorRetiro('');
    try {
      const clabeClean = clabe.replace(/\s/g, '');
      if (!validarClabe(clabeClean)) throw new Error('CLABE inválida');
      if (!banco || !titular.trim()) throw new Error('Datos bancarios incompletos');
      if (montoNum < MINIMO_RETIRO) throw new Error(`Monto mínimo: $${MINIMO_RETIRO} MXN`);
      if (montoNum > MAXIMO_RETIRO) throw new Error(`Monto máximo: $${MAXIMO_RETIRO.toLocaleString()} MXN`);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }
      const { data: perfilFresco, error: perfilError } = await supabase.from('usuarios').select('wallet_saldo').eq('id', user.id).single();
      if (perfilError || !perfilFresco) throw new Error('No se pudo verificar tu saldo');
      const saldoReal = perfilFresco.wallet_saldo || 0;
      if (saldoReal < MINIMO_RETIRO) throw new Error('Saldo insuficiente para retirar');
      if (montoNum > saldoReal) throw new Error(`Saldo insuficiente. Tu saldo real es $${saldoReal.toFixed(2)} MXN`);
      const { data: retirosPendientes } = await supabase.from('retiros').select('id').eq('usuario_id', user.id).in('estado', ['pendiente','procesando']).limit(1);
      if (retirosPendientes && retirosPendientes.length > 0) throw new Error('Ya tienes un retiro pendiente. Espera a que se complete antes de solicitar otro.');
      if (guardarDatos) await supabase.from('usuarios').update({ clabe: clabeClean, banco, titular_cuenta: titular }).eq('id', user.id);
      const { error: retiroError } = await supabase.from('retiros').insert({ usuario_id: user.id, monto: montoNum, clabe: clabeClean, banco, titular, estado: 'pendiente' });
      if (retiroError) throw retiroError;
      const nuevoSaldo = saldoReal - montoNum;
      const { error: saldoError } = await supabase.from('usuarios').update({ wallet_saldo: nuevoSaldo }).eq('id', user.id).eq('wallet_saldo', saldoReal);
      if (saldoError) { await supabase.from('retiros').delete().eq('usuario_id', user.id).eq('estado', 'pendiente').order('created_at', { ascending: false }).limit(1); throw new Error('El saldo cambió durante la operación. Intenta de nuevo.'); }
      await supabase.from('wallet_movimientos').insert({ usuario_id: user.id, tipo: 'retiro', monto: -montoNum, descripcion: `Retiro solicitado a ${banco} ****${clabeClean.slice(-4)}` });
      try { await supabase.from('notificaciones').insert({ usuario_id: user.id, tipo: 'retiro_solicitado', titulo: '🏦 Solicitud de retiro recibida', mensaje: `Tu solicitud de retiro por $${montoNum.toFixed(2)} MXN está siendo procesada.`, link: '/wallet' }); } catch (e) {}
      setExitoRetiro(true);
      await cargarDatos();
    } catch (err: any) { setErrorRetiro(err.message || 'Ocurrió un error. Intenta de nuevo.'); }
    finally { setProcesando(false); }
  };

  const cerrarRetiro = () => {
    if (procesando) return;
    setMostrarRetiro(false); setExitoRetiro(false); setPaso('datos'); setMonto(''); setErrorRetiro('');
  };

  const guardarCobro = async () => {
    if (!usuario || !clabeMetodo.trim() || clabeMetodo.replace(/\s/g, '').length !== 18) return;
    setGuardandoMetodo(true);
    try {
      const clabeClean = clabeMetodo.replace(/\s/g, '');
      await supabase.from('usuarios').update({ clabe: clabeClean, banco: bancoMetodo, titular_cuenta: titularMetodo }).eq('id', usuario.id);
      setClabe(clabeClean); setBanco(bancoMetodo); setTitular(titularMetodo);
      setGuardadoMetodo('cobro');
      setTimeout(() => setGuardadoMetodo(''), 2500);
    } finally { setGuardandoMetodo(false); }
  };

  const guardarPago = async () => {
    if (!usuario || !nombreTarjeta.trim() || !numTarjeta.trim() || !expiracion.trim() || !cvv.trim()) return;
    setGuardandoMetodo(true);
    try {
      const ultimos4 = numTarjeta.replace(/\s/g, '').slice(-4);
      await supabase.from('usuarios').update({ metodo_pago_datos: { nombre: nombreTarjeta.trim(), ultimos4, expiracion: expiracion.trim() } }).eq('id', usuario.id);
      setCvv(''); setNumTarjeta('•••• •••• •••• ' + ultimos4);
      setGuardadoMetodo('pago');
      setTimeout(() => setGuardadoMetodo(''), 2500);
    } finally { setGuardandoMetodo(false); }
  };

  const formatClabe = (val: string) => { const nums = val.replace(/\D/g, '').slice(0, 18); return nums.match(/.{1,6}/g)?.join(' ') || nums; };
  const formatCard = (val: string) => { const nums = val.replace(/\D/g, '').slice(0, 16); return nums.match(/.{1,4}/g)?.join(' ') || nums; };

  if (cargando) return (
    <main className="min-h-screen flex items-center justify-center" style={{background: '#F8FAFC'}}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{borderColor: MORADO, borderTopColor: 'transparent'}}/>
        <p className="text-gray-400">Cargando wallet...</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen pb-32" style={{background: '#F8FAFC'}}>
      <div className="bg-white px-6 pt-12 pb-4 shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto">
          <h1 className="font-extrabold text-gray-900 text-xl mb-1">Fleksi Wallet</h1>
          <p className="text-gray-400 text-sm">Saldo, movimientos y métodos de pago</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-6">
        <div className="max-w-md mx-auto flex gap-1 pt-2">
          <button onClick={() => setTabActiva('saldo')}
            className="flex-1 py-2.5 text-sm font-bold border-b-2 transition"
            style={{borderColor: tabActiva === 'saldo' ? MORADO : 'transparent', color: tabActiva === 'saldo' ? MORADO : '#9CA3AF'}}>
            💰 Saldo
          </button>
          <button onClick={() => setTabActiva('metodos')}
            className="flex-1 py-2.5 text-sm font-bold border-b-2 transition"
            style={{borderColor: tabActiva === 'metodos' ? MORADO : 'transparent', color: tabActiva === 'metodos' ? MORADO : '#9CA3AF'}}>
            💳 Métodos
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 pt-4">

        {/* ── TAB SALDO ── */}
        {tabActiva === 'saldo' && (
          <>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
              <div className="text-center mb-6">
                <p className="text-gray-400 text-sm mb-1">Saldo disponible</p>
                <p className="text-5xl font-extrabold" style={{color: MORADO}}>${saldoDisponible.toFixed(2)}</p>
                <p className="text-gray-400 text-sm mt-1">MXN</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <a href="/wallet/recargar" className="flex flex-col items-center gap-2 p-4 rounded-2xl border transition hover:opacity-90" style={{background: '#F5F0FF', borderColor: '#DDD6FE'}}>
                  <span className="text-2xl">💳</span>
                  <p className="font-bold text-sm" style={{color: MORADO}}>Recargar</p>
                </a>
                <button onClick={() => { if (tieneRetiroPendiente) { setErrorRetiro('Ya tienes un retiro pendiente.'); return; } setMostrarRetiro(true); }}
                  disabled={saldoDisponible < MINIMO_RETIRO}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border transition disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{background: saldoDisponible >= MINIMO_RETIRO ? '#EFF6FF' : '#F9FAFB', borderColor: saldoDisponible >= MINIMO_RETIRO ? '#BFDBFE' : '#E5E7EB'}}>
                  <span className="text-2xl">🏦</span>
                  <p className="font-bold text-blue-700 text-sm">Retirar</p>
                  {saldoDisponible < MINIMO_RETIRO && <p className="text-xs text-gray-400">Mín. $50</p>}
                </button>
              </div>
              {tieneRetiroPendiente && <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center"><p className="text-yellow-700 text-xs font-semibold">⏳ Tienes un retiro en proceso.</p></div>}
              {saldoDisponible > 0 && saldoDisponible < MINIMO_RETIRO && <p className="text-xs text-gray-400 text-center mt-3">Necesitas al menos $50 MXN para retirar. Te faltan ${(MINIMO_RETIRO - saldoDisponible).toFixed(2)} MXN.</p>}
              {errorRetiro && <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3"><p className="text-red-600 text-xs font-semibold">{errorRetiro}</p></div>}
            </div>

            <div className="rounded-2xl p-4 mb-4 border" style={{background: '#F5F0FF', borderColor: '#DDD6FE'}}>
              <p className="text-sm font-semibold mb-1" style={{color: MORADO}}>💡 ¿Cómo funcionan los retiros?</p>
              <p className="text-xs leading-relaxed" style={{color: '#6D28D9'}}>Solicita el retiro, ingresa tu CLABE y en 1-3 días hábiles recibirás el dinero en tu cuenta. Mínimo $50 MXN, máximo $50,000 MXN por retiro.</p>
            </div>

            {retiros.filter(r => r.estado === 'pendiente' || r.estado === 'procesando').length > 0 && (
              <div className="mb-4">
                <h3 className="font-extrabold text-gray-900 mb-3">⏳ Retiros en proceso</h3>
                <div className="flex flex-col gap-2">
                  {retiros.filter(r => r.estado === 'pendiente' || r.estado === 'procesando').map(r => (
                    <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-gray-900">${r.monto.toFixed(2)} MXN</p>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${estadoRetiroColor[r.estado]}`}>{estadoRetiroLabel[r.estado]}</span>
                      </div>
                      <p className="text-xs text-gray-500">{r.banco} — ****{r.clabe?.slice(-4)}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(r.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <h3 className="font-extrabold text-gray-900 mb-3">📋 Movimientos</h3>
              {movimientos.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                  <p className="text-3xl mb-3">💳</p>
                  <p className="font-bold text-gray-900 mb-1">Sin movimientos todavía</p>
                  <p className="text-gray-400 text-sm">Aquí verás tu historial de pagos y retiros</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {movimientos.map(mov => (
                    <div key={mov.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">{tipoEmoji[mov.tipo] || '💰'}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate">{mov.descripcion || mov.tipo}</p>
                          <p className="text-xs text-gray-400">{new Date(mov.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <p className={`font-extrabold text-sm flex-shrink-0 ${mov.monto > 0 ? 'text-green-600' : 'text-red-500'}`}>{mov.monto > 0 ? '+' : ''}${Math.abs(mov.monto).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── TAB MÉTODOS ── */}
        {tabActiva === 'metodos' && (
          <div>
            {guardadoMetodo && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-3 mb-4 text-center">
                <p className="text-green-700 font-bold text-sm">✅ Datos guardados correctamente</p>
              </div>
            )}

            {/* Sub-tabs cobro / pago */}
            <div className="flex bg-gray-100 rounded-2xl p-1 mb-5">
              <button onClick={() => setTabMetodo('cobro')} className="flex-1 py-2.5 rounded-xl font-bold text-sm transition"
                style={{background: tabMetodo === 'cobro' ? MORADO : 'transparent', color: tabMetodo === 'cobro' ? 'white' : '#6B7280'}}>
                💰 Cobro (CLABE)
              </button>
              <button onClick={() => setTabMetodo('pago')} className="flex-1 py-2.5 rounded-xl font-bold text-sm transition"
                style={{background: tabMetodo === 'pago' ? MORADO : 'transparent', color: tabMetodo === 'pago' ? 'white' : '#6B7280'}}>
                💳 Pago (tarjeta)
              </button>
            </div>

            {tabMetodo === 'cobro' && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h2 className="font-extrabold text-gray-900 mb-1">Cuenta de cobro</h2>
                <p className="text-gray-400 text-xs mb-4">Para recibir tus pagos como Flekser vía SPEI</p>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">CLABE interbancaria (18 dígitos)</label>
                    <input type="text" value={clabeMetodo} onChange={e => setClabeMetodo(formatClabe(e.target.value))}
                      placeholder="000000 000000 000000" maxLength={20}
                      className="w-full p-3.5 rounded-xl border-2 border-gray-100 focus:border-purple-300 outline-none text-gray-900 text-sm bg-gray-50 font-mono"/>
                    {clabeMetodo && clabeMetodo.replace(/\s/g, '').length !== 18 && (
                      <p className="text-red-500 text-xs mt-1">La CLABE debe tener exactamente 18 dígitos</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Banco</label>
                    <select value={bancoMetodo} onChange={e => setBancoMetodo(e.target.value)}
                      className="w-full p-3.5 rounded-xl border-2 border-gray-100 focus:border-purple-300 outline-none text-gray-900 bg-white text-sm">
                      <option value="">Selecciona tu banco</option>
                      {bancos.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Titular de la cuenta</label>
                    <input type="text" value={titularMetodo} onChange={e => setTitularMetodo(e.target.value)}
                      placeholder="Nombre completo del titular"
                      className="w-full p-3.5 rounded-xl border-2 border-gray-100 focus:border-purple-300 outline-none text-gray-900 text-sm bg-gray-50"/>
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                    <p className="text-green-700 text-xs font-semibold">💰 Los pagos se transfieren a esta CLABE dentro de 1–2 días hábiles tras confirmar el trabajo.</p>
                  </div>
                  <button onClick={guardarCobro} disabled={guardandoMetodo || !clabeMetodo.trim() || clabeMetodo.replace(/\s/g, '').length !== 18}
                    className="w-full py-4 text-white rounded-2xl font-bold text-sm disabled:opacity-50 transition" style={{background: MORADO}}>
                    {guardandoMetodo ? 'Guardando...' : '💾 Guardar cuenta'}
                  </button>
                </div>
              </div>
            )}

            {tabMetodo === 'pago' && (
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
                  <button onClick={guardarPago} disabled={guardandoMetodo || !nombreTarjeta.trim() || !numTarjeta.trim() || !expiracion.trim() || !cvv.trim()}
                    className="w-full py-4 text-white rounded-2xl font-bold text-sm disabled:opacity-50 transition" style={{background: MORADO}}>
                    {guardandoMetodo ? 'Guardando...' : '💾 Guardar tarjeta'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal retiro */}
      {mostrarRetiro && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={cerrarRetiro}>
          <div className="w-full bg-white rounded-t-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="font-extrabold text-gray-900 text-lg">{exitoRetiro ? '¡Retiro solicitado!' : paso === 'datos' ? 'Datos bancarios' : paso === 'monto' ? '¿Cuánto retirar?' : 'Confirmar retiro'}</h3>
                {!exitoRetiro && (
                  <div className="flex items-center gap-1 mt-1">
                    {['datos','monto','confirmar'].map((p, i) => (
                      <div key={p} className="h-1.5 rounded-full transition-all" style={{width: paso === p ? '2rem' : '1rem', background: ['datos','monto','confirmar'].indexOf(paso) >= i ? MORADO : '#E5E7EB'}}/>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={cerrarRetiro} disabled={procesando} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 disabled:opacity-50">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4">
              {exitoRetiro && (
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">🏦</div>
                  <h4 className="font-extrabold text-gray-900 text-xl mb-2">¡Solicitud enviada!</h4>
                  <p className="text-gray-500 text-sm mb-2">Tu retiro de <span className="font-bold text-gray-900">${montoNum.toFixed(2)} MXN</span> está siendo procesado.</p>
                  <p className="text-gray-400 text-xs mb-6">Recibirás el dinero en tu cuenta <span className="font-semibold">{banco}</span> terminada en <span className="font-semibold">****{clabe.replace(/\s/g,'').slice(-4)}</span> en 1-3 días hábiles.</p>
                  <button onClick={cerrarRetiro} className="w-full py-4 text-white rounded-2xl font-bold" style={{background: MORADO}}>Entendido ✓</button>
                </div>
              )}

              {!exitoRetiro && paso === 'datos' && (
                <div className="flex flex-col gap-4">
                  <div className="rounded-2xl p-4 border" style={{background: '#F5F0FF', borderColor: '#DDD6FE'}}>
                    <p className="text-sm font-bold mb-1" style={{color: MORADO}}>🏦 Datos de tu cuenta bancaria</p>
                    <p className="text-xs" style={{color: '#6D28D9'}}>Ingresa la CLABE de la cuenta donde recibirás el dinero.</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">CLABE Interbancaria (18 dígitos)</label>
                    <input type="tel" placeholder="000000000000000000" value={clabe} onChange={e => setClabe(e.target.value.replace(/\D/g,'').slice(0,18))} className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-300 outline-none text-gray-900 font-mono text-lg tracking-widest bg-gray-50" maxLength={18}/>
                    <p className={`text-xs mt-1 ${clabe.length === 18 ? 'text-green-600' : 'text-gray-400'}`}>{clabe.length}/18 dígitos {clabe.length === 18 && '✓'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Banco</label>
                    <select value={banco} onChange={e => setBanco(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-300 outline-none text-gray-900 bg-white">
                      <option value="">Selecciona tu banco</option>
                      {bancos.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Nombre del titular</label>
                    <input type="text" placeholder="Tal como aparece en tu estado de cuenta" value={titular} onChange={e => setTitular(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-300 outline-none text-gray-900 bg-gray-50"/>
                  </div>
                  <div onClick={() => setGuardarDatos(!guardarDatos)} className="flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition" style={{borderColor: guardarDatos ? MORADO : '#E5E7EB', background: guardarDatos ? '#F5F0FF' : 'white'}}>
                    <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition" style={{background: guardarDatos ? MORADO : 'transparent', borderColor: guardarDatos ? MORADO : '#D1D5DB'}}>
                      {guardarDatos && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <p className="text-sm text-gray-600">Guardar estos datos para futuros retiros</p>
                  </div>
                  {errorRetiro && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm">{errorRetiro}</div>}
                  <button onClick={avanzarPaso} className="w-full py-4 text-white rounded-2xl font-bold text-lg" style={{background: MORADO}}>Continuar →</button>
                </div>
              )}

              {!exitoRetiro && paso === 'monto' && (
                <div className="flex flex-col gap-4">
                  <div className="rounded-2xl p-4 border border-gray-100 text-center" style={{background: '#F5F0FF'}}>
                    <p className="text-xs text-gray-500 mb-1">Saldo disponible</p>
                    <p className="text-3xl font-extrabold" style={{color: MORADO}}>${saldoDisponible.toFixed(2)} MXN</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">¿Cuánto quieres retirar?</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
                      <input type="number" placeholder="0.00" value={monto} onChange={e => setMonto(e.target.value)} className="w-full p-4 pl-8 rounded-2xl border-2 border-gray-200 focus:border-purple-300 outline-none text-gray-900 text-2xl font-bold bg-gray-50" min={MINIMO_RETIRO} max={Math.min(saldoDisponible, MAXIMO_RETIRO)} step="0.01"/>
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">MXN</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Mínimo $50 MXN · Máximo $50,000 MXN por retiro</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[50, 100, 200, Math.min(saldoDisponible, MAXIMO_RETIRO)].map((val, i) => (
                      <button key={i} onClick={() => setMonto(val.toFixed(2))} className="py-2 rounded-xl text-sm font-bold border-2 transition"
                        style={{borderColor: parseFloat(monto) === val ? MORADO : '#E5E7EB', background: parseFloat(monto) === val ? '#F5F0FF' : 'white', color: parseFloat(monto) === val ? MORADO : '#6B7280'}}>
                        {i === 3 ? 'Todo' : `$${val}`}
                      </button>
                    ))}
                  </div>
                  {montoNum > 0 && montoNum <= saldoDisponible && (
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <div className="flex justify-between text-sm mb-1"><span className="text-gray-500">Retiras</span><span className="font-bold text-gray-900">${montoNum.toFixed(2)} MXN</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Saldo restante</span><span className="font-bold" style={{color: MORADO}}>${(saldoDisponible - montoNum).toFixed(2)} MXN</span></div>
                    </div>
                  )}
                  {errorRetiro && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm">{errorRetiro}</div>}
                  <div className="flex gap-3">
                    <button onClick={() => setPaso('datos')} className="flex-1 py-4 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold">← Atrás</button>
                    <button onClick={avanzarPaso} className="flex-1 py-4 text-white rounded-2xl font-bold" style={{background: MORADO}}>Continuar →</button>
                  </div>
                </div>
              )}

              {!exitoRetiro && paso === 'confirmar' && (
                <div className="flex flex-col gap-4">
                  <div className="rounded-2xl p-5 border text-center" style={{background: '#F5F0FF', borderColor: '#DDD6FE'}}>
                    <p className="text-xs text-gray-500 mb-1">Monto a retirar</p>
                    <p className="text-4xl font-extrabold" style={{color: MORADO}}>${montoNum.toFixed(2)}</p>
                    <p className="text-center text-gray-400 text-sm mt-1">MXN</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100"><p className="text-xs text-gray-400 mb-0.5">Banco destino</p><p className="font-bold text-gray-900">{banco}</p></div>
                    <div className="px-4 py-3 border-b border-gray-100"><p className="text-xs text-gray-400 mb-0.5">CLABE</p><p className="font-bold text-gray-900 font-mono">{clabe.replace(/\s/g,'').replace(/(\d{4})/g,'$1 ').trim()}</p></div>
                    <div className="px-4 py-3"><p className="text-xs text-gray-400 mb-0.5">Titular</p><p className="font-bold text-gray-900">{titular}</p></div>
                  </div>
                  <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100">
                    <p className="text-xs text-yellow-800 font-semibold">⏱️ Tiempo estimado: 1-3 días hábiles</p>
                    <p className="text-xs text-yellow-700 mt-1">Verifica que la CLABE y el titular sean correctos. Una vez confirmado no podrás cancelar la solicitud.</p>
                  </div>
                  {errorRetiro && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm">{errorRetiro}</div>}
                  <div className="flex gap-3">
                    <button onClick={() => setPaso('monto')} disabled={procesando} className="flex-1 py-4 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold disabled:opacity-50">← Atrás</button>
                    <button onClick={solicitarRetiro} disabled={procesando} className="flex-1 py-4 text-white rounded-2xl font-bold disabled:opacity-50" style={{background: MORADO}}>
                      {procesando ? <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Procesando...</div> : 'Confirmar retiro ✓'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="pb-8 flex-shrink-0"/>
          </div>
        </div>
      )}

      <Nav activo="perfil" />
    </main>
  );
}