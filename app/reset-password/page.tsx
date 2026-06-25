'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const MORADO = '#7B2FE0';

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

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  useEffect(() => {
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type');
    if (token_hash && type === 'recovery') {
      supabase.auth.verifyOtp({ token_hash, type: 'recovery' }).then(({ error }) => {
        if (error) setError('El enlace ha expirado. Solicita uno nuevo desde el login.');
        setVerificando(false);
      });
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) setError('Enlace inválido. Solicita uno nuevo desde el login.');
        setVerificando(false);
      });
    }
  }, []);

  const handleReset = async () => {
    if (!password || !confirmar) { setError('Por favor llena todos los campos'); return; }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    if (password !== confirmar) { setError('Las contraseñas no coinciden'); return; }
    setCargando(true); setError('');
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setExito(true);
      setTimeout(() => { window.location.href = '/login'; }, 3000);
    } catch { setError('No pudimos actualizar tu contraseña. Solicita un nuevo enlace.'); }
    finally { setCargando(false); }
  };

  const Ojito = ({ ver, toggle }: { ver: boolean; toggle: () => void }) => (
    <button type="button" onClick={toggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
      {ver
        ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      }
    </button>
  );

  if (exito) return (
    <main className="min-h-screen flex items-center justify-center p-6" style={{background: '#F8FAFC'}}>
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><span className="text-4xl">✅</span></div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">¡Contraseña actualizada!</h1>
        <p className="text-gray-400 mb-6">Tu contraseña fue cambiada exitosamente. Redirigiendo...</p>
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto" style={{borderColor: MORADO, borderTopColor: 'transparent'}}/>
      </div>
    </main>
  );

  if (verificando) return (
    <main className="min-h-screen flex items-center justify-center p-6" style={{background: '#F8FAFC'}}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{borderColor: MORADO, borderTopColor: 'transparent'}}/>
        <p className="text-gray-400">Verificando enlace...</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6" style={{background: '#F8FAFC'}}>
      <div className="max-w-md w-full">
        <Logo />
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <h1 className="text-xl font-extrabold text-gray-900 mb-1">Nueva contraseña 🔐</h1>
          <p className="text-gray-400 text-sm mb-6">Elige una contraseña segura para tu cuenta.</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-4 text-sm">
              {error}
              {error.includes('expirado') && <a href="/login" className="block mt-2 font-bold underline">Volver al login →</a>}
            </div>
          )}

          {!error && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">Nueva contraseña</label>
                <div className="relative">
                  <input type={verPassword ? 'text' : 'password'} placeholder="Mínimo 8 caracteres"
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 focus:border-purple-300 outline-none text-gray-900 text-sm transition pr-12"/>
                  <Ojito ver={verPassword} toggle={() => setVerPassword(!verPassword)}/>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">Confirmar contraseña</label>
                <div className="relative">
                  <input type={verConfirmar ? 'text' : 'password'} placeholder="Repite tu contraseña"
                    value={confirmar} onChange={e => setConfirmar(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleReset()}
                    className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 focus:border-purple-300 outline-none text-gray-900 text-sm transition pr-12"/>
                  <Ojito ver={verConfirmar} toggle={() => setVerConfirmar(!verConfirmar)}/>
                </div>
              </div>
              <button onClick={handleReset} disabled={cargando}
                className="w-full py-4 text-white rounded-2xl font-bold text-sm disabled:opacity-50 transition" style={{background: MORADO}}>
                {cargando ? 'Actualizando...' : 'Actualizar contraseña →'}
              </button>
              <a href="/login" className="text-center text-sm text-gray-400 hover:text-gray-600 transition">← Volver al inicio de sesión</a>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center" style={{background: '#F8FAFC'}}>
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{borderColor: MORADO, borderTopColor: 'transparent'}}/>
      </main>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}