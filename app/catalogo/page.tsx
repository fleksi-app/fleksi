'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Nav from '@/lib/nav';
import { cacheGet, cacheSet, TTL } from '@/lib/cache';

const MORADO = '#7B2FE0';

const habilidadesOpciones = [
  '🧹 Limpieza del hogar', '🌿 Jardinería', '🎨 Pintura',
  '🔧 Mantenimiento general', '⚡ Electricidad', '🚿 Plomería',
  '🚚 Fletes y traslados', '🪑 Armado de muebles', '🔩 Mecánica básica',
  '🔑 Cerrajería', '📺 Instalación TV/repisas/cortinas', '🪵 Carpintería ligera',
  '📦 Mudanza ligera / Ayudante', '👔 Planchado / Lavandería', '💅 Uñas / Estética',
  '🎪 Staff para eventos', '🍽️ Mesero', '🍳 Cocinero particular',
  '🚗 Chofer ejecutivo', '🗣️ Intérprete / Traductor',
];

const categoriaAHabilidad: Record<string, string> = {
  hogar: '🔧 Mantenimiento general', limpieza: '🧹 Limpieza del hogar',
  eventos: '🎪 Staff para eventos', mudanza: '🚚 Fletes y traslados',
  mecanica: '🔩 Mecánica básica', cerrajeria: '🔑 Cerrajería',
  estetica: '💅 Uñas / Estética', envios: '🚚 Fletes y traslados',
  jardineria: '🌿 Jardinería', cocina: '🍳 Cocinero particular',
  ejecutivo: '🚗 Chofer ejecutivo', interprete: '🗣️ Intérprete / Traductor',
};

const CATEGORIA_OTROS = '✨ Otros / Sin definir';

function quitarEmoji(texto: string) { return texto.replace(/^\S+\s/, ''); }
function esHabilidadPersonalizada(h: string) { return !habilidadesOpciones.includes(h); }
function tieneSoloPersonalizadas(f: any) {
  const habs: string[] = f.habilidades || [];
  if (habs.length === 0) return true;
  return habs.every(h => esHabilidadPersonalizada(h));
}

export default function Catalogo() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center" style={{background: '#F8FAFC'}}>
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{borderColor: MORADO, borderTopColor: 'transparent'}}/>
      </main>
    }>
      <CatalogoContent />
    </Suspense>
  );
}

function CatalogoContent() {
  const searchParams = useSearchParams();
  const [fleksers, setFleksers] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);
  const [ciudadFiltro, setCiudadFiltro] = useState('');
  const [soloVerificados, setSoloVerificados] = useState(false);
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    const catParam = searchParams.get('categoria');
    if (catParam && categoriaAHabilidad[catParam]) setCategoriaActiva(categoriaAHabilidad[catParam]);
  }, [searchParams]);

  const cargar = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }
      const { data: perfil } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
      setUsuario(perfil);
      let fleksersData = cacheGet<any[]>('catalogo_fleksers');
      if (!fleksersData) {
        const { data } = await supabase.from('usuarios')
          .select('id, nombre, foto_url, rol, ciudad, descripcion, calificacion, trabajos_completados, habilidades, verificado, ciudades_visitadas, progreso_perfil')
          .in('rol', ['flekser']).neq('id', user.id)
          .order('progreso_perfil', { ascending: false }).order('calificacion', { ascending: false });
        fleksersData = data || [];
        cacheSet('catalogo_fleksers', fleksersData, TTL.CATALOGO);
      }
      setFleksers(fleksersData);
    } catch (err) { console.error(err); }
    finally { setCargando(false); }
  };

  const conteoPorCategoria = (h: string) => {
    if (h === CATEGORIA_OTROS) return fleksers.filter(tieneSoloPersonalizadas).length;
    return fleksers.filter(f => f.habilidades?.includes(h)).length;
  };

  const fleksersDeCategoria = categoriaActiva
    ? categoriaActiva === CATEGORIA_OTROS ? fleksers.filter(tieneSoloPersonalizadas)
      : fleksers.filter(f => f.habilidades?.includes(categoriaActiva))
    : [];

  const fleksersFiltrados = fleksersDeCategoria.filter(f => {
    const matchCiudad = !ciudadFiltro || f.ciudad?.toLowerCase().includes(ciudadFiltro.toLowerCase()) || f.ciudades_visitadas?.some((c: string) => c.toLowerCase().includes(ciudadFiltro.toLowerCase()));
    const matchVerificado = !soloVerificados || f.verificado;
    return matchCiudad && matchVerificado;
  }).sort((a, b) => {
    const pa = a.progreso_perfil || 0, pb = b.progreso_perfil || 0;
    if (pb !== pa) return pb - pa;
    if ((b.calificacion || 0) !== (a.calificacion || 0)) return (b.calificacion || 0) - (a.calificacion || 0);
    if (!!b.verificado !== !!a.verificado) return (b.verificado ? 1 : 0) - (a.verificado ? 1 : 0);
    return (b.trabajos_completados || 0) - (a.trabajos_completados || 0);
  });

  const limpiarFiltros = () => { setCiudadFiltro(''); setSoloVerificados(false); };
  const hayFiltros = ciudadFiltro || soloVerificados;

  if (cargando) return (
    <main className="min-h-screen flex items-center justify-center" style={{background: '#F8FAFC'}}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{borderColor: MORADO, borderTopColor: 'transparent'}}/>
        <p className="text-gray-400">Cargando catálogo...</p>
      </div>
    </main>
  );

  // ── VISTA: GRID DE CATEGORÍAS ──
  if (!categoriaActiva) return (
    <main className="min-h-screen pb-32" style={{background: '#F8FAFC'}}>
      <div className="bg-white px-6 pt-12 pb-4 shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto">
          <h1 className="font-extrabold text-gray-900 text-xl mb-1">Catálogo de Fleksers</h1>
          <p className="text-gray-400 text-sm">Elige una categoría para ver a los profesionales</p>
        </div>
      </div>
      <div className="max-w-md mx-auto px-6 pt-4">
        <div className="grid grid-cols-2 gap-3">
          {habilidadesOpciones.map(h => {
            const conteo = conteoPorCategoria(h);
            const emoji = h.split(' ')[0];
            const nombre = quitarEmoji(h);
            return (
              <button key={h} onClick={() => setCategoriaActiva(h)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left hover:border-purple-300 transition active:scale-95">
                <span className="text-3xl mb-2 block">{emoji}</span>
                <p className="font-bold text-gray-900 text-sm leading-tight mb-2">{nombre}</p>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{background: conteo > 0 ? '#F5F0FF' : '#F3F4F6', color: conteo > 0 ? MORADO : '#9CA3AF'}}>
                  {conteo} flekser{conteo !== 1 ? 's' : ''}
                </span>
              </button>
            );
          })}
          <button onClick={() => setCategoriaActiva(CATEGORIA_OTROS)}
            className="bg-white rounded-2xl p-4 shadow-sm border border-dashed border-gray-300 text-left hover:border-purple-300 transition active:scale-95">
            <span className="text-3xl mb-2 block">✨</span>
            <p className="font-bold text-gray-900 text-sm leading-tight mb-2">Otros / Sin definir</p>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{background: '#F5F0FF', color: MORADO}}>
              {conteoPorCategoria(CATEGORIA_OTROS)} fleksers
            </span>
          </button>
        </div>
      </div>
      <Nav activo="catalogo" />
    </main>
  );

  // ── VISTA: LISTADO DE FLEKSERS ──
  return (
    <main className="min-h-screen pb-32" style={{background: '#F8FAFC'}}>
      <div className="bg-white px-6 pt-12 pb-4 shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto">
          <button onClick={() => setCategoriaActiva(null)} className="flex items-center gap-2 text-gray-400 text-sm font-semibold mb-3 hover:text-gray-600 transition">
            ← Volver a categorías
          </button>
          <h1 className="font-extrabold text-gray-900 text-xl mb-1">{quitarEmoji(categoriaActiva)}</h1>
          <p className="text-gray-400 text-sm">{fleksersFiltrados.length} flekser{fleksersFiltrados.length !== 1 ? 's' : ''} disponible{fleksersFiltrados.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 pt-4">
        <div className="flex gap-2 mb-4">
          <input type="text" placeholder="📍 Filtrar por ciudad..." value={ciudadFiltro} onChange={e => setCiudadFiltro(e.target.value)}
            className="flex-1 p-3 rounded-xl border-2 border-gray-200 focus:border-purple-300 outline-none text-gray-900 text-sm transition bg-white"/>
          <button onClick={() => setSoloVerificados(!soloVerificados)}
            className="px-3 rounded-xl text-xs font-bold border-2 transition whitespace-nowrap"
            style={{borderColor: soloVerificados ? '#22C55E' : '#E5E7EB', background: soloVerificados ? '#F0FDF4' : 'white', color: soloVerificados ? '#15803D' : '#6B7280'}}>
            ✅ Verificados
          </button>
        </div>

        {hayFiltros && <button onClick={limpiarFiltros} className="text-xs font-bold hover:underline mb-3 block" style={{color: MORADO}}>Limpiar filtros ✕</button>}

        {fleksersFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-bold text-gray-900 mb-1">Sin Fleksers en esta categoría</p>
            <p className="text-gray-400 text-sm">Intenta con otra categoría o quita los filtros</p>
            {hayFiltros && <button onClick={limpiarFiltros} className="mt-4 px-6 py-2 text-white rounded-2xl font-bold text-sm" style={{background: MORADO}}>Limpiar filtros</button>}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {fleksersFiltrados.map(f => (
              <div key={f.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <a href={`/perfil/${f.id}`} className="block">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0" style={{background: MORADO}}>
                      {f.foto_url ? <img src={f.foto_url} alt={f.nombre} className="w-full h-full object-cover"/> : <span className="text-white font-extrabold text-xl">{f.nombre?.charAt(0)?.toUpperCase()}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-extrabold text-gray-900">{f.nombre}</p>
                        {f.verificado && <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">✅</span>}
                        {f.progreso_perfil === 100 && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{background: '#F5F0FF', color: MORADO}}>🏆 100%</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs text-yellow-500 font-bold">⭐ {f.calificacion || '5.0'}</span>
                        {f.ciudad && <span className="text-xs text-gray-400">📍 {f.ciudad}</span>}
                      </div>
                      <p className="text-xs font-semibold text-gray-500 mt-1">💼 {f.trabajos_completados || 0} trabajo{(f.trabajos_completados || 0) !== 1 ? 's' : ''} completado{(f.trabajos_completados || 0) !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  {f.descripcion && <p className="text-xs text-gray-500 mb-2 leading-relaxed line-clamp-2">{f.descripcion}</p>}

                  {f.habilidades?.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {f.habilidades.slice(0, 4).map((h: string) => (
                        <span key={h} className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                          style={{background: h === categoriaActiva ? MORADO : '#F5F0FF', color: h === categoriaActiva ? 'white' : MORADO, borderColor: h === categoriaActiva ? MORADO : '#DDD6FE'}}>
                          {h}
                        </span>
                      ))}
                      {f.habilidades.length > 4 && <span className="text-xs bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">+{f.habilidades.length - 4} más</span>}
                    </div>
                  ) : categoriaActiva === CATEGORIA_OTROS && (
                    <p className="text-xs text-gray-400 italic mb-3">Aún no definió sus habilidades</p>
                  )}
                </a>
                <div className="flex gap-2">
                  <a href={`/publicar?para=${f.id}`} className="flex-1 py-2.5 text-white rounded-xl font-bold text-xs text-center" style={{background: MORADO}}>🎯 Enviar solicitud</a>
                  <a href={`/perfil/${f.id}`} className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-bold text-xs text-center hover:border-gray-400 transition">Ver perfil →</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Nav activo="catalogo" />
    </main>
  );
}