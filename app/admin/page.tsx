'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import * as XLSX from 'xlsx';

const ADMIN_EMAIL = 'fernando.najera.nm@gmail.com';

const LABEL_DOCS: Record<string, string> = {
  ine_frente: 'INE Frente',
  ine_reverso: 'INE Reverso',
  curp: 'CURP',
  comprobante_domicilio: 'Comprobante domicilio',
  antecedentes: 'Antecedentes no penales',
  licencia: 'Licencia de conducir',
  constancia_fiscal: 'Constancia fiscal',
};

const PERIODOS = [
  { key: '1m', label: 'Mensual', meses: 1 },
  { key: '2m', label: 'Bimestral', meses: 2 },
  { key: '3m', label: 'Trimestral', meses: 3 },
  { key: '6m', label: 'Semestral', meses: 6 },
  { key: '12m', label: 'Anual', meses: 12 },
];

function semanaLabel(fecha: Date) {
  return fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}

function generarSemanas(semanas: number) {
  const resultado = [];
  const hoy = new Date();
  for (let i = semanas - 1; i >= 0; i--) {
    const inicio = new Date(hoy);
    inicio.setDate(inicio.getDate() - i * 7);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 6);
    resultado.push({ inicio, fin, label: semanaLabel(inicio) });
  }
  return resultado;
}

function generarMensajeWhatsApp(notif: any, usuario: any): string {
  const nombre = usuario?.nombre?.split(' ')[0] || 'usuario';
  const link = 'bit.ly/fleksiapp';
  switch (notif.tipo) {
    case 'nueva_aplicacion': return 'Hola ' + nombre + '! 👋 Tienes una nueva aplicación en Fleksi. Alguien quiere trabajar contigo. Entra a ver los detalles 👉 ' + link;
    case 'aplicacion_aceptada': return 'Hola ' + nombre + '! 🎉 ¡Te aceptaron! Tu aplicación fue aprobada. Entra a Fleksi para ver los detalles del trabajo 👉 ' + link;
    case 'aplicacion_rechazada': return 'Hola ' + nombre + ', tu aplicación no fue seleccionada esta vez, pero hay más oportunidades esperándote en Fleksi 👉 ' + link;
    case 'pago_liberado': return 'Hola ' + nombre + '! 💰 ¡Tu pago fue liberado! Ya está disponible en tu wallet de Fleksi 👉 ' + link;
    case 'trabajo_completado': return 'Hola ' + nombre + '! 🎉 El trabajo fue completado. Entra a Fleksi para confirmar y liberar el pago 👉 ' + link;
    case 'verificacion_aprobada': return 'Hola ' + nombre + '! ✅ ¡Tu identidad fue verificada! Ya tienes el badge de confianza en tu perfil de Fleksi 👉 ' + link;
    case 'documento_aprobado': return 'Hola ' + nombre + '! ✅ Tu documento fue aprobado en Fleksi. Sigue el proceso de verificación 👉 ' + link;
    case 'documento_rechazado': return 'Hola ' + nombre + ', uno de tus documentos necesita corrección en Fleksi. Entra para ver el detalle 👉 ' + link;
    case 'retiro_completado': return 'Hola ' + nombre + '! ✅ Tu retiro fue procesado y enviado a tu cuenta bancaria. Revisa tu estado de cuenta 💳';
    case 'retiro_rechazado': return 'Hola ' + nombre + ', tu solicitud de retiro no pudo procesarse. El saldo fue reintegrado a tu wallet de Fleksi. Entra para ver el motivo 👉 ' + link;
    case 'mensaje_nuevo': return 'Hola ' + nombre + '! 💬 Tienes un mensaje nuevo en Fleksi. Entra a responder 👉 ' + link;
    case 'disputa': return 'Hola ' + nombre + ', hay una disputa abierta en tu trabajo. Nuestro equipo la está revisando. Te contactaremos pronto.';
    case 'admin_mensaje': return 'Hola ' + nombre + '! Tienes un mensaje del equipo Fleksi. Entra a verlo 👉 ' + link;
    default: return 'Hola ' + nombre + '! Tienes una notificación nueva en Fleksi 👉 ' + link;
  }
}

function tipoLabel(tipo: string): { emoji: string; label: string; color: string } {
  const map: Record<string, { emoji: string; label: string; color: string }> = {
    nueva_aplicacion: { emoji: '✋', label: 'Nueva aplicación', color: 'bg-blue-100 text-blue-700' },
    aplicacion_aceptada: { emoji: '✅', label: 'Aplicación aceptada', color: 'bg-green-100 text-green-700' },
    aplicacion_rechazada: { emoji: '❌', label: 'Aplicación rechazada', color: 'bg-red-100 text-red-600' },
    pago_liberado: { emoji: '💰', label: 'Pago liberado', color: 'bg-green-100 text-green-700' },
    trabajo_completado: { emoji: '🎉', label: 'Trabajo completado', color: 'bg-purple-100 text-purple-700' },
    verificacion_aprobada: { emoji: '🏆', label: 'Verificación aprobada', color: 'bg-green-100 text-green-700' },
    documento_aprobado: { emoji: '✅', label: 'Documento aprobado', color: 'bg-green-100 text-green-700' },
    documento_rechazado: { emoji: '❌', label: 'Documento rechazado', color: 'bg-red-100 text-red-600' },
    retiro_completado: { emoji: '🏦', label: 'Retiro completado', color: 'bg-teal-100 text-teal-700' },
    retiro_rechazado: { emoji: '❌', label: 'Retiro rechazado', color: 'bg-red-100 text-red-600' },
    mensaje_nuevo: { emoji: '💬', label: 'Mensaje nuevo', color: 'bg-blue-100 text-blue-700' },
    disputa: { emoji: '⚠️', label: 'Disputa abierta', color: 'bg-amber-100 text-amber-700' },
    admin_mensaje: { emoji: '📢', label: 'Mensaje admin', color: 'bg-gray-100 text-gray-600' },
  };
  return map[tipo] || { emoji: '🔔', label: tipo, color: 'bg-gray-100 text-gray-600' };
}

export default function Admin() {
  const [usuario, setUsuario] = useState<any>(null);
  const [verificaciones, setVerificaciones] = useState<any[]>([]);
  const [documentosPorUsuario, setDocumentosPorUsuario] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [rechazando, setRechazando] = useState('');
  const [filtro, setFiltro] = useState('en_revision');
  const [tab, setTab] = useState<'dashboard' | 'acciones' | 'documentos' | 'verificaciones' | 'dispersion' | 'retiros' | 'comunicaciones' | 'trabajos' | 'habilidades'>('dashboard');
  const [usuarioExpandido, setUsuarioExpandido] = useState<string | null>(null);
  const [rechazandoDoc, setRechazandoDoc] = useState('');
  const [motivoDoc, setMotivoDoc] = useState('');
  const [procesandoDoc, setProcesandoDoc] = useState('');
  const [periodoReporte, setPeriodoReporte] = useState('1m');
  const [generandoReporte, setGenerandoReporte] = useState('');

  const [pagosDispersion, setPagosDispersion] = useState<any[]>([]);
  const [cargandoDispersion, setCargandoDispersion] = useState(false);
  const [filtroDispersion, setFiltroDispersion] = useState<'pendiente' | 'dispersado'>('pendiente');
  const [marcandoDispersado, setMarcandoDispersado] = useState('');
  const [notaDispersion, setNotaDispersion] = useState<Record<string, string>>({});

  const [retiros, setRetiros] = useState<any[]>([]);
  const [cargandoRetiros, setCargandoRetiros] = useState(false);
  const [filtroRetiros, setFiltroRetiros] = useState<'pendiente' | 'completado' | 'rechazado'>('pendiente');
  const [procesandoRetiro, setProcesandoRetiro] = useState('');
  const [notaRetiro, setNotaRetiro] = useState<Record<string, string>>({});
  const [rechazandoRetiro, setRechazandoRetiro] = useState('');

  const [modalUsuarios, setModalUsuarios] = useState<{ visible: boolean; rol: string; lista: any[] }>({ visible: false, rol: '', lista: [] });
  const [cargandoModal, setCargandoModal] = useState(false);

  const [modalServicios, setModalServicios] = useState<{ visible: boolean; estado: string; lista: any[] }>({ visible: false, estado: '', lista: [] });
  const [cargandoModalServicios, setCargandoModalServicios] = useState(false);

  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState<any[]>([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<any>(null);
  const [tituloMensaje, setTituloMensaje] = useState('');
  const [cuerpoMensaje, setCuerpoMensaje] = useState('');
  const [enviandoMensaje, setEnviandoMensaje] = useState(false);
  const [mensajeEnviado, setMensajeEnviado] = useState('');
  const [segmentoMasivo, setSegmentoMasivo] = useState<'todos' | 'fleksers' | 'empresas' | 'verificados'>('todos');
  const [tituloMasivo, setTituloMasivo] = useState('');
  const [cuerpoMasivo, setCuerpoMasivo] = useState('');
  const [enviandoMasivo, setEnviandoMasivo] = useState(false);
  const [mensajeMasivoEnviado, setMensajeMasivoEnviado] = useState('');
  const [modoComunicacion, setModoComunicacion] = useState<'individual' | 'masivo' | 'whatsapp' | 'metricas'>('individual');
  const [metricasMensajes, setMetricasMensajes] = useState<any[]>([]);
  const [cargandoMetricasMensajes, setCargandoMetricasMensajes] = useState(false);
  const [errorMetricasMensajes, setErrorMetricasMensajes] = useState('');
  const [metricaExpandida, setMetricaExpandida] = useState<{ idx: number; filtro: 'enviados' | 'leidos' | 'noLeidos' } | null>(null);

  const [acciones, setAcciones] = useState<any[]>([]);
  const [cargandoAcciones, setCargandoAcciones] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [marcandoLeida, setMarcandoLeida] = useState<string | null>(null);

  const [habilidadesPersonalizadas, setHabilidadesPersonalizadas] = useState<{ texto: string; count: number; fleksers: any[] }[]>([]);
  const [cargandoHabilidades, setCargandoHabilidades] = useState(false);

  const [usuariosWA, setUsuariosWA] = useState<any[]>([]);
  const [cargandoWA, setCargandoWA] = useState(false);
  const [mensajesCopiados, setMensajesCopiados] = useState<Record<string, boolean>>({});

  const [trabajosData, setTrabajosData] = useState<any[]>([]);
  const [cargandoTrabajos, setCargandoTrabajos] = useState(false);
  const [filtroTrabajos, setFiltroTrabajos] = useState<'todos' | 'activo' | 'completado' | 'cancelado'>('todos');
  const [periodoTrabajos, setPeriodoTrabajos] = useState<'7d' | '30d' | '90d' | 'todo'>('30d');

  const [metrics, setMetrics] = useState({
    totalUsuarios: 0, fleksers: 0, empresas: 0,
    nuevosHoy: 0, nuevosEsteMes: 0,
    serviciosPublicados: 0, serviciosCompletados: 0, serviciosCancelados: 0,
    ingresosDia: 0, ingresosMes: 0, comisionAcumulada: 0,
    ciudadTopNombre: '—', ciudadTopCount: 0,
    intencionTrabajar: 0, intencionContratar: 0, intencionAmbos: 0, intencionSinDato: 0,
  });
  const [cargandoMetrics, setCargandoMetrics] = useState(true);
  const [datosUsuarios, setDatosUsuarios] = useState<any[]>([]);
  const [datosServicios, setDatosServicios] = useState<any[]>([]);
  const [datosIngresos, setDatosIngresos] = useState<any[]>([]);

  useEffect(() => { cargarDatos(); cargarMetrics(); }, []);
  useEffect(() => { if (tab === 'dispersion') cargarDispersion(); }, [tab]);
  useEffect(() => { if (tab === 'retiros') cargarRetiros(); }, [tab]);
  useEffect(() => { if (tab === 'acciones') cargarAcciones(); }, [tab]);
  useEffect(() => { if (tab === 'trabajos') cargarTrabajos(); }, [tab, periodoTrabajos]);
  useEffect(() => { if (tab === 'habilidades') cargarHabilidadesPersonalizadas(); }, [tab]);

  const cargarMetricasMensajes = async () => {
    setCargandoMetricasMensajes(true);
    setErrorMetricasMensajes('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/metricas-mensajes', {
        headers: { Authorization: 'Bearer ' + (session?.access_token || '') },
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMetricasMensajes(data.error || 'Error al cargar métricas');
        setMetricasMensajes([]);
        return;
      }
      setMetricasMensajes(data.mensajes || []);
      setMetricaExpandida(null);
    } catch (e) {
      console.error(e);
      setErrorMetricasMensajes('Error al cargar métricas');
    } finally {
      setCargandoMetricasMensajes(false);
    }
  };

  const HABILIDADES_OFICIALES = [
    '🧹 Limpieza del hogar', '🌿 Jardinería', '🎨 Pintura',
    '🔧 Mantenimiento general', '⚡ Electricidad', '🚿 Plomería',
    '🚚 Fletes y traslados', '🪑 Armado de muebles', '🔩 Mecánica básica',
    '🔑 Cerrajería', '📺 Instalación TV/repisas/cortinas', '🪵 Carpintería ligera',
    '📦 Mudanza ligera / Ayudante', '👔 Planchado / Lavandería', '💅 Uñas / Estética',
    '🎪 Staff para eventos', '🍽️ Mesero', '🍳 Cocinero particular',
    '🚗 Chofer ejecutivo', '🗣️ Intérprete / Traductor',
  ];

  const cargarHabilidadesPersonalizadas = async () => {
    setCargandoHabilidades(true);
    try {
      const { data } = await supabase.from('usuarios').select('id, nombre, email, habilidades').eq('rol', 'flekser');
      const grupos: Record<string, any[]> = {};
      (data || []).forEach((u: any) => {
        (u.habilidades || []).forEach((h: string) => {
          if (HABILIDADES_OFICIALES.includes(h)) return;
          if (!grupos[h]) grupos[h] = [];
          grupos[h].push({ id: u.id, nombre: u.nombre, email: u.email });
        });
      });
      const lista = Object.entries(grupos).map(([texto, fleksers]) => ({ texto, count: fleksers.length, fleksers }))
        .sort((a, b) => b.count - a.count);
      setHabilidadesPersonalizadas(lista);
    } catch (e) { console.error(e); }
    finally { setCargandoHabilidades(false); }
  };

  const cargarTrabajos = async () => {
    setCargandoTrabajos(true);
    try {
      let query = supabase
        .from('servicios')
        .select('id, titulo, categoria, estado, presupuesto, created_at, completado_at, usuarios(id, nombre, foto_url)')
        .order('created_at', { ascending: false });
      if (periodoTrabajos !== 'todo') {
        const dias = periodoTrabajos === '7d' ? 7 : periodoTrabajos === '30d' ? 30 : 90;
        const desde = new Date();
        desde.setDate(desde.getDate() - dias);
        query = query.gte('created_at', desde.toISOString());
      }
      const { data } = await query;
      const { data: apps } = await supabase
        .from('aplicaciones')
        .select('servicio_id, precio_ofrecido, estado, servicios(presupuesto)')
        .eq('estado', 'completado');
      const contraofertaIds = new Set(
        (apps || [])
          .filter((a: any) => a.precio_ofrecido && a.servicios?.presupuesto && a.precio_ofrecido !== a.servicios.presupuesto)
          .map((a: any) => a.servicio_id)
      );
      setTrabajosData((data || []).map(t => ({ ...t, tuvo_contraoferta: contraofertaIds.has(t.id) })));
    } catch (e) { console.error(e); }
    finally { setCargandoTrabajos(false); }
  };

  const cargarUsuariosWA = async () => {
    setCargandoWA(true);
    try {
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id, nombre, telefono, foto_url, ciudad, descripcion, habilidades, rol')
        .order('created_at', { ascending: false });
      const { data: docs } = await supabase.from('documentos').select('usuario_id, tipo, estado');
      const docsMap: Record<string, any[]> = {};
      (docs || []).forEach((d: any) => {
        if (!docsMap[d.usuario_id]) docsMap[d.usuario_id] = [];
        docsMap[d.usuario_id].push(d);
      });
      const conProgreso = (usuarios || []).map((u: any) => {
        const userDocs = docsMap[u.id] || [];
        const rol = u.rol || 'flekser';
        const docsRequeridos = rol === 'empresa'
          ? ['ine_frente', 'ine_reverso', 'constancia_fiscal']
          : ['ine_frente', 'ine_reverso', 'curp', 'comprobante_domicilio'];
        const faltantes: string[] = [];
        if (!u.foto_url) faltantes.push('foto de perfil');
        if (!u.ciudad?.trim()) faltantes.push('ciudad');
        if (!u.descripcion?.trim()) faltantes.push('descripción');
        if (rol !== 'empresa' && (!u.habilidades || u.habilidades.length === 0)) faltantes.push('habilidades');
        const labelDoc: Record<string, string> = {
          ine_frente: 'INE frente', ine_reverso: 'INE reverso',
          curp: 'CURP', comprobante_domicilio: 'comprobante de domicilio', constancia_fiscal: 'constancia fiscal',
        };
        docsRequeridos.forEach(tipo => {
          const doc = userDocs.find((d: any) => d.tipo === tipo);
          if (!doc || doc.estado === 'pendiente') faltantes.push(labelDoc[tipo] || tipo);
        });
        let puntos = 0;
        if (u.foto_url) puntos += 15;
        if (u.ciudad?.trim()) puntos += 15;
        if (u.descripcion?.trim()) puntos += 15;
        if (u.habilidades?.length > 0) puntos += 15;
        const docsSubidos = docsRequeridos.filter(tipo =>
          userDocs.some((d: any) => d.tipo === tipo && (d.estado === 'subido' || d.estado === 'aprobado'))
        ).length;
        puntos += Math.round((docsSubidos / docsRequeridos.length) * 40);
        return { ...u, faltantes, progreso: Math.min(puntos, 100) };
      });
      setUsuariosWA(conProgreso);
    } catch (e) { console.error(e); }
    finally { setCargandoWA(false); }
  };

  const generarMensajeWA = (u: any): string => {
    const nombre = u.nombre?.split(' ')[0] || 'amigo';
    const faltantes: string[] = u.faltantes || [];
    const progreso: number = u.progreso || 0;
    let faltaTexto = '';
    if (faltantes.length === 0) {
      faltaTexto = '¡Tu perfil ya está completo! 🎉';
    } else if (faltantes.length === 1) {
      faltaTexto = 'Solo te falta agregar tu *' + faltantes[0] + '* y estarás listo.';
    } else if (faltantes.length === 2) {
      faltaTexto = 'Te falta agregar tu *' + faltantes[0] + '* y tu *' + faltantes[1] + '*.';
    } else {
      const primeros = faltantes.slice(0, -1).map((f: string) => '*' + f + '*').join(', ');
      faltaTexto = 'Te falta: ' + primeros + ' y *' + faltantes[faltantes.length - 1] + '*.';
    }
    const lineas = [
      '¡Hola, ' + nombre + '! 👋',
      '',
      'Somos el equipo de *Fleksi* y notamos que tu perfil aún no está completo.',
      '',
      faltaTexto,
      '',
      '📊 Actualmente tienes un *' + progreso + '%* de perfil completado.',
      '',
      '💡 Los Fleksers con perfil completo tienen hasta un *90% más de probabilidades* de que los contraten. Es lo primero que ven los clientes al elegir a quién contratarle.',
      '',
      '📲 *Tip importante:* Si estás usando Fleksi desde el navegador de tu celular, te recomendamos *agregar la app a tu pantalla de inicio* para que se sienta como una app nativa y sea más fácil de usar. En iPhone: Safari → compartir → "Agregar a pantalla de inicio". En Android: Chrome → menú → "Agregar a pantalla de inicio".',
      '',
      'Ya hay clientes buscando servicios en Irapuato. Completa tu perfil hoy y aparece en los resultados.',
      '',
      '¡Cualquier duda aquí estamos! 🙌',
      '— Fernando, Fleksi',
      '',
      'bit.ly/fleksiapp',
    ];
    return lineas.join('\n');
  };

  const copiarMensajeWA = (userId: string, mensaje: string) => {
    navigator.clipboard.writeText(mensaje);
    setMensajesCopiados(prev => ({ ...prev, [userId]: true }));
    setTimeout(() => setMensajesCopiados(prev => ({ ...prev, [userId]: false })), 2000);
  };

  const cargarAcciones = async () => {
    setCargandoAcciones(true);
    try {
      const { data } = await supabase
        .from('notificaciones')
        .select('*, usuarios!usuario_id(id, nombre, telefono, foto_url)')
        .eq('leida', false)
        .order('created_at', { ascending: false })
        .limit(100);
      setAcciones(data || []);
    } catch (e) { console.error(e); }
    finally { setCargandoAcciones(false); }
  };

  const marcarLeida = async (notifId: string) => {
    setMarcandoLeida(notifId);
    try {
      await supabase.from('notificaciones').update({ leida: true }).eq('id', notifId);
      setAcciones(prev => prev.filter(a => a.id !== notifId));
    } catch (e) { console.error(e); }
    finally { setMarcandoLeida(null); }
  };

  const copiarMensaje = (texto: string, id: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(id);
    setTimeout(() => setCopiado(null), 2000);
  };

  const buscarUsuario = async (query: string) => {
    setBusquedaUsuario(query);
    if (query.length < 2) { setResultadosBusqueda([]); return; }
    try {
      const { data } = await supabase
        .from('usuarios')
        .select('id, nombre, email, foto_url, rol')
        .or('nombre.ilike.%' + query + '%,email.ilike.%' + query + '%')
        .limit(5);
      setResultadosBusqueda(data || []);
    } catch (e) { console.error(e); }
  };

  const enviarMensajeIndividual = async () => {
    if (!usuarioSeleccionado || !tituloMensaje.trim() || !cuerpoMensaje.trim()) return;
    setEnviandoMensaje(true); setMensajeEnviado('');
    try {
      await supabase.from('notificaciones').insert({ usuario_id: usuarioSeleccionado.id, tipo: 'admin_mensaje', titulo: tituloMensaje, mensaje: cuerpoMensaje, link: '/notificaciones' });
      setMensajeEnviado('✅ Mensaje enviado a ' + usuarioSeleccionado.nombre);
      setTituloMensaje(''); setCuerpoMensaje(''); setUsuarioSeleccionado(null); setBusquedaUsuario(''); setResultadosBusqueda([]);
    } catch (e) { setMensajeEnviado('❌ Error al enviar el mensaje'); }
    finally { setEnviandoMensaje(false); }
  };

  const enviarMensajeMasivo = async () => {
    if (!tituloMasivo.trim() || !cuerpoMasivo.trim()) return;
    setEnviandoMasivo(true); setMensajeMasivoEnviado('');
    try {
      let query = supabase.from('usuarios').select('id, nombre, email, rol, verificado');
      if (segmentoMasivo === 'fleksers') query = query.in('rol', ['flekser', 'viajero']);
      else if (segmentoMasivo === 'empresas') query = query.eq('rol', 'empresa');
      else if (segmentoMasivo === 'verificados') query = query.eq('verificado', true);
      const { data: destinatarios } = await query;
      if (!destinatarios || destinatarios.length === 0) { setMensajeMasivoEnviado('❌ No hay usuarios en ese segmento'); return; }
      await supabase.from('notificaciones').insert(destinatarios.map(u => ({ usuario_id: u.id, tipo: 'admin_mensaje', titulo: tituloMasivo, mensaje: cuerpoMasivo, link: '/notificaciones' })));
      setMensajeMasivoEnviado('✅ Mensaje enviado a ' + destinatarios.length + ' usuarios');
      setTituloMasivo(''); setCuerpoMasivo('');
    } catch (e) { setMensajeMasivoEnviado('❌ Error al enviar el mensaje masivo'); }
    finally { setEnviandoMasivo(false); }
  };

  const abrirModalUsuarios = async (rol: string) => {
    setCargandoModal(true);
    setModalUsuarios({ visible: true, rol, lista: [] });
    try {
      const { data } = await supabase.from('usuarios').select('id, nombre, email, telefono, ciudad, foto_url, created_at, verificado, rol').eq('rol', rol).order('created_at', { ascending: false });
      setModalUsuarios({ visible: true, rol, lista: data || [] });
    } catch (e) { console.error(e); }
    finally { setCargandoModal(false); }
  };

  const abrirModalServicios = async (estado: 'activos' | 'completados' | 'cancelados') => {
    setCargandoModalServicios(true);
    setModalServicios({ visible: true, estado, lista: [] });
    try {
      let query = supabase
        .from('servicios')
        .select('id, titulo, categoria, estado, presupuesto, fecha, hora, created_at, completado_at, usuarios!cliente_id(nombre, foto_url, telefono, email)')
        .order('created_at', { ascending: false });
      if (estado === 'activos') query = query.in('estado', ['activo', 'publicado', 'en_proceso']);
      else if (estado === 'completados') query = query.in('estado', ['completado', 'pagado']);
      else if (estado === 'cancelados') query = query.eq('estado', 'cancelado');
      const { data } = await query;
      setModalServicios({ visible: true, estado, lista: data || [] });
    } catch (e) { console.error(e); }
    finally { setCargandoModalServicios(false); }
  };

  const cargarRetiros = async () => {
    setCargandoRetiros(true);
    try {
      const { data } = await supabase.from('retiros').select('*, usuarios(id, nombre, email, telefono, foto_url)').order('created_at', { ascending: false });
      setRetiros(data || []);
    } catch (e) { console.error(e); }
    finally { setCargandoRetiros(false); }
  };

  const procesarRetiro = async (retiroId: string, usuarioId: string, monto: number, nota: string) => {
    setProcesandoRetiro(retiroId);
    try {
      await supabase.from('retiros').update({ estado: 'completado', notas: nota || null, procesado_por: usuario.email, procesado_at: new Date().toISOString() }).eq('id', retiroId);
      try { await supabase.from('notificaciones').insert({ usuario_id: usuarioId, tipo: 'retiro_completado', titulo: '✅ Retiro completado', mensaje: 'Tu retiro de $' + monto.toFixed(2) + ' MXN ha sido procesado.', link: '/wallet' }); } catch (e) {}
      await cargarRetiros();
    } catch (e) { console.error(e); }
    finally { setProcesandoRetiro(''); }
  };

  const rechazarRetiroFn = async (retiroId: string, usuarioId: string, monto: number, nota: string) => {
    if (!nota.trim()) { alert('Escribe el motivo del rechazo'); return; }
    setProcesandoRetiro(retiroId);
    try {
      const { data: ud } = await supabase.from('usuarios').select('wallet_saldo').eq('id', usuarioId).single();
      await supabase.from('usuarios').update({ wallet_saldo: (ud?.wallet_saldo || 0) + monto }).eq('id', usuarioId);
      await supabase.from('wallet_movimientos').insert({ usuario_id: usuarioId, tipo: 'reembolso', monto, descripcion: 'Retiro rechazado — saldo reintegrado: ' + nota });
      await supabase.from('retiros').update({ estado: 'rechazado', notas: nota, procesado_por: usuario.email, procesado_at: new Date().toISOString() }).eq('id', retiroId);
      try { await supabase.from('notificaciones').insert({ usuario_id: usuarioId, tipo: 'retiro_rechazado', titulo: '❌ Retiro no procesado', mensaje: 'Tu solicitud de retiro de $' + monto.toFixed(2) + ' MXN no pudo procesarse: ' + nota + '. El saldo fue reintegrado a tu wallet.', link: '/wallet' }); } catch (e) {}
      setRechazandoRetiro('');
      await cargarRetiros();
    } catch (e) { console.error(e); }
    finally { setProcesandoRetiro(''); }
  };

  const cargarDispersion = async () => {
    setCargandoDispersion(true);
    try {
      const { data } = await supabase.from('aplicaciones').select('id, precio_ofrecido, pago_liberado, dispersado, dispersado_at, nota_dispersion, servicios(id, titulo, presupuesto, estado, completado_at), usuarios!prestador_id(id, nombre, email, telefono)').eq('estado', 'completado').eq('pago_liberado', true).order('dispersado_at', { ascending: false, nullsFirst: true });
      const procesados = (data || []).map((app: any) => {
        const precio = app.precio_ofrecido || app.servicios?.presupuesto || 0;
        const comision = Math.round(precio * 0.10);
        return { ...app, precio, comision, pagoFlekser: precio - comision };
      });
      setPagosDispersion(procesados);
    } catch (e) { console.error(e); }
    finally { setCargandoDispersion(false); }
  };

  const marcarDispersado = async (appId: string, nota: string) => {
    setMarcandoDispersado(appId);
    try {
      await supabase.from('aplicaciones').update({ dispersado: true, dispersado_at: new Date().toISOString(), nota_dispersion: nota || null }).eq('id', appId);
      await cargarDispersion();
    } catch (e) { console.error(e); }
    finally { setMarcandoDispersado(''); }
  };

  const cargarMetrics = async () => {
    setCargandoMetrics(true);
    try {
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const { data: usuarios } = await supabase.from('usuarios').select('rol, created_at, ciudad, intencion');
      const { data: servicios } = await supabase.from('servicios').select('estado, created_at, presupuesto');
      const totalUsuarios = usuarios?.length || 0;
      const fleksers = usuarios?.filter(u => u.rol === 'flekser' || u.rol === 'viajero').length || 0;
      const empresas = usuarios?.filter(u => u.rol === 'empresa').length || 0;
      const nuevosHoy = usuarios?.filter(u => new Date(u.created_at) >= hoy).length || 0;
      const nuevosEsteMes = usuarios?.filter(u => new Date(u.created_at) >= inicioMes).length || 0;
      const ciudadCount: Record<string, number> = {};
      usuarios?.forEach(u => { if (u.ciudad) ciudadCount[u.ciudad] = (ciudadCount[u.ciudad] || 0) + 1; });
      const ciudadTop = Object.entries(ciudadCount).sort((a, b) => b[1] - a[1])[0];
      const serviciosPublicados = servicios?.filter(s => ['activo','publicado','en_proceso'].includes(s.estado)).length || 0;
      const serviciosCompletados = servicios?.filter(s => s.estado === 'completado' || s.estado === 'pagado').length || 0;
      const serviciosCancelados = servicios?.filter(s => s.estado === 'cancelado').length || 0;
      const pagadosHoy = servicios?.filter(s => (s.estado === 'completado' || s.estado === 'pagado') && new Date(s.created_at) >= hoy) || [];
      const pagadosMes = servicios?.filter(s => (s.estado === 'completado' || s.estado === 'pagado') && new Date(s.created_at) >= inicioMes) || [];
      const ingresosDia = pagadosHoy.reduce((acc, s) => acc + (s.presupuesto || 0), 0);
      const ingresosMes = pagadosMes.reduce((acc, s) => acc + (s.presupuesto || 0), 0);
      const comisionAcumulada = (servicios || []).filter(s => s.estado === 'completado' || s.estado === 'pagado').reduce((acc, s) => acc + (s.presupuesto || 0) * 0.25, 0);
      const intencionTrabajar = (usuarios || []).filter(u => u.intencion === 'trabajar').length;
      const intencionContratar = (usuarios || []).filter(u => u.intencion === 'contratar').length;
      const intencionAmbos = (usuarios || []).filter(u => u.intencion === 'ambos').length;
      const intencionSinDato = (usuarios || []).filter(u => !u.intencion).length;
      setMetrics({ totalUsuarios, fleksers, empresas, nuevosHoy, nuevosEsteMes, serviciosPublicados, serviciosCompletados, serviciosCancelados, ingresosDia, ingresosMes, comisionAcumulada, ciudadTopNombre: ciudadTop?.[0] || '—', ciudadTopCount: ciudadTop?.[1] || 0, intencionTrabajar, intencionContratar, intencionAmbos, intencionSinDato });
      const semanas = generarSemanas(8);
      setDatosUsuarios(semanas.map(s => ({ semana: s.label, usuarios: (usuarios || []).filter(u => { const f = new Date(u.created_at); return f >= s.inicio && f <= s.fin; }).length, acumulado: (usuarios || []).filter(u => new Date(u.created_at) <= s.fin).length })));
      setDatosServicios(semanas.map(s => ({ semana: s.label, completados: (servicios || []).filter(sv => { const f = new Date(sv.created_at); return (sv.estado === 'completado' || sv.estado === 'pagado') && f >= s.inicio && f <= s.fin; }).length, cancelados: (servicios || []).filter(sv => { const f = new Date(sv.created_at); return sv.estado === 'cancelado' && f >= s.inicio && f <= s.fin; }).length, publicados: (servicios || []).filter(sv => { const f = new Date(sv.created_at); return f >= s.inicio && f <= s.fin; }).length })));
      setDatosIngresos(semanas.map(s => ({ semana: s.label, ingresos: (servicios || []).filter(sv => { const f = new Date(sv.created_at); return (sv.estado === 'completado' || sv.estado === 'pagado') && f >= s.inicio && f <= s.fin; }).reduce((acc, sv) => acc + (sv.presupuesto || 0), 0), comision: (servicios || []).filter(sv => { const f = new Date(sv.created_at); return (sv.estado === 'completado' || sv.estado === 'pagado') && f >= s.inicio && f <= s.fin; }).reduce((acc, sv) => acc + (sv.presupuesto || 0) * 0.25, 0) })));
    } catch (e) { console.error(e); }
    finally { setCargandoMetrics(false); }
  };

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    if (user.email !== ADMIN_EMAIL) { window.location.href = '/home'; return; }
    setUsuario(user);
    const { data: verifs } = await supabase.from('verificaciones').select('*, usuarios(nombre, foto_url, rol, ciudad, telefono)').order('created_at', { ascending: false });
    setVerificaciones(verifs || []);
    const { data: docs } = await supabase.from('documentos').select('*, usuarios(id, nombre, foto_url, rol, ciudad, email)').order('updated_at', { ascending: false });
    const agrupados: Record<string, any> = {};
    (docs || []).forEach((doc: any) => {
      const uid = doc.usuario_id;
      if (!agrupados[uid]) agrupados[uid] = { usuario: doc.usuarios, usuario_id: uid, documentos: [], ultima_actualizacion: doc.updated_at };
      agrupados[uid].documentos.push(doc);
      if (doc.updated_at > agrupados[uid].ultima_actualizacion) agrupados[uid].ultima_actualizacion = doc.updated_at;
    });
    setDocumentosPorUsuario(Object.values(agrupados));
    setCargando(false);
  };

  const obtenerDatosReporte = async (meses: number) => {
    const fin = new Date(); const inicio = new Date(); inicio.setMonth(inicio.getMonth() - meses);
    const { data: usuarios } = await supabase.from('usuarios').select('rol, created_at, ciudad');
    const { data: servicios } = await supabase.from('servicios').select('estado, created_at, presupuesto');
    const usuariosPeriodo = (usuarios || []).filter(u => new Date(u.created_at) >= inicio);
    const serviciosPeriodo = (servicios || []).filter(s => new Date(s.created_at) >= inicio);
    const completadosPeriodo = serviciosPeriodo.filter(s => s.estado === 'completado' || s.estado === 'pagado');
    const ciudadCount: Record<string, number> = {};
    (usuarios || []).forEach(u => { if (u.ciudad) ciudadCount[u.ciudad] = (ciudadCount[u.ciudad] || 0) + 1; });
    const ciudadTop = Object.entries(ciudadCount).sort((a, b) => b[1] - a[1])[0];
    return {
      periodo: { inicio: inicio.toLocaleDateString('es-MX'), fin: fin.toLocaleDateString('es-MX') },
      usuarios: { total: usuarios?.length || 0, nuevosEnPeriodo: usuariosPeriodo.length, fleksers: (usuarios || []).filter(u => u.rol === 'flekser').length, empresas: (usuarios || []).filter(u => u.rol === 'empresa').length },
      servicios: { total: servicios?.length || 0, enPeriodo: serviciosPeriodo.length, activos: serviciosPeriodo.filter(s => ['activo','publicado','en_proceso'].includes(s.estado)).length, completados: completadosPeriodo.length, cancelados: serviciosPeriodo.filter(s => s.estado === 'cancelado').length },
      ingresos: { transaccionadoPeriodo: completadosPeriodo.reduce((acc, s) => acc + (s.presupuesto || 0), 0), comisionPeriodo: completadosPeriodo.reduce((acc, s) => acc + (s.presupuesto || 0) * 0.25, 0), comisionAcumulada: (servicios || []).filter(s => s.estado === 'completado' || s.estado === 'pagado').reduce((acc, s) => acc + (s.presupuesto || 0) * 0.25, 0), ticketPromedio: completadosPeriodo.length > 0 ? completadosPeriodo.reduce((acc, s) => acc + (s.presupuesto || 0), 0) / completadosPeriodo.length : 0 },
      ciudad: { nombre: ciudadTop?.[0] || '—', usuarios: ciudadTop?.[1] || 0 },
    };
  };

  const descargarExcel = async () => {
    setGenerandoReporte('excel');
    try {
      const periodo = PERIODOS.find(p => p.key === periodoReporte)!;
      const datos = await obtenerDatosReporte(periodo.meses);
      const fechaGen = new Date().toLocaleDateString('es-MX');
      const wb = XLSX.utils.book_new();
      const wsResumen = XLSX.utils.aoa_to_sheet([
        ['REPORTE FLEKSI','',''],['Período: ' + periodo.label, datos.periodo.inicio + ' — ' + datos.periodo.fin,''],['Generado: ' + fechaGen,'',''],['','',''],
        ['👥 USUARIOS','',''],['Métrica','Valor',''],['Total registrados',datos.usuarios.total,''],['Nuevos en el período',datos.usuarios.nuevosEnPeriodo,''],['Fleksers',datos.usuarios.fleksers,''],['Empresas',datos.usuarios.empresas,''],['','',''],
        ['⚡ SERVICIOS','',''],['Métrica','Valor',''],['Total histórico',datos.servicios.total,''],['Publicados en período',datos.servicios.enPeriodo,''],['Completados en período',datos.servicios.completados,''],['Cancelados en período',datos.servicios.cancelados,''],['','',''],
        ['💰 INGRESOS (MXN)','',''],['Métrica','Valor',''],['Transaccionado en período',datos.ingresos.transaccionadoPeriodo,''],['Comisión Fleksi en período (25%)',datos.ingresos.comisionPeriodo,''],['Comisión acumulada histórica',datos.ingresos.comisionAcumulada,''],['Ticket promedio',datos.ingresos.ticketPromedio,''],['','',''],
        ['📍 GEOGRAFÍA','',''],['Ciudad con más actividad',datos.ciudad.nombre,''],['Usuarios en esa ciudad',datos.ciudad.usuarios,''],
      ]);
      wsResumen['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');
      XLSX.writeFile(wb, 'Fleksi_Reporte_' + periodo.label + '_' + fechaGen.replace(/\//g, '-') + '.xlsx');
    } finally { setGenerandoReporte(''); }
  };

  const descargarPDF = async () => {
    setGenerandoReporte('pdf');
    try {
      const periodo = PERIODOS.find(p => p.key === periodoReporte)!;
      const datos = await obtenerDatosReporte(periodo.meses);
      const fechaGen = new Date().toLocaleDateString('es-MX');
      const html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>Reporte Fleksi</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,sans-serif;background:#F8FAFC;color:#0F172A;-webkit-print-color-adjust:exact;print-color-adjust:exact;}.page{max-width:800px;margin:0 auto;padding:32px;background:white;}.header{background:linear-gradient(135deg,#2563EB 0%,#7C3AED 100%);border-radius:16px;padding:28px 32px;margin-bottom:28px;}.header h1{color:white;font-size:26px;font-weight:900;}.header p{color:rgba(255,255,255,0.75);font-size:13px;margin-top:4px;}.seccion{margin-bottom:24px;}.seccion-titulo{font-size:13px;font-weight:800;color:#6B7280;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;}.divider{height:1px;background:#F1F5F9;margin-bottom:16px;}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}.grid4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;}.card{background:white;border:1.5px solid #E2E8F0;border-radius:12px;padding:16px;text-align:center;}.card .valor{font-size:30px;font-weight:900;color:#2563EB;line-height:1;}.card .label{font-size:11px;color:#94A3B8;font-weight:600;margin-top:6px;}.card.verde .valor{color:#059669;}.card.purpura .valor{color:#7C3AED;}.card.rojo .valor{color:#DC2626;}.card.gris .valor{color:#374151;}.card.cyan .valor{color:#0891B2;}.card-comision{background:linear-gradient(135deg,#2563EB,#7C3AED);border-radius:16px;padding:24px;text-align:center;margin-top:12px;-webkit-print-color-adjust:exact;}.card-comision .label-top{color:rgba(255,255,255,0.7);font-size:11px;font-weight:600;text-transform:uppercase;}.card-comision .valor{color:white;font-size:40px;font-weight:900;margin:8px 0 4px;}.card-comision .label-bot{color:rgba(255,255,255,0.7);font-size:12px;}.card-ciudad{background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:12px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;}.card-ciudad .nombre{font-size:18px;font-weight:800;}.card-ciudad .badge{background:#EEF2FF;color:#4F46E5;font-weight:800;font-size:16px;padding:8px 16px;border-radius:10px;}.footer{margin-top:32px;padding-top:20px;border-top:1.5px solid #F1F5F9;display:flex;justify-content:space-between;align-items:center;}.footer-logo{font-size:18px;font-weight:900;color:#2563EB;}.footer-info{font-size:11px;color:#CBD5E1;text-align:right;}@media print{body{background:white;}.page{padding:20px;max-width:100%;}}</style></head><body><div class="page"><div class="header"><h1>⚡ fleksi</h1><p>Reporte ' + periodo.label + ' · ' + datos.periodo.inicio + ' — ' + datos.periodo.fin + '</p><p>Generado el ' + fechaGen + '</p></div><div class="seccion"><div class="seccion-titulo">👥 Usuarios</div><div class="divider"></div><div class="grid4"><div class="card"><div class="valor">' + datos.usuarios.total + '</div><div class="label">Total registrados</div></div><div class="card verde"><div class="valor">' + datos.usuarios.nuevosEnPeriodo + '</div><div class="label">Nuevos en período</div></div><div class="card purpura"><div class="valor">' + datos.usuarios.fleksers + '</div><div class="label">Fleksers</div></div><div class="card gris"><div class="valor">' + datos.usuarios.empresas + '</div><div class="label">Empresas</div></div></div></div><div class="seccion"><div class="seccion-titulo">⚡ Servicios</div><div class="divider"></div><div class="grid4"><div class="card"><div class="valor">' + datos.servicios.total + '</div><div class="label">Total histórico</div></div><div class="card cyan"><div class="valor">' + datos.servicios.activos + '</div><div class="label">Activos</div></div><div class="card verde"><div class="valor">' + datos.servicios.completados + '</div><div class="label">Completados</div></div><div class="card rojo"><div class="valor">' + datos.servicios.cancelados + '</div><div class="label">Cancelados</div></div></div></div><div class="seccion"><div class="seccion-titulo">💰 Ingresos (MXN)</div><div class="divider"></div><div class="grid2" style="margin-bottom:12px"><div class="card verde"><div class="valor">$' + datos.ingresos.transaccionadoPeriodo.toLocaleString('es-MX',{maximumFractionDigits:0}) + '</div><div class="label">Transaccionado en período</div></div><div class="card"><div class="valor">$' + datos.ingresos.ticketPromedio.toLocaleString('es-MX',{maximumFractionDigits:0}) + '</div><div class="label">Ticket promedio</div></div></div><div class="card-comision"><div class="label-top">Comisión Fleksi acumulada (25%)</div><div class="valor">$' + datos.ingresos.comisionAcumulada.toLocaleString('es-MX',{maximumFractionDigits:0}) + ' MXN</div><div class="label-bot">En este período: $' + datos.ingresos.comisionPeriodo.toLocaleString('es-MX',{maximumFractionDigits:0}) + ' MXN</div></div></div><div class="seccion"><div class="seccion-titulo">📍 Ciudad más activa</div><div class="divider"></div><div class="card-ciudad"><div><div class="nombre">📍 ' + datos.ciudad.nombre + '</div><div style="font-size:12px;color:#94A3B8;margin-top:2px;">Ciudad con más usuarios registrados</div></div><div class="badge">' + datos.ciudad.usuarios + ' usuarios</div></div></div><div class="footer"><div class="footer-logo">⚡ fleksi</div><div class="footer-info">Irapuato, Guanajuato · México<br/>Reporte generado el ' + fechaGen + '</div></div></div><script>window.onload=function(){setTimeout(function(){window.print();},500);};<\/script></body></html>';
      const ventana = window.open('', '_blank', 'width=900,height=700');
      if (ventana) { ventana.document.write(html); ventana.document.close(); }
    } finally { setGenerandoReporte(''); }
  };

  const verDocumento = async (url: string, usuarioId: string, tipo: string) => {
    if (url.includes('token=')) { window.open(url, '_blank'); return; }
    try {
      const ext = url.split('.').pop()?.split('?')[0] || 'jpg';
      const { data } = await supabase.storage.from('documentos-verificacion').createSignedUrl(usuarioId + '/' + tipo + '.' + ext, 3600);
      if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    } catch (e) { window.open(url, '_blank'); }
  };

  const aprobarDoc = async (docId: string, usuarioId: string, nombreUsuario: string, tipoDoc: string) => {
    setProcesandoDoc(docId);
    try {
      await supabase.from('documentos').update({ estado: 'aprobado', motivo_rechazo: null, updated_at: new Date().toISOString() }).eq('id', docId);
      const { data: todosLosDocs } = await supabase.from('documentos').select('*').eq('usuario_id', usuarioId);
      const { data: usuarioData } = await supabase.from('usuarios').select('rol').eq('id', usuarioId).single();
      const rol = usuarioData?.rol || 'flekser';
      const requeridos = rol === 'empresa'
        ? ['ine_frente','ine_reverso','constancia_fiscal']
        : ['ine_frente','ine_reverso','curp','comprobante_domicilio'];
      const docsActualizados = (todosLosDocs || []).map(d => d.id === docId ? { ...d, estado: 'aprobado' } : d);
      const todosAprobados = requeridos.every(tipo => docsActualizados.some(d => d.tipo === tipo && d.estado === 'aprobado'));
      if (tipoDoc === 'antecedentes') {
        await supabase.from('badges').upsert({ usuario_id: usuarioId, tipo: 'confianza_maxima', nombre: 'Confianza máxima', emoji: '🛡️' }, { onConflict: 'usuario_id,tipo' });
        try { await supabase.from('notificaciones').insert({ usuario_id: usuarioId, tipo: 'documento_aprobado', titulo: '🛡️ ¡Confianza máxima desbloqueada!', mensaje: 'Tus antecedentes no penales fueron verificados. Ahora tienes el badge 🛡️ Confianza máxima en tu perfil.', link: '/perfil' }); } catch (e) {}
      } else if (todosAprobados) {
        await supabase.from('usuarios').update({ verificado: true }).eq('id', usuarioId);
        await supabase.from('badges').upsert({ usuario_id: usuarioId, tipo: 'verificado', nombre: 'Verificado', emoji: '✅' }, { onConflict: 'usuario_id,tipo' });
        try { await supabase.from('notificaciones').insert({ usuario_id: usuarioId, tipo: 'verificacion_aprobada', titulo: '🏆 ¡Verificación completada!', mensaje: 'Todos tus documentos fueron aprobados.', link: '/perfil' }); } catch (e) {}
      } else {
        try { await supabase.from('notificaciones').insert({ usuario_id: usuarioId, tipo: 'documento_aprobado', titulo: '✅ Documento aprobado', mensaje: 'Tu ' + (LABEL_DOCS[tipoDoc] || tipoDoc) + ' fue aprobado.', link: '/verificacion' }); } catch (e) {}
      }
      await cargarDatos();
    } finally { setProcesandoDoc(''); }
  };

  const rechazarDoc = async (docId: string, usuarioId: string, tipoDoc: string) => {
    if (!motivoDoc.trim()) { alert('Escribe el motivo del rechazo'); return; }
    setProcesandoDoc(docId);
    try {
      await supabase.from('documentos').update({ estado: 'rechazado', motivo_rechazo: motivoDoc, updated_at: new Date().toISOString() }).eq('id', docId);
      try { await supabase.from('notificaciones').insert({ usuario_id: usuarioId, tipo: 'documento_rechazado', titulo: '❌ Documento rechazado', mensaje: 'Tu ' + (LABEL_DOCS[tipoDoc] || tipoDoc) + ' fue rechazado: ' + motivoDoc + '.', link: '/verificacion' }); } catch (e) {}
      setRechazandoDoc(''); setMotivoDoc('');
      await cargarDatos();
    } finally { setProcesandoDoc(''); }
  };

  const aprobar = async (id: string, usuarioId: string, nombreUsuario: string) => {
    setProcesando(id);
    try {
      await supabase.from('verificaciones').update({ estado: 'aprobado', revisado_por: usuario.email, revisado_at: new Date().toISOString() }).eq('id', id);
      await supabase.from('usuarios').update({ verificado: true }).eq('id', usuarioId);
      await supabase.from('badges').upsert({ usuario_id: usuarioId, tipo: 'verificado', nombre: 'Verificado', emoji: '✅' }, { onConflict: 'usuario_id,tipo' });
      try { await supabase.from('notificaciones').insert({ usuario_id: usuarioId, tipo: 'verificacion_aprobada', titulo: '🏆 ¡Verificación aprobada!', mensaje: 'Tu identidad fue verificada.', link: '/perfil' }); } catch (e) {}
      await cargarDatos();
    } finally { setProcesando(''); }
  };

  const rechazar = async (id: string, nombreUsuario: string) => {
    if (!motivoRechazo.trim()) { alert('Escribe el motivo del rechazo'); return; }
    setProcesando(id);
    try {
      const { data: verifData } = await supabase.from('verificaciones').select('usuario_id').eq('id', id).single();
      await supabase.from('verificaciones').update({ estado: 'rechazado', motivo_rechazo: motivoRechazo, revisado_por: usuario.email, revisado_at: new Date().toISOString() }).eq('id', id);
      if (verifData?.usuario_id) {
        try { await supabase.from('notificaciones').insert({ usuario_id: verifData.usuario_id, tipo: 'documento_rechazado', titulo: '❌ Verificación rechazada', mensaje: 'Tu verificación fue rechazada: ' + motivoRechazo + '.', link: '/verificacion' }); } catch (e) {}
      }
      setRechazando(''); setMotivoRechazo('');
      await cargarDatos();
    } finally { setProcesando(''); }
  };

  const estadoColor = (estado: string) => ({ pendiente: 'bg-gray-100 text-gray-600', subido: 'bg-yellow-100 text-yellow-700', en_revision: 'bg-yellow-100 text-yellow-700', aprobado: 'bg-green-100 text-green-700', rechazado: 'bg-red-100 text-red-700' }[estado] || 'bg-gray-100 text-gray-600');

  const filtradas = verificaciones.filter(v => filtro === 'todas' ? true : v.estado === filtro);
  const conteoVerifs = { en_revision: verificaciones.filter(v => v.estado === 'en_revision').length, aprobado: verificaciones.filter(v => v.estado === 'aprobado').length, rechazado: verificaciones.filter(v => v.estado === 'rechazado').length, todas: verificaciones.length };
  const totalDocsSubidos = documentosPorUsuario.reduce((acc, u) => acc + u.documentos.filter((d: any) => d.estado === 'subido').length, 0);
  const totalDocsAprobados = documentosPorUsuario.reduce((acc, u) => acc + u.documentos.filter((d: any) => d.estado === 'aprobado').length, 0);
  const totalDocsRechazados = documentosPorUsuario.reduce((acc, u) => acc + u.documentos.filter((d: any) => d.estado === 'rechazado').length, 0);
  const hayDatosGraficas = datosUsuarios.some(d => d.usuarios > 0 || d.acumulado > 0);
  const pagosFiltrados = pagosDispersion.filter(p => filtroDispersion === 'pendiente' ? !p.dispersado : !!p.dispersado);
  const totalPendiente = pagosDispersion.filter(p => !p.dispersado).reduce((acc, p) => acc + p.pagoFlekser, 0);
  const totalDispersado = pagosDispersion.filter(p => p.dispersado).reduce((acc, p) => acc + p.pagoFlekser, 0);
  const pendienteCount = pagosDispersion.filter(p => !p.dispersado).length;

  if (cargando) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Cargando panel admin...</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 pt-12 pb-8">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-white/70 text-sm">Panel de administración</p>
            <h1 className="text-white font-extrabold text-2xl mb-1">Fleksi Admin</h1>
            <p className="text-white/70 text-sm">{usuario?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { cargarMetrics(); cargarDatos(); }} className="bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-full hover:bg-white/30 transition">🔄</button>
            <a href="/perfil" className="bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-full hover:bg-white/30 transition">← Perfil</a>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          <button onClick={() => setTab('dashboard')} className={'flex-shrink-0 py-3 px-4 rounded-2xl font-bold text-sm transition ' + (tab === 'dashboard' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200')}>📊 Dashboard</button>
          <button onClick={() => setTab('acciones')} className={'flex-shrink-0 py-3 px-4 rounded-2xl font-bold text-sm transition ' + (tab === 'acciones' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200')}>
            📋 Acciones {acciones.length > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{acciones.length}</span>}
          </button>
          <button onClick={() => setTab('comunicaciones')} className={'flex-shrink-0 py-3 px-4 rounded-2xl font-bold text-sm transition ' + (tab === 'comunicaciones' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200')}>📢 Comunicaciones</button>
          <button onClick={() => setTab('trabajos')} className={'flex-shrink-0 py-3 px-4 rounded-2xl font-bold text-sm transition ' + (tab === 'trabajos' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200')}>⚡ Trabajos</button>
          <button onClick={() => setTab('habilidades')} className={'flex-shrink-0 py-3 px-4 rounded-2xl font-bold text-sm transition ' + (tab === 'habilidades' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200')}>🛠️ Habilidades</button>
          <button onClick={() => setTab('dispersion')} className={'flex-shrink-0 py-3 px-4 rounded-2xl font-bold text-sm transition ' + (tab === 'dispersion' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200')}>
            💸 Dispersión {pendienteCount > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendienteCount}</span>}
          </button>
          <button onClick={() => setTab('documentos')} className={'flex-shrink-0 py-3 px-4 rounded-2xl font-bold text-sm transition ' + (tab === 'documentos' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200')}>
            📄 Documentos {totalDocsSubidos > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{totalDocsSubidos}</span>}
          </button>
          <button onClick={() => setTab('verificaciones')} className={'flex-shrink-0 py-3 px-4 rounded-2xl font-bold text-sm transition ' + (tab === 'verificaciones' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200')}>
            🪪 Verificaciones {conteoVerifs.en_revision > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{conteoVerifs.en_revision}</span>}
          </button>
          <button onClick={() => setTab('retiros')} className={'flex-shrink-0 py-3 px-4 rounded-2xl font-bold text-sm transition ' + (tab === 'retiros' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200')}>
            🏦 Retiros {retiros.filter(r => r.estado === 'pendiente').length > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{retiros.filter(r => r.estado === 'pendiente').length}</span>}
          </button>
        </div>

        {tab === 'trabajos' && (() => {
          const categoriaEmoji: Record<string, string> = { hogar: '🔧', limpieza: '🧹', eventos: '🍽️', mudanza: '🚚', ejecutivo: '🚗', interprete: '🗣️', cocina: '🍳', jardineria: '🌿', mecanica: '🔩', cerrajeria: '🔑', estetica: '💅', otro: '✨' };
          const categoriaNombre: Record<string, string> = { hogar: 'Hogar y reparaciones', limpieza: 'Limpieza', eventos: 'Eventos', mudanza: 'Mudanza', ejecutivo: 'Chofer ejecutivo', interprete: 'Intérprete', cocina: 'Cocina', jardineria: 'Jardinería', mecanica: 'Mecánica', cerrajeria: 'Cerrajería', estetica: 'Estética', otro: 'Otro' };
          const filtrados = trabajosData.filter(t => {
            if (filtroTrabajos === 'todos') return true;
            if (filtroTrabajos === 'activo') return ['activo','publicado','en_proceso'].includes(t.estado);
            if (filtroTrabajos === 'completado') return t.estado === 'completado' || t.estado === 'pagado';
            if (filtroTrabajos === 'cancelado') return t.estado === 'cancelado';
            return true;
          });
          const total = trabajosData.length;
          const activos = trabajosData.filter(t => ['activo','publicado','en_proceso'].includes(t.estado)).length;
          const completados = trabajosData.filter(t => t.estado === 'completado' || t.estado === 'pagado').length;
          const cancelados = trabajosData.filter(t => t.estado === 'cancelado').length;
          const conContraoferta = trabajosData.filter(t => t.tuvo_contraoferta).length;
          const tasaCierre = total > 0 ? Math.round((completados / total) * 100) : 0;
          const ticketPromedio = completados > 0 ? Math.round(trabajosData.filter(t => t.estado === 'completado' || t.estado === 'pagado').reduce((acc, t) => acc + (t.presupuesto || 0), 0) / completados) : 0;
          const porCategoria: Record<string, { total: number; completados: number; cancelados: number; ingresos: number }> = {};
          trabajosData.forEach(t => {
            const cat = t.categoria || 'otro';
            if (!porCategoria[cat]) porCategoria[cat] = { total: 0, completados: 0, cancelados: 0, ingresos: 0 };
            porCategoria[cat].total++;
            if (t.estado === 'completado' || t.estado === 'pagado') { porCategoria[cat].completados++; porCategoria[cat].ingresos += t.presupuesto || 0; }
            if (t.estado === 'cancelado') porCategoria[cat].cancelados++;
          });
          const categoriasOrdenadas = Object.entries(porCategoria).sort((a, b) => b[1].total - a[1].total);
          return (
            <div>
              <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                {[{ key: '7d', label: '7 días' }, { key: '30d', label: '30 días' }, { key: '90d', label: '90 días' }, { key: 'todo', label: 'Todo' }].map(p => (
                  <button key={p.key} onClick={() => setPeriodoTrabajos(p.key as any)} className={'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition ' + (periodoTrabajos === p.key ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-white text-gray-500 border border-gray-200')}>{p.label}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center"><p className="text-3xl font-extrabold text-blue-600">{total}</p><p className="text-xs text-gray-400 mt-1">Total publicados</p></div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center"><p className="text-3xl font-extrabold text-green-600">{tasaCierre}%</p><p className="text-xs text-gray-400 mt-1">Tasa de cierre</p></div>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="bg-cyan-50 rounded-xl p-3 text-center border border-cyan-100"><p className="text-xl font-extrabold text-cyan-700">{activos}</p><p className="text-xs text-gray-400 mt-0.5">Activos</p></div>
                <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100"><p className="text-xl font-extrabold text-green-700">{completados}</p><p className="text-xs text-gray-400 mt-0.5">Completados</p></div>
                <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100"><p className="text-xl font-extrabold text-red-600">{cancelados}</p><p className="text-xs text-gray-400 mt-0.5">Cancelados</p></div>
                <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-100"><p className="text-xl font-extrabold text-purple-600">{conContraoferta}</p><p className="text-xs text-gray-400 mt-0.5">Contraoferta</p></div>
              </div>
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-4 mb-4 flex items-center justify-between">
                <div><p className="text-white/70 text-xs font-semibold">Ticket promedio</p><p className="text-white font-extrabold text-2xl">${ticketPromedio.toLocaleString('es-MX')} MXN</p></div>
                <span className="text-4xl">🎯</span>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
                <h3 className="font-extrabold text-gray-900 mb-4">📊 Por categoría</h3>
                {categoriasOrdenadas.length === 0 ? <p className="text-gray-400 text-sm text-center py-4">Sin datos en este período</p> : (
                  <div className="flex flex-col gap-3">
                    {categoriasOrdenadas.map(([cat, data]) => {
                      const pct = total > 0 ? Math.round((data.total / total) * 100) : 0;
                      const tasaCat = data.total > 0 ? Math.round((data.completados / data.total) * 100) : 0;
                      return (
                        <div key={cat} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2"><span className="text-lg">{categoriaEmoji[cat] || '✨'}</span><p className="font-bold text-gray-900 text-sm">{categoriaNombre[cat] || cat}</p></div>
                            <span className="text-xs font-bold text-gray-400">{pct}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full mb-2 overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width: pct + '%' }}/></div>
                          <div className="flex gap-3 flex-wrap">
                            <span className="text-xs text-gray-600 font-semibold">{data.total} publicados</span>
                            <span className="text-xs text-green-600 font-semibold">✅ {data.completados} ({tasaCat}%)</span>
                            {data.cancelados > 0 && <span className="text-xs text-red-500 font-semibold">❌ {data.cancelados}</span>}
                            {data.ingresos > 0 && <span className="text-xs text-blue-600 font-semibold">💰 ${data.ingresos.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-extrabold text-gray-900 mb-3">📋 Listado</h3>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {[{ key: 'todos', label: 'Todos' }, { key: 'activo', label: '⚡ Activos' }, { key: 'completado', label: '✅ Completados' }, { key: 'cancelado', label: '❌ Cancelados' }].map(f => (
                      <button key={f.key} onClick={() => setFiltroTrabajos(f.key as any)} className={'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition ' + (filtroTrabajos === f.key ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-gray-100 text-gray-500')}>{f.label}</button>
                    ))}
                  </div>
                </div>
                {cargandoTrabajos ? <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"/></div>
                : filtrados.length === 0 ? <div className="text-center py-10"><p className="text-3xl mb-2">📭</p><p className="text-gray-400 text-sm">Sin trabajos en este filtro</p></div>
                : <div className="flex flex-col divide-y divide-gray-100">
                    {filtrados.slice(0, 50).map((t) => (
                      <div key={t.id} className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <span className="text-lg flex-shrink-0 mt-0.5">{categoriaEmoji[t.categoria] || '✨'}</span>
                            <div className="min-w-0"><p className="font-bold text-gray-900 text-sm truncate">{t.titulo}</p><p className="text-xs text-gray-400 mt-0.5">{t.usuarios?.nombre || '—'} · {new Date(t.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</p></div>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className={'text-xs font-bold px-2 py-0.5 rounded-full ' + (t.estado === 'completado' || t.estado === 'pagado' ? 'bg-green-100 text-green-700' : t.estado === 'cancelado' ? 'bg-red-100 text-red-600' : t.estado === 'en_proceso' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500')}>
                              {t.estado === 'completado' || t.estado === 'pagado' ? '✅ Completado' : t.estado === 'cancelado' ? '❌ Cancelado' : t.estado === 'en_proceso' ? '⚡ En proceso' : '📢 Activo'}
                            </span>
                            {t.presupuesto > 0 && <span className="text-xs font-bold text-gray-700">${t.presupuesto.toLocaleString('es-MX')} MXN</span>}
                            {t.tuvo_contraoferta && <span className="text-xs bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded-full">💜 Contraoferta</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                    {filtrados.length > 50 && <p className="text-xs text-gray-400 text-center py-3">Mostrando 50 de {filtrados.length}</p>}
                  </div>}
              </div>
            </div>
          );
        })()}

        {tab === 'acciones' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div><h2 className="font-extrabold text-gray-900">📋 Acciones pendientes</h2><p className="text-xs text-gray-400 mt-0.5">Notificaciones no leídas — copia el mensaje y avisa por WhatsApp</p></div>
              <button onClick={cargarAcciones} className="text-xs text-purple-600 font-bold px-3 py-2 bg-purple-50 rounded-xl hover:bg-purple-100 transition">🔄 Actualizar</button>
            </div>
            {cargandoAcciones ? <div className="flex items-center justify-center py-16"><div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"/></div>
            : acciones.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100"><p className="text-4xl mb-3">🎉</p><p className="font-bold text-gray-900 mb-1">¡Todo al día!</p><p className="text-gray-400 text-sm">No hay notificaciones pendientes</p></div>
            ) : (
              <div className="flex flex-col gap-3">
                {acciones.map((accion) => {
                  const usr = accion.usuarios;
                  const tipo = tipoLabel(accion.tipo);
                  const msgWA = generarMensajeWhatsApp(accion, usr);
                  const yaCopiado = copiado === accion.id;
                  return (
                    <div key={accion.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {usr?.foto_url ? <img src={usr.foto_url} className="w-full h-full object-cover"/> : <span className="text-white font-bold text-sm">{usr?.nombre?.charAt(0) || '?'}</span>}
                          </div>
                          <div><p className="font-extrabold text-gray-900 text-sm">{usr?.nombre || 'Usuario'}</p>{usr?.telefono && <p className="text-xs text-gray-500">📱 {usr.telefono}</p>}</div>
                        </div>
                        <span className={'text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ' + tipo.color}>{tipo.emoji} {tipo.label}</span>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 mb-3">
                        <p className="text-xs text-gray-400 font-semibold mb-1">📩 Notificación en app:</p>
                        <p className="text-xs font-bold text-gray-800">{accion.titulo}</p>
                        {accion.mensaje && <p className="text-xs text-gray-500 mt-0.5">{accion.mensaje}</p>}
                        <p className="text-xs text-gray-400 mt-1">{new Date(accion.created_at).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-3">
                        <p className="text-xs text-green-700 font-semibold mb-1">💬 Mensaje para WhatsApp:</p>
                        <p className="text-xs text-gray-700 leading-relaxed">{msgWA}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => copiarMensaje(msgWA, accion.id)} className={'flex-1 py-2.5 rounded-xl font-bold text-xs transition ' + (yaCopiado ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200')}>{yaCopiado ? '✅ ¡Copiado!' : '📋 Copiar mensaje'}</button>
                        <button onClick={() => marcarLeida(accion.id)} disabled={marcandoLeida === accion.id} className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-xs hover:opacity-90 transition disabled:opacity-50">{marcandoLeida === accion.id ? 'Guardando...' : '✅ Ya avisé'}</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {tab === 'comunicaciones' && (
          <div>
            <div className="flex gap-2 mb-6">
              <button onClick={() => setModoComunicacion('individual')} className={'flex-1 py-3 rounded-2xl font-bold text-sm transition ' + (modoComunicacion === 'individual' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-white text-gray-500 border border-gray-200')}>👤 Individual</button>
              <button onClick={() => setModoComunicacion('masivo')} className={'flex-1 py-3 rounded-2xl font-bold text-sm transition ' + (modoComunicacion === 'masivo' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-white text-gray-500 border border-gray-200')}>📣 Masivo</button>
              <button onClick={() => { setModoComunicacion('whatsapp'); cargarUsuariosWA(); }} className={'flex-1 py-3 rounded-2xl font-bold text-sm transition ' + (modoComunicacion === 'whatsapp' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' : 'bg-white text-gray-500 border border-gray-200')}>📱 WhatsApp</button>
              <button onClick={() => { setModoComunicacion('metricas'); cargarMetricasMensajes(); }} className={'flex-1 py-3 rounded-2xl font-bold text-sm transition ' + (modoComunicacion === 'metricas' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' : 'bg-white text-gray-500 border border-gray-200')}>📊 Métricas</button>
            </div>

            {modoComunicacion === 'metricas' && (
              <div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
                  <p className="text-amber-800 text-sm font-bold mb-1">📊 Métricas de mensajes</p>
                  <p className="text-amber-700 text-xs leading-relaxed">Toca "Enviados", "Leídos" o "Sin leer" para ver quién recibió cada mensaje y quién lo ha abierto.</p>
                </div>
                {errorMetricasMensajes && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5">
                    <p className="text-red-700 text-sm font-semibold">{errorMetricasMensajes}</p>
                  </div>
                )}
                {cargandoMetricasMensajes ? (
                  <div className="flex items-center justify-center py-16"><div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"/></div>
                ) : metricasMensajes.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                    <p className="text-4xl mb-3">📭</p>
                    <p className="font-bold text-gray-900">Sin mensajes enviados aún</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {metricasMensajes.map((m, i) => {
                      const pct = m.total > 0 ? Math.round((m.leidos / m.total) * 100) : 0;
                      const expandido = metricaExpandida?.idx === i ? metricaExpandida.filtro : null;
                      const destinatarios: any[] = m.destinatarios || [];
                      const listaFiltrada = expandido === 'leidos' ? destinatarios.filter((d: any) => d.leida)
                        : expandido === 'noLeidos' ? destinatarios.filter((d: any) => !d.leida)
                        : destinatarios;
                      return (
                        <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 pr-3">
                              <p className="font-extrabold text-gray-900 text-sm">{m.titulo}</p>
                              {m.mensaje && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{m.mensaje}</p>}
                              <p className="text-xs text-gray-400 mt-1">{new Date(m.fecha).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className={'text-2xl font-extrabold ' + (pct >= 70 ? 'text-green-600' : pct >= 40 ? 'text-amber-500' : 'text-red-500')}>{pct}%</p>
                              <p className="text-xs text-gray-400">leído</p>
                            </div>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full mb-3 overflow-hidden">
                            <div className={'h-full rounded-full transition-all ' + (pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400')} style={{ width: pct + '%' }}/>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => setMetricaExpandida(expandido === 'enviados' ? null : { idx: i, filtro: 'enviados' })} className={'rounded-xl p-2.5 text-center transition border-2 ' + (expandido === 'enviados' ? 'border-gray-400 bg-gray-100' : 'border-transparent bg-gray-50 hover:bg-gray-100')}>
                              <p className="text-lg font-extrabold text-gray-900">{m.total}</p><p className="text-xs text-gray-400">Enviados</p>
                            </button>
                            <button onClick={() => setMetricaExpandida(expandido === 'leidos' ? null : { idx: i, filtro: 'leidos' })} className={'rounded-xl p-2.5 text-center transition border-2 ' + (expandido === 'leidos' ? 'border-green-400 bg-green-100' : 'border-transparent bg-green-50 hover:bg-green-100')}>
                              <p className="text-lg font-extrabold text-green-600">{m.leidos}</p><p className="text-xs text-gray-400">✅ Leídos</p>
                            </button>
                            <button onClick={() => setMetricaExpandida(expandido === 'noLeidos' ? null : { idx: i, filtro: 'noLeidos' })} className={'rounded-xl p-2.5 text-center transition border-2 ' + (expandido === 'noLeidos' ? 'border-red-400 bg-red-100' : 'border-transparent bg-red-50 hover:bg-red-100')}>
                              <p className="text-lg font-extrabold text-red-500">{m.noLeidos}</p><p className="text-xs text-gray-400">🔴 Sin leer</p>
                            </button>
                          </div>
                          {expandido && (
                            <div className="mt-3 border-t border-gray-100 pt-3">
                              <p className="text-xs font-bold text-gray-500 mb-2">
                                {expandido === 'enviados' ? '📤 Todos los destinatarios' : expandido === 'leidos' ? '✅ Quienes abrieron el mensaje' : '🔴 Quienes faltan por leer'} ({listaFiltrada.length})
                              </p>
                              {listaFiltrada.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-3">Sin usuarios en esta categoría</p>
                              ) : (
                                <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
                                  {listaFiltrada.map((d: any) => (
                                    <div key={d.usuario_id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-gray-800 truncate">{d.nombre || 'Usuario'}</p>
                                        {d.email && <p className="text-xs text-gray-400 truncate">{d.email}</p>}
                                      </div>
                                      <span className="text-sm flex-shrink-0 ml-2">{d.leida ? '✅' : '🔴'}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {modoComunicacion === 'whatsapp' && (
              <div>
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-5">
                  <p className="text-green-800 text-sm font-bold mb-1">📱 Mensajes personalizados para WhatsApp</p>
                  <p className="text-green-700 text-xs leading-relaxed">Cada mensaje incluye el nombre, qué le falta completar y su porcentaje.</p>
                </div>
                {cargandoWA ? <div className="flex items-center justify-center py-16"><div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"/></div>
                : usuariosWA.length === 0 ? <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100"><p className="text-4xl mb-3">📭</p><p className="font-bold text-gray-900">Sin usuarios</p></div>
                : (
                  <div className="flex flex-col gap-3">
                    <p className="text-xs text-gray-400">{usuariosWA.length} usuarios</p>
                    {usuariosWA.map((u) => {
                      const mensaje = generarMensajeWA(u);
                      const yaCopiado2 = mensajesCopiados[u.id];
                      const telefono = u.telefono?.replace(/\D/g, '');
                      return (
                        <div key={u.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {u.foto_url ? <img src={u.foto_url} className="w-full h-full object-cover"/> : <span className="text-white font-bold text-sm">{u.nombre?.charAt(0) || '?'}</span>}
                              </div>
                              <div>
                                <p className="font-extrabold text-gray-900 text-sm">{u.nombre}</p>
                                {u.telefono && <p className="text-xs text-gray-500">📱 {u.telefono}</p>}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={'text-lg font-extrabold ' + (u.progreso >= 80 ? 'text-green-600' : u.progreso >= 50 ? 'text-amber-500' : 'text-red-500')}>{u.progreso}%</p>
                              <p className="text-xs text-gray-400">perfil</p>
                            </div>
                          </div>
                          {u.faltantes.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {u.faltantes.map((f: string) => <span key={f} className="text-xs bg-red-50 text-red-600 font-semibold px-2 py-0.5 rounded-full border border-red-100">❌ {f}</span>)}
                            </div>
                          ) : <p className="text-xs text-green-600 font-semibold mb-3">✅ Perfil completo</p>}
                          <div className="bg-gray-50 rounded-xl p-3 mb-3 max-h-28 overflow-y-auto">
                            <p className="text-xs text-gray-500 whitespace-pre-line leading-relaxed">{mensaje}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => copiarMensajeWA(u.id, mensaje)} className={'flex-1 py-2.5 rounded-xl font-bold text-sm transition ' + (yaCopiado2 ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>{yaCopiado2 ? '✅ Copiado' : '📋 Copiar mensaje'}</button>
                            {telefono && (
                              <a href={'https://wa.me/' + telefono + '?text=' + encodeURIComponent(mensaje)} target="_blank" className="flex-1 py-2.5 bg-green-500 text-white rounded-xl font-bold text-sm text-center hover:bg-green-600 transition">💬 Abrir en WA</a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {modoComunicacion === 'individual' && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-extrabold text-gray-900 mb-4">👤 Enviar mensaje a usuario</h3>
                <div className="mb-4 relative">
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Buscar usuario</label>
                  <input type="text" placeholder="Nombre o correo..." value={busquedaUsuario} onChange={(e) => buscarUsuario(e.target.value)} className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none text-gray-900 text-sm transition"/>
                  {resultadosBusqueda.length > 0 && !usuarioSeleccionado && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 mt-1 overflow-hidden">
                      {resultadosBusqueda.map((u) => (
                        <button key={u.id} onClick={() => { setUsuarioSeleccionado(u); setBusquedaUsuario(u.nombre); setResultadosBusqueda([]); }} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition text-left border-b border-gray-100 last:border-0">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {u.foto_url ? <img src={u.foto_url} className="w-full h-full object-cover"/> : <span className="text-white text-xs font-bold">{u.nombre?.charAt(0)}</span>}
                          </div>
                          <div><p className="font-bold text-gray-900 text-sm">{u.nombre}</p><p className="text-xs text-gray-400">{u.email} · {u.rol}</p></div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {usuarioSeleccionado && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center overflow-hidden">
                        {usuarioSeleccionado.foto_url ? <img src={usuarioSeleccionado.foto_url} className="w-full h-full object-cover"/> : <span className="text-white text-xs font-bold">{usuarioSeleccionado.nombre?.charAt(0)}</span>}
                      </div>
                      <div><p className="font-bold text-purple-900 text-sm">{usuarioSeleccionado.nombre}</p><p className="text-xs text-purple-600">{usuarioSeleccionado.email}</p></div>
                    </div>
                    <button onClick={() => { setUsuarioSeleccionado(null); setBusquedaUsuario(''); }} className="text-purple-400 hover:text-purple-600 font-bold">✕</button>
                  </div>
                )}
                <div className="mb-3"><label className="text-sm font-semibold text-gray-700 mb-1 block">Título</label><input type="text" placeholder="Ej. Información importante sobre tu cuenta" value={tituloMensaje} onChange={(e) => setTituloMensaje(e.target.value)} className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none text-gray-900 text-sm transition"/></div>
                <div className="mb-4"><label className="text-sm font-semibold text-gray-700 mb-1 block">Mensaje</label><textarea placeholder="Escribe el mensaje aquí..." value={cuerpoMensaje} onChange={(e) => setCuerpoMensaje(e.target.value)} rows={4} className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none text-gray-900 text-sm transition resize-none"/></div>
                {mensajeEnviado && <div className={'rounded-xl p-3 mb-4 text-sm font-semibold ' + (mensajeEnviado.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>{mensajeEnviado}</div>}
                <button onClick={enviarMensajeIndividual} disabled={!usuarioSeleccionado || !tituloMensaje.trim() || !cuerpoMensaje.trim() || enviandoMensaje} className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition disabled:opacity-50">{enviandoMensaje ? 'Enviando...' : '📤 Enviar mensaje'}</button>
              </div>
            )}

            {modoComunicacion === 'masivo' && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-extrabold text-gray-900 mb-4">📣 Enviar mensaje masivo</h3>
                <div className="mb-4">
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Segmento</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ key: 'todos', label: '👥 Todos' }, { key: 'fleksers', label: '⚡ Fleksers' }, { key: 'empresas', label: '🏢 Empresas' }, { key: 'verificados', label: '✅ Verificados' }].map(s => (
                      <button key={s.key} onClick={() => setSegmentoMasivo(s.key as any)} className={'py-2.5 px-3 rounded-xl text-xs font-bold transition border-2 ' + (segmentoMasivo === s.key ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500 hover:border-gray-300')}>{s.label}</button>
                    ))}
                  </div>
                </div>
                <div className="mb-3"><label className="text-sm font-semibold text-gray-700 mb-1 block">Título</label><input type="text" placeholder="Ej. ¡Novedad en Fleksi!" value={tituloMasivo} onChange={(e) => setTituloMasivo(e.target.value)} className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none text-gray-900 text-sm transition"/></div>
                <div className="mb-4"><label className="text-sm font-semibold text-gray-700 mb-1 block">Mensaje</label><textarea placeholder="Escribe el mensaje aquí..." value={cuerpoMasivo} onChange={(e) => setCuerpoMasivo(e.target.value)} rows={4} className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none text-gray-900 text-sm transition resize-none"/></div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4"><p className="text-amber-800 text-xs font-semibold">⚠️ Este mensaje llegará a todos los usuarios del segmento como notificación en la app.</p></div>
                {mensajeMasivoEnviado && <div className={'rounded-xl p-3 mb-4 text-sm font-semibold ' + (mensajeMasivoEnviado.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>{mensajeMasivoEnviado}</div>}
                <button onClick={enviarMensajeMasivo} disabled={!tituloMasivo.trim() || !cuerpoMasivo.trim() || enviandoMasivo} className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition disabled:opacity-50">{enviandoMasivo ? 'Enviando...' : '📣 Enviar a todos'}</button>
              </div>
            )}
          </div>
        )}

        {tab === 'habilidades' && (
          <div>
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-5">
              <p className="text-purple-800 text-sm font-bold mb-1">🛠️ Habilidades personalizadas</p>
              <p className="text-purple-700 text-xs leading-relaxed">Textos que los Fleksers escribieron porque su habilidad no estaba en la lista oficial. Aparecen agrupados en la categoría "✨ Otros / Sin definir" del catálogo. Si una se repite mucho, considera agregarla como categoría oficial.</p>
            </div>
            {cargandoHabilidades ? (
              <div className="flex items-center justify-center py-16"><div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"/></div>
            ) : habilidadesPersonalizadas.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                <p className="text-4xl mb-3">✨</p>
                <p className="font-bold text-gray-900">Sin habilidades personalizadas aún</p>
                <p className="text-gray-400 text-sm mt-1">Todos los Fleksers usan las categorías oficiales</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {habilidadesPersonalizadas.map((h) => (
                  <div key={h.texto} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-extrabold text-gray-900 text-sm">{h.texto}</p>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 flex-shrink-0">{h.count} flekser{h.count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {h.fleksers.map((f: any) => (
                        <span key={f.id} className="text-xs bg-gray-50 text-gray-600 font-semibold px-2 py-1 rounded-lg border border-gray-100">{f.nombre}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'dispersion' && (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"><p className="text-xs text-gray-400 font-semibold mb-1">💸 Por dispersar</p><p className="text-3xl font-extrabold text-red-500">${totalPendiente.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</p><p className="text-xs text-gray-400 mt-1">{pendienteCount} pagos pendientes</p></div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"><p className="text-xs text-gray-400 font-semibold mb-1">✅ Ya dispersado</p><p className="text-3xl font-extrabold text-green-600">${totalDispersado.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</p><p className="text-xs text-gray-400 mt-1">{pagosDispersion.filter(p => p.dispersado).length} pagos realizados</p></div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-5"><p className="text-blue-800 text-sm font-semibold mb-1">📌 ¿Cómo funciona la dispersión?</p><p className="text-blue-700 text-xs leading-relaxed">Cuando un trabajo se completa y el pago se libera, el dinero queda en tu cuenta de Stripe. Haz la transferencia por SPEI y marca como dispersado.</p></div>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setFiltroDispersion('pendiente')} className={'flex-1 py-2.5 rounded-2xl font-bold text-sm transition ' + (filtroDispersion === 'pendiente' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-white text-gray-500 border border-gray-200')}>⏳ Pendientes {pendienteCount > 0 && '(' + pendienteCount + ')'}</button>
              <button onClick={() => setFiltroDispersion('dispersado')} className={'flex-1 py-2.5 rounded-2xl font-bold text-sm transition ' + (filtroDispersion === 'dispersado' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-white text-gray-500 border border-gray-200')}>✅ Dispersados</button>
            </div>
            {cargandoDispersion ? <div className="flex items-center justify-center py-16"><div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"/></div>
            : pagosFiltrados.length === 0 ? <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100"><p className="text-4xl mb-3">{filtroDispersion === 'pendiente' ? '🎉' : '📭'}</p><p className="font-bold text-gray-900">{filtroDispersion === 'pendiente' ? '¡Sin pagos pendientes!' : 'Sin pagos dispersados aún'}</p></div>
            : (
              <div className="flex flex-col gap-3">
                {pagosFiltrados.map((pago) => (
                  <div key={pago.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                      <div><p className="font-extrabold text-gray-900">{pago.servicios?.titulo || 'Trabajo'}</p><p className="text-xs text-gray-400 mt-0.5">{pago.servicios?.completado_at ? 'Completado: ' + new Date(pago.servicios.completado_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Fecha no disponible'}</p></div>
                      {pago.dispersado ? <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex-shrink-0">✅ Dispersado</span> : <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full flex-shrink-0">⏳ Pendiente</span>}
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 mb-3"><p className="text-xs text-gray-400 font-semibold mb-1">👤 Flekser a pagar</p><p className="font-extrabold text-gray-900">{pago.usuarios?.nombre || '—'}</p>{pago.usuarios?.email && <p className="text-xs text-gray-500 mt-0.5">✉️ {pago.usuarios.email}</p>}{pago.usuarios?.telefono && <p className="text-xs text-gray-500 mt-0.5">📱 {pago.usuarios.telefono}</p>}</div>
                    <div className="border border-gray-100 rounded-xl overflow-hidden mb-3">
                      <div className="flex justify-between items-center px-4 py-2.5 border-b border-gray-100"><span className="text-sm text-gray-500">Precio del trabajo</span><span className="font-bold text-gray-900">${pago.precio.toLocaleString('es-MX')} MXN</span></div>
                      <div className="flex justify-between items-center px-4 py-2.5 border-b border-gray-100 bg-red-50"><span className="text-sm text-red-500">− Comisión Fleksi (10%)</span><span className="font-bold text-red-500">−${pago.comision.toLocaleString('es-MX')} MXN</span></div>
                      <div className="flex justify-between items-center px-4 py-3 bg-green-50"><span className="text-sm font-extrabold text-green-700">💰 A transferir</span><span className="text-xl font-extrabold text-green-700">${pago.pagoFlekser.toLocaleString('es-MX')} MXN</span></div>
                    </div>
                    {pago.dispersado && pago.nota_dispersion && <div className="bg-green-50 rounded-xl p-3 mb-3"><p className="text-xs text-green-700 font-semibold">📝 {pago.nota_dispersion}</p></div>}
                    {!pago.dispersado && (
                      <div className="flex flex-col gap-2">
                        <input type="text" placeholder="Nota opcional..." value={notaDispersion[pago.id] || ''} onChange={(e) => setNotaDispersion(prev => ({ ...prev, [pago.id]: e.target.value }))} className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none text-gray-900 text-sm transition"/>
                        <button onClick={() => marcarDispersado(pago.id, notaDispersion[pago.id] || '')} disabled={marcandoDispersado === pago.id} className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition disabled:opacity-50">{marcandoDispersado === pago.id ? 'Guardando...' : '✅ Marcar como dispersado'}</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'dashboard' && (
          <div>
            {cargandoMetrics ? <div className="flex items-center justify-center py-16"><div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"/></div> : (
              <div className="flex flex-col gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h2 className="font-extrabold text-gray-900 mb-4 flex items-center gap-2"><span>👥</span> Usuarios</h2>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100"><p className="text-3xl font-extrabold text-blue-700">{metrics.totalUsuarios}</p><p className="text-xs text-gray-500 mt-1 font-semibold">Total registrados</p></div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100"><p className="text-3xl font-extrabold text-green-600">{metrics.nuevosHoy}</p><p className="text-xs text-gray-500 mt-1 font-semibold">Nuevos hoy</p></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => abrirModalUsuarios('flekser')} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100 hover:border-purple-300 hover:bg-purple-50 transition active:scale-95"><p className="text-xl font-extrabold text-purple-600">{metrics.fleksers}</p><p className="text-xs text-gray-400 mt-0.5">Fleksers →</p></button>
                    <button onClick={() => abrirModalUsuarios('empresa')} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition active:scale-95"><p className="text-xl font-extrabold text-slate-700">{metrics.empresas}</p><p className="text-xs text-gray-400 mt-0.5">Empresas →</p></button>
                    <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100"><p className="text-xl font-extrabold text-emerald-600">{metrics.nuevosEsteMes}</p><p className="text-xs text-gray-400 mt-0.5">Este mes</p></div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h2 className="font-extrabold text-gray-900 mb-4 flex items-center gap-2"><span>⚡</span> Servicios</h2>
                  <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => abrirModalServicios('activos')} className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-center hover:border-blue-300 hover:bg-blue-100 transition active:scale-95"><p className="text-2xl font-extrabold text-blue-700">{metrics.serviciosPublicados}</p><p className="text-xs text-gray-500 mt-1 font-semibold">Activos →</p></button>
                    <button onClick={() => abrirModalServicios('completados')} className="bg-green-50 rounded-xl p-4 border border-green-100 text-center hover:border-green-300 hover:bg-green-100 transition active:scale-95"><p className="text-2xl font-extrabold text-green-700">{metrics.serviciosCompletados}</p><p className="text-xs text-gray-500 mt-1 font-semibold">Completados →</p></button>
                    <button onClick={() => abrirModalServicios('cancelados')} className="bg-red-50 rounded-xl p-4 border border-red-100 text-center hover:border-red-300 hover:bg-red-100 transition active:scale-95"><p className="text-2xl font-extrabold text-red-600">{metrics.serviciosCancelados}</p><p className="text-xs text-gray-500 mt-1 font-semibold">Cancelados →</p></button>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h2 className="font-extrabold text-gray-900 mb-4 flex items-center gap-2"><span>💰</span> Ingresos</h2>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-green-50 rounded-xl p-4 border border-green-100"><p className="text-xs text-gray-500 font-semibold mb-1">Hoy</p><p className="text-2xl font-extrabold text-green-700">${metrics.ingresosDia.toLocaleString()}</p><p className="text-xs text-gray-400">MXN</p></div>
                    <div className="bg-green-50 rounded-xl p-4 border border-green-100"><p className="text-xs text-gray-500 font-semibold mb-1">Este mes</p><p className="text-2xl font-extrabold text-green-700">${metrics.ingresosMes.toLocaleString()}</p><p className="text-xs text-gray-400">MXN</p></div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4"><p className="text-white/70 text-xs font-semibold mb-1">Comisión acumulada Fleksi (25%)</p><p className="text-3xl font-extrabold text-white">${metrics.comisionAcumulada.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</p><p className="text-white/60 text-xs mt-1">MXN ganados por Fleksi</p></div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h2 className="font-extrabold text-gray-900 mb-4 flex items-center gap-2"><span>📍</span> Ciudad con más actividad</h2>
                  <div className="flex items-center gap-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100"><span className="text-4xl">🏙️</span><div><p className="font-extrabold text-gray-900 text-xl">{metrics.ciudadTopNombre}</p><p className="text-sm text-gray-500">{metrics.ciudadTopCount} usuarios registrados</p></div></div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h2 className="font-extrabold text-gray-900 mb-4 flex items-center gap-2"><span>🎯</span> Intención de registro</h2>
                  <div className="flex flex-col gap-3">
                    {[
                      { label: 'Busca trabajo', sub: 'Quieren ofrecer servicios', count: metrics.intencionTrabajar, emoji: '💼', color: 'bg-blue-50 border-blue-100', textColor: 'text-blue-600' },
                      { label: 'Busca contratar', sub: 'Quieren encontrar ayuda', count: metrics.intencionContratar, emoji: '🔍', color: 'bg-purple-50 border-purple-100', textColor: 'text-purple-600' },
                      { label: 'Trabaja y contrata', sub: 'Intención dual', count: metrics.intencionAmbos, emoji: '⚡', color: 'bg-green-50 border-green-100', textColor: 'text-green-600' },
                    ].map(({ label, sub, count, emoji, color, textColor }) => (
                      <div key={label} className={'flex items-center justify-between rounded-xl p-3 border ' + color}>
                        <div className="flex items-center gap-2"><span className="text-lg">{emoji}</span><div><p className="font-bold text-gray-900 text-sm">{label}</p><p className="text-xs text-gray-400">{sub}</p></div></div>
                        <div className="text-right"><p className={'text-2xl font-extrabold ' + textColor}>{count}</p><p className="text-xs text-gray-400">{metrics.totalUsuarios > 0 ? Math.round((count / metrics.totalUsuarios) * 100) : 0}%</p></div>
                      </div>
                    ))}
                    {metrics.intencionSinDato > 0 && (
                      <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div className="flex items-center gap-2"><span className="text-lg">❓</span><div><p className="font-bold text-gray-900 text-sm">Sin dato</p><p className="text-xs text-gray-400">Registros anteriores</p></div></div>
                        <div className="text-right"><p className="text-2xl font-extrabold text-gray-400">{metrics.intencionSinDato}</p><p className="text-xs text-gray-400">{metrics.totalUsuarios > 0 ? Math.round((metrics.intencionSinDato / metrics.totalUsuarios) * 100) : 0}%</p></div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h2 className="font-extrabold text-gray-900 mb-1 flex items-center gap-2"><span>📈</span> Tendencias — últimas 8 semanas</h2>
                  <p className="text-xs text-gray-400 mb-4">Las gráficas se llenarán conforme crezca Fleksi.</p>
                  {!hayDatosGraficas ? (
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 text-center border border-blue-100"><p className="text-3xl mb-2">🌱</p><p className="font-bold text-gray-700 mb-1">Desde cero</p><p className="text-xs text-gray-500">Aquí verás el crecimiento semana a semana.</p></div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      <div>
                        <p className="text-sm font-bold text-gray-700 mb-3">👥 Crecimiento de usuarios</p>
                        <ResponsiveContainer width="100%" height={180}>
                          <AreaChart data={datosUsuarios} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                            <defs><linearGradient id="gradUsuarios" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/><stop offset="95%" stopColor="#2563EB" stopOpacity={0}/></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6"/>
                            <XAxis dataKey="semana" tick={{ fontSize: 10, fill: '#9CA3AF' }}/>
                            <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} allowDecimals={false}/>
                            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: 12 }} labelStyle={{ fontWeight: 'bold' }}/>
                            <Area type="monotone" dataKey="acumulado" stroke="#2563EB" strokeWidth={2} fill="url(#gradUsuarios)" name="Total acumulado"/>
                            <Area type="monotone" dataKey="usuarios" stroke="#7C3AED" strokeWidth={2} fill="none" name="Nuevos esta semana" strokeDasharray="4 2"/>
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-700 mb-3">⚡ Servicios por semana</p>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={datosServicios} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6"/>
                            <XAxis dataKey="semana" tick={{ fontSize: 10, fill: '#9CA3AF' }}/>
                            <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} allowDecimals={false}/>
                            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: 12 }} labelStyle={{ fontWeight: 'bold' }}/>
                            <Legend wrapperStyle={{ fontSize: 11 }}/>
                            <Bar dataKey="publicados" name="Publicados" fill="#DBEAFE" radius={[4, 4, 0, 0]}/>
                            <Bar dataKey="completados" name="Completados" fill="#059669" radius={[4, 4, 0, 0]}/>
                            <Bar dataKey="cancelados" name="Cancelados" fill="#FCA5A5" radius={[4, 4, 0, 0]}/>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-700 mb-3">💰 Ingresos y comisión por semana (MXN)</p>
                        <ResponsiveContainer width="100%" height={180}>
                          <AreaChart data={datosIngresos} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                            <defs>
                              <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#059669" stopOpacity={0.3}/><stop offset="95%" stopColor="#059669" stopOpacity={0}/></linearGradient>
                              <linearGradient id="gradComision" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3}/><stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6"/>
                            <XAxis dataKey="semana" tick={{ fontSize: 10, fill: '#9CA3AF' }}/>
                            <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={v => '$' + v}/>
                            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: 12 }} labelStyle={{ fontWeight: 'bold' }} formatter={(v: any) => '$' + v.toLocaleString('es-MX') + ' MXN'}/>
                            <Legend wrapperStyle={{ fontSize: 11 }}/>
                            <Area type="monotone" dataKey="ingresos" stroke="#059669" strokeWidth={2} fill="url(#gradIngresos)" name="Transaccionado"/>
                            <Area type="monotone" dataKey="comision" stroke="#7C3AED" strokeWidth={2} fill="url(#gradComision)" name="Comisión Fleksi"/>
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h2 className="font-extrabold text-gray-900 mb-4 flex items-center gap-2"><span>📥</span> Descargar reporte</h2>
                  <div className="flex gap-2 flex-wrap mb-4">
                    {PERIODOS.map(p => (<button key={p.key} onClick={() => setPeriodoReporte(p.key)} className={'px-3 py-1.5 rounded-full text-xs font-bold transition ' + (periodoReporte === p.key ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}>{p.label}</button>))}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={descargarExcel} disabled={!!generandoReporte} className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 transition disabled:opacity-50">{generandoReporte === 'excel' ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : '📊'} Excel</button>
                    <button onClick={descargarPDF} disabled={!!generandoReporte} className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-sm hover:opacity-90 transition disabled:opacity-50">{generandoReporte === 'pdf' ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : '📄'} PDF</button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-center">Última actualización: {new Date().toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            )}
          </div>
        )}

        {tab === 'documentos' && (
          <div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center"><p className="text-2xl font-extrabold text-yellow-600">{totalDocsSubidos}</p><p className="text-xs text-gray-400 mt-1">Por revisar</p></div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center"><p className="text-2xl font-extrabold text-green-600">{totalDocsAprobados}</p><p className="text-xs text-gray-400 mt-1">Aprobados</p></div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center"><p className="text-2xl font-extrabold text-red-600">{totalDocsRechazados}</p><p className="text-xs text-gray-400 mt-1">Rechazados</p></div>
            </div>
            {documentosPorUsuario.length === 0 ? <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100"><p className="text-4xl mb-3">📭</p><p className="font-bold text-gray-900">Sin documentos subidos aún</p></div> : (
              <div className="flex flex-col gap-4">
                {documentosPorUsuario.map((grupo) => {
                  const docsSubidos = grupo.documentos.filter((d: any) => d.estado === 'subido').length;
                  const expandido = usuarioExpandido === grupo.usuario_id;
                  return (
                    <div key={grupo.usuario_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <button onClick={() => setUsuarioExpandido(expandido ? null : grupo.usuario_id)} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                            {grupo.usuario?.foto_url ? <img src={grupo.usuario.foto_url} className="w-full h-full object-cover rounded-xl"/> : <span className="text-white font-bold text-sm">{grupo.usuario?.nombre?.charAt(0) || '?'}</span>}
                          </div>
                          <div className="text-left">
                            <p className="font-extrabold text-gray-900 text-sm">{grupo.usuario?.nombre}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-400 capitalize">{grupo.usuario?.rol}</span>
                              {grupo.usuario?.ciudad && <span className="text-xs text-gray-400">· 📍 {grupo.usuario.ciudad}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {docsSubidos > 0 && <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full">{docsSubidos} por revisar</span>}
                          <span className="text-gray-400 text-sm">{expandido ? '▲' : '▼'}</span>
                        </div>
                      </button>
                      {expandido && (
                        <div className="border-t border-gray-100 p-5">
                          <div className="flex flex-col gap-3">
                            {grupo.documentos.map((doc: any) => (
                              <div key={doc.id} className={'rounded-xl p-4 border ' + (doc.estado === 'aprobado' ? 'bg-green-50 border-green-100' : doc.estado === 'rechazado' ? 'bg-red-50 border-red-100' : 'bg-yellow-50 border-yellow-100')}>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-gray-900">{LABEL_DOCS[doc.tipo] || doc.tipo}</span>
                                    {doc.tipo === 'licencia' && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Opcional</span>}
                                    {doc.tipo === 'antecedentes' && <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">🛡️ Badge especial</span>}
                                  </div>
                                  <span className={'text-xs font-bold px-2 py-1 rounded-full ' + estadoColor(doc.estado)}>{doc.estado === 'subido' ? '🔍 Por revisar' : doc.estado === 'aprobado' ? '✅ Aprobado' : '❌ Rechazado'}</span>
                                </div>
                                {doc.motivo_rechazo && <div className="bg-red-100 rounded-lg p-2 mb-2"><p className="text-xs text-red-700 font-semibold">Motivo: {doc.motivo_rechazo}</p></div>}
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  {doc.url && <button onClick={() => verDocumento(doc.url, grupo.usuario_id, doc.tipo)} className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-200 transition">👁️ Ver</button>}
                                  {doc.estado === 'subido' && (
                                    rechazandoDoc === doc.id ? (
                                      <div className="w-full flex flex-col gap-2 mt-2">
                                        <textarea value={motivoDoc} onChange={(e) => setMotivoDoc(e.target.value)} placeholder="Motivo del rechazo..." rows={2} className="w-full p-2 rounded-lg border-2 border-red-300 outline-none text-gray-900 text-xs resize-none"/>
                                        <div className="flex gap-2">
                                          <button onClick={() => { setRechazandoDoc(''); setMotivoDoc(''); }} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg font-semibold text-xs">Cancelar</button>
                                          <button onClick={() => rechazarDoc(doc.id, grupo.usuario_id, doc.tipo)} disabled={procesandoDoc === doc.id} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-bold text-xs disabled:opacity-50">{procesandoDoc === doc.id ? '...' : 'Confirmar'}</button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex gap-2 ml-auto">
                                        <button onClick={() => setRechazandoDoc(doc.id)} className="px-3 py-1.5 border border-red-200 text-red-500 rounded-lg font-bold text-xs hover:bg-red-50 transition">❌ Rechazar</button>
                                        <button onClick={() => aprobarDoc(doc.id, grupo.usuario_id, grupo.usuario?.nombre, doc.tipo)} disabled={procesandoDoc === doc.id} className="px-3 py-1.5 bg-green-500 text-white rounded-lg font-bold text-xs disabled:opacity-50 hover:bg-green-600 transition">{procesandoDoc === doc.id ? '...' : '✅ Aprobar'}</button>
                                      </div>
                                    )
                                  )}
                                  {doc.estado === 'aprobado' && (
                                    rechazandoDoc === doc.id ? (
                                      <div className="w-full flex flex-col gap-2 mt-2">
                                        <p className="text-xs text-amber-700 font-semibold">⚠️ Esto revertirá la aprobación y el usuario deberá subir el documento de nuevo.</p>
                                        <textarea value={motivoDoc} onChange={(e) => setMotivoDoc(e.target.value)} placeholder="Motivo del rechazo..." rows={2} className="w-full p-2 rounded-lg border-2 border-red-300 outline-none text-gray-900 text-xs resize-none"/>
                                        <div className="flex gap-2">
                                          <button onClick={() => { setRechazandoDoc(''); setMotivoDoc(''); }} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg font-semibold text-xs">Cancelar</button>
                                          <button onClick={() => rechazarDoc(doc.id, grupo.usuario_id, doc.tipo)} disabled={procesandoDoc === doc.id} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-bold text-xs disabled:opacity-50">{procesandoDoc === doc.id ? '...' : 'Confirmar rechazo'}</button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 ml-auto">
                                        <span className="text-xs text-green-600 font-semibold">Aprobado ✓</span>
                                        <button onClick={() => setRechazandoDoc(doc.id)} className="px-2 py-1 border border-red-200 text-red-400 rounded-lg font-bold text-xs hover:bg-red-50 transition">↩️ Revertir</button>
                                      </div>
                                    )
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 mt-2">{new Date(doc.updated_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'verificaciones' && (
          <div>
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[{ key: 'en_revision', label: 'En revisión', color: 'text-yellow-600' }, { key: 'aprobado', label: 'Aprobados', color: 'text-green-600' }, { key: 'rechazado', label: 'Rechazados', color: 'text-red-600' }, { key: 'todas', label: 'Total', color: 'text-purple-600' }].map(s => (
                <div key={s.key} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center"><p className={'text-2xl font-extrabold ' + s.color}>{conteoVerifs[s.key as keyof typeof conteoVerifs]}</p><p className="text-xs text-gray-400 mt-1">{s.label}</p></div>
              ))}
            </div>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {[{ key: 'en_revision', label: '🔍 En revisión' }, { key: 'aprobado', label: '✅ Aprobados' }, { key: 'rechazado', label: '❌ Rechazados' }, { key: 'todas', label: '📋 Todas' }].map(f => (
                <button key={f.key} onClick={() => setFiltro(f.key)} className={'flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition ' + (filtro === f.key ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-white text-gray-500 border border-gray-200')}>{f.label}</button>
              ))}
            </div>
            {filtradas.length === 0 ? <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100"><p className="text-4xl mb-3">📭</p><p className="font-bold text-gray-900">Sin verificaciones en esta categoría</p></div> : (
              <div className="flex flex-col gap-4">
                {filtradas.map((v) => (
                  <div key={v.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                          {v.usuarios?.foto_url ? <img src={v.usuarios.foto_url} className="w-full h-full object-cover rounded-xl"/> : <span className="text-white font-bold">{v.usuarios?.nombre?.charAt(0) || '?'}</span>}
                        </div>
                        <div>
                          <p className="font-extrabold text-gray-900">{v.usuarios?.nombre}</p>
                          <div className="flex items-center gap-2"><span className="text-xs text-gray-400">{v.usuarios?.rol}</span>{v.usuarios?.ciudad && <span className="text-xs text-gray-400">· 📍 {v.usuarios.ciudad}</span>}</div>
                        </div>
                      </div>
                      <span className={'text-xs font-bold px-3 py-1 rounded-full ' + estadoColor(v.estado)}>{v.estado}</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-4">Enviado: {new Date(v.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    {v.motivo_rechazo && <div className="bg-red-50 rounded-xl p-3 mb-4"><p className="text-xs font-bold text-red-700">Motivo:</p><p className="text-xs text-red-600 mt-1">{v.motivo_rechazo}</p></div>}
                    {v.estado === 'en_revision' && (
                      rechazando === v.id ? (
                        <div className="flex flex-col gap-2">
                          <textarea value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)} placeholder="Motivo del rechazo..." rows={3} className="w-full p-3 rounded-xl border-2 border-red-300 outline-none text-gray-900 text-sm resize-none"/>
                          <div className="flex gap-2">
                            <button onClick={() => { setRechazando(''); setMotivoRechazo(''); }} className="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold text-sm">Cancelar</button>
                            <button onClick={() => rechazar(v.id, v.usuarios?.nombre)} disabled={procesando === v.id} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-sm disabled:opacity-50">{procesando === v.id ? 'Rechazando...' : 'Confirmar rechazo'}</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => setRechazando(v.id)} className="flex-1 py-3 border-2 border-red-200 text-red-500 rounded-xl font-bold text-sm hover:bg-red-50 transition">❌ Rechazar</button>
                          <button onClick={() => aprobar(v.id, v.usuario_id, v.usuarios?.nombre)} disabled={procesando === v.id} className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-sm disabled:opacity-50">{procesando === v.id ? 'Aprobando...' : '✅ Aprobar'}</button>
                        </div>
                      )
                    )}
                    {v.estado === 'aprobado' && <div className="bg-green-50 rounded-xl p-3 text-center"><p className="text-green-700 font-bold text-sm">✅ Aprobado por {v.revisado_por}</p><p className="text-green-600 text-xs mt-1">{new Date(v.revisado_at).toLocaleDateString('es-MX')}</p></div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'retiros' && (
          <div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center"><p className="text-2xl font-extrabold text-yellow-600">{retiros.filter(r => r.estado === 'pendiente').length}</p><p className="text-xs text-gray-400 mt-1">Pendientes</p></div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center"><p className="text-2xl font-extrabold text-green-600">{retiros.filter(r => r.estado === 'completado').length}</p><p className="text-xs text-gray-400 mt-1">Completados</p></div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center"><p className="text-2xl font-extrabold text-red-500">${retiros.filter(r => r.estado === 'pendiente').reduce((acc, r) => acc + (r.monto || 0), 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}</p><p className="text-xs text-gray-400 mt-1">MXN por enviar</p></div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-5"><p className="text-blue-800 text-sm font-semibold mb-1">📌 ¿Cómo procesar un retiro?</p><p className="text-blue-700 text-xs leading-relaxed">Haz la transferencia SPEI a la CLABE indicada y marca como completado.</p></div>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {[{ key: 'pendiente', label: '⏳ Pendientes' }, { key: 'completado', label: '✅ Completados' }, { key: 'rechazado', label: '❌ Rechazados' }].map(f => (
                <button key={f.key} onClick={() => setFiltroRetiros(f.key as any)} className={'flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition ' + (filtroRetiros === f.key ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-white text-gray-500 border border-gray-200')}>{f.label}</button>
              ))}
            </div>
            {cargandoRetiros ? <div className="flex items-center justify-center py-16"><div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"/></div>
            : retiros.filter(r => r.estado === filtroRetiros).length === 0 ? <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100"><p className="text-4xl mb-3">{filtroRetiros === 'pendiente' ? '🎉' : '📭'}</p><p className="font-bold text-gray-900">{filtroRetiros === 'pendiente' ? '¡Sin retiros pendientes!' : 'Sin retiros en esta categoría'}</p></div>
            : (
              <div className="flex flex-col gap-4">
                {retiros.filter(r => r.estado === filtroRetiros).map((retiro) => (
                  <div key={retiro.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                          {retiro.usuarios?.foto_url ? <img src={retiro.usuarios.foto_url} className="w-full h-full object-cover rounded-xl"/> : <span className="text-white font-bold text-sm">{retiro.usuarios?.nombre?.charAt(0) || '?'}</span>}
                        </div>
                        <div>
                          <p className="font-extrabold text-gray-900">{retiro.usuarios?.nombre || '—'}</p>
                          {retiro.usuarios?.email && <p className="text-xs text-gray-400">✉️ {retiro.usuarios.email}</p>}
                          {retiro.usuarios?.telefono && <p className="text-xs text-gray-400">📱 {retiro.usuarios.telefono}</p>}
                        </div>
                      </div>
                      <span className={'text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ' + (retiro.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' : retiro.estado === 'completado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600')}>
                        {retiro.estado === 'pendiente' ? '⏳ Pendiente' : retiro.estado === 'completado' ? '✅ Completado' : '❌ Rechazado'}
                      </span>
                    </div>
                    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-100 mb-3"><p className="text-xs text-gray-500 mb-0.5">Monto a transferir</p><p className="text-3xl font-extrabold text-teal-600">${retiro.monto?.toFixed(2)} <span className="text-lg font-normal text-gray-400">MXN</span></p></div>
                    <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden mb-3">
                      <div className="flex justify-between items-center px-4 py-2.5 border-b border-gray-100"><span className="text-xs text-gray-500 font-semibold">Banco</span><span className="font-bold text-gray-900 text-sm">{retiro.banco || '—'}</span></div>
                      <div className="flex justify-between items-center px-4 py-2.5 border-b border-gray-100"><span className="text-xs text-gray-500 font-semibold">CLABE</span><span className="font-bold text-gray-900 text-sm font-mono">{retiro.clabe?.replace(/(\d{4})/g, '$1 ').trim() || '—'}</span></div>
                      <div className="flex justify-between items-center px-4 py-2.5"><span className="text-xs text-gray-500 font-semibold">Titular</span><span className="font-bold text-gray-900 text-sm">{retiro.titular || '—'}</span></div>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">Solicitado: {new Date(retiro.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    {retiro.estado !== 'pendiente' && retiro.notas && (
                      <div className={'rounded-xl p-3 mb-3 ' + (retiro.estado === 'completado' ? 'bg-green-50' : 'bg-red-50')}>
                        <p className={'text-xs font-semibold ' + (retiro.estado === 'completado' ? 'text-green-700' : 'text-red-700')}>📝 {retiro.notas}</p>
                        {retiro.procesado_at && <p className="text-xs text-gray-400 mt-0.5">Por {retiro.procesado_por} · {new Date(retiro.procesado_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>}
                      </div>
                    )}
                    {retiro.estado === 'pendiente' && (
                      <div className="flex flex-col gap-2">
                        <input type="text" placeholder="Nota opcional..." value={notaRetiro[retiro.id] || ''} onChange={e => setNotaRetiro(prev => ({ ...prev, [retiro.id]: e.target.value }))} className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-teal-400 outline-none text-gray-900 text-sm transition"/>
                        {rechazandoRetiro === retiro.id ? (
                          <div className="flex flex-col gap-2">
                            <input type="text" placeholder="Motivo del rechazo (obligatorio)" value={notaRetiro[retiro.id + '_rechazo'] || ''} onChange={e => setNotaRetiro(prev => ({ ...prev, [retiro.id + '_rechazo']: e.target.value }))} className="w-full p-3 rounded-xl border-2 border-red-300 focus:border-red-400 outline-none text-gray-900 text-sm transition"/>
                            <div className="flex gap-2">
                              <button onClick={() => setRechazandoRetiro('')} className="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold text-sm">Cancelar</button>
                              <button onClick={() => rechazarRetiroFn(retiro.id, retiro.usuario_id, retiro.monto, notaRetiro[retiro.id + '_rechazo'] || '')} disabled={procesandoRetiro === retiro.id} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-sm disabled:opacity-50">{procesandoRetiro === retiro.id ? 'Procesando...' : 'Confirmar rechazo'}</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button onClick={() => setRechazandoRetiro(retiro.id)} className="flex-1 py-3 border-2 border-red-200 text-red-500 rounded-xl font-bold text-sm hover:bg-red-50 transition">❌ Rechazar</button>
                            <button onClick={() => procesarRetiro(retiro.id, retiro.usuario_id, retiro.monto, notaRetiro[retiro.id] || '')} disabled={procesandoRetiro === retiro.id} className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 hover:opacity-90 transition">{procesandoRetiro === retiro.id ? 'Procesando...' : '✅ Marcar enviado'}</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {modalUsuarios.visible && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={() => setModalUsuarios({ visible: false, rol: '', lista: [] })}>
          <div className="w-full bg-white rounded-t-3xl p-6 pb-10 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4"/>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-extrabold text-gray-900 text-lg">{modalUsuarios.rol === 'empresa' ? '🏢 Empresas' : '⚡ Fleksers'} registrados</h3>
              <button onClick={() => setModalUsuarios({ visible: false, rol: '', lista: [] })} className="text-gray-400 text-xl font-bold">✕</button>
            </div>
            {cargandoModal ? <div className="flex items-center justify-center py-10"><div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"/></div>
            : modalUsuarios.lista.length === 0 ? <div className="text-center py-10"><p className="text-3xl mb-2">📭</p><p className="text-gray-400">Sin usuarios</p></div>
            : (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-gray-400 mb-1">{modalUsuarios.lista.length} usuario{modalUsuarios.lista.length !== 1 ? 's' : ''}</p>
                {modalUsuarios.lista.map((u) => (
                  <div key={u.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {u.foto_url ? <img src={u.foto_url} className="w-full h-full object-cover"/> : <span className="text-white font-bold text-sm">{u.nombre?.charAt(0) || '?'}</span>}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2"><p className="font-extrabold text-gray-900 text-sm">{u.nombre}</p>{u.verificado && <span className="text-xs bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded-full">✅</span>}</div>
                        {u.ciudad && <p className="text-xs text-gray-400">📍 {u.ciudad}</p>}
                      </div>
                      <p className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    {u.email && <p className="text-xs text-gray-500">✉️ {u.email}</p>}
                    {u.telefono && <p className="text-xs text-gray-500">📱 {u.telefono}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {modalServicios.visible && (() => {
        const tituloModal = modalServicios.estado === 'activos' ? '⚡ Servicios activos' : modalServicios.estado === 'completados' ? '✅ Servicios completados' : '❌ Servicios cancelados';
        const categoriaEmoji: Record<string, string> = { hogar: '🔧', limpieza: '🧹', eventos: '🍽️', mudanza: '🚚', ejecutivo: '🚗', interprete: '🗣️', cocina: '🍳', jardineria: '🌿', mecanica: '🔩', cerrajeria: '🔑', estetica: '💅', otro: '✨' };
        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={() => setModalServicios({ visible: false, estado: '', lista: [] })}>
            <div className="w-full bg-white rounded-t-3xl p-6 pb-10 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4"/>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-extrabold text-gray-900 text-lg">{tituloModal}</h3>
                <button onClick={() => setModalServicios({ visible: false, estado: '', lista: [] })} className="text-gray-400 text-xl font-bold">✕</button>
              </div>
              {cargandoModalServicios ? <div className="flex items-center justify-center py-10"><div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"/></div>
              : modalServicios.lista.length === 0 ? <div className="text-center py-10"><p className="text-3xl mb-2">📭</p><p className="text-gray-400">Sin servicios en esta categoría</p></div>
              : (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-gray-400 mb-1">{modalServicios.lista.length} servicio{modalServicios.lista.length !== 1 ? 's' : ''}</p>
                  {modalServicios.lista.map((s: any) => (
                    <div key={s.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <span className="text-lg flex-shrink-0 mt-0.5">{categoriaEmoji[s.categoria] || '✨'}</span>
                          <div className="min-w-0">
                            <p className="font-extrabold text-gray-900 text-sm truncate">{s.titulo}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{s.usuarios?.nombre || 'Cliente'} · {new Date(s.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                        </div>
                        {s.presupuesto > 0 && <span className="text-xs font-bold text-gray-700 flex-shrink-0">${s.presupuesto.toLocaleString('es-MX')} MXN</span>}
                      </div>
                      <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500">
                        {s.fecha && <span>📅 {s.fecha}{s.hora ? ' ' + s.hora.slice(0,5) : ''}</span>}
                        {s.usuarios?.telefono && <span>📱 {s.usuarios.telefono}</span>}
                      </div>
                      {s.completado_at && (
                        <p className="text-xs text-green-600 font-semibold mt-1">✓ Completado: {new Date(s.completado_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

    </main>
  );
  }