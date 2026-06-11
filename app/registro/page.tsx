'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ESTADOS, getCiudades, formatearUbicacion } from '@/lib/ciudades';

const roles = [
  { id: 'flekser', emoji: '⚡', titulo: 'Soy Flekser', desc: 'Ofrece servicios y contrata cuando lo necesites' },
  { id: 'empresa', emoji: '🏢', titulo: 'Soy empresa', desc: 'Cubre vacantes temporales con talento verificado' },
];

const intenciones = [
  { id: 'trabajar', emoji: '💼', titulo: 'Quiero trabajar / ofrecer servicios', desc: 'Busco ganar dinero ofreciendo mis habilidades', color: 'border-blue-400 bg-blue-50', badge: 'bg-blue-100 text-blue-700' },
  { id: 'contratar', emoji: '🔍', titulo: 'Quiero contratar / buscar ayuda', desc: 'Necesito a alguien que me ayude con algo', color: 'border-purple-400 bg-purple-50', badge: 'bg-purple-100 text-purple-700' },
  { id: 'ambos', emoji: '⚡', titulo: 'Ambos', desc: 'Quiero trabajar y también contratar servicios', color: 'border-green-400 bg-green-50', badge: 'bg-green-100 text-green-700' },
];

function generarCodigo(nombre: string): string {
  const base = nombre.trim().toUpperCase().replace(/\s+/g, '').slice(0, 4).padEnd(4, 'X');
  const aleatorio = Math.random().toString(36).substring(2, 6).toUpperCase();
  return base + '-' + aleatorio;
}

function RegistroForm() {
  const searchParams = useSearchParams();
  const [paso, setPaso] = useState(1);
  const [intencion, setIntencion] = useState('');
  const [rol, setRol] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [codigoReferido, setCodigoReferido] = useState('');
  const [codigoValido, setCodigoValido] = useState<boolean | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const [estadoSeleccionado, setEstadoSeleccionado] = useState('');
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState('');

  const [mostrarBienvenida, setMostrarBienvenida] = useState(false);
  const [codigoGenerado, setCodigoGenerado] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [rolRegistrado, setRolRegistrado] = useState('');

  useEffect(() => {
    const rolParam = searchParams.get('rol');
    if (rolParam && ['flekser', 'empresa'].includes(rolParam)) {
      setRol(rolParam);
      setPaso(2);
    }
    const refParam = searchParams.get('ref');
    if (refParam) setCodigoReferido(refParam.toUpperCase());
  }, [searchParams]);

  const validarCodigo = async (codigo: string) => {
    if (!codigo || codigo.length < 4) { setCodigoValido(null); return; }
    const { data } = await supabase.from('usuarios').select('id').eq('codigo_referido', codigo.toUpperCase()).maybeSingle();
    setCodigoValido(!!data);
  };

  const copiarCodigo = () => {
    navigator.clipboard.writeText(codigoGenerado);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const compartirWhatsApp = () => {
    const texto = '¡Descarga Fleksi, la app para encontrar trabajo flexible en México! 🚀\nUsa mi código *' + codigoGenerado + '* al registrarte y gana un beneficio especial.\nDescárgala gratis 👉 bit.ly/fleksiapp';
    window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank');
  };

  const irAlOnboarding = () => {
    window.location.href = '/onboarding?rol=' + rolRegistrado;
  };

  const handleRegistro = async () => {
    if (!nombre || !email || !password) { setError('Por favor llena todos los campos'); return; }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    if (!aceptaTerminos) { setError('Debes aceptar los Términos y Condiciones y el Aviso de Privacidad para continuar'); return; }
    setCargando(true); setError('');
    try {
      if (telefono) {
        const telefonoCompleto = '+52' + telefono.replace(/\s/g, '');
        const { data: existente } = await supabase.from('usuarios').select('id').eq('telefono', telefonoCompleto).maybeSingle();
        if (existente) { setError('Este número de teléfono ya está registrado. ¿Ya tienes cuenta?'); setCargando(false); return; }
      }

      const { data, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) {
        if (authError.message.includes('already registered')) setError('Este correo ya está registrado. ¿Ya tienes cuenta?');
        else throw authError;
        return;
      }

      if (data.user) {
        const { count } = await supabase.from('usuarios').select('*', { count: 'exact', head: true });

        let referidoPor = null;
        if (codigoReferido) {
          const { data: referidor } = await supabase.from('usuarios').select('id').eq('codigo_referido', codigoReferido.toUpperCase()).maybeSingle();
          if (referidor) referidoPor = codigoReferido.toUpperCase();
        }

        let codigoUnico = generarCodigo(nombre);
        let intentos = 0;
        while (intentos < 5) {
          const { data: existe } = await supabase.from('usuarios').select('id').eq('codigo_referido', codigoUnico).maybeSingle();
          if (!existe) break;
          codigoUnico = generarCodigo(nombre);
          intentos++;
        }

        const ubicacion = estadoSeleccionado && ciudadSeleccionada
          ? formatearUbicacion(estadoSeleccionado, ciudadSeleccionada)
          : null;

        const { error: dbError } = await supabase.from('usuarios').insert({
          id: data.user.id,
          nombre,
          telefono: telefono ? '+52' + telefono.replace(/\s/g, '') : null,
          rol, rol_activo: rol, roles: [rol], email,
          terminos_aceptados_at: new Date().toISOString(),
          referido_por: referidoPor,
          codigo_referido: codigoUnico,
          intencion: intencion || null,
          ciudad: ubicacion,
          estado: estadoSeleccionado || null,
          primer_trabajo_completado: false,
        });
        if (dbError) throw dbError;

        const totalUsuarios = (count || 0) + 1;
        if (totalUsuarios <= 50) {
          await supabase.from('badges').insert({ usuario_id: data.user.id, tipo: 'fundador', nombre: 'Fundador', emoji: '🏅' });
        } else if (totalUsuarios <= 100) {
          await supabase.from('badges').insert({ usuario_id: data.user.id, tipo: 'pionero', nombre: 'Pionero', emoji: '🚀' });
        }

        try {
          await fetch('/api/enviar-email', { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo: 'bienvenida', destinatario: email, datos: { nombre, rol, usuario_id: data.user.id } }) });
        } catch (e) {}

        setCodigoGenerado(codigoUnico);
        setRolRegistrado(rol);
        setMostrarBienvenida(true);
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error. Intenta de nuevo.');
    } finally { setCargando(false); }
  };

  const ciudadesDelEstado = getCiudades(estadoSeleccionado);

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">

        <div className="flex items-center justify-center gap-3 mb-8">
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="lg2" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#2563EB"/>
                <stop offset="100%" stopColor="#7C3AED"/>
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="10" fill="url(#lg2)"/>
            <rect x="8" y="8" width="16" height="3.5" rx="1.75" fill="white"/>
            <rect x="8" y="14.25" width="11" height="3.5" rx="1.75" fill="white" opacity="0.85"/>
            <rect x="8" y="20.5" width="7" height="3.5" rx="1.75" fill="white" opacity="0.65"/>
          </svg>
          <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">fleksi</span>
        </div>

        {/* Indicador de pasos */}
        <div className="flex gap-1.5 mb-8">
          {[1,2,3,4].map((p) => (
            <div key={p} className={'h-1.5 flex-1 rounded-full transition-all ' + (p <= paso ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200')}/>
          ))}
        </div>

        {/* ── PASO 1: Intención ── */}
        {paso === 1 && (
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 text-center mb-2">¿Con qué intención te unes?</h1>
            <p className="text-gray-400 text-center mb-8 font-light">Esto nos ayuda a personalizar tu experiencia</p>
            <div className="flex flex-col gap-3 mb-6">
              {intenciones.map((i) => (
                <button key={i.id} onClick={() => setIntencion(i.id)}
                  className={'w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition text-left ' + (intencion === i.id ? i.color : 'border-gray-200 hover:border-gray-300')}>
                  <span className="text-3xl">{i.emoji}</span>
                  <div>
                    <div className="font-bold text-gray-900">{i.titulo}</div>
                    <div className="text-sm text-gray-400 font-light">{i.desc}</div>
                  </div>
                  {intencion === i.id && (
                    <div className="ml-auto w-5 h-5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <button onClick={() => { if (intencion) setPaso(2); }} disabled={!intencion}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg disabled:opacity-40 transition">
              Continuar →
            </button>
            <p className="mt-4 text-center text-gray-400 text-xs">Esto no limita lo que puedes hacer en Fleksi, es solo informativo.</p>
            <p className="mt-4 text-center text-gray-400 text-sm">
              ¿Ya tienes cuenta? <a href="/login" className="text-purple-600 font-semibold hover:underline">Inicia sesión</a>
            </p>
          </div>
        )}

        {/* ── PASO 2: Tipo de cuenta ── */}
        {paso === 2 && (
          <div>
            <button onClick={() => { setPaso(1); setRol(''); }} className="flex items-center gap-2 text-gray-400 mb-6 hover:text-gray-600 transition">← Regresar</button>
            <h1 className="text-2xl font-extrabold text-gray-900 text-center mb-2">¿Cómo vas a usar Fleksi?</h1>
            <p className="text-gray-400 text-center mb-8 font-light">Elige tu perfil para continuar</p>
            <div className="flex flex-col gap-3">
              {roles.map((r) => (
                <button key={r.id} onClick={() => { setRol(r.id); setPaso(3); }}
                  className="w-full p-4 rounded-2xl border-2 border-gray-200 hover:border-purple-400 flex items-center gap-4 transition text-left">
                  <span className="text-3xl">{r.emoji}</span>
                  <div>
                    <div className="font-bold text-gray-900">{r.titulo}</div>
                    <div className="text-sm text-gray-400 font-light">{r.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── PASO 3: Datos de cuenta ── */}
        {paso === 3 && (
          <div>
            <button onClick={() => { setPaso(2); setRol(''); }} className="flex items-center gap-2 text-gray-400 mb-6 hover:text-gray-600 transition">← Regresar</button>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Crea tu cuenta</h1>
            <p className="text-gray-400 mb-8 font-light">
              Registrándote como <span className="font-semibold text-purple-600">{roles.find(r => r.id === rol)?.titulo}</span>
            </p>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-4 text-sm">{error}</div>}

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">
                  {rol === 'empresa' ? 'Nombre de la empresa' : 'Nombre completo'}
                </label>
                <input type="text" placeholder={rol === 'empresa' ? 'Ej. Servicios Limpios SA' : 'Ej. María López'}
                  value={nombre} onChange={(e) => setNombre(e.target.value)}
                  className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900"/>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Teléfono celular</label>
                <div className="flex gap-2">
                  <div className="p-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold whitespace-nowrap">🇲🇽 +52</div>
                  <input type="tel" placeholder="55 1234 5678" value={telefono} onChange={(e) => setTelefono(e.target.value)}
                    className="flex-1 p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900"/>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Correo electrónico</label>
                <input type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900"/>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Contraseña</label>
                <div className="relative">
                  <input type={verPassword ? 'text' : 'password'} placeholder="Mínimo 8 caracteres"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && setPaso(4)}
                    className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900 pr-14"/>
                  <button type="button" onClick={() => setVerPassword(!verPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                    {verPassword ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Código de referido <span className="text-gray-400 font-normal">(opcional)</span></label>
                <div className="relative">
                  <input type="text" placeholder="Ej. MARI-X7K2"
                    value={codigoReferido}
                    onChange={(e) => { setCodigoReferido(e.target.value.toUpperCase()); validarCodigo(e.target.value); }}
                    className={'w-full p-4 rounded-2xl border-2 outline-none transition text-gray-900 uppercase pr-12 ' + (codigoValido === true ? 'border-green-400 bg-green-50' : codigoValido === false ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-purple-400')}/>
                  {codigoValido !== null && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg">{codigoValido ? '✅' : '❌'}</span>
                  )}
                </div>
                {codigoValido === true && <p className="text-green-600 text-xs font-semibold mt-1.5">🎉 ¡Código válido! Pagarás menos comisión en tu primer trabajo</p>}
                {codigoValido === false && <p className="text-red-500 text-xs mt-1.5">Código no encontrado, verifica e intenta de nuevo</p>}
              </div>

              <div onClick={() => setAceptaTerminos(!aceptaTerminos)}
                className={'flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition ' + (aceptaTerminos ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-white hover:border-purple-200')}>
                <div className={'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition ' + (aceptaTerminos ? 'bg-purple-600 border-purple-600' : 'border-gray-300')}>
                  {aceptaTerminos && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed" onClick={(e) => e.stopPropagation()}>
                  He leído y acepto los{' '}
                  <a href="/terminos" target="_blank" className="text-purple-600 font-semibold hover:underline" onClick={(e) => e.stopPropagation()}>Términos y Condiciones</a>
                  {' '}y el{' '}
                  <a href="/privacidad" target="_blank" className="text-purple-600 font-semibold hover:underline" onClick={(e) => e.stopPropagation()}>Aviso de Privacidad</a>
                  {' '}de Fleksi.
                </p>
              </div>

              <button
                onClick={() => {
                  if (!nombre || !email || !password) { setError('Por favor llena todos los campos'); return; }
                  if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
                  if (!aceptaTerminos) { setError('Debes aceptar los Términos y Condiciones'); return; }
                  setError('');
                  setPaso(4);
                }}
                disabled={!aceptaTerminos}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:opacity-90 transition mt-2 disabled:opacity-50">
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* ── PASO 4: Ubicación ── */}
        {paso === 4 && (
          <div>
            <button onClick={() => setPaso(3)} className="flex items-center gap-2 text-gray-400 mb-6 hover:text-gray-600 transition">← Regresar</button>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">📍</div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">¿Dónde estás?</h1>
              <p className="text-gray-400 font-light">Así te mostramos trabajos y clientes cerca de ti</p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-4 text-sm">{error}</div>}

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Estado</label>
                <select
                  value={estadoSeleccionado}
                  onChange={(e) => { setEstadoSeleccionado(e.target.value); setCiudadSeleccionada(''); }}
                  className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900 bg-white appearance-none">
                  <option value="">Selecciona tu estado...</option>
                  {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              {estadoSeleccionado && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Ciudad</label>
                  <select
                    value={ciudadSeleccionada}
                    onChange={(e) => setCiudadSeleccionada(e.target.value)}
                    className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900 bg-white appearance-none">
                    <option value="">Selecciona tu ciudad...</option>
                    {ciudadesDelEstado.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              {estadoSeleccionado && ciudadSeleccionada && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-purple-100 flex items-center gap-3">
                  <span className="text-2xl">📍</span>
                  <div>
                    <p className="font-extrabold text-gray-900">{ciudadSeleccionada}</p>
                    <p className="text-xs text-gray-500">{estadoSeleccionado}, México</p>
                  </div>
                  <span className="ml-auto text-green-500 text-xl">✓</span>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <p className="text-blue-800 text-xs font-semibold">💡 ¿Por qué necesitamos tu ubicación?</p>
                <p className="text-blue-700 text-xs mt-1 leading-relaxed">Para mostrarte trabajos y clientes cerca de ti. Puedes cambiarlo en cualquier momento desde tu perfil.</p>
              </div>

              <button
                onClick={handleRegistro}
                disabled={cargando || !estadoSeleccionado || !ciudadSeleccionada}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:opacity-90 transition disabled:opacity-50">
                {cargando ? 'Creando cuenta...' : '🚀 Crear cuenta →'}
              </button>

              <button
                onClick={handleRegistro}
                disabled={cargando}
                className="w-full py-3 text-gray-400 text-sm font-semibold hover:text-gray-600 transition">
                {cargando ? '' : 'Omitir por ahora →'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL BIENVENIDA ── */}
      {mostrarBienvenida && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 pt-8 pb-10 text-center relative">
              <div className="absolute top-4 right-4">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">🎉</span>
                </div>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect width="32" height="32" rx="8" fill="rgba(255,255,255,0.3)"/>
                  <rect x="8" y="8" width="16" height="3.5" rx="1.75" fill="white"/>
                  <rect x="8" y="14.25" width="11" height="3.5" rx="1.75" fill="white" opacity="0.85"/>
                  <rect x="8" y="20.5" width="7" height="3.5" rx="1.75" fill="white" opacity="0.65"/>
                </svg>
              </div>
              <h2 className="text-white font-extrabold text-2xl mb-1">¡Bienvenido a Fleksi!</h2>
              <p className="text-white/80 text-sm">Tu cuenta fue creada exitosamente ✅</p>
            </div>
            <div className="-mt-6 bg-white rounded-t-3xl px-6 pt-6 pb-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-purple-200 rounded-2xl p-5 mb-5 text-center">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tu código de referido</p>
                <p className="text-3xl font-extrabold text-purple-700 tracking-widest mb-1">{codigoGenerado}</p>
                <p className="text-xs text-gray-400">Compártelo y gana dinero cuando tus referidos trabajen</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 mb-5">
                <p className="text-sm font-bold text-gray-900 mb-2">💰 ¿Cómo funciona?</p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2"><span className="text-purple-600 font-bold text-sm flex-shrink-0">1.</span><p className="text-xs text-gray-600">Comparte tu código con amigos, familiares o en redes sociales.</p></div>
                  <div className="flex items-start gap-2"><span className="text-purple-600 font-bold text-sm flex-shrink-0">2.</span><p className="text-xs text-gray-600">Ellos se registran en Fleksi usando tu código.</p></div>
                  <div className="flex items-start gap-2"><span className="text-purple-600 font-bold text-sm flex-shrink-0">3.</span><p className="text-xs text-gray-600">Cuando tu referido completa su primer trabajo, <span className="font-bold text-green-600">tú recibes un bono en tu Wallet 💸</span></p></div>
                </div>
              </div>
              <div className="flex gap-3 mb-4">
                <button onClick={copiarCodigo}
                  className={'flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition ' + (copiado ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>
                  {copiado ? '✅ ¡Copiado!' : '📋 Copiar código'}
                </button>
                <button onClick={compartirWhatsApp}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-2xl font-bold text-sm hover:bg-green-600 transition">
                  💬 WhatsApp
                </button>
              </div>
              <button onClick={irAlOnboarding}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg hover:opacity-90 transition">
                Entrar a Fleksi →
              </button>
              <p className="text-xs text-gray-400 text-center mt-3">Tu código siempre estará disponible en tu perfil</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function Registro() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </main>
    }>
      <RegistroForm />
    </Suspense>
  );
}