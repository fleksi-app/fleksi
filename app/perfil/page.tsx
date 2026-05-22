'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const habilidades = [
  '🧹 Limpieza del hogar', '🌿 Jardinería', '🎨 Pintura',
  '🔧 Mantenimiento general', '⚡ Electricidad', '🚿 Plomería',
  '🚚 Fletes y traslados', '🪑 Armado de muebles', '🔩 Mecánica básica',
  '🔑 Cerrajería', '📺 Instalación TV/repisas/cortinas', '🪵 Carpintería ligera',
  '📦 Mudanza ligera / Ayudante', '👔 Planchado / Lavandería', '💅 Uñas / Estética',
  '🎪 Staff para eventos', '🍽️ Mesero', '🍳 Cocinero particular',
  '🚗 Chofer ejecutivo', '🗣️ Intérprete / Traductor',
];

const todosLosBadges = [
  { tipo: 'nuevo', nombre: 'Nuevo', emoji: '🆕', desc: 'Recién unido a Fleksi' },
  { tipo: 'primer_trabajo', nombre: 'Primer trabajo', emoji: '🎯', desc: 'Completó su primer trabajo' },
  { tipo: 'cinco_trabajos', nombre: '5 trabajos', emoji: '🔥', desc: 'Completó 5 trabajos' },
  { tipo: 'diez_trabajos', nombre: '10 trabajos', emoji: '💎', desc: 'Completó 10 trabajos' },
  { tipo: 'top_rated', nombre: 'Top Rated', emoji: '⭐', desc: 'Calificación 4.8 o más' },
  { tipo: 'perfecto', nombre: 'Perfección', emoji: '✨', desc: 'Calificación perfecta 5.0' },
  { tipo: 'verificado', nombre: 'Verificado', emoji: '✅', desc: 'Identidad verificada' },
  { tipo: 'viajero', nombre: 'Viajero', emoji: '✈️', desc: 'Trabajó en 2+ ciudades' },
];

export default function Perfil() {
  const [usuario, setUsuario] = useState<any>(null);
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [habilidadesSeleccionadas, setHabilidadesSeleccionadas] = useState<string[]>([]);
  const [habilidadCustom, setHabilidadCustom] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [badges, setBadges] = useState<any[]>([]);
  const [reseñas, setReseñas] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { cargarPerfil(); }, []);

  const cargarPerfil = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }

      const { data } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
      if (data) {
        setUsuario({ ...data, id: user.id });
        setNombre(data.nombre || '');
        setTelefono(data.telefono || '');
        setDescripcion(data.descripcion || '');
        setHabilidadesSeleccionadas(data.habilidades || []);
        setFotoUrl(data.foto_url || '');
      }

      // Cargar badges
      const { data: badgesData } = await supabase
        .from('badges').select('*').eq('usuario_id', user.id);
      setBadges(badgesData || []);

      // Cargar reseñas
      const { data: reseñasData } = await supabase
        .from('reseñas')
        .select('*, usuarios!reseñas_cliente_id_fkey(nombre, foto_url)')
        .eq('prestador_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      setReseñas(reseñasData || []);

      // Asignar badges automáticos
      try {
        await supabase.rpc('asignar_badges', { user_id: user.id });
        // Recargar badges después de asignar
        const { data: newBadges } = await supabase
          .from('badges').select('*').eq('usuario_id', user.id);
        setBadges(newBadges || []);
      } catch (e) {}

    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const handleFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !usuario) return;
    setSubiendoFoto(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${usuario.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatares').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatares').getPublicUrl(path);
      const url = urlData.publicUrl + '?t=' + Date.now();
      await supabase.from('usuarios').update({ foto_url: url }).eq('id', usuario.id);
      setFotoUrl(url);
    } catch (err: any) {
      alert('Error al subir foto: ' + err.message);
    } finally {
      setSubiendoFoto(false);
    }
  };

  const guardarPerfil = async () => {
    setGuardando(true);
    await supabase.from('usuarios').update({
      nombre, telefono, descripcion,
      habilidades: habilidadesSeleccionadas,
    }).eq('id', usuario.id);
    setGuardando(false);
    setEditando(false);
    cargarPerfil();
  };

  const toggleHabilidad = (h: string) => {
    setHabilidadesSeleccionadas(prev =>
      prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]
    );
  };

  const agregarHabilidadCustom = () => {
    const val = habilidadCustom.trim();
    if (val && !habilidadesSeleccionadas.includes(val)) {
      setHabilidadesSeleccionadas(prev => [...prev, val]);
      setHabilidadCustom('');
    }
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const tieneBadge = (tipo: string) => badges.some(b => b.tipo === tipo);

  if (cargando) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando perfil...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-32">

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 pt-12 pb-20">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <h1 className="text-white font-extrabold text-xl">Mi Perfil</h1>
          <button onClick={cerrarSesion} className="text-white/70 text-sm hover:text-white transition">
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 -mt-12">

        {/* Tarjeta principal */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                {fotoUrl ? (
                  <img src={fotoUrl} alt="Foto de perfil" className="w-full h-full object-cover"/>
                ) : (
                  <span className="text-white font-extrabold text-2xl">
                    {nombre ? nombre.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
              </div>
              {editando && (
                <button onClick={() => fileInputRef.current?.click()} disabled={subiendoFoto}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs shadow-lg">
                  {subiendoFoto ? '⏳' : '📷'}
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFoto} className="hidden"/>
            </div>

            <div className="flex-1">
              {editando ? (
                <input value={nombre} onChange={(e) => setNombre(e.target.value)}
                  className="w-full p-2 rounded-xl border-2 border-purple-400 outline-none text-gray-900 font-bold mb-1"
                  placeholder="Tu nombre"/>
              ) : (
                <h2 className="font-extrabold text-gray-900 text-lg">{nombre || 'Sin nombre'}</h2>
              )}
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="text-xs bg-purple-100 text-purple-600 font-semibold px-2 py-0.5 rounded-full">
                  {usuario?.rol || 'prestador'}
                </span>
                {tieneBadge('verificado') && (
                  <span className="text-xs bg-green-100 text-green-600 font-semibold px-2 py-0.5 rounded-full">
                    ✅ Verificado
                  </span>
                )}
                {tieneBadge('top_rated') && (
                  <span className="text-xs bg-yellow-100 text-yellow-600 font-semibold px-2 py-0.5 rounded-full">
                    ⭐ Top Rated
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold text-purple-600">{usuario?.calificacion || '5.0'}</p>
              <p className="text-xs text-gray-400">⭐ Calificación</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold text-gray-900">{usuario?.trabajos_completados || '0'}</p>
              <p className="text-xs text-gray-400">Trabajos</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold text-gray-900">{reseñas.length}</p>
              <p className="text-xs text-gray-400">Reseñas</p>
            </div>
          </div>

          {!editando ? (
            <button onClick={() => setEditando(true)}
              className="w-full py-3 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold hover:border-purple-400 transition">
              ✏️ Editar perfil
            </button>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => setEditando(false)}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold transition">
                Cancelar
              </button>
              <button onClick={guardarPerfil} disabled={guardando}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold disabled:opacity-50 transition">
                {guardando ? 'Guardando...' : 'Guardar ✓'}
              </button>
            </div>
          )}
        </div>

        {/* Teléfono */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-extrabold text-gray-900 mb-3">📱 Teléfono</h3>
          {editando ? (
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)}
              className="w-full p-3 rounded-xl border-2 border-purple-400 outline-none text-gray-900"
              placeholder="55 1234 5678"/>
          ) : (
            <p className="text-gray-600">{telefono || 'Sin teléfono registrado'}</p>
          )}
        </div>

        {/* Descripción */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-extrabold text-gray-900 mb-3">📝 Sobre mí</h3>
          {editando ? (
            <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
              rows={3} placeholder="Cuéntale a los clientes sobre ti y tu experiencia..."
              className="w-full p-3 rounded-xl border-2 border-purple-400 outline-none text-gray-900 resize-none"/>
          ) : (
            <p className="text-gray-600">{descripcion || 'Agrega una descripción de tu perfil'}</p>
          )}
        </div>

        {/* Badges */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-extrabold text-gray-900 mb-4">🏅 Insignias</h3>
          <div className="grid grid-cols-4 gap-3">
            {todosLosBadges.map((badge) => {
              const activo = tieneBadge(badge.tipo);
              return (
                <div key={badge.tipo} className={`text-center transition ${!activo ? 'opacity-30' : ''}`}>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-1 mx-auto ${
                    activo ? 'bg-gradient-to-r from-blue-50 to-purple-50 shadow-sm' : 'bg-gray-100'
                  }`}>
                    {badge.emoji}
                  </div>
                  <p className="text-xs text-gray-500 font-semibold leading-tight">{badge.nombre}</p>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 text-center mt-3">
            {badges.length} de {todosLosBadges.length} insignias desbloqueadas
          </p>
        </div>

        {/* Reseñas */}
        {reseñas.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <h3 className="font-extrabold text-gray-900 mb-4">💬 Reseñas recientes</h3>
            <div className="flex flex-col gap-3">
              {reseñas.map((r) => (
                <div key={r.id} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">
                        {r.usuarios?.nombre?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{r.usuarios?.nombre || 'Cliente'}</p>
                      <p className="text-xs text-yellow-500">{'⭐'.repeat(r.estrellas)}</p>
                    </div>
                  </div>
                  {r.comentario && (
                    <p className="text-sm text-gray-600 italic">"{r.comentario}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Habilidades */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-extrabold text-gray-900 mb-3">🛠️ Mis habilidades</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {habilidades.map((h) => (
              <button key={h} onClick={() => editando && toggleHabilidad(h)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition ${
                  habilidadesSeleccionadas.includes(h)
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-gray-100 text-gray-500'
                } ${editando ? 'cursor-pointer' : 'cursor-default'}`}>
                {h}
              </button>
            ))}
            {habilidadesSeleccionadas.filter(h => !habilidades.includes(h)).map((h) => (
              <span key={h} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                {h}
                {editando && (
                  <button onClick={() => toggleHabilidad(h)} className="ml-1 text-white/70 hover:text-white">✕</button>
                )}
              </span>
            ))}
          </div>
          {editando && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
              <input type="text" placeholder="Agregar habilidad personalizada..."
                value={habilidadCustom} onChange={(e) => setHabilidadCustom(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && agregarHabilidadCustom()}
                className="flex-1 p-3 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900 text-sm"/>
              <button onClick={agregarHabilidadCustom}
                className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold text-sm">
                + Agregar
              </button>
            </div>
          )}
          {!editando && habilidadesSeleccionadas.length === 0 && (
            <p className="text-gray-400 text-sm">Edita tu perfil para agregar habilidades</p>
          )}
        </div>

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
          <button className="flex flex-col items-center gap-1">
            <span className="text-xl">📋</span>
            <span className="text-xs text-gray-400">Mis trabajos</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <span className="text-xl">💬</span>
            <span className="text-xs text-gray-400">Mensajes</span>
          </button>
          <a href="/perfil" className="flex flex-col items-center gap-1">
            <span className="text-xl">👤</span>
            <span className="text-xs font-bold text-purple-600">Perfil</span>
          </a>
        </div>
      </div>

    </main>
  );
}