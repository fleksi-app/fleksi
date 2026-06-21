'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ESTADOS, getCiudades, formatearUbicacion } from '@/lib/ciudades';

const MORADO = '#7B2FE0';

const roles = [
  { id: 'flekser', emoji: '⚡', titulo: 'Soy Flekser', desc: 'Ofrece servicios y contrata cuando lo necesites' },
  { id: 'empresa', emoji: '🏢', titulo: 'Soy empresa', desc: 'Cubre vacantes temporales con talento verificado' },
];

const intenciones = [
  { id: 'trabajar', emoji: '💼', titulo: 'Quiero trabajar / ofrecer servicios', desc: 'Busco ganar dinero ofreciendo mis habilidades' },
  { id: 'contratar', emoji: '🔍', titulo: 'Quiero contratar / buscar ayuda', desc: 'Necesito a alguien que me ayude con algo' },
  { id: 'ambos', emoji: '⚡', titulo: 'Ambos', desc: 'Quiero trabajar y también contratar servicios' },
];

function generarCodigo(nombre: string): string {
  const base = nombre.trim().toUpperCase().replace(/\s+/g, '').slice(0, 4).padEnd(4, 'X');
  const aleatorio = Math.random().toString(36).substring(2, 6).toUpperCase();
  return base + '-' + aleatorio;
}

const Logo = () => (
  <div className="flex items-center justify-center gap-2.5 mb-8">
    <svg width="32" height="32" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" rx="110" fill="#F8FAFC"/>
      <rect x="112" y="140" width="288" height="72" rx="36" fill={MORADO}/>
      <rect x="112" y="244" width="220" height="72" rx="36" fill={MORADO}/>
      <rect x="112" y="348" width="152" height="72" rx="36" fill={MORADO}/>
    </svg>
    <span className="text-2xl font-extrabold" style={{color: '#1A1A2E', letterSpacing: '-0.5px'}}>fleksi</span>
  </div>
);

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
    if (rolParam && ['flekser', 'empresa'].includes(rolParam)) { setRol(rolParam); setPaso(2); }
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
    const texto = '¡Descarga Fleksi, la app para encontrar trabajo flexible en México! 🚀\nUsa mi código *' + codigoGenerado + '* al registrarte.\nDescárgala gratis 👉 bit.ly/fleksiapp';
    window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank');
  };

  const handleRegistro = async () => {
    if (!nombre || !email || !password) { setError('Por favor llena todos los campos'); return; }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    if (!aceptaTerminos) { setError('Debes aceptar los Términos y Condiciones para continuar'); return; }
    setCargando(true); setError('');
    try {
      if (telefono) {
        const tel = '+52' + telefono.replace(/\s/g, '');
        const { data: existente } = await supabase.from('usuarios').select('id').eq('telefono', tel).maybeSingle();
        if (existente) { setError('Este número ya está registrado. ¿Ya tienes cuenta?'); setCargando(false); return; }
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
          const { data: ref } = await supabase.from('usuarios').select('id').eq('codigo_referido', codigoReferido.toUpperCase()).maybeSingle();
          if (ref) referidoPor = codigoReferido.toUpperCase();
        }
        let codigoUnico = generarCodigo(nombre);
        for (let i = 0; i < 5; i++) {
          const { data: existe } = await supabase.from('usuarios').select('id').eq('codigo_referido', codigoUnico).maybeSingle();
          if (!existe) break;
          codigoUnico = generarCodigo(nombre);
        }
        const ubicacion = estadoSeleccionado && ciudadSeleccionada ? formatearUbicacion(estadoSeleccionado, ciudadSeleccionada) : null;
        const { error: dbError } = await supabase.from('usuarios').insert({
          id: data.user.id, nombre, email,
          telefono: telefono ? '+52' + telefono.replace(/\s/g, '') : null,
          rol, rol_activo: rol, roles: [rol],
          terminos_aceptados_at: new Date().toISOString(),
          referido_por: referidoPor, codigo_referido: codigoUnico,
          intencion: intencion || null, ciudad: ubicacion,
          estado: estadoSeleccionado || null, primer_trabajo_completado: false,
        });
        if (dbError) throw dbError;
        const total = (count || 0) + 1;
        if (total <= 50) await supabase.from('badges').insert({ usuario_id: data.user.id, tipo: 'fundador', nombre: 'Fundador', emoji: '🏅' });
        else if (total <= 100) await supabase.from('badges').insert({ usuario_id: data.user.id, tipo: 'pionero', nombre: 'Pionero', emoji: '🚀' });
        try { await fetch('/api/enviar-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo: 'bienvenida', destinatario: email, datos: { nombre, rol, usuario_id: data.user.id } }) }); } catch {}
        setCodigoGenerado(codigoUnico); setRolRegistrado(rol); setMostrarBienvenida(true);
      }
    } catch (err: any) { setError(err.message || 'Ocurrió un error. Intenta de nuevo.'); }
    finally { setCargando(false); }
  };

  const ciudadesDelEstado = getCiudades(estadoSeleccionado);

  const pasosBarra = [1, 2, 3, 4];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6" style={{background: '#F8FAFC'}}>
      <div className="max-w-md w-full">
        <Logo />

        {/* Barra de pasos */}
        <div className="flex gap-1.5 mb-6">
          {pasosBarra.map(p => (
            <div key={p} className="h-1.5 flex-1 rounded-full transition-all"
              style={{background: p <= paso ? MORADO : '#E5E7EB'}}/>
          ))}
        </div>

        <div className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100">

          {/* ── PASO 1: Intención ── */}
          {paso === 1 && (
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 mb-1">¿Con qué intención te unes?</h1>
              <p className="text-gray-400 text-sm mb-5">Esto nos ayuda a personalizar tu experiencia</p>
              <div className="flex flex-col gap-3 mb-5">
                {intenciones.map(i => (
                  <button key={i.id} onClick={() => setIntencion(i.id)}
                    className="w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition text-left"
                    style={{borderColor: intencion === i.id ? MORADO : '#E5E7EB', background: intencion === i.id ? '#F5F0FF' : 'white'}}>
                    <span className="text-2xl">{i.emoji}</span>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-sm">{i.titulo}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{i.desc}</p>
                    </div>
                    {intencion === i.id && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{background: MORADO}}>
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <button onClick={() => { if (intencion) setPaso(2); }} disabled={!intencion}
                className="w-full py-4 text-white rounded-2xl font-bold text-sm disabled:opacity-40 transition" style={{background: MORADO}}>
                Continuar →
              </button>
              <p className="mt-4 text-center text-xs text-gray-400">¿Ya tienes cuenta? <a href="/login" className="font-bold hover:underline" style={{color: MORADO}}>Inicia sesión</a></p>
            </div>
          )}

          {/* ── PASO 2: Tipo de cuenta ── */}
          {paso === 2 && (
            <div>
              <button onClick={() => { setPaso(1); setRol(''); }} className="flex items-center gap-2 text-gray-400 mb-5 text-sm font-semibold hover:text-gray-600 transition">← Regresar</button>
              <h1 className="text-xl font-extrabold text-gray-900 mb-1">¿Cómo vas a usar Fleksi?</h1>
              <p className="text-gray-400 text-sm mb-5">Elige tu perfil para continuar</p>
              <div className="flex flex-col gap-3">
                {roles.map(r => (
                  <button key={r.id} onClick={() => { setRol(r.id); setPaso(3); }}
                    className="w-full p-4 rounded-2xl border-2 border-gray-100 flex items-center gap-4 transition text-left hover:border-purple-200 bg-gray-50">
                    <span className="text-2xl">{r.emoji}</span>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{r.titulo}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
                    </div>
                    <span className="ml-auto text-gray-400 text-sm">→</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── PASO 3: Datos ── */}
          {paso === 3 && (
            <div>
              <button onClick={() => { setPaso(2); setRol(''); }} className="flex items-center gap-2 text-gray-400 mb-5 text-sm font-semibold hover:text-gray-600 transition">← Regresar</button>
              <h1 className="text-xl font-extrabold text-gray-900 mb-1">Crea tu cuenta</h1>
              <p className="text-gray-400 text-sm mb-5">Registrándote como <span className="font-bold" style={{color: MORADO}}>{roles.find(r => r.id === rol)?.titulo}</span></p>
              {error && <p className="text-red-500 text-xs bg-red-50 p-3 rounded-xl mb-4">{error}</p>}
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">{rol === 'empresa' ? 'Nombre de la empresa' : 'Nombre completo'}</label>
                  <input type="text" placeholder={rol === 'empresa' ? 'Servicios Limpios SA' : 'María López'}
                    value={nombre} onChange={e => setNombre(e.target.value)}
                    className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 focus:border-purple-300 outline-none text-gray-900 text-sm transition"/>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">Teléfono <span className="normal-case font-normal text-gray-400">(opcional)</span></label>
                  <div className="flex gap-2">
                    <div className="p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 text-gray-600 font-semibold text-sm whitespace-nowrap">🇲🇽 +52</div>
                    <input type="tel" placeholder="55 1234 5678" value={telefono} onChange={e => setTelefono(e.target.value)}
                      className="flex-1 p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 focus:border-purple-300 outline-none text-gray-900 text-sm transition"/>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">Correo electrónico</label>
                  <input type="email" placeholder="tu@correo.com" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 focus:border-purple-300 outline-none text-gray-900 text-sm transition"/>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">Contraseña</label>
                  <div className="relative">
                    <input type={verPassword ? 'text' : 'password'} placeholder="Mínimo 8 caracteres"
                      value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 focus:border-purple-300 outline-none text-gray-900 text-sm transition pr-12"/>
                    <button type="button" onClick={() => setVerPassword(!verPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                      {verPassword
                        ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">Código de referido <span className="normal-case font-normal text-gray-400">(opcional)</span></label>
                  <div className="relative">
                    <input type="text" placeholder="Ej. MARI-X7K2" value={codigoReferido}
                      onChange={e => { setCodigoReferido(e.target.value.toUpperCase()); validarCodigo(e.target.value); }}
                      className="w-full p-4 rounded-2xl border-2 bg-gray-50 focus:border-purple-300 outline-none text-gray-900 text-sm transition uppercase pr-12"
                      style={{borderColor: codigoValido === true ? '#22C55E' : codigoValido === false ? '#EF4444' : '#F1F5F9'}}/>
                    {codigoValido !== null && <span className="absolute right-4 top-1/2 -translate-y-1/2">{codigoValido ? '✅' : '❌'}</span>}
                  </div>
                  {codigoValido === true && <p className="text-green-600 text-xs font-semibold mt-1">🎉 ¡Código válido!</p>}
                  {codigoValido === false && <p className="text-red-500 text-xs mt-1">Código no encontrado</p>}
                </div>
                <div onClick={() => setAceptaTerminos(!aceptaTerminos)}
                  className="flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition"
                  style={{borderColor: aceptaTerminos ? MORADO : '#F1F5F9', background: aceptaTerminos ? '#F5F0FF' : '#F8FAFC'}}>
                  <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition"
                    style={{background: aceptaTerminos ? MORADO : 'transparent', borderColor: aceptaTerminos ? MORADO : '#D1D5DB'}}>
                    {aceptaTerminos && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed" onClick={e => e.stopPropagation()}>
                    He leído y acepto los{' '}
                    <a href="/terminos" target="_blank" className="font-bold hover:underline" style={{color: MORADO}} onClick={e => e.stopPropagation()}>Términos y Condiciones</a>
                    {' '}y el{' '}
                    <a href="/privacidad" target="_blank" className="font-bold hover:underline" style={{color: MORADO}} onClick={e => e.stopPropagation()}>Aviso de Privacidad</a>
                  </p>
                </div>
                <button onClick={() => {
                  if (!nombre || !email || !password) { setError('Por favor llena todos los campos'); return; }
                  if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
                  if (!aceptaTerminos) { setError('Debes aceptar los Términos y Condiciones'); return; }
                  setError(''); setPaso(4);
                }} disabled={!aceptaTerminos}
                  className="w-full py-4 text-white rounded-2xl font-bold text-sm disabled:opacity-50 transition" style={{background: MORADO}}>
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {/* ── PASO 4: Ubicación ── */}
          {paso === 4 && (
            <div>
              <button onClick={() => setPaso(3)} className="flex items-center gap-2 text-gray-400 mb-5 text-sm font-semibold hover:text-gray-600 transition">← Regresar</button>
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3" style={{background: '#F5F0FF'}}>📍</div>
                <h1 className="text-xl font-extrabold text-gray-900 mb-1">¿Dónde estás?</h1>
                <p className="text-gray-400 text-sm">Para mostrarte trabajos cerca de ti</p>
              </div>
              {error && <p className="text-red-500 text-xs bg-red-50 p-3 rounded-xl mb-4">{error}</p>}
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">Estado</label>
                  <select value={estadoSeleccionado} onChange={e => { setEstadoSeleccionado(e.target.value); setCiudadSeleccionada(''); }}
                    className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 outline-none text-gray-900 text-sm">
                    <option value="">Selecciona tu estado...</option>
                    {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                {estadoSeleccionado && (
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">Ciudad</label>
                    <select value={ciudadSeleccionada} onChange={e => setCiudadSeleccionada(e.target.value)}
                      className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 outline-none text-gray-900 text-sm">
                      <option value="">Selecciona tu ciudad...</option>
                      {ciudadesDelEstado.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}
                {estadoSeleccionado && ciudadSeleccionada && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl border-2" style={{borderColor: MORADO, background: '#F5F0FF'}}>
                    <span className="text-xl">📍</span>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-sm">{ciudadSeleccionada}</p>
                      <p className="text-xs text-gray-400">{estadoSeleccionado}, México</p>
                    </div>
                    <span className="text-green-500 font-bold">✓</span>
                  </div>
                )}
                <button onClick={handleRegistro} disabled={cargando || !estadoSeleccionado || !ciudadSeleccionada}
                  className="w-full py-4 text-white rounded-2xl font-bold text-sm disabled:opacity-50 transition" style={{background: MORADO}}>
                  {cargando ? 'Creando cuenta...' : '🚀 Crear cuenta'}
                </button>
                <button onClick={handleRegistro} disabled={cargando}
                  className="w-full py-2 text-gray-400 text-xs font-semibold hover:text-gray-600 transition">
                  {cargando ? '' : 'Omitir por ahora →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL BIENVENIDA ── */}
      {mostrarBienvenida && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-6 pt-8 pb-10 text-center relative" style={{background: MORADO}}>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl">🎉</div>
              <h2 className="text-white font-extrabold text-xl mb-1">¡Bienvenido a Fleksi!</h2>
              <p className="text-white/80 text-sm">Tu cuenta fue creada exitosamente ✅</p>
            </div>
            <div className="-mt-6 bg-white rounded-t-3xl px-6 pt-6 pb-6">
              <div className="rounded-2xl p-5 mb-4 text-center border-2" style={{background: '#F5F0FF', borderColor: MORADO}}>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tu código de referido</p>
                <p className="text-3xl font-extrabold tracking-widest mb-1" style={{color: MORADO}}>{codigoGenerado}</p>
                <p className="text-xs text-gray-400">Compártelo y gana cuando tus referidos trabajen</p>
              </div>
              <div className="flex gap-3 mb-4">
                <button onClick={copiarCodigo}
                  className="flex-1 py-3 rounded-2xl font-bold text-sm transition"
                  style={{background: copiado ? '#22C55E' : '#F3F4F6', color: copiado ? 'white' : '#374151'}}>
                  {copiado ? '✅ ¡Copiado!' : '📋 Copiar código'}
                </button>
                <button onClick={compartirWhatsApp}
                  className="flex-1 py-3 bg-green-500 text-white rounded-2xl font-bold text-sm hover:bg-green-600 transition">
                  💬 WhatsApp
                </button>
              </div>
              <button onClick={() => window.location.href = '/onboarding?rol=' + rolRegistrado}
                className="w-full py-4 text-white rounded-2xl font-bold text-sm transition" style={{background: MORADO}}>
                Entrar a Fleksi →
              </button>
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
      <main className="min-h-screen flex items-center justify-center" style={{background: '#F8FAFC'}}>
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{borderColor: MORADO, borderTopColor: 'transparent'}}/>
      </main>
    }>
      <RegistroForm />
    </Suspense>
  );
}