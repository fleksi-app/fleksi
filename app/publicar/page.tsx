'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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

const horas = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00',
];

function PublicarForm() {
  const searchParams = useSearchParams();
  const paraId = searchParams.get('para');

  const [paso, setPaso] = useState(1);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [presupuesto, setPresupuesto] = useState('');
  const [direccion, setDireccion] = useState('');
  const [urgente, setUrgente] = useState(false);
  const [metodoPago, setMetodoPago] = useState<'stripe' | 'efectivo'>('stripe');
  const [cupos, setCupos] = useState(1);
  const [publicado, setPublicado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [walletSaldo, setWalletSaldo] = useState(0);
  const [cargandoWallet, setCargandoWallet] = useState(true);
  const [flekserSugerido, setFlekserSugerido] = useState<any>(null);
  const [rolUsuario, setRolUsuario] = useState('flekser');
  const [horaMinima, setHoraMinima] = useState('');
  const [geocodificando, setGeocodificando] = useState(false);

  const hoyStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('usuarios').select('wallet_saldo, rol, rol_activo').eq('id', user.id).single();
      setWalletSaldo(data?.wallet_saldo || 0);
      setRolUsuario(data?.rol_activo || data?.rol || 'flekser');
      setCargandoWallet(false);
      if (paraId) {
        const { data: flekser } = await supabase.from('usuarios').select('id, nombre, foto_url, calificacion, habilidades').eq('id', paraId).single();
        if (flekser) setFlekserSugerido(flekser);
      }
    };
    cargarDatos();
  }, [paraId]);

  useEffect(() => {
    if (urgente && fecha === hoyStr) {
      const ahora = new Date();
      ahora.setHours(ahora.getHours() + 3);
      const hh = String(ahora.getHours()).padStart(2, '0');
      const mm = String(ahora.getMinutes()).padStart(2, '0');
      setHoraMinima(`${hh}:${mm}`);
      if (hora && hora < `${hh}:${mm}`) setHora('');
    } else {
      setHoraMinima('');
    }
  }, [urgente, fecha]);

  const efectivoHabilitado = walletSaldo >= 50;
  const esEmpresa = rolUsuario === 'empresa';
  const homeUrl = rolUsuario === 'empresa' ? '/home-empresa' : rolUsuario === 'viajero' ? '/home-viajero' : '/home';
  const horasFiltradas = horas.filter(h => { if (!horaMinima) return true; return h >= horaMinima.slice(0, 5); });

  const geocodificarDireccion = async (dir: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      setGeocodificando(true);
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(dir + ', México')}&format=json&limit=1`, { headers: { 'Accept-Language': 'es', 'User-Agent': 'FleksiApp/1.0' } });
      const data = await resp.json();
      if (data?.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      return null;
    } catch (e) { return null; }
    finally { setGeocodificando(false); }
  };

  const handlePublicar = async () => {
    if (!titulo || !fecha || !presupuesto) { setError('Por favor completa título, fecha y presupuesto'); return; }
    setCargando(true); setError('');
    const ahora = new Date();
    const fechaSeleccionada = new Date(`${fecha}T${hora || '23:59'}`);
    if (fechaSeleccionada < ahora) { setError('La fecha y hora del trabajo no puede ser en el pasado'); setCargando(false); return; }
    if (urgente) {
      const tresHoras = new Date(ahora.getTime() + 3 * 60 * 60 * 1000);
      if (fechaSeleccionada < tresHoras) {
        setError(`Para trabajos urgentes necesitas al menos 3 horas de anticipación. El trabajo más temprano es a las ${String(tresHoras.getHours()).padStart(2,'0')}:${String(tresHoras.getMinutes()).padStart(2,'0')}.`);
        setCargando(false); return;
      }
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }
      let coords = null;
      if (direccion.trim()) coords = await geocodificarDireccion(direccion);
      const { data: servicioCreado, error: dbError } = await supabase.from('servicios').insert({
        cliente_id: user.id, titulo, descripcion,
        categoria: categoriaSeleccionada, fecha, hora: hora || null,
        presupuesto: Number(presupuesto), direccion: direccion || null,
        lat: coords?.lat || null, lng: coords?.lng || null,
        urgente, seguro: false, metodo_pago: metodoPago, estado: 'activo',
        flekser_sugerido_id: flekserSugerido?.id || null,
        cupos: esEmpresa ? cupos : 1, cupos_tomados: 0,
      }).select().single();
      if (dbError) throw dbError;
      if (flekserSugerido?.id && servicioCreado) {
        try {
          await supabase.from('notificaciones').insert({
            usuario_id: flekserSugerido.id, tipo: 'solicitud_directa',
            titulo: '🎯 ¡Te enviaron una solicitud directa!',
            mensaje: `Alguien quiere contratarte para: "${titulo}" el ${fecha}. ¡Aplica antes que nadie!`,
            link: `/trabajo?id=${servicioCreado.id}`,
          });
        } catch (e) {}
      }
      setPublicado(true);
    } catch (err: any) { setError(err.message || 'Ocurrió un error. Intenta de nuevo.'); }
    finally { setCargando(false); }
  };

  if (publicado) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">{flekserSugerido ? '🎯' : '🎉'}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
            {flekserSugerido ? `¡Solicitud enviada a ${flekserSugerido.nombre?.split(' ')[0]}!` : '¡Publicado con éxito!'}
          </h1>
          <p className="text-gray-400 mb-8 font-light">
            {flekserSugerido ? `${flekserSugerido.nombre?.split(' ')[0]} recibió una notificación y podrá aplicar directamente.` : 'Tu solicitud ya está visible para los fleksers cerca de ti.'}
          </p>
          <div className="bg-white rounded-2xl p-4 mb-6 text-left border border-gray-100">
            {flekserSugerido && (
              <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                  {flekserSugerido.foto_url ? <img src={flekserSugerido.foto_url} className="w-full h-full object-cover"/> : <span className="text-white font-bold">{flekserSugerido.nombre?.charAt(0)}</span>}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{flekserSugerido.nombre}</p>
                  <p className="text-xs text-purple-600 font-semibold">🎯 Solicitud directa enviada</p>
                </div>
              </div>
            )}
            <div className="flex justify-between mb-2"><span className="text-gray-400 text-sm">Servicio</span><span className="font-semibold text-sm text-gray-900">{titulo}</span></div>
            <div className="flex justify-between mb-2"><span className="text-gray-400 text-sm">Presupuesto</span><span className="font-semibold text-sm text-purple-600">${presupuesto} MXN</span></div>
            <div className="flex justify-between mb-2"><span className="text-gray-400 text-sm">Fecha</span><span className="font-semibold text-sm text-gray-900">{fecha} {hora}</span></div>
            {esEmpresa && cupos > 1 && <div className="flex justify-between mb-2"><span className="text-gray-400 text-sm">Cupos</span><span className="font-semibold text-sm text-gray-900">{cupos} personas</span></div>}
            {direccion && <div className="flex justify-between mb-2"><span className="text-gray-400 text-sm">Dirección</span><span className="font-semibold text-sm text-gray-900 text-right max-w-48">{direccion}</span></div>}
            <div className="flex justify-between mb-2"><span className="text-gray-400 text-sm">Pago</span><span className="font-semibold text-sm text-gray-900">{metodoPago === 'stripe' ? '💳 Stripe' : '💵 Efectivo'}</span></div>
            <div className="flex justify-between"><span className="text-gray-400 text-sm">Estado</span><span className="font-semibold text-sm text-green-600">✅ Activo</span></div>
          </div>
          <a href="/aplicaciones" className="block w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:opacity-90 transition mb-3">Ver mis solicitudes</a>
          <a href={homeUrl} className="block w-full py-4 border-2 border-gray-200 text-gray-700 rounded-2xl font-bold text-lg hover:border-purple-400 transition">Volver al inicio</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-white px-6 pt-12 pb-4 shadow-sm">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <a href={homeUrl} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">←</a>
            <div>
              <h1 className="font-extrabold text-gray-900 text-lg">Publicar solicitud</h1>
              <p className="text-gray-400 text-xs">Paso {paso} de 3</p>
            </div>
          </div>
          <div className="flex gap-2">
            {[1,2,3].map((p) => (<div key={p} className={`h-1.5 flex-1 rounded-full transition-all ${p <= paso ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'}`}/>))}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-6">
        {flekserSugerido && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-purple-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
              {flekserSugerido.foto_url ? <img src={flekserSugerido.foto_url} className="w-full h-full object-cover"/> : <span className="text-white font-bold text-lg">{flekserSugerido.nombre?.charAt(0)}</span>}
            </div>
            <div className="flex-1">
              <p className="font-extrabold text-purple-800 text-sm">🎯 Solicitud directa a</p>
              <p className="font-bold text-gray-900">{flekserSugerido.nombre}</p>
              <p className="text-xs text-purple-600">Recibirá una notificación especial al publicar</p>
            </div>
            <button onClick={() => setFlekserSugerido(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
          </div>
        )}

        {paso === 1 && (
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">¿Qué necesitas?</h2>
            <p className="text-gray-400 mb-6 font-light">Elige la categoría que mejor describe tu solicitud</p>
            <div className="grid grid-cols-2 gap-3">
              {categorias.map((cat) => (
                <button key={cat.id} onClick={() => setCategoriaSeleccionada(cat.id)}
                  className={`p-4 rounded-2xl border-2 text-left transition ${categoriaSeleccionada === cat.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white hover:border-purple-300'}`}>
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
            {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-4 text-sm">{error}</div>}
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Título de tu solicitud</label>
                <input type="text" placeholder="Ej. Necesito plomero para fuga en cocina" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900"/>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Descripción detallada</label>
                <textarea placeholder="Describe exactamente qué necesitas..." value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={4} className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900 resize-none"/>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">📍 Dirección del trabajo</label>
                <input type="text" placeholder="Ej. Av. Insurgentes 123, Col. Roma, CDMX" value={direccion} onChange={(e) => setDireccion(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900"/>
                <p className="text-xs text-gray-400 mt-1">📍 Se usará para verificar la ubicación del flekser al hacer check-in</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">📅 Fecha</label>
                <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} min={hoyStr} className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900"/>
                {fecha && fecha === hoyStr && <p className="text-xs text-amber-600 font-semibold mt-1">📅 Estás publicando para hoy</p>}
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  🕐 Hora <span className="text-gray-400 font-normal">(opcional)</span>
                  {horaMinima && <span className="text-amber-600 font-semibold ml-2">— mínimo {horaMinima.slice(0,5)} por trabajo urgente</span>}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {horasFiltradas.map((h) => (
                    <button key={h} onClick={() => setHora(hora === h ? '' : h)}
                      className={`py-2 rounded-xl text-sm font-semibold transition border-2 ${hora === h ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 bg-white text-gray-500 hover:border-purple-300'}`}>
                      {h}
                    </button>
                  ))}
                  {horasFiltradas.length === 0 && (
                    <div className="col-span-4 text-center py-3 bg-amber-50 rounded-xl border border-amber-200">
                      <p className="text-amber-700 text-xs font-semibold">⚠️ No hay horas disponibles para hoy con trabajo urgente</p>
                      <p className="text-amber-600 text-xs mt-1">Cambia la fecha a mañana o desactiva "urgente"</p>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">💰 Tu presupuesto por persona (MXN)</label>
                <input type="number" placeholder="Ej. 500" value={presupuesto} onChange={(e) => setPresupuesto(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900"/>
              </div>
              {esEmpresa && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">👥 ¿Cuántas personas necesitas?</label>
                  <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-200">
                    <button onClick={() => setCupos(Math.max(1, cupos - 1))} className="w-10 h-10 bg-white border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:border-purple-400 transition text-lg">−</button>
                    <div className="flex-1 text-center">
                      <p className="text-3xl font-extrabold text-gray-900">{cupos}</p>
                      <p className="text-xs text-gray-400">{cupos === 1 ? 'persona' : 'personas'}</p>
                    </div>
                    <button onClick={() => setCupos(Math.min(50, cupos + 1))} className="w-10 h-10 bg-white border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:border-purple-400 transition text-lg">+</button>
                  </div>
                  {cupos > 1 && <p className="text-xs text-purple-600 font-semibold mt-2 text-center">💰 Total estimado: ${Number(presupuesto || 0) * cupos} MXN ({cupos} × ${presupuesto || 0})</p>}
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">💳 Método de pago</label>
                <div className="flex flex-col gap-2">
                  <button onClick={() => setMetodoPago('stripe')} className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition text-left ${metodoPago === 'stripe' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white'}`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${metodoPago === 'stripe' ? 'border-purple-500' : 'border-gray-300'}`}>
                      {metodoPago === 'stripe' && <div className="w-2.5 h-2.5 bg-purple-500 rounded-full"/>}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-sm">💳 Pagar con tarjeta</p>
                      <p className="text-xs text-gray-400">Pago seguro vía Stripe. Sin comisión extra.</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-1 rounded-full">Recomendado</span>
                  </button>
                  <button onClick={() => efectivoHabilitado ? setMetodoPago('efectivo') : null}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition text-left ${!efectivoHabilitado ? 'opacity-60 cursor-not-allowed border-gray-200 bg-gray-50' : metodoPago === 'efectivo' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 bg-white'}`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${metodoPago === 'efectivo' && efectivoHabilitado ? 'border-teal-500' : 'border-gray-300'}`}>
                      {metodoPago === 'efectivo' && efectivoHabilitado && <div className="w-2.5 h-2.5 bg-teal-500 rounded-full"/>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 text-sm">💵 Pago en efectivo</p>
                        {!efectivoHabilitado && <span className="text-xs">🔒</span>}
                      </div>
                      {efectivoHabilitado
                        ? <p className="text-xs text-gray-400">5% de comisión para cada parte vía wallet.</p>
                        : <p className="text-xs text-amber-600 font-semibold">Necesitas $50 en tu wallet.{' '}<a href="/wallet/recargar" className="underline" onClick={(e) => e.stopPropagation()}>Recargar →</a></p>}
                    </div>
                    {efectivoHabilitado && <span className="text-xs bg-teal-100 text-teal-700 font-bold px-2 py-1 rounded-full">Saldo: ${walletSaldo.toFixed(0)}</span>}
                  </button>
                </div>
              </div>
              <div onClick={() => setUrgente(!urgente)} className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition ${urgente ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔴</span>
                  <div>
                    <p className="font-semibold text-gray-900">Marcar como urgente</p>
                    <p className="text-xs text-gray-400">Mínimo 3 horas de anticipación · Aparece primero</p>
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
            {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-4 text-sm">{error}</div>}
            {flekserSugerido && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-purple-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                  {flekserSugerido.foto_url ? <img src={flekserSugerido.foto_url} className="w-full h-full object-cover"/> : <span className="text-white font-bold">{flekserSugerido.nombre?.charAt(0)}</span>}
                </div>
                <div>
                  <p className="text-xs text-purple-600 font-bold">🎯 Solicitud directa</p>
                  <p className="font-extrabold text-gray-900 text-sm">{flekserSugerido.nombre}</p>
                  <p className="text-xs text-gray-400">Recibirá notificación al publicar</p>
                </div>
              </div>
            )}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between"><span className="text-gray-400 text-sm">Categoría</span><span className="font-semibold text-sm text-gray-900">{categorias.find(c => c.id === categoriaSeleccionada)?.emoji} {categorias.find(c => c.id === categoriaSeleccionada)?.nombre}</span></div>
                <div className="flex justify-between"><span className="text-gray-400 text-sm">Título</span><span className="font-semibold text-sm text-gray-900 text-right max-w-48">{titulo}</span></div>
                <div className="flex justify-between"><span className="text-gray-400 text-sm">Fecha</span><span className="font-semibold text-sm text-gray-900">{fecha} {hora || 'Sin hora'}</span></div>
                {direccion && <div className="flex justify-between"><span className="text-gray-400 text-sm">📍 Dirección</span><span className="font-semibold text-sm text-gray-900 text-right max-w-48">{direccion}</span></div>}
                <div className="flex justify-between"><span className="text-gray-400 text-sm">Presupuesto por persona</span><span className="font-extrabold text-sm text-purple-600">${presupuesto} MXN</span></div>
                {esEmpresa && cupos > 1 && <div className="flex justify-between"><span className="text-gray-400 text-sm">👥 Cupos</span><span className="font-semibold text-sm text-gray-900">{cupos} personas</span></div>}
                <div className="flex justify-between"><span className="text-gray-400 text-sm">Método de pago</span><span className="font-semibold text-sm text-gray-900">{metodoPago === 'stripe' ? '💳 Tarjeta' : '💵 Efectivo'}</span></div>
                {urgente && <div className="flex justify-between"><span className="text-gray-400 text-sm">Urgencia</span><span className="font-semibold text-sm text-red-600">🔴 Urgente</span></div>}
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <div className="flex justify-between mb-2"><span className="text-gray-500 text-sm">Presupuesto por persona</span><span className="font-semibold text-sm">${presupuesto} MXN</span></div>
              {esEmpresa && cupos > 1 && <div className="flex justify-between mb-2"><span className="text-gray-500 text-sm">× {cupos} personas</span><span className="font-semibold text-sm">${Number(presupuesto) * cupos} MXN</span></div>}
              {metodoPago === 'efectivo' && <div className="flex justify-between mb-2"><span className="text-gray-500 text-sm">📊 Comisión efectivo (5%)</span><span className="font-semibold text-sm text-orange-600">${(Number(presupuesto) * 0.05).toFixed(2)} MXN (de tu wallet)</span></div>}
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="font-extrabold text-gray-900">{metodoPago === 'stripe' ? 'Total a pagar' : 'Pagas al flekser'}</span>
                <span className="font-extrabold text-purple-600">{metodoPago === 'stripe' ? `$${Number(presupuesto)} MXN` : `$${presupuesto} MXN en efectivo`}</span>
              </div>
            </div>
            {metodoPago === 'efectivo' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
                <p className="text-amber-800 text-xs font-semibold">💡 Al confirmar el trabajo, se descontará ${(Number(presupuesto) * 0.05).toFixed(2)} MXN de tu wallet como comisión de Fleksi. El flekser también paga 5%.</p>
              </div>
            )}
            {geocodificando && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 mb-4 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0"/>
                <p className="text-blue-700 text-xs font-semibold">Geocodificando dirección...</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-md mx-auto flex gap-3">
          {paso > 1 && <button onClick={() => setPaso(paso - 1)} className="flex-1 py-4 border-2 border-gray-200 text-gray-700 rounded-2xl font-bold hover:border-purple-400 transition">← Regresar</button>}
          {paso < 3 ? (
            <button onClick={() => { setError(''); setPaso(paso + 1); }} disabled={paso === 1 && !categoriaSeleccionada} className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold shadow-lg hover:opacity-90 transition disabled:opacity-50">
              Continuar →
            </button>
          ) : (
            <button onClick={handlePublicar} disabled={cargando || geocodificando} className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold shadow-lg hover:opacity-90 transition disabled:opacity-50">
              {cargando ? 'Publicando...' : geocodificando ? 'Geocodificando...' : flekserSugerido ? `🎯 Enviar solicitud a ${flekserSugerido.nombre?.split(' ')[0]}` : '🚀 Publicar solicitud'}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

export default function Publicar() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </main>
    }>
      <PublicarForm />
    </Suspense>
  );
}