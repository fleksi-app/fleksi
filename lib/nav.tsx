'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Nav({ activo }: { activo: string }) {
  const [rol, setRol] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarNotifs, setMostrarNotifs] = useState(false);
  const [mostrarCambioRol, setMostrarCambioRol] = useState(false);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0);
  const [usuarioId, setUsuarioId] = useState('');
  const [cambiandoRol, setCambiandoRol] = useState(false);

  useEffect(() => {
    const obtenerDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUsuarioId(user.id);
      const { data } = await supabase.from('usuarios')
        .select('rol, rol_activo, roles').eq('id', user.id).single();
      const rolActivo = data?.rol_activo || data?.rol || 'flekser';
      const rolesUsuario = data?.roles || [data?.rol || 'flekser'];
      setRol(rolActivo);
      setRoles(rolesUsuario);
      cargarNotificaciones(user.id);
      cargarMensajesNoLeidos(user.id);
    };
    obtenerDatos();
  }, []);

  useEffect(() => {
    if (!usuarioId) return;
    const canal = supabase.channel('notificaciones-nav')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificaciones', filter: `usuario_id=eq.${usuarioId}` }, () => { cargarNotificaciones(usuarioId); })
      .subscribe();
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('fleksi-notifs');
      bc.onmessage = (e) => { if (e.data?.type === 'nueva_notificacion') cargarNotificaciones(usuarioId); };
    } catch (e) {}
    return () => { supabase.removeChannel(canal); try { bc?.close(); } catch (e) {} };
  }, [usuarioId]);

  useEffect(() => {
    if (!usuarioId) return;
    const canal = supabase.channel('mensajes-nav')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes', filter: `destinatario_id=eq.${usuarioId}` }, () => { cargarMensajesNoLeidos(usuarioId); })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mensajes', filter: `destinatario_id=eq.${usuarioId}` }, () => { cargarMensajesNoLeidos(usuarioId); })
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, [usuarioId]);

  const cargarNotificaciones = async (uid: string) => {
    const { data } = await supabase.from('notificaciones').select('*').eq('usuario_id', uid).order('created_at', { ascending: false }).limit(20);
    setNotificaciones(data || []);
    setNoLeidas((data || []).filter(n => !n.leida).length);
  };

  const cargarMensajesNoLeidos = async (uid: string) => {
    const { count } = await supabase.from('mensajes').select('*', { count: 'exact', head: true }).eq('destinatario_id', uid).eq('leido', false);
    setMensajesNoLeidos(count || 0);
  };

  const marcarLeidas = async () => {
    if (!usuarioId) return;
    await supabase.from('notificaciones').update({ leida: true }).eq('usuario_id', usuarioId).eq('leida', false);
    setNoLeidas(0);
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
  };

  const cambiarRolActivo = async (nuevoRol: string) => {
    if (!usuarioId || cambiandoRol) return;
    setCambiandoRol(true);
    try {
      const rolesActuales = roles.includes(nuevoRol) ? roles : [...roles, nuevoRol];
      await supabase.from('usuarios').update({ rol_activo: nuevoRol, roles: rolesActuales }).eq('id', usuarioId);
      setRol(nuevoRol);
      setRoles(rolesActuales);
      setMostrarCambioRol(false);
      if (nuevoRol === 'empresa') window.location.href = '/home-empresa';
      else if (nuevoRol === 'viajero') window.location.href = '/home-viajero';
      else window.location.href = '/home';
    } finally { setCambiandoRol(false); }
  };

  const notifEmoji: any = {
    nueva_aplicacion: '✋', aplicacion_aceptada: '✅', aplicacion_rechazada: '❌',
    trabajo_completado: '🎉', nuevo_trabajo: '🔔', pago_liberado: '💰', mensaje_nuevo: '💬',
  };

  const rolInfo: any = {
    flekser: { emoji: '⚡', label: 'Flekser', color: 'from-blue-600 to-purple-600' },
    empresa: { emoji: '🏢', label: 'Empresa', color: 'from-slate-700 to-blue-900' },
    viajero: { emoji: '✈️', label: 'Viajero', color: 'from-sky-500 to-teal-500' },
  };

  const esEmpresa = rol === 'empresa';
  const inicio = esEmpresa ? '/home-empresa' : rol === 'viajero' ? '/home-viajero' : '/home';
  const perfil = esEmpresa ? '/perfil-empresa' : '/perfil';
  const trabajos = esEmpresa ? '/aplicaciones' : '/mis-trabajos';

  const items = [
    { href: inicio, emoji: '🏠', label: 'Inicio', id: 'inicio' },
    { href: trabajos, emoji: '📋', label: 'Trabajos', id: 'trabajos' },
    { href: null, emoji: '➕', label: 'Nuevo', id: 'nuevo' },
    { href: '/checkin', emoji: '📍', label: 'Check-in', id: 'checkin' },
    { href: '/chat', emoji: '💬', label: 'Mensajes', id: 'chat', badge: mensajesNoLeidos },
    { href: perfil, emoji: '👤', label: 'Perfil', id: 'perfil' },
  ];

  return (
    <>
      {/* Modal notificaciones */}
      {mostrarNotifs && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setMostrarNotifs(false)}>
          <div className="w-full bg-white rounded-t-3xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-lg">Notificaciones</h3>
              <button onClick={() => setMostrarNotifs(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-3">
              {notificaciones.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="#7C3AED"/>
                    </svg>
                  </div>
                  <p className="font-bold text-gray-900 mb-1">Sin notificaciones</p>
                  <p className="text-gray-400 text-sm">Aquí verás tus actualizaciones</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {notificaciones.map((n) => (
                    <a key={n.id} href={n.link || '#'} onClick={() => setMostrarNotifs(false)}
                      className={`flex items-start gap-3 p-3 rounded-2xl transition ${!n.leida ? 'bg-purple-50 border border-purple-100' : 'bg-gray-50'}`}>
                      <span className="text-2xl flex-shrink-0 mt-0.5">{notifEmoji[n.tipo] || '🔔'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm">{n.titulo}</p>
                        {n.mensaje && <p className="text-xs text-gray-500 mt-0.5">{n.mensaje}</p>}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(n.created_at).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!n.leida && <div className="w-2 h-2 bg-purple-600 rounded-full flex-shrink-0 mt-2"/>}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <div className="pb-8"/>
          </div>
        </div>
      )}

      {/* Modal cambio de rol */}
      {mostrarCambioRol && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setMostrarCambioRol(false)}>
          <div className="w-full bg-white rounded-t-3xl p-6 pb-10" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6"/>
            <h3 className="font-extrabold text-gray-900 text-lg mb-1 text-center">Cambiar modo</h3>
            <p className="text-gray-400 text-sm text-center mb-5">Alterna entre tus perfiles sin cerrar sesión</p>
            <div className="flex flex-col gap-3 mb-4">
              {(['flekser', 'empresa', 'viajero'] as string[]).map((r) => {
                const info = rolInfo[r];
                const esActivo = rol === r;
                return (
                  <button key={r} onClick={() => cambiarRolActivo(r)} disabled={cambiandoRol || esActivo}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition ${
                      esActivo ? 'border-transparent bg-gradient-to-r ' + info.color + ' text-white' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${esActivo ? 'bg-white/20' : 'bg-gray-100'}`}>
                      {info.emoji}
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`font-extrabold ${esActivo ? 'text-white' : 'text-gray-900'}`}>Modo {info.label}</p>
                      <p className={`text-xs mt-0.5 ${esActivo ? 'text-white/70' : 'text-gray-400'}`}>
                        {r === 'flekser' ? 'Busca y ofrece servicios' : r === 'empresa' ? 'Gestiona tus solicitudes' : 'Trabaja desde cualquier ciudad'}
                      </p>
                    </div>
                    {esActivo ? (
                      <span className="text-white/80 text-xs font-bold bg-white/20 px-2 py-1 rounded-full">Activo</span>
                    ) : roles.includes(r) ? (
                      <span className="text-gray-400 text-xs font-bold">Cambiar →</span>
                    ) : (
                      <span className="text-xs bg-purple-100 text-purple-600 font-bold px-2 py-1 rounded-full">+ Activar</span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 text-center">Al activar un nuevo modo se agrega permanentemente a tu cuenta</p>
          </div>
        </div>
      )}

      {/* Modal nuevo */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-end" onClick={() => setMostrarModal(false)}>
          <div className="w-full bg-white rounded-t-3xl p-6 pb-10" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6"/>
            <h3 className="font-extrabold text-gray-900 text-lg mb-4 text-center">¿Qué quieres hacer?</h3>
            <div className="flex flex-col gap-3">
              <a href="/publicar" className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold">
                <span className="text-2xl">📋</span>
                <div>
                  <p className="font-extrabold">Publicar solicitud</p>
                  <p className="text-white/70 text-sm font-normal">Necesito que alguien me ayude</p>
                </div>
              </a>
              <a href="/home" className="flex items-center gap-4 p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl font-bold hover:border-purple-400 transition">
                <span className="text-2xl">🔍</span>
                <div>
                  <p className="font-extrabold text-gray-900">Buscar trabajo</p>
                  <p className="text-gray-400 text-sm font-normal">Ver trabajos disponibles cerca de ti</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Nav inferior */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-30">
        <div className="max-w-md mx-auto flex justify-around items-center">
          {items.map((item: any) => {
            const estaActivo = activo === item.id;
            if (item.href === null) {
              return (
                <button key={item.id} onClick={() => setMostrarModal(true)} className="flex flex-col items-center gap-0.5 px-2">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg -mt-5">
                    <span className="text-white text-2xl font-bold">+</span>
                  </div>
                  <span className="text-xs text-gray-400 mt-1">{item.label}</span>
                </button>
              );
            }
            return (
              <a key={item.id} href={item.href} className="relative flex flex-col items-center gap-0.5 px-2">
                <span className="text-xl">{item.emoji}</span>
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-0 w-4 h-4 bg-red-500 text-white text-xs font-extrabold rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
                <span className={`text-xs font-semibold ${estaActivo ? 'text-purple-600' : 'text-gray-400'}`}>{item.label}</span>
              </a>
            );
          })}
        </div>
      </div>
    </>
  );
}