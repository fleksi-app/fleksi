'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Nav from '@/lib/nav';

const habilidadesOpciones = [
  '🧹 Limpieza del hogar', '🌿 Jardinería', '🎨 Pintura',
  '🔧 Mantenimiento general', '⚡ Electricidad', '🚿 Plomería',
  '🚚 Fletes y traslados', '🪑 Armado de muebles', '🔩 Mecánica básica',
  '🔑 Cerrajería', '📺 Instalación TV/repisas/cortinas', '🪵 Carpintería ligera',
  '📦 Mudanza ligera / Ayudante', '👔 Planchado / Lavandería', '💅 Uñas / Estética',
  '🎪 Staff para eventos', '🍽️ Mesero', '🍳 Cocinero particular',
  '🚗 Chofer ejecutivo', '🗣️ Intérprete / Traductor',
];

export default function Catalogo() {
  const [fleksers, setFleksers] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [ciudadFiltro, setCiudadFiltro] = useState('');
  const [habilidadFiltro, setHabilidadFiltro] = useState('');
  const [soloVerificados, setSoloVerificados] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }
      const { data: perfil } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
      setUsuario(perfil);
      const { data } = await supabase
        .from('usuarios')
        .select('id, nombre, foto_url, rol, ciudad, descripcion, calificacion, trabajos_completados, habilidades, verificado, ciudades_visitadas')
        .in('rol', ['flekser', 'viajero'])
        .order('calificacion', { ascending: false });
      setFleksers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const fleksersFiltrados = fleksers.filter(f => {
    const matchBusqueda = !busqueda ||
      f.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      f.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
      f.habilidades?.some((h: string) => h.toLowerCase().includes(busqueda.toLowerCase()));
    const matchCiudad = !ciudadFiltro ||
      f.ciudad?.toLowerCase().includes(ciudadFiltro.toLowerCase()) ||
      f.ciudades_visitadas?.some((c: string) => c.toLowerCase().includes(ciudadFiltro.toLowerCase()));
    const matchHabilidad = !habilidadFiltro ||
      f.habilidades?.some((h: string) => h.includes(habilidadFiltro));
    const matchVerificado = !soloVerificados || f.verificado;
    return matchBusqueda && matchCiudad && matchHabilidad && matchVerificado;
  });

  const limpiarFiltros = () => {
    setCiudadFiltro('');
    setHabilidadFiltro('');
    setSoloVerificados(false);
    setMostrarFiltros(false);
  };

  const hayFiltros = ciudadFiltro || habilidadFiltro || soloVerificados;

  const rol = usuario?.rol_activo || usuario?.rol || 'flekser';
  const esEmpresa = rol === 'empresa';
  const esViajero = rol === 'viajero';

  const headerGradient = esEmpresa ? 'from-slate-700 to-blue-900' : esViajero ? 'from-sky-500 to-teal-500' : 'from-blue-600 to-purple-600';
  const filtroActivoColor = esEmpresa ? 'text-blue-800' : esViajero ? 'text-teal-600' : 'text-purple-600';
  const btnFiltroActivo = esEmpresa ? 'text-blue-800' : esViajero ? 'text-teal-600' : 'text-purple-600';
  const habilidadActivaBg = esEmpresa ? 'from-slate-700 to-blue-900' : esViajero ? 'from-sky-500 to-teal-500' : 'from-blue-600 to-purple-600';
  const habilidadFiltroColor = esEmpresa ? 'focus:border-blue-700' : esViajero ? 'focus:border-teal-400' : 'focus:border-purple-400';
  const solicitudGradient = esEmpresa ? 'from-slate-700 to-blue-900' : esViajero ? 'from-sky-500 to-teal-500' : 'from-blue-600 to-purple-600';
  const habilidadTagBg = esEmpresa ? 'bg-blue-50 text-blue-700 border-blue-100' : esViajero ? 'bg-teal-50 text-teal-700 border-teal-100' : 'bg-purple-50 text-purple-600 border-purple-100';
  const avatarGradient = esEmpresa ? 'from-slate-700 to-blue-900' : esViajero ? 'from-sky-500 to-teal-500' : 'from-blue-600 to-purple-600';
  const bgFondo = esEmpresa ? 'bg-slate-50' : esViajero ? 'bg-sky-50' : 'bg-gray-50';
  const spinnerColor = esEmpresa ? 'border-blue-800' : esViajero ? 'border-teal-500' : 'border-purple-600';
  const ctaGradient = esEmpresa ? 'from-slate-700 to-blue-900' : esViajero ? 'from-sky-500 to-teal-500' : 'from-blue-600 to-purple-600';

  if (cargando) {
    return (
      <main className={`min-h-screen ${bgFondo} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${spinnerColor}`}></div>
          <p className="text-gray-400">Cargando catálogo...</p>
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen ${bgFondo} pb-32`}>

      <div className={`bg-gradient-to-r ${headerGradient} px-6 pt-12 pb-8`}>
        <div className="max-w-md mx-auto">
          <h1 className="text-white font-extrabold text-xl mb-1">Catálogo de Fleksers</h1>
          <p className="text-white/70 text-sm mb-4">Encuentra al profesional ideal para tu trabajo</p>

          <div className="relative mb-3">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">🔍</span>
            <input
              type="text"
              placeholder="Buscar por nombre o habilidad..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/15 border border-white/25 text-white placeholder-white/50 outline-none focus:bg-white/25 transition"/>
          </div>

          <button
            onClick={() => setMostrarFiltros(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition ${
              hayFiltros ? `bg-white ${btnFiltroActivo}` : 'bg-white/15 text-white border border-white/25'
            }`}>
            ⚙️ Filtros {hayFiltros && `(${[ciudadFiltro, habilidadFiltro, soloVerificados].filter(Boolean).length})`}
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 mt-5">

        <div className="flex items-center justify-between mb-4">
          <p className="font-extrabold text-gray-900">
            {fleksersFiltrados.length} flekser{fleksersFiltrados.length !== 1 ? 's' : ''} disponible{fleksersFiltrados.length !== 1 ? 's' : ''}
          </p>
          {hayFiltros && (
            <button onClick={limpiarFiltros} className={`text-xs ${filtroActivoColor} font-bold hover:underline`}>
              Limpiar filtros ✕
            </button>
          )}
        </div>

        {fleksersFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-bold text-gray-900 mb-1">Sin resultados</p>
            <p className="text-gray-400 text-sm">Intenta con otros filtros o una búsqueda diferente</p>
            {hayFiltros && (
              <button onClick={limpiarFiltros}
                className={`mt-4 px-6 py-2 bg-gradient-to-r ${ctaGradient} text-white rounded-2xl font-bold text-sm`}>
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {fleksersFiltrados.map((f) => (
              <div key={f.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <a href={`/perfil/${f.id}`} className="block">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-r ${avatarGradient} flex items-center justify-center flex-shrink-0`}>
                      {f.foto_url ? (
                        <img src={f.foto_url} alt={f.nombre} className="w-full h-full object-cover"/>
                      ) : (
                        <span className="text-white font-extrabold text-xl">{f.nombre?.charAt(0)?.toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-extrabold text-gray-900">{f.nombre}</p>
                        {f.verificado && (
                          <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">✅</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-yellow-500 font-bold">⭐ {f.calificacion || '5.0'}</span>
                        <span className="text-xs text-gray-400">{f.trabajos_completados || 0} trabajos</span>
                        {f.ciudad && <span className="text-xs text-gray-400">📍 {f.ciudad}</span>}
                      </div>
                    </div>
                  </div>

                  {f.descripcion && (
                    <p className="text-xs text-gray-500 mb-2 leading-relaxed line-clamp-2">{f.descripcion}</p>
                  )}

                  {f.habilidades?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {f.habilidades.slice(0, 4).map((h: string) => (
                        <span key={h} className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${habilidadTagBg}`}>
                          {h}
                        </span>
                      ))}
                      {f.habilidades.length > 4 && (
                        <span className="text-xs bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">
                          +{f.habilidades.length - 4} más
                        </span>
                      )}
                    </div>
                  )}
                </a>

                <div className="flex gap-2">
                  <a href={`/publicar?para=${f.id}`}
                    className={`flex-1 py-2.5 bg-gradient-to-r ${solicitudGradient} text-white rounded-xl font-bold text-xs text-center`}>
                    🎯 Enviar solicitud
                  </a>
                  <a href={`/perfil/${f.id}`}
                    className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-bold text-xs text-center hover:border-gray-400 transition">
                    Ver perfil →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {mostrarFiltros && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setMostrarFiltros(false)}>
          <div className="w-full bg-white rounded-t-3xl p-6 pb-10 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6"/>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-extrabold text-gray-900 text-lg">Filtros</h3>
              {hayFiltros && (
                <button onClick={limpiarFiltros} className={`text-sm ${filtroActivoColor} font-bold`}>Limpiar todo</button>
              )}
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">📍 Ciudad</label>
                <input
                  type="text"
                  placeholder="Ej. Guadalajara, CDMX, Monterrey..."
                  value={ciudadFiltro}
                  onChange={(e) => setCiudadFiltro(e.target.value)}
                  className={`w-full p-3 rounded-xl border-2 border-gray-200 ${habilidadFiltroColor} outline-none text-gray-900 text-sm transition`}/>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">🛠️ Habilidad</label>
                <div className="flex flex-wrap gap-2">
                  {habilidadesOpciones.map((h) => (
                    <button key={h} onClick={() => setHabilidadFiltro(habilidadFiltro === h ? '' : h)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition border ${
                        habilidadFiltro === h
                          ? `bg-gradient-to-r ${habilidadActivaBg} text-white border-transparent`
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}>
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              <div onClick={() => setSoloVerificados(!soloVerificados)}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition ${
                  soloVerificados ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'
                }`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">✅</span>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Solo verificados</p>
                    <p className="text-xs text-gray-400">Fleksers con identidad confirmada</p>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full transition-all ${soloVerificados ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <div className={`w-6 h-6 bg-white rounded-full shadow transition-all ${soloVerificados ? 'translate-x-6' : 'translate-x-0'}`}/>
                </div>
              </div>
            </div>

            <button onClick={() => setMostrarFiltros(false)}
              className={`w-full mt-6 py-4 bg-gradient-to-r ${ctaGradient} text-white rounded-2xl font-bold text-lg shadow-lg hover:opacity-90 transition`}>
              Ver {fleksersFiltrados.length} resultado{fleksersFiltrados.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      <Nav activo="catalogo" />
    </main>
  );
}