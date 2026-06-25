'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Nav from '@/lib/nav';
import TourInicial from '@/components/TourInicial';

const MORADO = '#7B2FE0';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export default function HomeEmpresa() {
  const [usuario, setUsuario] = useState<any>(null);
  const [servicios, setServicios] = useState<any[]>([]);
  const [stats, setStats] = useState({ activos: 0, completados: 0, prestadores: 0, gasto: 0 });
  const [cargando, setCargando] = useState(true);
  const [mostrarNotifs, setMostrarNotifs] = useState(false);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [mostrarCambioRol, setMostrarCambioRol] = useState(false);
  const [mostrarBannerPush, setMostrarBannerPush] = useState(false);
  const [mostrarBannerAyuda, setMostrarBannerAyuda] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [cambiandoRol, setCambiandoRol] = useState(false);
  const [busquedaCiudad, setBusquedaCiudad] = useState('');
  const [ciudadFiltro, setCiudadFiltro] = useState('');
  const [notifModalAbierta, setNotifModalAbierta] = useState<any>(null);
  const [mostrarMenu, setMostrarMenu] = useState(false);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    const { data: perfil } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
    setUsuario(perfil);
    const yaVioAyuda = localStorage.getItem('fleksi_ayuda_vista_' + user.id);
    if (!yaVioAyuda) setMostrarBannerAyuda(true);
    if ('Notification' in window && Notification.permission === 'default') setMostrarBannerPush(true);
    setRoles(perfil?.roles || [perfil?.rol || 'empresa']);
    const { data: serviciosData } = await supabase
      .from('servicios')
      .select('*, aplicaciones(id, estado, precio_ofrecido, prestador_id, usuarios!aplicaciones_prestador_id_fkey(nombre, foto_url, calificacion))')
      .eq('cliente_id', user.id).order('created_at', { ascending: false });
    setServicios(serviciosData || []);
    const todos = serviciosData || [];
    const activos = todos.filter(s => ['publicado','en_proceso','activo'].includes(s.estado)).length;
    const completados = todos.filter(s => s.estado === 'completado' || s.estado === 'pagado').length;
    const prestadoresSet = new Set(todos.flatMap(s => (s.aplicaciones||[]).filter((a:any)=>a.estado==='aceptado'||a.estado==='completado').map((a:any)=>a.prestador_id)));
    const gasto = todos.filter(s=>s.estado==='completado'||s.estado==='pagado').reduce((acc:number,s:any)=>acc+(s.presupuesto||0),0);
    setStats({ activos, completados, prestadores: prestadoresSet.size, gasto });
    const { data: notifs } = await supabase.from('notificaciones').select('*').eq('usuario_id', user.id).order('created_at', { ascending: false }).limit(20);
    setNotificaciones(notifs || []);
    setNoLeidas((notifs || []).filter(n => !n.leida).length);
    setCargando(false);
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) });
          await fetch('/api/push', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuario_id: user.id, subscription: subscription.toJSON() }) });
        }
      } catch (e) {}
    }
  };

  const abrirNotifs = async () => {
    setMostrarNotifs(true);
    if (!usuario) return;
    await supabase.from('notificaciones').update({ leida: true }).eq('usuario_id', usuario.id).eq('leida', false);
    setNoLeidas(0);
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
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

  const cambiarRol = async (nuevoRol: string) => {
    if (!usuario || cambiandoRol) return;
    setCambiandoRol(true);
    const rolesActuales = roles.includes(nuevoRol) ? roles : [...roles, nuevoRol];
    await supabase.from('usuarios').update({ rol_activo: nuevoRol, roles: rolesActuales }).eq('id', usuario.id);
    setMostrarCambioRol(false);
    if (nuevoRol === 'flekser') window.location.href = '/home';
    setCambiandoRol(false);
  };

  const estadoColor = (estado: string) => ({ activo:'bg-blue-100 text-blue-700', publicado:'bg-blue-100 text-blue-700', en_proceso:'bg-amber-100 text-amber-700', completado:'bg-emerald-100 text-emerald-700', pagado:'bg-emerald-100 text-emerald-700', cancelado:'bg-red-100 text-red-700', vencido:'bg-gray-200 text-gray-600' }[estado] || 'bg-gray-100 text-gray-600');
  const estadoLabel = (estado: string) => ({ activo:'● Activo', publicado:'● Publicado', en_proceso:'↻ En proceso', completado:'✓ Completado', pagado:'✓ Pagado', cancelado:'✕ Cancelado', vencido:'⏰ Vencido' }[estado] || estado);
  const notifEmoji: any = { nueva_aplicacion:'✋', aplicacion_aceptada:'✅', aplicacion_rechazada:'❌', trabajo_completado:'🎉', nuevo_trabajo:'🔔', pago_liberado:'💰', mensaje_nuevo:'💬' };

  const getCuposLabel = (servicio: any) => {
    if (!servicio.cupos || servicio.cupos <= 1) return null;
    const disponibles = servicio.cupos - (servicio.cupos_tomados || 0);
    if (disponibles <= 1) return <span className="text-xs font-bold text-red-500">🔥 ¡Solo queda {disponibles} cupo!</span>;
    if (disponibles <= 3) return <span className="text-xs font-bold text-amber-500">🟡 {disponibles} cupos disponibles</span>;
    return <span className="text-xs font-bold text-green-500">🟢 {disponibles} cupos disponibles</span>;
  };

  const serviciosFiltrados = servicios.filter(s => {
    if (!ciudadFiltro.trim()) return true;
    return s.direccion?.toLowerCase().includes(ciudadFiltro.toLowerCase()) || s.ciudad?.toLowerCase().includes(ciudadFiltro.toLowerCase());
  });

  if (cargando) return (
    <main className="min-h-screen flex items-center justify-center" style={{background: '#F8FAFC'}}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{borderColor: MORADO, borderTopColor: 'transparent'}}/>
        <p className="text-gray-400">Cargando panel...</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen pb-32" style={{background: '#F8FAFC'}}>

      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-4 shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button onClick={() => setMostrarMenu(true)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-50 transition">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <div className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 512 512"><rect width="512" height="512" rx="110" fill="#F8FAFC"/><rect x="112" y="140" width="288" height="72" rx="36" fill={MORADO}/><rect x="112" y="244" width="220" height="72" rx="36" fill={MORADO}/><rect x="112" y="348" width="152" height="72" rx="36" fill={MORADO}/></svg>
            <span className="font-extrabold text-xl" style={{color: '#1A1A2E', letterSpacing: '-0.5px'}}>fleksi</span>
          </div>
          <button onClick={abrirNotifs} className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-50 transition">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
            {noLeidas > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-extrabold rounded-full flex items-center justify-center border border-white" style={{fontSize: '9px'}}>{noLeidas > 9 ? '9+' : noLeidas}</span>}
          </button>
        </div>
        <div className="max-w-md mx-auto mt-4 mb-3">
          <p className="text-gray-400 text-sm">Panel empresarial</p>
          <h1 className="text-2xl font-extrabold" style={{color: '#1A1A2E'}}>{usuario?.nombre} 🏢</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-4">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { valor: stats.activos, label: 'Activos', color: '#2563EB' },
            { valor: stats.prestadores, label: 'Profesionales', color: MORADO },
            { valor: stats.completados, label: 'Completados', color: '#059669' },
            { valor: '$' + (stats.gasto > 999 ? (stats.gasto/1000).toFixed(1)+'k' : stats.gasto), label: 'Invertido', color: '#D97706' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
              <p className="text-xl font-extrabold" style={{color: s.color}}>{s.valor}</p>
              <p className="text-gray-400 text-xs mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Buscador ciudad */}
        <div className="relative mb-5">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📍</span>
          <input type="text" placeholder="Filtrar por ciudad..." value={busquedaCiudad}
            onChange={e => { setBusquedaCiudad(e.target.value); setCiudadFiltro(e.target.value); }}
            className="w-full pl-10 pr-10 py-3 rounded-2xl border-2 border-gray-100 bg-white focus:border-purple-200 outline-none text-gray-900 text-sm transition"/>
          {busquedaCiudad && <button onClick={() => { setBusquedaCiudad(''); setCiudadFiltro(''); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">✕</button>}
        </div>

        {/* CTA publicar */}
        <a href="/publicar" className="flex items-center justify-between w-full text-white rounded-2xl p-5 mb-5 hover:opacity-90 transition" style={{background: MORADO}}>
          <div>
            <p className="font-extrabold text-lg">+ Nuevo servicio</p>
            <p className="text-white/70 text-sm">Publica y encuentra al profesional ideal</p>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-2xl">📋</div>
        </a>

        <div className="flex items-center justify-between mb-3">
          <h2 className="font-extrabold text-gray-900 text-lg">{ciudadFiltro ? 'Servicios en "' + ciudadFiltro + '"' : 'Mis servicios'}</h2>
          <span className="text-xs text-gray-400 font-semibold">{serviciosFiltrados.length} total</span>
        </div>

        {serviciosFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <p className="text-4xl mb-3">{ciudadFiltro ? '🔍' : '📋'}</p>
            <p className="font-bold text-gray-900 mb-1">{ciudadFiltro ? 'Sin servicios en "' + ciudadFiltro + '"' : 'Sin servicios publicados'}</p>
            <p className="text-gray-400 text-sm">{ciudadFiltro ? 'Intenta con otra ciudad' : 'Publica tu primer servicio para encontrar profesionales'}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {serviciosFiltrados.map((servicio) => {
              const aplicacionesAceptadas = (servicio.aplicaciones||[]).filter((a:any)=>a.estado==='aceptado'||a.estado==='completado');
              const aplicacionesPendientes = (servicio.aplicaciones||[]).filter((a:any)=>a.estado==='pendiente');
              const cuposLabel = getCuposLabel(servicio);
              return (
                <div key={servicio.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 pr-3">
                      <h3 className="font-extrabold text-gray-900 mb-1">{servicio.titulo}</h3>
                      <p className="text-xs text-gray-400">📅 {servicio.fecha} {servicio.hora?.slice(0,5)}</p>
                      {servicio.direccion && <p className="text-xs text-gray-400 mt-0.5">📍 {servicio.direccion}</p>}
                      {cuposLabel && <div className="mt-1">{cuposLabel}</div>}
                    </div>
                    <span className={'text-xs font-bold px-3 py-1 rounded-lg ' + estadoColor(servicio.estado)}>{estadoLabel(servicio.estado)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3 py-2 border-y border-gray-100">
                    <span className="font-extrabold" style={{color: MORADO}}>${servicio.presupuesto} MXN</span>
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">{servicio.categoria}</span>
                  </div>
                  {aplicacionesAceptadas.length > 0 && (
                    <div className="bg-green-50 rounded-xl p-3 mb-3 border border-green-100">
                      <p className="text-xs font-bold text-green-700 mb-2">✓ Profesionales confirmados ({aplicacionesAceptadas.length})</p>
                      {aplicacionesAceptadas.map((app:any) => (
                        <div key={app.id} className="flex items-center gap-2 mb-1">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{background: MORADO}}>
                            {app.usuarios?.foto_url ? <img src={app.usuarios.foto_url} className="w-full h-full object-cover rounded-lg"/> : <span className="text-white text-xs font-bold">{app.usuarios?.nombre?.charAt(0)||'?'}</span>}
                          </div>
                          <span className="text-sm font-semibold text-gray-700">{app.usuarios?.nombre}</span>
                          <span className="text-xs text-amber-500 ml-auto">⭐ {app.usuarios?.calificacion||'5.0'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {aplicacionesPendientes.length > 0 && (
                    <div className="bg-amber-50 rounded-xl p-3 mb-3 border border-amber-100">
                      <p className="text-xs font-bold text-amber-700">⏳ {aplicacionesPendientes.length} propuesta{aplicacionesPendientes.length!==1?'s':''} pendiente{aplicacionesPendientes.length!==1?'s':''}</p>
                    </div>
                  )}
                  <a href={'/aplicaciones?servicio=' + servicio.id} className="block w-full py-2.5 text-white rounded-xl font-semibold text-sm text-center hover:opacity-90 transition" style={{background: MORADO}}>
                    {aplicacionesPendientes.length > 0 ? 'Ver propuestas (' + aplicacionesPendientes.length + ')' : aplicacionesAceptadas.length > 0 ? 'Gestionar (' + aplicacionesAceptadas.length + ' confirmados)' : 'Ver detalle'}
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Menú hamburguesa */}
      {mostrarMenu && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setMostrarMenu(false)}>
          <div className="w-72 bg-white h-full shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-12 pb-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <span className="font-extrabold text-lg" style={{color: '#1A1A2E'}}>fleksi</span>
                <button onClick={() => setMostrarMenu(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-sm">✕</button>
              </div>
              {usuario && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-lg" style={{background: MORADO}}>{usuario.nombre?.charAt(0)}</div>
                  <div><p className="font-extrabold text-gray-900 text-sm">{usuario.nombre}</p><p className="text-xs text-gray-400">{usuario.email}</p></div>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto py-3">
              {[
                { href: '/perfil', icon: '👤', label: 'Mi perfil' },
                { href: '/wallet', icon: '💳', label: 'Wallet' },
                { href: '/verificacion', icon: '🛡️', label: 'Verificación' },
                { href: '/ayuda', icon: '❓', label: 'Ayuda y soporte' },
                { href: '/terminos', icon: '📄', label: 'Términos y condiciones' },
                { href: '/privacidad', icon: '🔒', label: 'Aviso de privacidad' },
              ].map(item => (
                <a key={item.label} href={item.href} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition" onClick={() => setMostrarMenu(false)}>
                  <span className="text-xl w-6 text-center">{item.icon}</span>
                  <span className="font-semibold text-gray-700 text-sm">{item.label}</span>
                </a>
              ))}
              <button onClick={() => setMostrarCambioRol(true)} className="flex items-center gap-4 px-6 py-4 hover:bg-purple-50 transition w-full">
                <span className="text-xl w-6 text-center">⚡</span>
                <span className="font-semibold text-purple-600 text-sm">Cambiar a modo Flekser</span>
              </button>
              <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }} className="flex items-center gap-4 px-6 py-4 hover:bg-red-50 transition w-full">
                <span className="text-xl w-6 text-center">🚪</span>
                <span className="font-semibold text-red-500 text-sm">Cerrar sesión</span>
              </button>
            </div>
          </div>
          <div className="flex-1 bg-black/40"/>
        </div>
      )}

      {/* Modal notificaciones */}
      {mostrarNotifs && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setMostrarNotifs(false)}>
          <div className="w-full bg-white rounded-t-3xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-lg">Notificaciones</h3>
              <button onClick={() => setMostrarNotifs(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-3">
              {notificaciones.length === 0 ? (
                <div className="text-center py-12"><p className="text-4xl mb-3">🔔</p><p className="font-bold text-gray-900 mb-1">Sin notificaciones</p><p className="text-gray-400 text-sm">Aquí verás tus actualizaciones</p></div>
              ) : (
                <div className="flex flex-col gap-2">
                  {notificaciones.map(n => (
                    <button key={n.id} onClick={() => { if (n.tipo === 'admin_mensaje') { setNotifModalAbierta(n); } else if (n.link) { setMostrarNotifs(false); window.location.href = n.link; } }}
                      className={'flex items-start gap-3 p-3 rounded-2xl transition text-left w-full ' + (!n.leida ? 'border border-purple-100' : 'bg-gray-50')}
                      style={!n.leida ? {background: '#F5F0FF'} : {}}>
                      <span className="text-2xl flex-shrink-0 mt-0.5">{notifEmoji[n.tipo]||'🔔'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm">{n.titulo}</p>
                        {n.mensaje && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.mensaje}</p>}
                        <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString('es-MX',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</p>
                      </div>
                      {!n.leida && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2" style={{background: MORADO}}/>}
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

      {mostrarCambioRol && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setMostrarCambioRol(false)}>
          <div className="w-full bg-white rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6"/>
            <h3 className="font-extrabold text-gray-900 text-lg mb-1 text-center">Cambiar modo</h3>
            <p className="text-gray-400 text-sm text-center mb-5">Alterna entre tus perfiles sin cerrar sesión</p>
            <div className="flex flex-col gap-3">
              {(['flekser','empresa'] as string[]).map(r => {
                const esActivo = r === 'empresa';
                const info = { flekser: { emoji: '⚡', label: 'Flekser', desc: 'Busca y ofrece servicios' }, empresa: { emoji: '🏢', label: 'Empresa', desc: 'Gestiona tus solicitudes' } }[r];
                return (
                  <button key={r} onClick={() => cambiarRol(r)} disabled={cambiandoRol || esActivo}
                    className="flex items-center gap-4 p-4 rounded-2xl border-2 transition"
                    style={{background: esActivo ? MORADO : 'white', borderColor: esActivo ? MORADO : '#E5E7EB', color: esActivo ? 'white' : '#111'}}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{background: esActivo ? 'rgba(255,255,255,0.2)' : '#F3F4F6'}}>{info?.emoji}</div>
                    <div className="flex-1 text-left">
                      <p className="font-extrabold">Modo {info?.label}</p>
                      <p className="text-xs mt-0.5 opacity-70">{info?.desc}</p>
                    </div>
                    {esActivo ? <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/20">Activo</span> : <span className="text-gray-400 text-xs font-bold">Cambiar →</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <TourInicial rol="empresa" />
      <Nav activo="inicio" />
    </main>
  );
}