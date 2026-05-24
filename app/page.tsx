'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type Plataforma = 'ios' | 'android' | 'windows' | 'mac' | 'otro';

export default function Home() {
  const [plataforma, setPlataforma] = useState<Plataforma>('otro');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [instalada, setInstalada] = useState(false);
  const [mostrarInstruccionesIOS, setMostrarInstruccionesIOS] = useState(false);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: usuario } = await supabase
            .from('usuarios').select('rol, modo_viajero').eq('id', session.user.id).single();
          const rol = usuario?.rol || 'flekser';
          if (rol === 'empresa') {
            window.location.href = '/home-empresa';
          } else if (rol === 'viajero' || usuario?.modo_viajero) {
            window.location.href = '/home-viajero';
          } else {
            window.location.href = '/home';
          }
          return;
        }
      } catch (e) {}
      setVerificando(false);
    };

    verificarSesion();

    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);
    const isWindows = /windows/.test(ua);
    const isMac = /macintosh|mac os x/.test(ua) && !isIOS;

    if (isIOS) setPlataforma('ios');
    else if (isAndroid) setPlataforma('android');
    else if (isWindows) setPlataforma('windows');
    else if (isMac) setPlataforma('mac');
    else setPlataforma('otro');

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalada(true);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const instalarApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setInstalada(true);
      setDeferredPrompt(null);
    }
  };

  const botonInstalar = () => {
    if (instalada) return null;

    if (plataforma === 'ios') {
      return (
        <div className="mt-4">
          <button onClick={() => setMostrarInstruccionesIOS(!mostrarInstruccionesIOS)}
            className="w-full py-3 px-6 bg-black text-white rounded-2xl font-semibold text-base flex items-center justify-center gap-2 hover:opacity-90 transition">
            🍎 Instalar en iPhone / iPad
          </button>
          {mostrarInstruccionesIOS && (
            <div className="mt-3 bg-gray-50 rounded-2xl p-4 text-left border border-gray-200">
              <p className="text-sm font-bold text-gray-900 mb-2">Para instalar en tu iPhone:</p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  <p className="text-sm text-gray-600">Abre esta página en <span className="font-bold">Safari</span></p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <p className="text-sm text-gray-600">Toca el ícono de compartir <span className="font-bold">⬆️</span> abajo</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  <p className="text-sm text-gray-600">Selecciona <span className="font-bold">"Añadir a pantalla de inicio"</span></p>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (deferredPrompt && plataforma === 'android') {
      return (
        <button onClick={instalarApp}
          className="mt-4 w-full py-3 px-6 bg-green-600 text-white rounded-2xl font-semibold text-base flex items-center justify-center gap-2 hover:opacity-90 transition">
          🤖 Instalar en Android
        </button>
      );
    }

    if (deferredPrompt && plataforma === 'windows') {
      return (
        <button onClick={instalarApp}
          className="mt-4 w-full py-3 px-6 bg-blue-700 text-white rounded-2xl font-semibold text-base flex items-center justify-center gap-2 hover:opacity-90 transition">
          🪟 Instalar en Windows
        </button>
      );
    }

    if (deferredPrompt && plataforma === 'mac') {
      return (
        <button onClick={instalarApp}
          className="mt-4 w-full py-3 px-6 bg-gray-800 text-white rounded-2xl font-semibold text-base flex items-center justify-center gap-2 hover:opacity-90 transition">
          🍎 Instalar en Mac
        </button>
      );
    }

    if (deferredPrompt) {
      return (
        <button onClick={instalarApp}
          className="mt-4 w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold text-base flex items-center justify-center gap-2 hover:opacity-90 transition">
          📲 Instalar Fleksi
        </button>
      );
    }

    return (
      <div className="mt-4 bg-gray-50 rounded-2xl p-4 border border-gray-200">
        <p className="text-sm text-gray-500 text-center">
          📲 Para instalar Fleksi, abre esta página en <span className="font-bold">Chrome</span> y busca la opción "Instalar app" en el menú
        </p>
      </div>
    );
  };

  if (verificando) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center">

        <div className="flex items-center justify-center gap-3 mb-8">
          <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
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
          <span className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            fleksi
          </span>
        </div>

        <h1 className="text-4xl font-extrabold text-gray-900 leading-tight mb-4">
          Tu trabajo,<br/>
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            tus reglas.
          </span>
        </h1>

        <p className="text-gray-500 text-lg mb-10 font-light leading-relaxed">
          Conectamos personas que necesitan un servicio con quienes pueden hacerlo. Rápido, seguro y flexible.
        </p>

        <div className="flex flex-col gap-4">
          <a href="/registro?rol=flekser"
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold text-lg shadow-lg hover:opacity-90 transition text-center">
            ⚡ Soy Flekser
          </a>
          <a href="/registro?rol=empresa"
            className="w-full py-4 px-6 bg-white text-gray-800 rounded-2xl font-semibold text-lg border-2 border-gray-200 hover:border-purple-400 transition text-center">
            🏢 Soy empresa
          </a>
          <a href="/registro?rol=viajero"
            className="w-full py-4 px-6 bg-white text-gray-800 rounded-2xl font-semibold text-lg border-2 border-gray-200 hover:border-purple-400 transition text-center">
            ✈️ Soy viajero
          </a>
        </div>

        <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4">
          <p className="text-sm text-gray-600 font-medium">
            ⚡ <span className="font-bold text-purple-600">Flekser</span> — ofrece tus servicios <span className="text-gray-400">y</span> contrata cuando lo necesites
          </p>
        </div>

        {instalada ? (
          <div className="mt-4 bg-green-50 rounded-2xl p-3 border border-green-200">
            <p className="text-sm text-green-700 font-semibold">✅ Fleksi ya está instalada en tu dispositivo</p>
          </div>
        ) : (
          botonInstalar()
        )}

        <p className="mt-6 text-gray-400 text-sm">
          ¿Ya tienes cuenta?{" "}
          <a href="/login" className="text-purple-600 font-semibold hover:underline">
            Inicia sesión
          </a>
        </p>

      </div>
    </main>
  );
}