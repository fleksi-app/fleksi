'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Nav from '@/lib/nav';
import TourInicial from '@/components/TourInicial';
import { cacheGet, cacheSet, cacheInvalidate, TTL } from '@/lib/cache';
import { ESTADOS, getCiudades, formatearUbicacion } from '@/lib/ciudades';

const categorias = ['Todos', 'Hogar', 'Limpieza', 'Eventos', 'Mudanza', 'Ejecutivo', 'Cocina', 'Jardinería', 'Mecánica', 'Cerrajería', 'Estética', 'Envíos', 'Mascotas', 'Súper', 'Otro'];

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
  const [cargando, setCargando] = useState(true);
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [usuario, setUsuario] = useState<any>(null);
  const [aplicacionesUsuario, setAplicacionesUsuario] = useState<string[]>([]);
  const [trabajosCompletados, setTrabajosCompletados] = useState<string[]>([]);
  const [aplicacionesRechazadas, setAplicacionesRechazadas] = useState<string[]>([]);
  const [mostrarBannerPush, setMostrarBannerPush] = useState(false);
  const [mostrarNotifs, setMostrarNotifs] = useState(false);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [mostrarCambioRol, setMostrarCambioRol] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [cambiandoRol, setCambiandoRol] = useState(false);
  const [notifModalAbierta, setNotifModalAbierta] = useState<any>(null);

  const [ciudadActiva, setCiudadActiva] = useState('');
  const [ciudadesVisitadas, setCiudadesVisitadas] = useState<string[]>([]);
  const [mostrarSelectorCiudad, setMostrarSelectorCiudad] = useState(false);

  // Modal ubicación obligatoria
  const [mostrarUbicacionObligatoria, setMostrarUbicacionObligatoria] = useState(false);
  const [estadoSel, setEstadoSel] = useState('');
  const [ciudadSel, setCiudadSel] = useState('');
  const [guardandoUbicacion, setGuardandoUbicacion] = useState(false);

  // Selector ciudad opcional (cambiar ubicación)
  const [estadoSelectorOpc, setEstadoSelectorOpc] = useState('');
  const [ciudadSelectorOpc, setCiudadSelectorOpc] = useState('');
  const [guardandoCiudad, setGuardandoCiudad] = useState(false);

  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroUrgente, setFiltroUrgente] = useState(false);
  const [filtroSeguro, setFiltroSeguro] = useState(false);

  const [mostrarBannerInstalar, setMostrarBannerInstalar] = useState(false);
  const [esIOS, setEsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [instalando, setInstalando] = useState(false);

  useEffect(() => { cargarDatos(); }, []);

  useEffect(() => {
    const yaInstalada = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    if (yaInstalada) return;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setEsIOS(ios);
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setMostrarBannerInstalar(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    if (ios) {
      const yaVioBanner = localStorage.getItem('fleksi_install_dismissed');
      if (!yaVioBanner) setMostrarBannerInstalar(true);
    }
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

    const ciudadUsuario = perfil?.ciudad || '';
    setCiudadActiva(ciudadUsuario);
    setCiudadesVisitadas(perfil?.ciudades_visitadas || []);

    if (!ciudadUsuario) {
      setMostrarUbicacionObligatoria(true);
    }

    let servicios = cacheGet<any[]>('servicios_activos');
    if (!servicios) {
      const { data } = await supabase.from('servicios')
        .select('*, usuarios!cliente_id(nombre, calificacion, ciudad)')
        .eq('estado', 'activo').neq('cliente_id', user.id)
        .order('created_at', { ascending: false });
      servicios = data || [];
      cacheSet('servicios_activos', servicios, TTL.SERVICIOS);
    }
    setTrabajos(servicios);

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

    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        setMostrarBannerPush(true);
      } else if (Notification.permission === 'granted') {
        try {
          if ('serviceWorker' in navigator && 'PushManager' in window) {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
            });
            await fetch('/api/push', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ usuario_id: user.id, subscription: subscription.toJSON() }),
            });
          }
        } catch (e) {}
      }
    }
  };

  const guardarUbicacionObligatoria = async () => {
    if (!usuario || !estadoSel || !ciudadSel) return;
    setGuardandoUbicacion(true);
    try {
      const ubicacion = formatearUbicacion(estadoSel, ciudadSel);
      const ciudadesActualizadas = [...(ciudadesVisitadas || [])];
      if (!ciudadesActualizadas.includes(ubicacion)) ciudadesActualizadas.push(ubicacion);
      await supabase.from('usuarios').update({
        ciudad: ubicacion,
        estado: estadoSel,
        ciudad_base: ubicacion,
        ciudades_visitadas: ciudadesActualizadas,
      }).eq('id', usuario.id);
      cacheInvalidate('perfil_' + usuario.id);
      setCiudadActiva(ubicacion);
      setCiudadesVisitadas(ciudadesActualizadas);
      setMostrarUbicacionObligatoria(false);
    } finally {
      setGuardandoUbicacion(false);
    }
  };

  const aplicarCiudadOpcional = async () => {
    if (!usuario || !estadoSelectorOpc || !ciudadSelectorOpc) return;
    setGuardandoCiudad(true);
    try {
      const ubicacion = formatearUbicacion(estadoSelectorOpc, ciudadSelectorOpc);
      const ciudadesActualizadas = [...(ciudadesVisitadas || [])];
      if (!ciudadesActualizadas.includes(ubicacion)) ciudadesActualizadas.push(ubicacion);
      await supabase.from('usuarios').update({
        ciudad: ubicacion,
        ciudades_visitadas: ciudadesActualizadas,
      }).eq('id', usuario.id);
      cacheInvalidate('perfil_' + usuario.id);
      setCiudadActiva(ubicacion);
      setCiudadesVisitadas(ciudadesActualizadas);
      setMostrarSelectorCiudad(false);
      setEstadoSelectorOpc('');
      setCiudadSelectorOpc('');
    } finally {
      setGuardandoCiudad(false);
    }
  };

  const activarNotificaciones = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const permiso = await Notification.requestPermission();
      if (permiso !== 'granted') { setMostrarBannerPush(false); return; }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });
      await fetch('/api/push', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuario_id: user.id, subscription: subscription.toJSON() }) });
      setMostrarBannerPush(false);
    } catch (err) { setMostrarBannerPush(false); }
  };

  const instalarPWA = async () => {
    if (deferredPrompt) {
      setInstalando(true);
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setMostrarBannerInstalar(false);
      setDeferredPrompt(null);
      setInstalando(false);
    }
  };

  const cerrarBannerInstalar = () => {
    localStorage.setItem('fleksi_install_dismissed', '1');
    setMostrarBannerInstalar(false);
  };

  const abrirNotifs = async () => {
    setMostrarNotifs(true);
    if (!usuario) return;
    await supabase.from('notificaciones').update({ leida: true }).eq('usuario_id', usuario.id).eq('leida', false);
    setNoLeidas(0);
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
  };

  const cambiarRol = async (nuevoRol: string) => {
    if (!usuario || cambiandoRol) return;
    setCambiandoRol(true);
    const rolesActuales = roles.includes(nuevoRol) ? roles : [...roles, nuevoRol];
    await supabase.from('usuarios').update({ rol_activo: nuevoRol, roles: rolesActuales }).eq('id', usuario.id);
    setMostrarCambioRol(false);
    if (nuevoRol === 'empresa') window.location.href = '/home-empresa';
    setCambiandoRol(false);
  };

  const limpiarFiltros = () => {
    setFiltroFecha(''); setFiltroUrgente(false); setFiltroSeguro(false);
    setCategoriaActiva('Todos');
  };

  const filtrosActivos = [filtroFecha, filtroUrgente, filtroSeguro, categoriaActiva !== 'Todos'].filter(Boolean).length;

  const categoriaEmoji: any = {
    hogar: '🔧', limpieza: '🧹', eventos: '🍽️', mudanza: '🚚', ejecutivo: '🚗',
    interprete: '🗣️', cocina: '🍳', jardineria: '🌿', mecanica: '🔩',
    cerrajeria: '🔑', estetica: '💅', envios: '🛵', mascotas: '🐾', super: '🛒', otro: '✨',
  };

  const trabajosFiltrados = trabajos
    .filter(t => !trabajosCompletados.includes(t.id))
    .filter(t => !aplicacionesRechazadas.includes(t.id))
    .filter(t => !aplicacionesUsuario.includes(t.id))
    .filter(t => {
      if (t.cupos > 1) {
        const disponibles = t.cupos - (t.cupos_tomados || 0);
        if (disponibles <= 0) return false;
      }
      const matchCat = categoriaActiva === 'Todos' || t.categoria?.toLowerCase().includes(categoriaActiva.toLowerCase());
      const matchBusqueda = t.titulo?.toLowerCase().includes(busqueda.toLowerCase()) || t.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
      const matchCiudad = !ciudadActiva ||
        t.usuarios?.ciudad?.toLowerCase().includes(ciudadActiva.toLowerCase()) ||
        ciudadActiva.toLowerCase().includes((t.usuarios?.ciudad || '').toLowerCase()) ||
        t.direccion?.toLowerCase().includes(ciudadActiva.toLowerCase());
      const matchFecha = !filtroFecha || t.fecha === filtroFecha;
      const matchUrgente = !filtroUrgente || t.urgente === true;
      const matchSeguro = !filtroSeguro || t.seguro === true;
      return matchCat && matchBusqueda && matchCiudad && matchFecha && matchUrgente && matchSeguro;
    });

  const notifEmoji: any = { nueva_aplicacion: '✋', aplicacion_aceptada: '✅', aplicacion_rechazada: '❌', trabajo_completado: '🎉', nuevo_trabajo: '🔔', pago_liberado: '💰', mensaje_nuevo: '💬' };
  const rolInfo: any = {
    flekser: { emoji: '⚡', label: 'Flekser' },
    empresa: { emoji: '🏢', label: 'Empresa' },
  };

  const getCuposLabel = (trabajo: any) => {
    if (!trabajo.cupos || trabajo.cupos <= 1) return null;
    const disponibles = trabajo.cupos - (trabajo.cupos_tomados || 0);
    if (disponibles <= 1) return <span className="text-xs font-bold text-red-500">🔥 ¡Solo queda {disponibles} cupo!</span>;
    if (disponibles <= 3) return <span className="text-xs font-bold text-amber-600">🟡 Quedan {disponibles} cupos</span>;
    return <span className="text-xs font-bold text-emerald-600">🟢 {disponibles} cupos disponibles</span>;
  };

  const ciudadesSugeridas = Array.from(new Set([
    ...(ciudadesVisitadas || []),
    ...(usuario?.ciudad_base ? [usuario.ciudad_base] : []),
  ])).filter(Boolean);

  const ciudadesDelEstadoOpc = getCiudades(estadoSelectorOpc);
  const ciudadesDelEstadoModal = getCiudades(estadoSel);

  if (cargando) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando trabajos...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white pb-32">

      <div className="px-6 pt-12 pb-4 border-b border-gray-100">
        <div className="max-w-md mx-auto">

          <div className="flex items-center justify-between mb-5">
            <button onClick={() => setMostrarCambioRol(true)}
              className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1.5 hover:border-gray-300 transition">
              <span className="text-sm">⚡</span>
              <span className="text-slate-700 text-xs font-bold">Flekser</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            <button onClick={abrirNotifs}
              className="tour-notifs relative w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:border-gray-300 transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-slate-500">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
              </svg>
              {noLeidas > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border border-white">
                  {noLeidas > 9 ? '9+' : noLeidas}
                </span>
              )}
            </button>
          </div>

          <div className="mb-5">
            <p className="text-slate-400 text-sm">{getSaludo()}</p>
            <h1 className="text-2xl font-extrabold text-slate-800">
              {usuario?.nombre?.split(' ')[0] || 'Bienvenido'} <span className="text-blue-600">⚡</span>
            </h1>
          </div>

          <button
            onClick={() => { setEstadoSelectorOpc(usuario?.estado || ''); setCiudadSelectorOpc(''); setMostrarSelectorCiudad(true); }}
            className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-4 py-3 mb-3 hover:border-gray-300 transition group">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-sm flex-shrink-0">📍</span>
              <div className="text-left">
                <p className="text-slate-400 text-xs font-medium">Ubicación</p>
                <p className="text-slate-800 font-bold text-sm">{ciudadActiva || 'Selecciona tu ciudad'}</p>
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-300 group-hover:text-slate-400 transition"><path d="M9 18l6-6-6-6"/></svg>
          </button>

          {ciudadesSugeridas.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 mb-3 scrollbar-hide">
              {ciudadesSugeridas.map((c) => (
                <button key={c} onClick={() => setCiudadActiva(c)}
                  className={'flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border transition ' + (ciudadActiva === c ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-gray-200 hover:border-gray-300')}>
                  📍 {c}
                </button>
              ))}
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
            <p className="text-slate-400 text-xs font-semibold mb-1">
              {ciudadActiva ? 'Trabajos en ' + ciudadActiva : 'Trabajos disponibles'}
            </p>
            <div className="flex items-end gap-2">
              <p className="text-4xl font-extrabold text-slate-800">{trabajosFiltrados.length}</p>
              <p className="text-slate-400 text-sm mb-1">{filtrosActivos > 0 ? 'con tus filtros' : 'disponibles ahora'}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input type="text" placeholder="Buscar trabajos..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-gray-200 text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400 transition"/>
            </div>
            <button onClick={() => setMostrarFiltros(true)}
              className="relative w-12 h-12 bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-slate-500 hover:border-gray-300 transition flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/>
              </svg>
              {filtrosActivos > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {filtrosActivos}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {!usuario?.foto_url && (
        <div className="max-w-md mx-auto px-6 pt-4">
          <a href="/perfil" className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-4 hover:opacity-90 transition">
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <div className="flex-1">
              <p className="font-bold text-amber-800 text-sm">Completa tu perfil para conseguir trabajo</p>
              <p className="text-amber-700 text-xs mt-0.5">Sin foto tienes <span className="font-bold">90% menos chances</span> de ser contratado</p>
            </div>
            <span className="text-amber-600 font-bold text-sm flex-shrink-0">→</span>
          </a>
        </div>
      )}

      {mostrarBannerPush && (
        <div className="max-w-md mx-auto px-6 pt-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-blue-600"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-800 text-sm">Activa las notificaciones</p>
              <p className="text-xs text-slate-400 mt-0.5">Recibe avisos de nuevos trabajos al instante</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setMostrarBannerPush(false)} className="text-xs text-slate-400 font-semibold px-2 py-1">Ahora no</button>
              <button onClick={activarNotificaciones} className="text-xs bg-blue-600 text-white font-bold px-3 py-1.5 rounded-xl">Activar</button>
            </div>
          </div>
        </div>
      )}

      {mostrarBannerInstalar && (
        <div className="max-w-md mx-auto px-6 pt-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">⚡</span>
                </div>
                <div>
                  <p className="font-extrabold text-slate-800 text-sm">Instala Fleksi en tu celular</p>
                  <p className="text-slate-400 text-xs mt-0.5">Recibe notificaciones y accede más rápido</p>
                </div>
              </div>
              <button onClick={cerrarBannerInstalar} className="text-slate-300 hover:text-slate-500 font-bold text-lg leading-none ml-2">✕</button>
            </div>
            {esIOS ? (
              <div className="bg-gray-50 rounded-xl p-3 mb-3">
                <p className="text-slate-700 text-xs font-semibold mb-2">Cómo instalar en iPhone/iPad:</p>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-white border border-gray-200 rounded-full flex items-center justify-center text-slate-600 text-xs font-bold flex-shrink-0">1</span>
                    <p className="text-slate-500 text-xs">Toca el botón de compartir <span className="bg-gray-100 px-1 rounded">⬆️</span> en Safari</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-white border border-gray-200 rounded-full flex items-center justify-center text-slate-600 text-xs font-bold flex-shrink-0">2</span>
                    <p className="text-slate-500 text-xs">Selecciona <span className="font-bold text-slate-700">"Agregar a pantalla de inicio"</span></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-white border border-gray-200 rounded-full flex items-center justify-center text-slate-600 text-xs font-bold flex-shrink-0">3</span>
                    <p className="text-slate-500 text-xs">Toca <span className="font-bold text-slate-700">"Agregar"</span> y listo ✅</p>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={instalarPWA} disabled={instalando}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-extrabold text-sm hover:bg-blue-700 transition disabled:opacity-50 mb-2">
                {instalando ? 'Instalando...' : '📲 Instalar Fleksi gratis'}
              </button>
            )}
            <p className="text-slate-400 text-xs text-center">Sin App Store · Sin costo · 2 segundos</p>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto px-6 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {categorias.map((cat) => (
            <button key={cat} onClick={() => setCategoriaActiva(cat)}
              className={'px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition border ' + (categoriaActiva === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-gray-200 hover:border-gray-300')}>
              {cat}
            </button>
          ))}
        </div>

        {filtrosActivos > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {filtroFecha && (
              <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-semibold">
                📅 {filtroFecha}
                <button onClick={() => setFiltroFecha('')} className="ml-1 text-blue-400">✕</button>
              </span>
            )}
            {filtroUrgente && (
              <span className="flex items-center gap-1 text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-full font-semibold">
                🔴 Urgentes
                <button onClick={() => setFiltroUrgente(false)} className="ml-1 text-red-400">✕</button>
              </span>
            )}
            {filtroSeguro && (
              <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-semibold">
                🛡️ Con seguro
                <button onClick={() => setFiltroSeguro(false)} className="ml-1 text-blue-400">✕</button>
              </span>
            )}
            <button onClick={limpiarFiltros} className="text-xs text-slate-400 font-semibold px-3 py-1.5 rounded-full border border-gray-200">Limpiar todo</button>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <h2 className="font-extrabold text-slate-800">
            {ciudadActiva ? 'Trabajos en ' + ciudadActiva : 'Trabajos disponibles'}
          </h2>
          <span className="text-sm text-slate-400">{trabajosFiltrados.length} disponibles</span>
        </div>

        {trabajosFiltrados.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🔍</p>
            <p className="font-bold text-slate-800 mb-2">No hay trabajos disponibles</p>
            <p className="text-slate-400 text-sm mb-4">
              {ciudadActiva ? 'No hay trabajos en ' + ciudadActiva + ' en este momento'
                : filtrosActivos > 0 ? 'Prueba cambiando los filtros'
                : 'Vuelve más tarde para ver nuevas solicitudes'}
            </p>
            {filtrosActivos > 0 && (
              <button onClick={limpiarFiltros}
                className="px-6 py-3 bg-white border border-gray-200 text-slate-600 rounded-2xl font-bold text-sm hover:border-gray-300 transition">
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {trabajosFiltrados.map((trabajo) => {
              const cuposLabel = getCuposLabel(trabajo);
              return (
                <a href={'/trabajo?id=' + trabajo.id} key={trabajo.id} className="bg-white rounded-2xl p-4 border border-gray-200 hover:border-gray-300 active:scale-[0.99] transition block">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                      {categoriaEmoji[trabajo.categoria?.toLowerCase()] || '✨'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-slate-800 text-sm leading-tight">{trabajo.titulo}</h3>
                        {trabajo.urgente && <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">🔴 Urgente</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-slate-400">{trabajo.usuarios?.nombre || 'Cliente verificado'}</p>
                        {trabajo.usuarios?.ciudad && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">
                            📍 {trabajo.usuarios.ciudad}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <p className="text-xs text-slate-400">📅 {trabajo.fecha} {trabajo.hora?.slice(0,5)}</p>
                          {cuposLabel && <div className="mt-0.5">{cuposLabel}</div>}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400 font-semibold">💰 Tú propones</p>
                          <p className="text-xs text-slate-700 font-bold">tu precio</p>
                          <span className="mt-1 text-xs font-bold px-3 py-1 rounded-full inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white">Aplicar →</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL UBICACIÓN OBLIGATORIA ── */}
      {mostrarUbicacionObligatoria && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden border border-gray-200">
            <div className="px-6 pt-8 pb-6 text-center border-b border-gray-100">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl">📍</div>
              <h2 className="text-slate-800 font-extrabold text-xl">¿Dónde estás?</h2>
              <p className="text-slate-400 text-sm mt-1">Para mostrarte trabajos cerca de ti</p>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Estado</label>
                <select value={estadoSel} onChange={(e) => { setEstadoSel(e.target.value); setCiudadSel(''); }}
                  className="w-full p-4 rounded-2xl border border-gray-200 focus:border-blue-400 outline-none transition text-slate-800 bg-white">
                  <option value="">Selecciona...</option>
                  {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              {estadoSel && (
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Ciudad</label>
                  <select value={ciudadSel} onChange={(e) => setCiudadSel(e.target.value)}
                    className="w-full p-4 rounded-2xl border border-gray-200 focus:border-blue-400 outline-none transition text-slate-800 bg-white">
                    <option value="">Selecciona...</option>
                    {ciudadesDelEstadoModal.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
              <button onClick={guardarUbicacionObligatoria} disabled={guardandoUbicacion || !estadoSel || !ciudadSel}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold disabled:opacity-50 transition">
                {guardandoUbicacion ? 'Guardando...' : 'Confirmar ubicación ✓'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SELECTOR CIUDAD OPCIONAL ── */}
      {mostrarSelectorCiudad && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setMostrarSelectorCiudad(false)}>
          <div className="w-full bg-white rounded-t-3xl max-h-[85vh] flex flex-col border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-extrabold text-slate-800 text-lg">Cambiar ubicación</h3>
                <p className="text-slate-400 text-xs mt-0.5">Verás trabajos en la ciudad que elijas</p>
              </div>
              <button onClick={() => setMostrarSelectorCiudad(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-slate-500">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4 flex flex-col gap-5">
              <div>
                <label className="text-sm font-extrabold text-slate-800 mb-2 block">Estado</label>
                <select value={estadoSelectorOpc} onChange={(e) => { setEstadoSelectorOpc(e.target.value); setCiudadSelectorOpc(''); }}
                  className="w-full p-3 rounded-2xl border border-gray-200 focus:border-blue-400 outline-none text-slate-800 text-sm bg-white">
                  <option value="">Selecciona...</option>
                  {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              {estadoSelectorOpc && (
                <div>
                  <label className="text-sm font-extrabold text-slate-800 mb-2 block">Ciudad</label>
                  <select value={ciudadSelectorOpc} onChange={(e) => setCiudadSelectorOpc(e.target.value)}
                    className="w-full p-3 rounded-2xl border border-gray-200 focus:border-blue-400 outline-none text-slate-800 text-sm bg-white">
                    <option value="">Selecciona...</option>
                    {ciudadesDelEstadoOpc.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
              <button onClick={aplicarCiudadOpcional} disabled={guardandoCiudad || !estadoSelectorOpc || !ciudadSelectorOpc}
                className="w-full py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm disabled:opacity-50 hover:bg-blue-700 transition">
                {guardandoCiudad ? 'Guardando...' : 'Aplicar ubicación'}
              </button>
              {ciudadesSugeridas.length > 0 && (
                <div>
                  <p className="text-sm font-extrabold text-slate-800 mb-3">📍 Tus ciudades guardadas</p>
                  <div className="flex flex-col gap-2">
                    {ciudadesSugeridas.map((c) => (
                      <button key={c} onClick={() => { setCiudadActiva(c); setMostrarSelectorCiudad(false); }}
                        className={'flex items-center gap-4 p-4 rounded-2xl border transition ' + (ciudadActiva === c ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300')}>
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">📍</div>
                        <div className="flex-1 text-left">
                          <p className="font-bold text-slate-800">{c}</p>
                          {c === (usuario?.ciudad_base || usuario?.ciudad) && <p className="text-xs text-slate-400 mt-0.5">Tu ciudad base</p>}
                        </div>
                        {ciudadActiva === c && <span className="text-blue-600 text-xs font-bold bg-blue-50 px-2 py-1 rounded-full">Activo</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="pb-6"/>
          </div>
        </div>
      )}

      {mostrarFiltros && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setMostrarFiltros(false)}>
          <div className="w-full bg-white rounded-t-3xl max-h-[85vh] flex flex-col border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-extrabold text-slate-800 text-lg">Filtros</h3>
                {filtrosActivos > 0 && <p className="text-xs text-blue-600 font-semibold">{filtrosActivos} filtro{filtrosActivos !== 1 ? 's' : ''} activo{filtrosActivos !== 1 ? 's' : ''}</p>}
              </div>
              <div className="flex items-center gap-3">
                {filtrosActivos > 0 && <button onClick={limpiarFiltros} className="text-sm text-red-500 font-semibold">Limpiar</button>}
                <button onClick={() => setMostrarFiltros(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-slate-500">✕</button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4 flex flex-col gap-5">
              <div>
                <label className="text-sm font-extrabold text-slate-800 mb-2 block">📅 Fecha</label>
                <input type="date" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} className="w-full p-3 rounded-2xl border border-gray-200 focus:border-blue-400 outline-none text-slate-800 text-sm"/>
                <div className="flex gap-2 mt-2">
                  {[['Hoy', new Date().toISOString().split('T')[0]], ['Mañana', new Date(Date.now()+86400000).toISOString().split('T')[0]]].map(([label,val],i) => (
                    <button key={i} onClick={() => setFiltroFecha(val)}
                      className={'text-xs px-3 py-1.5 rounded-full font-semibold transition border ' + (filtroFecha===val ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 text-slate-500')}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-extrabold text-slate-800 mb-2 block">🏷️ Categoría</label>
                <div className="flex flex-wrap gap-2">
                  {categorias.map((cat) => (
                    <button key={cat} onClick={() => setCategoriaActiva(cat)}
                      className={'text-xs px-3 py-1.5 rounded-full font-semibold transition border ' + (categoriaActiva===cat ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 text-slate-500')}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div onClick={() => setFiltroUrgente(!filtroUrgente)} className={'flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition ' + (filtroUrgente ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white')}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🔴</span>
                    <div><p className="font-semibold text-slate-800 text-sm">Solo urgentes</p><p className="text-xs text-slate-400">Trabajos marcados como urgentes</p></div>
                  </div>
                  <div className={'w-11 h-6 rounded-full transition-all ' + (filtroUrgente ? 'bg-red-500' : 'bg-gray-200')}>
                    <div className={'w-5 h-5 bg-white rounded-full shadow mt-0.5 transition-all ' + (filtroUrgente ? 'translate-x-5 ml-0.5' : 'translate-x-0.5')}/>
                  </div>
                </div>
                <div onClick={() => setFiltroSeguro(!filtroSeguro)} className={'flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition ' + (filtroSeguro ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white')}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🛡️</span>
                    <div><p className="font-semibold text-slate-800 text-sm">Con Fleksi Protege</p><p className="text-xs text-slate-400">Trabajos con seguro incluido</p></div>
                  </div>
                  <div className={'w-11 h-6 rounded-full transition-all ' + (filtroSeguro ? 'bg-blue-500' : 'bg-gray-200')}>
                    <div className={'w-5 h-5 bg-white rounded-full shadow mt-0.5 transition-all ' + (filtroSeguro ? 'translate-x-5 ml-0.5' : 'translate-x-0.5')}/>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              <button onClick={() => setMostrarFiltros(false)} className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-extrabold text-lg hover:opacity-90 transition">
                Ver {trabajosFiltrados.length} trabajo{trabajosFiltrados.length !== 1 ? 's' : ''}
              </button>
            </div>
            <div className="pb-6"/>
          </div>
        </div>
      )}

      {mostrarNotifs && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setMostrarNotifs(false)}>
          <div className="w-full bg-white rounded-t-3xl max-h-[80vh] flex flex-col border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-slate-800 text-lg">Notificaciones</h3>
              <button onClick={() => setMostrarNotifs(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-slate-500">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-3">
              {notificaciones.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">🔔</p>
                  <p className="font-bold text-slate-800 mb-1">Sin notificaciones</p>
                  <p className="text-slate-400 text-sm">Aquí verás tus actualizaciones</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {notificaciones.map((n) => (
                    <button key={n.id}
                      onClick={() => {
                        if (n.tipo === 'admin_mensaje') {
                          setNotifModalAbierta(n);
                          supabase.from('notificaciones').update({ leida: true }).eq('id', n.id).then(() => {
                            setNotificaciones(prev => prev.map(x => x.id === n.id ? { ...x, leida: true } : x));
                            setNoLeidas(prev => Math.max(0, prev - 1));
                          });
                        } else if (n.link && n.link !== '/notificaciones') {
                          setMostrarNotifs(false);
                          window.location.href = n.link;
                        }
                      }}
                      className={'flex items-start gap-3 p-3 rounded-2xl transition text-left w-full border ' + (!n.leida ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-100')}>
                      <span className="text-2xl flex-shrink-0 mt-0.5">{notifEmoji[n.tipo] || '🔔'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm">{n.titulo}</p>
                        {n.mensaje && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.mensaje}</p>}
                        <p className="text-xs text-slate-300 mt-1">{new Date(n.created_at).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      {!n.leida && <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"/>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="pb-8"/>
          </div>
        </div>
      )}

      {notifModalAbierta && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-6" onClick={() => setNotifModalAbierta(null)}>
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-8 pb-6 border-b border-gray-100">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📢</span>
              </div>
              <h3 className="text-slate-800 font-extrabold text-lg text-center">{notifModalAbierta.titulo}</h3>
            </div>
            <div className="px-6 py-5">
              <p className="text-slate-600 text-sm leading-relaxed mb-4">{notifModalAbierta.mensaje}</p>
              <p className="text-xs text-slate-400 mb-5">{new Date(notifModalAbierta.created_at).toLocaleString('es-MX', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
              <button onClick={() => setNotifModalAbierta(null)}
                className="w-full py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition">
                Entendido ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarCambioRol && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setMostrarCambioRol(false)}>
          <div className="w-full bg-white rounded-t-3xl p-6 pb-10 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6"/>
            <h3 className="font-extrabold text-slate-800 text-lg mb-1 text-center">Cambiar modo</h3>
            <p className="text-slate-400 text-sm text-center mb-5">Alterna entre tus perfiles sin cerrar sesión</p>
            <div className="flex flex-col gap-3 mb-4">
              {(['flekser','empresa'] as string[]).map((r) => {
                const info = rolInfo[r];
                const esActivo = r === 'flekser';
                return (
                  <button key={r} onClick={() => cambiarRol(r)} disabled={cambiandoRol || esActivo}
                    className={'flex items-center gap-4 p-4 rounded-2xl border transition ' + (esActivo ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300')}>
                    <div className={'w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ' + (esActivo ? 'bg-blue-100' : 'bg-gray-100')}>{info.emoji}</div>
                    <div className="flex-1 text-left">
                      <p className="font-extrabold text-slate-800">Modo {info.label}</p>
                      <p className="text-xs mt-0.5 text-slate-400">
                        {r === 'flekser' ? 'Busca y ofrece servicios' : 'Gestiona tus solicitudes'}
                      </p>
                    </div>
                    {esActivo
                      ? <span className="text-blue-600 text-xs font-bold bg-blue-100 px-2 py-1 rounded-full">Activo</span>
                      : <span className="text-slate-400 text-xs font-bold">Cambiar →</span>
                    }
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 text-center">Al activar un nuevo modo se agrega permanentemente a tu cuenta</p>
          </div>
        </div>
      )}

      <TourInicial rol={usuario?.rol_activo || usuario?.rol || 'flekser'} />
      <Nav activo="inicio" />
    </main>
  );
}