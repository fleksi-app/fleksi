'use client';
import { useState } from 'react';

export default function DetalleTrabajo() {
  const [aplicado, setAplicado] = useState(false);
  const [mostrarOferta, setMostrarOferta] = useState(false);
  const [miPrecio, setMiPrecio] = useState('');
  const [mensaje, setMensaje] = useState('');

  const trabajo = {
    emoji: '🔧',
    titulo: 'Reparar fuga en fregadero',
    cliente: 'Roberto Martínez',
    calificacion: '4.8',
    reviews: 12,
    ubicacion: 'Col. Jardines, Irapuato, Gto.',
    fecha: 'Mañana 10:00 AM',
    duracion: '2-3 horas estimadas',
    pago: '$500',
    tipo: 'Precio fijo',
    urgente: true,
    descripcion: 'Tengo una fuga en el fregadero de la cocina, el tubo de abajo está goteando constantemente. Necesito que alguien lo revise y repare lo antes posible. Cuento con algunas herramientas básicas en casa.',
    requisitos: ['Experiencia en plomería', 'Traer herramientas propias', 'Puntualidad'],
    seguro: true,
  };

  if (aplicado) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">¡Aplicación enviada!</h1>
          <p className="text-gray-400 mb-8 font-light">
            Roberto Martínez recibirá tu solicitud y te contactará pronto.
          </p>
          <div className="bg-white rounded-2xl p-4 mb-6 text-left border border-gray-100">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400 text-sm">Trabajo</span>
              <span className="font-semibold text-sm text-gray-900">Reparar fuga</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400 text-sm">Tu precio</span>
              <span className="font-semibold text-sm text-purple-600">${miPrecio || '500'} MXN</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Estado</span>
              <span className="font-semibold text-sm text-yellow-600">⏳ Esperando respuesta</span>
            </div>
          </div>
          <a href="/home" className="block w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:opacity-90 transition">
            Volver al inicio
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-32">

      {/* HEADER */}
      <div className="bg-white px-6 pt-12 pb-4 shadow-sm">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <a href="/home" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">
              ←
            </a>
            <h1 className="font-extrabold text-gray-900 text-lg">Detalle del trabajo</h1>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-4">

        {/* Tarjeta principal */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
              {trabajo.emoji}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-extrabold text-gray-900 text-lg leading-tight">{trabajo.titulo}</h2>
                {trabajo.urgente && (
                  <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full flex-shrink-0">
                    🔴 Urgente
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm mt-1">{trabajo.tipo}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">💰 Pago</p>
              <p className="font-extrabold text-purple-600 text-lg">{trabajo.pago} MXN</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">📅 Cuándo</p>
              <p className="font-bold text-gray-900 text-sm">{trabajo.fecha}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">📍 Dónde</p>
              <p className="font-bold text-gray-900 text-sm">{trabajo.ubicacion}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">⏱️ Duración</p>
              <p className="font-bold text-gray-900 text-sm">{trabajo.duracion}</p>
            </div>
          </div>
        </div>

        {/* Descripción */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-extrabold text-gray-900 mb-3">📋 Descripción</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{trabajo.descripcion}</p>
        </div>

        {/* Requisitos */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-extrabold text-gray-900 mb-3">✅ Requisitos</h3>
          <div className="flex flex-col gap-2">
            {trabajo.requisitos.map((req, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-600 rounded-full flex-shrink-0"></div>
                <p className="text-gray-600 text-sm">{req}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Cliente */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-extrabold text-gray-900 mb-3">👤 Cliente</h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              R
            </div>
            <div>
              <p className="font-bold text-gray-900">{trabajo.cliente}</p>
              <p className="text-sm text-yellow-500">⭐ {trabajo.calificacion} · {trabajo.reviews} reseñas</p>
            </div>
          </div>
        </div>

        {/* Seguro */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-5 border border-purple-100 mb-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <h3 className="font-extrabold text-gray-900 mb-1">Fleksi Protege</h3>
              <p className="text-gray-600 text-sm">Seguro activado por default. Cubre daños accidentales durante el trabajo.</p>
              <p className="text-purple-600 font-bold text-sm mt-1">+$45 MXN incluido en el pago</p>
            </div>
          </div>
        </div>

        {/* Contraoferta */}
        {mostrarOferta && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <h3 className="font-extrabold text-gray-900 mb-3">💬 Tu propuesta</h3>
            <div className="mb-3">
              <label className="text-sm font-semibold text-gray-700 mb-1 block">Tu precio (MXN)</label>
              <input
                type="number"
                placeholder="Ej. 600"
                value={miPrecio}
                onChange={(e) => setMiPrecio(e.target.value)}
                className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">Mensaje al cliente</label>
              <textarea
                placeholder="Cuéntale tu experiencia y por qué eres la persona ideal..."
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                rows={3}
                className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900 resize-none"
              />
            </div>
          </div>
        )}

      </div>

      {/* BOTONES FIJOS ABAJO */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-md mx-auto flex gap-3">
          <button
            onClick={() => setMostrarOferta(!mostrarOferta)}
            className="flex-1 py-4 border-2 border-gray-200 text-gray-700 rounded-2xl font-bold hover:border-purple-400 transition">
            💬 Contraoferta
          </button>
          <button
            onClick={() => setAplicado(true)}
            className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold shadow-lg hover:opacity-90 transition">
            ✋ Aplicar — $500
          </button>
        </div>
      </div>

    </main>
  );
}