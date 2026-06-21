'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const MORADO = '#7B2FE0';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [cargandoProvider, setCargandoProvider] = useState('');
  const [error, setError] = useState('');
  const [modoRecuperar, setModoRecuperar] = useState(false);
  const [emailRecuperar, setEmailRecuperar] = useState('');
  const [recuperarEnviado, setRecuperarEnviado] = useState(false);
  const [cargandoRecuperar, setCargandoRecuperar] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          const { data: usuario } = await supabase
            .from('usuarios').select('id, rol, rol_activo').eq('id', session.user.id).single();
          if (!usuario) {
            await supabase.from('usuarios').insert({
              id: session.user.id,
              nombre: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario',
              email: session.user.email,
              foto_url: session.user.user_metadata?.avatar_url || null,
              rol: 'flekser', rol_activo: 'flekser', roles: ['flekser'],
            });
            window.location.href = '/onboarding?rol=flekser&social=true';
            return;
          }
          redirigirPorRol(usuario.rol_activo || usuario.rol || 'flekser');
        }
      });
    }
  }, []);

  const redirigirPorRol = (rol: string) => {
    if (rol === 'empresa') window.location.href = '/home-empresa';
    else window.location.href = '/home';
  };

  const handleLogin = async () => {
    if (!email || !password) { setError('Por favor ingresa tu correo y contraseña'); return; }
    setCargando(true); setError('');
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      if (data.user) {
        const { data: usuario } = await supabase.from('usuarios').select('rol, rol_activo').eq('id', data.user.id).single();
        redirigirPorRol(usuario?.rol_activo || usuario?.rol || 'flekser');
      }
    } catch { setError('Correo o contraseña incorrectos'); }
    finally { setCargando(false); }
  };

  const handleSocialLogin = async (provider: 'google') => {
    setCargandoProvider(provider); setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/auth/callback` } });
      if (error) throw error;
    } catch { setError('No pudimos conectar con Google. Intenta de nuevo.'); setCargandoProvider(''); }
  };

  const handleRecuperar = async () => {
    if (!emailRecuperar) { setError('Ingresa tu correo electrónico'); return; }
    setCargandoRecuperar(true); setError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailRecuperar, { redirectTo: `${window.location.origin}/auth/callback` });
      if (error) throw error;
      setRecuperarEnviado(true);
    } catch { setError('No pudimos enviar el correo. Verifica el email ingresado.'); }
    finally { setCargandoRecuperar(false); }
  };

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

  const Ojito = ({ ver, toggle }: { ver: boolean; toggle: () => void }) => (
    <button type="button" onClick={toggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
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

  if (modoRecuperar) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6" style={{background: '#F8FAFC'}}>
        <div className="max-w-md w-full">
          <Logo />
          {recuperarEnviado ? (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✉️</span>
              </div>
              <h1 className="text-xl font-extrabold text-gray-900 mb-2">Revisa tu correo</h1>
              <p className="text-gray-400 text-sm mb-6">Enviamos un enlace a <span className="font-semibold text-gray-600">{emailRecuperar}</span></p>
              <button onClick={() => { setModoRecuperar(false); setRecuperarEnviado(false); setEmailRecuperar(''); }}
                className="w-full py-4 text-white rounded-2xl font-bold text-sm" style={{background: MORADO}}>
                Volver al inicio de sesión
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <button onClick={() => { setModoRecuperar(false); setError(''); }}
                className="flex items-center gap-2 text-gray-400 mb-5 hover:text-gray-600 transition text-sm font-semibold">
                ← Regresar
              </button>
              <h1 className="text-xl font-extrabold text-gray-900 mb-1">¿Olvidaste tu contraseña?</h1>
              <p className="text-gray-400 text-sm mb-5">Te enviamos un enlace para restablecerla.</p>
              {error && <p className="text-red-500 text-xs bg-red-50 p-3 rounded-xl mb-4">{error}</p>}
              <div className="flex flex-col gap-3">
                <input type="email" placeholder="tu@correo.com" value={emailRecuperar}
                  onChange={e => setEmailRecuperar(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRecuperar()}
                  className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 focus:border-purple-300 outline-none text-gray-900 text-sm transition"/>
                <button onClick={handleRecuperar} disabled={cargandoRecuperar}
                  className="w-full py-4 text-white rounded-2xl font-bold text-sm disabled:opacity-50 transition" style={{background: MORADO}}>
                  {cargandoRecuperar ? 'Enviando...' : 'Enviar enlace →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6" style={{background: '#F8FAFC'}}>
      <div className="max-w-md w-full">
        <Logo />

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <h1 className="text-xl font-extrabold text-gray-900 mb-1">Bienvenido 👋</h1>
          <p className="text-gray-400 text-sm mb-6">Inicia sesión para continuar</p>

          {error && <p className="text-red-500 text-xs bg-red-50 p-3 rounded-xl mb-4">{error}</p>}

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">Correo electrónico</label>
              <input type="email" placeholder="tu@correo.com" value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 focus:border-purple-300 outline-none text-gray-900 text-sm transition"/>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">Contraseña</label>
              <div className="relative">
                <input type={verPassword ? 'text' : 'password'} placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 focus:border-purple-300 outline-none text-gray-900 text-sm transition pr-12"/>
                <Ojito ver={verPassword} toggle={() => setVerPassword(!verPassword)}/>
              </div>
            </div>
            <div className="flex justify-end -mt-2">
              <button onClick={() => { setModoRecuperar(true); setError(''); }}
                className="text-sm font-semibold hover:underline" style={{color: MORADO}}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <button onClick={handleLogin} disabled={cargando}
              className="w-full py-4 text-white rounded-2xl font-bold text-sm disabled:opacity-50 transition shadow-sm" style={{background: MORADO}}>
              {cargando ? 'Entrando...' : 'Iniciar sesión →'}
            </button>
          </div>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100"/>
            <span className="text-xs text-gray-400">o continúa con</span>
            <div className="flex-1 h-px bg-gray-100"/>
          </div>

          <button onClick={() => handleSocialLogin('google')} disabled={!!cargandoProvider}
            className="w-full py-3.5 border-2 border-gray-100 bg-gray-50 rounded-2xl font-semibold text-gray-700 text-sm flex items-center justify-center gap-3 hover:border-gray-200 hover:bg-white transition disabled:opacity-50">
            {cargandoProvider === 'google'
              ? <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"/>
              : <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
            }
            Continuar con Google
          </button>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          ¿No tienes cuenta?{' '}
          <a href="/registro" className="font-bold hover:underline" style={{color: MORADO}}>Regístrate gratis</a>
        </p>
      </div>
    </main>
  );
}