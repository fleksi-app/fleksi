'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Nav from '@/lib/nav';
import TourInicial from '@/components/TourInicial';
import { cacheGet, cacheSet, cacheInvalidate, TTL } from '@/lib/cache';
import { ESTADOS, getCiudades, formatearUbicacion } from '@/lib/ciudades';

const MORADO = '#7B2FE0';

const categoriasDatos = [
  { id: 'hogar', label: 'Hogar', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={MORADO} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>
  )},
  { id: 'limpieza', label: 'Limpieza', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={MORADO} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l9-9"/><path d="M12.5 8.5L16 5l3 3-7.5 7.5"/><path d="M15 6l1.5-1.5a2.12 2.12 0 013 3L18 9"/></svg>
  )},
  { id: 'eventos', label: 'Eventos', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={MORADO} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"/></svg>
  )},
  { id: 'mudanza', label: 'Mudanza', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={MORADO} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
  )},
  { id: 'mecanica', label: 'Mecánica', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={MORADO} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
  )},
  { id: 'cerrajeria', label: 'Cerrajería', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={MORADO} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
  )},
  { id: 'estetica', label: 'Estética', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={MORADO} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
  )},
  { id: 'envios', label: 'Envíos', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={MORADO} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
  )},
];

const MORADO_ICON = '#7B2FE0';
const categoriaIcono: any = {
  hogar: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={MORADO_ICON} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>,
  limpieza: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={MORADO_ICON} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l9-9"/><path d="M12.5 8.5L16 5l3 3-7.5 7.5"/><path d="M15 6l1.5-1.5a2.12 2.12 0 013 3L18 9"/></svg>,
  eventos: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={MORADO_ICON} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"/></svg>,
  mudanza: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={MORADO_ICON} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  ejecutivo: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={MORADO_ICON} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3"/><rect x="9" y="11" width="14" height="10" rx="2"/><circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/></svg>,
  interprete: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={MORADO_ICON} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  cocina: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={MORADO_ICON} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 13.87A4 4 0 017.41 6a5.11 5.11 0 011.05-1.54 5 5 0 017.08 0A5.11 5.11 0 0117 6a4 4 0 011.41 7.87V21H6z"/><line x1="6" y1="17" x2="18" y2="17"/></svg>,
  jardineria: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={MORADO_ICON} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V12M12 12C12 12 7 10 5 6c3 0 5.5 1.5 7 6zM12 12c0 0 5-2 7-6-3 0-5.5 1.5-7 6z"/></svg>,
  mecanica: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={MORADO_ICON} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
  cerrajeria: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={MORADO_ICON} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  estetica: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={MORADO_ICON} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  envios: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={MORADO_ICON} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
  mascotas: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={MORADO_ICON} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="4.5" cy="9.5" r="2.5"/><circle cx="9" cy="5.5" r="2.5"/><circle cx="15" cy="5.5" r="2.5"/><circle cx="19.5" cy="9.5" r="2.5"/><path d="M17.34 14.72c.96-2.08.54-4.5-1.21-5.97C14.88 7.63 13.47 7 12 7s-2.88.63-4.13 1.75c-1.75 1.47-2.17 3.89-1.21 5.97l2.49 5.36c.65 1.39 2.04 2.27 3.85 2.27s3.2-.88 3.85-2.27z"/></svg>,
  super: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={MORADO_ICON} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>,
  otro: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={MORADO_ICON} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>,
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

function getSaludo() {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buenos días,';
  if (hora < 18) return 'Buenas tardes,';
  return 'Buenas noches,';
}

export default function HomeWorker() {
  const [trabajos, setTrabajos] = useState<any[]>([]);
  const [fleksers, setFleksers] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [categoriaActiva, setCategoriaActiva] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [usuario, setUsuario] = useState<any>(null);
  const [aplicacionesUsuario, setAplicacionesUsuario] = useState<string[]>([]);
  const [trabajosCompletados, setTrabajosCompletados] = useState<string[]>([]);
  const [aplicacionesRechazadas, setAplicacionesRechazadas] = useState<string[]>([]);
  const [mostrarBannerPush, setMostrarBannerPush] = useState(false);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [notifModalAbierta, setNotifModalAbierta] = useState<any>(null);
  const [mostrarNotifs, setMostrarNotifs] = useState(false);

  // Menú hamburguesa
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [cambiandoRol, setCambiandoRol] = useState(false);

  const [ciudadActiva, setCiudadActiva] = useState('');
  const [ciudadesVisitadas, setCiudadesVisitadas] = useState<string[]>([]);
  const [mostrarSelectorCiudad, setMostrarSelectorCiudad] = useState(false);
  const [mostrarUbicacionObligatoria, setMostrarUbicacionObligatoria] = useState(false);
  const [estadoSel, setEstadoSel] = useState('');
  const [ciudadSel, setCiudadSel] = useState('');
  const [guardandoUbicacion, setGuardandoUbicacion] = useState(false);
  const [estadoSelectorOpc, setEstadoSelectorOpc] = useState('');
  const [ciudadSelectorOpc, setCiudadSelectorOpc] = useState('');
  const [guardandoCiudad, setGuardandoCiudad] = useState(false);

  const [mostrarBannerInstalar, setMostrarBannerInstalar] = useState(false);
  const [mostrarBannerAyuda, setMostrarBannerAyuda] = useState(false);
  const [walletSaldo, setWalletSaldo] = useState(0);
  const [ganadoMes, setGanadoMes] = useState(0);
  const [esIOS, setEsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [instalando, setInstalando] = useState(false);

  useEffect(() => { cargarDatos(); }, []);

  useEffect(() => {
    const yaInstalada = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (yaInstalada) return;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setEsIOS(ios);
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); setMostrarBannerInstalar(true); };
    window.addEventListener('beforeinstallprompt', handler);
    if (ios) { const yaVio = localStorage.getItem('fleksi_install_dismissed'); if (!yaVio) setMostrarBannerInstalar(true); }
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }

    let perfil = cacheGet<any>('perfil_' + user.id);
    if (!perfil) {
      const { data } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
      perfil = data;
      if (perfil) cacheSet('perfil_' + user.id, perfil, TTL.PERFIL);
    }
    setUsuario(perfil);
    setRoles(perfil?.roles || [perfil?.rol || 'flekser']);
    // Mostrar banner de ayuda si nunca ha visto la guía
    const yaVioAyuda = localStorage.getItem('fleksi_ayuda_vista_' + user.id);
    if (!yaVioAyuda) setMostrarBannerAyuda(true);

    // Cargar wallet y ganado este mes
    setWalletSaldo(perfil?.wallet_saldo || 0);
    if (perfil?.rol === 'flekser' || perfil?.rol === 'viajero') {
      const ahora = new Date();
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      inicioMes.setHours(0, 0, 0, 0);
      const { data: appsCompletadas } = await supabase
        .from('aplicaciones')
        .select('precio_ofrecido, servicios(presupuesto), updated_at')
        .eq('prestador_id', user.id)
        .eq('estado', 'completado')
        .gte('updated_at', inicioMes.toISOString());
      const totalMes = (appsCompletadas || []).reduce((acc: number, a: any) =>
        acc + (a.precio_ofrecido || a.servicios?.presupuesto || 0), 0);
      setGanadoMes(totalMes);
    }

    const ciudadUsuario = perfil?.ciudad || '';
    setCiudadActiva(ciudadUsuario);
    setCiudadesVisitadas(perfil?.ciudades_visitadas || []);
    if (!ciudadUsuario) setMostrarUbicacionObligatoria(true);

    let servicios = cacheGet<any[]>('servicios_activos');
    if (!servicios) {
      const { data } = await supabase.from('servicios')
        .select('*, usuarios!cliente_id(nombre, calificacion, ciudad, foto_url)')
        .eq('estado', 'activo').neq('cliente_id', user.id)
        .order('created_at', { ascending: false });
      servicios = data || [];
      cacheSet('servicios_activos', servicios, TTL.SERVICIOS);
    }
    const ahora = new Date();
    servicios = servicios.filter((s: any) => {
      if (!s.fecha) return true;
      return new Date(s.fecha + 'T' + (s.hora || '23:59')) >= ahora;
    });
    setTrabajos(servicios);

    // Cargar top Fleksers
    const { data: topFleksers } = await supabase.from('usuarios')
      .select('id, nombre, foto_url, calificacion, trabajos_completados, habilidades')
      .eq('rol', 'flekser').not('foto_url', 'is', null)
      .order('trabajos_completados', { ascending: false }).limit(5);
    setFleksers(topFleksers || []);

    const { data: apps } = await supabase.from('aplicaciones').select('servicio_id, estado').eq('prestador_id', user.id);
    setAplicacionesUsuario((apps || []).map(a => a.servicio_id));
    setTrabajosCompletados((apps || []).filter(a => a.estado === 'completado').map(a => a.servicio_id));
    setAplicacionesRechazadas((apps || []).filter(a => a.estado === 'rechazado').map(a => a.servicio_id));

    let notifs = cacheGet<any[]>('notifs_' + user.id);
    if (!notifs) {
      const { data } = await supabase.from('notificaciones').select('*').eq('usuario_id', user.id).order('created_at', { ascending: false }).limit(20);
      notifs = data || [];
      cacheSet('notifs_' + user.id, notifs, TTL.NOTIFICACIONES);
    }
    setNotificaciones(notifs);
    setNoLeidas(notifs.filter(n => !n.leida).length);
    setCargando(false);

    if ('Notification' in window && Notification.permission === 'default') setMostrarBannerPush(true);
    else if ('Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) });
          await fetch('/api/push', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuario_id: user.id, subscription: sub.toJSON() }) });
        }
      } catch (e) {}
    }
  };

  const cambiarRol = async (nuevoRol: string) => {
    if (!usuario || cambiandoRol) return;
    setCambiandoRol(true);
    try {
      const rolesActuales = roles.includes(nuevoRol) ? roles : [...roles, nuevoRol];
      await supabase.from('usuarios').update({ rol_activo: nuevoRol, roles: rolesActuales }).eq('id', usuario.id);
      window.location.href = nuevoRol === 'empresa' ? '/home-empresa' : '/home';
    } catch (e) { console.error(e); }
    finally { setCambiandoRol(false); }
  };

  const guardarUbicacionObligatoria = async () => {
    if (!usuario || !estadoSel || !ciudadSel) return;
    setGuardandoUbicacion(true);
    try {
      const ubicacion = formatearUbicacion(estadoSel, ciudadSel);
      const ciudadesActualizadas = [...(ciudadesVisitadas || [])];
      if (!ciudadesActualizadas.includes(ubicacion)) ciudadesActualizadas.push(ubicacion);
      await supabase.from('usuarios').update({ ciudad: ubicacion, estado: estadoSel, ciudad_base: ubicacion, ciudades_visitadas: ciudadesActualizadas }).eq('id', usuario.id);
      cacheInvalidate('perfil_' + usuario.id);
      setCiudadActiva(ubicacion); setCiudadesVisitadas(ciudadesActualizadas); setMostrarUbicacionObligatoria(false);
    } finally { setGuardandoUbicacion(false); }
  };

  const aplicarCiudadOpcional = async () => {
    if (!usuario || !estadoSelectorOpc || !ciudadSelectorOpc) return;
    setGuardandoCiudad(true);
    try {
      const ubicacion = formatearUbicacion(estadoSelectorOpc, ciudadSelectorOpc);
      const ciudadesActualizadas = [...(ciudadesVisitadas || [])];
      if (!ciudadesActualizadas.includes(ubicacion)) ciudadesActualizadas.push(ubicacion);
      await supabase.from('usuarios').update({ ciudad: ubicacion, ciudades_visitadas: ciudadesActualizadas }).eq('id', usuario.id);
      cacheInvalidate('perfil_' + usuario.id);
      setCiudadActiva(ubicacion); setCiudadesVisitadas(ciudadesActualizadas); setMostrarSelectorCiudad(false);
      setEstadoSelectorOpc(''); setCiudadSelectorOpc('');
    } finally { setGuardandoCiudad(false); }
  };

  const activarNotificaciones = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const permiso = await Notification.requestPermission();
      if (permiso !== 'granted') { setMostrarBannerPush(false); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) });
      await fetch('/api/push', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuario_id: user.id, subscription: sub.toJSON() }) });
      setMostrarBannerPush(false);
    } catch { setMostrarBannerPush(false); }
  };

  const instalarPWA = async () => {
    if (deferredPrompt) {
      setInstalando(true);
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setMostrarBannerInstalar(false);
      setDeferredPrompt(null); setInstalando(false);
    }
  };

  const abrirNotifs = async () => {
    setMostrarNotifs(true);
    if (!usuario) return;
    await supabase.from('notificaciones').update({ leida: true }).eq('usuario_id', usuario.id).eq('leida', false);
    setNoLeidas(0);
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
  };

  const fleksersFiltrados = busqueda.trim().length >= 2
    ? fleksers.filter(f =>
        f.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        (f.habilidades || []).some((h: string) => h.toLowerCase().includes(busqueda.toLowerCase()))
      )
    : [];

  const trabajosFiltrados = trabajos
    .filter(t => !trabajosCompletados.includes(t.id))
    .filter(t => !aplicacionesRechazadas.includes(t.id))
    .filter(t => !aplicacionesUsuario.includes(t.id))
    .filter(t => {
      if (t.cupos > 1 && (t.cupos - (t.cupos_tomados || 0)) <= 0) return false;
      const matchCat = !categoriaActiva || t.categoria?.toLowerCase() === categoriaActiva.toLowerCase();
      const matchBusqueda = !busqueda || t.titulo?.toLowerCase().includes(busqueda.toLowerCase()) || t.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
      const matchCiudad = !ciudadActiva ||
        t.usuarios?.ciudad?.toLowerCase().includes(ciudadActiva.toLowerCase()) ||
        ciudadActiva.toLowerCase().includes((t.usuarios?.ciudad || '').toLowerCase());
      return matchCat && matchBusqueda && matchCiudad;
    });

  const ciudadesSugeridas = Array.from(new Set([...(ciudadesVisitadas || []), ...(usuario?.ciudad_base ? [usuario.ciudad_base] : [])])).filter(Boolean);
  const ciudadesDelEstadoOpc = getCiudades(estadoSelectorOpc);
  const ciudadesDelEstadoModal = getCiudades(estadoSel);
  const notifEmoji: any = { nueva_aplicacion: '✋', aplicacion_aceptada: '✅', aplicacion_rechazada: '❌', trabajo_completado: '🎉', nuevo_trabajo: '🔔', pago_liberado: '💰', mensaje_nuevo: '💬' };

  if (cargando) return (
    <main className="min-h-screen flex items-center justify-center" style={{background: '#F8FAFC'}}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{borderColor: MORADO, borderTopColor: 'transparent'}}/>
        <p className="text-gray-400 text-sm">Cargando...</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen pb-32" style={{background: '#F8FAFC'}}>

      {/* ── HEADER ── */}
      <div className="bg-white px-5 pt-12 pb-4 shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* Hamburguesa */}
          <button onClick={() => setMostrarMenu(true)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-50 transition">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
              <rect width="512" height="512" rx="110" fill="#F8FAFC"/>
              <rect x="112" y="140" width="288" height="72" rx="36" fill={MORADO}/>
              <rect x="112" y="244" width="220" height="72" rx="36" fill={MORADO}/>
              <rect x="112" y="348" width="152" height="72" rx="36" fill={MORADO}/>
            </svg>
            <span className="font-extrabold text-xl" style={{color: '#1A1A2E', letterSpacing: '-0.5px'}}>fleksi</span>
          </div>

          {/* Campana */}
          <button onClick={abrirNotifs} className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-50 transition">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            {noLeidas > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 text-white text-xs font-extrabold rounded-full flex items-center justify-center border border-white" style={{backgroundColor: '#EF4444', fontSize: '9px'}}>
                {noLeidas > 9 ? '9+' : noLeidas}
              </span>
            )}
          </button>
        </div>

        {/* Saludo */}
        <div className="max-w-md mx-auto mt-4 mb-3">
          <p className="text-gray-400 text-sm">{getSaludo()}</p>
          <h1 className="text-2xl font-extrabold" style={{color: '#1A1A2E'}}>
            {usuario?.nombre?.split(' ')[0] || 'Bienvenido'} 👋
          </h1>
        </div>

        {/* Ubicación */}
        <div className="max-w-md mx-auto mb-3">
          <button onClick={() => { setEstadoSelectorOpc(usuario?.estado || ''); setCiudadSelectorOpc(''); setMostrarSelectorCiudad(true); }}
            className="flex items-center gap-1.5 hover:opacity-80 transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MORADO} strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span className="text-sm font-bold" style={{color: MORADO}}>{ciudadActiva || 'Selecciona tu ciudad'}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={MORADO} strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
          </button>
        </div>

        {/* Widget wallet */}
        {walletSaldo > 0 && (
          <div className="max-w-md mx-auto mb-3">
            <a href="/wallet" className="flex items-center justify-between rounded-2xl px-4 py-2.5 hover:opacity-90 transition" style={{background: '#F5F0FF'}}>
              <div className="flex items-center gap-2">
                <span className="text-base">💜</span>
                <div>
                  <p className="text-xs font-semibold" style={{color: '#7B2FE0'}}>Este mes</p>
                  <p className="text-sm font-extrabold" style={{color: '#1A1A2E'}}>${ganadoMes.toLocaleString('es-MX', {maximumFractionDigits: 0})} MXN</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Wallet</p>
                <p className="text-sm font-extrabold" style={{color: '#7B2FE0'}}>${walletSaldo.toFixed(0)} MXN →</p>
              </div>
            </a>
          </div>
        )}

        {/* Buscador */}
        <div className="max-w-md mx-auto">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder="¿Qué necesitas hoy?"
              value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-gray-100 bg-gray-50 text-gray-900 placeholder-gray-400 outline-none focus:border-purple-200 transition text-sm"/>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 py-5">

        {/* Banner perfil incompleto */}
        {!usuario?.foto_url && (
          <a href="/perfil" className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 hover:opacity-90 transition">
            <span className="text-xl flex-shrink-0">⚠️</span>
            <div className="flex-1">
              <p className="font-bold text-amber-800 text-sm">Completa tu perfil</p>
              <p className="text-amber-700 text-xs mt-0.5">Sin foto tienes <span className="font-bold">90% menos chances</span> de ser contratado</p>
            </div>
            <span className="text-amber-500 font-bold">→</span>
          </a>
        )}

        {/* Banner push */}
        {mostrarBannerPush && (
          <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-4 mb-5 shadow-sm">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background: MORADO}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-sm">Activa notificaciones</p>
              <p className="text-xs text-gray-400">Recibe avisos de nuevos trabajos</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setMostrarBannerPush(false)} className="text-xs text-gray-400 font-semibold">No</button>
              <button onClick={activarNotificaciones} className="text-xs text-white font-bold px-3 py-1.5 rounded-xl" style={{background: MORADO}}>Activar</button>
            </div>
          </div>
        )}

        {/* Banner progreso de perfil para fleksers */}
        {usuario && (usuario.rol === 'flekser' || usuario.rol === 'viajero') && (() => {
          const campos = [
            !!usuario.foto_url,
            !!usuario.descripcion,
            !!(usuario.habilidades && usuario.habilidades.length > 0),
            !!usuario.ciudad,
            !!usuario.telefono,
          ];
          const completados = campos.filter(Boolean).length;
          const total = campos.length;
          const pct = Math.round((completados / total) * 100);
          if (pct === 100) return null;
          return (
            <a href="/perfil" className="block rounded-2xl p-4 mb-5 border" style={{background: '#F5F0FF', borderColor: '#DDD6FE'}}>
              <div className="flex items-center justify-between mb-2">
                <p className="font-extrabold text-sm" style={{color: '#1A1A2E'}}>Tu perfil está al {pct}%</p>
                <span className="text-xs font-bold px-2 py-1 rounded-full text-white" style={{background: '#7B2FE0'}}>{completados}/{total}</span>
              </div>
              <div className="w-full bg-white rounded-full h-2 mb-2" style={{border: '1px solid #DDD6FE'}}>
                <div className="h-2 rounded-full transition-all" style={{width: pct + '%', background: '#7B2FE0'}}/>
              </div>
              <p className="text-xs" style={{color: '#6D28D9'}}>
                {pct < 50 ? '⚠️ Perfil incompleto — los clientes no pueden contratarte correctamente' :
                 pct < 80 ? '💪 Casi listo — completa tu perfil para recibir más trabajo' :
                 '🔥 ¡Un poco más! Los fleksers con perfil completo ganan 3x más'}
              </p>
            </a>
          );
        })()}

        {/* Banner ayuda para nuevos usuarios */}
        {mostrarBannerAyuda && (
          <div className="rounded-2xl p-4 mb-5 border-2 flex items-start gap-3" style={{background: '#F5F0FF', borderColor: '#DDD6FE'}}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl" style={{background: '#EDE9FA'}}>❓</div>
            <div className="flex-1">
              <p className="font-extrabold text-sm mb-0.5" style={{color: '#1A1A2E'}}>¿Primera vez en Fleksi?</p>
              <p className="text-xs text-gray-500 mb-3">Aprende a usar la app en menos de 5 minutos con nuestras guías.</p>
              <div className="flex gap-2">
                <a href="/ayuda" className="flex-1 py-2 text-center text-white rounded-xl font-bold text-xs" style={{background: '#7B2FE0'}}>
                  Ver guías →
                </a>
                <button onClick={() => {
                  localStorage.setItem('fleksi_ayuda_vista_' + usuario?.id, '1');
                  setMostrarBannerAyuda(false);
                }} className="px-4 py-2 rounded-xl font-bold text-xs text-gray-400 bg-white border border-gray-200">
                  Ver después
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── CATEGORÍAS RÁPIDAS ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-extrabold text-gray-900">Categorías rápidas</h2>
            <a href="/catalogo" className="text-sm font-bold" style={{color: MORADO}}>Ver todas</a>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{scrollbarWidth: 'none'}}>
            {categoriasDatos.map((cat) => (
              <a key={cat.id} href={'/catalogo?categoria=' + cat.id}
                className="flex-shrink-0 flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border-2 transition shadow-sm active:scale-95 w-20"
                style={{borderColor: '#F1F5F9'}}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: '#F5F0FF'}}>
                  {cat.icon}
                </div>
                <span className="text-xs font-semibold text-center leading-tight text-gray-500">{cat.label}</span>
              </a>
            ))}
            <a href="/catalogo" className="flex-shrink-0 flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border-2 transition shadow-sm active:scale-95 w-20" style={{borderColor: '#F1F5F9'}}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: '#F5F0FF'}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={MORADO} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
              </div>
              <span className="text-xs font-semibold text-center leading-tight text-gray-500">Ver más</span>
            </a>
          </div>
        </div>

        {/* ── RESULTADOS DE BÚSQUEDA ── */}
        {busqueda.trim().length >= 2 && (fleksersFiltrados.length > 0) && (
          <div className="mb-6">
            <h2 className="font-extrabold text-gray-900 mb-3">👤 Fleksers que coinciden</h2>
            <div className="flex flex-col gap-2">
              {fleksersFiltrados.slice(0, 3).map((f) => (
                <a href={'/perfil/' + f.id} key={f.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 active:scale-95 transition">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
                    {f.foto_url ? <img src={f.foto_url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center font-bold text-gray-400 text-lg">{f.nombre?.charAt(0)}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm">{f.nombre}</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {(f.habilidades || []).slice(0,2).map((h: string) => (
                        <span key={h} className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{background: '#F5F0FF', color: '#7B2FE0'}}>{h.split(' ').slice(1).join(' ') || h}</span>
                      ))}
                      {(!f.habilidades || f.habilidades.length === 0) && <span className="text-xs text-gray-400">Flekser</span>}
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{background: '#F5F0FF', color: MORADO}}>Ver perfil →</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── SERVICIOS POPULARES CERCA DE TI ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-extrabold text-gray-900">
              {busqueda.trim().length >= 2 ? 'Servicios que coinciden' : ciudadActiva ? 'Servicios en ' + ciudadActiva : 'Servicios disponibles'}
            </h2>
            <span className="text-xs text-gray-400 font-semibold">{trabajosFiltrados.length} activos</span>
          </div>

          {trabajosFiltrados.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
              <p className="text-3xl mb-2">🔍</p>
              <p className="font-bold text-gray-900 text-sm mb-1">Sin servicios disponibles</p>
              <p className="text-gray-400 text-xs">{ciudadActiva ? 'No hay trabajos en ' + ciudadActiva + ' ahorita' : 'Vuelve más tarde'}</p>
              {categoriaActiva && <button onClick={() => setCategoriaActiva('')} className="mt-3 text-xs font-bold" style={{color: MORADO}}>Ver todas las categorías</button>}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {trabajosFiltrados.slice(0, 5).map((trabajo) => (
                <a href={'/trabajo?id=' + trabajo.id} key={trabajo.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-95 transition flex gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{background: '#F5F0FF'}}>
                    {categoriaIcono[trabajo.categoria?.toLowerCase()] || categoriaIcono.otro}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-gray-900 text-sm leading-tight">{trabajo.titulo}</h3>
                      {trabajo.urgente && <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">🔴</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{trabajo.usuarios?.nombre || 'Cliente'}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-400">{trabajo.fecha ? '📅 ' + trabajo.fecha : trabajo.urgente ? '🔴 Urgente' : ''}</p>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{background: MORADO}}>Aplicar →</span>
                    </div>
                  </div>
                </a>
              ))}
              {trabajosFiltrados.length > 5 && (
                <button className="w-full py-3 bg-white border-2 rounded-2xl font-bold text-sm transition hover:opacity-80"
                  style={{borderColor: MORADO, color: MORADO}}
                  onClick={() => {}}>
                  Ver {trabajosFiltrados.length - 5} más →
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── FLEKSERS DESTACADOS ── */}
        {fleksers.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-extrabold text-gray-900">Fleksers destacados</h2>
              <a href="/catalogo" className="text-sm font-bold" style={{color: MORADO}}>Ver todos</a>
            </div>
            <div className="flex flex-col gap-2">
              {fleksers.map((f) => (
                <a href={'/perfil/' + f.id} key={f.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 active:scale-95 transition">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
                    {f.foto_url ? <img src={f.foto_url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center font-bold text-gray-400">{f.nombre?.charAt(0)}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm">{f.nombre}</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {(f.habilidades || []).slice(0,2).map((h: string) => (
                        <span key={h} className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{background: '#F5F0FF', color: '#7B2FE0'}}>{h.split(' ').slice(1).join(' ') || h}</span>
                      ))}
                      {(!f.habilidades || f.habilidades.length === 0) && <span className="text-xs text-gray-400">Flekser</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <span className="text-sm font-bold text-gray-900">{f.calificacion || '5.0'}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── MENÚ HAMBURGUESA ── */}
      {mostrarMenu && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setMostrarMenu(false)}>
          <div className="w-72 bg-white h-full shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header del menú */}
            <div className="px-6 pt-12 pb-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <svg width="24" height="24" viewBox="0 0 512 512"><rect width="512" height="512" rx="110" fill="#F8FAFC"/><rect x="112" y="140" width="288" height="72" rx="36" fill={MORADO}/><rect x="112" y="244" width="220" height="72" rx="36" fill={MORADO}/><rect x="112" y="348" width="152" height="72" rx="36" fill={MORADO}/></svg>
                  <span className="font-extrabold text-lg" style={{color: '#1A1A2E'}}>fleksi</span>
                </div>
                <button onClick={() => setMostrarMenu(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-sm">✕</button>
              </div>
              {usuario && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                    {usuario.foto_url ? <img src={usuario.foto_url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center font-bold text-gray-400 text-lg">{usuario.nombre?.charAt(0)}</div>}
                  </div>
                  <div>
                    <p className="font-extrabold text-gray-900 text-sm">{usuario.nombre}</p>
                    <p className="text-xs text-gray-400">{usuario.email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Links del menú */}
            <div className="flex-1 overflow-y-auto py-3">
              {[
                { href: '/perfil', icon: '👤', label: 'Mi perfil' },
                { href: '/wallet', icon: '💳', label: 'Wallet' },
                { href: '/verificacion', icon: '🛡️', label: 'Verificación' },
                { href: '/ayuda', icon: '❓', label: 'Ayuda y soporte' },
                { href: '/terminos', icon: '📄', label: 'Términos y condiciones' },
                { href: '/privacidad', icon: '🔒', label: 'Aviso de privacidad' },
              ].map((item) => (
                <a key={item.label} href={item.href}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition"
                  onClick={() => setMostrarMenu(false)}>
                  <span className="text-xl w-6 text-center">{item.icon}</span>
                  <span className="font-semibold text-gray-700 text-sm">{item.label}</span>
                </a>
              ))}
              {roles.includes('empresa') && (
                <button onClick={() => { setMostrarMenu(false); cambiarRol('empresa'); }}
                  disabled={cambiandoRol}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-purple-50 transition w-full text-left">
                  <span className="text-xl w-6 text-center">🏢</span>
                  <span className="font-semibold text-purple-600 text-sm">{cambiandoRol ? 'Cambiando...' : 'Cambiar a modo Empresa'}</span>
                </button>
              )}
              <button
                onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }}
                className="flex items-center gap-4 px-6 py-4 hover:bg-red-50 transition w-full text-left">
                <span className="text-xl w-6 text-center">🚪</span>
                <span className="font-semibold text-red-500 text-sm">Cerrar sesión</span>
              </button>
            </div>

            {/* Footer del menú */}
            <div className="px-6 py-4 border-t border-gray-100">
              <button className="flex items-center gap-4 w-full hover:opacity-80 transition">
                <span className="text-xl">⭐</span>
                <span className="font-semibold text-gray-700 text-sm">Valorar la app</span>
              </button>
              <p className="text-xs text-gray-400 mt-3">Fleksi v1.0 · Irapuato, Gto.</p>
            </div>
          </div>
          <div className="flex-1 bg-black/40"/>
        </div>
      )}

      {/* ── NOTIFICACIONES ── */}
      {mostrarNotifs && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setMostrarNotifs(false)}>
          <div className="w-full bg-white rounded-t-3xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-lg">Notificaciones</h3>
              <button onClick={() => setMostrarNotifs(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-sm">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-3">
              {notificaciones.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-3xl mb-3">🔔</p>
                  <p className="font-bold text-gray-900 mb-1">Sin notificaciones</p>
                  <p className="text-gray-400 text-sm">Aquí verás tus actualizaciones</p>
                </div>
              ) : notificaciones.map((n) => (
                <button key={n.id} onClick={() => {
                  if (n.tipo === 'admin_mensaje') { setNotifModalAbierta(n); }
                  else if (n.link) { setMostrarNotifs(false); window.location.href = n.link; }
                }} className={'flex items-start gap-3 p-3 rounded-2xl transition text-left w-full mb-2 ' + (!n.leida ? 'border border-purple-100' : 'bg-gray-50')}
                  style={!n.leida ? {background: '#F5F0FF'} : {}}>
                  <span className="text-xl flex-shrink-0 mt-0.5">{notifEmoji[n.tipo] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm">{n.titulo}</p>
                    {n.mensaje && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.mensaje}</p>}
                    <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  {!n.leida && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2" style={{background: MORADO}}/>}
                </button>
              ))}
            </div>
            <div className="pb-8"/>
          </div>
        </div>
      )}

      {notifModalAbierta && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-6" onClick={() => setNotifModalAbierta(null)}>
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-8 pb-6 text-center" style={{background: MORADO}}>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3"><span className="text-2xl">📢</span></div>
              <h3 className="text-white font-extrabold text-lg">{notifModalAbierta.titulo}</h3>
            </div>
            <div className="px-6 py-5">
              <p className="text-gray-700 text-sm leading-relaxed mb-4">{notifModalAbierta.mensaje}</p>
              <button onClick={() => setNotifModalAbierta(null)} className="w-full py-3 text-white rounded-2xl font-bold text-sm" style={{background: MORADO}}>Entendido ✓</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL UBICACIÓN OBLIGATORIA ── */}
      {mostrarUbicacionObligatoria && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-6 pt-8 pb-6 text-center" style={{background: MORADO}}>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl">📍</div>
              <h2 className="text-white font-extrabold text-xl">¿Dónde estás?</h2>
              <p className="text-white/80 text-sm mt-1">Para mostrarte trabajos cerca de ti</p>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Estado</label>
                <select value={estadoSel} onChange={e => { setEstadoSel(e.target.value); setCiudadSel(''); }}
                  className="w-full p-4 rounded-2xl border-2 border-gray-200 outline-none text-gray-900 bg-white" style={{borderColor: estadoSel ? MORADO : undefined}}>
                  <option value="">Selecciona...</option>
                  {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              {estadoSel && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Ciudad</label>
                  <select value={ciudadSel} onChange={e => setCiudadSel(e.target.value)}
                    className="w-full p-4 rounded-2xl border-2 border-gray-200 outline-none text-gray-900 bg-white" style={{borderColor: ciudadSel ? MORADO : undefined}}>
                    <option value="">Selecciona...</option>
                    {ciudadesDelEstadoModal.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
              <button onClick={guardarUbicacionObligatoria} disabled={guardandoUbicacion || !estadoSel || !ciudadSel}
                className="w-full py-4 text-white rounded-2xl font-bold disabled:opacity-50 transition" style={{background: MORADO}}>
                {guardandoUbicacion ? 'Guardando...' : 'Confirmar ubicación ✓'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SELECTOR CIUDAD OPCIONAL ── */}
      {mostrarSelectorCiudad && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setMostrarSelectorCiudad(false)}>
          <div className="w-full bg-white rounded-t-3xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-extrabold text-gray-900 text-lg">Cambiar ubicación</h3>
                