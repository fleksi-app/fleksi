'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';

const todosLosBadges = [
  { tipo: 'nuevo', nombre: 'Nuevo', emoji: '🆕' },
  { tipo: 'primer_trabajo', nombre: 'Primer trabajo', emoji: '🎯' },
  { tipo: 'cinco_trabajos', nombre: '5 trabajos', emoji: '🔥' },
  { tipo: 'diez_trabajos', nombre: '10 trabajos', emoji: '💎' },
  { tipo: 'top_rated', nombre: 'Top Rated', emoji: '⭐' },
  { tipo: 'perfecto', nombre: 'Perfección', emoji: '✨' },
  { tipo: 'verificado', nombre: 'Verificado', emoji: '✅' },
  { tipo: 'viajero', nombre: 'Viajero', emoji: '✈️' },
  { tipo: 'perfil_completo', nombre: 'Perfil completo', emoji: '🏆' },
  { tipo: 'fundador', nombre: 'Fundador', emoji: '🏅' },
  { tipo: 'pionero', nombre: 'Pionero', emoji: '🚀' },
];

function BotonCompartirPerfil({ perfil }: { perfil: any }) {
  const [copiado, setCopiado] = useState(false);

  const handleCompartir = async () => {
    const url = `${window.location.origin}/perfil/${perfil.id}`;
    const nombre = perfil.nombre?.split(' ')[0] || 'Flekser';
    const habilidades = perfil.habilidades?.slice(0, 2).join(', ') || 'servicios';
    const texto = `⚡ ${perfil.nombre} está en Fleksi\n🛠️ Ofrece: ${habilidades}\n⭐ ${perfil.calificacion || '5.0'} · ${perfil.trabajos_completados || 0} trabajos\n\nContrátalo en Fleksi 👇`;
    if (navigator.share) {
      try { await navigator.share({ title: `Perfil de ${nombre} en Fleksi`, text: texto, url }); } catch (e) {}
    } else {
      try {
        await navigator.clipboard.writeText(`${texto}\n${url}`);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      } catch (e) {}
    }
  };

  return (
    <button onClick={handleCompartir}
      className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-white/30 transition border border-white/30 flex items-center gap-1 active:scale-95">
      {copiado ? '✅ Copiado' : '🔗 Compartir'}
    </button>
  );
}

export default function PerfilPublico() {
  const params = useParams();
  const id = params?.id as string;
  const [perfil, setPerfil] = useState<any>(null);
  const [reseñas, setReseñas] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [portafolio, setPortafolio] = useState<{ foto: string; titulo: string }[]>([]);
  const [cargando, setCargando] = useState(true);
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);
  const [usuarioActual, setUsuarioActual] = useState<any>(null);

  useEffect(() => { if (id) cargar(); }, [id]);

  const cargar = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: perfActual } = await supabase.from('usuarios').select('id, nombre').eq('id', user.id).single();
        setUsuarioActual(perfActual);
      }
      const { data } = await supabase.from('usuarios')
        .select('id, nombre, foto_url, rol, ciudad, descripcion, calificacion, trabajos_completados, habilidades, ciudades_visitadas, verificado')
        .eq('id', id).single();
      if (!data) { window.location.href = '/'; return; }
      setPerfil(data);

      const { data: reseñasData } = await supabase.from('reseñas')
        .select('*, usuarios!reseñas_cliente_id_fkey(nombre, foto_url)')
        .eq('prestador_id', id).eq('es_del_prestador', false).order('created_at', { ascending: false });
      setReseñas(reseñasData || []);

      const { data: badgesData } = await supabase.from('badges').select('*').eq('usuario_id', id);
      setBadges(badgesData || []);

      const { data: appsData } = await supabase.from('aplicaciones')
        .select('fotos_despues, servicios(titulo)').eq('prestador_id', id).eq('estado', 'completado');
      const fotos: { foto: string; titulo: string }[] = [];
      (appsData || []).forEach((app: any) => {
        (app.fotos_despues || []).forEach((url: string) => {
          fotos.push({ foto: url, titulo: app.servicios?.titulo || 'Trabajo completado' });
        });
      });
      setPortafolio(fotos);
    } catch (err) { console.error(err); }
    finally { setCargando(false); }
  };

  const tieneBadge = (tipo: string) => badges.some(b => b.tipo === tipo);
  const iniciarChat = () => { if (!usuarioActual) { window.location.href = '/login'; return; } window.location.href = '/chat'; };

  if (cargando) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Cargando perfil...</p>
      </div>
    </main>
  );

  if (!perfil) return null;

  const promedioEstrellas = reseñas.length > 0
    ? (reseñas.reduce((acc, r) => acc + r.estrellas, 0) / reseñas.length).toFixed(1)
    : perfil.calificacion || '5.0';
  const nombreCorto = perfil.nombre?.split(' ')[0];

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 pt-12 pb-8">
        <div className="max-w-md mx-auto flex justify-between items-center mb-6">
          <button onClick={() => window.history.back()} className="text-white/70 text-sm hover:text-white transition flex items-center gap-1">
            ← Regresar
          </button>
          <div className="flex items-center gap-2">
            <BotonCompartirPerfil perfil={perfil} />
            {usuarioActual && usuarioActual.id !== id && (
              <button onClick={iniciarChat} className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-white/30 transition border border-white/30">
                💬 Mensaje
              </button>
            )}
          </div>
        </div>
        <div className="max-w-md mx-auto flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/20 border-2 border-white/40 flex items-center justify-center flex-shrink-0">
            {perfil.foto_url
              ? <img src={perfil.foto_url} alt={perfil.nombre} className="w-full h-full object-cover"/>
              : <span className="text-white font-extrabold text-3xl">{perfil.nombre?.charAt(0)?.toUpperCase()}</span>}
          </div>
          <div>
            <h1 className="font-extrabold text-white text-2xl">{perfil.nombre}</h1>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span className="text-xs bg-white/20 text-white font-semibold px-2 py-0.5 rounded-full border border-white/30">
                {perfil.rol === 'empresa' ? '🏢 Empresa' : perfil.rol === 'viajero' ? '✈️ Viajero' : '⚡ Flekser'}
              </span>
              {perfil.ciudad && <span className="text-xs text-white/70">📍 {perfil.ciudad}</span>}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {tieneBadge('verificado') && <span className="text-xs bg-green-400/30 text-white font-semibold px-2 py-0.5 rounded-full border border-green-300/40">✅ Verificado</span>}
              {tieneBadge('perfil_completo') && <span className="text-xs bg-yellow-400/30 text-white font-semibold px-2 py-0.5 rounded-full border border-yellow-300/40">🏆 Perfil completo</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 mt-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold text-yellow-500">{promedioEstrellas}</p>
              <p className="text-xs text-gray-400">⭐ Rating</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold text-gray-900">{perfil.trabajos_completados || 0}</p>
              <p className="text-xs text-gray-400">Trabajos</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold text-purple-600">{reseñas.length}</p>
              <p className="text-xs text-gray-400">Reseñas</p>
            </div>
          </div>
          {perfil.descripcion && <p className="text-gray-600 text-sm leading-relaxed">{perfil.descripcion}</p>}
        </div>

        {perfil.habilidades?.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <h3 className="font-extrabold text-gray-900 mb-3">🛠️ Habilidades</h3>
            <div className="flex flex-wrap gap-2">
              {perfil.habilidades.map((h: string) => (
                <span key={h} className="px-3 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white">{h}</span>
              ))}
            </div>
          </div>
        )}

        {badges.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <h3 className="font-extrabold text-gray-900 mb-4">🏅 Insignias</h3>
            <div className="grid grid-cols-4 gap-3">
              {todosLosBadges.filter(b => tieneBadge(b.tipo)).map((badge) => (
                <div key={badge.tipo} className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 shadow-sm flex items-center justify-center text-2xl mb-1 mx-auto">{badge.emoji}</div>
                  <p className="text-xs text-gray-500 font-semibold leading-tight">{badge.nombre}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-gray-900">💬 Reseñas</h3>
            <div className="flex items-center gap-1">
              <span className="text-yellow-500 font-bold">{promedioEstrellas}</span>
              <span className="text-yellow-500">⭐</span>
              <span className="text-xs text-gray-400 ml-1">({reseñas.length})</span>
            </div>
          </div>
          {reseñas.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-gray-400 text-sm">Sin reseñas todavía</p>
              <p className="text-gray-300 text-xs mt-1">Las reseñas aparecen después de completar trabajos</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {reseñas.map((r) => (
                <div key={r.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                      {r.usuarios?.foto_url
                        ? <img src={r.usuarios.foto_url} className="w-full h-full object-cover"/>
                        : <span className="text-white text-xs font-bold">{r.usuarios?.nombre?.charAt(0) || '?'}</span>}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">{r.usuarios?.nombre || 'Cliente'}</p>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(s => <span key={s} className={`text-sm ${s <= r.estrellas ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>)}
                        <span className="text-xs text-gray-400 ml-1">{new Date(r.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  {r.comentario && <p className="text-sm text-gray-600 italic">"{r.comentario}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {portafolio.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-gray-900">📸 Portafolio</h3>
              <span className="text-xs text-gray-400">{portafolio.length} foto{portafolio.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {portafolio.map((item, i) => (
                <button key={i} onClick={() => setFotoAmpliada(item.foto)} className="relative group overflow-hidden rounded-xl aspect-square bg-gray-100">
                  <img src={item.foto} alt={item.titulo} className="w-full h-full object-cover group-hover:scale-105 transition duration-200"/>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-xl">
                    <p className="text-white text-xs font-semibold truncate">{item.titulo}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {perfil.ciudades_visitadas?.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <h3 className="font-extrabold text-gray-900 mb-3">🗺️ Ciudades donde ha trabajado</h3>
            <div className="flex flex-wrap gap-2">
              {perfil.ciudades_visitadas.map((c: string, i: number) => (
                <span key={i} className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-600">📍 {c}</span>
              ))}
            </div>
          </div>
        )}

        {usuarioActual && usuarioActual.id !== id && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <p className="font-extrabold text-gray-900 text-lg mb-1">¿Quieres contratar a {nombreCorto}?</p>
            <p className="text-gray-400 text-sm mb-4">Envíale una solicitud directa o un mensaje para hablar primero.</p>
            <div className="flex flex-col gap-2">
              <a href={`/publicar?para=${id}`} className="block w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-extrabold text-center hover:opacity-90 transition">
                🎯 Enviar solicitud a {nombreCorto}
              </a>
              <button onClick={iniciarChat} className="w-full py-3.5 border-2 border-gray-200 text-gray-700 rounded-2xl font-bold hover:border-purple-400 transition">
                💬 Enviar mensaje directo
              </button>
            </div>
          </div>
        )}

        {!usuarioActual && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-5 mb-4">
            <p className="text-white font-extrabold text-lg mb-1">¿Quieres contratar a {nombreCorto}?</p>
            <p className="text-white/70 text-sm mb-4">Únete a Fleksi gratis y publica tu primer trabajo en minutos.</p>
            <div className="flex flex-col gap-2">
              <a href="/registro" className="block w-full py-3.5 bg-white text-purple-600 rounded-2xl font-extrabold text-center hover:opacity-90 transition">
                Crear cuenta gratis →
              </a>
              <a href="/login" className="block w-full py-3.5 bg-white/20 text-white rounded-2xl font-bold text-center hover:bg-white/30 transition border border-white/30">
                Ya tengo cuenta → Iniciar sesión
              </a>
            </div>
          </div>
        )}
      </div>

      {fotoAmpliada && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" onClick={() => setFotoAmpliada(null)}>
          <div className="relative max-w-sm w-full">
            <img src={fotoAmpliada} className="w-full rounded-2xl shadow-2xl object-contain max-h-[80vh]"/>
            <button onClick={() => setFotoAmpliada(null)} className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-700 font-bold shadow-lg text-lg">✕</button>
          </div>
        </div>
      )}
    </main>
  );
}