'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const giros = [
  '🧹 Limpieza y mantenimiento',
  '🍽️ Restaurante y hostelería',
  '🏨 Hotel y hospedaje',
  '🏗️ Construcción y remodelación',
  '📦 Logística y mensajería',
  '🎪 Eventos y entretenimiento',
  '🏥 Salud y cuidado personal',
  '📚 Educación y capacitación',
  '💻 Tecnología y sistemas',
  '🔧 Servicios industriales',
  '🛒 Comercio y retail',
  '🌿 Jardinería y paisajismo',
  '🚗 Transporte y movilidad',
  '💼 Servicios profesionales',
  '🎨 Diseño y creatividad',
];

const tamaños = [
  { id: '1-10', label: '1-10 empleados', emoji: '👤' },
  { id: '11-50', label: '11-50 empleados', emoji: '👥' },
  { id: '51-200', label: '51-200 empleados', emoji: '🏢' },
  { id: '200+', label: 'Más de 200', emoji: '🏙️' },
];

export default function PerfilEmpresa() {
  const [usuario, setUsuario] = useState<any>(null);
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [giro, setGiro] = useState('');
  const [rfc, setRfc] = useState('');
  const [sitioWeb, setSitioWeb] = useState('');
  const [tamañoEmpresa, setTamañoEmpresa] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [reseñas, setReseñas] = useState<any[]>([]);
  const [totalServicios, setTotalServicios] = useState(0);
  const [ciudadesCobertura, setCiudadesCobertura] = useState<string[]>([]);
  const [nuevaCiudad, setNuevaCiudad] = useState('');
  const [guardandoCiudad, setGuardandoCiudad] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { cargarPerfil(); }, []);

  const cargarPerfil = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }

    const { data } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
    if (data) {
      setUsuario({ ...data, id: user.id });
      setNombre(data.nombre || '');
      setTelefono(data.telefono || '');
      setDescripcion(data.descripcion || '');
      setGiro(data.giro || '');
      setRfc(data.rfc || '');
      setSitioWeb(data.sitio_web || '');
      setTamañoEmpresa(data.tamaño_empresa || '');
      setCiudad(data.ciudad || '');
      setFotoUrl(data.foto_url || '');
      setCiudadesCobertura(data.ciudades_cobertura || []);
    }

    const { count } = await supabase
      .from('servicios')
      .select('id', { count: 'exact' })
      .eq('cliente_id', user.id);
    setTotalServicios(count || 0);

    const { data: reseñasData } = await supabase
      .from('reseñas')
      .select('*, usuarios!reseñas_prestador_id_fkey(nombre, foto_url)')
      .eq('cliente_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    setReseñas(reseñasData || []);

    setCargando(false);
  };

  const agregarCiudad = async () => {
    const val = nuevaCiudad.trim();
    if (!val || ciudadesCobertura.includes(val)) return;
    setGuardandoCiudad(true);
    try {
      const nuevas = [...ciudadesCobertura, val];
      await supabase.from('usuarios')
        .update({ ciudades_cobertura: nuevas })
        .eq('id', usuario.id);
      setCiudadesCobertura(nuevas);
      setNuevaCiudad('');
    } finally {
      setGuardandoCiudad(false);
    }
  };

  const quitarCiudad = async (c: string) => {
    const nuevas = ciudadesCobertura.filter(x => x !== c);
    await supabase.from('usuarios')
      .update({ ciudades_cobertura: nuevas })
      .eq('id', usuario.id);
    setCiudadesCobertura(nuevas);
  };

  const handleFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !usuario) return;
    setSubiendoFoto(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${usuario.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatares').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatares').getPublicUrl(path);
      const url = urlData.publicUrl + '?t=' + Date.now();
      await supabase.from('usuarios').update({ foto_url: url }).eq('id', usuario.id);
      setFotoUrl(url);
    } catch (err: any) {
      alert('Error al subir logo: ' + err.message);
    } finally {
      setSubiendoFoto(false);
    }
  };

  const guardarPerfil = async () => {
    setGuardando(true);
    await supabase.from('usuarios').update({
      nombre, telefono, descripcion, giro, rfc,
      sitio_web: sitioWeb, tamaño_empresa: tamañoEmpresa, ciudad,
    }).eq('id', usuario.id);
    setGuardando(false);
    setEditando(false);
    cargarPerfil();
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
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

  return (
    <main className="min-h-screen bg-gray-50 pb-32">

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 pt-12 pb-20">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <h1 className="text-white font-extrabold text-xl">Mi Empresa</h1>
          <button onClick={cerrarSesion} className="text-white/70 text-sm hover:text-white transition">
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 -mt-12">

        {/* Tarjeta principal */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                {fotoUrl ? (
                  <img src={fotoUrl} alt="Logo empresa" className="w-full h-full object-cover"/>
                ) : (
                  <span className="text-white font-extrabold text-2xl">
                    {nombre ? nombre.charAt(0).toUpperCase() : '🏢'}
                  </span>
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
                  className="w-full p-2 rounded-xl border-2 border-purple-400 outline-none text-gray-900 font-bold mb-1"
                  placeholder="Nombre de la empresa"/>
              ) : (
                <h2 className="font-extrabold text-gray-900 text-lg">{nombre || 'Sin nombre'}</h2>
              )}
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="text-xs bg-purple-100 text-purple-600 font-semibold px-2 py-0.5 rounded-full">
                  🏢 Empresa
                </span>
                {ciudadesCobertura.length > 1 && (
                  <span className="text-xs bg-blue-100 text-blue-600 font-semibold px-2 py-0.5 rounded-full">
                    🗺️ Multi-ciudad
                  </span>
                )}
                {usuario?.verificado && (
                  <span className="text-xs bg-green-100 text-green-600 font-semibold px-2 py-0.5 rounded-full">
                    ✅ Verificada
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold text-purple-600">{totalServicios}</p>
              <p className="text-xs text-gray-400">Servicios</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold text-gray-900">{usuario?.trabajos_completados || 0}</p>
              <p className="text-xs text-gray-400">Completados</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold text-blue-600">{ciudadesCobertura.length}</p>
              <p className="text-xs text-gray-400">Ciudades</p>
            </div>
          </div>

          {!editando ? (
            <button onClick={() => setEditando(true)}
              className="w-full py-3 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold hover:border-purple-400 transition">
              ✏️ Editar perfil
            </button>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => setEditando(false)}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold">
                Cancelar
              </button>
              <button onClick={guardarPerfil} disabled={guardando}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold disabled:opacity-50">
                {guardando ? 'Guardando...' : 'Guardar ✓'}
              </button>
            </div>
          )}
        </div>

        {/* Cobertura multi-ciudad */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-extrabold text-gray-900">🗺️ Cobertura multi-ciudad</h3>
              <p className="text-xs text-gray-400 mt-0.5">Ciudades donde tu empresa opera y publica servicios</p>
            </div>
            {ciudadesCobertura.length > 0 && (
              <span className="text-xs bg-blue-100 text-blue-600 font-bold px-2 py-1 rounded-full">
                {ciudadesCobertura.length} ciudad{ciudadesCobertura.length !== 1 ? 'es' : ''}
              </span>
            )}
          </div>

          {/* Ciudades agregadas */}
          {ciudadesCobertura.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {ciudadesCobertura.map((c, i) => (
                <div key={i} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full">
                  <span className="text-sm font-semibold">📍 {c}</span>
                  <button onClick={() => quitarCiudad(c)}
                    className="ml-1 text-blue-400 hover:text-blue-700 font-bold text-xs">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Agregar ciudad */}
          <div className="flex gap-2">
            <input
              value={nuevaCiudad}
              onChange={(e) => setNuevaCiudad(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && agregarCiudad()}
              placeholder="Ej. Monterrey, Guadalajara..."
              className="flex-1 p-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none text-gray-900 text-sm transition"/>
            <button
              onClick={agregarCiudad}
              disabled={guardandoCiudad || !nuevaCiudad.trim()}
              className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition">
              {guardandoCiudad ? '...' : '+ Agregar'}
            </button>
          </div>

          {ciudadesCobertura.length === 0 && (
            <p className="text-xs text-gray-400 mt-2 text-center">
              Agrega las ciudades donde tu empresa busca talento
            </p>
          )}
        </div>

        {/* Información de la empresa */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-extrabold text-gray-900 mb-4">📋 Información</h3>
          <div className="flex flex-col gap-4">

            <div>
              <label className="text-sm font-semibold text-gray-500 mb-1 block">Giro empresarial</label>
              {editando ? (
                <select value={giro} onChange={(e) => setGiro(e.target.value)}
                  className="w-full p-3 rounded-xl border-2 border-purple-400 outline-none text-gray-900 bg-white">
                  <option value="">Selecciona un giro</option>
                  {giros.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              ) : (
                <p className="text-gray-700">{giro || 'Sin giro registrado'}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-500 mb-1 block">Tamaño de la empresa</label>
              {editando ? (
                <div className="grid grid-cols-2 gap-2">
                  {tamaños.map(t => (
                    <button key={t.id} onClick={() => setTamañoEmpresa(t.id)}
                      className={`p-3 rounded-xl border-2 text-sm font-semibold transition ${
                        tamañoEmpresa === t.id
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 text-gray-500'
                      }`}>
                      {t.emoji} {t.label}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-700">
                  {tamaños.find(t => t.id === tamañoEmpresa)?.label || 'Sin especificar'}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-500 mb-1 block">Ciudad principal</label>
              {editando ? (
                <input value={ciudad} onChange={(e) => setCiudad(e.target.value)}
                  placeholder="Ej. Ciudad de México"
                  className="w-full p-3 rounded-xl border-2 border-purple-400 outline-none text-gray-900"/>
              ) : (
                <p className="text-gray-700">{ciudad || 'Sin ciudad registrada'}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-500 mb-1 block">Teléfono</label>
              {editando ? (
                <input value={telefono} onChange={(e) => setTelefono(e.target.value)}
                  placeholder="55 1234 5678"
                  className="w-full p-3 rounded-xl border-2 border-purple-400 outline-none text-gray-900"/>
              ) : (
                <p className="text-gray-700">{telefono || 'Sin teléfono registrado'}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-500 mb-1 block">RFC</label>
              {editando ? (
                <input value={rfc} onChange={(e) => setRfc(e.target.value.toUpperCase())}
                  placeholder="Ej. ABC123456789"
                  className="w-full p-3 rounded-xl border-2 border-purple-400 outline-none text-gray-900 uppercase"/>
              ) : (
                <p className="text-gray-700">{rfc || 'Sin RFC registrado'}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-500 mb-1 block">Sitio web</label>
              {editando ? (
                <input value={sitioWeb} onChange={(e) => setSitioWeb(e.target.value)}
                  placeholder="https://tuempresa.com"
                  className="w-full p-3 rounded-xl border-2 border-purple-400 outline-none text-gray-900"/>
              ) : (
                sitioWeb ? (
                  <a href={sitioWeb} target="_blank" className="text-purple-600 font-semibold hover:underline">
                    {sitioWeb}
                  </a>
                ) : (
                  <p className="text-gray-700">Sin sitio web</p>
                )
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-500 mb-1 block">Descripción</label>
              {editando ? (
                <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                  rows={3} placeholder="Cuéntanos sobre tu empresa..."
                  className="w-full p-3 rounded-xl border-2 border-purple-400 outline-none text-gray-900 resize-none"/>
              ) : (
                <p className="text-gray-700">{descripcion || 'Sin descripción'}</p>
              )}
            </div>

          </div>
        </div>

        {/* Reseñas */}
        {reseñas.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <h3 className="font-extrabold text-gray-900 mb-4">💬 Reseñas de prestadores</h3>
            <div className="flex flex-col gap-3">
              {reseñas.map((r) => (
                <div key={r.id} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">
                        {r.usuarios?.nombre?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{r.usuarios?.nombre || 'Prestador'}</p>
                      <p className="text-xs text-yellow-500">{'⭐'.repeat(r.estrellas)}</p>
                    </div>
                  </div>
                  {r.comentario && (
                    <p className="text-sm text-gray-600 italic">"{r.comentario}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3">
        <div className="max-w-md mx-auto flex justify-around">
          <a href="/home-empresa" className="flex flex-col items-center gap-1">
            <span className="text-xl">🏠</span>
            <span className="text-xs text-gray-400">Inicio</span>
          </a>
          <a href="/publicar" className="flex flex-col items-center gap-1">
            <span className="text-xl">➕</span>
            <span className="text-xs text-gray-400">Publicar</span>
          </a>
          <a href="/aplicaciones" className="flex flex-col items-center gap-1">
            <span className="text-xl">📋</span>
            <span className="text-xs text-gray-400">Aplicaciones</span>
          </a>
          <a href="/chat" className="flex flex-col items-center gap-1">
            <span className="text-xl">💬</span>
            <span className="text-xs text-gray-400">Mensajes</span>
          </a>
          <a href="/perfil-empresa" className="flex flex-col items-center gap-1">
            <span className="text-xl">🏢</span>
            <span className="text-xs font-bold text-purple-600">Mi empresa</span>
          </a>
        </div>
      </div>

    </main>
  );
}