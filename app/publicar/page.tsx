'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
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
  { id: 'envios', emoji: '🛵', nombre: 'Envíos y mensajería' },
  { id: 'mascotas', emoji: '🐾', nombre: 'Mascotas y paseo' },
  { id: 'super', emoji: '🛒', nombre: 'Hacer el súper' },
  { id: 'otro', emoji: '✨', nombre: 'Otro' },
];

const horas = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00',
];

const preguntasPorCategoria: Record<string, { id: string; pregunta: string; placeholder: string }[]> = {
  hogar: [
    { id: 'tipo_problema', pregunta: '¿Qué necesitas reparar o arreglar?', placeholder: 'Ej. Fuga de agua, puerta que no cierra, lampara...' },
    { id: 'urgencia_desc', pregunta: '¿Desde cuándo tienes este problema?', placeholder: 'Ej. Desde ayer, hace una semana...' },
    { id: 'materiales', pregunta: '¿Tienes los materiales o necesitas que los traigan?', placeholder: 'Ej. Tengo los materiales, necesito que traigan todo...' },
  ],
  limpieza: [
    { id: 'tipo_inmueble', pregunta: '¿Qué tipo de inmueble es?', placeholder: 'Ej. Casa, departamento, oficina, Airbnb...' },
    { id: 'tamano', pregunta: '¿Cuántos cuartos o metros aproximadamente?', placeholder: 'Ej. 3 cuartos, 80m2...' },
    { id: 'tipo_limpieza', pregunta: '¿Limpieza regular o profunda?', placeholder: 'Ej. Limpieza regular semanal, limpieza profunda...' },
  ],
  eventos: [
    { id: 'tipo_evento', pregunta: '¿Qué tipo de evento es?', placeholder: 'Ej. Boda, quinceañera, cumpleaños, corporativo...' },
    { id: 'num_personas', pregunta: '¿Cuántas personas asistirán aproximadamente?', placeholder: 'Ej. 50 personas, 200 invitados...' },
    { id: 'servicio_necesario', pregunta: '¿Qué servicio necesitas específicamente?', placeholder: 'Ej. Meseros, cocineros, staff, bartender...' },
  ],
  mudanza: [
    { id: 'origen_destino', pregunta: '¿De dónde a dónde es la mudanza?', placeholder: 'Ej. De Col. Centro a Col. Jardines...' },
    { id: 'volumen', pregunta: '¿Qué tan grande es la mudanza?', placeholder: 'Ej. Solo muebles de sala, departamento completo...' },
    { id: 'piso', pregunta: '¿Hay escaleras o elevador?', placeholder: 'Ej. Piso 3 sin elevador, planta baja...' },
  ],
  ejecutivo: [
    { id: 'ruta', pregunta: '¿De dónde a dónde necesitas transporte?', placeholder: 'Ej. Del aeropuerto al hotel, traslados diarios...' },
    { id: 'frecuencia', pregunta: '¿Es un servicio de una vez o recurrente?', placeholder: 'Ej. Solo hoy, todos los días de lunes a viernes...' },
    { id: 'num_pasajeros', pregunta: '¿Cuántos pasajeros serán?', placeholder: 'Ej. Solo yo, 3 personas...' },
  ],
  interprete: [
    { id: 'idiomas', pregunta: '¿Qué idiomas necesitas?', placeholder: 'Ej. Español-Inglés, Español-Francés...' },
    { id: 'contexto', pregunta: '¿Para qué lo necesitas?', placeholder: 'Ej. Reunión de negocios, visita médica, evento...' },
    { id: 'duracion', pregunta: '¿Cuántas horas aproximadamente?', placeholder: 'Ej. 2 horas, todo el día...' },
  ],
  cocina: [
    { id: 'tipo_comida', pregunta: '¿Qué tipo de comida o platillos necesitas?', placeholder: 'Ej. Comida mexicana para 10 personas, postres...' },
    { id: 'ocasion', pregunta: '¿Es para qué ocasión?', placeholder: 'Ej. Comida familiar, evento de empresa, cena especial...' },
    { id: 'lugar', pregunta: '¿Cocinará en tu casa o traerá la comida lista?', placeholder: 'Ej. En mi cocina, necesito que traiga todo listo...' },
  ],
  jardineria: [
    { id: 'tipo_trabajo', pregunta: '¿Qué necesitas exactamente?', placeholder: 'Ej. Poda de árboles, siembra, mantenimiento mensual...' },
    { id: 'tamano_jardin', pregunta: '¿Qué tan grande es el jardín o espacio?', placeholder: 'Ej. Jardín pequeño de casa, espacio grande...' },
    { id: 'frecuencia', pregunta: '¿Es un servicio de una vez o recurrente?', placeholder: 'Ej. Solo esta vez, cada 15 días...' },
  ],
  mecanica: [
    { id: 'tipo_vehiculo', pregunta: '¿Qué tipo de vehículo es?', placeholder: 'Ej. Sedan 2018, camioneta, motocicleta...' },
    { id: 'problema', pregunta: '¿Qué problema presenta?', placeholder: 'Ej. No enciende, hace ruido extraño, cambio de aceite...' },
    { id: 'ubicacion_auto', pregunta: '¿El vehículo puede moverse o está varado?', placeholder: 'Ej. Está en mi casa, está varado en la calle...' },
  ],
  cerrajeria: [
    { id: 'tipo_problema', pregunta: '¿Qué necesitas?', placeholder: 'Ej. Perdí mis llaves, cerradura descompuesta, duplicado...' },
    { id: 'tipo_puerta', pregunta: '¿Es puerta de casa, coche, oficina?', placeholder: 'Ej. Puerta principal de casa, coche, candado...' },
    { id: 'urgencia_desc', pregunta: '¿Estás encerrado o puedes esperar?', placeholder: 'Ej. Estoy afuera de mi casa, puedo esperar...' },
  ],
  estetica: [
    { id: 'servicio', pregunta: '¿Qué servicio necesitas?', placeholder: 'Ej. Uñas acrílicas, manicure, pedicure, depilación...' },
    { id: 'lugar', pregunta: '¿A domicilio o en su lugar de trabajo?', placeholder: 'Ej. En mi casa, en su salón...' },
    { id: 'referencia', pregunta: '¿Tienes alguna referencia o foto de lo que quieres?', placeholder: 'Ej. Sí tengo foto, quiero algo sencillo en color nude...' },
  ],
  envios: [
    { id: 'tipo_envio', pregunta: '¿Qué necesitas enviar?', placeholder: 'Ej. Paquete pequeño, documentos, comida...' },
    { id: 'ruta_envio', pregunta: '¿De dónde a dónde?', placeholder: 'Ej. De Col. Centro a Col. Jardines...' },
    { id: 'vehiculo', pregunta: '¿Qué tipo de vehículo necesitas?', placeholder: 'Ej. Moto, bici, carro, camioneta...' },
  ],
  mascotas: [
    { id: 'tipo_mascota', pregunta: '¿Qué tipo de mascota tienes?', placeholder: 'Ej. Perro labrador, gato, 2 perros pequeños...' },
    { id: 'servicio_mascota', pregunta: '¿Qué servicio necesitas?', placeholder: 'Ej. Paseo diario, cuidado en casa, guardería...' },
    { id: 'duracion_mascota', pregunta: '¿Por cuánto tiempo?', placeholder: 'Ej. 1 hora diaria, 3 días mientras viajo...' },
  ],
  super: [
    { id: 'lista', pregunta: '¿Tienes lista o necesitas que elijan?', placeholder: 'Ej. Tengo lista en WhatsApp, solo frutas y verduras frescas...' },
    { id: 'tienda', pregunta: '¿En qué tienda o supermercado?', placeholder: 'Ej. Walmart, Chedraui, mercado local...' },
    { id: 'entrega', pregunta: '¿Lo recogen o necesitas entrega a domicilio?', placeholder: 'Ej. Entrega en mi casa, yo lo recojo...' },
  ],
  otro: [
    { id: 'descripcion_libre', pregunta: '¿Qué necesitas exactamente?', placeholder: 'Describe con el mayor detalle posible lo que necesitas...' },
    { id: 'experiencia', pregunta: '¿Necesitas que tenga experiencia específica?', placeholder: 'Ej. Con experiencia en X, no importa si es nuevo...' },
  ],
};

function PublicarForm() {
  const searchParams = useSearchParams();
  const paraId = searchParams.get('para');
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const [paso, setPaso] = useState(1);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [titulo, setTitulo] = useState('');
  const [respuestasCategoria, setRespuestasCategoria] = useState<Record<string, string>>({});
  const [fechas, setFechas] = useState<string[]>([]);
  const [hora, setHora] = useState('');
  const [direccion, setDireccion] = useState('');
  const [urgente, setUrgente] = useState(false);
  const [metodoPago, setMetodoPago] = useState<'stripe' | 'efectivo'>('stripe');
  const [modoPago, setModoPago] = useState<'total' | 'por_dia'>('total');
  const [cupos, setCupos] = useState(1);
  const [fotoProblema, setFotoProblema] = useState<File | null>(null);
  const [fotoProblemaUrl, setFotoProblemaUrl] = useState<string>('');
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [publicado, setPublicado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [walletSaldo, setWalletSaldo] = useState(0);
  const [cargandoWallet, setCargandoWallet] = useState(true);
  const [flekserSugerido, setFlekserSugerido] = useState<any>(null);
  const [rolUsuario, setRolUsuario] = useState('flekser');
  const [horaMinima, setHoraMinima] = useState('');
  const [geocodificando, setGeocodificando] = useState(false);
  const [usuarioId, setUsuarioId] = useState('');
  const [ciudadUsuario, setCiudadUsuario] = useState('');

  const hoyStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUsuarioId(user.id);
      const { data } = await supabase.from('usuarios').select('wallet_saldo, rol, rol_activo, ciudad').eq('id', user.id).single();
      setWalletSaldo(data?.wallet_saldo || 0);
      setRolUsuario(data?.rol_activo || data?.rol || 'flekser');
      setCiudadUsuario(data?.ciudad || '');
      setCargandoWallet(false);
      if (paraId) {
        const { data: flekser } = await supabase.from('usuarios').select('id, nombre, foto_url, calificacion, habilidades').eq('id', paraId).single();
        if (flekser) setFlekserSugerido(flekser);
      }
    };
    cargarDatos();
  }, [paraId]);

  useEffect(() => {
    const fechaHoy = fechas.includes(hoyStr);
    if (urgente && fechaHoy) {
      const ahora = new Date();
      ahora.setHours(ahora.getHours() + 3);
      const hh = String(ahora.getHours()).padStart(2, '0');
      const mm = String(ahora.getMinutes()).padStart(2, '0');
      setHoraMinima(hh + ':' + mm);
      if (hora && hora < hh + ':' + mm) setHora('');
    } else {
      setHoraMinima('');
    }
  }, [urgente, fechas]);

  const efectivoHabilitado = walletSaldo >= 50;
  const esEmpresa = rolUsuario === 'empresa';
  const homeUrl = rolUsuario === 'empresa' ? '/home-empresa' : '/home';
  const horasFiltradas = horas.filter(h => { if (!horaMinima) return true; return h >= horaMinima.slice(0, 5); });
  const preguntasActuales = preguntasPorCategoria[categoriaSeleccionada] || preguntasPorCategoria['otro'];
  const esMutipleDias = fechas.length > 1;

  const toggleFecha = (f: string) => {
    setFechas(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f].sort()
    );
  };

  const generarFechasProximas = () => {
    const dias: string[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dias.push(d.toISOString().split('T')[0]);
    }
    return dias;
  };

  const formatFecha = (f: string) => {
    const d = new Date(f + 'T12:00:00');
    return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const generarTituloAutomatico = () => {
    const cat = categorias.find(c => c.id === categoriaSeleccionada);
    const primeraRespuesta = respuestasCategoria[preguntasActuales[0]?.id];
    if (primeraRespuesta && primeraRespuesta.trim()) {
      return cat?.emoji + ' ' + primeraRespuesta.trim().slice(0, 60);
    }
    return cat?.emoji + ' ' + cat?.nombre + ' en Irapuato';
  };

  const generarDescripcion = () => {
    return preguntasActuales
      .map(p => {
        const r = respuestasCategoria[p.id];
        if (!r?.trim()) return null;
        return p.pregunta + '\n' + r.trim();
      })
      .filter(Boolean)
      .join('\n\n');
  };

  const handleFotoProblema = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoProblema(file);
    const reader = new FileReader();
    reader.onload = (ev) => setFotoProblemaUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const subirFotoProblema = async (servicioId: string): Promise<string | null> => {
    if (!fotoProblema || !usuarioId) return null;
    try {
      setSubiendoFoto(true);
      const ext = fotoProblema.name.split('.').pop();
      const path = usuarioId + '/servicios/' + servicioId + '.' + ext;
      const { error: uploadError } = await supabase.storage.from('fotos-servicios').upload(path, fotoProblema, { upsert: true });
      if (uploadError) return null;
      const { data } = supabase.storage.from('fotos-servicios').getPublicUrl(path);
      return data.publicUrl;
    } catch (e) { return null; }
    finally { setSubiendoFoto(false); }
  };

  const geocodificarDireccion = async (dir: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      setGeocodificando(true);
      const resp = await fetch('https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(dir + ', México') + '&format=json&limit=1', { headers: { 'Accept-Language': 'es', 'User-Agent': 'FleksiApp/1.0' } });
      const data = await resp.json();
      if (data?.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      return null;
    } catch (e) { return null; }
    finally { setGeocodificando(false); }
  };

  const handleAtras = () => {
    if (paso > 1) {
      setPaso(paso - 1);
    } else {
      window.history.back();
    }
  };

  const notificarFleksersCercanos = async (servicioId: string, tituloFinal: string) => {
    try {
      if (!ciudadUsuario) return;

      const { data: fleksers } = await supabase
        .from('usuarios')
        .select('id')
        .eq('ciudad', ciudadUsuario)
        .neq('id', usuarioId)
        .in('rol_activo', ['flekser']);

      if (!fleksers || fleksers.length === 0) return;

      const cat = categorias.find(c => c.id === categoriaSeleccionada);
      const notifs = fleksers.map(f => ({
        usuario_id: f.id,
        tipo: 'nuevo_trabajo',
        titulo: '🔔 Nuevo trabajo en ' + ciudadUsuario,
        mensaje: (cat?.emoji || '✨') + ' ' + tituloFinal,
        link: '/trabajo?id=' + servicioId,
      }));

      // Insertar en batch
      await supabase.from('notificaciones').insert(notifs);

      // Intentar push (falla silenciosamente si no hay PWA push o suscripciones)
      fleksers.forEach(f => {
        fetch('/api/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-cron-secret': '' },
          body: JSON.stringify({
            usuario_id: f.id,
            titulo: '🔔 Nuevo trabajo en ' + ciudadUsuario,
            mensaje: (cat?.emoji || '✨') + ' ' + tituloFinal,
            link: '/trabajo?id=' + servicioId,
          }),
        }).catch(() => {});
      });
    } catch (e) {
      // Silencioso: nunca debe romper la publicación
    }
  };

  const handlePublicar = async () => {
    const tituloFinal = titulo.trim() || generarTituloAutomatico();
    if (!tituloFinal || fechas.length === 0) { setError('Por favor completa el título y selecciona al menos una fecha'); return; }
    setCargando(true); setError('');
    const fechaPrincipal = fechas[0];
    const ahora = new Date();
    const fechaSeleccionada = new Date(fechaPrincipal + 'T' + (hora || '23:59'));
    if (fechaSeleccionada < ahora) { setError('La fecha y hora del trabajo no puede ser en el pasado'); setCargando(false); return; }
    if (urgente) {
      const tresHoras = new Date(ahora.getTime() + 3 * 60 * 60 * 1000);
      if (fechaSeleccionada < tresHoras) {
        setError('Para trabajos urgentes necesitas al menos 3 horas de anticipación.');
        setCargando(false); return;
      }
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }
      let coords = null;
      if (direccion.trim()) coords = await geocodificarDireccion(direccion);
      const descripcionFinal = generarDescripcion();
      const { data: servicioCreado, error: dbError } = await supabase.from('servicios').insert({
        cliente_id: user.id,
        titulo: tituloFinal,
        descripcion: descripcionFinal,
        categoria: categoriaSeleccionada,
        fecha: fechaPrincipal,
        fechas_multiples: fechas.length > 1 ? fechas : null,
        hora: hora || null,
        presupuesto: null,
        direccion: direccion || null,
        lat: coords?.lat || null, lng: coords?.lng || null,
        urgente, seguro: false, metodo_pago: metodoPago,
        modo_pago: fechas.length > 1 ? modoPago : null,
        estado: 'activo',
        flekser_sugerido_id: flekserSugerido?.id || null,
        cupos: esEmpresa ? cupos : 1, cupos_tomados: 0,
      }).select().single();
      if (dbError) throw dbError;
      if (fotoProblema && servicioCreado) {
        const urlFoto = await subirFotoProblema(servicioCreado.id);
        if (urlFoto) {
          await supabase.from('servicios').update({ foto_problema: urlFoto }).eq('id', servicioCreado.id);
        }
      }
      if (flekserSugerido?.id && servicioCreado) {
        try {
          await supabase.from('notificaciones').insert({
            usuario_id: flekserSugerido.id, tipo: 'solicitud_directa',
            titulo: '🎯 ¡Te enviaron una solicitud directa!',
            mensaje: 'Alguien quiere contratarte para: "' + tituloFinal + '" el ' + fechaPrincipal + '. ¡Aplica antes que nadie!',
            link: '/trabajo?id=' + servicioCreado.id,
          });
        } catch (e) {}
      } else if (servicioCreado) {
        // Notificar a Fleksers de la misma ciudad
        notificarFleksersCercanos(servicioCreado.id, tituloFinal);
      }
      setPublicado(true);
    } catch (err: any) { setError(err.message || 'Ocurrió un error. Intenta de nuevo.'); }
    finally { setCargando(false); }
  };

  if (publicado) {
    const tituloFinal = titulo.trim() || generarTituloAutomatico();
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">{flekserSugerido ? '🎯' : '🎉'}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
            {flekserSugerido ? '¡Solicitud enviada a ' + flekserSugerido.nombre?.split(' ')[0] + '!' : '¡Publicado con éxito!'}
          </h1>
          <p className="text-gray-400 mb-8 font-light">
            {flekserSugerido ? flekserSugerido.nombre?.split(' ')[0] + ' recibió una notificación y podrá aplicar directamente.' : 'Tu solicitud ya está visible. Los Fleksers cercanos te enviarán sus propuestas con precio incluido.'}
          </p>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-5 text-left">
            <p className="text-blue-800 text-sm font-bold mb-1">💡 ¿Qué sigue?</p>
            <p className="text-blue-700 text-xs leading-relaxed">Los Fleksers interesados aplicarán con su precio propuesto. Tú revisas sus perfiles, calificaciones y precios, y eliges al que más te convenga.</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4 text-left">
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
            <div className="flex justify-between mb-2"><span className="text-gray-400 text-sm">Servicio</span><span className="font-semibold text-sm text-gray-900 text-right max-w-48">{tituloFinal}</span></div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400 text-sm">Fecha{fechas.length > 1 ? 's' : ''}</span>
              <span className="font-semibold text-sm text-gray-900 text-right max-w-48">
                {fechas.length === 1 ? fechas[0] + (hora ? ' ' + hora : '') : fechas.length + ' días seleccionados'}
              </span>
            </div>
            {direccion && <div className="flex justify-between mb-2"><span className="text-gray-400 text-sm">Dirección</span><span className="font-semibold text-sm text-gray-900 text-right max-w-48">{direccion}</span></div>}
            <div className="flex justify-between mb-2"><span className="text-gray-400 text-sm">Precio</span><span className="font-semibold text-sm text-blue-600">Los Fleksers propondrán su precio</span></div>
            <div className="flex justify-between mb-2"><span className="text-gray-400 text-sm">Pago</span><span className="font-semibold text-sm text-gray-900">{metodoPago === 'stripe' ? '💳 Stripe' : '💵 Efectivo'}</span></div>
            {esMutipleDias && <div className="flex justify-between mb-2"><span className="text-gray-400 text-sm">Cobro</span><span className="font-semibold text-sm text-gray-900">{modoPago === 'por_dia' ? '📅 Por día' : '💰 Total al final'}</span></div>}
            <div className="flex justify-between"><span className="text-gray-400 text-sm">Estado</span><span className="font-semibold text-sm text-green-600">✅ Activo</span></div>
          </div>
          <a href="/aplicaciones" className="block w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:opacity-90 transition mb-3">Ver propuestas</a>
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
            <button
              onClick={handleAtras}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">
              ←
            </button>
            <div>
              <h1 className="font-extrabold text-gray-900 text-lg">Publicar solicitud</h1>
              <p className="text-gray-400 text-xs">Paso {paso} de 3</p>
            </div>
          </div>
          <div className="flex gap-2">
            {[1,2,3].map((p) => (<div key={p} className={'h-1.5 flex-1 rounded-full transition-all ' + (p <= paso ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200')}/>))}
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

        {/* ── PASO 1: CATEGORÍA ── */}
        {paso === 1 && (
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">¿Qué necesitas?</h2>
            <p className="text-gray-400 mb-6 font-light">Elige la categoría que mejor describe tu solicitud</p>
            <div className="grid grid-cols-2 gap-3">
              {categorias.map((cat) => (
                <button key={cat.id} onClick={() => setCategoriaSeleccionada(cat.id)}
                  className={'p-4 rounded-2xl border-2 text-left transition ' + (categoriaSeleccionada === cat.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white hover:border-purple-300')}>
                  <span className="text-2xl mb-2 block">{cat.emoji}</span>
                  <span className="text-sm font-semibold text-gray-900">{cat.nombre}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── PASO 2: DETALLES ── */}
        {paso === 2 && (
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-1">Cuéntanos más</h2>
            <p className="text-gray-400 mb-6 font-light">Con más detalles recibirás mejores propuestas</p>
            {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-4 text-sm">{error}</div>}
            <div className="flex flex-col gap-5">

              {preguntasActuales.map((p) => (
                <div key={p.id}>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">{p.pregunta}</label>
                  <textarea
                    placeholder={p.placeholder}
                    value={respuestasCategoria[p.id] || ''}
                    onChange={(e) => setRespuestasCategoria(prev => ({ ...prev, [p.id]: e.target.value }))}
                    rows={2}
                    className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900 resize-none text-sm"
                  />
                </div>
              ))}

              {/* Foto opcional */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">
                  📸 Foto del problema o referencia <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <p className="text-xs text-gray-400 mb-3">Una imagen ayuda mucho a los Fleksers a entender exactamente qué necesitas</p>
                {fotoProblemaUrl ? (
                  <div className="relative">
                    <img src={fotoProblemaUrl} alt="Foto del problema" className="w-full h-48 object-cover rounded-2xl border-2 border-purple-200"/>
                    <button onClick={() => { setFotoProblema(null); setFotoProblemaUrl(''); }} className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md text-gray-600 font-bold hover:bg-red-50 hover:text-red-500 transition">✕</button>
                    <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">✅ Foto agregada</div>
                  </div>
                ) : (
                  <button onClick={() => fotoInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-purple-400 hover:bg-purple-50 transition">
                    <span className="text-3xl">📷</span>
                    <span className="text-sm font-semibold text-gray-500">Toca para agregar foto</span>
                    <span className="text-xs text-gray-400">JPG, PNG — máx 10MB</span>
                  </button>
                )}
                <input ref={fotoInputRef} type="file" accept="image/*" onChange={handleFotoProblema} className="hidden"/>
              </div>

              {/* Dirección */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">📍 Dirección del trabajo</label>
                <input type="text" placeholder="Ej. Calle Reforma 123, Col. Centro, Irapuato" value={direccion} onChange={(e) => setDireccion(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900"/>
                <p className="text-xs text-gray-400 mt-1">Se usará para mostrar Fleksers cercanos a ti</p>
              </div>

              {/* ── SELECTOR DE FECHAS MÚLTIPLES ── */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">📅 ¿Para cuándo lo necesitas?</label>
                <p className="text-xs text-gray-400 mb-3">Puedes seleccionar varios días si necesitas el servicio más de una vez</p>
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {generarFechasProximas().map((f) => {
                    const seleccionada = fechas.includes(f);
                    const esHoy = f === hoyStr;
                    return (
                      <button key={f} onClick={() => toggleFecha(f)}
                        className={'py-2.5 px-2 rounded-xl text-xs font-semibold transition border-2 ' + (seleccionada ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300')}>
                        {esHoy ? '📅 Hoy' : formatFecha(f)}
                      </button>
                    );
                  })}
                </div>
                {fechas.length > 0 && (
                  <div className="mt-3 bg-purple-50 rounded-xl p-3 border border-purple-100">
                    <p className="text-xs font-bold text-purple-700 mb-1">{fechas.length === 1 ? '1 día seleccionado' : fechas.length + ' días seleccionados'}</p>
                    <div className="flex flex-wrap gap-1">
                      {fechas.map(f => (
                        <span key={f} className="text-xs bg-white border border-purple-200 text-purple-600 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                          {formatFecha(f)}
                          <button onClick={() => toggleFecha(f)} className="text-purple-400 hover:text-red-500 ml-0.5">✕</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modo de cobro para múltiples días */}
              {esMutipleDias && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">💰 ¿Cómo prefieres pagar?</label>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => setModoPago('total')} className={'flex items-center gap-3 p-4 rounded-2xl border-2 transition text-left ' + (modoPago === 'total' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white')}>
                      <div className={'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ' + (modoPago === 'total' ? 'border-purple-500' : 'border-gray-300')}>
                        {modoPago === 'total' && <div className="w-2.5 h-2.5 bg-purple-500 rounded-full"/>}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">💰 Pago total al finalizar</p>
                        <p className="text-xs text-gray-400">El Flekser propone un precio por todos los días. Pagas cuando termina el último día.</p>
                      </div>
                    </button>
                    <button onClick={() => setModoPago('por_dia')} className={'flex items-center gap-3 p-4 rounded-2xl border-2 transition text-left ' + (modoPago === 'por_dia' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white')}>
                      <div className={'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ' + (modoPago === 'por_dia' ? 'border-blue-500' : 'border-gray-300')}>
                        {modoPago === 'por_dia' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"/>}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">📅 Cobro por día</p>
                        <p className="text-xs text-gray-400">El Flekser propone un precio diario. Se cobra automáticamente al terminar cada día.</p>
                      </div>
                    </button>
                  </div>
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-xs text-amber-700 font-semibold">🔒 En ambos casos el dinero queda retenido en Stripe hasta que confirmes que el trabajo fue completado.</p>
                  </div>
                </div>
              )}

              {/* Hora */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  🕐 Hora preferida <span className="text-gray-400 font-normal">(opcional)</span>
                  {horaMinima && <span className="text-amber-600 font-semibold ml-2">— mínimo {horaMinima.slice(0,5)}</span>}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {horasFiltradas.map((h) => (
                    <button key={h} onClick={() => setHora(hora === h ? '' : h)}
                      className={'py-2 rounded-xl text-sm font-semibold transition border-2 ' + (hora === h ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 bg-white text-gray-500 hover:border-purple-300')}>
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cupos empresa */}
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
                </div>
              )}

              {/* Método de pago */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">💳 Método de pago</label>
                <div className="flex flex-col gap-2">
                  <button onClick={() => setMetodoPago('stripe')} className={'flex items-center gap-3 p-4 rounded-2xl border-2 transition text-left ' + (metodoPago === 'stripe' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white')}>
                    <div className={'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ' + (metodoPago === 'stripe' ? 'border-purple-500' : 'border-gray-300')}>
                      {metodoPago === 'stripe' && <div className="w-2.5 h-2.5 bg-purple-500 rounded-full"/>}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-sm">💳 Pagar con tarjeta</p>
                      <p className="text-xs text-gray-400">Pago seguro vía Stripe. Sin comisión extra.</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-1 rounded-full">Recomendado</span>
                  </button>
                  <button onClick={() => efectivoHabilitado ? setMetodoPago('efectivo') : null}
                    className={'flex items-center gap-3 p-4 rounded-2xl border-2 transition text-left ' + (!efectivoHabilitado ? 'opacity-60 cursor-not-allowed border-gray-200 bg-gray-50' : metodoPago === 'efectivo' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 bg-white')}>
                    <div className={'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ' + (metodoPago === 'efectivo' && efectivoHabilitado ? 'border-teal-500' : 'border-gray-300')}>
                      {metodoPago === 'efectivo' && efectivoHabilitado && <div className="w-2.5 h-2.5 bg-teal-500 rounded-full"/>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 text-sm">💵 Pago en efectivo</p>
                        {!efectivoHabilitado && <span className="text-xs">🔒</span>}
                      </div>
                      {efectivoHabilitado
                        ? <p className="text-xs text-gray-400">5% de comisión para cada parte vía wallet.</p>
                        : <p className="text-xs text-amber-600 font-semibold">Necesitas $50 en tu wallet. <a href="/wallet/recargar" className="underline" onClick={(e) => e.stopPropagation()}>Recargar →</a></p>}
                    </div>
                    {efectivoHabilitado && <span className="text-xs bg-teal-100 text-teal-700 font-bold px-2 py-1 rounded-full">Saldo: ${walletSaldo.toFixed(0)}</span>}
                  </button>
                </div>
              </div>

              {/* Urgente */}
              <div onClick={() => setUrgente(!urgente)} className={'flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition ' + (urgente ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white')}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔴</span>
                  <div>
                    <p className="font-semibold text-gray-900">Marcar como urgente</p>
                    <p className="text-xs text-gray-400">Mínimo 3 horas de anticipación · Aparece primero</p>
                  </div>
                </div>
                <div className={'w-12 h-6 rounded-full transition-all ' + (urgente ? 'bg-red-500' : 'bg-gray-300')}>
                  <div className={'w-6 h-6 bg-white rounded-full shadow transition-all ' + (urgente ? 'translate-x-6' : 'translate-x-0')}/>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PASO 3: CONFIRMACIÓN ── */}
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
                <div className="flex justify-between items-start">
                  <span className="text-gray-400 text-sm">Categoría</span>
                  <span className="font-semibold text-sm text-gray-900">{categorias.find(c => c.id === categoriaSeleccionada)?.emoji} {categorias.find(c => c.id === categoriaSeleccionada)?.nombre}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-gray-400 text-sm flex-shrink-0">Fecha{fechas.length > 1 ? 's' : ''}</span>
                  <div className="text-right ml-4">
                    {fechas.length === 1 ? (
                      <span className="font-semibold text-sm text-gray-900">{fechas[0]} {hora || ''}</span>
                    ) : (
                      <div className="flex flex-wrap gap-1 justify-end">
                        {fechas.map(f => <span key={f} className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full">{formatFecha(f)}</span>)}
                      </div>
                    )}
                  </div>
                </div>
                {hora && <div className="flex justify-between"><span className="text-gray-400 text-sm">Hora</span><span className="font-semibold text-sm text-gray-900">{hora}</span></div>}
                {direccion && <div className="flex justify-between items-start"><span className="text-gray-400 text-sm flex-shrink-0">Dirección</span><span className="font-semibold text-sm text-gray-900 text-right ml-4">{direccion}</span></div>}
                {esEmpresa && cupos > 1 && <div className="flex justify-between"><span className="text-gray-400 text-sm">Personas</span><span className="font-semibold text-sm text-gray-900">{cupos} personas</span></div>}
                <div className="flex justify-between"><span className="text-gray-400 text-sm">Método de pago</span><span className="font-semibold text-sm text-gray-900">{metodoPago === 'stripe' ? '💳 Tarjeta' : '💵 Efectivo'}</span></div>
                {esMutipleDias && <div className="flex justify-between"><span className="text-gray-400 text-sm">Cobro</span><span className="font-semibold text-sm text-gray-900">{modoPago === 'por_dia' ? '📅 Por día' : '💰 Total al finalizar'}</span></div>}
                {urgente && <div className="flex justify-between"><span className="text-gray-400 text-sm">Urgencia</span><span className="font-semibold text-sm text-red-600">🔴 Urgente</span></div>}
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <p className="text-sm font-bold text-gray-700 mb-3">📋 Tu descripción</p>
              <div className="flex flex-col gap-3">
                {preguntasActuales.map((p) => {
                  const r = respuestasCategoria[p.id];
                  if (!r?.trim()) return null;
                  return (
                    <div key={p.id}>
                      <p className="text-xs font-semibold text-gray-500">{p.pregunta}</p>
                      <p className="text-sm text-gray-800 mt-0.5">{r}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {fotoProblemaUrl && (
              <div className="mb-4">
                <p className="text-sm font-bold text-gray-700 mb-2">📸 Foto adjunta</p>
                <img src={fotoProblemaUrl} alt="Foto del problema" className="w-full h-40 object-cover rounded-2xl border border-gray-200"/>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4">
              <p className="text-blue-800 text-sm font-bold mb-1">💡 Sobre el precio</p>
              <p className="text-blue-700 text-xs leading-relaxed">Los Fleksers interesados te enviarán sus propuestas con precio incluido. Tú puedes aceptar directamente o hacer una contraoferta.</p>
            </div>

            {geocodificando && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 mb-4 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0"/>
                <p className="text-blue-700 text-xs font-semibold">Verificando dirección...</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-md mx-auto flex gap-3">
          {paso > 1 && (
            <button onClick={() => setPaso(paso - 1)} className="flex-1 py-4 border-2 border-gray-200 text-gray-700 rounded-2xl font-bold hover:border-purple-400 transition">
              ← Regresar
            </button>
          )}
          {paso < 3 ? (
            <button
              onClick={() => { setError(''); setPaso(paso + 1); }}
              disabled={paso === 1 && !categoriaSeleccionada}
              className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold shadow-lg hover:opacity-90 transition disabled:opacity-50">
              Continuar →
            </button>
          ) : (
            <button
              onClick={handlePublicar}
              disabled={cargando || geocodificando || subiendoFoto || fechas.length === 0}
              className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold shadow-lg hover:opacity-90 transition disabled:opacity-50">
              {cargando ? 'Publicando...' : subiendoFoto ? 'Subiendo foto...' : geocodificando ? 'Verificando...' : flekserSugerido ? '🎯 Enviar a ' + flekserSugerido.nombre?.split(' ')[0] : '🚀 Publicar solicitud'}
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