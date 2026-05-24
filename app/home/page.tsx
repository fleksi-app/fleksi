'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Nav from '@/lib/nav';

const categorias = ['Todos', 'Hogar', 'Limpieza', 'Eventos', 'Mudanza', 'Ejecutivo'];

export default function HomeWorker() {
  const [trabajos, setTrabajos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [usuario, setUsuario] = useState<any>(null);
  const [aplicacionesUsuario, setAplicacionesUsuario] = useState<string[]>([]);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }

    const { data: perfil } = await supabase
      .from('usuarios').select('*').eq('id', user.id).single();
    setUsuario(perfil);

    const { data: servicios } = await supabase
      .from('servicios')
      .select('*, usuarios(nombre, calificacion)')
      .eq('estado', 'activo')
      .neq('cliente_id', user.id)
      .order('created_at', { ascending: false });

    setTrabajos(servicios || []);

    const { data: apps } = await supabase
      .from('aplicaciones')
      .select('servicio_id')
      .eq('prestador_id', user.id);
    setAplicacionesUsuario((apps || []).map(a => a.servicio_id));

    setCargando(false);
  };

  const categoriaEmoji: any = {
    hogar: '🔧', limpieza: '🧹', eventos: '🍽️',
    mudanza: '🚚', ejecutivo: '🚗', interprete: '🗣️',
    cocina: '🍳', jardineria: '🌿', mecanica: '🔩',
    cerrajeria: '🔑', estetica: '💅', otro: '✨'
  };

  const trabajosFiltrados = trabajos.filter(t => {
    const matchCat = categoriaActiva === 'Todos' ||
      t.categoria?.toLowerCase().includes(categoriaActiva.toLowerCase());
    const matchBusqueda = t.titulo?.toLowerCase().includes(busqueda.toLowerCase());
    return matchCat && matchBusqueda;
  });

  if (cargando) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando trabajos...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-32">

      <div className="bg-white px-6 pt-12 pb-6 shadow-sm">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-gray-400 text-sm">Buenos días,</p>
              <h1 className="text-xl font-extrabold text-gray-900">
                {usuario?.nombre?.split(' ')[0] || 'Bienvenido'} 👋
              </h1>
            </div>
            <a href="/perfil" className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {usuario?.nombre?.charAt(0).toUpperCase() || 'U'}
            </a>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-4 mb-4 text-white">
            <p className="text-sm opacity-80 mb-1">Trabajos disponibles hoy</p>
            <p className="text-3xl font-extrabold">{trabajos.length} <span className="text-lg font-normal">cerca de ti</span></p>
            <p className="text-sm opacity-70 mt-1">↑ Nuevos trabajos publicados</p>
          </div>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input type="text" placeholder="Buscar trabajos..."
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900 bg-gray-50"/>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-4">

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

        <div className="flex justify-between items-center mb-4">
          <h2 className="font-extrabold text-gray-900">Trabajos cerca de ti</h2>
          <span className="text-sm text-gray-400">{trabajosFiltrados.length} disponibles</span>
        </div>

        {trabajosFiltrados.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🔍</p>
            <p className="font-bold text-gray-900 mb-2">No hay trabajos disponibles</p>
            <p className="text-gray-400 text-sm">Vuelve más tarde o cambia los filtros</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {trabajosFiltrados.map((trabajo) => {
              const yaAplico = aplicacionesUsuario.includes(trabajo.id);
              return (
                <a href={`/trabajo?id=${trabajo.id}`} key={trabajo.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-95 transition block">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                      {categoriaEmoji[trabajo.categoria?.toLowerCase()] || '✨'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-gray-900 text-sm leading-tight">{trabajo.titulo}</h3>
                        {trabajo.urgente && (
                          <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                            🔴 Urgente
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {trabajo.usuarios?.nombre || 'Cliente verificado'}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-400">📅 {trabajo.fecha} {trabajo.hora?.slice(0,5)}</p>
                        <div className="text-right">
                          <p className="font-extrabold text-purple-600 text-sm">${trabajo.presupuesto} MXN</p>
                          <span className={`mt-1 text-xs font-bold px-3 py-1 rounded-full inline-block ${
                            yaAplico
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          }`}>
                            {yaAplico ? '✅ Aplicado' : 'Aplicar'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}

      </div>

      <Nav activo="inicio" />

    </main>
  );
}