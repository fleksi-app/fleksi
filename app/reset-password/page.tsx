'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  useEffect(() => {
    // Escuchar el evento de recuperación de contraseña
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setListo(true);
      }
      if (event === 'SIGNED_IN' && session) {
        setListo(true);
      }
    });

    // También verificar si ya hay sesión activa
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setListo(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async () => {
    if (!password || !confirmar) { setError('Por favor llena todos los campos'); return; }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    if (password !== confirmar) { setError('Las contraseñas no coinciden'); return; }
    setCargando(true);
    setError('');
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setExito(true);
      setTimeout(() => { window.location.href = '/login'; }, 3000);
    } catch (err: any) {
      setError('No pudimos actualizar tu contraseña. Intenta solicitar un nuevo enlace.');
    } finally {
      setCargando(false);
    }
  };

  const OjitoBTN = ({ ver, toggle }: { ver: boolean; toggle: () => void }) => (
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

  if (exito) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">¡Contraseña actualizada!</h1>
          <p className="text-gray-400 mb-6">Tu contraseña fue cambiada exitosamente. Redirigiendo...</p>
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"/>
        </div>
      </main>
    );
  }

  if (!listo) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
          <p className="text-gray-400">Verificando enlace...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">

        <div className="flex items-center justify-center gap-3 mb-8">
          <svg width="38" height="38" viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="lg-reset" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#2563EB"/>
                <stop offset="100%" stopColor="#7C3AED"/>
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="10" fill="url(#lg-reset)"/>
            <rect x="8" y="8" width="16" height="3.5" rx="1.75" fill="white"/>
            <rect x="8" y="14.25" width="11" height="3.5" rx="1.75" fill="white" opacity="0.85"/>
            <rect x="8" y="20.5" width="7" height="3.5" rx="1.75" fill="white" opacity="0.65"/>
          </svg>
          <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">fleksi</span>
        </div>

        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Nueva contraseña 🔐</h1>
        <p className="text-gray-400 mb-8 font-light">Elige una contraseña segura para tu cuenta.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-4 text-sm">{error}</div>
        )}

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block tracking-wide uppercase">Nueva contraseña</label>
            <div className="relative">
              <input
                type={verPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900 bg-gray-50 pr-14"/>
              <OjitoBTN ver={verPassword} toggle={() => setVerPassword(!verPassword)}/>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block tracking-wide uppercase">Confirmar contraseña</label>
            <div className="relative">
              <input
                type={verConfirmar ? 'text' : 'password'}
                placeholder="Repite tu contraseña"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReset()}
                className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900 bg-gray-50 pr-14"/>
              <OjitoBTN ver={verConfirmar} toggle={() => setVerConfirmar(!verConfirmar)}/>
            </div>
          </div>

          <button onClick={handleReset} disabled={cargando}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:opacity-90 transition disabled:opacity-50">
            {cargando ? 'Actualizando...' : 'Actualizar contraseña →'}
          </button>

          <a href="/login" className="text-center text-sm text-gray-400 hover:text-purple-600 transition">
            ← Volver al inicio de sesión
          </a>
        </div>
      </div>
    </main>
  );
}