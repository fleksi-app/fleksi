'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Nav from '@/lib/nav';
import TourInicial from '@/components/TourInicial';

const categorias = ['Todos', 'Hogar', 'Limpieza', 'Eventos', 'Mudanza', 'Ejecutivo'];

function getSaludo() {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buenos días,';
  if (hora < 18) return 'Buenas tardes,';
  return 'Buenas noches,';
}

export default function HomeViajero() {
  const [trabajos, setTrabajos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [busquedaCiudad, setBusquedaCiudad] = useState('');
  const [ciudadFiltro, setCiudadFiltro] = useState('');
  const [usuario, setUsuario] = useState<any>(null);
  const [aplicacionesUsuario, setAplicacionesUsuario] = useState<string[]>([]);
  const [ciudadActual, setCiudadActual] = useState('');
  const [editandoCiudad, setEditandoCiudad] = useState(false);
  const [guardandoCiudad, setGuardandoCiudad] = useState(false);
  const [mostrarNotifs, setMostrarNotifs] = useState(false);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [mostrarCambioRol, setMostrarCambioRol] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [cambiandoRol, setCambiandoRol] = useState(false);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    const { data: perfil } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
    setUsuario(perfil);
    setRoles(perfil?.roles || [perfil?.rol || 'viajero']);
    setCiudadActual(perfil?.ciudad || '');
    setBusquedaCiudad(perfil?.ciudad || '');
    setCiudadFiltro(perfil?.ciudad || '');
    const { data: servicios } = await supabase.from('servicios')
      .select('*, usuarios!cliente_id(nombre, calificacion, ciudad)')
      .eq('estado', 'activo').neq('cliente_id', user.id)
      .order('created_at', { ascending: false });
    setTrabajos(servicios || []);
    const { data: apps } = await supabase.from('aplicaciones').select('servicio_id').eq('prestador_id', user.id);
    setAplicacionesUsuario((apps || []).map(a => a.servicio_id));
    const { data: notifs } = await supabase.from('notificaciones').select('*').eq('usuario_id', user.id).order('created_at', { ascending: false }).limit(20);
    setNotificaciones(notifs || []);
    setNoLeidas((notifs || []).filter(n => !n.leida).length);
    setCargando(false);
  };

  const guardarCiudad = async () => {
    if (!ciudadActual.trim() || !usuario) return;
    setGuardandoCiudad(true);
    try {
      const nuevasCiudades = usuario.ciudades_visitadas || [];
      if (!nuevasCiudades.includes(ciudadActual.trim())) nuevasCiudades.push(ciudadActual.trim());
      await supabase.from('usuarios').update({ ciudad: ciudadActual.trim(), ciudades_visitadas: nuevasCiudades }).eq('id', usuario.id);
      setUsuario((prev: any) => ({ ...prev, ciudad: ciudadActual.trim(), ciudades_visitadas: nuevasCiudades }));
      setBusquedaCiudad(ciudadActual.trim());
      setCiudadFiltro(ciudadActual.trim());
      setEditandoCiudad(false);
    } finally { setGuardandoCiudad(false); }
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
    else if (nuevoRol === 'empresa') window.location.href = '/home-empresa';
    setCambiandoRol(false);
  };

  const categoriaEmoji: any = { hogar:'🔧',limpieza:'🧹',eventos:'🍽️',mudanza:'🚚',ejecutivo:'🚗',interprete:'🗣️',cocina:'🍳',jardineria:'🌿',mecanica:'🔩',cerrajeria:'🔑',estetica:'💅',otro:'✨' };
  const notifEmoji: any = { nueva_aplicacion:'✋',aplicacion_aceptada:'✅',aplicacion_rechazada:'❌',trabajo_completado:'🎉',nuevo_trabajo:'🔔',pago_liberado:'💰',mensaje_nuevo:'💬' };
  const rolInfo: any = {
    flekser: { emoji: '⚡', label: 'Flekser', color: 'from-blue-600 to-purple-600' },
    empresa: { emoji: '🏢', label: 'Empresa', color: 'from-slate-700 to-blue-900' },
    viajero: { emoji: '✈️', label: 'Viajero', color: 'from-sky-500 to-teal-500' },
  };

  const trabajosFiltrados = trabajos.filter(t => {
    const matchCat = categoriaActiva === 'Todos' || t.categoria?.toLowerCase().includes(categoriaActiva.toLowerCase());
    const matchBusqueda = !busqueda || t.titulo?.toLowerCase().includes(busqueda.toLowerCase());
    const matchCiudad = !ciudadFiltro.trim() ||
      t.usuarios?.ciudad?.toLowerCase().includes(ciudadFiltro.toLowerCase()) ||
      t.direccion?.toLowerCase().includes(ciudadFiltro.toLowerCase());
    return matchCat && matchBusqueda && matchCiudad;
  });

  if (cargando) {
    return (
      <main className="min-h-screen bg-sky-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-teal-400">Explorando trabajos...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-sky-50 pb-32">

      <div className="bg-gradient-to-br from-sky-500 via-teal-500 to-emerald-600 px-6 pt-12 pb-8 relative overflow-hidden">
        <div className="absolute top-4 right-8 w-20 h-8 bg-white/15 rounded-full"/>
        <div className="absolute top-6 right-16 w-14 h-6 bg-white/10 rounded-full"/>
        <div className="absolute top-8 left-4 w-16 h-6 bg-white/10 rounded-full"/>

        <div className="max-w-md mx-auto relative">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setMostrarCambioRol(true)}
              className="flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-3 py-1.5 hover:bg-white/25 transition">
              <span className="text-sm">✈️</span>
              <span className="text-white text-xs font-extrabold">Viajero</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            <button onClick={abrirNotifs} className="tour-notifs relative w-9 h-9 bg-white/15 border border-white/25 rounded-full flex items-center justify-center hover:bg-white/25 transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
              {noLeidas > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-extrabold rounded-full flex items-center justify-center border border-white">{noLeidas > 9 ? '9+' : noLeidas}</span>}
            </button>
          </div>

          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-lg">✈️</span>
            <p className="text-white/70 text-sm font-semibold">{getSaludo()}</p>
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-4">{usuario?.nombre?.split(' ')[0] || 'Viajero'} 🌍</h1>

          <div className="bg-white/15 backdrop-blur rounded-2xl p-4 mb-3 border border-white/25">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-base">📍</span>
                <p className="text-white/70 text-xs font-semibold">Estás explorando en</p>
              </div>
              <button onClick={() => setEditandoCiudad(!editandoCiudad)} className="text-xs bg-white/20 px-2 py-1 rounded-full font-semibold text-white hover:bg-white/30 transition">
                {editandoCiudad ? 'Cancelar' : 'Cambiar'}
              </button>
            </div>
            {editandoCiudad ? (
              <div className="flex gap-2 mt-2">
                <input value={ciudadActual} onChange={(e) => setCiudadActual(e.target.value)}
                  placeholder="Ej. Cancún, Oaxaca, CDMX..."
                  className="flex-1 p-2 rounded-xl bg-white/20 text-white placeholder-white/50 outline-none border border-white/30 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && guardarCiudad()}/>
                <button onClick={guardarCiudad} disabled={guardandoCiudad} className="px-3 py-2 bg-white text-teal-600 rounded-xl font-bold text-sm disabled:opacity-50">✓</button>
              </div>
            ) : (
              <div className="flex items-end justify-between mt-1">
                <p className="text-xl font-extrabold text-white">{usuario?.ciudad || 'Sin ciudad'}</p>
                <p className="text-white/60 text-xs">{trabajosFiltrados.length} trabajos disponibles</p>
              </div>
            )}
          </div>

          {usuario?.ciudades_visitadas?.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 mb-3">
              {usuario.ciudades_visitadas.map((c: string, i: number) => (
                <button key={i}
                  onClick={() => { setBusquedaCiudad(c); setCiudadFiltro(c); }}
                  className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition ${ciudadFiltro === c ? 'bg-white text-teal-600 border-white' : 'bg-white/20 text-white border-white/25 hover:bg-white/30'}`}>
                  📍 {c}
                </button>
              ))}
            </div>
          )}

          <div className="relative mb-2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-sm">📍</span>
            <input type="text" placeholder="Buscar por ciudad..."
              value={busquedaCiudad}
              onChange={(e) => { setBusquedaCiudad(e.target.value); setCiudadFiltro(e.target.value); }}
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/15 border border-white/25 text-white placeholder-white/50 outline-none focus:bg-white/25 transition text-sm"/>
            {busquedaCiudad && (
              <button onClick={() => { setBusquedaCiudad(''); setCiudadFiltro(''); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition text-lg">✕</button>
            )}
          </div>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">🔍</span>
            <input type="text" placeholder="Buscar trabajos..."
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/15 border border-white/25 text-white placeholder-white/50 outline-none focus:bg-white/25 transition"/>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {categorias.map((cat) => (
            <button key={cat} onClick={() => setCategoriaActiva(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${categoriaActiva === cat ? 'bg-gradient-to-r from-sky-500 to-teal-500 text-white shadow-md' : 'bg-white text-gray-500 border-2 border-gray-200'}`}>
              {cat}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="font-extrabold text-gray-900">
            {ciudadFiltro ? `Trabajos en ${ciudadFiltro} 📍` : 'Trabajos en todo el país 🗺️'}
          </h2>
          <span className="text-sm text-gray-400">{trabajosFiltrados.length} disponibles</span>
        </div>

        {trabajosFiltrados.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🗺️</p>
            <p className="font-bold text-gray-900 mb-2">No hay trabajos disponibles</p>
            <p className="text-gray-400 text-sm">Prueba cambiando tu ciudad o los filtros</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {trabajosFiltrados.map((trabajo) => {
              const yaAplico = aplicacionesUsuario.includes(trabajo.id);
              return (
                <a href={`/trabajo?id=${trabajo.id}`} key={trabajo.id} className="bg-white rounded-2xl p-4 shadow-sm border border-sky-100 active:scale-95 transition block">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-sky-50 to-teal-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                      {categoriaEmoji[trabajo.categoria?.toLowerCase()] || '✨'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-gray-900 text-sm leading-tight">{trabajo.titulo}</h3>
                        {trabajo.urgente && <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">🔴 Urgente</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-400">{trabajo.usuarios?.nombre || 'Cliente verificado'}</p>
                        {trabajo.usuarios?.ciudad && (
                          <span className="text-xs bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded-full font-semibold border border-teal-100">
                            📍 {trabajo.usuarios.ciudad}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-400">📅 {trabajo.fecha} {trabajo.hora?.slice(0,5)}</p>
                        <div className="text-right">
                          <p className="font-extrabold text-teal-600 text-sm">${trabajo.presupuesto} MXN</p>
                          <span className={`mt-1 text-xs font-bold px-3 py-1 rounded-full inline-block ${yaAplico ? 'bg-green-100 text-green-600' : 'bg-gradient-to-r from-sky-500 to-teal-500 text-white'}`}>
                            {yaAplico ? '✅ Aplicado' : 'Aplicar'}
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
                const esActivo = r === 'viajero';
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

      <TourInicial rol="viajero" />
      <Nav activo="inicio" />
    </main>
  );
}