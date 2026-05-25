'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
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

export default function Chat() {
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

    const canal = supabase
      .channel(`chat-${conversacionActiva.servicio_id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'mensajes',
        filter: `servicio_id=eq.${conversacionActiva.servicio_id}`,
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
    setTimeout(() => {
      mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }

    const { data: perfil } = await supabase
      .from('usuarios').select('*').eq('id', user.id).single();
    setUsuario({ ...perfil, authId: user.id });

    const { data: msgs } = await supabase
      .from('mensajes')
      .select('*, remitente:remitente_id(id, nombre, foto_url), destinatario:destinatario_id(id, nombre, foto_url), servicios(titulo)')
      .or(`remitente_id.eq.${user.id},destinatario_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    const convMap = new Map();
    msgs?.forEach(m => {
      if (!convMap.has(m.servicio_id)) convMap.set(m.servicio_id, m);
    });
    setConversaciones(Array.from(convMap.values()));
    setCargando(false);
  };

  const cargarMensajes = async (conv: any) => {
    setConversacionActiva(conv);
    setAdvertencia('');
    const { data } = await supabase
      .from('mensajes')
      .select('*, remitente:remitente_id(id, nombre, foto_url)')
      .eq('servicio_id', conv.servicio_id)
      .order('created_at', { ascending: true });
    setMensajes(data || []);

    const { data: { user } } = await supabase.auth.getUser();
    // Marcar como leídos
    await supabase.from('mensajes')
      .update({ leido: true })
      .eq('servicio_id', conv.servicio_id)
      .eq('destinatario_id', user!.id)
      .eq('leido', false);
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
      ? conversacionActiva.destinatario_id
      : conversacionActiva.remitente_id;

    const { data } = await supabase.from('mensajes').insert({
      servicio_id: conversacionActiva.servicio_id,
      remitente_id: user!.id,
      destinatario_id: destinatario,
      contenido: nuevoMensaje.trim(),
    }).select('*, remitente:remitente_id(id, nombre, foto_url)').single();

    if (data) {
      setMensajes(prev => {
        if (prev.find(m => m.id === data.id)) return prev;
        return [...prev, data];
      });
      setNuevoMensaje('');

      // Crear notificación in-app para el destinatario
      try {
        await supabase.from('notificaciones').insert({
          usuario_id: destinatario,
          tipo: 'mensaje_nuevo',
          titulo: `💬 Mensaje de ${usuario?.nombre}`,
          mensaje: nuevoMensaje.trim().slice(0, 60),
          link: '/chat',
        });
      } catch (e) {}
    }
    setEnviando(false);
  };

  const getOtroUsuario = (conv: any) => {
    if (!usuario) return null;
    return conv.remitente?.id === usuario.authId ? conv.destinatario : conv.remitente;
  };

  if (cargando) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando mensajes...</p>
        </div>
      </main>
    );
  }

  if (conversacionActiva) {
    const otroUsuario = getOtroUsuario(conversacionActiva);
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col pb-16">

        <div className="bg-white px-6 pt-12 pb-4 shadow-sm flex-shrink-0">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <button onClick={() => { setConversacionActiva(null); cargarDatos(); }}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
              ←
            </button>
            <div className="flex-1">
              <h2 className="font-extrabold text-gray-900 text-sm leading-tight">
                {otroUsuario?.nombre || 'Conversación'}
              </h2>
              <p className="text-xs text-gray-400">{conversacionActiva.servicios?.titulo}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden">
              {otroUsuario?.foto_url ? (
                <img src={otroUsuario.foto_url} className="w-full h-full object-cover"/>
              ) : (
                otroUsuario?.nombre?.charAt(0) || '?'
              )}
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto w-full px-6 pt-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <span className="text-sm">🔒</span>
            <p className="text-xs text-amber-700 font-medium">Los pagos y contacto se gestionan dentro de Fleksi</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 max-w-md mx-auto w-full">
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
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-sm'
                        : 'bg-white text-gray-900 shadow-sm border border-gray-100 rounded-bl-sm'
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

        <div className="bg-white border-t border-gray-200 px-6 py-3 flex-shrink-0">
          <div className="max-w-md mx-auto">
            {advertencia && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-xl mb-2 text-xs font-semibold">
                {advertencia}
              </div>
            )}
            <div className="flex gap-3">
              <input type="text" placeholder="Escribe un mensaje..."
                value={nuevoMensaje}
                onChange={(e) => {
                  setNuevoMensaje(e.target.value);
                  if (advertencia) setAdvertencia('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && enviarMensaje()}
                className="flex-1 p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900"/>
              <button onClick={enviarMensaje} disabled={enviando || !nuevoMensaje.trim()}
                className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-xl disabled:opacity-50 transition flex items-center justify-center">
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
    <main className="min-h-screen bg-gray-50 pb-32">

      <div className="bg-white px-6 pt-12 pb-4 shadow-sm">
        <div className="max-w-md mx-auto">
          <h1 className="font-extrabold text-gray-900 text-xl">Mensajes</h1>
          <p className="text-gray-400 text-sm mt-0.5">Coordina tus trabajos de forma segura</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-4">
        {conversaciones.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">💬</p>
            <p className="font-bold text-gray-900 mb-2">Sin mensajes todavía</p>
            <p className="text-gray-400 text-sm mb-6">
              Cuando apliques a un trabajo o recibas una aplicación, podrás chatear aquí
            </p>
            <a href="/home" className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-sm">
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
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left w-full active:scale-95 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
                      {otro?.foto_url ? (
                        <img src={otro.foto_url} className="w-full h-full object-cover"/>
                      ) : (
                        otro?.nombre?.charAt(0) || '?'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className={`text-sm ${noLeido ? 'font-extrabold text-gray-900' : 'font-bold text-gray-900'}`}>
                          {otro?.nombre || 'Usuario'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(conv.created_at).toLocaleDateString('es-MX', {day: '2-digit', month: 'short'})}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{conv.servicios?.titulo}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{conv.contenido}</p>
                    </div>
                    {noLeido && (
                      <div className="w-3 h-3 bg-purple-600 rounded-full flex-shrink-0"/>
                    )}
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