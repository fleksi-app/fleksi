'use client';
import { useState } from 'react';

const prestadores = [
  { id: 1, nombre: 'Carlos Mendoza', emoji: '🔧', skill: 'Plomero', calificacion: 4.9, trabajos: 47, precio: '$180/hr', distancia: '1.2 km', disponible: true, urgente: false },
  { id: 2, nombre: 'Ana Martínez', emoji: '🧹', skill: 'Limpieza', calificacion: 4.8, trabajos: 83, precio: '$150/hr', distancia: '0.8 km', disponible: true, urgente: false },
  { id: 3, nombre: 'Roberto Silva', emoji: '🍽️', skill: 'Mesero', calificacion: 4.7, trabajos: 31, precio: '$200/hr', distancia: '2.1 km', disponible: true, urgente: true },
  { id: 4, nombre: 'Laura Gómez', emoji: '🍳', skill: 'Cocinera', calificacion: 5.0, trabajos: 62, precio: '$250/hr', distancia: '1.5 km', disponible: true, urgente: false },
  { id: 5, nombre: 'Miguel Torres', emoji: '🚗', skill: 'Chofer ejecutivo', calificacion: 4.9, trabajos: 128, precio: '$1,200/día', distancia: '3.0 km', disponible: false, urgente: false },
  { id: 6, nombre: 'Sofia Reyes', emoji: '🗣️', skill: 'Intérprete inglés', calificacion: 4.8, trabajos: 19, precio: '$300/hr', distancia: '1.8 km', disponible: true, urgente: false },
];

const categorias = ['Todos', '🔧 Hogar', '🧹 Limpieza', '🍽️ Eventos', '🚗 Ejecutivo'];

export default function HomeCliente() {
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');

  const prestadoresFiltrados = prestadores.filter(p => {
    const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.skill.toLowerCase().includes(busqueda.toLowerCase());
    return matchBusqueda;
  });

  return (
    <main className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <div className="bg-white px-6 pt-12 pb-6 shadow-sm">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-gray-400 text-sm">Hola,</p>
              <h1 className="text-xl font-extrabold text-gray-900">¿Qué necesitas hoy? 👋</h1>
            </div>
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              F
            </div>
          </div>

          {/* Botón publicar */}
          <a href="/publicar" className="block w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-center shadow-lg hover:opacity-90 transition mb-4">
            + Publicar lo que necesito
          </a>

          {/* Buscador */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Buscar plomero, mesero, chofer..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900 bg-gray-50"
            />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-4">

        {/* Categorías */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
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
          <h2 className="font-extrabold text-gray-900">Prestadores cerca de ti</h2>
          <span className="text-sm text-gray-400">{prestadoresFiltrados.length} disponibles</span>
        </div>

        {/* Lista de prestadores */}
        <div className="flex flex-col gap-3">
          {prestadoresFiltrados.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer active:scale-95 transition">
              <div className="flex gap-3">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 relative">
                  {p.emoji}
                  {p.disponible && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900">{p.nombre}</h3>
                      <p className="text-sm text-gray-400">{p.skill}</p>
                    </div>
                    {p.urgente && (
                      <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                        🔴 Urgente
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-yellow-500">⭐ {p.calificacion}</span>
                      <span className="text-xs text-gray-400">{p.trabajos} trabajos</span>
                      <span className="text-xs text-gray-400">📍 {p.distancia}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-extrabold text-purple-600 text-sm">{p.precio}</span>
                    <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                      Contratar
                    </button>
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
          <a href="/publicar" className="flex flex-col items-center gap-1">
            <span className="text-xl">➕</span>
            <span className="text-xs text-gray-400">Publicar</span>
          </a>
          <button className="flex flex-col items-center gap-1">
            <span className="text-xl">📋</span>
            <span className="text-xs text-gray-400">Mis solicitudes</span>
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