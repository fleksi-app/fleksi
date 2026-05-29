'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Nav from '@/lib/nav';

export default function HomeEmpresa() {
  const [usuario, setUsuario] = useState<any>(null);
  const [servicios, setServicios] = useState<any[]>([]);
  const [stats, setStats] = useState({ activos: 0, completados: 0, prestadores: 0, gasto: 0 });
  const [cargando, setCargando] = useState(true);
  const [mostrarNotifs, setMostrarNotifs] = useState(false);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [mostrarCambioRol, setMostrarCambioRol] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [cambiandoRol, setCambiandoRol] = useState(false);
  const [busquedaCiudad, setBusquedaCiudad] = useState('');
  const [ciudadFiltro, setCiudadFiltro] = useState('');

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    const { data: perfil } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
    setUsuario(perfil);
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
    if (nuevoRol === 'flekser') window.location.href = '/home';
    else if (nuevoRol === 'viajero') window.location.href = '/home-viajero';
    setCambiandoRol(false);
  };

  const estadoColor = (estado: string) => ({ activo:'bg-blue-100 text-blue-700', publicado:'bg-blue-100 text-blue-700', en_proceso:'bg-amber-100 text-amber-700', completado:'bg-emerald-100 text-emerald-700', pagado:'bg-emerald-100 text-emerald-700', cancelado:'bg-red-100 text-red-700' }[estado] || 'bg-gray-100 text-gray-600');
  const estadoLabel = (estado: string) => ({ activo:'● Activo', publicado:'● Publicado', en_proceso:'↻ En proceso', completado:'✓ Completado', pagado:'✓ Pagado', cancelado:'✕ Cancelado' }[estado] || estado);

  const rolInfo: any = {
    flekser: { emoji: '⚡', label: 'Flekser', color: 'from-blue-600 to-purple-600' },
    empresa: { emoji: '🏢', label: 'Empresa', color: 'from-slate-700 to-blue-900' },
    viajero: { emoji: '✈️', label: 'Viajero', color: 'from-sky-500 to-teal-500' },
  };

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
    return s.direccion?.toLowerCase().includes(ciudadFiltro.toLowerCase()) ||
           s.ciudad?.toLowerCase().includes(ciudadFiltro.toLowerCase());
  });

  if (cargando) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando panel...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-32">

      <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-blue-900 px-6 pt-12 pb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full -translate-y-16 translate-x-16"/>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-12 -translate-x-8"/>
        <div className="absolute inset-0 opacity-5" style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)',backgroundSize:'20px 20px'}}/>

        <div className="max-w-md mx-auto relative">
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => setMostrarCambioRol(true)}
              className="flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-3 py-1.5 hover:bg-white/25 transition">
              <span className="text-sm">🏢</span>
              <span className="text-white text-xs font-extrabold">Empresa</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            <button onClick={abrirNotifs} className="relative w-9 h-9 bg-white/15 border border-white/25 rounded-full flex items-center justify-center hover:bg-white/25 transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
              {noLeidas > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-extrabold rounded-full flex items-center justify-center border border-white">{noLeidas > 9 ? '9+' : noLeidas}</span>}
            </button>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"/>
            <p className="text-white/50 text-xs font-semibold tracking-widest uppercase">Panel empresarial</p>
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-5">{usuario?.nombre}</h1>

          <div className="grid grid-cols-4 gap-2 mb-5">
            {[
              { valor: stats.activos, label: 'Activos', color: 'text-blue-300' },
              { valor: stats.prestadores, label: 'Profesionales', color: 'text-purple-300' },
              { valor: stats.completados, label: 'Completados', color: 'text-emerald-300' },
              { valor: `$${stats.gasto > 999 ? (stats.gasto/1000).toFixed(1)+'k' : stats.gasto}`, label: 'Invertido', color: 'text-amber-300' },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 rounded-xl p-2.5 text-center border border-white/10">
                <p className={`text-xl font-extrabold ${s.color}`}>{s.valor}</p>
                <p className="text-white/40 text-xs mt-0.5 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-sm">📍</span>
            <input
              type="text"
              placeholder="Filtrar mis servicios por ciudad..."
              value={busquedaCiudad}
              onChange={(e) => { setBusquedaCiudad(e.target.value); setCiudadFiltro(e.target.value); }}
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/15 border border-white/25 text-white placeholder-white/50 outline-none focus:bg-white/25 transition text-sm"
            />
            {busquedaCiudad && (
              <button onClick={() => { setBusquedaCiudad(''); setCiudadFiltro(''); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition text-lg">
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 mt-5">
        <a href="/publicar" className="flex items-center justify-between w-full bg-gradient-to-r from-slate-700 to-blue-800 text-white rounded-2xl p-5 mb-5 shadow-lg hover:opacity-90 transition border border-slate-600">
          <div>
            <p className="font-extrabold text-lg">+ Nuevo servicio</p>
            <p className="text-white/60 text-sm">Publica y encuentra al profesional ideal</p>
          </div>
          <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center text-2xl">📋</div>
        </a>

        <div className="flex items-center justify-between mb-3">
          <h2 className="font-extrabold text-slate-800 text-lg">
            {ciudadFiltro ? `Servicios en "${ciudadFiltro}"` : 'Mis servicios'}
          </h2>
          <span className="text-xs text-slate-400 font-semibold">{serviciosFiltrados.length} total</span>
        </div>

        {serviciosFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
            <p className="text-4xl mb-3">{ciudadFiltro ? '🔍' : '📋'}</p>
            <p className="font-bold text-slate-700 mb-1">
              {ciudadFiltro ? `Sin servicios en "${ciudadFiltro}"` : 'Sin servicios publicados'}
            </p>
            <p className="text-slate-400 text-sm">
              {ciudadFiltro ? 'Intenta con otra ciudad' : 'Publica tu primer servicio para encontrar profesionales'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {serviciosFiltrados.map((servicio) => {
              const aplicacionesAceptadas = (servicio.aplicaciones||[]).filter((a:any)=>a.estado==='aceptado'||a.estado==='completado');
              const aplicacionesPendientes = (servicio.aplicaciones||[]).filter((a:any)=>a.estado==='pendiente');
              const cuposLabel = getCuposLabel(servicio);

              return (
                <div key={servicio.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 pr-3">
                      <h3 className="font-extrabold text-slate-800 mb-1">{servicio.titulo}</h3>
                      <p className="text-xs text-slate-400">📅 {servicio.fecha} {servicio.hora?.slice(0,5)}</p>
                      {servicio.direccion && <p className="text-xs text-slate-400 mt-0.5">📍 {servicio.direccion}</p>}
                      {cuposLabel && <div className="mt-1">{cuposLabel}</div>}
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-lg ${estadoColor(servicio.estado)}`}>{estadoLabel(servicio.estado)}</span>
                  </div>

                  <div className="flex justify-between items-center mb-3 py-2 border-y border-slate-50">
                    <span className="text-blue-700 font-extrabold">${servicio.presupuesto} MXN</span>
                    <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{servicio.categoria}</span>
                  </div>

                  {aplicacionesAceptadas.length > 0 && (
                    <div className="bg-emerald-50 rounded-xl p-3 mb-3 border border-emerald-100">
                      <p className="text-xs font-bold text-emerald-700 mb-2">✓ Profesionales confirmados ({aplicacionesAceptadas.length})</p>
                      {aplicacionesAceptadas.map((app:any) => (
                        <div key={app.id} className="flex items-center gap-2 mb-1">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-600 to-blue-700 flex items-center justify-center flex-shrink-0">
                            {app.usuarios?.foto_url ? <img src={app.usuarios.foto_url} className="w-full h-full object-cover rounded-lg"/> : <span className="text-white text-xs font-bold">{app.usuarios?.nombre?.charAt(0)||'?'}</span>}
                          </div>
                          <span className="text-sm font-semibold text-slate-700">{app.usuarios?.nombre}</span>
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

                  {/* Un solo botón */}
                  <a href={`/aplicaciones?servicio=${servicio.id}`}
                    className="block w-full py-2.5 bg-gradient-to-r from-slate-700 to-blue-800 text-white rounded-xl font-semibold text-sm text-center hover:opacity-90 transition">
                    {aplicacionesPendientes.length > 0
                      ? `Ver propuestas (${aplicacionesPendientes.length})`
                      : aplicacionesAceptadas.length > 0
                      ? `Gestionar (${aplicacionesAceptadas.length} confirmados)`
                      : 'Ver detalle'}
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {mostrarNotifs && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setMostrarNotifs(false)}>
          <div className="w-full bg-white rounded-t-3xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-lg">Notificaciones</h3>
              <button onClick={() => setMostrarNotifs(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-3">
              {notificaciones.length === 0 ? (
                <div className="text-center py-12"><p className="text-4xl mb-3">🔔</p><p className="font-bold text-gray-900 mb-1">Sin notificaciones</p><p className="text-gray-400 text-sm">Aquí verás tus actualizaciones</p></div>
              ) : (
                <div className="flex flex-col gap-2">
                  {notificaciones.map((n) => (
                    <a key={n.id} href={n.link||'#'} onClick={() => setMostrarNotifs(false)} className={`flex items-start gap-3 p-3 rounded-2xl transition ${!n.leida?'bg-purple-50 border border-purple-100':'bg-gray-50'}`}>
                      <span className="text-2xl flex-shrink-0 mt-0.5">{notifEmoji[n.tipo]||'🔔'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm">{n.titulo}</p>
                        {n.mensaje && <p className="text-xs text-gray-500 mt-0.5">{n.mensaje}</p>}
                        <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString('es-MX',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</p>
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
            <div className="flex flex-col gap-3">
              {(['flekser','empresa','viajero'] as string[]).map((r) => {
                const info = rolInfo[r];
                const esActivo = r === 'empresa';
                return (
                  <button key={r} onClick={() => cambiarRol(r)} disabled={cambiandoRol || esActivo}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition ${esActivo?'border-transparent bg-gradient-to-r '+info.color+' text-white':'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${esActivo?'bg-white/20':'bg-gray-100'}`}>{info.emoji}</div>
                    <div className="flex-1 text-left">
                      <p className={`font-extrabold ${esActivo?'text-white':'text-gray-900'}`}>Modo {info.label}</p>
                      <p className={`text-xs mt-0.5 ${esActivo?'text-white/70':'text-gray-400'}`}>{r==='flekser'?'Busca y ofrece servicios':r==='empresa'?'Gestiona tus solicitudes':'Trabaja desde cualquier ciudad'}</p>
                    </div>
                    {esActivo?<span className="text-white/80 text-xs font-bold bg-white/20 px-2 py-1 rounded-full">Activo</span>:<span className="text-gray-400 text-xs font-bold">Cambiar →</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <Nav activo="inicio" />
    </main>
  );
}