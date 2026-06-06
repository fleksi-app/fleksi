'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Nav from '@/lib/nav';
import { calcularPagoFlekser } from '@/lib/comisiones';
import TourInicial from '@/components/TourInicial';

const categorias = ['Todos', 'Hogar', 'Limpieza', 'Eventos', 'Mudanza', 'Ejecutivo', 'Cocina', 'Jardinería', 'Mecánica', 'Cerrajería', 'Estética', 'Otro'];

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
  const [modoViajero, setModoViajero] = useState(false);
  const [cambiandoViajero, setCambiandoViajero] = useState(false);

  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroCiudad, setFiltroCiudad] = useState('');
  const [filtroPresupuestoMin, setFiltroPresupuestoMin] = useState('');
  const [filtroPresupuestoMax, setFiltroPresupuestoMax] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroUrgente, setFiltroUrgente] = useState(false);
  const [filtroSeguro, setFiltroSeguro] = useState(false);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    const { data: perfil } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
    setUsuario(perfil);
    setRoles(perfil?.roles || [perfil?.rol || 'flekser']);
    setModoViajero(perfil?.modo_viajero || false);
    const { data: servicios } = await supabase.from('servicios')
      .select('*, usuarios!cliente_id(nombre, calificacion, ciudad)')
      .eq('estado', 'activo').neq('cliente_id', user.id)
      .order('created_at', { ascending: false });
    setTrabajos(servicios || []);
    const { data: apps } = await supabase.from('aplicaciones').select('servicio_id, estado').eq('prestador_id', user.id);
    setAplicacionesUsuario((apps || []).map(a => a.servicio_id));
    setTrabajosCompletados((apps || []).filter(a => a.estado === 'completado').map(a => a.servicio_id));
    setAplicacionesRechazadas((apps || []).filter(a => a.estado === 'rechazado').map(a => a.servicio_id));
    const { data: notifs } = await supabase.from('notificaciones').select('*').eq('usuario_id', user.id).order('created_at', { ascending: false }).limit(20);
    setNotificaciones(notifs || []);
    setNoLeidas((notifs || []).filter(n => !n.leida).length);
    setCargando(false);

    // ── FIX PUSH: registrar suscripción sin importar si el permiso ya estaba dado ──
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

  const toggleModoViajero = async () => {
    if (!usuario || cambiandoViajero) return;
    setCambiandoViajero(true);
    const nuevoModo = !modoViajero;
    await supabase.from('usuarios').update({ modo_viajero: nuevoModo }).eq('id', usuario.id);
    setModoViajero(nuevoModo);
    setCambiandoViajero(false);
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
    await supabase.from('usuarios').update({
      rol_activo: nuevoRol,
      roles: rolesActuales,
      ...(nuevoRol === 'empresa' && { modo_viajero: false }),
    }).eq('id', usuario.id);
    setMostrarCambioRol(false);
    if (nuevoRol === 'empresa') window.location.href = '/home-empresa';
    setCambiandoRol(false);
  };

  const limpiarFiltros = () => {
    setFiltroCiudad(''); setFiltroPresupuestoMin(''); setFiltroPresupuestoMax('');
    setFiltroFecha(''); setFiltroUrgente(false); setFiltroSeguro(false);
    setCategoriaActiva('Todos');
  };

  const filtrosActivos = [filtroCiudad, filtroPresupuestoMin, filtroPresupuestoMax, filtroFecha, filtroUrgente, filtroSeguro, categoriaActiva !== 'Todos'].filter(Boolean).length;

  const categoriaEmoji: any = {
    hogar: '🔧', limpieza: '🧹', eventos: '🍽️', mudanza: '🚚', ejecutivo: '🚗',
    interprete: '🗣️', cocina: '🍳', jardineria: '🌿', mecanica: '🔩',
    cerrajeria: '🔑', estetica: '💅', otro: '✨'
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
      const matchCiudad = !filtroCiudad || t.usuarios?.ciudad?.toLowerCase().includes(filtroCiudad.toLowerCase()) || t.direccion?.toLowerCase().includes(filtroCiudad.toLowerCase());
      const matchMin = !filtroPresupuestoMin || t.presupuesto >= Number(filtroPresupuestoMin);
      const matchMax = !filtroPresupuestoMax || t.presupuesto <= Number(filtroPresupuestoMax);
      const matchFecha = !filtroFecha || t.fecha === filtroFecha;
      const matchUrgente = !filtroUrgente || t.urgente === true;
      const matchSeguro = !filtroSeguro || t.seguro === true;
      return matchCat && matchBusqueda && matchCiudad && matchMin && matchMax && matchFecha && matchUrgente && matchSeguro;
    });

  const notifEmoji: any = { nueva_aplicacion: '✋', aplicacion_aceptada: '✅', aplicacion_rechazada: '❌', trabajo_completado: '🎉', nuevo_trabajo: '🔔', pago_liberado: '💰', mensaje_nuevo: '💬' };
  const rolInfo: any = {
    flekser: { emoji: '⚡', label: 'Flekser', color: 'from-blue-600 to-purple-600' },
    empresa: { emoji: '🏢', label: 'Empresa', color: 'from-slate-700 to-blue-900' },
  };

  const getCuposLabel = (trabajo: any) => {
    if (!trabajo.cupos || trabajo.cupos <= 1) return null;
    const disponibles = trabajo.cupos - (trabajo.cupos_tomados || 0);
    if (disponibles <= 1) return <span className="text-xs font-bold text-red-500">🔥 ¡Solo queda {disponibles} cupo!</span>;
    if (disponibles <= 3) return <span className="text-xs font-bold text-amber-500">🟡 Quedan {disponibles} cupos</span>;
    return <span className="text-xs font-bold text-green-500">🟢 {disponibles} cupos disponibles</span>;
  };

  const headerGradient = modoViajero
    ? 'from-sky-500 via-teal-500 to-emerald-600'
    : 'from-blue-600 via-purple-600 to-purple-700';
  const categoriaActivaBg = modoViajero ? 'from-sky-500 to-teal-500' : 'from-blue-600 to-purple-600';
  const aplicarBg = modoViajero ? 'from-sky-500 to-teal-500' : 'from-blue-600 to-purple-600';

  if (cargando) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando trabajos...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-32">

      <div className={`bg-gradient-to-br ${headerGradient} px-6 pt-12 pb-8 relative overflow-hidden transition-all duration-500`}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-10 translate-x-10"/>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-6"/>
        <div className="max-w-md mx-auto relative">

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setMostrarCambioRol(true)}
                className="flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-3 py-1.5 hover:bg-white/25 transition">
                <span className="text-sm">⚡</span>
                <span className="text-white text-xs font-extrabold">Flekser</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>
              </button>

              <button
                onClick={toggleModoViajero}
                disabled={cambiandoViajero}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition text-xs font-bold ${
                  modoViajero
                    ? 'bg-white text-teal-600 border-white'
                    : 'bg-white/15 border-white/25 text-white hover:bg-white/25'
                }`}>
                ✈️ {modoViajero ? 'Viajero ON' : 'Viajero'}
              </button>
            </div>

            <button onClick={abrirNotifs}
              className="tour-notifs relative w-9 h-9 bg-white/15 border border-white/25 rounded-full flex items-center justify-center hover:bg-white/25 transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
              </svg>
              {noLeidas > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-extrabold rounded-full flex items-center justify-center border border-white">
                  {noLeidas > 9 ? '9+' : noLeidas}
                </span>
              )}
            </button>
          </div>

          <div className="mb-4">
            <p className="text-white/70 text-sm">{getSaludo()}</p>
            <h1 className="text-2xl font-extrabold text-white">
              {usuario?.nombre?.split(' ')[0] || 'Bienvenido'} {modoViajero ? '✈️' : '⚡'}
            </h1>
            {modoViajero && (
              <p className="text-white/70 text-xs mt-1 font-semibold">🌍 Modo viajero activo — ves trabajos de todo el país</p>
            )}
          </div>

          <div className="bg-white/15 backdrop-blur rounded-2xl p-4 mb-4 border border-white/20">
            <p className="text-white/70 text-xs font-semibold mb-1">
              {modoViajero ? '✈️ Trabajos en todo el país' : '⚡ Trabajos disponibles ahora'}
            </p>
            <div className="flex items-end gap-2">
              <p className="text-4xl font-extrabold text-white">{trabajosFiltrados.length}</p>
              <p className="text-white/60 text-sm mb-1">{filtrosActivos > 0 ? 'con tus filtros' : modoViajero ? 'en México' : 'cerca de ti'}</p>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
              <span className="text-white/60 text-xs">En tiempo real</span>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">🔍</span>
              <input type="text" placeholder="Buscar trabajos..."
                value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/15 border border-white/25 text-white placeholder-white/50 outline-none focus:bg-white/25 transition"/>
            </div>
            <button onClick={() => setMostrarFiltros(true)}
              className="relative w-12 h-12 bg-white/15 border border-white/25 rounded-2xl flex items-center justify-center text-white hover:bg-white/25 transition flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/>
              </svg>
              {filtrosActivos > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-extrabold rounded-full flex items-center justify-center border-2 border-white">
                  {filtrosActivos}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {!usuario?.foto_url && (
        <div className="max-w-md mx-auto px-6 pt-4">
          <a href="/perfil" className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 hover:opacity-90 transition">
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
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-purple-100 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-sm">Activa las notificaciones</p>
              <p className="text-xs text-gray-500 mt-0.5">Recibe avisos de nuevos trabajos</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setMostrarBannerPush(false)} className="text-xs text-gray-400 font-semibold px-2 py-1">Ahora no</button>
              <button onClick={activarNotificaciones} className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold px-3 py-1.5 rounded-xl">Activar</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto px-6 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {categorias.map((cat) => (
            <button key={cat} onClick={() => setCategoriaActiva(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${categoriaActiva === cat ? `bg-gradient-to-r ${categoriaActivaBg} text-white shadow-md` : 'bg-white text-gray-500 border-2 border-gray-200'}`}>
              {cat}
            </button>
          ))}
        </div>

        {filtrosActivos > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {filtroCiudad && <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full font-semibold">📍 {filtroCiudad}<button onClick={() => setFiltroCiudad('')} className="ml-1 text-purple-400">✕</button></span>}
            {(filtroPresupuestoMin || filtroPresupuestoMax) && <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full font-semibold">💰 ${filtroPresupuestoMin || '0'}-${filtroPresupuestoMax || '∞'}<button onClick={() => { setFiltroPresupuestoMin(''); setFiltroPresupuestoMax(''); }} className="ml-1 text-purple-400">✕</button></span>}
            {filtroFecha && <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full font-semibold">📅 {filtroFecha}<button onClick={() => setFiltroFecha('')} className="ml-1 text-purple-400">✕</button></span>}
            {filtroUrgente && <span className="flex items-center gap-1 text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-full font-semibold">🔴 Urgentes<button onClick={() => setFiltroUrgente(false)} className="ml-1 text-red-400">✕</button></span>}
            {filtroSeguro && <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full font-semibold">🛡️ Con seguro<button onClick={() => setFiltroSeguro(false)} className="ml-1 text-blue-400">✕</button></span>}
            <button onClick={limpiarFiltros} className="text-xs text-gray-400 font-semibold px-3 py-1.5 rounded-full border border-gray-200">Limpiar todo</button>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <h2 className="font-extrabold text-gray-900">
            {modoViajero ? '🌍 Trabajos en todo el país' : 'Trabajos cerca de ti'}
          </h2>
          <span className="text-sm text-gray-400">{trabajosFiltrados.length} disponibles</span>
        </div>

        {trabajosFiltrados.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🔍</p>
            <p className="font-bold text-gray-900 mb-2">No hay trabajos disponibles</p>
            <p className="text-gray-400 text-sm mb-4">
              {filtrosActivos > 0 ? 'Prueba cambiando los filtros' : 'Vuelve más tarde para ver nuevas solicitudes'}
            </p>
            {filtrosActivos > 0 && <button onClick={limpiarFiltros} className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-sm">Limpiar filtros</button>}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {trabajosFiltrados.map((trabajo) => {
              const ganancia = calcularPagoFlekser(trabajo.presupuesto);
              const cuposLabel = getCuposLabel(trabajo);
              return (
                <a href={`/trabajo?id=${trabajo.id}`} key={trabajo.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-95 transition block">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                      {categoriaEmoji[trabajo.categoria?.toLowerCase()] || '✨'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-gray-900 text-sm leading-tight">{trabajo.titulo}</h3>
                        {trabajo.urgente && <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">🔴 Urgente</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-400">{trabajo.usuarios?.nombre || 'Cliente verificado'}</p>
                        {trabajo.usuarios?.ciudad && <span className="text-xs bg-purple-50 text-purple-500 px-1.5 py-0.5 rounded-full font-semibold">📍 {trabajo.usuarios.ciudad}</span>}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <p className="text-xs text-gray-400">📅 {trabajo.fecha} {trabajo.hora?.slice(0,5)}</p>
                          {cuposLabel && <div className="mt-0.5">{cuposLabel}</div>}
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-green-600 text-sm">${ganancia.total} MXN</p>
                          <span className={`mt-1 text-xs font-bold px-3 py-1 rounded-full inline-block bg-gradient-to-r ${aplicarBg} text-white`}>
                            Aplicar
                          </span>
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

      {mostrarFiltros && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setMostrarFiltros(false)}>
          <div className="w-full bg-white rounded-t-3xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-extrabold text-gray-900 text-lg">Filtros</h3>
                {filtrosActivos > 0 && <p className="text-xs text-purple-600 font-semibold">{filtrosActivos} filtro{filtrosActivos !== 1 ? 's' : ''} activo{filtrosActivos !== 1 ? 's' : ''}</p>}
              </div>
              <div className="flex items-center gap-3">
                {filtrosActivos > 0 && <button onClick={limpiarFiltros} className="text-sm text-red-500 font-semibold">Limpiar</button>}
                <button onClick={() => setMostrarFiltros(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">✕</button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4 flex flex-col gap-5">
              <div>
                <label className="text-sm font-extrabold text-gray-900 mb-2 block">📍 Ciudad</label>
                <input type="text" placeholder="Ej. Guadalajara, Monterrey, CDMX..." value={filtroCiudad} onChange={(e) => setFiltroCiudad(e.target.value)}
                  className="w-full p-3 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none text-gray-900 text-sm"/>
              </div>
              <div>
                <label className="text-sm font-extrabold text-gray-900 mb-2 block">💰 Ganancia estimada (MXN)</label>
                <div className="flex gap-3">
                  <input type="number" placeholder="Mínimo" value={filtroPresupuestoMin} onChange={(e) => setFiltroPresupuestoMin(e.target.value)} className="flex-1 p-3 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none text-gray-900 text-sm"/>
                  <div className="flex items-center text-gray-400 font-bold">—</div>
                  <input type="number" placeholder="Máximo" value={filtroPresupuestoMax} onChange={(e) => setFiltroPresupuestoMax(e.target.value)} className="flex-1 p-3 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none text-gray-900 text-sm"/>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[['0','500'],['500','1000'],['1000','3000'],['3000','']].map(([min,max],i) => (
                    <button key={i} onClick={() => { setFiltroPresupuestoMin(min); setFiltroPresupuestoMax(max); }}
                      className={`text-xs px-3 py-1.5 rounded-full font-semibold transition border-2 ${filtroPresupuestoMin===min&&filtroPresupuestoMax===max ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500'}`}>
                      {max ? `$${min}-$${max}` : `$${min}+`}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-extrabold text-gray-900 mb-2 block">📅 Fecha</label>
                <input type="date" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} className="w-full p-3 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none text-gray-900 text-sm"/>
                <div className="flex gap-2 mt-2">
                  {[['Hoy', new Date().toISOString().split('T')[0]], ['Mañana', new Date(Date.now()+86400000).toISOString().split('T')[0]]].map(([label,val],i) => (
                    <button key={i} onClick={() => setFiltroFecha(val)}
                      className={`text-xs px-3 py-1.5 rounded-full font-semibold transition border-2 ${filtroFecha===val ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-extrabold text-gray-900 mb-2 block">🏷️ Categoría</label>
                <div className="flex flex-wrap gap-2">
                  {categorias.map((cat) => (
                    <button key={cat} onClick={() => setCategoriaActiva(cat)}
                      className={`text-xs px-3 py-1.5 rounded-full font-semibold transition border-2 ${categoriaActiva===cat ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div onClick={() => setFiltroUrgente(!filtroUrgente)} className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition ${filtroUrgente ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🔴</span>
                    <div><p className="font-semibold text-gray-900 text-sm">Solo urgentes</p><p className="text-xs text-gray-400">Trabajos marcados como urgentes</p></div>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-all ${filtroUrgente ? 'bg-red-500' : 'bg-gray-200'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow mt-0.5 transition-all ${filtroUrgente ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`}/>
                  </div>
                </div>
                <div onClick={() => setFiltroSeguro(!filtroSeguro)} className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition ${filtroSeguro ? 'border-purple-300 bg-purple-50' : 'border-gray-200 bg-white'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🛡️</span>
                    <div><p className="font-semibold text-gray-900 text-sm">Con Fleksi Protege</p><p className="text-xs text-gray-400">Trabajos con seguro incluido</p></div>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-all ${filtroSeguro ? 'bg-purple-500' : 'bg-gray-200'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow mt-0.5 transition-all ${filtroSeguro ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`}/>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              <button onClick={() => setMostrarFiltros(false)} className={`w-full py-4 bg-gradient-to-r ${categoriaActivaBg} text-white rounded-2xl font-extrabold text-lg shadow-lg hover:opacity-90 transition`}>
                Ver {trabajosFiltrados.length} trabajo{trabajosFiltrados.length !== 1 ? 's' : ''}
              </button>
            </div>
            <div className="pb-6"/>
          </div>
        </div>
      )}

      {mostrarNotifs && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setMostrarNotifs(false)}>
          <div className="w-full bg-white rounded-t-3xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-lg">Notificaciones</h3>
              <button onClick={() => setMostrarNotifs(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-3">
              {notificaciones.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">🔔</p>
                  <p className="font-bold text-gray-900 mb-1">Sin notificaciones</p>
                  <p className="text-gray-400 text-sm">Aquí verás tus actualizaciones</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {notificaciones.map((n) => (
                    <a key={n.id} href={n.link || '#'} onClick={() => setMostrarNotifs(false)}
                      className={`flex items-start gap-3 p-3 rounded-2xl transition ${!n.leida ? 'bg-purple-50 border border-purple-100' : 'bg-gray-50'}`}>
                      <span className="text-2xl flex-shrink-0 mt-0.5">{notifEmoji[n.tipo] || '🔔'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm">{n.titulo}</p>
                        {n.mensaje && <p className="text-xs text-gray-500 mt-0.5">{n.mensaje}</p>}
                        <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      {!n.leida && <div className="w-2 h-2 bg-purple-600 rounded-full flex-shrink-0 mt-2"/>}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <div className="pb-8"/>
          </div>
        </div>
      )}

      {mostrarCambioRol && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setMostrarCambioRol(false)}>
          <div className="w-full bg-white rounded-t-3xl p-6 pb-10" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6"/>
            <h3 className="font-extrabold text-gray-900 text-lg mb-1 text-center">Cambiar modo</h3>
            <p className="text-gray-400 text-sm text-center mb-5">Alterna entre tus perfiles sin cerrar sesión</p>
            <div className="flex flex-col gap-3 mb-4">
              {(['flekser','empresa'] as string[]).map((r) => {
                const info = rolInfo[r];
                const esActivo = r === 'flekser';
                return (
                  <button key={r} onClick={() => cambiarRol(r)} disabled={cambiandoRol || esActivo}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition ${esActivo ? 'border-transparent bg-gradient-to-r ' + info.color + ' text-white' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${esActivo ? 'bg-white/20' : 'bg-gray-100'}`}>{info.emoji}</div>
                    <div className="flex-1 text-left">
                      <p className={`font-extrabold ${esActivo ? 'text-white' : 'text-gray-900'}`}>Modo {info.label}</p>
                      <p className={`text-xs mt-0.5 ${esActivo ? 'text-white/70' : 'text-gray-400'}`}>
                        {r === 'flekser' ? 'Busca y ofrece servicios' : 'Gestiona tus solicitudes'}
                      </p>
                    </div>
                    {esActivo ? <span className="text-white/80 text-xs font-bold bg-white/20 px-2 py-1 rounded-full">Activo</span> : <span className="text-gray-400 text-xs font-bold">Cambiar →</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <TourInicial rol={usuario?.rol_activo || usuario?.rol || 'flekser'} />
      <Nav activo="inicio" />
    </main>
  );
}