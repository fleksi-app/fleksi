'use client';
import { useState } from 'react';

const trabajos = [
  { id: 1, emoji: '🍽️', titulo: 'Mesero para evento privado', cliente: 'Ana García', ubicacion: 'Col. Centro, Irapuato', fecha: 'Hoy 7:00 PM', pago: '$200/hr', urgente: false, categoria: 'Eventos' },
  { id: 2, emoji: '🔧', titulo: 'Reparar fuga en fregadero', cliente: 'Roberto Martínez', ubicacion: 'Col. Jardines, Irapuato', fecha: 'Mañana 10:00 AM', pago: '$500 fijo', urgente: true, categoria: 'Hogar' },
  { id: 3, emoji: '🚚', titulo: 'Mover ropero a nueva casa', cliente: 'Laura Sánchez', ubicacion: 'Col. Satelite, Irapuato', fecha: 'Sáb 9:00 AM', pago: '$800 fijo', urgente: false, categoria: 'Mudanza' },
  { id: 4, emoji: '🧹', titulo: 'Limpieza de casa completa', cliente: 'Carlos López', ubicacion: 'Col. Lomas, Irapuato', fecha: 'Mañana 8:00 AM', pago: '$400 fijo', urgente: false, categoria: 'Hogar' },
  { id: 5, emoji: '🍳', titulo: 'Cocinero para cena familiar', cliente: 'María Torres', ubicacion: 'Col. Centro, Irapuato', fecha: 'Hoy 6:00 PM', pago: '$600 fijo', urgente: true, categoria: 'Eventos' },
  { id: 6, emoji: '🚗', titulo: 'Chofer ejecutivo todo el día', cliente: 'Empresa Bajío SA', ubicacion: 'Irapuato → León', fecha: 'Lun 8:00 AM', pago: '$1,500/día', urgente: false, categoria: 'Ejecutivo' },
];

const categorias = ['Todos', 'Hogar', 'Eventos', 'Mudanza', 'Ejecutivo'];

export default function Home() {
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');

  const trabajosFiltrados = trabajos.filter(t => {
    const matchCategoria = categoriaActiva === 'Todos' || t.categoria === categoriaActiva;
    const matchBusqueda = t.titulo.toLowerCase().includes(busqueda.toLowerCase());
    return matchCategoria && matchBusqueda;
  });

  return (
    <main className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <div className="bg-white px-6 pt-12 pb-6 shadow-sm">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-gray-400 text-sm">Buenos días,</p>
              <h1 className="text-xl font-extrabold text-gray-900">Fernando 👋</h1>
            </div>
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              F
            </div>
          </div>

          {/* Balance */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-4 mb-4 text-white">
            <p className="text-sm opacity-80 mb-1">Ganado este mes</p>
            <p className="text-3xl font-extrabold">$3,200 <span className="text-lg font-normal">MXN</span></p>
            <p className="text-sm opacity-70 mt-1">↑ 3 trabajos completados</p>
          </div>

          {/* Buscador */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Buscar trabajos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900 bg-gray-50"
            />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-4">

        {/* Categorías */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaActiva(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                categoriaActiva === cat
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'bg-white text-gray-500 border-2 border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Título */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-extrabold text-gray-900">Trabajos cerca de ti</h2>
          <span className="text-sm text-gray-400">{trabajosFiltrados.length} disponibles</span>
        </div>

        {/* Lista de trabajos */}
        <div className="flex flex-col gap-3">
          {trabajosFiltrados.map((trabajo) => (
            <div key={trabajo.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-95 transition cursor-pointer">
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {trabajo.emoji}
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
                  <p className="text-xs text-gray-400 mt-0.5">{trabajo.cliente}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <p className="text-xs text-gray-400">📍 {trabajo.ubicacion}</p>
                      <p className="text-xs text-gray-400">📅 {trabajo.fecha}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-purple-600 text-sm">{trabajo.pago}</p>
                      <button className="mt-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                        Aplicar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3">
        <div className="max-w-md mx-auto flex justify-around">
          <button className="flex flex-col items-center gap-1">
            <span className="text-xl">🏠</span>
            <span className="text-xs font-bold text-purple-600">Inicio</span>
          </button>
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
          <button className="flex flex-col items-center gap-1">
            <span className="text-xl">👤</span>
            <span className="text-xs text-gray-400">Perfil</span>
          </button>
        </div>
      </div>

    </main>
  );
}