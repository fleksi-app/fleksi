'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export default function Chat() {
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [conversaciones, setConversaciones] = useState<any[]>([]);
  const [conversacionActiva, setConversacionActiva] = useState<any>(null);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [usuario, setUsuario] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const mensajesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { cargarDatos(); }, []);
  useEffect(() => { scrollAbajo(); }, [mensajes]);

  const scrollAbajo = () => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }

    const { data: perfil } = await supabase
      .from('usuarios').select('*').eq('id', user.id).single();
    setUsuario(perfil);

    // Cargar conversaciones únicas
    const { data: msgs } = await supabase
      .from('mensajes')
      .select('*, remitente:remitente_id(nombre), destinatario:destinatario_id(nombre), servicios(titulo)')
      .or(`remitente_id.eq.${user.id},destinatario_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    // Agrupar por servicio
    const convMap = new Map();
    msgs?.forEach(m => {
      const key = m.servicio_id;
      if (!convMap.has(key)) convMap.set(key, m);
    });
    setConversaciones(Array.from(convMap.values()));
    setCargando(false);
  };

  const cargarMensajes = async (conv: any) => {
    setConversacionActiva(conv);
    const { data } = await supabase
      .from('mensajes')
      .select('*, remitente:remitente_id(nombre)')
      .eq('servicio_id', conv.servicio_id)
      .order('created_at', { ascending: true });
    setMensajes(data || []);

    // Marcar como leídos
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('mensajes')
      .update({ leido: true })
      .eq('servicio_id', conv.servicio_id)
      .eq('destinatario_id', user!.id);
  };

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !conversacionActiva || enviando) return;
    setEnviando(true);

    const { data: { user } } = await supabase.auth.getUser();
    const destinatario = conversacionActiva.remitente_id === user!.id
      ? conversacionActiva.destinatario_id
      : conversacionActiva.remitente_id;

    const { data } = await supabase.from('mensajes').insert({
      servicio_id: conversacionActiva.servicio_id,
      remitente_id: user!.id,
      destinatario_id: destinatario,
      contenido: nuevoMensaje.trim(),
    }).select('*, remitente:remitente_id(nombre)').single();

    if (data) {
      setMensajes(prev => [...prev, data]);
      setNuevoMensaje('');
    }
    setEnviando(false);
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

  // Vista de conversación activa
  if (conversacionActiva) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col">

        {/* HEADER */}
        <div className="bg-white px-6 pt-12 pb-4 shadow-sm flex-shrink-0">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <button onClick={() => setConversacionActiva(null)}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
              ←
            </button>
            <div className="flex-1">
              <h2 className="font-extrabold text-gray-900 text-sm leading-tight">
                {conversacionActiva.servicios?.titulo || 'Conversación'}
              </h2>
              <p className="text-xs text-gray-400">
                {conversacionActiva.remitente_id === usuario?.id
                  ? conversacionActiva.destinatario?.nombre
                  : conversacionActiva.remitente?.nombre}
              </p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {(conversacionActiva.remitente_id === usuario?.id
                ? conversacionActiva.destinatario?.nombre
                : conversacionActiva.remitente?.nombre)?.charAt(0) || '?'}
            </div>
          </div>
        </div>

        {/* MENSAJES */}
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
                const esMio = msg.remitente_id === usuario?.id;
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

        {/* INPUT */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="max-w-md mx-auto flex gap-3">
            <input
              type="text"
              placeholder="Escribe un mensaje..."
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && enviarMensaje()}
              className="flex-1 p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900"
            />
            <button onClick={enviarMensaje} disabled={enviando || !nuevoMensaje.trim()}
              className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-xl disabled:opacity-50 transition flex items-center justify-center">
              ➤
            </button>
          </div>
        </div>

      </main>
    );
  }

  // Lista de conversaciones
  return (
    <main className="min-h-screen bg-gray-50 pb-32">

      <div className="bg-white px-6 pt-12 pb-4 shadow-sm">
        <div className="max-w-md mx-auto">
          <h1 className="font-extrabold text-gray-900 text-xl">Mensajes</h1>
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
            <a href="/home"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-sm">
              Ver trabajos disponibles
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {conversaciones.map((conv) => (
              <button key={conv.id} onClick={() => cargarMensajes(conv)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left w-full active:scale-95 transition">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {(conv.remitente_id === usuario?.id
                      ? conv.destinatario?.nombre
                      : conv.remitente?.nombre)?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-gray-900 text-sm">
                        {conv.remitente_id === usuario?.id
                          ? conv.destinatario?.nombre
                          : conv.remitente?.nombre}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(conv.created_at).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{conv.servicios?.titulo}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{conv.contenido}</p>
                  </div>
                  {!conv.leido && conv.destinatario_id === usuario?.id && (
                    <div className="w-3 h-3 bg-purple-600 rounded-full flex-shrink-0"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3">
        <div className="max-w-md mx-auto flex justify-around">
          <a href="/home" className="flex flex-col items-center gap-1">
            <span className="text-xl">🏠</span>
            <span className="text-xs text-gray-400">Inicio</span>
          </a>
          <button className="flex flex-col items-center gap-1">
            <span className="text-xl">🔍</span>
            <span className="text-xs text-gray-400">Buscar</span>
          </button>
          <a href="/mis-trabajos" className="flex flex-col items-center gap-1">
            <span className="text-xl">📋</span>
            <span className="text-xs text-gray-400">Mis trabajos</span>
          </a>
          <a href="/chat" className="flex flex-col items-center gap-1">
            <span className="text-xl">💬</span>
            <span className="text-xs font-bold text-purple-600">Mensajes</span>
          </a>
          <a href="/perfil" className="flex flex-col items-center gap-1">
            <span className="text-xl">👤</span>
            <span className="text-xs text-gray-400">Perfil</span>
          </a>
        </div>
      </div>

    </main>
  );
}