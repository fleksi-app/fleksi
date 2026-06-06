'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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
              rol: 'flekser',
              rol_activo: 'flekser',
              roles: ['flekser'],
            });
            window.location.href = '/onboarding?rol=flekser&social=true';
            return;
          }
          const rol = usuario.rol_activo || usuario.rol || 'flekser';
          redirigirPorRol(rol);
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
    setCargando(true);
    setError('');
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      if (data.user) {
        const { data: usuario } = await supabase
          .from('usuarios')
          .select('rol, rol_activo')
          .eq('id', data.user.id)
          .single();
        const rol = usuario?.rol_activo || usuario?.rol || 'flekser';
        redirigirPorRol(rol);
      }
    } catch (err: any) {
      setError('Correo o contraseña incorrectos');
    } finally {
      setCargando(false);
    }
  };

  const handleSocialLogin = async (provider: 'google') => {
    setCargandoProvider(provider);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (err: any) {
      setError('No pudimos conectar con Google. Intenta de nuevo.');
      setCargandoProvider('');
    }
  };

  const handleRecuperar = async () => {
    if (!emailRecuperar) { setError('Ingresa tu correo electrónico'); return; }
    setCargandoRecuperar(true);
    setError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailRecuperar, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      if (error) throw error;
      setRecuperarEnviado(true);
    } catch (err: any) {
      setError('No pudimos enviar el correo. Verifica el email ingresado.');
    } finally {
      setCargandoRecuperar(false);
    }
  };

  const Ojito = ({ ver, toggle }: { ver: boolean; toggle: () => void }) => (
    <button type="button" onClick={toggle}
      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
      {ver ? (
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
  );

  const Logo = () => (
    <div className="flex items-center justify-center gap-3 mb-8">
      <svg width="38" height="38" viewBox="0 0 32 32" fill="none">
        <defs>
          <linearGradient id="lg-login" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563EB"/>
            <stop offset="100%" stopColor="#7C3AED"/>
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="10" fill="url(#lg-login)"/>
        <rect x="8" y="8" width="16" height="3.5" rx="1.75" fill="white"/>
        <rect x="8" y="14.25" width="11" height="3.5" rx="1.75" fill="white" opacity="0.85"/>
        <rect x="8" y="20.5" width="7" height="3.5" rx="1.75" fill="white" opacity="0.65"/>
      </svg>
      <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">fleksi</span>
    </div>
  );

  if (modoRecuperar) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full">
          <Logo />
          {recuperarEnviado ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✉️</span>
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Revisa tu correo</h1>
              <p className="text-gray-400 mb-6 font-light">
                Enviamos un enlace a <span className="font-semibold text-gray-600">{emailRecuperar}</span> para restablecer tu contraseña.
              </p>
              <button onClick={() => { setModoRecuperar(false); setRecuperarEnviado(false); setEmailRecuperar(''); }}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:opacity-90 transition">
                Volver al inicio de sesión
              </button>
            </div>
          ) : (
            <div>
              <button onClick={() => { setModoRecuperar(false); setError(''); }}
                className="flex items-center gap-2 text-gray-400 mb-6 hover:text-gray-600 transition text-sm">
                ← Regresar
              </button>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">¿Olvidaste tu contraseña?</h1>
              <p className="text-gray-400 mb-8 font-light">Ingresa tu correo y te enviamos un enlace para restablecerla.</p>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-4 text-sm">{error}</div>}
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block tracking-wide uppercase">Correo electrónico</label>
                  <input type="email" placeholder="tu@correo.com" value={emailRecuperar}
                    onChange={(e) => setEmailRecuperar(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRecuperar()}
                    className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900 bg-gray-50"/>
                </div>
                <button onClick={handleRecuperar} disabled={cargandoRecuperar}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:opacity-90 transition disabled:opacity-50">
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
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        <Logo />
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Bienvenido 👋</h1>
        <p className="text-gray-400 mb-7 font-light text-sm">Inicia sesión para continuar</p>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-4 text-sm">{error}</div>}

        <div className="flex flex-col gap-4 mb-3">
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block tracking-wide uppercase">Correo electrónico</label>
            <input type="email" placeholder="tu@correo.com" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900 bg-gray-50"/>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block tracking-wide uppercase">Contraseña</label>
            <div className="relative">
              <input
                type={verPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900 bg-gray-50 pr-14"/>
              <Ojito ver={verPassword} toggle={() => setVerPassword(!verPassword)}/>
            </div>
          </div>
          <div className="flex justify-end -mt-2">
            <button onClick={() => { setModoRecuperar(true); setError(''); }}
              className="text-purple-600 text-sm font-semibold hover:underline">
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <button onClick={handleLogin} disabled={cargando}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:opacity-90 transition disabled:opacity-50">
            {cargando ? 'Entrando...' : 'Iniciar sesión →'}
          </button>
        </div>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200"/>
          <span className="text-xs text-gray-400 font-medium">o continúa con</span>
          <div className="flex-1 h-px bg-gray-200"/>
        </div>

        <button onClick={() => handleSocialLogin('google')} disabled={!!cargandoProvider}
          className="w-full py-3.5 border-2 border-gray-200 rounded-2xl font-semibold text-gray-700 flex items-center justify-center gap-3 hover:border-gray-300 hover:bg-gray-50 transition disabled:opacity-50">
          {cargandoProvider === 'google' ? <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"/> : (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          Continuar con Google
        </button>

        <div className="mt-7 text-center">
          <p className="text-gray-400 text-sm">
            ¿No tienes cuenta?{' '}
            <a href="/registro" className="text-purple-600 font-bold hover:underline">Regístrate gratis</a>
          </p>
        </div>
      </div>
    </main>
  );
}