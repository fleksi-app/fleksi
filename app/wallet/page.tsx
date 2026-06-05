'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Nav from '@/lib/nav';

const bancos = [
  'BBVA', 'Banamex', 'Santander', 'Banorte', 'HSBC',
  'Scotiabank', 'Inbursa', 'Bajío', 'Afirme', 'BanBajío',
  'Mifel', 'Multiva', 'Banca Mifel', 'BBASE', 'CIBanco',
  'Consubanco', 'Inmobiliario Mexicano', 'Invex', 'Ixe',
  'Monexcb', 'Nu Bank (Nu México)', 'Spin by OXXO',
  'Stori', 'Mercado Pago', 'KLAR', 'Otro',
];

export default function Wallet() {
  const [usuario, setUsuario] = useState<any>(null);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [retiros, setRetiros] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  // Retiro
  const [mostrarRetiro, setMostrarRetiro] = useState(false);
  const [paso, setPaso] = useState<'datos' | 'monto' | 'confirmar'>('datos');
  const [clabe, setClabe] = useState('');
  const [banco, setBanco] = useState('');
  const [titular, setTitular] = useState('');
  const [guardarDatos, setGuardarDatos] = useState(true);
  const [monto, setMonto] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [exitoRetiro, setExitoRetiro] = useState(false);
  const [errorRetiro, setErrorRetiro] = useState('');

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    const { data: perfil } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
    setUsuario({ ...perfil, id: user.id });

    // Prellenar datos bancarios si ya los tiene
    if (perfil?.clabe) setClabe(perfil.clabe);
    if (perfil?.banco) setBanco(perfil.banco);
    if (perfil?.titular_cuenta) setTitular(perfil.titular_cuenta);

    const { data: movs } = await supabase
      .from('wallet_movimientos')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setMovimientos(movs || []);

    const { data: retirosData } = await supabase
      .from('retiros')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    setRetiros(retirosData || []);

    setCargando(false);
  };

  const saldoDisponible = usuario?.wallet_saldo || 0;
  const montoNum = parseFloat(monto) || 0;
  const MINIMO_RETIRO = 50;

  const validarClabe = (c: string) => /^\d{18}$/.test(c.replace(/\s/g, ''));

  const avanzarPaso = () => {
    setErrorRetiro('');
    if (paso === 'datos') {
      if (!clabe.trim()) { setErrorRetiro('Ingresa tu CLABE interbancaria'); return; }
      if (!validarClabe(clabe)) { setErrorRetiro('La CLABE debe tener 18 dígitos'); return; }
      if (!banco) { setErrorRetiro('Selecciona tu banco'); return; }
      if (!titular.trim()) { setErrorRetiro('Ingresa el nombre del titular'); return; }
      setPaso('monto');
    } else if (paso === 'monto') {
      if (!monto || montoNum <= 0) { setErrorRetiro('Ingresa un monto válido'); return; }
      if (montoNum < MINIMO_RETIRO) { setErrorRetiro(`El monto mínimo de retiro es $${MINIMO_RETIRO} MXN`); return; }
      if (montoNum > saldoDisponible) { setErrorRetiro('No tienes suficiente saldo'); return; }
      setPaso('confirmar');
    }
  };

  const solicitarRetiro = async () => {
    setProcesando(true);
    setErrorRetiro('');
    try {
      const clabeClean = clabe.replace(/\s/g, '');

      // Guardar datos bancarios si el usuario quiere
      if (guardarDatos) {
        await supabase.from('usuarios').update({
          clabe: clabeClean,
          banco,
          titular_cuenta: titular,
        }).eq('id', usuario.id);
      }

      // Crear solicitud de retiro
      const { error: retiroError } = await supabase.from('retiros').insert({
        usuario_id: usuario.id,
        monto: montoNum,
        clabe: clabeClean,
        banco,
        titular,
        estado: 'pendiente',
      });
      if (retiroError) throw retiroError;

      // Descontar del saldo
      const nuevoSaldo = saldoDisponible - montoNum;
      await supabase.from('usuarios').update({ wallet_saldo: nuevoSaldo }).eq('id', usuario.id);

      // Registrar movimiento
      await supabase.from('wallet_movimientos').insert({
        usuario_id: usuario.id,
        tipo: 'retiro',
        monto: -montoNum,
        descripcion: `Retiro solicitado a ${banco} ****${clabeClean.slice(-4)}`,
      });

      // Notificación
      try {
        await supabase.from('notificaciones').insert({
          usuario_id: usuario.id,
          tipo: 'retiro_solicitado',
          titulo: '🏦 Solicitud de retiro recibida',
          mensaje: `Tu solicitud de retiro por $${montoNum.toFixed(2)} MXN está siendo procesada. Te notificaremos cuando se complete.`,
          link: '/wallet',
        });
      } catch (e) {}

      setExitoRetiro(true);
      await cargarDatos();
    } catch (err: any) {
      setErrorRetiro('Ocurrió un error. Intenta de nuevo.');
      console.error(err);
    } finally {
      setProcesando(false);
    }
  };

  const cerrarRetiro = () => {
    setMostrarRetiro(false);
    setExitoRetiro(false);
    setPaso('datos');
    setMonto('');
    setErrorRetiro('');
  };

  const tipoColor: any = {
    recarga: 'text-green-600',
    pago: 'text-red-600',
    comision: 'text-orange-600',
    retiro: 'text-blue-600',
    reembolso: 'text-purple-600',
    ganancia: 'text-green-600',
  };

  const tipoEmoji: any = {
    recarga: '💳',
    pago: '💸',
    comision: '📊',
    retiro: '🏦',
    reembolso: '↩️',
    ganancia: '💰',
  };

  const estadoRetiroColor: any = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    procesando: 'bg-blue-100 text-blue-700',
    completado: 'bg-green-100 text-green-700',
    rechazado: 'bg-red-100 text-red-700',
  };

  const estadoRetiroLabel: any = {
    pendiente: '⏳ Pendiente',
    procesando: '🔄 Procesando',
    completado: '✅ Completado',
    rechazado: '❌ Rechazado',
  };

  if (cargando) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando wallet...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-32">

      <div className="bg-gradient-to-br from-teal-500 to-cyan-600 px-6 pt-12 pb-20">
        <div className="max-w-md mx-auto">
          <h1 className="text-white font-extrabold text-xl mb-1">Fleksi Wallet</h1>
          <p className="text-white/70 text-sm">Tu saldo disponible</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 -mt-12">

        {/* Saldo y botones */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
          <div className="text-center mb-6">
            <p className="text-gray-400 text-sm mb-1">Saldo disponible</p>
            <p className="text-5xl font-extrabold text-teal-600">${saldoDisponible.toFixed(2)}</p>
            <p className="text-gray-400 text-sm mt-1">MXN</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a href="/wallet/recargar"
              className="flex flex-col items-center gap-2 p-4 bg-teal-50 rounded-2xl border border-teal-100 hover:bg-teal-100 transition">
              <span className="text-2xl">💳</span>
              <p className="font-bold text-teal-700 text-sm">Recargar</p>
            </a>
            <button
              onClick={() => setMostrarRetiro(true)}
              disabled={saldoDisponible < MINIMO_RETIRO}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition ${
                saldoDisponible >= MINIMO_RETIRO
                  ? 'bg-blue-50 border-blue-100 hover:bg-blue-100 cursor-pointer'
                  : 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
              }`}>
              <span className="text-2xl">🏦</span>
              <p className={`font-bold text-sm ${saldoDisponible >= MINIMO_RETIRO ? 'text-blue-700' : 'text-gray-500'}`}>
                Retirar
              </p>
              {saldoDisponible < MINIMO_RETIRO && (
                <p className="text-xs text-gray-400">Mín. $50</p>
              )}
            </button>
          </div>

          {saldoDisponible > 0 && saldoDisponible < MINIMO_RETIRO && (
            <p className="text-xs text-gray-400 text-center mt-3">
              Necesitas al menos $50 MXN para solicitar un retiro. Te faltan ${(MINIMO_RETIRO - saldoDisponible).toFixed(2)} MXN.
            </p>
          )}
        </div>

        {/* Info wallet */}
        <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 mb-4">
          <p className="text-teal-700 text-sm font-semibold mb-1">💡 ¿Cómo funcionan los retiros?</p>
          <p className="text-teal-600 text-xs leading-relaxed">
            Solicitas el retiro aquí, ingresas tu CLABE y en un plazo de 1-3 días hábiles recibirás el dinero en tu cuenta bancaria. El monto mínimo es $50 MXN.
          </p>
        </div>

        {/* Retiros pendientes */}
        {retiros.filter(r => r.estado === 'pendiente' || r.estado === 'procesando').length > 0 && (
          <div className="mb-4">
            <h3 className="font-extrabold text-gray-900 mb-3">⏳ Retiros en proceso</h3>
            <div className="flex flex-col gap-2">
              {retiros.filter(r => r.estado === 'pendiente' || r.estado === 'procesando').map(r => (
                <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-gray-900">${r.monto.toFixed(2)} MXN</p>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${estadoRetiroColor[r.estado]}`}>
                      {estadoRetiroLabel[r.estado]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{r.banco} — ****{r.clabe?.slice(-4)}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Solicitado: {new Date(r.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Movimientos */}
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
              {movimientos.map((mov) => (
                <div key={mov.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                      {tipoEmoji[mov.tipo] || '💰'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{mov.descripcion || mov.tipo}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(mov.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <p className={`font-extrabold text-sm flex-shrink-0 ${mov.monto > 0 ? 'text-green-600' : tipoColor[mov.tipo] || 'text-gray-900'}`}>
                      {mov.monto > 0 ? '+' : ''}${Math.abs(mov.monto).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── MODAL DE RETIRO ── */}
      {mostrarRetiro && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={cerrarRetiro}>
          <div className="w-full bg-white rounded-t-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="font-extrabold text-gray-900 text-lg">
                  {exitoRetiro ? '¡Retiro solicitado!' : paso === 'datos' ? 'Datos bancarios' : paso === 'monto' ? '¿Cuánto retirar?' : 'Confirmar retiro'}
                </h3>
                {!exitoRetiro && (
                  <div className="flex items-center gap-1 mt-1">
                    {['datos', 'monto', 'confirmar'].map((p, i) => (
                      <div key={p} className={`h-1.5 rounded-full transition-all ${paso === p ? 'w-8 bg-teal-500' : ['datos','monto','confirmar'].indexOf(paso) > i ? 'w-4 bg-teal-300' : 'w-4 bg-gray-200'}`}/>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={cerrarRetiro} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4">

              {/* ÉXITO */}
              {exitoRetiro && (
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">🏦</div>
                  <h4 className="font-extrabold text-gray-900 text-xl mb-2">¡Solicitud enviada!</h4>
                  <p className="text-gray-500 text-sm mb-2">Tu retiro de <span className="font-bold text-gray-900">${montoNum.toFixed(2)} MXN</span> está siendo procesado.</p>
                  <p className="text-gray-400 text-xs mb-6">Recibirás el dinero en tu cuenta <span className="font-semibold">{banco}</span> terminada en <span className="font-semibold">****{clabe.replace(/\s/g,'').slice(-4)}</span> en un plazo de 1-3 días hábiles.</p>
                  <button onClick={cerrarRetiro} className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-2xl font-bold">
                    Entendido ✓
                  </button>
                </div>
              )}

              {/* PASO 1: DATOS BANCARIOS */}
              {!exitoRetiro && paso === 'datos' && (
                <div className="flex flex-col gap-4">
                  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                    <p className="text-sm font-bold text-blue-800 mb-1">🏦 Datos de tu cuenta bancaria</p>
                    <p className="text-xs text-blue-600">Ingresa la CLABE de la cuenta donde recibirás el dinero. Debe ser una cuenta a tu nombre.</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">CLABE Interbancaria (18 dígitos)</label>
                    <input
                      type="tel"
                      placeholder="000000000000000000"
                      value={clabe}
                      onChange={e => setClabe(e.target.value.replace(/\D/g, '').slice(0, 18))}
                      className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-teal-400 outline-none text-gray-900 font-mono text-lg tracking-widest"
                      maxLength={18}
                    />
                    <p className={`text-xs mt-1 ${clabe.length === 18 ? 'text-green-600' : 'text-gray-400'}`}>
                      {clabe.length}/18 dígitos {clabe.length === 18 && '✓'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Banco</label>
                    <select value={banco} onChange={e => setBanco(e.target.value)}
                      className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-teal-400 outline-none text-gray-900 bg-white">
                      <option value="">Selecciona tu banco</option>
                      {bancos.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Nombre del titular de la cuenta</label>
                    <input
                      type="text"
                      placeholder="Tal como aparece en tu estado de cuenta"
                      value={titular}
                      onChange={e => setTitular(e.target.value)}
                      className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-teal-400 outline-none text-gray-900"
                    />
                  </div>

                  <div
                    onClick={() => setGuardarDatos(!guardarDatos)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition ${guardarDatos ? 'border-teal-400 bg-teal-50' : 'border-gray-200'}`}>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${guardarDatos ? 'bg-teal-500 border-teal-500' : 'border-gray-300'}`}>
                      {guardarDatos && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <p className="text-sm text-gray-600">Guardar estos datos para futuros retiros</p>
                  </div>

                  {errorRetiro && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm">{errorRetiro}</div>}

                  <button onClick={avanzarPaso} className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-2xl font-bold text-lg">
                    Continuar →
                  </button>
                </div>
              )}

              {/* PASO 2: MONTO */}
              {!exitoRetiro && paso === 'monto' && (
                <div className="flex flex-col gap-4">
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-center">
                    <p className="text-xs text-gray-500 mb-1">Saldo disponible</p>
                    <p className="text-3xl font-extrabold text-teal-600">${saldoDisponible.toFixed(2)} MXN</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">¿Cuánto quieres retirar?</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={monto}
                        onChange={e => setMonto(e.target.value)}
                        className="w-full p-4 pl-8 rounded-2xl border-2 border-gray-200 focus:border-teal-400 outline-none text-gray-900 text-2xl font-bold"
                        min={MINIMO_RETIRO}
                        max={saldoDisponible}
                        step="0.01"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">MXN</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Mínimo $50 MXN</p>
                  </div>

                  {/* Atajos rápidos */}
                  <div className="grid grid-cols-4 gap-2">
                    {[50, 100, 200, saldoDisponible].map((val, i) => (
                      <button key={i} onClick={() => setMonto(val.toFixed(2))}
                        className={`py-2 rounded-xl text-sm font-bold border-2 transition ${parseFloat(monto) === val ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                        {i === 3 ? 'Todo' : `$${val}`}
                      </button>
                    ))}
                  </div>

                  {montoNum > 0 && montoNum <= saldoDisponible && (
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">Retiras</span>
                        <span className="font-bold text-gray-900">${montoNum.toFixed(2)} MXN</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Saldo restante</span>
                        <span className="font-bold text-teal-600">${(saldoDisponible - montoNum).toFixed(2)} MXN</span>
                      </div>
                    </div>
                  )}

                  {errorRetiro && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm">{errorRetiro}</div>}

                  <div className="flex gap-3">
                    <button onClick={() => setPaso('datos')} className="flex-1 py-4 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold">← Atrás</button>
                    <button onClick={avanzarPaso} className="flex-1 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-2xl font-bold">Continuar →</button>
                  </div>
                </div>
              )}

              {/* PASO 3: CONFIRMAR */}
              {!exitoRetiro && paso === 'confirmar' && (
                <div className="flex flex-col gap-4">
                  <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl p-5 border border-teal-100">
                    <p className="text-xs text-gray-500 mb-1 text-center">Monto a retirar</p>
                    <p className="text-4xl font-extrabold text-teal-600 text-center">${montoNum.toFixed(2)}</p>
                    <p className="text-center text-gray-400 text-sm mt-1">MXN</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs text-gray-400 mb-0.5">Banco destino</p>
                      <p className="font-bold text-gray-900">{banco}</p>
                    </div>
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs text-gray-400 mb-0.5">CLABE</p>
                      <p className="font-bold text-gray-900 font-mono">
                        {clabe.replace(/\s/g,'').replace(/(\d{4})/g, '$1 ').trim()}
                      </p>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-xs text-gray-400 mb-0.5">Titular</p>
                      <p className="font-bold text-gray-900">{titular}</p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100">
                    <p className="text-xs text-yellow-800 font-semibold">⏱️ Tiempo estimado: 1-3 días hábiles</p>
                    <p className="text-xs text-yellow-700 mt-1">Verifica que la CLABE y el titular sean correctos. Una vez confirmado no podrás cancelar la solicitud.</p>
                  </div>

                  {errorRetiro && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm">{errorRetiro}</div>}

                  <div className="flex gap-3">
                    <button onClick={() => setPaso('monto')} disabled={procesando} className="flex-1 py-4 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold disabled:opacity-50">← Atrás</button>
                    <button onClick={solicitarRetiro} disabled={procesando}
                      className="flex-1 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-2xl font-bold disabled:opacity-50">
                      {procesando ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                          Procesando...
                        </div>
                      ) : 'Confirmar retiro ✓'}
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