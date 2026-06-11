'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Nav from '@/lib/nav';
import { cacheInvalidate } from '@/lib/cache';

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
  { tipo: 'fundador', nombre: 'Fundador', emoji: '🏅', desc: 'Uno de los primeros 50 en Fleksi' },
  { tipo: 'pionero', nombre: 'Pionero', emoji: '🚀', desc: 'Uno de los primeros 100 en Fleksi' },
  { tipo: 'nuevo', nombre: 'Nuevo', emoji: '🆕', desc: 'Recién unido a Fleksi' },
  { tipo: 'primer_trabajo', nombre: 'Primer trabajo', emoji: '🎯', desc: 'Completó su primer trabajo' },
  { tipo: 'cinco_trabajos', nombre: '5 trabajos', emoji: '🔥', desc: 'Completó 5 trabajos' },
  { tipo: 'diez_trabajos', nombre: '10 trabajos', emoji: '💎', desc: 'Completó 10 trabajos' },
  { tipo: 'top_rated', nombre: 'Top Rated', emoji: '⭐', desc: 'Calificación 4.8 o más' },
  { tipo: 'perfecto', nombre: 'Perfección', emoji: '✨', desc: 'Calificación perfecta 5.0' },
  { tipo: 'verificado', nombre: 'Verificado', emoji: '✅', desc: 'Identidad verificada' },
  { tipo: 'confianza_maxima', nombre: 'Confianza máxima', emoji: '🛡️', desc: 'Antecedentes no penales verificados' },
  { tipo: 'perfil_completo', nombre: 'Perfil completo', emoji: '🏆', desc: 'Perfil al 100%' },
];

const intenciones = [
  { id: 'trabajar', emoji: '💼', titulo: 'Quiero trabajar', desc: 'Ofrecer mis servicios y ganar dinero', color: 'border-blue-400 bg-blue-50', texto: 'text-blue-700' },
  { id: 'contratar', emoji: '🔍', titulo: 'Quiero contratar', desc: 'Buscar ayuda para lo que necesito', color: 'border-purple-400 bg-purple-50', texto: 'text-purple-700' },
  { id: 'ambos', emoji: '⚡', titulo: 'Ambos', desc: 'Trabajo y también contrato', color: 'border-green-400 bg-green-50', texto: 'text-green-700' },
];

function generarCodigo(nombre: string): string {
  const base = nombre.trim().toUpperCase().replace(/\s+/g, '').slice(0, 4).padEnd(4, 'X');
  const aleatorio = Math.random().toString(36).substring(2, 6).toUpperCase();
  return base + '-' + aleatorio;
}

function calcularProgresoPerfil(usuario: any, documentos: any[], rol: string) {
  let puntos = 0;
  if (usuario?.foto_url) puntos += 10;
  if (usuario?.nombre?.trim()) puntos += 10;
  if (usuario?.telefono?.trim()) puntos += 10;
  if (usuario?.ciudad?.trim()) puntos += 10;
  if (usuario?.descripcion?.trim()) puntos += 10;
  if (rol === 'empresa') {
    if (usuario?.datos_factura?.nombre_fiscal && usuario?.datos_factura?.rfc) puntos += 10;
  } else {
    if (usuario?.habilidades?.length > 0) puntos += 10;
  }
  const docsRequeridos = rol === 'empresa'
    ? ['ine_frente', 'ine_reverso', 'constancia_fiscal']
    : ['ine_frente', 'ine_reverso', 'curp', 'comprobante_domicilio'];
  const docsSubidos = documentos.filter(d =>
    docsRequeridos.includes(d.tipo) && (d.estado === 'subido' || d.estado === 'aprobado')
  ).length;
  if (docsSubidos > 0) puntos += Math.round((docsSubidos / docsRequeridos.length) * 15);
  const docsAprobados = documentos.filter(d =>
    docsRequeridos.includes(d.tipo) && d.estado === 'aprobado'
  ).length;
  if (docsAprobados > 0) puntos += Math.round((docsAprobados / docsRequeridos.length) * 25);
  return Math.min(puntos, 100);
}

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
  const [portafolioTrabajos, setPortafolioTrabajos] = useState<{ foto: string; titulo: string }[]>([]);
  const [portafolioManual, setPortafolioManual] = useState<any[]>([]);
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);
  const [ciudadesVisitadas, setCiudadesVisitadas] = useState<string[]>([]);
  const [verificacion, setVerificacion] = useState<any>(null);
  const [totalGanado, setTotalGanado] = useState(0);
  const [walletSaldo, setWalletSaldo] = useState(0);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [progresoPerfil, setProgresoPerfil] = useState(0);
  const [copiado, setCopiado] = useState(false);

  const [mostrarBannerIntencion, setMostrarBannerIntencion] = useState(false);
  const [intencionSeleccionada, setIntencionSeleccionada] = useState('');
  const [guardandoIntencion, setGuardandoIntencion] = useState(false);

  const [codigoRecienGenerado, setCodigoRecienGenerado] = useState('');
  const [mostrarModalCodigo, setMostrarModalCodigo] = useState(false);
  const [copiadoModal, setCopiadoModal] = useState(false);

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

  // Portafolio manual
  const [subiendoPortafolio, setSubiendoPortafolio] = useState(false);
  const [tituloNuevoPortafolio, setTituloNuevoPortafolio] = useState('');
  const [eliminandoFoto, setEliminandoFoto] = useState('');
  const [mostrarAgregarFoto, setMostrarAgregarFoto] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const portafolioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { cargarPerfil(); }, []);

  const cargarPerfil = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }

      const { data } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
      if (data) {
        let codigoFinal = data.codigo_referido;
        if (!codigoFinal) {
          let codigoNuevo = generarCodigo(data.nombre || 'USER');
          let intentos = 0;
          while (intentos < 5) {
            const { data: existe } = await supabase.from('usuarios').select('id').eq('codigo_referido', codigoNuevo).maybeSingle();
            if (!existe) break;
            codigoNuevo = generarCodigo(data.nombre || 'USER');
            intentos++;
          }
          await supabase.from('usuarios').update({ codigo_referido: codigoNuevo }).eq('id', user.id);
          codigoFinal = codigoNuevo;
          setCodigoRecienGenerado(codigoNuevo);
          setMostrarModalCodigo(true);
        }

        setUsuario({ ...data, id: user.id, email: user.email, codigo_referido: codigoFinal });
        setNombre(data.nombre || '');
        setTelefono(data.telefono || '');
        setDescripcion(data.descripcion || '');
        setCiudad(data.ciudad || '');
        setHabilidadesSeleccionadas(data.habilidades || []);
        setFotoUrl(data.foto_url || '');
        setCiudadesVisitadas(data.ciudades_visitadas || []);
        setWalletSaldo(data.wallet_saldo || 0);
        setCuentaNombre(data.nombre || '');
        setCuentaTelefono(data.telefono || '');
        setCuentaCiudad(data.ciudad || '');

        if (!data.intencion) setMostrarBannerIntencion(true);

        const { data: docs } = await supabase.from('documentos').select('*').eq('usuario_id', user.id);
        setDocumentos(docs || []);

        const rol = data.rol_activo || data.rol || 'flekser';
        const progreso = calcularProgresoPerfil({ ...data, id: user.id }, docs || [], rol);
        setProgresoPerfil(progreso);

        if (progreso === 100) {
          try {
            await supabase.from('badges').upsert({
              usuario_id: user.id, tipo: 'perfil_completo', nombre: 'Perfil completo', emoji: '🏆',
            }, { onConflict: 'usuario_id,tipo' });
          } catch (e) {}
        }
      }

      const { data: badgesData } = await supabase.from('badges').select('*').eq('usuario_id', user.id);
      setBadges(badgesData || []);

      const { data: reseñasData } = await supabase
        .from('reseñas')
        .select('*, usuarios!reseñas_cliente_id_fkey(nombre, foto_url)')
        .eq('prestador_id', user.id)
        .eq('es_del_prestador', false)
        .order('created_at', { ascending: false })
        .limit(3);
      setReseñas(reseñasData || []);

      const { data: appsData } = await supabase
        .from('aplicaciones')
        .select('fotos_despues, precio_ofrecido, servicios(titulo, presupuesto)')
        .eq('prestador_id', user.id)
        .eq('estado', 'completado');

      const fotosTrabajos: { foto: string; titulo: string }[] = [];
      let total = 0;
      (appsData || []).forEach((app: any) => {
        total += app.precio_ofrecido || app.servicios?.presupuesto || 0;
        (app.fotos_despues || []).forEach((url: string) => {
          fotosTrabajos.push({ foto: url, titulo: app.servicios?.titulo || 'Trabajo completado' });
        });
      });
      setPortafolioTrabajos(fotosTrabajos);
      setTotalGanado(total);

      // Cargar portafolio manual
      const { data: { user: u2 } } = await supabase.auth.getUser();
      if (u2) {
        const { data: portData } = await supabase
          .from('portafolio_fotos')
          .select('*')
          .eq('usuario_id', u2.id)
          .order('created_at', { ascending: false });
        setPortafolioManual(portData || []);
      }

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

  const subirFotoPortafolio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !usuario) return;
    setSubiendoPortafolio(true);
    try {
      const ext = file.name.split('.').pop();
      const path = usuario.id + '/' + Date.now() + '.' + ext;
      const { error: uploadError } = await supabase.storage
        .from('portafolio')
        .upload(path, file, { upsert: false });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('portafolio').getPublicUrl(path);
      await supabase.from('portafolio_fotos').insert({
        usuario_id: usuario.id,
        foto_url: urlData.publicUrl,
        titulo: tituloNuevoPortafolio.trim() || null,
      });
      setTituloNuevoPortafolio('');
      setMostrarAgregarFoto(false);
      // Recargar portafolio
      const { data: portData } = await supabase
        .from('portafolio_fotos')
        .select('*')
        .eq('usuario_id', usuario.id)
        .order('created_at', { ascending: false });
      setPortafolioManual(portData || []);
    } catch (err: any) {
      alert('Error al subir foto: ' + err.message);
    } finally {
      setSubiendoPortafolio(false);
      if (portafolioInputRef.current) portafolioInputRef.current.value = '';
    }
  };

  const eliminarFotoPortafolio = async (foto: any) => {
    setEliminandoFoto(foto.id);
    try {
      // Extraer path del URL
      const url = foto.foto_url;
      const partes = url.split('/portafolio/');
      if (partes.length > 1) {
        await supabase.storage.from('portafolio').remove([partes[1]]);
      }
      await supabase.from('portafolio_fotos').delete().eq('id', foto.id);
      setPortafolioManual(prev => prev.filter(f => f.id !== foto.id));
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    } finally {
      setEliminandoFoto('');
    }
  };

  const guardarIntencion = async () => {
    if (!intencionSeleccionada || !usuario) return;
    setGuardandoIntencion(true);
    try {
      await supabase.from('usuarios').update({ intencion: intencionSeleccionada }).eq('id', usuario.id);
      setUsuario((prev: any) => ({ ...prev, intencion: intencionSeleccionada }));
      setMostrarBannerIntencion(false);
    } catch (e) { console.error(e); }
    finally { setGuardandoIntencion(false); }
  };

  const handleFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !usuario) return;
    setSubiendoFoto(true);
    try {
      const ext = file.name.split('.').pop();
      const path = usuario.id + '/avatar.' + ext;
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
    await supabase.from('usuarios').update({
      nombre, telefono, descripcion, ciudad,
      habilidades: habilidadesSeleccionadas
    }).eq('id', usuario.id);
    cacheInvalidate('perfil_' + usuario.id);
    setGuardando(false);
    setEditando(false);
    cargarPerfil();
  };

  const guardarCuenta = async () => {
    setGuardandoCuenta(true);
    setErrorCuenta('');
    setExitoCuenta('');
    try {
      await supabase.from('usuarios').update({
        nombre: cuentaNombre,
        telefono: cuentaTelefono,
        ciudad: cuentaCiudad,
      }).eq('id', usuario.id);
      cacheInvalidate('perfil_' + usuario.id);
      setExitoCuenta('✅ Datos actualizados correctamente');
      setEditandoCuenta(false);
      cargarPerfil();
      setTimeout(() => setExitoCuenta(''), 3000);
    } catch (err: any) {
      setErrorCuenta('Error al guardar. Intenta de nuevo.');
    } finally {
      setGuardandoCuenta(false);
    }
  };

  const cambiarPassword = async () => {
    setErrorPass('');
    setExitoPass('');
    if (!passNueva || !passConfirmar) { setErrorPass('Llena todos los campos'); return; }
    if (passNueva.length < 8) { setErrorPass('La contraseña debe tener al menos 8 caracteres'); return; }
    if (passNueva !== passConfirmar) { setErrorPass('Las contraseñas no coinciden'); return; }
    setGuardandoPass(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passNueva });
      if (error) throw error;
      setExitoPass('✅ Contraseña actualizada correctamente');
      setPassNueva(''); setPassConfirmar('');
      setMostrarCambiarPass(false);
      setTimeout(() => setExitoPass(''), 3000);
    } catch (err: any) {
      setErrorPass('No se pudo actualizar la contraseña. Intenta de nuevo.');
    } finally {
      setGuardandoPass(false);
    }
  };

  const toggleHabilidad = (h: string) => {
    setHabilidadesSeleccionadas(prev =>
      prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]
    );
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

  const copiarCodigo = () => {
    if (!usuario?.codigo_referido) return;
    navigator.clipboard.writeText(usuario.codigo_referido);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const copiarCodigoModal = () => {
    navigator.clipboard.writeText(codigoRecienGenerado);
    setCopiadoModal(true);
    setTimeout(() => setCopiadoModal(false), 2000);
  };

  const compartirCodigoWA = (codigo: string) => {
    const texto = '¡Descarga Fleksi, la app para encontrar trabajo flexible en México! 🚀\nUsa mi código *' + codigo + '* al registrarte y gana un beneficio especial.\nDescárgala gratis 👉 bit.ly/fleksiapp';
    window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank');
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

  const pasosFaltantes = () => {
    if (!usuario) return [];
    const rol = usuario.rol_activo || usuario.rol || 'flekser';
    const pasos: string[] = [];
    if (!usuario.foto_url) pasos.push('Agrega una foto de perfil');
    if (!usuario.telefono?.trim()) pasos.push('Agrega tu teléfono');
    if (!usuario.ciudad?.trim()) pasos.push('Agrega tu ciudad');
    if (!usuario.descripcion?.trim()) pasos.push('Agrega una descripción');
    if (rol === 'empresa') {
      if (!usuario.datos_factura?.nombre_fiscal) pasos.push('Completa tus datos de facturación');
    } else {
      if (!usuario.habilidades?.length) pasos.push('Agrega al menos una habilidad');
    }
    const docsRequeridos = rol === 'empresa'
      ? ['ine_frente', 'ine_reverso', 'constancia_fiscal']
      : ['ine_frente', 'ine_reverso', 'curp', 'comprobante_domicilio'];
    const docsAprobados = documentos.filter(d =>
      docsRequeridos.includes(d.tipo) && d.estado === 'aprobado'
    ).length;
    if (docsAprobados < docsRequeridos.length) pasos.push('Sube y espera aprobación de documentos');
    return pasos;
  };

  const OjitoBTN = ({ ver, toggle }: { ver: boolean; toggle: () => void }) => (
    <button type="button" onClick={toggle}
      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
      {ver ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      )}
    </button>
  );

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
  const perfilCompleto = progresoPerfil === 100;
  const faltantes = pasosFaltantes();
  const todasLasFotos = [...portafolioManual.map((f: any) => ({ foto: f.foto_url, titulo: f.titulo || 'Mi trabajo', id: f.id, esManual: true })), ...portafolioTrabajos.map(f => ({ ...f, esManual: false }))];

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

        {mostrarBannerIntencion && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-purple-200 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🎯</span>
              <h3 className="font-extrabold text-gray-900">Una pregunta rápida</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">¿Con qué intención usas Fleksi? Nos ayuda a personalizar tu experiencia.</p>
            <div className="flex flex-col gap-2 mb-4">
              {intenciones.map((i) => (
                <button key={i.id} onClick={() => setIntencionSeleccionada(i.id)}
                  className={'flex items-center gap-3 p-3 rounded-xl border-2 transition text-left ' + (intencionSeleccionada === i.id ? i.color : 'border-gray-200 hover:border-gray-300')}>
                  <span className="text-2xl">{i.emoji}</span>
                  <div>
                    <p className={'font-bold text-sm ' + (intencionSeleccionada === i.id ? i.texto : 'text-gray-900')}>{i.titulo}</p>
                    <p className="text-xs text-gray-400">{i.desc}</p>
                  </div>
                  {intencionSeleccionada === i.id && (
                    <div className="ml-auto w-5 h-5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <button onClick={guardarIntencion} disabled={!intencionSeleccionada || guardandoIntencion}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-sm disabled:opacity-40 transition">
              {guardandoIntencion ? 'Guardando...' : 'Guardar mi intención →'}
            </button>
          </div>
        )}

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
                  className="w-full p-2 rounded-xl border-2 border-purple-400 outline-none text-gray-900 font-bold mb-1"
                  placeholder="Tu nombre"/>
              ) : (
                <h2 className="font-extrabold text-gray-900 text-lg">{nombre || 'Sin nombre'}</h2>
              )}
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="text-xs bg-purple-100 text-purple-600 font-semibold px-2 py-0.5 rounded-full">
                  ⚡ {usuario?.rol === 'empresa' ? 'Empresa' : 'Flekser'}
                </span>
                {tieneBadge('fundador') && <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">🏅 Fundador</span>}
                {tieneBadge('pionero') && <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">🚀 Pionero</span>}
                {tieneBadge('verificado') && <span className="text-xs bg-green-100 text-green-600 font-semibold px-2 py-0.5 rounded-full">✅ Verificado</span>}
                {tieneBadge('top_rated') && <span className="text-xs bg-yellow-100 text-yellow-600 font-semibold px-2 py-0.5 rounded-full">⭐ Top Rated</span>}
                {tieneBadge('confianza_maxima') && <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">🛡️ Confianza máxima</span>}
                {perfilCompleto && <span className="text-xs bg-purple-100 text-purple-600 font-semibold px-2 py-0.5 rounded-full">🏆 Perfil completo</span>}
                {usuario?.intencion === 'trabajar' && <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">💼 Busca trabajo</span>}
                {usuario?.intencion === 'contratar' && <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full">🔍 Busca contratar</span>}
                {usuario?.intencion === 'ambos' && <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">⚡ Trabaja y contrata</span>}
              </div>
            </div>
          </div>

          {!perfilCompleto && (
            <div className="mb-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-gray-700">Completa tu perfil</p>
                <span className="text-sm font-extrabold text-purple-600">{progresoPerfil}%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: progresoPerfil + '%',
                    background: progresoPerfil < 40 ? '#EF4444' : progresoPerfil < 70 ? '#F59E0B' : 'linear-gradient(90deg, #2563EB, #7C3AED)',
                  }}/>
              </div>
              {faltantes.length > 0 && (
                <div className="flex flex-col gap-1">
                  {faltantes.slice(0, 3).map((paso, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0"/>
                      <p className="text-xs text-gray-500">{paso}</p>
                    </div>
                  ))}
                  {faltantes.length > 3 && (
                    <p className="text-xs text-purple-500 font-semibold ml-3.5">+{faltantes.length - 3} más</p>
                  )}
                </div>
              )}
            </div>
          )}

          {perfilCompleto && (
            <div className="mb-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4 border border-purple-100 flex items-center gap-3">
              <span className="text-3xl">🏆</span>
              <div>
                <p className="font-extrabold text-purple-700 text-sm">¡Perfil al 100%!</p>
                <p className="text-xs text-purple-500">Apareces primero en búsquedas y generas más confianza</p>
              </div>
            </div>
          )}

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
            <button onClick={() => setEditando(true)}
              className="w-full py-3 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold hover:border-purple-400 transition">
              ✏️ Editar perfil
            </button>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => setEditando(false)}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold transition">
                Cancelar
              </button>
              <button onClick={guardarPerfil} disabled={guardando}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold disabled:opacity-50 transition">
                {guardando ? 'Guardando...' : 'Guardar ✓'}
              </button>
            </div>
          )}
        </div>

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

        {usuario?.codigo_referido && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <div className="mb-3">
              <h3 className="font-extrabold text-gray-900">🎁 Tu código de referido</h3>
              <p className="text-xs text-gray-400 mt-0.5">Compártelo y gana cuando tus referidos completen su primer trabajo</p>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-purple-200 rounded-2xl p-4 mb-3 text-center">
              <p className="text-2xl font-extrabold text-purple-700 tracking-widest">{usuario.codigo_referido}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-3">
              <p className="text-xs text-gray-600 leading-relaxed">
                💰 Cuando alguien se registra con tu código y completa su primer trabajo,
                <span className="font-bold text-green-600"> tú recibes un bono directo en tu Wallet.</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={copiarCodigo}
                className={'flex-1 py-2.5 rounded-xl font-bold text-sm transition ' + (copiado ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>
                {copiado ? '✅ ¡Copiado!' : '📋 Copiar código'}
              </button>
              <button onClick={() => compartirCodigoWA(usuario.codigo_referido)}
                className="flex-1 py-2.5 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition">
                💬 Compartir
              </button>
            </div>
          </div>
        )}

        <a href="/documentos" className={'block rounded-2xl p-5 shadow-sm border mb-4 transition hover:opacity-90 ' + verif.bg + ' ' + verif.border}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{verif.emoji}</span>
                <h3 className="font-extrabold text-gray-900">{verif.titulo}</h3>
              </div>
              <p className="text-xs text-gray-500 ml-7">{verif.texto}</p>
            </div>
            <span className={'flex-shrink-0 ml-3 px-3 py-2 rounded-xl text-xs font-bold ' + verif.botonColor}>
              {verif.boton} →
            </span>
          </div>
        </a>

        {tieneBadge('confianza_maxima') && (
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <span className="text-3xl">🛡️</span>
            <div>
              <p className="font-extrabold text-indigo-700 text-sm">¡Confianza máxima!</p>
              <p className="text-xs text-indigo-500">Tus antecedentes no penales fueron verificados. Los clientes confían más en ti.</p>
            </div>
          </div>
        )}

        {ciudadesVisitadas.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <h3 className="font-extrabold text-gray-900 mb-3">🗺️ Ciudades donde has trabajado</h3>
            <div className="flex flex-wrap gap-2">
              {ciudadesVisitadas.map((c, i) => (
                <span key={i} className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-600">📍 {c}</span>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-extrabold text-gray-900 mb-3">📱 Teléfono</h3>
          {editando ? (
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)}
              className="w-full p-3 rounded-xl border-2 border-purple-400 outline-none text-gray-900"
              placeholder="55 1234 5678"/>
          ) : (
            <p className="text-gray-600">{telefono || 'Sin teléfono registrado'}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-extrabold text-gray-900 mb-3">📍 Ciudad base</h3>
          {editando ? (
            <input value={ciudad} onChange={(e) => setCiudad(e.target.value)}
              className="w-full p-3 rounded-xl border-2 border-purple-400 outline-none text-gray-900"
              placeholder="Ej. Ciudad de México"/>
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

        {/* ── PORTAFOLIO MANUAL ── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-gray-900">📸 Mi portafolio</h3>
              <p className="text-xs text-gray-400 mt-0.5">Fotos de tu trabajo que los clientes verán antes de contratarte</p>
            </div>
            <button
              onClick={() => setMostrarAgregarFoto(!mostrarAgregarFoto)}
              className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-3 py-2 rounded-xl hover:opacity-90 transition">
              + Agregar
            </button>
          </div>

          {mostrarAgregarFoto && (
            <div className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-200">
              <p className="text-sm font-bold text-gray-700 mb-3">Nueva foto de portafolio</p>
              <input
                type="text"
                placeholder="Título opcional (ej. Uñas acrílicas, Limpieza de casa...)"
                value={tituloNuevoPortafolio}
                onChange={(e) => setTituloNuevoPortafolio(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none text-gray-900 text-sm mb-3 transition"/>
              <input
                ref={portafolioInputRef}
                type="file"
                accept="image/*"
                onChange={subirFotoPortafolio}
                className="hidden"/>
              <button
                onClick={() => portafolioInputRef.current?.click()}
                disabled={subiendoPortafolio}
                className="w-full py-3 border-2 border-dashed border-purple-300 rounded-xl text-purple-600 font-bold text-sm hover:bg-purple-50 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {subiendoPortafolio ? (
                  <><div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"/> Subiendo...</>
                ) : (
                  <> 📷 Seleccionar foto</>
                )}
              </button>
              <button
                onClick={() => { setMostrarAgregarFoto(false); setTituloNuevoPortafolio(''); }}
                className="w-full mt-2 py-2 text-gray-400 text-sm font-semibold hover:text-gray-600 transition">
                Cancelar
              </button>
            </div>
          )}

          {todasLasFotos.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-2xl">
              <p className="text-3xl mb-2">📷</p>
              <p className="text-gray-500 font-semibold text-sm">Sin fotos todavía</p>
              <p className="text-gray-400 text-xs mt-1">Agrega fotos de tus trabajos para atraer más clientes</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {todasLasFotos.map((item, i) => (
                <div key={i} className="relative group overflow-hidden rounded-xl aspect-square bg-gray-100">
                  <button onClick={() => setFotoAmpliada(item.foto)} className="w-full h-full">
                    <img src={item.foto} alt={item.titulo} className="w-full h-full object-cover group-hover:scale-105 transition duration-200"/>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition duration-200 rounded-xl"/>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-xl">
                      <p className="text-white text-xs font-semibold truncate">{item.titulo}</p>
                    </div>
                  </button>
                  {item.esManual && (
                    <button
                      onClick={() => eliminarFotoPortafolio(item)}
                      disabled={eliminandoFoto === item.id}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs shadow-lg opacity-0 group-hover:opacity-100 transition hover:bg-red-600">
                      {eliminandoFoto === item.id ? '⏳' : '✕'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {todasLasFotos.length > 0 && (
            <p className="text-xs text-gray-400 text-center mt-3">
              {portafolioManual.length} foto{portafolioManual.length !== 1 ? 's' : ''} manual{portafolioManual.length !== 1 ? 'es' : ''}
              {portafolioTrabajos.length > 0 && ' · ' + portafolioTrabajos.length + ' de trabajos completados'}
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-extrabold text-gray-900 mb-4">🏅 Insignias</h3>
          <div className="grid grid-cols-4 gap-3">
            {todosLosBadges.map((badge) => {
              const activo = tieneBadge(badge.tipo);
              return (
                <div key={badge.tipo} className={'text-center transition ' + (!activo ? 'opacity-30' : '')}>
                  <div className={'w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-1 mx-auto ' + (activo ? 'bg-gradient-to-r from-blue-50 to-purple-50 shadow-sm' : 'bg-gray-100')}>
                    {badge.emoji}
                  </div>
                  <p className="text-xs text-gray-500 font-semibold leading-tight">{badge.nombre}</p>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 text-center mt-3">
            {badges.length} de {todosLosBadges.length} insignias desbloqueadas
          </p>
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

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-extrabold text-gray-900 mb-3">🛠️ Mis habilidades</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {habilidades.map((h) => (
              <button key={h} onClick={() => editando && toggleHabilidad(h)}
                className={'px-3 py-1.5 rounded-full text-sm font-semibold transition ' + (habilidadesSeleccionadas.includes(h) ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-gray-100 text-gray-500') + ' ' + (editando ? 'cursor-pointer' : 'cursor-default')}>
                {h}
              </button>
            ))}
            {habilidadesSeleccionadas.filter(h => !habilidades.includes(h)).map((h) => (
              <span key={h} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                {h}
                {editando && (
                  <button onClick={() => toggleHabilidad(h)} className="ml-1 text-white/70 hover:text-white">✕</button>
                )}
              </span>
            ))}
          </div>
          {editando && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
              <input type="text" placeholder="Agregar habilidad personalizada..."
                value={habilidadCustom} onChange={(e) => setHabilidadCustom(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && agregarHabilidadCustom()}
                className="flex-1 p-3 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900 text-sm"/>
              <button onClick={agregarHabilidadCustom}
                className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold text-sm">
                + Agregar
              </button>
            </div>
          )}
          {!editando && habilidadesSeleccionadas.length === 0 && (
            <p className="text-gray-400 text-sm">Edita tu perfil para agregar habilidades</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
          <button onClick={() => setMostrarCuenta(!mostrarCuenta)}
            className="w-full flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚙️</span>
              <h3 className="font-extrabold text-gray-900">Mi cuenta</h3>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              className={'text-gray-400 transition-transform ' + (mostrarCuenta ? 'rotate-180' : '')}>
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>

          {mostrarCuenta && (
            <div className="px-5 pb-5 flex flex-col gap-4 border-t border-gray-100 pt-4">
              {exitoCuenta && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl text-sm font-semibold">{exitoCuenta}</div>}
              {exitoPass && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl text-sm font-semibold">{exitoPass}</div>}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-gray-700 text-sm">👤 Datos personales</p>
                  {!editandoCuenta ? (
                    <button onClick={() => setEditandoCuenta(true)} className="text-xs text-purple-600 font-semibold hover:underline">Editar</button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setEditandoCuenta(false)} className="text-xs text-gray-400 font-semibold hover:underline">Cancelar</button>
                      <button onClick={guardarCuenta} disabled={guardandoCuenta} className="text-xs text-purple-600 font-bold hover:underline disabled:opacity-50">
                        {guardandoCuenta ? 'Guardando...' : 'Guardar ✓'}
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">Nombre</p>
                    {editandoCuenta ? (
                      <input value={cuentaNombre} onChange={(e) => setCuentaNombre(e.target.value)}
                        className="w-full p-2 rounded-lg border-2 border-purple-300 outline-none text-gray-900 text-sm bg-white"/>
                    ) : (
                      <p className="text-sm font-semibold text-gray-900">{usuario?.nombre || '—'}</p>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">Correo electrónico</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{usuario?.email || '—'}</p>
                      <span className="text-xs bg-green-100 text-green-600 font-bold px-2 py-0.5 rounded-full">✓ Verificado</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Para cambiar el correo contáctanos</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">Teléfono</p>
                    {editandoCuenta ? (
                      <input value={cuentaTelefono} onChange={(e) => setCuentaTelefono(e.target.value)}
                        className="w-full p-2 rounded-lg border-2 border-purple-300 outline-none text-gray-900 text-sm bg-white"
                        placeholder="+52 55 1234 5678"/>
                    ) : (
                      <p className="text-sm font-semibold text-gray-900">{usuario?.telefono || '—'}</p>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">Ciudad</p>
                    {editandoCuenta ? (
                      <input value={cuentaCiudad} onChange={(e) => setCuentaCiudad(e.target.value)}
                        className="w-full p-2 rounded-lg border-2 border-purple-300 outline-none text-gray-900 text-sm bg-white"
                        placeholder="Ej. Guadalajara"/>
                    ) : (
                      <p className="text-sm font-semibold text-gray-900">{usuario?.ciudad || '—'}</p>
                    )}
                  </div>
                </div>
                {errorCuenta && <p className="text-xs text-red-500 mt-2">{errorCuenta}</p>}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="font-bold text-gray-700 text-sm mb-3">🔐 Seguridad</p>
                <button onClick={() => setMostrarCambiarPass(!mostrarCambiarPass)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                  <span className="text-sm font-semibold text-gray-700">Cambiar contraseña</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    className={'text-gray-400 transition-transform ' + (mostrarCambiarPass ? 'rotate-180' : '')}>
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
                {mostrarCambiarPass && (
                  <div className="mt-3 flex flex-col gap-3">
                    {errorPass && <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-xl text-xs">{errorPass}</div>}
                    <div className="relative">
                      <input type={verPassNueva ? 'text' : 'password'} placeholder="Nueva contraseña"
                        value={passNueva} onChange={(e) => setPassNueva(e.target.value)}
                        className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none text-gray-900 text-sm pr-12"/>
                      <OjitoBTN ver={verPassNueva} toggle={() => setVerPassNueva(!verPassNueva)}/>
                    </div>
                    <div className="relative">
                      <input type={verPassConfirmar ? 'text' : 'password'} placeholder="Confirmar nueva contraseña"
                        value={passConfirmar} onChange={(e) => setPassConfirmar(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && cambiarPassword()}
                        className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none text-gray-900 text-sm pr-12"/>
                      <OjitoBTN ver={verPassConfirmar} toggle={() => setVerPassConfirmar(!verPassConfirmar)}/>
                    </div>
                    <button onClick={cambiarPassword} disabled={guardandoPass}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-sm disabled:opacity-50">
                      {guardandoPass ? 'Actualizando...' : 'Actualizar contraseña'}
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
                <button onClick={cerrarSesion}
                  className="w-full py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:border-gray-400 transition">
                  🚪 Cerrar sesión
                </button>
                <button onClick={() => setMostrarEliminar(!mostrarEliminar)}
                  className="w-full py-3 border-2 border-red-200 text-red-500 rounded-xl font-semibold text-sm hover:bg-red-50 transition">
                  🗑️ Eliminar mi cuenta
                </button>
                {mostrarEliminar && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm font-bold text-red-700 mb-2">⚠️ Esta acción es irreversible</p>
                    <p className="text-xs text-red-600 mb-3">Se eliminarán todos tus datos. Escribe <span className="font-bold">ELIMINAR</span> para confirmar.</p>
                    <input type="text" placeholder="Escribe ELIMINAR"
                      value={confirmEliminar} onChange={(e) => setConfirmEliminar(e.target.value)}
                      className="w-full p-3 rounded-xl border-2 border-red-300 outline-none text-gray-900 text-sm mb-3"/>
                    <button disabled={confirmEliminar !== 'ELIMINAR'}
                      onClick={async () => {
                        await supabase.from('usuarios').delete().eq('id', usuario.id);
                        await supabase.auth.signOut();
                        window.location.href = '/';
                      }}
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

      {fotoAmpliada && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
          onClick={() => setFotoAmpliada(null)}>
          <div className="relative max-w-sm w-full">
            <img src={fotoAmpliada} className="w-full rounded-2xl shadow-2xl object-contain max-h-[80vh]"/>
            <button onClick={() => setFotoAmpliada(null)}
              className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-700 font-bold shadow-lg text-lg">✕</button>
          </div>
        </div>
      )}

      {mostrarModalCodigo && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 pt-8 pb-10 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-4xl">🎁</span>
              </div>
              <h2 className="text-white font-extrabold text-2xl mb-1">¡Tienes código de referido!</h2>
              <p className="text-white/80 text-sm">Te generamos uno automáticamente</p>
            </div>
            <div className="-mt-6 bg-white rounded-t-3xl px-6 pt-6 pb-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-purple-200 rounded-2xl p-5 mb-5 text-center">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tu código de referido</p>
                <p className="text-3xl font-extrabold text-purple-700 tracking-widest mb-1">{codigoRecienGenerado}</p>
                <p className="text-xs text-gray-400">Ya aparece en tu perfil siempre</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 mb-5">
                <p className="text-sm font-bold text-gray-900 mb-2">💰 ¿Cómo funciona?</p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2"><span className="text-purple-600 font-bold text-sm flex-shrink-0">1.</span><p className="text-xs text-gray-600">Comparte tu código con amigos o en redes sociales.</p></div>
                  <div className="flex items-start gap-2"><span className="text-purple-600 font-bold text-sm flex-shrink-0">2.</span><p className="text-xs text-gray-600">Ellos se registran en Fleksi usando tu código.</p></div>
                  <div className="flex items-start gap-2"><span className="text-purple-600 font-bold text-sm flex-shrink-0">3.</span><p className="text-xs text-gray-600">Cuando tu referido completa su primer trabajo, <span className="font-bold text-green-600">tú recibes un bono en tu Wallet 💸</span></p></div>
                </div>
              </div>
              <div className="flex gap-3 mb-4">
                <button onClick={copiarCodigoModal}
                  className={'flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition ' + (copiadoModal ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>
                  {copiadoModal ? '✅ ¡Copiado!' : '📋 Copiar código'}
                </button>
                <button onClick={() => compartirCodigoWA(codigoRecienGenerado)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-2xl font-bold text-sm hover:bg-green-600 transition">
                  💬 WhatsApp
                </button>
              </div>
              <button onClick={() => setMostrarModalCodigo(false)}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg hover:opacity-90 transition">
                ¡Entendido! →
              </button>
            </div>
          </div>
        </div>
      )}

      <Nav activo="perfil" />
    </main>
  );
}