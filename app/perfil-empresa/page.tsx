'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Nav from '@/lib/nav';

const MORADO = '#7B2FE0';

const giros = [
  '🧹 Limpieza y mantenimiento', '🍽️ Restaurante y hostelería', '🏨 Hotel y hospedaje',
  '🏗️ Construcción y remodelación', '📦 Logística y mensajería', '🎪 Eventos y entretenimiento',
  '🏥 Salud y cuidado personal', '📚 Educación y capacitación', '💻 Tecnología y sistemas',
  '🔧 Servicios industriales', '🛒 Comercio y retail', '🌿 Jardinería y paisajismo',
  '🚗 Transporte y movilidad', '💼 Servicios profesionales', '🎨 Diseño y creatividad',
];

const tamaños = [
  { id: '1-10', label: '1-10 empleados', emoji: '👤' },
  { id: '11-50', label: '11-50 empleados', emoji: '👥' },
  { id: '51-200', label: '51-200 empleados', emoji: '🏢' },
  { id: '200+', label: 'Más de 200', emoji: '🏙️' },
];

function calcularProgresoEmpresa(usuario: any, documentos: any[]) {
  let puntos = 0;
  if (usuario?.foto_url) puntos += 10;
  if (usuario?.nombre?.trim()) puntos += 10;
  if (usuario?.telefono?.trim()) puntos += 10;
  if (usuario?.ciudad?.trim()) puntos += 10;
  if (usuario?.descripcion?.trim()) puntos += 10;
  if (usuario?.datos_factura?.nombre_fiscal && usuario?.datos_factura?.rfc) puntos += 10;
  const docsRequeridos = ['ine_frente', 'ine_reverso', 'constancia_fiscal', 'antecedentes'];
  const docsSubidos = documentos.filter(d => docsRequeridos.includes(d.tipo) && (d.estado === 'subido' || d.estado === 'aprobado')).length;
  if (docsSubidos > 0) puntos += Math.round((docsSubidos / docsRequeridos.length) * 15);
  const docsAprobados = documentos.filter(d => docsRequeridos.includes(d.tipo) && d.estado === 'aprobado').length;
  if (docsAprobados > 0) puntos += Math.round((docsAprobados / docsRequeridos.length) * 25);
  return Math.min(puntos, 100);
}

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
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [progresoPerfil, setProgresoPerfil] = useState(0);
  const [verificacion, setVerificacion] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mostrarCuenta, setMostrarCuenta] = useState(false);
  const [editandoCuenta, setEditandoCuenta] = useState(false);
  const [cuentaNombre, setCuentaNombre] = useState('');
  const [cuentaTelefono, setCuentaTelefono] = useState('');
  const [cuentaCiudad, setCuentaCiudad] = useState('');
  const [guardandoCuenta, setGuardandoCuenta] = useState(false);
  const [exitoCuenta, setExitoCuenta] = useState('');
  const [errorCuenta, setErrorCuenta] = useState('');
  const [mostrarCambiarPass, setMostrarCambiarPass] = useState(false);
  const [passNueva, setPassNueva] = useState('');
  const [passConfirmar, setPassConfirmar] = useState('');
  const [verPassNueva, setVerPassNueva] = useState(false);
  const [verPassConfirmar, setVerPassConfirmar] = useState(false);
  const [guardandoPass, setGuardandoPass] = useState(false);
  const [exitoPass, setExitoPass] = useState('');
  const [errorPass, setErrorPass] = useState('');
  const [mostrarEliminar, setMostrarEliminar] = useState(false);
  const [confirmEliminar, setConfirmEliminar] = useState('');

  useEffect(() => { cargarPerfil(); }, []);

  const cargarPerfil = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    const { data } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
    if (data) {
      setUsuario({ ...data, id: user.id, email: user.email });
      setNombre(data.nombre || ''); setTelefono(data.telefono || ''); setDescripcion(data.descripcion || '');
      setGiro(data.giro || ''); setRfc(data.rfc || ''); setSitioWeb(data.sitio_web || '');
      setTamañoEmpresa(data.tamaño_empresa || ''); setCiudad(data.ciudad || ''); setFotoUrl(data.foto_url || '');
      setCiudadesCobertura(data.ciudades_cobertura || []);
      setCuentaNombre(data.nombre || ''); setCuentaTelefono(data.telefono || ''); setCuentaCiudad(data.ciudad || '');
      const { data: docs } = await supabase.from('documentos').select('*').eq('usuario_id', user.id);
      setDocumentos(docs || []);
      const progreso = calcularProgresoEmpresa({ ...data, id: user.id }, docs || []);
      setProgresoPerfil(progreso);
      if (progreso === 100) { try { await supabase.from('badges').upsert({ usuario_id: user.id, tipo: 'perfil_completo' }, { onConflict: 'usuario_id,tipo' }); } catch (e) {} }
    }
    const { count } = await supabase.from('servicios').select('id', { count: 'exact' }).eq('cliente_id', user.id);
    setTotalServicios(count || 0);
    const { data: reseñasData } = await supabase.from('reseñas').select('*, usuarios!reseñas_prestador_id_fkey(nombre, foto_url)').eq('cliente_id', user.id).eq('es_del_prestador', true).order('created_at', { ascending: false }).limit(5);
    setReseñas(reseñasData || []);
    const { data: verifData } = await supabase.from('verificaciones').select('*').eq('usuario_id', user.id).single();
    setVerificacion(verifData || null);
    setCargando(false);
  };

  const agregarCiudad = async () => {
    const val = nuevaCiudad.trim();
    if (!val || ciudadesCobertura.includes(val)) return;
    setGuardandoCiudad(true);
    try { const nuevas = [...ciudadesCobertura, val]; await supabase.from('usuarios').update({ ciudades_cobertura: nuevas }).eq('id', usuario.id); setCiudadesCobertura(nuevas); setNuevaCiudad(''); }
    finally { setGuardandoCiudad(false); }
  };

  const quitarCiudad = async (c: string) => {
    const nuevas = ciudadesCobertura.filter(x => x !== c);
    await supabase.from('usuarios').update({ ciudades_cobertura: nuevas }).eq('id', usuario.id);
    setCiudadesCobertura(nuevas);
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
    } catch (err: any) { alert('Error al subir logo: ' + err.message); }
    finally { setSubiendoFoto(false); }
  };

  const guardarPerfil = async () => {
    setGuardando(true);
    await supabase.from('usuarios').update({ nombre, telefono, descripcion, giro, rfc, sitio_web: sitioWeb, tamaño_empresa: tamañoEmpresa, ciudad }).eq('id', usuario.id);
    setGuardando(false); setEditando(false); cargarPerfil();
  };

  const guardarCuenta = async () => {
    setGuardandoCuenta(true); setErrorCuenta(''); setExitoCuenta('');
    try {
      await supabase.from('usuarios').update({ nombre: cuentaNombre, telefono: cuentaTelefono, ciudad: cuentaCiudad }).eq('id', usuario.id);
      setExitoCuenta('✅ Datos actualizados'); setEditandoCuenta(false); cargarPerfil();
      setTimeout(() => setExitoCuenta(''), 3000);
    } catch { setErrorCuenta('Error al guardar. Intenta de nuevo.'); }
    finally { setGuardandoCuenta(false); }
  };

  const cambiarPassword = async () => {
    setErrorPass(''); setExitoPass('');
    if (!passNueva || !passConfirmar) { setErrorPass('Llena todos los campos'); return; }
    if (passNueva.length < 8) { setErrorPass('Mínimo 8 caracteres'); return; }
    if (passNueva !== passConfirmar) { setErrorPass('Las contraseñas no coinciden'); return; }
    setGuardandoPass(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passNueva });
      if (error) throw error;
      setExitoPass('✅ Contraseña actualizada'); setPassNueva(''); setPassConfirmar(''); setMostrarCambiarPass(false);
      setTimeout(() => setExitoPass(''), 3000);
    } catch { setErrorPass('No se pudo actualizar. Intenta de nuevo.'); }
    finally { setGuardandoPass(false); }
  };

  const cerrarSesion = async () => { await supabase.auth.signOut(); window.location.href = '/'; };

  const OjitoBTN = ({ ver, toggle }: { ver: boolean; toggle: () => void }) => (
    <button type="button" onClick={toggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
      {ver ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
      : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
    </button>
  );

  const verificacionInfo = () => {
    if (!verificacion) return { bg: '#F5F0FF', border: MORADO, emoji: '🪪', titulo: 'Verifica tu empresa', texto: 'Sube tus documentos para contratar fleksers', boton: 'Verificar ahora' };
    const estados: any = {
      en_revision: { bg: '#FFFBEB', border: '#FCD34D', emoji: '🔍', titulo: 'Verificación en revisión', texto: 'Estamos revisando tus documentos.', boton: 'Ver estado' },
      aprobado: { bg: '#F0FDF4', border: '#86EFAC', emoji: '✅', titulo: '¡Empresa verificada!', texto: 'Tu empresa muestra el badge de confianza.', boton: 'Ver documentos' },
      rechazado: { bg: '#FEF2F2', border: '#FCA5A5', emoji: '❌', titulo: 'Verificación rechazada', texto: verificacion.motivo_rechazo || 'Revisa tus documentos.', boton: 'Reintentar' },
    };
    return estados[verificacion.estado] || estados['en_revision'];
  };

  const pasosFaltantes = () => {
    const pasos: string[] = [];
    if (!usuario?.foto_url) pasos.push('Agrega el logo de tu empresa');
    if (!usuario?.telefono?.trim()) pasos.push('Agrega tu teléfono');
    if (!usuario?.ciudad?.trim()) pasos.push('Agrega tu ciudad principal');
    if (!usuario?.descripcion?.trim()) pasos.push('Agrega una descripción');
    if (!usuario?.datos_factura?.nombre_fiscal) pasos.push('Completa tus datos de facturación');
    const docsRequeridos = ['ine_frente', 'ine_reverso', 'constancia_fiscal', 'antecedentes'];
    const docsAprobados = documentos.filter(d => docsRequeridos.includes(d.tipo) && d.estado === 'aprobado').length;
    if (docsAprobados < docsRequeridos.length) pasos.push('Sube y espera aprobación de documentos');
    return pasos;
  };

  if (cargando) return (
    <main className="min-h-screen flex items-center justify-center" style={{background: '#F8FAFC'}}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{borderColor: MORADO, borderTopColor: 'transparent'}}/>
        <p className="text-gray-400">Cargando perfil...</p>
      </div>
    </main>
  );

  const verif = verificacionInfo();
  const perfilCompleto = progresoPerfil === 100;
  const faltantes = pasosFaltantes();

  return (
    <main className="min-h-screen pb-32" style={{background: '#F8FAFC'}}>
      <div className="bg-white px-6 pt-12 pb-4 shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <h1 className="font-extrabold text-gray-900 text-xl">Mi Empresa</h1>
          <div className="flex items-center gap-3">
            {usuario?.email === 'fernando.najera.nm@gmail.com' && (
              <a href="/admin" className="text-xs font-bold px-3 py-1.5 rounded-full" style={{background: '#F5F0FF', color: MORADO}}>⚙️ Admin</a>
            )}
            <button onClick={cerrarSesion} className="text-gray-400 text-sm hover:text-gray-600 transition">Cerrar sesión</button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 pt-4">

        {/* Card principal */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center" style={{background: MORADO}}>
                {fotoUrl ? <img src={fotoUrl} alt="Logo empresa" className="w-full h-full object-cover"/> : <span className="text-white font-extrabold text-2xl">{nombre ? nombre.charAt(0).toUpperCase() : '🏢'}</span>}
              </div>
              {editando && (
                <button onClick={() => fileInputRef.current?.click()} disabled={subiendoFoto} className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs shadow-lg" style={{background: MORADO}}>
                  {subiendoFoto ? '⏳' : '📷'}
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFoto} className="hidden"/>
            </div>
            <div className="flex-1">
              {editando ? (
                <input value={nombre} onChange={e => setNombre(e.target.value)} className="w-full p-2 rounded-xl border-2 outline-none text-gray-900 font-bold mb-1" style={{borderColor: MORADO}} placeholder="Nombre de la empresa"/>
              ) : (
                <h2 className="font-extrabold text-gray-900 text-lg">{nombre || 'Sin nombre'}</h2>
              )}
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{background: '#F5F0FF', color: MORADO}}>🏢 Empresa</span>
                {ciudadesCobertura.length > 1 && <span className="text-xs bg-blue-100 text-blue-600 font-semibold px-2 py-0.5 rounded-full">🗺️ Multi-ciudad</span>}
                {perfilCompleto && <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full">🏆 Perfil completo</span>}
              </div>
            </div>
          </div>

          {!perfilCompleto && (
            <div className="mb-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-gray-700">Completa tu perfil</p>
                <span className="text-sm font-extrabold" style={{color: MORADO}}>{progresoPerfil}%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
                <div className="h-full rounded-full transition-all duration-700" style={{width: `${progresoPerfil}%`, background: progresoPerfil < 40 ? '#EF4444' : progresoPerfil < 70 ? '#F59E0B' : MORADO}}/>
              </div>
              {faltantes.length > 0 && (
                <div className="flex flex-col gap-1">
                  {faltantes.slice(0, 3).map((paso, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background: MORADO}}/>
                      <p className="text-xs text-gray-500">{paso}</p>
                    </div>
                  ))}
                  {faltantes.length > 3 && <p className="text-xs font-semibold ml-3.5" style={{color: MORADO}}>+{faltantes.length - 3} más</p>}
                </div>
              )}
            </div>
          )}

          {perfilCompleto && (
            <div className="mb-4 rounded-2xl p-4 border flex items-center gap-3" style={{background: '#F5F0FF', borderColor: '#DDD6FE'}}>
              <span className="text-3xl">🏆</span>
              <div>
                <p className="font-extrabold text-sm" style={{color: MORADO}}>¡Perfil al 100%!</p>
                <p className="text-xs text-gray-400">Apareces primero y generas más confianza</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl p-3 text-center" style={{background: '#F5F0FF'}}>
              <p className="text-2xl font-extrabold" style={{color: MORADO}}>{totalServicios}</p>
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
            <button onClick={() => setEditando(true)} className="w-full py-3 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold hover:border-purple-300 transition">✏️ Editar perfil</button>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => setEditando(false)} className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold">Cancelar</button>
              <button onClick={guardarPerfil} disabled={guardando} className="flex-1 py-3 text-white rounded-2xl font-semibold disabled:opacity-50" style={{background: MORADO}}>
                {guardando ? 'Guardando...' : 'Guardar ✓'}
              </button>
            </div>
          )}
        </div>

        {/* Verificación */}
        <a href="/documentos" className="block rounded-2xl p-5 shadow-sm border mb-4 transition hover:opacity-90" style={{background: verif.bg, borderColor: verif.border}}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{verif.emoji}</span>
                <h3 className="font-extrabold text-gray-900">{verif.titulo}</h3>
              </div>
              <p className="text-xs text-gray-500 ml-7">{verif.texto}</p>
            </div>
            <span className="flex-shrink-0 ml-3 px-3 py-2 rounded-xl text-xs font-bold text-white" style={{background: MORADO}}>{verif.boton} →</span>
          </div>
        </a>

        {/* Cobertura multi-ciudad */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-extrabold text-gray-900">🗺️ Cobertura multi-ciudad</h3>
              <p className="text-xs text-gray-400 mt-0.5">Ciudades donde tu empresa opera</p>
            </div>
            {ciudadesCobertura.length > 0 && <span className="text-xs font-bold px-2 py-1 rounded-full" style={{background: '#F5F0FF', color: MORADO}}>{ciudadesCobertura.length} ciudad{ciudadesCobertura.length !== 1 ? 'es' : ''}</span>}
          </div>
          {ciudadesCobertura.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {ciudadesCobertura.map((c, i) => (
                <div key={i} className="flex items-center gap-1 px-3 py-1.5 rounded-full" style={{background: '#F5F0FF'}}>
                  <span className="text-sm font-semibold" style={{color: MORADO}}>📍 {c}</span>
                  <button onClick={() => quitarCiudad(c)} className="ml-1 text-xs font-bold" style={{color: MORADO}}>✕</button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input value={nuevaCiudad} onChange={e => setNuevaCiudad(e.target.value)} onKeyDown={e => e.key === 'Enter' && agregarCiudad()}
              placeholder="Ej. Monterrey, Guadalajara..." className="flex-1 p-3 rounded-xl border-2 border-gray-200 focus:border-purple-300 outline-none text-gray-900 text-sm transition bg-gray-50"/>
            <button onClick={agregarCiudad} disabled={guardandoCiudad || !nuevaCiudad.trim()} className="px-4 py-3 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition" style={{background: MORADO}}>
              {guardandoCiudad ? '...' : '+ Agregar'}
            </button>
          </div>
          {ciudadesCobertura.length === 0 && <p className="text-xs text-gray-400 mt-2 text-center">Agrega las ciudades donde tu empresa busca talento</p>}
        </div>

        {/* Información empresa */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-extrabold text-gray-900 mb-4">📋 Información</h3>
          <div className="flex flex-col gap-4">
            {[
              { label: 'Giro empresarial', content: editando ? (
                <select value={giro} onChange={e => setGiro(e.target.value)} className="w-full p-3 rounded-xl border-2 focus:border-purple-300 outline-none text-gray-900 bg-white" style={{borderColor: MORADO}}>
                  <option value="">Selecciona un giro</option>
                  {giros.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              ) : <p className="text-gray-700">{giro || 'Sin giro registrado'}</p> },
              { label: 'Tamaño de la empresa', content: editando ? (
                <div className="grid grid-cols-2 gap-2">
                  {tamaños.map(t => (
                    <button key={t.id} onClick={() => setTamañoEmpresa(t.id)} className="p-3 rounded-xl border-2 text-sm font-semibold transition" style={{borderColor: tamañoEmpresa === t.id ? MORADO : '#E5E7EB', background: tamañoEmpresa === t.id ? '#F5F0FF' : 'white', color: tamañoEmpresa === t.id ? MORADO : '#6B7280'}}>
                      {t.emoji} {t.label}
                    </button>
                  ))}
                </div>
              ) : <p className="text-gray-700">{tamaños.find(t => t.id === tamañoEmpresa)?.label || 'Sin especificar'}</p> },
            ].map((item, i) => (
              <div key={i}>
                <label className="text-sm font-semibold text-gray-500 mb-1 block">{item.label}</label>
                {item.content}
              </div>
            ))}
            {[
              { label: 'Ciudad principal', val: ciudad, set: setCiudad, placeholder: 'Ej. Irapuato' },
              { label: 'Teléfono', val: telefono, set: setTelefono, placeholder: '55 1234 5678' },
              { label: 'RFC', val: rfc, set: (v: string) => setRfc(v.toUpperCase()), placeholder: 'Ej. ABC123456789' },
              { label: 'Sitio web', val: sitioWeb, set: setSitioWeb, placeholder: 'https://tuempresa.com' },
            ].map(f => (
              <div key={f.label}>
                <label className="text-sm font-semibold text-gray-500 mb-1 block">{f.label}</label>
                {editando ? <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} className="w-full p-3 rounded-xl border-2 outline-none text-gray-900 bg-gray-50" style={{borderColor: MORADO}}/> : <p className="text-gray-700">{f.val || 'Sin registrar'}</p>}
              </div>
            ))}
            <div>
              <label className="text-sm font-semibold text-gray-500 mb-1 block">Descripción</label>
              {editando ? <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3} placeholder="Cuéntanos sobre tu empresa..." className="w-full p-3 rounded-xl border-2 outline-none text-gray-900 resize-none bg-gray-50" style={{borderColor: MORADO}}/> : <p className="text-gray-700">{descripcion || 'Sin descripción'}</p>}
            </div>
          </div>
        </div>

        {/* Reseñas */}
        {reseñas.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <h3 className="font-extrabold text-gray-900 mb-4">💬 Reseñas de prestadores</h3>
            <div className="flex flex-col gap-3">
              {reseñas.map(r => (
                <div key={r.id} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{background: MORADO}}>
                      <span className="text-white text-xs font-bold">{r.usuarios?.nombre?.charAt(0) || '?'}</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{r.usuarios?.nombre || 'Prestador'}</p>
                      <p className="text-xs text-yellow-500">{'⭐'.repeat(r.estrellas)}</p>
                    </div>
                  </div>
                  {r.comentario && <p className="text-sm text-gray-600 italic">"{r.comentario}"</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mi Cuenta */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
          <button onClick={() => setMostrarCuenta(!mostrarCuenta)} className="w-full flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚙️</span>
              <h3 className="font-extrabold text-gray-900">Mi cuenta</h3>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`text-gray-400 transition-transform ${mostrarCuenta ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6"/></svg>
          </button>

          {mostrarCuenta && (
            <div className="px-5 pb-5 flex flex-col gap-4 border-t border-gray-100 pt-4">
              {exitoCuenta && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl text-sm font-semibold">{exitoCuenta}</div>}
              {exitoPass && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl text-sm font-semibold">{exitoPass}</div>}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-gray-700 text-sm">🏢 Datos de la cuenta</p>
                  {!editandoCuenta ? (
                    <button onClick={() => setEditandoCuenta(true)} className="text-xs font-semibold hover:underline" style={{color: MORADO}}>Editar</button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setEditandoCuenta(false)} className="text-xs text-gray-400 font-semibold hover:underline">Cancelar</button>
                      <button onClick={guardarCuenta} disabled={guardandoCuenta} className="text-xs font-bold hover:underline disabled:opacity-50" style={{color: MORADO}}>{guardandoCuenta ? 'Guardando...' : 'Guardar ✓'}</button>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'Nombre / Razón social', val: cuentaNombre, set: setCuentaNombre, placeholder: 'Empresa SA de CV' },
                    { label: 'Teléfono', val: cuentaTelefono, set: setCuentaTelefono, placeholder: '+52 55 1234 5678' },
                    { label: 'Ciudad principal', val: cuentaCiudad, set: setCuentaCiudad, placeholder: 'Ej. Irapuato' },
                  ].map(f => (
                    <div key={f.label} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">{f.label}</p>
                      {editandoCuenta ? <input value={f.val} onChange={e => f.set(e.target.value)} className="w-full p-2 rounded-lg border-2 outline-none text-gray-900 text-sm bg-white" style={{borderColor: MORADO}} placeholder={f.placeholder}/> : <p className="text-sm font-semibold text-gray-900">{(f.val) || '—'}</p>}
                    </div>
                  ))}
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">Correo electrónico</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{usuario?.email || '—'}</p>
                      <span className="text-xs bg-green-100 text-green-600 font-bold px-2 py-0.5 rounded-full">✓ Verificado</span>
                    </div>
                  </div>
                </div>
                {errorCuenta && <p className="text-xs text-red-500 mt-2">{errorCuenta}</p>}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="font-bold text-gray-700 text-sm mb-3">🔐 Seguridad</p>
                <button onClick={() => setMostrarCambiarPass(!mostrarCambiarPass)} className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                  <span className="text-sm font-semibold text-gray-700">Cambiar contraseña</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`text-gray-400 transition-transform ${mostrarCambiarPass ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6"/></svg>
                </button>
                {mostrarCambiarPass && (
                  <div className="mt-3 flex flex-col gap-3">
                    {errorPass && <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-xl text-xs">{errorPass}</div>}
                    {['Nueva contraseña', 'Confirmar contraseña'].map((label, i) => (
                      <div key={label} className="relative">
                        <input type={i === 0 ? (verPassNueva ? 'text' : 'password') : (verPassConfirmar ? 'text' : 'password')}
                          placeholder={label} value={i === 0 ? passNueva : passConfirmar}
                          onChange={e => i === 0 ? setPassNueva(e.target.value) : setPassConfirmar(e.target.value)}
                          className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-purple-300 outline-none text-gray-900 text-sm pr-12 bg-gray-50"/>
                        <OjitoBTN ver={i === 0 ? verPassNueva : verPassConfirmar} toggle={() => i === 0 ? setVerPassNueva(!verPassNueva) : setVerPassConfirmar(!verPassConfirmar)}/>
                      </div>
                    ))}
                    <button onClick={cambiarPassword} disabled={guardandoPass} className="w-full py-3 text-white rounded-xl font-bold text-sm disabled:opacity-50" style={{background: MORADO}}>
                      {guardandoPass ? 'Actualizando...' : 'Actualizar contraseña'}
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
                <button onClick={cerrarSesion} className="w-full py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:border-gray-400 transition">🚪 Cerrar sesión</button>
                <button onClick={() => setMostrarEliminar(!mostrarEliminar)} className="w-full py-3 border-2 border-red-200 text-red-500 rounded-xl font-semibold text-sm hover:bg-red-50 transition">🗑️ Eliminar mi cuenta</button>
                {mostrarEliminar && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm font-bold text-red-700 mb-2">⚠️ Esta acción es irreversible</p>
                    <p className="text-xs text-red-600 mb-3">Escribe <span className="font-bold">ELIMINAR</span> para confirmar.</p>
                    <input type="text" placeholder="Escribe ELIMINAR" value={confirmEliminar} onChange={e => setConfirmEliminar(e.target.value)} className="w-full p-3 rounded-xl border-2 border-red-300 outline-none text-gray-900 text-sm mb-3"/>
                    <button disabled={confirmEliminar !== 'ELIMINAR'}
                      onClick={async () => { await supabase.from('usuarios').delete().eq('id', usuario.id); await supabase.auth.signOut(); window.location.href = '/'; }}
                      className="w-full py-3 bg-red-500 text-white rounded-xl font-bold text-sm disabled:opacity-40 hover:bg-red-600 transition">
                      Eliminar cuenta definitivamente
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Nav activo="perfil" />
    </main>
  );
}