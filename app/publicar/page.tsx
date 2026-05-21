'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const categorias = [
  { id: 'hogar', emoji: '🔧', nombre: 'Hogar y reparaciones' },
  { id: 'limpieza', emoji: '🧹', nombre: 'Limpieza' },
  { id: 'eventos', emoji: '🍽️', nombre: 'Eventos y hospitalidad' },
  { id: 'mudanza', emoji: '🚚', nombre: 'Mudanza y carga' },
  { id: 'ejecutivo', emoji: '🚗', nombre: 'Chofer ejecutivo' },
  { id: 'interprete', emoji: '🗣️', nombre: 'Intérprete / Traductor' },
  { id: 'cocina', emoji: '🍳', nombre: 'Cocinero particular' },
  { id: 'jardineria', emoji: '🌿', nombre: 'Jardinería' },
  { id: 'mecanica', emoji: '🔩', nombre: 'Mecánica básica' },
  { id: 'cerrajeria', emoji: '🔑', nombre: 'Cerrajería' },
  { id: 'estetica', emoji: '💅', nombre: 'Uñas / Estética' },
  { id: 'otro', emoji: '✨', nombre: 'Otro' },
];

export default function Publicar() {
  const [paso, setPaso] = useState(1);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [presupuesto, setPresupuesto] = useState('');
  const [urgente, setUrgente] = useState(false);
  const [seguro, setSeguro] = useState(true);
  const [publicado, setPublicado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const handlePublicar = async () => {
    setCargando(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }

      const { error: dbError } = await supabase.from('servicios').insert({
        cliente_id: user.id,
        titulo,
        descripcion,
        categoria: categoriaSeleccionada,
        fecha,
        hora,
        presupuesto: Number(presupuesto),
        urgente,
        seguro,
        estado: 'activo',
      });

      if (dbError) throw dbError;
      setPublicado(true);
    } catch (err: any) {
      setError('Ocurrió un error. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  if (publicado) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🎉</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">¡Publicado con éxito!</h1>
          <p className="text-gray-400 mb-8 font-light">
            Tu solicitud ya está visible para los prestadores cerca de ti.
          </p>
          <div className="bg-white rounded-2xl p-4 mb-6 text-left border border-gray-100">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400 text-sm">Servicio</span>
              <span className="font-semibold text-sm text-gray-900">{titulo}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400 text-sm">Presupuesto</span>
              <span className="font-semibold text-sm text-purple-600">${presupuesto} MXN</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400 text-sm">Fecha</span>
              <span className="font-semibold text-sm text-gray-900">{fecha} {hora}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Estado</span>
              <span className="font-semibold text-sm text-green-600">✅ Activo</span>
            </div>
          </div>
          <a href="/home-cliente" className="block w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:opacity-90 transition mb-3">
            Ver mis solicitudes
          </a>
          <a href="/" className="block w-full py-4 border-2 border-gray-200 text-gray-700 rounded-2xl font-bold text-lg hover:border-purple-400 transition">
            Volver al inicio
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-32">

      <div className="bg-white px-6 pt-12 pb-4 shadow-sm">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <a href="/" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">
              ←
            </a>
            <div>
              <h1 className="font-extrabold text-gray-900 text-lg">Publicar solicitud</h1>
              <p className="text-gray-400 text-xs">Paso {paso} de 3</p>
            </div>
          </div>
          <div className="flex gap-2">
            {[1,2,3].map((p) => (
              <div key={p} className={`h-1.5 flex-1 rounded-full transition-all ${p <= paso ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'}`}/>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-6">

        {paso === 1 && (
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">¿Qué necesitas?</h2>
            <p className="text-gray-400 mb-6 font-light">Elige la categoría que mejor describe tu solicitud</p>
            <div className="grid grid-cols-2 gap-3">
              {categorias.map((cat) => (
                <button key={cat.id} onClick={() => setCategoriaSeleccionada(cat.id)}
                  className={`p-4 rounded-2xl border-2 text-left transition ${
                    categoriaSeleccionada === cat.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-purple-300'
                  }`}>
                  <span className="text-2xl mb-2 block">{cat.emoji}</span>
                  <span className="text-sm font-semibold text-gray-900">{cat.nombre}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {paso === 2 && (
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">Cuéntanos más</h2>
            <p className="text-gray-400 mb-6 font-light">Mientras más detalle des, mejores propuestas recibirás</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Título de tu solicitud</label>
                <input type="text" placeholder="Ej. Necesito plomero para fuga en cocina"
                  value={titulo} onChange={(e) => setTitulo(e.target.value)}
                  className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900"/>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Descripción detallada</label>
                <textarea placeholder="Describe exactamente qué necesitas..."
                  value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                  rows={4} className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900 resize-none"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">📅 Fecha</label>
                  <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
                    className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900"/>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">🕐 Hora</label>
                  <input type="time" value={hora} onChange={(e) => setHora(e.target.value)}
                    className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900"/>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">💰 Tu presupuesto (MXN)</label>
                <input type="number" placeholder="Ej. 500" value={presupuesto}
                  onChange={(e) => setPresupuesto(e.target.value)}
                  className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900"/>
              </div>
              <div onClick={() => setUrgente(!urgente)}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition ${urgente ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔴</span>
                  <div>
                    <p className="font-semibold text-gray-900">Marcar como urgente</p>
                    <p className="text-xs text-gray-400">Aparece primero y atrae más prestadores</p>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full transition-all ${urgente ? 'bg-red-500' : 'bg-gray-300'}`}>
                  <div className={`w-6 h-6 bg-white rounded-full shadow transition-all ${urgente ? 'translate-x-6' : 'translate-x-0'}`}/>
                </div>
              </div>
            </div>
          </div>
        )}

        {paso === 3 && (
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">Confirma tu solicitud</h2>
            <p className="text-gray-400 mb-6 font-light">Revisa los detalles antes de publicar</p>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Categoría</span>
                  <span className="font-semibold text-sm text-gray-900">
                    {categorias.find(c => c.id === categoriaSeleccionada)?.emoji} {categorias.find(c => c.id === categoriaSeleccionada)?.nombre}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Título</span>
                  <span className="font-semibold text-sm text-gray-900 text-right max-w-48">{titulo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Fecha y hora</span>
                  <span className="font-semibold text-sm text-gray-900">{fecha} {hora}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Presupuesto</span>
                  <span className="font-extrabold text-sm text-purple-600">${presupuesto} MXN</span>
                </div>
                {urgente && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Urgencia</span>
                    <span className="font-semibold text-sm text-red-600">🔴 Urgente</span>
                  </div>
                )}
              </div>
            </div>

            <div onClick={() => setSeguro(!seguro)}
              className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition mb-4 ${seguro ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">🛡️</span>
                <div>
                  <p className="font-semibold text-gray-900">Fleksi Protege</p>
                  <p className="text-xs text-gray-400">Seguro por daños accidentales +$45 MXN</p>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full transition-all ${seguro ? 'bg-purple-500' : 'bg-gray-300'}`}>
                <div className={`w-6 h-6 bg-white rounded-full shadow transition-all ${seguro ? 'translate-x-6' : 'translate-x-0'}`}/>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500 text-sm">Tu presupuesto</span>
                <span className="font-semibold text-sm">${presupuesto} MXN</span>
              </div>
              {seguro && (
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500 text-sm">Fleksi Protege</span>
                  <span className="font-semibold text-sm">$45 MXN</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="font-extrabold text-gray-900">Total a pagar</span>
                <span className="font-extrabold text-purple-600">${Number(presupuesto) + (seguro ? 45 : 0)} MXN</span>
              </div>
            </div>
          </div>
        )}

      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-md mx-auto flex gap-3">
          {paso > 1 && (
            <button onClick={() => setPaso(paso - 1)}
              className="flex-1 py-4 border-2 border-gray-200 text-gray-700 rounded-2xl font-bold hover:border-purple-400 transition">
              ← Regresar
            </button>
          )}
          {paso < 3 ? (
            <button onClick={() => setPaso(paso + 1)}
              disabled={paso === 1 && !categoriaSeleccionada}
              className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold shadow-lg hover:opacity-90 transition disabled:opacity-50">
              Continuar →
            </button>
          ) : (
            <button onClick={handlePublicar} disabled={cargando}
              className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold shadow-lg hover:opacity-90 transition disabled:opacity-50">
              {cargando ? 'Publicando...' : '🚀 Publicar solicitud'}
            </button>
          )}
        </div>
      </div>

    </main>
  );
}