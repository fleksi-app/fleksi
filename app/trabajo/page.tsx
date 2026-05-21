'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function DetalleTrabafo() {
  const [aplicado, setAplicado] = useState(false);
  const [mostrarOferta, setMostrarOferta] = useState(false);
  const [miPrecio, setMiPrecio] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [trabajo, setTrabajo] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }

    const { data: perfil } = await supabase
      .from('usuarios').select('*').eq('id', user.id).single();
    setUsuario(perfil);

    // Por ahora cargamos el primer trabajo activo
    // En el futuro usaremos el ID de la URL
    const { data: servicios } = await supabase
      .from('servicios')
      .select('*, usuarios(nombre, calificacion)')
      .eq('estado', 'activo')
      .neq('cliente_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (servicios && servicios.length > 0) {
      setTrabajo(servicios[0]);
      setMiPrecio(servicios[0].presupuesto?.toString() || '');
    }
  };

  const handleAplicar = async () => {
    if (!trabajo || !usuario) return;
    setCargando(true);
    setError('');
    try {
      const { error: dbError } = await supabase.from('aplicaciones').insert({
        servicio_id: trabajo.id,
        prestador_id: usuario.id,
        precio_ofrecido: Number(miPrecio) || trabajo.presupuesto,
        mensaje: mensaje || null,
        estado: 'pendiente',
      });
      if (dbError) throw dbError;
      setAplicado(true);
    } catch (err: any) {
      setError('Ya aplicaste a este trabajo o hubo un error.');
    } finally {
      setCargando(false);
    }
  };

  const categoriaEmoji: any = {
    hogar: '🔧', limpieza: '🧹', eventos: '🍽️',
    mudanza: '🚚', ejecutivo: '🚗', interprete: '🗣️',
    cocina: '🍳', jardineria: '🌿', mecanica: '🔩',
    cerrajeria: '🔑', estetica: '💅', otro: '✨'
  };

  if (!trabajo) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-4xl mb-4">🔍</p>
          <p className="font-bold text-gray-900 mb-2">No hay trabajos disponibles</p>
          <p className="text-gray-400 text-sm mb-6">Vuelve más tarde</p>
          <a href="/home" className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold">
            Volver al inicio
          </a>
        </div>
      </main>
    );
  }

  if (aplicado) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">¡Aplicación enviada!</h1>
          <p className="text-gray-400 mb-8 font-light">
            {trabajo.usuarios?.nombre} recibirá tu solicitud y te contactará pronto.
          </p>
          <div className="bg-white rounded-2xl p-4 mb-6 text-left border border-gray-100">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400 text-sm">Trabajo</span>
              <span className="font-semibold text-sm text-gray-900">{trabajo.titulo}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400 text-sm">Tu precio</span>
              <span className="font-semibold text-sm text-purple-600">${miPrecio} MXN</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Estado</span>
              <span className="font-semibold text-sm text-yellow-600">⏳ Esperando respuesta</span>
            </div>
          </div>
          <a href="/mis-trabajos" className="block w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:opacity-90 transition mb-3">
            Ver mis aplicaciones
          </a>
          <a href="/home" className="block w-full py-4 border-2 border-gray-200 text-gray-700 rounded-2xl font-bold text-lg hover:border-purple-400 transition">
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
            <a href="/home" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">
              ←
            </a>
            <h1 className="font-extrabold text-gray-900 text-lg">Detalle del trabajo</h1>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-4">

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
              {categoriaEmoji[trabajo.categoria] || '✨'}
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
              <p className="text-gray-400 text-sm mt-1">Precio fijo</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">💰 Pago</p>
              <p className="font-extrabold text-purple-600 text-lg">${trabajo.presupuesto} MXN</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">📅 Cuándo</p>
              <p className="font-bold text-gray-900 text-sm">{trabajo.fecha} {trabajo.hora?.slice(0,5)}</p>
            </div>
          </div>
        </div>

        {trabajo.descripcion && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <h3 className="font-extrabold text-gray-900 mb-3">📋 Descripción</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{trabajo.descripcion}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-extrabold text-gray-900 mb-3">👤 Cliente</h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {trabajo.usuarios?.nombre?.charAt(0) || '?'}
            </div>
            <div>
              <p className="font-bold text-gray-900">{trabajo.usuarios?.nombre || 'Cliente'}</p>
              <p className="text-sm text-yellow-500">⭐ {trabajo.usuarios?.calificacion || '5.0'}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-5 border border-purple-100 mb-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <h3 className="font-extrabold text-gray-900 mb-1">Fleksi Protege</h3>
              <p className="text-gray-600 text-sm">Seguro activado. Cubre daños accidentales durante el trabajo.</p>
              {trabajo.seguro && <p className="text-purple-600 font-bold text-sm mt-1">+$45 MXN incluido</p>}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-4 text-sm">
            {error}
          </div>
        )}

        {mostrarOferta && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <h3 className="font-extrabold text-gray-900 mb-3">💬 Tu propuesta</h3>
            <div className="mb-3">
              <label className="text-sm font-semibold text-gray-700 mb-1 block">Tu precio (MXN)</label>
              <input type="number" placeholder="Ej. 600" value={miPrecio}
                onChange={(e) => setMiPrecio(e.target.value)}
                className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900"/>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">Mensaje al cliente</label>
              <textarea placeholder="Cuéntale tu experiencia..." value={mensaje}
                onChange={(e) => setMensaje(e.target.value)} rows={3}
                className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900 resize-none"/>
            </div>
          </div>
        )}

      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-md mx-auto flex gap-3">
          <button onClick={() => setMostrarOferta(!mostrarOferta)}
            className="flex-1 py-4 border-2 border-gray-200 text-gray-700 rounded-2xl font-bold hover:border-purple-400 transition">
            💬 Contraoferta
          </button>
          <button onClick={handleAplicar} disabled={cargando}
            className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold shadow-lg hover:opacity-90 transition disabled:opacity-50">
            {cargando ? 'Enviando...' : `✋ Aplicar — $${miPrecio || trabajo.presupuesto}`}
          </button>
        </div>
      </div>

    </main>
  );
}