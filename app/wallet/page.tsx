'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Nav from '@/lib/nav';

export default function Wallet() {
  const [usuario, setUsuario] = useState<any>(null);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarRetiro, setMostrarRetiro] = useState(false);
  const [montoRetiro, setMontoRetiro] = useState('');
  const [clabe, setClabe] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }

    const { data: perfil } = await supabase
      .from('usuarios').select('*').eq('id', user.id).single();
    setUsuario(perfil);

    const { data: movs } = await supabase
      .from('wallet_movimientos')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    setMovimientos(movs || []);

    setCargando(false);
  };

  const solicitarRetiro = async () => {
    if (!montoRetiro || !clabe || !usuario) return;
    const monto = Number(montoRetiro);
    if (monto <= 0 || monto > (usuario.wallet_saldo || 0)) {
      setMensaje('Monto inválido');
      return;
    }
    if (clabe.length !== 18) {
      setMensaje('La CLABE debe tener 18 dígitos');
      return;
    }

    setProcesando(true);
    try {
      await supabase.from('usuarios')
        .update({ wallet_saldo: (usuario.wallet_saldo || 0) - monto })
        .eq('id', usuario.id);

      await supabase.from('wallet_movimientos').insert({
        usuario_id: usuario.id,
        tipo: 'retiro',
        monto: -monto,
        descripcion: `Retiro a CLABE ••••${clabe.slice(-4)}`,
      });

      setMensaje('✅ Retiro solicitado. Lo recibirás en 1-3 días hábiles.');
      setMostrarRetiro(false);
      setMontoRetiro('');
      setClabe('');
      cargarDatos();
    } catch (e) {
      setMensaje('Error al procesar el retiro');
    } finally {
      setProcesando(false);
    }
  };

  const tipoInfo: any = {
    recarga: { emoji: '💳', color: 'text-teal-600', label: 'Recarga' },
    pago_recibido: { emoji: '💰', color: 'text-green-600', label: 'Pago recibido' },
    pago_enviado: { emoji: '💸', color: 'text-red-500', label: 'Pago enviado' },
    comision: { emoji: '📊', color: 'text-orange-500', label: 'Comisión Fleksi' },
    retiro: { emoji: '🏦', color: 'text-blue-600', label: 'Retiro' },
    bono: { emoji: '🎁', color: 'text-purple-600', label: 'Bono' },
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

  const saldo = usuario?.wallet_saldo || 0;
  const ingresos = movimientos.filter(m => m.monto > 0).reduce((acc, m) => acc + m.monto, 0);
  const egresos = movimientos.filter(m => m.monto < 0).reduce((acc, m) => acc + Math.abs(m.monto), 0);
  const efectivoHabilitado = saldo >= 50;

  return (
    <main className="min-h-screen bg-gray-50 pb-32">

      {/* Header sin overlap */}
      <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 px-6 pt-12 pb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-10 translate-x-10"/>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-10 -translate-x-8"/>
        <div className="max-w-md mx-auto relative">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-white/70 text-sm font-semibold">Fleksi Wallet</p>
              <p className="text-white font-bold">{usuario?.nombre}</p>
            </div>
            <a href="/perfil" className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center text-white font-bold text-lg border border-white/30">
              ←
            </a>
          </div>

          <div className="text-center mb-4">
            <p className="text-white/60 text-sm font-semibold mb-1">Saldo disponible</p>
            <p className="text-5xl font-extrabold text-white">${saldo.toFixed(2)}</p>
            <p className="text-white/50 text-sm mt-1">MXN</p>
          </div>

          {/* Badge pagos en efectivo */}
          <div className={`flex items-center justify-center gap-2 py-2 px-4 rounded-full mx-auto w-fit mb-5 ${
            efectivoHabilitado ? 'bg-white/20 border border-white/30' : 'bg-white/10 border border-white/20'
          }`}>
            <div className={`w-2 h-2 rounded-full ${efectivoHabilitado ? 'bg-green-300 animate-pulse' : 'bg-white/30'}`}/>
            <p className={`text-xs font-semibold ${efectivoHabilitado ? 'text-white' : 'text-white/50'}`}>
              {efectivoHabilitado ? '💵 Pagos en efectivo habilitados' : '🔒 Recarga $50 para pagos en efectivo'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/15 rounded-2xl p-3 border border-white/20 text-center">
              <p className="text-white/60 text-xs font-semibold">↑ Entradas</p>
              <p className="text-white font-extrabold text-lg">${ingresos.toFixed(0)}</p>
            </div>
            <div className="bg-white/15 rounded-2xl p-3 border border-white/20 text-center">
              <p className="text-white/60 text-xs font-semibold">↓ Salidas</p>
              <p className="text-white font-extrabold text-lg">${egresos.toFixed(0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido sin overlap */}
      <div className="max-w-md mx-auto px-6 mt-5">

        {/* Botones acción */}
        <div className="flex gap-3 mb-4">
          <a href="/wallet/recargar"
            className="flex-1 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-2xl font-extrabold text-base shadow-lg hover:opacity-90 transition text-center">
            💳 Recargar
          </a>
          <button onClick={() => setMostrarRetiro(true)} disabled={saldo <= 0}
            className="flex-1 py-4 bg-white text-teal-600 rounded-2xl font-extrabold text-base shadow-lg hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed border-2 border-teal-100">
            🏦 Retirar
          </button>
        </div>

        {mensaje && (
          <div className={`rounded-2xl p-4 mb-4 text-sm font-semibold text-center ${
            mensaje.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            {mensaje}
          </div>
        )}

        {/* Info pagos en efectivo */}
        {!efectivoHabilitado ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
            <p className="font-bold text-amber-800 text-sm mb-1">💡 ¿Cómo funciona el efectivo?</p>
            <p className="text-amber-700 text-xs mb-3">Mantén $50+ en tu wallet para aceptar y ofrecer trabajos con pago en efectivo. Se cobra 5% a cada parte.</p>
            <a href="/wallet/recargar"
              className="block w-full py-2.5 bg-amber-500 text-white rounded-xl font-bold text-sm text-center hover:opacity-90 transition">
              Recargar ahora →
            </a>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4">
            <p className="font-bold text-green-800 text-sm mb-1">✅ Pagos en efectivo activos</p>
            <p className="text-green-700 text-xs">Puedes publicar y aplicar a trabajos con pago en efectivo. Se cobra 5% de comisión a cada parte.</p>
          </div>
        )}

        {/* Historial */}
        <h3 className="font-extrabold text-gray-900 mb-3">📋 Historial</h3>

        {movimientos.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <p className="text-4xl mb-3">💳</p>
            <p className="font-bold text-gray-900 mb-1">Sin movimientos</p>
            <p className="text-gray-400 text-sm">Tus transacciones aparecerán aquí</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {movimientos.map((mov) => {
              const info = tipoInfo[mov.tipo] || { emoji: '💱', color: 'text-gray-600', label: mov.tipo };
              return (
                <div key={mov.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {info.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm">{info.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{mov.descripcion}</p>
                    <p className="text-xs text-gray-300 mt-0.5">
                      {new Date(mov.created_at).toLocaleDateString('es-MX', {day: '2-digit', month: 'short', year: 'numeric'})}
                    </p>
                  </div>
                  <p className={`font-extrabold text-base ${mov.monto > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {mov.monto > 0 ? '+' : ''}${Math.abs(mov.monto).toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal retiro */}
      {mostrarRetiro && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setMostrarRetiro(false)}>
          <div className="w-full bg-white rounded-t-3xl p-6 pb-10"
            onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6"/>
            <h3 className="font-extrabold text-gray-900 text-xl mb-1">Retirar fondos</h3>
            <p className="text-gray-400 text-sm mb-5">Saldo disponible: <span className="font-bold text-teal-600">${saldo.toFixed(2)} MXN</span></p>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Monto a retirar</label>
                <input type="number" placeholder="Ej. 500"
                  value={montoRetiro} onChange={(e) => setMontoRetiro(e.target.value)}
                  max={saldo}
                  className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-teal-400 outline-none text-gray-900 text-lg font-bold"/>
                <div className="flex gap-2 mt-2">
                  {[saldo*0.25, saldo*0.5, saldo*0.75, saldo].map((val, i) => (
                    <button key={i} onClick={() => setMontoRetiro(val.toFixed(2))}
                      className="flex-1 py-1.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-xl hover:bg-teal-50 hover:text-teal-600 transition">
                      {['25%','50%','75%','Todo'][i]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">CLABE interbancaria (18 dígitos)</label>
                <input type="text" placeholder="000000000000000000"
                  value={clabe} onChange={(e) => setClabe(e.target.value.replace(/\D/g,'').slice(0,18))}
                  maxLength={18}
                  className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-teal-400 outline-none text-gray-900 font-mono tracking-widest"/>
                <p className="text-xs text-gray-400 mt-1">{clabe.length}/18 dígitos</p>
              </div>

              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-blue-700 text-xs font-semibold">ℹ️ El retiro se procesará en 1-3 días hábiles sin costo adicional.</p>
              </div>

              <button onClick={solicitarRetiro} disabled={procesando || !montoRetiro || !clabe || clabe.length !== 18}
                className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-2xl font-extrabold text-lg shadow-lg hover:opacity-90 transition disabled:opacity-50">
                {procesando ? 'Procesando...' : `Retirar $${montoRetiro || '0'} MXN`}
              </button>
            </div>
          </div>
        </div>
      )}

      <Nav activo="perfil" />
    </main>
  );
}