'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Nav from '@/lib/nav';

export default function Wallet() {
  const [usuario, setUsuario] = useState<any>(null);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    const { data: perfil } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
    setUsuario({ ...perfil, id: user.id });
    const { data: movs } = await supabase
      .from('wallet_movimientos')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setMovimientos(movs || []);
    setCargando(false);
  };

  const tipoColor: any = {
    recarga: 'text-green-600',
    pago: 'text-red-600',
    comision: 'text-orange-600',
    retiro: 'text-blue-600',
    reembolso: 'text-purple-600',
  };

  const tipoEmoji: any = {
    recarga: '💳',
    pago: '💸',
    comision: '📊',
    retiro: '🏦',
    reembolso: '↩️',
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

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
          <div className="text-center mb-6">
            <p className="text-gray-400 text-sm mb-1">Saldo disponible</p>
            <p className="text-5xl font-extrabold text-teal-600">${(usuario?.wallet_saldo || 0).toFixed(2)}</p>
            <p className="text-gray-400 text-sm mt-1">MXN</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a href="/wallet/recargar"
              className="flex flex-col items-center gap-2 p-4 bg-teal-50 rounded-2xl border border-teal-100 hover:bg-teal-100 transition">
              <span className="text-2xl">💳</span>
              <p className="font-bold text-teal-700 text-sm">Recargar</p>
            </a>
            <div className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-200 opacity-50 cursor-not-allowed">
              <span className="text-2xl">🏦</span>
              <p className="font-bold text-gray-500 text-sm">Retirar</p>
              <p className="text-xs text-gray-400">Próximamente</p>
            </div>
          </div>
        </div>

        <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 mb-4">
          <p className="text-teal-700 text-sm font-semibold mb-1">💡 ¿Para qué sirve el wallet?</p>
          <p className="text-teal-600 text-xs leading-relaxed">
            Mantén $50+ en tu wallet para habilitar pagos en efectivo. Al confirmar un trabajo en efectivo, se descuenta una comisión del 5% automáticamente.
          </p>
        </div>

        <div className="mb-4">
          <h3 className="font-extrabold text-gray-900 mb-3">📋 Movimientos</h3>
          {movimientos.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
              <p className="text-3xl mb-3">💳</p>
              <p className="font-bold text-gray-900 mb-1">Sin movimientos todavía</p>
              <p className="text-gray-400 text-sm">Recarga tu wallet para empezar</p>
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

      <Nav activo="perfil" />
    </main>
  );
}