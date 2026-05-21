'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Perfil() {
  const [usuario, setUsuario] = useState<any>(null);
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const habilidades = ['🔧 Plomería', '⚡ Electricidad', '🍽️ Mesero', '🧹 Limpieza', '🚗 Chofer', '🍳 Cocina', '🔨 Carpintería', '🎨 Pintura'];
  const [habilidadesSeleccionadas, setHabilidadesSeleccionadas] = useState<string[]>([]);

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    const { data } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
    if (data) {
      setUsuario(data);
      setNombre(data.nombre || '');
      setTelefono(data.telefono || '');
      setDescripcion(data.descripcion || '');
      setHabilidadesSeleccionadas(data.habilidades || []);
    }
    setCargando(false);
  };

  const guardarPerfil = async () => {
    setGuardando(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('usuarios').update({
      nombre, telefono, descripcion,
      habilidades: habilidadesSeleccionadas,
    }).eq('id', user!.id);
    setGuardando(false);
    setEditando(false);
    cargarPerfil();
  };

  const toggleHabilidad = (h: string) => {
    setHabilidadesSeleccionadas(prev =>
      prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]
    );
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

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

      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 pt-12 pb-20">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <h1 className="text-white font-extrabold text-xl">Mi Perfil</h1>
          <button onClick={cerrarSesion} className="text-white/70 text-sm hover:text-white transition">
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 -mt-12">

        {/* Tarjeta de perfil */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl flex-shrink-0">
              {nombre ? nombre.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1">
              {editando ? (
                <input value={nombre} onChange={(e) => setNombre(e.target.value)}
                  className="w-full p-2 rounded-xl border-2 border-purple-400 outline-none text-gray-900 font-bold mb-1"
                  placeholder="Tu nombre"/>
              ) : (
                <h2 className="font-extrabold text-gray-900 text-lg">{nombre || 'Sin nombre'}</h2>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs bg-purple-100 text-purple-600 font-semibold px-2 py-0.5 rounded-full">
                  {usuario?.rol || 'prestador'}
                </span>
                {usuario?.verificado && (
                  <span className="text-xs bg-green-100 text-green-600 font-semibold px-2 py-0.5 rounded-full">
                    ✅ Verificado
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
              <p className="text-2xl font-extrabold text-gray-900">0</p>
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
                className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold hover:border-gray-400 transition">
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

        {/* Habilidades */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-extrabold text-gray-900 mb-3">🛠️ Mis habilidades</h3>
          <div className="flex flex-wrap gap-2">
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
          </div>
          {!editando && habilidadesSeleccionadas.length === 0 && (
            <p className="text-gray-400 text-sm mt-2">Edita tu perfil para agregar habilidades</p>
          )}
        </div>

        {/* Insignias */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-extrabold text-gray-900 mb-3">🏅 Insignias</h3>
          <div className="flex gap-3">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl mb-1">🆕</div>
              <p className="text-xs text-gray-400">Nuevo</p>
            </div>
            <div className="text-center opacity-40">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl mb-1">⭐</div>
              <p className="text-xs text-gray-400">Top rated</p>
            </div>
            <div className="text-center opacity-40">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl mb-1">🔥</div>
              <p className="text-xs text-gray-400">10 trabajos</p>
            </div>
            <div className="text-center opacity-40">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl mb-1">✈️</div>
              <p className="text-xs text-gray-400">Viajero</p>
            </div>
          </div>
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