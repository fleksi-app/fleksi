'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const categorias = ['Todos', '🔧 Hogar', '🧹 Limpieza', '🍽️ Eventos', '🚗 Ejecutivo'];

export default function HomeCliente() {
  const [prestadores, setPrestadores] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }

    const { data: perfil } = await supabase
      .from('usuarios').select('*').eq('id', user.id).single();
    setUsuario(perfil);

    const { data: prests } = await supabase
      .from('usuarios')
      .select('*')
      .eq('rol', 'prestador')
      .neq('id', user.id)
      .order('calificacion', { ascending: false });

    setPrestadores(prests || []);
    setCargando(false);
  };

  const prestadoresFiltrados = prestadores.filter(p => {
    const matchBusqueda = p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.habilidades?.some((h: string) => h.toLowerCase().includes(busqueda.toLowerCase()));
    return matchBusqueda;
  });

  if (cargando) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <div className="bg-white px-6 pt-12 pb-6 shadow-sm">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-gray-400 text-sm">Hola,</p>
              <h1 className="text-xl font-extrabold text-gray-900">
                {usuario?.nombre?.split(' ')[0] || 'Bienvenido'} 👋
              </h1>
            </div>
            <a href="/perfil">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                {usuario?.foto_url ? (
                  <img src={usuario.foto_url} alt="perfil" className="w-full h-full object-cover"/>
                ) : (
                  <span className="text-white font-bold text-sm">
                    {usuario?.nombre?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
            </a>
          </div>

          {/* Botón publicar */}
          <a href="/publicar" className="block w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-center shadow-lg hover:opacity-90 transition mb-4">
            + Publicar lo que necesito
          </a>

          {/* Buscador */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input type="text" placeholder="Buscar plomero, mesero, chofer..."
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900 bg-gray-50"/>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-4">

        {/* Categorías */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {categorias.map((cat) => (
            <button key={cat} onClick={() => setCategoriaActiva(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                categoriaActiva === cat
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'bg-white text-gray-500 border-2 border-gray-200'
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Título */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-extrabold text-gray-900">Prestadores cerca de ti</h2>
          <span className="text-sm text-gray-400">{prestadoresFiltrados.length} disponibles</span>
        </div>

        {/* Lista de prestadores */}
        {prestadoresFiltrados.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🔍</p>
            <p className="font-bold text-gray-900 mb-2">No hay prestadores disponibles</p>
            <p className="text-gray-400 text-sm">Intenta con otra búsqueda</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {prestadoresFiltrados.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer active:scale-95 transition">
                <div className="flex gap-3">
                  {/* Foto */}
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-center">
                      {p.foto_url ? (
                        <img src={p.foto_url} alt={p.nombre} className="w-full h-full object-cover"/>
                      ) : (
                        <span className="text-2xl">
                          {p.habilidades?.[0]?.charAt(0) || '👤'}
                        </span>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900">{p.nombre}</h3>
                        <p className="text-sm text-gray-400">
                          {p.habilidades?.[0] || 'Prestador de servicios'}
                        </p>
                      </div>
                    </div>

                    {/* Habilidades */}
                    {p.habilidades?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.habilidades.slice(0, 2).map((h: string) => (
                          <span key={h} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            {h}
                          </span>
                        ))}
                        {p.habilidades.length > 2 && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            +{p.habilidades.length - 2}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-yellow-500 font-semibold">⭐ {p.calificacion || '5.0'}</span>
                        <span className="text-xs text-gray-400">{p.trabajos_completados || 0} trabajos</span>
                      </div>
                      <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                        Contratar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3">
        <div className="max-w-md mx-auto flex justify-around">
          <button className="flex flex-col items-center gap-1">
            <span className="text-xl">🏠</span>
            <span className="text-xs font-bold text-purple-600">Inicio</span>
          </button>
          <a href="/publicar" className="flex flex-col items-center gap-1">
            <span className="text-xl">➕</span>
            <span className="text-xs text-gray-400">Publicar</span>
          </a>
          <a href="/aplicaciones" className="flex flex-col items-center gap-1">
            <span className="text-xl">📋</span>
            <span className="text-xs text-gray-400">Solicitudes</span>
          </a>
          <a href="/chat" className="flex flex-col items-center gap-1">
            <span className="text-xl">💬</span>
            <span className="text-xs text-gray-400">Mensajes</span>
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