'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';
import Nav from '@/lib/nav';
import { Suspense } from 'react';

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

function FondoFlekser() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" style={{opacity:0.12}}>
      <defs>
        <pattern id="patronFlekser" x="0" y="0" width="320" height="260" patternUnits="userSpaceOnUse">
          <g transform="translate(20,40) rotate(-30)">
            <rect x="0" y="3" width="28" height="6" rx="3" fill="#7C3AED"/>
            <circle cx="4" cy="6" r="6" fill="none" stroke="#7C3AED" strokeWidth="3"/>
            <circle cx="24" cy="6" r="4" fill="none" stroke="#7C3AED" strokeWidth="2.5"/>
          </g>
          <g transform="translate(80,20)">
            <rect x="8" y="0" width="3" height="30" rx="1.5" fill="#2563EB"/>
            <path d="M2,30 Q9.5,35 17,30 L14,50 Q9.5,52 5,50 Z" fill="#2563EB"/>
          </g>
          <g transform="translate(150,50) rotate(20)">
            <rect x="5" y="0" width="4" height="20" rx="2" fill="#7C3AED"/>
            <path d="M3,20 Q7,28 11,20 L10,26 Q7,29 4,26 Z" fill="#2563EB"/>
          </g>
          <g transform="translate(220,30)">
            <rect x="0" y="8" width="35" height="16" rx="3" fill="#7C3AED"/>
            <rect x="25" y="4" width="10" height="12" rx="2" fill="#2563EB"/>
            <circle cx="8" cy="25" r="4" fill="#7C3AED"/>
            <circle cx="27" cy="25" r="4" fill="#7C3AED"/>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#patronFlekser)"/>
    </svg>
  );
}

function FondoEmpresa() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" style={{opacity:0.12}}>
      <defs>
        <pattern id="patronEmpresa" x="0" y="0" width="320" height="260" patternUnits="userSpaceOnUse">
          <g transform="translate(15,20)">
            <rect x="0" y="0" width="28" height="50" rx="2" fill="#1e3a8a"/>
          </g>
          <g transform="translate(60,35)">
            <rect x="0" y="0" width="20" height="35" rx="2" fill="#334155"/>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#patronEmpresa)"/>
    </svg>
  );
}

function FondoViajero() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" style={{opacity:0.12}}>
      <defs>
        <pattern id="patronViajero" x="0" y="0" width="320" height="260" patternUnits="userSpaceOnUse">
          <g transform="translate(20,30) rotate(-15)">
            <ellipse cx="20" cy="8" rx="20" ry="6" fill="#0369a1"/>
            <polygon points="40,8 52,4 52,12" fill="#0e7490"/>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#patronViajero)"/>
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

    const filtro = conversacionActiva.servicio_id
      ? `servicio_id=eq.${conversacionActiva.servicio_id}`
      : `remitente_id=eq.${conversacionActiva.remitente_id}`;

    const canal = supabase
      .channel(`chat-${conversacionActiva.servicio_id || conversacionActiva.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'mensajes',
        filter: filtro,
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

    // Agrupar conversaciones — por servicio_id si existe, sino por par de usuarios
    const convMap = new Map();
    msgs?.forEach(m => {
      const key = m.servicio_id
        ? `servicio_${m.servicio_id}`
        : `directo_${[m.remitente_id, m.destinatario_id].sort().join('_')}`;
      if (!convMap.has(key)) convMap.set(key, m);
    });
    const convs = Array.from(convMap.values());
    setConversaciones(convs);

    // Si viene con ?usuario= abrir esa conversación directamente
    if (usuarioDestinoId) {
      const convDirecta = convs.find(c =>
        !c.servicio_id && (
          (c.remitente_id === user.id && c.destinatario_id === usuarioDestinoId) ||
          (c.remitente_id === usuarioDestinoId && c.destinatario_id === user.id)
        )
      );
      if (convDirecta) {
        await cargarMensajesDeConv(convDirecta, user.id);
      }
    }

    setCargando(false);
  };

  const cargarMensajesDeConv = async (conv: any, userId: string) => {
    setConversacionActiva(conv);
    setAdvertencia('');

    let query = supabase
      .from('mensajes')
      .select('*, remitente:remitente_id(id, nombre, foto_url)');

    if (conv.servicio_id) {
      query = query.eq('servicio_id', conv.servicio_id);
    } else {
      // Mensaje directo — buscar por par de usuarios sin servicio
      const otroId = conv.remitente_id === userId ? conv.destinatario_id : conv.remitente_id;
      query = query
        .is('servicio_id', null)
        .or(`and(remitente_id.eq.${userId},destinatario_id.eq.${otroId}),and(remitente_id.eq.${otroId},destinatario_id.eq.${userId})`);
    }

    const { data } = await query.order('created_at', { ascending: true });
    setMensajes(data || []);

    await supabase.from('mensajes').update({ leido: true })
      .eq('destinatario_id', userId).eq('leido', false)
      .is(conv.servicio_id ? null : 'servicio_id', conv.servicio_id ?? null);
  };

  const cargarMensajes = async (conv: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await cargarMensajesDeConv(conv, user.id);
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
  const esViajero = rol === 'viajero';

  const headerGradient = esEmpresa ? 'from-slate-700 to-blue-900' : esViajero ? 'from-sky-500 to-teal-500' : 'from-blue-600 to-purple-600';
  const bubbleGradient = esEmpresa ? 'from-slate-700 to-blue-900' : esViajero ? 'from-sky-500 to-teal-500' : 'from-blue-600 to-purple-600';
  const focusBorder = esEmpresa ? 'focus:border-blue-700' : esViajero ? 'focus:border-teal-400' : 'focus:border-purple-400';
  const dotColor = esEmpresa ? 'bg-blue-800' : esViajero ? 'bg-teal-500' : 'bg-purple-600';
  const avatarGradient = esEmpresa ? 'from-slate-700 to-blue-900' : esViajero ? 'from-sky-500 to-teal-500' : 'from-blue-600 to-purple-600';
  const bgFondo = esEmpresa ? 'bg-slate-100' : esViajero ? 'bg-sky-100' : 'bg-purple-50';
  const spinnerColor = esEmpresa ? 'border-blue-800' : esViajero ? 'border-teal-500' : 'border-purple-600';
  const Fondo = esEmpresa ? FondoEmpresa : esViajero ? FondoViajero : FondoFlekser;

  if (cargando) {
    return (
      <main className={`min-h-screen ${bgFondo} flex items-center justify-center`}>
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
      <main className={`min-h-screen ${bgFondo} flex flex-col pb-16 relative`}>
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <Fondo />
        </div>

        <div className="bg-white/95 backdrop-blur-sm px-6 pt-12 pb-4 shadow-sm flex-shrink-0 relative z-10">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <button onClick={() => { setConversacionActiva(null); cargarDatos(); }}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">←</button>
            <div className="flex-1">
              <h2 className="font-extrabold text-gray-900 text-sm leading-tight">{otroUsuario?.nombre || 'Conversación'}</h2>
              <p className="text-xs text-gray-400">
                {conversacionActiva.servicios?.titulo || 'Mensaje directo'}
              </p>
            </div>
            <div className={`w-10 h-10 bg-gradient-to-r ${avatarGradient} rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden`}>
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
                    <div className={`max-w-xs px-4 py-3 rounded-2xl ${
                      esMio
                        ? `bg-gradient-to-r ${bubbleGradient} text-white rounded-br-sm`
                        : 'bg-white/90 backdrop-blur-sm text-gray-900 shadow-sm border border-gray-100 rounded-bl-sm'
                    }`}>
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
                className={`w-14 h-14 bg-gradient-to-r ${bubbleGradient} text-white rounded-2xl font-bold text-xl disabled:opacity-50 transition flex items-center justify-center`}>
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
    <main className={`min-h-screen ${bgFondo} pb-32 relative`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <Fondo />
      </div>

      <div className={`bg-gradient-to-r ${headerGradient} px-6 pt-12 pb-4 shadow-sm relative z-10`}>
        <div className="max-w-md mx-auto">
          <h1 className="font-extrabold text-white text-xl">Mensajes</h1>
          <p className="text-white/70 text-sm mt-0.5">Coordina tus trabajos de forma segura</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-4 relative z-10">
        {conversaciones.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">💬</p>
            <p className="font-bold text-gray-900 mb-2">Sin mensajes todavía</p>
            <p className="text-gray-400 text-sm mb-6">Cuando apliques a un trabajo o recibas una aplicación, podrás chatear aquí</p>
            <a href="/home" className={`inline-block px-6 py-3 bg-gradient-to-r ${headerGradient} text-white rounded-2xl font-bold text-sm`}>
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
                    <div className={`w-12 h-12 bg-gradient-to-r ${avatarGradient} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden`}>
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
      <main className="min-h-screen bg-purple-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"/>
      </main>
    }>
      <ChatContent />
    </Suspense>
  );
}