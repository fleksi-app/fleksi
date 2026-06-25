'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Nav from '@/lib/nav';

const MORADO = '#7B2FE0';
const categoriaIcono: any = {
  hogar: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MORADO} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>,
  limpieza: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MORADO} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l9-9"/><path d="M12.5 8.5L16 5l3 3-7.5 7.5"/><path d="M15 6l1.5-1.5a2.12 2.12 0 013 3L18 9"/></svg>,
  eventos: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MORADO} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"/></svg>,
  mudanza: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MORADO} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  ejecutivo: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MORADO} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3"/><rect x="9" y="11" width="14" height="10" rx="2"/><circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/></svg>,
  mecanica: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MORADO} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  cerrajeria: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MORADO} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  cocina: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MORADO} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 13.87A4 4 0 017.41 6a5.11 5.11 0 011.05-1.54 5 5 0 017.08 0A5.11 5.11 0 0117 6a4 4 0 011.41 7.87V21H6z"/><line x1="6" y1="17" x2="18" y2="17"/></svg>,
  estetica: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MORADO} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  otro: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MORADO} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>,
};

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