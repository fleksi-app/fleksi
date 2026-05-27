'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Nav from '@/lib/nav';
import { calcularPagoFlekser } from '@/lib/comisiones';

function DetalleTrabajoContent() {
  const searchParams = useSearchParams();
  const [aplicado, setAplicado] = useState(false);
  const [yaAplico, setYaAplico] = useState(false);
  const [mostrarOferta, setMostrarOferta] = useState(false);
  const [miPrecio, setMiPrecio] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cargandoPagina, setCargandoPagina] = useState(true);
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

    const servicioId = searchParams.get('id');
    let servicio = null;

    if (servicioId) {
      const { data } = await supabase
        .from('servicios')
        .select('*, usuarios(nombre, calificacion, foto_url, email)')
        .eq('id', servicioId).single();
      servicio = data;
    } else {
      const { data } = await supabase
        .from('servicios')
        .select('*, usuarios(nombre, calificacion, foto_url, email)')
        .eq('estado', 'activo')
        .neq('cliente_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      servicio = data?.[0] || null;
    }

    if (servicio) {
      setTrabajo(servicio);
      setMiPrecio(servicio.presupuesto?.toString() || '');
      const { data: appExistente } = await supabase
        .from('aplicaciones').select('id')
        .eq('servicio_id', servicio.id)
        .eq('prestador_id', user.id).single();
      if (appExistente) setYaAplico(true);
    }

    setCargandoPagina(false);
  };

  const handleAplicar = async () => {
    if (!trabajo || !usuario) return;
    if (yaAplico) { setError('Ya aplicaste a este trabajo.'); return; }
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

      try {
        await fetch('/api/enviar-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: 'nueva_aplicacion',
            destinatario: trabajo.usuarios?.email || 'fernando.najera.nm@gmail.com',
            datos: {
              cliente: trabajo.usuarios?.nombre || 'Cliente',
              cliente_id: trabajo.cliente_id,
              prestador: usuario.nombre,
              prestador_id: usuario.id,
              trabajo: trabajo.titulo,
              servicio_id: trabajo.id,
              precio: miPrecio || trabajo.presupuesto,
            },
          }),
        });
      } catch (e) {}

      setAplicado(true);
      setYaAplico(true);
    } catch (err: any) {
      setError('Hubo un error al enviar tu aplicación. Intenta de nuevo.');
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

  if (cargandoPagina) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando trabajo...</p>
        </div>
      </main>
    );
  }

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

  // Calcular lo que recibirá el flekser
  const precioBase = Number(miPrecio) || trabajo.presupuesto;
  const desgloseFlekser = calcularPagoFlekser(precioBase);

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
              <span className="font-semibold text-sm text-gray-500 line-through">${miPrecio} MXN</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400 text-sm">Comisión Fleksi (10%)</span>
              <span className="font-semibold text-sm text-orange-500">-${calcularPagoFlekser(Number(miPrecio)).comision} MXN</span>
            </div>
            <div className="flex justify-between mb-2 pt-1 border-t border-gray-100">
              <span className="font-bold text-gray-900 text-sm">💰 Recibirás</span>
              <span className="font-extrabold text-green-600 text-sm">${calcularPagoFlekser(Number(miPrecio)).total} MXN</span>
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
    <main className="min-h-screen bg-gray-50 pb-44">

      <div className="bg-white px-6 pt-12 pb-4 shadow-sm">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <a href="/home" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">←</a>
            <h1 className="font-extrabold text-gray-900 text-lg">Detalle del trabajo</h1>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-4">

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
              {categoriaEmoji[trabajo.categoria?.toLowerCase()] || '✨'}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-extrabold text-gray-900 text-lg leading-tight">{trabajo.titulo}</h2>
                {trabajo.urgente && (
                  <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full flex-shrink-0">🔴 Urgente</span>
                )}
              </div>
              <p className="text-gray-400 text-sm mt-1">{trabajo.categoria}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 border border-green-100">
              <p className="text-xs text-green-600 font-semibold mb-1">💰 Tú recibirás</p>
              <p className="font-extrabold text-green-700 text-xl">${desgloseFlekser.total} MXN</p>
              <p className="text-xs text-green-500 mt-0.5">Después de comisión (10%)</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">📅 Cuándo</p>
              <p className="font-bold text-gray-900 text-sm">{trabajo.fecha}</p>
              {trabajo.hora && <p className="text-xs text-gray-400">{trabajo.hora.slice(0,5)}</p>}
            </div>
          </div>

          {/* Desglose transparente */}
          <div className="bg-gray-50 rounded-xl p-3 text-xs">
            <div className="flex justify-between mb-1">
              <span className="text-gray-400">Precio del trabajo</span>
              <span className="text-gray-600 font-semibold">${trabajo.presupuesto} MXN</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-400">Comisión Fleksi (10%)</span>
              <span className="text-orange-500 font-semibold">-${calcularPagoFlekser(trabajo.presupuesto).comision} MXN</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-gray-200">
              <span className="font-bold text-gray-700">Tu ganancia</span>
              <span className="font-extrabold text-green-600">${desgloseFlekser.total} MXN</span>
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
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
              {trabajo.usuarios?.foto_url ? (
                <img src={trabajo.usuarios.foto_url} alt="cliente" className="w-full h-full object-cover"/>
              ) : (
                <span className="text-white font-bold text-lg">{trabajo.usuarios?.nombre?.charAt(0) || '?'}</span>
              )}
            </div>
            <div>
              <p className="font-bold text-gray-900">{trabajo.usuarios?.nombre || 'Cliente'}</p>
              <p className="text-sm text-yellow-500">⭐ {trabajo.usuarios?.calificacion || '5.0'}</p>
            </div>
          </div>
        </div>

        {trabajo.seguro && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-5 border border-purple-100 mb-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🛡️</span>
              <div>
                <h3 className="font-extrabold text-gray-900 mb-1">Fleksi Protege activado</h3>
                <p className="text-gray-600 text-sm">Cubre daños accidentales durante el trabajo.</p>
              </div>
            </div>
          </div>
        )}

        {yaAplico && !aplicado && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4 text-center">
            <p className="text-green-700 font-bold">✅ Ya aplicaste a este trabajo</p>
            <p className="text-green-600 text-sm mt-1">Espera la respuesta del cliente</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-4 text-sm">{error}</div>
        )}

        {!yaAplico && mostrarOferta && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <h3 className="font-extrabold text-gray-900 mb-3">💬 Tu propuesta</h3>
            <div className="mb-3">
              <label className="text-sm font-semibold text-gray-700 mb-1 block">Tu precio (MXN)</label>
              <input type="number" placeholder="Ej. 600" value={miPrecio}
                onChange={(e) => setMiPrecio(e.target.value)}
                className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900"/>
              {miPrecio && (
                <div className="mt-2 bg-green-50 rounded-xl p-2 flex justify-between text-xs">
                  <span className="text-green-600">💰 Recibirás</span>
                  <span className="font-extrabold text-green-700">${calcularPagoFlekser(Number(miPrecio)).total} MXN</span>
                </div>
              )}
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

      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 z-20">
        <div className="max-w-md mx-auto flex gap-3">
          {!yaAplico ? (
            <>
              <button onClick={() => setMostrarOferta(!mostrarOferta)}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl font-bold hover:border-purple-400 transition">
                💬 Contraoferta
              </button>
              <button onClick={handleAplicar} disabled={cargando}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold shadow-lg hover:opacity-90 transition disabled:opacity-50">
                {cargando ? 'Enviando...' : `✋ Aplicar — $${desgloseFlekser.total}`}
              </button>
            </>
          ) : (
            <a href="/mis-trabajos"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-center shadow-lg hover:opacity-90 transition">
              Ver mis aplicaciones →
            </a>
          )}
        </div>
      </div>

      <Nav activo="inicio" />
    </main>
  );
}

export default function DetalleTrabajo() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </main>
    }>
      <DetalleTrabajoContent />
    </Suspense>
  );
}