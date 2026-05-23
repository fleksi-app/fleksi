'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const roles = [
  { id: 'flekser', emoji: '⚡', titulo: 'Soy Flekser', desc: 'Ofrece servicios y contrata cuando lo necesites' },
  { id: 'empresa', emoji: '🏢', titulo: 'Soy empresa', desc: 'Cubre vacantes temporales con talento verificado' },
  { id: 'viajero', emoji: '✈️', titulo: 'Soy viajero', desc: 'Trabaja mientras viajas por el mundo' },
];

function RegistroForm() {
  const searchParams = useSearchParams();
  const [paso, setPaso] = useState(1);
  const [rol, setRol] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const rolParam = searchParams.get('rol');
    if (rolParam && ['flekser', 'empresa', 'viajero'].includes(rolParam)) {
      setRol(rolParam);
      setPaso(2);
    }
  }, [searchParams]);

  const handleRegistro = async () => {
    if (!nombre || !email || !password) {
      setError('Por favor llena todos los campos');
      return;
    }
    setCargando(true);
    setError('');
    try {
      const { data, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;
      if (data.user) {
        const { error: dbError } = await supabase.from('usuarios').insert({
          id: data.user.id,
          nombre,
          telefono,
          rol,
        });
        if (dbError) throw dbError;

        await fetch('/api/enviar-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: 'bienvenida',
            destinatario: email,
            datos: { nombre, rol },
          }),
        });

        setPaso(4);
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  const destino = () => {
    if (rol === 'empresa') return '/home-empresa';
    if (rol === 'viajero') return '/home-viajero';
    return '/home';
  };

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
          <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            fleksi
          </span>
        </div>

        {/* PASO 1 */}
        {paso === 1 && (
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 text-center mb-2">¿Cómo vas a usar Fleksi?</h1>
            <p className="text-gray-400 text-center mb-8 font-light">Elige tu perfil para continuar</p>
            <div className="flex flex-col gap-3">
              {roles.map((r) => (
                <button key={r.id} onClick={() => { setRol(r.id); setPaso(2); }}
                  className="w-full p-4 rounded-2xl border-2 border-gray-200 hover:border-purple-400 flex items-center gap-4 transition text-left">
                  <span className="text-3xl">{r.emoji}</span>
                  <div>
                    <div className="font-bold text-gray-900">{r.titulo}</div>
                    <div className="text-sm text-gray-400 font-light">{r.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-6 text-center text-gray-400 text-sm">
              ¿Ya tienes cuenta?{" "}
              <a href="/login" className="text-purple-600 font-semibold hover:underline">Inicia sesión</a>
            </p>
          </div>
        )}

        {/* PASO 2 */}
        {paso === 2 && (
          <div>
            <button onClick={() => { setPaso(1); setRol(''); }}
              className="flex items-center gap-2 text-gray-400 mb-6 hover:text-gray-600 transition">
              ← Regresar
            </button>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Crea tu cuenta</h1>
            <p className="text-gray-400 mb-8 font-light">
              Registrándote como <span className="font-semibold text-purple-600">{roles.find(r => r.id === rol)?.titulo}</span>
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">
                  {rol === 'empresa' ? 'Nombre de la empresa' : 'Nombre completo'}
                </label>
                <input type="text"
                  placeholder={rol === 'empresa' ? 'Ej. Servicios Limpios SA' : 'Ej. María López'}
                  value={nombre} onChange={(e) => setNombre(e.target.value)}
                  className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900"/>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Teléfono celular</label>
                <div className="flex gap-2">
                  <div className="p-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold">🇲🇽 +52</div>
                  <input type="tel" placeholder="55 1234 5678" value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="flex-1 p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900"/>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Correo electrónico</label>
                <input type="email" placeholder="tu@correo.com" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900"/>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Contraseña</label>
                <input type="password" placeholder="Mínimo 8 caracteres" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 outline-none transition text-gray-900"/>
              </div>
              <button onClick={handleRegistro} disabled={cargando}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:opacity-90 transition mt-2 disabled:opacity-50">
                {cargando ? 'Creando cuenta...' : 'Crear cuenta →'}
              </button>
            </div>
            <p className="mt-6 text-center text-gray-400 text-xs font-light">
              Al registrarte aceptas nuestros{" "}
              <span className="text-purple-600 cursor-pointer">Términos y condiciones</span>
              {" "}y{" "}
              <span className="text-purple-600 cursor-pointer">Aviso de privacidad</span>
            </p>
          </div>
        )}

        {/* PASO 4 — Éxito */}
        {paso === 4 && (
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✅</span>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">¡Bienvenido a Fleksi!</h1>
            <p className="text-gray-400 mb-8 font-light">Tu cuenta fue creada exitosamente.<br/>Estás listo para empezar.</p>
            <a href={destino()}
              className="block w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:opacity-90 transition">
              Ir a mi inicio →
            </a>
          </div>
        )}

      </div>
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