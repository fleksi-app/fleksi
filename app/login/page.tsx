'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor ingresa tu correo y contraseña');
      return;
    }
    setCargando(true);
    setError('');
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      if (data.user) {
        const { data: usuario } = await supabase
          .from('usuarios').select('rol').eq('id', data.user.id).single();
        const rol = usuario?.rol || 'flekser';
        if (rol === 'empresa') {
          window.location.href = '/home-empresa';
        } else if (rol === 'viajero') {
          window.location.href = '/home-viajero';
        } else {
          window.location.href = '/home';
        }
      }
    } catch (err: any) {
      setError('Correo o contraseña incorrectos');
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">

        <div className="flex items-center justify-center gap-3 mb-8">
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#2563EB"/>
                <stop offset="100%" stopColor="#7C3AED"/>
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="10" fill="url(#lg)"/>
            <rect x="8" y="8" width="16" height="3.5" rx="1.75" fill="white"/>
            <rect x="8" y="14.25" width="11" height="3.5" rx="1.75" fill="white" opacity="0.85"/>
            <rect x="8" y="20.5" width="7" height="3.5" rx="1.75" fill="white" opacity="0.65"/>
          </svg>
          <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            fleksi
          </span>
        </div>

        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Bienvenido de vuelta</h1>
        <p className="text-gray-400 mb-8 font-light">Inicia sesión en tu cuenta</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">Correo electrónico</label>
            <input type="email" placeholder="tu@correo.com" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900"/>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">Contraseña</label>
            <input type="password" placeholder="Tu contraseña" value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900"/>
          </div>
          <button onClick={handleLogin} disabled={cargando}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:opacity-90 transition disabled:opacity-50">
            {cargando ? 'Entrando...' : 'Iniciar sesión →'}
          </button>
        </div>

        <p className="mt-6 text-center text-gray-400 text-sm">
          ¿No tienes cuenta?{" "}
          <a href="/registro" className="text-purple-600 font-semibold hover:underline">Regístrate gratis</a>
        </p>
        <p className="mt-3 text-center">
          <span className="text-purple-600 text-sm font-semibold cursor-pointer hover:underline">
            ¿Olvidaste tu contraseña?
          </span>
        </p>

      </div>
    </main>
  );
}