'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const WHATSAPP_URL = 'https://wa.me/5215538850129?text=Hola%20Fleksi%2C%20necesito%20ayuda%20con%20mi%20cuenta';
const MORADO = '#7B2FE0';

export default function Nav({ activo }: { activo: string }) {
  const [rol, setRol] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [mostrarMisCosas, setMostrarMisCosas] = useState(false);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0);
  const [usuarioId, setUsuarioId] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [nombreInicial, setNombreInicial] = useState('');

  useEffect(() => {
    const obtenerDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUsuarioId(user.id);
      const { data } = await supabase.from('usuarios').select('rol, rol_activo, roles, foto_url, nombre').eq('id', user.id).single();
      setRol(data?.rol_activo || data?.rol || 'flekser');
      setRoles(data?.roles || [data?.rol || 'flekser']);
      setFotoUrl(data?.foto_url || '');
      setNombreInicial(data?.nombre?.charAt(0)?.toUpperCase() || 'U');
      cargarNotificaciones(user.id);
      cargarMensajesNoLeidos(user.id);
    };
    obtenerDatos();
  }, []);

  useEffect(() => {
    if (!usuarioId) return;
    const canal = supabase.channel('notificaciones-nav')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificaciones', filter: `usuario_id=eq.${usuarioId}` },
        () => { cargarNotificaciones(usuarioId); }).subscribe();
    let bc: BroadcastChannel | null = null;
    try { bc = new BroadcastChannel('fleksi-notifs'); bc.onmessage = (e) => { if (e.data?.type === 'nueva_notificacion') cargarNotificaciones(usuarioId); }; } catch (e) {}
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

  const esEmpresa = rol === 'empresa';
  const inicio = esEmpresa ? '/home-empresa' : '/home';
  const perfil = esEmpresa ? '/perfil-empresa' : '/perfil';

  const items = [
    {
      href: inicio, label: 'Inicio', id: 'inicio',
      icon: (a: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? MORADO : '#94A3B8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/>
        </svg>
      )
    },
    {
      href: '/publicar', label: 'Publicar', id: 'publicar',
      icon: (a: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? MORADO : '#94A3B8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>
        </svg>
      )
    },
    {
      href: null, label: 'Mis cosas', id: 'miscosas',
      icon: (a: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? MORADO : '#94A3B8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      )
    },
    {
      href: '/chat', label: 'Chat', id: 'chat', badge: mensajesNoLeidos,
      icon: (a: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? MORADO : '#94A3B8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
      )
    },
    {
      href: perfil, label: 'Perfil', id: 'perfil',
      icon: (a: boolean) => fotoUrl ? (
        <div className="w-6 h-6 rounded-full overflow-hidden" style={{border: a ? `2px solid ${MORADO}` : '2px solid #E5E7EB'}}>
          <img src={fotoUrl} alt="perfil" className="w-full h-full object-cover"/>
        </div>
      ) : (
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{background: a ? MORADO : '#94A3B8'}}>
          {nombreInicial}
        </div>
      )
    },
  ];

  return (
    <>
      {/* Modal Mis cosas */}
      {mostrarMisCosas && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-end" onClick={() => setMostrarMisCosas(false)}>
          <div className="w-full bg-white rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-5"/>
            <h3 className="font-extrabold text-gray-900 text-lg mb-4 text-center">Mis cosas</h3>
            <div className="flex flex-col gap-3">
              <a href="/mis-trabajos" onClick={() => setMostrarMisCosas(false)}
                className="flex items-center gap-4 p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl hover:border-purple-200 transition">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{background: '#F5F0FF'}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={MORADO} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
                  </svg>
                </div>
                <div>
                  <p className="font-extrabold text-gray-900">Mis trabajos</p>
                  <p className="text-gray-400 text-sm">Trabajos a los que aplicaste</p>
                </div>
                <span className="ml-auto text-gray-400">→</span>
              </a>
              <a href="/aplicaciones" onClick={() => setMostrarMisCosas(false)}
                className="flex items-center gap-4 p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl hover:border-purple-200 transition">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{background: '#F5F0FF'}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={MORADO} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                  </svg>
                </div>
                <div>
                  <p className="font-extrabold text-gray-900">Mis solicitudes</p>
                  <p className="text-gray-400 text-sm">Solicitudes que publicaste</p>
                </div>
                <span className="ml-auto text-gray-400">→</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Botón WhatsApp */}
      <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
        className="fixed bottom-20 right-4 z-30 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition active:scale-95">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* Nav bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30" style={{paddingBottom: 'env(safe-area-inset-bottom)'}}>
        <div className="max-w-md mx-auto flex justify-around items-center px-2 pt-2 pb-2">
          {items.map((item: any) => {
            const estaActivo = activo === item.id;
            if (item.href === null) {
              return (
                <button key={item.id} onClick={() => setMostrarMisCosas(true)}
                  className="relative flex flex-col items-center gap-0.5 px-3 py-1">
                  <div className="relative">
                    {item.icon(estaActivo)}
                  </div>
                  <span className="text-xs font-semibold" style={{color: estaActivo ? MORADO : '#94A3B8'}}>{item.label}</span>
                  {estaActivo && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full" style={{backgroundColor: MORADO}}/>}
                </button>
              );
            }
            return (
              <a key={item.id} href={item.href} className="relative flex flex-col items-center gap-0.5 px-3 py-1">
                <div className="relative">
                  {item.icon(estaActivo)}
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-extrabold rounded-full flex items-center justify-center border border-white" style={{fontSize: '9px'}}>
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold" style={{color: estaActivo ? MORADO : '#94A3B8'}}>{item.label}</span>
                {estaActivo && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full" style={{backgroundColor: MORADO}}/>}
              </a>
            );
          })}
        </div>
      </div>
    </>
  );
}