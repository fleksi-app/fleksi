'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const WHATSAPP_URL = 'https://wa.me/5215538850129?text=Hola%20Fleksi%2C%20necesito%20ayuda%20con%20mi%20cuenta';

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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificaciones', filter: `usuario_id=eq.${usuarioId}` },
        () => { cargarNotificaciones(usuarioId); })
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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes', filter: `destinatario_id=eq.${usuarioId}` },
        () => { cargarMensajesNoLeidos(usuarioId); })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mensajes', filter: `destinatario_id=eq.${usuarioId}` },
        () => { cargarMensajesNoLeidos(usuarioId); })
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, [usuarioId]);

  const cargarNotificaciones = async (uid: string) => {
    const { data } = await supabase.from('notificaciones').select('*')
      .eq('usuario_id', uid).order('created_at', { ascending: false }).limit(20);
    setNotificaciones(data || []);
    setNoLeidas((data || []).filter(n => !n.leida).length);
  };

  const cargarMensajesNoLeidos = async (uid: string) => {
    const { count } = await supabase.from('mensajes')
      .select('*', { count: 'exact', head: true })
      .eq('destinatario_id', uid).eq('leido', false);
    setMensajesNoLeidos(count || 0);
  };

  const marcarLeidas = async () => {
    if (!usuarioId) return;
    await supabase.from('notificaciones').update({ leida: true })
      .eq('usuario_id', usuarioId).eq('leida', false);
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
    trabajo_completado: '🎉', nuevo_trabajo: '🔔', pago_liberado: '💰',
    mensaje_nuevo: '💬', nueva_calificacion: '⭐', solicitud_directa: '🎯',
    documento_aprobado: '✅', documento_rechazado: '❌', verificacion_aprobada: '🏆',
    checkin_realizado: '📍', checkout_realizado: '✅', recordatorio_trabajo: '⏰',
  };

  const rolInfo: any = {
    flekser: { emoji: '⚡', label: 'Flekser', color: 'from-blue-600 to-purple-600' },
    empresa: { emoji: '🏢', label: 'Empresa', color: 'from-slate-700 to-blue-900' },
    viajero: { emoji: '✈️', label: 'Viajero', color: 'from-sky-500 to-teal-500' },
  };

  const esEmpresa = rol === 'empresa';
  const esViajero = rol === 'viajero';
  const inicio = esEmpresa ? '/home-empresa' : esViajero ? '/home-viajero' : '/home';
  const perfil = esEmpresa ? '/perfil-empresa' : '/perfil';

  const colorActivo = esEmpresa ? 'text-blue-900' : esViajero ? 'text-teal-600' : 'text-purple-600';
  const colorPlus = esEmpresa ? 'from-slate-700 to-blue-900' : esViajero ? 'from-sky-500 to-teal-500' : 'from-blue-600 to-purple-600';

  const items = [
    { href: inicio, emoji: '🏠', label: 'Inicio', id: 'inicio', clase: 'tour-home' },
    { href: '/catalogo', emoji: '🔍', label: 'Catálogo', id: 'catalogo', clase: '' },
    { href: null, emoji: '+', label: 'Nuevo', id: 'nuevo', clase: 'tour-nuevo' },
    { href: '/chat', emoji: '💬', label: 'Chat', id: 'chat', badge: mensajesNoLeidos, clase: 'tour-chat' },
    { href: perfil, emoji: '👤', label: 'Perfil', id: 'perfil', clase: 'tour-perfil' },
  ];

  return (
    <>
      {mostrarNotifs && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setMostrarNotifs(false)}>
          <div className="w-full bg-white rounded-t-3xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-lg">Notificaciones</h3>
              <div className="flex items-center gap-2">
                {noLeidas > 0 && (
                  <button onClick={marcarLeidas} className="text-xs text-purple-600 font-semibold hover:underline">
                    Marcar todas leídas
                  </button>
                )}
                <button onClick={() => setMostrarNotifs(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">✕</button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-3">
              {notificaciones.length === 0 ? (
                <div className="text-center py-12">
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

      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-end" onClick={() => setMostrarModal(false)}>
          <div className="w-full bg-white rounded-t-3xl p-6 pb-10" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6"/>
            <h3 className="font-extrabold text-gray-900 text-lg mb-4 text-center">¿Qué quieres hacer?</h3>
            <div className="flex flex-col gap-3">
              <a href="/publicar"
                className={`flex items-center gap-4 p-4 bg-gradient-to-r ${colorPlus} text-white rounded-2xl font-bold`}>
                <span className="text-2xl">📋</span>
                <div>
                  <p className="font-extrabold">Publicar solicitud</p>
                  <p className="text-white/70 text-sm font-normal">Necesito que alguien me ayude</p>
                </div>
              </a>
              <a href={inicio}
                className="flex items-center gap-4 p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl font-bold hover:border-purple-400 transition">
                <span className="text-2xl">🔍</span>
                <div>
                  <p className="font-extrabold text-gray-900">Buscar trabajo</p>
                  <p className="text-gray-400 text-sm font-normal">Ver trabajos disponibles</p>
                </div>
              </a>
              <a href="/mis-trabajos"
                className="flex items-center gap-4 p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl font-bold hover:border-purple-400 transition">
                <span className="text-2xl">✋</span>
                <div>
                  <p className="font-extrabold text-gray-900">Mis trabajos</p>
                  <p className="text-gray-400 text-sm font-normal">Ver tus aplicaciones activas</p>
                </div>
              </a>
              <a href="/aplicaciones"
                className="flex items-center gap-4 p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl font-bold hover:border-purple-400 transition">
                <span className="text-2xl">📩</span>
                <div>
                  <p className="font-extrabold text-gray-900">Mis solicitudes</p>
                  <p className="text-gray-400 text-sm font-normal">Ver aplicaciones recibidas</p>
                </div>
              </a>
              <a href="/checkin"
                className="flex items-center gap-4 p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl font-bold hover:border-purple-400 transition">
                <span className="text-2xl">📍</span>
                <div>
                  <p className="font-extrabold text-gray-900">Check-in / Check-out</p>
                  <p className="text-gray-400 text-sm font-normal">Registrar entrada o salida</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante WhatsApp */}
      <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
        className="fixed bottom-20 right-4 z-30 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition hover:scale-110 active:scale-95">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* Nav bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-2 z-30">
        <div className="max-w-md mx-auto flex justify-around items-center">
          {items.map((item: any) => {
            const estaActivo = activo === item.id;

            if (item.href === null) {
              return (
                <button key={item.id} onClick={() => setMostrarModal(true)}
                  className={`flex flex-col items-center gap-0.5 px-3 ${item.clase}`}>
                  <div className={`bg-gradient-to-r ${colorPlus} rounded-2xl flex items-center justify-center shadow-lg -mt-6 w-14 h-14`}>
                    <span className="text-white text-3xl font-bold leading-none">+</span>
                  </div>
                  <span className="text-xs text-gray-400 mt-1 font-semibold">{item.label}</span>
                </button>
              );
            }

            return (
              <a key={item.id} href={item.href}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-1 ${item.clase}`}>
                {item.badge > 0 ? (
                  <div className="relative">
                    <span className="text-xl">{item.emoji}</span>
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-extrabold rounded-full flex items-center justify-center border border-white">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  </div>
                ) : (
                  <span className="text-xl">{item.emoji}</span>
                )}
                <span className={`text-xs font-semibold ${estaActivo ? colorActivo : 'text-gray-400'}`}>
                  {item.label}
                </span>
                {estaActivo && (
                  <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gradient-to-r ${colorPlus}`}/>
                )}
              </a>
            );
          })}
        </div>
      </div>
    </>
  );
}