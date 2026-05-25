'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Nav from '@/lib/nav';

export default function Earnings() {
  const [usuario, setUsuario] = useState<any>(null);
  const [aplicaciones, setAplicaciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [periodoActivo, setPeriodoActivo] = useState('todo');

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }

    const { data: perfil } = await supabase
      .from('usuarios').select('*').eq('id', user.id).single();
    setUsuario(perfil);

    const { data: apps } = await supabase
      .from('aplicaciones')
      .select('*, servicios(titulo, fecha, categoria, presupuesto, usuarios(nombre))')
      .eq('prestador_id', user.id)
      .eq('estado', 'completado')
      .order('created_at', { ascending: false });

    setAplicaciones(apps || []);
    setCargando(false);
  };

  const ahora = new Date();

  const filtrarPorPeriodo = (apps: any[]) => {
    if (periodoActivo === 'todo') return apps;
    if (periodoActivo === 'mes') {
      return apps.filter(a => {
        const fecha = new Date(a.created_at);
        return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
      });
    }
    if (periodoActivo === 'semana') {
      const hace7dias = new Date();
      hace7dias.setDate(ahora.getDate() - 7);
      return apps.filter(a => new Date(a.created_at) >= hace7dias);
    }
    return apps;
  };

  const appsFiltradas = filtrarPorPeriodo(aplicaciones);
  const totalGanado = appsFiltradas.reduce((acc, a) => acc + (a.precio_ofrecido || a.servicios?.presupuesto || 0), 0);
  const totalHistorico = aplicaciones.reduce((acc, a) => acc + (a.precio_ofrecido || a.servicios?.presupuesto || 0), 0);

  // Ganancias por mes (últimos 6 meses)
  const gananciasXMes = () => {
    const meses: { [key: string]: number } = {};
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - i);
      const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      meses[key] = 0;
    }
    aplicaciones.forEach(a => {
      const fecha = new Date(a.created_at);
      const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      if (key in meses) {
        meses[key] += a.precio_ofrecido || a.servicios?.presupuesto || 0;
      }
    });
    return Object.entries(meses).map(([key, valor]) => {
      const [year, month] = key.split('-');
      const nombre = new Date(Number(year), Number(month) - 1).toLocaleString('es-MX', { month: 'short' });
      return { nombre, valor };
    });
  };

  const maxMes = Math.max(...gananciasXMes().map(m => m.valor), 1);

  const categoriaEmoji: any = {
    hogar: '🔧', limpieza: '🧹', eventos: '🍽️',
    mudanza: '🚚', ejecutivo: '🚗', interprete: '🗣️',
    cocina: '🍳', jardineria: '🌿', mecanica: '🔩',
    cerrajeria: '🔑', estetica: '💅', otro: '✨'
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

  return (
    <main className="min-h-screen bg-gray-50 pb-32">

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 pt-12 pb-20">
        <div className="max-w-md mx-auto">
          <h1 className="text-white font-extrabold text-xl mb-1">Mis ganancias</h1>
          <p className="text-white/70 text-sm">Historial de pagos y estadísticas</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 -mt-12">

        {/* Card principal */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-purple-600">${totalHistorico.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-0.5">Total ganado</p>
            </div>
            <div className="text-center border-x border-gray-100">
              <p className="text-2xl font-extrabold text-gray-900">{aplicaciones.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">Trabajos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-extrabold text-yellow-500">{usuario?.calificacion || '5.0'}</p>
              <p className="text-xs text-gray-400 mt-0.5">⭐ Rating</p>
            </div>
          </div>

          {/* Filtros periodo */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
            {[
              { id: 'semana', label: '7 días' },
              { id: 'mes', label: 'Este mes' },
              { id: 'todo', label: 'Todo' },
            ].map((p) => (
              <button key={p.id} onClick={() => setPeriodoActivo(p.id)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                  periodoActivo === p.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}>
                {p.label}
              </button>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">
                {periodoActivo === 'semana' ? 'Últimos 7 días' : periodoActivo === 'mes' ? 'Este mes' : 'Total histórico'}
              </span>
              <span className="font-extrabold text-purple-600 text-lg">${totalGanado.toLocaleString()} MXN</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{appsFiltradas.length} trabajo{appsFiltradas.length !== 1 ? 's' : ''} completado{appsFiltradas.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Gráfica de barras por mes */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-extrabold text-gray-900 mb-4">📊 Ganancias por mes</h3>
          <div className="flex items-end gap-2 h-24">
            {gananciasXMes().map((mes, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-purple-600 transition-all"
                  style={{ height: `${Math.max((mes.valor / maxMes) * 80, mes.valor > 0 ? 8 : 2)}px` }}/>
                <span className="text-xs text-gray-400">{mes.nombre}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Promedio por trabajo */}
        {aplicaciones.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <h3 className="font-extrabold text-gray-900 mb-3">💡 Estadísticas</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xl font-extrabold text-gray-900">
                  ${Math.round(totalHistorico / aplicaciones.length).toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Promedio por trabajo</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xl font-extrabold text-green-600">
                  ${Math.round(totalHistorico * 0.88).toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Neto (88%)</p>
              </div>
            </div>
          </div>
        )}

        {/* Lista de trabajos */}
        <div className="mb-4">
          <h3 className="font-extrabold text-gray-900 mb-3">📋 Trabajos completados</h3>
          {appsFiltradas.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
              <p className="text-4xl mb-3">💰</p>
              <p className="font-bold text-gray-900 mb-1">Sin trabajos en este periodo</p>
              <p className="text-gray-400 text-sm">Completa trabajos para ver tus ganancias aquí</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {appsFiltradas.map((app) => (
                <div key={app.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                      {categoriaEmoji[app.servicios?.categoria?.toLowerCase()] || '✨'}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-sm">{app.servicios?.titulo}</p>
                      <p className="text-xs text-gray-400">
                        Cliente: {app.servicios?.usuarios?.nombre} · {app.servicios?.fecha}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-purple-600">${(app.precio_ofrecido || app.servicios?.presupuesto || 0).toLocaleString()}</p>
                      <p className="text-xs text-green-600 font-semibold">✅ Pagado</p>
                    </div>
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