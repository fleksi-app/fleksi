'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';
import Nav from '@/lib/nav';

function contienetelefono(texto: string): boolean {
  const patrones = [
    /\b\d{10}\b/,
    /\b\d{3}[\s\-\.]\d{3}[\s\-\.]\d{4}\b/,
    /\b\d{2}[\s\-]\d{4}[\s\-]\d{4}\b/,
    /\(\d{2,3}\)\s?\d{3,4}[\s\-]\d{4}/,
    /\+52\s?\d{10}/,
    /whatsapp/i,
    /wsp/i,
    /wa\.me/i,
  ];
  return patrones.some(p => p.test(texto));
}

function FondoIconos() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" style={{opacity: 0.07}}>
      <defs>
        <pattern id="patronIconos" x="0" y="0" width="300" height="250" patternUnits="userSpaceOnUse">
          {/* Casa */}
          <g transform="translate(20,20)"><path d="M3 19V9.5L12 3l9 6.5V19a1 1 0 01-1 1H4a1 1 0 01-1-1z" fill="none" stroke="#7B2FE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 20V12h6v8" stroke="#7B2FE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></g>
          {/* Llave */}
          <g transform="translate(80,15)"><rect x="3" y="9" width="14" height="9" rx="2" fill="none" stroke="#7B2FE0" strokeWidth="2"/><path d="M7 9V7a4 4 0 018 0v2" stroke="#7B2FE0" strokeWidth="2" strokeLinecap="round"/></g>
          {/* Chat */}
          <g transform="translate(140,18)"><path d="M18 12a2 2 0 01-2 2H5l-3 3V4a2 2 0 012-2h12a2 2 0 012 2z" fill="none" stroke="#7B2FE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></g>
          {/* Camión */}
          <g transform="translate(200,15)"><rect x="1" y="3" width="13" height="11" rx="2" fill="none" stroke="#7B2FE0" strokeWidth="2"/><path d="M14 7h3l2.5 2.5V14h-5.5V7z" stroke="#7B2FE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="5" cy="15" r="2" stroke="#7B2FE0" strokeWidth="2"/><circle cx="16" cy="15" r="2" stroke="#7B2FE0" strokeWidth="2"/></g>
          {/* Estrella */}
          <g transform="translate(258,18)"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" fill="none" stroke="#7B2FE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></g>

          {/* Carrito */}
          <g transform="translate(10,80)"><circle cx="7" cy="17" r="1.5" stroke="#7B2FE0" strokeWidth="2"/><circle cx="16" cy="17" r="1.5" stroke="#7B2FE0" strokeWidth="2"/><path d="M1 1h3l2 11h10l1.5-7H5" stroke="#7B2FE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></g>
          {/* Herramienta */}
          <g transform="translate(65,75)"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l2.5-2.5a5 5 0 01-6.4 6.4L7.4 19a2 2 0 01-2.8-2.8l5.9-5.9a5 5 0 016.4-6.4l-2.2 2.2z" fill="none" stroke="#7B2FE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></g>
          {/* Notif */}
          <g transform="translate(120,78)"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" fill="none" stroke="#7B2FE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21a2 2 0 01-3.46 0" stroke="#7B2FE0" strokeWidth="2" strokeLinecap="round"/></g>
          {/* Calendario */}
          <g transform="translate(175,75)"><path d="M6 2v4M14 2v4M2 9h16M4 4h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" fill="none" stroke="#7B2FE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></g>
          {/* Escudo */}
          <g transform="translate(230,76)"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" stroke="#7B2FE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></g>
          {/* Corazón */}
          <g transform="translate(265,80)"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill="none" stroke="#7B2FE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></g>

          {/* Tarjeta */}
          <g transform="translate(15,148)"><rect x="1" y="4" width="18" height="13" rx="2" fill="none" stroke="#7B2FE0" strokeWidth="2"/><path d="M1 9h18" stroke="#7B2FE0" strokeWidth="2"/></g>
          {/* Persona */}
          <g transform="translate(65,145)"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" fill="none" stroke="#7B2FE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="7" r="4" fill="none" stroke="#7B2FE0" strokeWidth="2"/></g>
          {/* Pincel */}
          <g transform="translate(120,148)"><path d="M3 21l9-9M12.5 8.5L16 5l3 3-7.5 7.5" fill="none" stroke="#7B2FE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 6l1.5-1.5a2.1 2.1 0 013 3L18 9" fill="none" stroke="#7B2FE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></g>
          {/* Hoja */}
          <g transform="translate(175,148)"><path d="M12 22V12M12 12C12 12 7 10 5 6c3 0 5.5 1.5 7 6zM12 12c0 0 5-2 7-6-3 0-5.5 1.5-7 6z" fill="none" stroke="#7B2FE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></g>
          {/* Reloj */}
          <g transform="translate(232,145)"><circle cx="10" cy="10" r="9" fill="none" stroke="#7B2FE0" strokeWidth="2"/><path d="M10 5v5l3 3" fill="none" stroke="#7B2FE0" strokeWidth="2" strokeLinecap="round"/></g>
          {/* Archivo */}
          <g transform="translate(268,148)"><path d="M13 2H6a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V7z" fill="none" stroke="#7B2FE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 2v5h5M9 12h4M9 16h4" stroke="#7B2FE0" strokeWidth="2" strokeLinecap="round"/></g>

          {/* Rayo */}
          <g transform="translate(40,210)"><path d="M13 2L4.09 12.5H11L10 22l8.91-10.5H13z" fill="none" stroke="#7B2FE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></g>
          {/* Coche */}
          <g transform="translate(90,208)"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h9a2 2 0 012 2v3" fill="none" stroke="#7B2FE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="9" y="11" width="11" height="8" rx="2" fill="none" stroke="#7B2FE0" strokeWidth="2"/><circle cx="11" cy="19" r="1" stroke="#7B2FE0" strokeWidth="2"/><circle cx="17" cy="19" r="1" stroke="#7B2FE0" strokeWidth="2"/></g>
          {/* Check */}
          <g transform="translate(155,212)"><path d="M20 6L9 17l-5-5" fill="none" stroke="#7B2FE0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></g>
          {/* Ubicación */}
          <g transform="translate(195,208)"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="none" stroke="#7B2FE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="9" r="2.5" fill="none" stroke="#7B2FE0" strokeWidth="2"/></g>
          {/* Barras */}
          <g transform="translate(240,210)"><rect x="0" y="10" width="5" height="10" rx="1" fill="#7B2FE0"/><rect x="7" y="5" width="5" height="15" rx="1" fill="#7B2FE0"/><rect x="14" y="0" width="5" height="20" rx="1" fill="#7B2FE0"/></g>
          {/* Estrellas pequeñas */}
          <g transform="translate(275,212)"><circle cx="4" cy="4" r="3" fill="none" stroke="#7B2FE0" strokeWidth="2"/><circle cx="14" cy="14" r="3" fill="none" stroke="#7B2FE0" strokeWidth="2"/><line x1="7" y1="4" x2="11" y2="14" stroke="#7B2FE0" strokeWidth="1.5" strokeLinecap="round"/></g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#patronIconos)"/>
    </svg>
  );
}



function ChatContent() {
  const searchParams = useSearchParams();
  const usuarioDestinoId = searchParams.get('usuario');
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [conversaciones, setConversaciones] = useState<any[]>([]);
  const [conversacionActiva, setConversacionActiva] = useState<any>(null);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [usuario, setUsuario] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [advertencia, setAdvertencia] = useState('');
  const mensajesEndRef = useRef<HTMLDivElement>(null);
  const canalRef = useRef<any>(null);

  useEffect(() => { cargarDatos(); }, []);
  useEffect(() => { scrollAbajo(); }, [mensajes]);

  useEffect(() => {
    if (!conversacionActiva || !usuario) return;
    if (canalRef.current) supabase.removeChannel(canalRef.current);
    const canalId = conversacionActiva.servicio_id
      ? `chat-${conversacionActiva.servicio_id}`
      : `chat-directo-${[conversacionActiva.remitente_id, conversacionActiva.destinatario_id].sort().join('-')}`;
    const canal = supabase
      .channel(canalId)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'mensajes',
        filter: conversacionActiva.servicio_id
          ? `servicio_id=eq.${conversacionActiva.servicio_id}`
          : `remitente_id=eq.${conversacionActiva.remitente_id}`,
      }, (payload) => {
        const msg = payload.new as any;
        setMensajes(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        scrollAbajo();
      })
      .subscribe();
    canalRef.current = canal;
    return () => { supabase.removeChannel(canal); };
  }, [conversacionActiva, usuario]);

  const scrollAbajo = () => {
    setTimeout(() => { mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
  };

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    const { data: perfil } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
    setUsuario({ ...perfil, authId: user.id });
    const { data: msgs } = await supabase
      .from('mensajes')
      .select('*, remitente:remitente_id(id, nombre, foto_url), destinatario:destinatario_id(id, nombre, foto_url), servicios(titulo)')
      .or(`remitente_id.eq.${user.id},destinatario_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    const convMap = new Map();
    msgs?.forEach(m => {
      const key = m.servicio_id
        ? `servicio_${m.servicio_id}`
        : `directo_${[m.remitente_id, m.destinatario_id].sort().join('_')}`;
      if (!convMap.has(key)) convMap.set(key, m);
    });
    const convs = Array.from(convMap.values());
    setConversaciones(convs);
    if (usuarioDestinoId) {
      const convDirecta = convs.find(c =>
        !c.servicio_id && (
          (c.remitente_id === user.id && c.destinatario_id === usuarioDestinoId) ||
          (c.remitente_id === usuarioDestinoId && c.destinatario_id === user.id)
        )
      );
      if (convDirecta) await cargarMensajesInterna(convDirecta, user.id);
    }
    setCargando(false);
  };

  const cargarMensajesInterna = async (conv: any, userId: string) => {
    setConversacionActiva(conv);
    setAdvertencia('');
    let query = supabase
      .from('mensajes')
      .select('*, remitente:remitente_id(id, nombre, foto_url)');
    if (conv.servicio_id) {
      query = query.eq('servicio_id', conv.servicio_id);
    } else {
      const otroId = conv.remitente_id === userId ? conv.destinatario_id : conv.remitente_id;
      query = (query as any).is('servicio_id', null)
        .or(`and(remitente_id.eq.${userId},destinatario_id.eq.${otroId}),and(remitente_id.eq.${otroId},destinatario_id.eq.${userId})`);
    }
    const { data } = await query.order('created_at', { ascending: true });
    setMensajes(data || []);
    await supabase.from('mensajes').update({ leido: true })
      .eq('destinatario_id', userId).eq('leido', false);
  };

  const cargarMensajes = async (conv: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await cargarMensajesInterna(conv, user.id);
  };

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !conversacionActiva || enviando) return;
    if (contienetelefono(nuevoMensaje)) {
      setAdvertencia('🔒 No puedes compartir números de teléfono. Usa Fleksi para coordinar tu trabajo.');
      return;
    }
    setEnviando(true);
    setAdvertencia('');
    const { data: { user } } = await supabase.auth.getUser();
    const destinatario = conversacionActiva.remitente_id === user!.id
      ? conversacionActiva.destinatario_id : conversacionActiva.remitente_id;
    const { data } = await supabase.from('mensajes').insert({
      servicio_id: conversacionActiva.servicio_id || null,
      remitente_id: user!.id,
      destinatario_id: destinatario,
      contenido: nuevoMensaje.trim(),
    }).select('*, remitente:remitente_id(id, nombre, foto_url)').single();
    if (data) {
      setMensajes(prev => { if (prev.find(m => m.id === data.id)) return prev; return [...prev, data]; });
      setNuevoMensaje('');
      try {
        await supabase.from('notificaciones').insert({
          usuario_id: destinatario, tipo: 'mensaje_nuevo',
          titulo: `💬 Mensaje de ${usuario?.nombre}`,
          mensaje: nuevoMensaje.trim().slice(0, 60), link: '/chat',
        });
      } catch (e) {}
      try {
        const bc = new BroadcastChannel('fleksi-notifs');
        bc.postMessage({ type: 'nueva_notificacion' });
        bc.close();
      } catch (e) {}
    }
    setEnviando(false);
  };

  const getOtroUsuario = (conv: any) => {
    if (!usuario) return null;
    return conv.remitente?.id === usuario.authId ? conv.destinatario : conv.remitente;
  };

  const rol = usuario?.rol_activo || usuario?.rol || 'flekser';
  const esEmpresa = rol === 'empresa';

  const MORADO = '#7B2FE0';

  const focusBorder = 'focus:border-purple-400';
  const dotColor = 'bg-purple-600';

  const bgFondo = '#F8FAFC';
  const spinnerColor = 'border-purple-600';
  const Fondo = FondoIconos;

  if (cargando) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{background: bgFondo}}>
        <div className="text-center">
          <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${spinnerColor}`}></div>
          <p className="text-gray-400">Cargando mensajes...</p>
        </div>
      </main>
    );
  }

  if (conversacionActiva) {
    const otroUsuario = getOtroUsuario(conversacionActiva);
    return (
      <main className="min-h-screen flex flex-col pb-16 relative" style={{background: bgFondo}}>
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <Fondo />
        </div>

        <div className="bg-white/95 backdrop-blur-sm px-6 pt-12 pb-4 shadow-sm flex-shrink-0 relative z-10">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <button onClick={() => { setConversacionActiva(null); cargarDatos(); }}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">←</button>
            <div className="flex-1">
              <h2 className="font-extrabold text-gray-900 text-sm leading-tight">{otroUsuario?.nombre || 'Conversación'}</h2>
              <p className="text-xs text-gray-400">{conversacionActiva.servicios?.titulo || 'Mensaje directo'}</p>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden" style={{background: MORADO}}>
              {otroUsuario?.foto_url ? <img src={otroUsuario.foto_url} className="w-full h-full object-cover"/> : otroUsuario?.nombre?.charAt(0) || '?'}
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto w-full px-6 pt-3 relative z-10">
          <div className="bg-amber-50/90 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <span className="text-sm">🔒</span>
            <p className="text-xs text-amber-700 font-medium">Los pagos y contacto se gestionan dentro de Fleksi</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 max-w-md mx-auto w-full relative z-10">
          {mensajes.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-4">💬</p>
              <p className="font-bold text-gray-900 mb-2">Inicia la conversación</p>
              <p className="text-gray-400 text-sm">Escribe un mensaje para comenzar</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {mensajes.map((msg) => {
                const esMio = msg.remitente_id === usuario?.authId;
                return (
                  <div key={msg.id} className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-3 rounded-2xl ${esMio ? 'text-white rounded-br-sm' : 'bg-white/90 backdrop-blur-sm text-gray-900 shadow-sm border border-gray-100 rounded-bl-sm'}`} style={esMio ? {background: MORADO} : {}}>
                      <p className="text-sm">{msg.contenido}</p>
                      <p className={`text-xs mt-1 ${esMio ? 'text-white/60' : 'text-gray-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('es-MX', {hour: '2-digit', minute: '2-digit'})}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={mensajesEndRef}/>
            </div>
          )}
        </div>

        <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200 px-6 py-3 flex-shrink-0 relative z-10">
          <div className="max-w-md mx-auto">
            {advertencia && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-xl mb-2 text-xs font-semibold">{advertencia}</div>
            )}
            <div className="flex gap-3">
              <input type="text" placeholder="Escribe un mensaje..."
                value={nuevoMensaje}
                onChange={(e) => { setNuevoMensaje(e.target.value); if (advertencia) setAdvertencia(''); }}
                onKeyDown={(e) => e.key === 'Enter' && enviarMensaje()}
                className={`flex-1 p-4 rounded-2xl border-2 border-gray-200 ${focusBorder} outline-none transition text-gray-900`}/>
              <button onClick={enviarMensaje} disabled={enviando || !nuevoMensaje.trim()}
                className="w-14 h-14 text-white rounded-2xl font-bold text-xl disabled:opacity-50 transition flex items-center justify-center" style={{background: MORADO}}>
                ➤
              </button>
            </div>
          </div>
        </div>

        <Nav activo="chat" />
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-32 relative" style={{background: bgFondo}}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <Fondo />
      </div>

      <div className="bg-white px-6 pt-12 pb-4 shadow-sm border-b border-gray-100 relative z-10">
        <div className="max-w-md mx-auto">
          <h1 className="font-extrabold text-gray-900 text-xl">Mensajes</h1>
          <p className="text-gray-400 text-sm mt-0.5">Coordina tus trabajos de forma segura</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-4 relative z-10">
        {conversaciones.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">💬</p>
            <p className="font-bold text-gray-900 mb-2">Sin mensajes todavía</p>
            <p className="text-gray-400 text-sm mb-6">Cuando apliques a un trabajo o recibas una aplicación, podrás chatear aquí</p>
            <a href="/home" className="inline-block px-6 py-3 text-white rounded-2xl font-bold text-sm" style={{background: MORADO}}>
              Ver trabajos disponibles
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {conversaciones.map((conv) => {
              const otro = getOtroUsuario(conv);
              const noLeido = !conv.leido && conv.destinatario_id === usuario?.authId;
              return (
                <button key={conv.id} onClick={() => cargarMensajes(conv)}
                  className="bg-white/70 rounded-2xl p-4 shadow-sm border border-white/80 text-left w-full active:scale-95 transition backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden" style={{background: MORADO}}>
                      {otro?.foto_url ? <img src={otro.foto_url} className="w-full h-full object-cover"/> : otro?.nombre?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className={`text-sm ${noLeido ? 'font-extrabold text-gray-900' : 'font-bold text-gray-900'}`}>{otro?.nombre || 'Usuario'}</p>
                        <p className="text-xs text-gray-400">{new Date(conv.created_at).toLocaleDateString('es-MX', {day: '2-digit', month: 'short'})}</p>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{conv.servicios?.titulo || 'Mensaje directo'}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{conv.contenido}</p>
                    </div>
                    {noLeido && <div className={`w-3 h-3 ${dotColor} rounded-full flex-shrink-0`}/>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Nav activo="chat" />
    </main>
  );
}

export default function Chat() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center" style={{background: '#F8FAFC'}}>
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"/>
      </main>
    }>
      <ChatContent />
    </Suspense>
  );
}