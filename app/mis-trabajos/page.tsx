'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Nav from '@/lib/nav';

const MORADO = '#7B2FE0';

export default function MisTrabajos() {
  const [aplicaciones, setAplicaciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);
  const [filtro, setFiltro] = useState<'todos' | 'activos' | 'completados'>('activos');

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    const { data: perfil } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
    setUsuario(perfil);
    const { data: apps } = await supabase
      .from('aplicaciones')
      .select('*, servicios(id, titulo, fecha, hora, presupuesto, urgente, estado, metodo_pago, usuarios!cliente_id(nombre, foto_url))')
      .eq('prestador_id', user.id)
      .order('created_at', { ascending: false });
    setAplicaciones(apps || []);
    setCargando(false);
  };

  const estadoColor: any = {
    pendiente: 'bg-yellow-100 text-yellow-600',
    aceptado: 'bg-green-100 text-green-600',
    rechazado: 'bg-red-100 text-red-600',
    completado: 'bg-gray-100 text-gray-600',
    cancelado: 'bg-red-100 text-red-600',
  };

  const estadoLabel: any = {
    pendiente: '⏳ Pendiente',
    aceptado: '✅ Aceptado',
    rechazado: '❌ Rechazado',
    completado: '🏁 Completado',
    cancelado: '❌ Cancelado',
  };

  const appsFiltradas = aplicaciones.filter(app => {
    if (filtro === 'activos') return app.estado === 'pendiente' || app.estado === 'aceptado';
    if (filtro === 'completados') return app.estado === 'completado';
    return true;
  });

  const conteos = {
    activos: aplicaciones.filter(a => a.estado === 'pendiente' || a.estado === 'aceptado').length,
    completados: aplicaciones.filter(a => a.estado === 'completado').length,
    todos: aplicaciones.length,
  };

  if (cargando) return (
    <main className="min-h-screen flex items-center justify-center" style={{background: '#F8FAFC'}}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{borderColor: MORADO, borderTopColor: 'transparent'}}/>
        <p className="text-gray-400">Cargando trabajos...</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen pb-32" style={{background: '#F8FAFC'}}>

      <div className="bg-white px-6 pt-12 pb-4 shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto">
          <h1 className="font-extrabold text-gray-900 text-xl mb-1">Mis Trabajos</h1>
          <p className="text-gray-400 text-sm">Historial de tus aplicaciones</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 pt-4">

        <div className="flex gap-2 bg-white p-1 rounded-2xl shadow-sm border border-gray-100 mb-4">
          {[
            { id: 'activos', label: `Activos ${conteos.activos > 0 ? `(${conteos.activos})` : ''}` },
            { id: 'completados', label: `Completados ${conteos.completados > 0 ? `(${conteos.completados})` : ''}` },
            { id: 'todos', label: 'Todos' },
          ].map((f) => (
            <button key={f.id} onClick={() => setFiltro(f.id as any)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold transition"
              style={{background: filtro === f.id ? MORADO : 'transparent', color: filtro === f.id ? 'white' : '#6B7280'}}>
              {f.label}
            </button>
          ))}
        </div>

        {appsFiltradas.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">{filtro === 'activos' ? '✋' : filtro === 'completados' ? '🏁' : '📋'}</p>
            <p className="font-bold text-gray-900 mb-2">
              {filtro === 'activos' ? 'Sin trabajos activos' : filtro === 'completados' ? 'Sin trabajos completados' : 'Sin aplicaciones todavía'}
            </p>
            <p className="text-gray-400 text-sm mb-6">
              {filtro === 'activos' ? 'Aplica a trabajos disponibles cerca de ti' : 'Completa trabajos para verlos aquí'}
            </p>
            <a href="/home" className="inline-block px-6 py-3 text-white rounded-2xl font-bold text-sm" style={{background: MORADO}}>
              Ver trabajos disponibles
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {appsFiltradas.map((app) => {
              const servicio = app.servicios;
              const esAceptado = app.estado === 'aceptado';
              const esCompletado = app.estado === 'completado';
              const esPendiente = app.estado === 'pendiente';

              return (
                <div key={app.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition ${esAceptado ? 'border-green-200' : esCompletado ? 'border-gray-200' : 'border-gray-100'}`}>
                  <a href={esAceptado ? '/checkin' : `/trabajo?id=${servicio?.id}`} className="block p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-gray-900 text-sm leading-tight flex-1 mr-2">{servicio?.titulo || 'Trabajo'}</h3>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${estadoColor[app.estado]}`}>{estadoLabel[app.estado]}</span>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{background: MORADO}}>
                        {servicio?.usuarios?.foto_url
                          ? <img src={servicio.usuarios.foto_url} className="w-full h-full object-cover"/>
                          : <span className="text-white text-xs font-bold">{servicio?.usuarios?.nombre?.charAt(0) || '?'}</span>}
                      </div>
                      <p className="text-xs text-gray-500">Cliente: <span className="font-semibold text-gray-700">{servicio?.usuarios?.nombre || 'Cliente'}</span></p>
                      {servicio?.metodo_pago === 'efectivo' && <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full ml-auto">💵 Efectivo</span>}
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-400">📅 {servicio?.fecha} {servicio?.hora?.slice(0,5)}</p>
                        {servicio?.urgente && <span className="text-xs text-red-500 font-bold">🔴 Urgente</span>}
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-base" style={{color: MORADO}}>${app.precio_ofrecido || servicio?.presupuesto} MXN</p>
                        <p className="text-xs text-gray-400">tu oferta</p>
                      </div>
                    </div>
                  </a>

                  {esAceptado && (
                    <div className="bg-green-50 border-t border-green-100 px-4 py-3">
                      <p className="text-green-700 text-xs font-bold text-center">✅ ¡Trabajo aceptado! Toca para hacer Check-in cuando llegues</p>
                    </div>
                  )}
                  {esPendiente && (
                    <div className="bg-yellow-50 border-t border-yellow-100 px-4 py-3">
                      <p className="text-yellow-700 text-xs font-semibold text-center">⏳ Esperando respuesta del cliente...</p>
                    </div>
                  )}
                  {esCompletado && (
                    <div className="bg-gray-50 border-t border-gray-100 px-4 py-3 flex items-center justify-between">
                      <p className="text-gray-500 text-xs font-semibold">🏁 Trabajo completado</p>
                      <a href="/calificar" className="text-xs font-bold hover:underline" style={{color: MORADO}}>⭐ Calificar →</a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Nav activo="trabajos" />
    </main>
  );
}