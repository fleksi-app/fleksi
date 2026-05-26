'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Nav from '@/lib/nav';

const habilidades = [
  '🧹 Limpieza del hogar', '🌿 Jardinería', '🎨 Pintura',
  '🔧 Mantenimiento general', '⚡ Electricidad', '🚿 Plomería',
  '🚚 Fletes y traslados', '🪑 Armado de muebles', '🔩 Mecánica básica',
  '🔑 Cerrajería', '📺 Instalación TV/repisas/cortinas', '🪵 Carpintería ligera',
  '📦 Mudanza ligera / Ayudante', '👔 Planchado / Lavandería', '💅 Uñas / Estética',
  '🎪 Staff para eventos', '🍽️ Mesero', '🍳 Cocinero particular',
  '🚗 Chofer ejecutivo', '🗣️ Intérprete / Traductor',
];

const todosLosBadges = [
  { tipo: 'nuevo', nombre: 'Nuevo', emoji: '🆕', desc: 'Recién unido a Fleksi' },
  { tipo: 'primer_trabajo', nombre: 'Primer trabajo', emoji: '🎯', desc: 'Completó su primer trabajo' },
  { tipo: 'cinco_trabajos', nombre: '5 trabajos', emoji: '🔥', desc: 'Completó 5 trabajos' },
  { tipo: 'diez_trabajos', nombre: '10 trabajos', emoji: '💎', desc: 'Completó 10 trabajos' },
  { tipo: 'top_rated', nombre: 'Top Rated', emoji: '⭐', desc: 'Calificación 4.8 o más' },
  { tipo: 'perfecto', nombre: 'Perfección', emoji: '✨', desc: 'Calificación perfecta 5.0' },
  { tipo: 'verificado', nombre: 'Verificado', emoji: '✅', desc: 'Identidad verificada' },
  { tipo: 'viajero', nombre: 'Viajero', emoji: '✈️', desc: 'Trabajó en 2+ ciudades' },
];

export default function Perfil() {
  const [usuario, setUsuario] = useState<any>(null);
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [habilidadesSeleccionadas, setHabilidadesSeleccionadas] = useState<string[]>([]);
  const [habilidadCustom, setHabilidadCustom] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [badges, setBadges] = useState<any[]>([]);
  const [reseñas, setReseñas] = useState<any[]>([]);
  const [portafolio, setPortafolio] = useState<{ foto: string; titulo: string }[]>([]);
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);
  const [modoViajero, setModoViajero] = useState(false);
  const [ciudadActual, setCiudadActual] = useState('');
  const [ciudadesVisitadas, setCiudadesVisitadas] = useState<string[]>([]);
  const [activandoViajero, setActivandoViajero] = useState(false);
  const [verificacion, setVerificacion] = useState<any>(null);
  const [totalGanado, setTotalGanado] = useState(0);
  const [walletSaldo, setWalletSaldo] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { cargarPerfil(); }, []);

  const cargarPerfil = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }

      const { data } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
      if (data) {
        setUsuario({ ...data, id: user.id, email: user.email });
        setNombre(data.nombre || '');
        setTelefono(data.telefono || '');
        setDescripcion(data.descripcion || '');
        setCiudad(data.ciudad || '');
        setHabilidadesSeleccionadas(data.habilidades || []);
        setFotoUrl(data.foto_url || '');
        setModoViajero(data.modo_viajero || false);
        setCiudadActual(data.ciudad || '');
        setCiudadesVisitadas(data.ciudades_visitadas || []);
        setWalletSaldo(data.wallet_saldo || 0);
      }

      const { data: badgesData } = await supabase.from('badges').select('*').eq('usuario_id', user.id);
      setBadges(badgesData || []);

      const { data: reseñasData } = await supabase
        .from('reseñas')
        .select('*, usuarios!reseñas_cliente_id_fkey(nombre, foto_url)')
        .eq('prestador_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      setReseñas(reseñasData || []);

      const { data: appsData } = await supabase
        .from('aplicaciones')
        .select('fotos_despues, precio_ofrecido, servicios(titulo, presupuesto)')
        .eq('prestador_id', user.id)
        .eq('estado', 'completado');

      const fotosPortafolio: { foto: string; titulo: string }[] = [];
      let total = 0;
      (appsData || []).forEach((app: any) => {
        total += app.precio_ofrecido || app.servicios?.presupuesto || 0;
        (app.fotos_despues || []).forEach((url: string) => {
          fotosPortafolio.push({ foto: url, titulo: app.servicios?.titulo || 'Trabajo completado' });
        });
      });
      setPortafolio(fotosPortafolio);
      setTotalGanado(total);

      const { data: verifData } = await supabase
        .from('verificaciones').select('*').eq('usuario_id', user.id).single();
      setVerificacion(verifData || null);

      try {
        await supabase.rpc('asignar_badges', { user_id: user.id });
        const { data: newBadges } = await supabase.from('badges').select('*').eq('usuario_id', user.id);
        setBadges(newBadges || []);
      } catch (e) {}

    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const toggleModoViajero = async () => {
    if (!usuario) return;
    setActivandoViajero(true);
    try {
      const nuevoModo = !modoViajero;
      let nuevasCiudades = ciudadesVisitadas;
      if (nuevoModo && ciudadActual && !ciudadesVisitadas.includes(ciudadActual)) {
        nuevasCiudades = [...ciudadesVisitadas, ciudadActual];
        setCiudadesVisitadas(nuevasCiudades);
      }
      await supabase.from('usuarios').update({ modo_viajero: nuevoModo, ciudades_visitadas: nuevasCiudades }).eq('id', usuario.id);
      setModoViajero(nuevoModo);
    } finally {
      setActivandoViajero(false);
    }
  };

  const actualizarCiudadViajero = async () => {
    if (!usuario || !ciudadActual.trim()) return;
    setActivandoViajero(true);
    try {
      let nuevasCiudades = ciudadesVisitadas;
      if (!ciudadesVisitadas.includes(ciudadActual.trim())) {
        nuevasCiudades = [...ciudadesVisitadas, ciudadActual.trim()];
        setCiudadesVisitadas(nuevasCiudades);
      }
      await supabase.from('usuarios').update({ ciudad: ciudadActual.trim(), ciudades_visitadas: nuevasCiudades }).eq('id', usuario.id);
      alert('✅ Ciudad actualizada');
    } finally {
      setActivandoViajero(false);
    }
  };

  const handleFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !usuario) return;
    setSubiendoFoto(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${usuario.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatares').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatares').getPublicUrl(path);
      const url = urlData.publicUrl + '?t=' + Date.now();
      await supabase.from('usuarios').update({ foto_url: url }).eq('id', usuario.id);
      setFotoUrl(url);
    } catch (err: any) {
      alert('Error al subir foto: ' + err.message);
    } finally {
      setSubiendoFoto(false);
    }
  };

  const guardarPerfil = async () => {
    setGuardando(true);
    await supabase.from('usuarios').update({ nombre, telefono, descripcion, ciudad, habilidades: habilidadesSeleccionadas }).eq('id', usuario.id);
    setGuardando(false);
    setEditando(false);
    cargarPerfil();
  };

  const toggleHabilidad = (h: string) => {
    setHabilidadesSeleccionadas(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]);
  };

  const agregarHabilidadCustom = () => {
    const val = habilidadCustom.trim();
    if (val && !habilidadesSeleccionadas.includes(val)) {
      setHabilidadesSeleccionadas(prev => [...prev, val]);
      setHabilidadCustom('');
    }
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const tieneBadge = (tipo: string) => badges.some(b => b.tipo === tipo);

  const verificacionInfo = () => {
    if (!verificacion) return {
      bg: 'bg-gradient-to-r from-blue-50 to-purple-50', border: 'border-blue-100',
      emoji: '🪪', titulo: 'Verifica tu identidad',
      texto: 'Genera más confianza y aparece primero en búsquedas',
      boton: 'Verificarme ahora', botonColor: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white',
    };
    const estados: { [key: string]: any } = {
      en_revision: { bg: 'bg-yellow-50', border: 'border-yellow-200', emoji: '🔍', titulo: 'Verificación en revisión', texto: 'Estamos revisando tus documentos. Te notificaremos pronto.', boton: 'Ver estado', botonColor: 'bg-yellow-100 text-yellow-700' },
      aprobado: { bg: 'bg-green-50', border: 'border-green-200', emoji: '✅', titulo: '¡Identidad verificada!', texto: 'Tu perfil muestra el badge de confianza.', boton: 'Ver documentos', botonColor: 'bg-green-100 text-green-700' },
      rechazado: { bg: 'bg-red-50', border: 'border-red-200', emoji: '❌', titulo: 'Verificación rechazada', texto: verificacion.motivo_rechazo || 'Revisa tus documentos y vuelve a intentarlo.', boton: 'Reintentar', botonColor: 'bg-red-100 text-red-700' },
    };
    return estados[verificacion.estado] || estados['en_revision'];
  };

  if (cargando) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando perfil...</p>
        </div>
      </main>
    );
  }

  const verif = verificacionInfo();

  return (
    <main className="min-h-screen bg-gray-50 pb-32">

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 pt-12 pb-20">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <h1 className="text-white font-extrabold text-xl">Mi Perfil</h1>
          <div className="flex items-center gap-3">
            {usuario?.email === 'fernando.najera.nm@gmail.com' && (
              <a href="/admin" className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-white/30 transition">
                ⚙️ Admin
              </a>
            )}
            <button onClick={cerrarSesion} className="text-white/70 text-sm hover:text-white transition">
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 -mt-12">

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                {fotoUrl ? (
                  <img src={fotoUrl} alt="Foto de perfil" className="w-full h-full object-cover"/>
                ) : (
                  <span className="text-white font-extrabold text-2xl">{nombre ? nombre.charAt(0).toUpperCase() : 'U'}</span>
                )}
              </div>
              {editando && (
                <button onClick={() => fileInputRef.current?.click()} disabled={subiendoFoto}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs shadow-lg">
                  {subiendoFoto ? '⏳' : '📷'}
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFoto} className="hidden"/>
            </div>
            <div className="flex-1">
              {editando ? (
                <input value={nombre} onChange={(e) => setNombre(e.target.value)}
                  className="w-full p-2 rounded-xl border-2 border-purple-400 outline-none text-gray-900 font-bold mb-1" placeholder="Tu nombre"/>
              ) : (
                <h2 className="font-extrabold text-gray-900 text-lg">{nombre || 'Sin nombre'}</h2>
              )}
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="text-xs bg-purple-100 text-purple-600 font-semibold px-2 py-0.5 rounded-full">
                  ⚡ {usuario?.rol === 'viajero' ? 'Viajero' : 'Flekser'}
                </span>
                {modoViajero && <span className="text-xs bg-blue-100 text-blue-600 font-semibold px-2 py-0.5 rounded-full">✈️ Modo viajero ON</span>}
                {tieneBadge('verificado') && <span className="text-xs bg-green-100 text-green-600 font-semibold px-2 py-0.5 rounded-full">✅ Verificado</span>}
                {tieneBadge('top_rated') && <span className="text-xs bg-yellow-100 text-yellow-600 font-semibold px-2 py-0.5 rounded-full">⭐ Top Rated</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold text-purple-600">{usuario?.calificacion || '5.0'}</p>
              <p className="text-xs text-gray-400">⭐ Calificación</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold text-gray-900">{usuario?.trabajos_completados || '0'}</p>
              <p className="text-xs text-gray-400">Trabajos</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold text-gray-900">{ciudadesVisitadas.length}</p>
              <p className="text-xs text-gray-400">Ciudades</p>
            </div>
          </div>

          {!editando ? (
            <button onClick={() => setEditando(true)} className="w-full py-3 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold hover:border-purple-400 transition">
              ✏️ Editar perfil
            </button>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => setEditando(false)} className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold transition">Cancelar</button>
              <button onClick={guardarPerfil} disabled={guardando} className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold disabled:opacity-50 transition">
                {guardando ? 'Guardando...' : 'Guardar ✓'}
              </button>
            </div>
          )}
        </div>

        {/* Banner ganancias */}
        <a href="/earnings"
          className="flex items-center justify-between bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-5 shadow-sm mb-3 hover:opacity-90 transition">
          <div>
            <p className="text-white/80 text-xs font-semibold mb-0.5">Total ganado</p>
            <p className="text-white font-extrabold text-2xl">${totalGanado.toLocaleString()} <span className="text-lg font-normal">MXN</span></p>
            <p className="text-white/70 text-xs mt-0.5">{usuario?.trabajos_completados || 0} trabajos completados</p>
          </div>
          <div className="text-right">
            <span className="text-4xl">💰</span>
            <p className="text-white text-xs font-bold mt-1">Ver historial →</p>
          </div>
        </a>

        {/* Banner Wallet */}
        <a href="/wallet"
          className="flex items-center justify-between bg-gradient-to-r from-teal-500 to-cyan-600 rounded-2xl p-5 shadow-sm mb-4 hover:opacity-90 transition">
          <div>
            <p className="text-white/80 text-xs font-semibold mb-0.5">💳 Fleksi Wallet</p>
            <p className="text-white font-extrabold text-2xl">${walletSaldo.toFixed(2)} <span className="text-lg font-normal">MXN</span></p>
            <p className="text-white/70 text-xs mt-0.5">Saldo disponible para retirar</p>
          </div>
          <div className="text-right">
            <span className="text-4xl">🏦</span>
            <p className="text-white text-xs font-bold mt-1">Ver wallet →</p>
          </div>
        </a>

        <a href="/verificacion" className={`block rounded-2xl p-5 shadow-sm border mb-4 transition hover:opacity-90 ${verif.bg} ${verif.border}`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{verif.emoji}</span>
                <h3 className="font-extrabold text-gray-900">{verif.titulo}</h3>
              </div>
              <p className="text-xs text-gray-500 ml-7">{verif.texto}</p>
            </div>
            <span className={`flex-shrink-0 ml-3 px-3 py-2 rounded-xl text-xs font-bold ${verif.botonColor}`}>{verif.boton} →</span>
          </div>
        </a>

        <div className={`rounded-2xl p-5 shadow-sm border mb-4 transition ${modoViajero ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-transparent' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className={`font-extrabold text-lg ${modoViajero ? 'text-white' : 'text-gray-900'}`}>✈️ Modo Viajero</h3>
              <p className={`text-xs mt-0.5 ${modoViajero ? 'text-white/70' : 'text-gray-400'}`}>
                {modoViajero ? 'Activo — apareces en búsquedas de tu ciudad actual' : 'Actívalo cuando estés de viaje'}
              </p>
            </div>
            <button onClick={toggleModoViajero} disabled={activandoViajero}
              className={`w-14 h-7 rounded-full transition-all duration-300 relative ${modoViajero ? 'bg-white' : 'bg-gray-200'}`}>
              <div className={`w-6 h-6 rounded-full absolute top-0.5 transition-all duration-300 shadow-sm ${modoViajero ? 'left-7 bg-purple-600' : 'left-0.5 bg-white'}`}/>
            </button>
          </div>
          {modoViajero && (
            <div className="mt-3">
              <p className="text-white/80 text-xs font-semibold mb-2">📍 ¿Dónde estás ahora?</p>
              <div className="flex gap-2">
                <input value={ciudadActual} onChange={(e) => setCiudadActual(e.target.value)}
                  placeholder="Ej. Monterrey, Guadalajara..."
                  className="flex-1 p-3 rounded-xl bg-white/20 text-white placeholder-white/50 outline-none border border-white/30 text-sm font-semibold"/>
                <button onClick={actualizarCiudadViajero} disabled={activandoViajero}
                  className="px-4 py-3 bg-white text-purple-600 rounded-xl font-bold text-sm hover:bg-white/90 transition disabled:opacity-50">✓</button>
              </div>
            </div>
          )}
          {ciudadesVisitadas.length > 0 && (
            <div className="mt-3">
              <p className={`text-xs font-semibold mb-2 ${modoViajero ? 'text-white/80' : 'text-gray-500'}`}>🗺️ Ciudades donde has trabajado</p>
              <div className="flex flex-wrap gap-2">
                {ciudadesVisitadas.map((c, i) => (
                  <span key={i} className={`text-xs font-semibold px-3 py-1 rounded-full ${modoViajero ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>📍 {c}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-extrabold text-gray-900 mb-3">📱 Teléfono</h3>
          {editando ? (
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full p-3 rounded-xl border-2 border-purple-400 outline-none text-gray-900" placeholder="55 1234 5678"/>
          ) : (
            <p className="text-gray-600">{telefono || 'Sin teléfono registrado'}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-extrabold text-gray-900 mb-3">📍 Ciudad base</h3>
          {editando ? (
            <input value={ciudad} onChange={(e) => setCiudad(e.target.value)} className="w-full p-3 rounded-xl border-2 border-purple-400 outline-none text-gray-900" placeholder="Ej. Ciudad de México"/>
          ) : (
            <p className="text-gray-600">{ciudad || 'Sin ciudad registrada'}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-extrabold text-gray-900 mb-3">📝 Sobre mí</h3>
          {editando ? (
            <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3}
              placeholder="Cuéntale a los clientes sobre ti y tu experiencia..."
              className="w-full p-3 rounded-xl border-2 border-purple-400 outline-none text-gray-900 resize-none"/>
          ) : (
            <p className="text-gray-600">{descripcion || 'Agrega una descripción de tu perfil'}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-extrabold text-gray-900 mb-4">🏅 Insignias</h3>
          <div className="grid grid-cols-4 gap-3">
            {todosLosBadges.map((badge) => {
              const activo = tieneBadge(badge.tipo);
              return (
                <div key={badge.tipo} className={`text-center transition ${!activo ? 'opacity-30' : ''}`}>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-1 mx-auto ${activo ? 'bg-gradient-to-r from-blue-50 to-purple-50 shadow-sm' : 'bg-gray-100'}`}>
                    {badge.emoji}
                  </div>
                  <p className="text-xs text-gray-500 font-semibold leading-tight">{badge.nombre}</p>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 text-center mt-3">{badges.length} de {todosLosBadges.length} insignias desbloqueadas</p>
        </div>

        {reseñas.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <h3 className="font-extrabold text-gray-900 mb-4">💬 Reseñas recientes</h3>
            <div className="flex flex-col gap-3">
              {reseñas.map((r) => (
                <div key={r.id} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">{r.usuarios?.nombre?.charAt(0) || '?'}</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{r.usuarios?.nombre || 'Cliente'}</p>
                      <p className="text-xs text-yellow-500">{'⭐'.repeat(r.estrellas)}</p>
                    </div>
                  </div>
                  {r.comentario && <p className="text-sm text-gray-600 italic">"{r.comentario}"</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {portafolio.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-gray-900">📸 Mi portafolio</h3>
              <span className="text-xs text-gray-400">{portafolio.length} foto{portafolio.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {portafolio.map((item, i) => (
                <button key={i} onClick={() => setFotoAmpliada(item.foto)}
                  className="relative group overflow-hidden rounded-xl aspect-square bg-gray-100">
                  <img src={item.foto} alt={item.titulo} className="w-full h-full object-cover group-hover:scale-105 transition duration-200"/>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition duration-200 rounded-xl"/>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-xl">
                    <p className="text-white text-xs font-semibold truncate">{item.titulo}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-extrabold text-gray-900 mb-3">🛠️ Mis habilidades</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {habilidades.map((h) => (
              <button key={h} onClick={() => editando && toggleHabilidad(h)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition ${habilidadesSeleccionadas.includes(h) ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-gray-100 text-gray-500'} ${editando ? 'cursor-pointer' : 'cursor-default'}`}>
                {h}
              </button>
            ))}
            {habilidadesSeleccionadas.filter(h => !habilidades.includes(h)).map((h) => (
              <span key={h} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                {h}
                {editando && <button onClick={() => toggleHabilidad(h)} className="ml-1 text-white/70 hover:text-white">✕</button>}
              </span>
            ))}
          </div>
          {editando && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
              <input type="text" placeholder="Agregar habilidad personalizada..."
                value={habilidadCustom} onChange={(e) => setHabilidadCustom(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && agregarHabilidadCustom()}
                className="flex-1 p-3 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900 text-sm"/>
              <button onClick={agregarHabilidadCustom} className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold text-sm">+ Agregar</button>
            </div>
          )}
          {!editando && habilidadesSeleccionadas.length === 0 && (
            <p className="text-gray-400 text-sm">Edita tu perfil para agregar habilidades</p>
          )}
        </div>

      </div>

      {fotoAmpliada && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" onClick={() => setFotoAmpliada(null)}>
          <div className="relative max-w-sm w-full">
            <img src={fotoAmpliada} className="w-full rounded-2xl shadow-2xl object-contain max-h-[80vh]"/>
            <button onClick={() => setFotoAmpliada(null)} className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-700 font-bold shadow-lg text-lg">✕</button>
          </div>
        </div>
      )}

      <Nav activo="perfil" />
    </main>
  );
}