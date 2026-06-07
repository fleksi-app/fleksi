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
  const [fase, setFase] = useState<'blur' | 'nitido' | 'texto' | 'boton'>('blur');

  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: usuario } = await supabase
            .from('usuarios').select('rol, rol_activo').eq('id', session.user.id).single();
          const rol = usuario?.rol_activo || usuario?.rol || 'flekser';
          if (rol === 'empresa') { window.location.href = '/home-empresa'; return; }
          window.location.href = '/home';
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

    if (window.matchMedia('(display-mode: standalone)').matches) setInstalada(true);

    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (verificando) return;
    const t1 = setTimeout(() => setFase('nitido'), 600);
    const t2 = setTimeout(() => setFase('texto'), 1400);
    const t3 = setTimeout(() => setFase('boton'), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [verificando]);

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
        <div className="mt-3 w-full">
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
          className="mt-3 w-full py-3 px-6 bg-green-600 text-white rounded-2xl font-semibold text-base flex items-center justify-center gap-2 hover:opacity-90 transition">
          🤖 Instalar en Android
        </button>
      );
    }

    if (deferredPrompt && plataforma === 'windows') {
      return (
        <button onClick={instalarApp}
          className="mt-3 w-full py-3 px-6 bg-blue-700 text-white rounded-2xl font-semibold text-base flex items-center justify-center gap-2 hover:opacity-90 transition">
          🪟 Instalar en Windows
        </button>
      );
    }

    if (deferredPrompt && plataforma === 'mac') {
      return (
        <button onClick={instalarApp}
          className="mt-3 w-full py-3 px-6 bg-gray-800 text-white rounded-2xl font-semibold text-base flex items-center justify-center gap-2 hover:opacity-90 transition">
          🍎 Instalar en Mac
        </button>
      );
    }

    if (deferredPrompt) {
      return (
        <button onClick={instalarApp}
          className="mt-3 w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold text-base flex items-center justify-center gap-2 hover:opacity-90 transition">
          📲 Instalar Fleksi
        </button>
      );
    }

    return (
      <div className="mt-3 bg-gray-50 rounded-2xl p-4 border border-gray-200">
        <p className="text-sm text-gray-500 text-center">
          📲 Para instalar Fleksi, abre esta página en <span className="font-bold">Chrome</span> y busca la opción "Instalar app" en el menú
        </p>
      </div>
    );
  };

  if (verificando) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 50%, #EDE9FE 100%)' }}>

      <style>{`
        @keyframes fadeSlideUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-soft {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        .logo-blur {
          filter: blur(18px);
          transform: scale(1.5);
          opacity: 0.4;
          transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .logo-nitido {
          filter: blur(0px);
          transform: scale(1);
          opacity: 1;
          transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .fade-up {
          animation: fadeSlideUp 0.6s ease forwards;
        }
        .pulse-logo {
          animation: pulse-soft 3s ease-in-out infinite;
        }
      `}</style>

      <div className="max-w-md w-full flex flex-col items-center">

        <div className={`flex flex-col items-center mb-2 ${fase === 'blur' ? 'logo-blur' : 'logo-nitido pulse-logo'}`}>
          <svg width="96" height="96" viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="lg-splash" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#2563EB"/>
                <stop offset="100%" stopColor="#7C3AED"/>
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="10" fill="url(#lg-splash)"/>
            <rect x="8" y="8" width="16" height="3.5" rx="1.75" fill="white"/>
            <rect x="8" y="14.25" width="11" height="3.5" rx="1.75" fill="white" opacity="0.85"/>
            <rect x="8" y="20.5" width="7" height="3.5" rx="1.75" fill="white" opacity="0.65"/>
          </svg>
          <span className="text-4xl font-extrabold mt-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            fleksi
          </span>
        </div>

        {(fase === 'texto' || fase === 'boton') && (
          <div className="text-center mt-6 fade-up">
            <h1 className="text-2xl font-extrabold text-gray-900 leading-snug mb-3">
              Bienvenido a Fleksi 👋
            </h1>
            <p className="text-gray-500 text-base font-light leading-relaxed px-4">
              Gana más. Delega más.{' '}
              <span className="font-semibold text-purple-600">Vive más.</span>
            </p>
          </div>
        )}

        {fase === 'boton' && (
          <div className="w-full mt-10 fade-up flex flex-col items-center">
            <a href="/login"
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:opacity-90 transition text-center">
              Sí, empezar ✨
            </a>
            <p className="mt-4 text-gray-400 text-sm">
              ¿Ya tienes cuenta?{' '}
              <a href="/login" className="text-purple-600 font-semibold hover:underline">
                Inicia sesión
              </a>
            </p>
            {instalada ? (
              <div className="mt-3 w-full bg-green-50 rounded-2xl p-3 border border-green-200">
                <p className="text-sm text-green-700 font-semibold text-center">✅ Fleksi ya está instalada en tu dispositivo</p>
              </div>
            ) : (
              botonInstalar()
            )}

            <div className="mt-8 flex gap-4 justify-center">
              <a href="/terminos" className="text-xs text-gray-400 hover:text-purple-600 transition">
                Términos y condiciones
              </a>
              <span className="text-gray-300">·</span>
              <a href="/privacidad" className="text-xs text-gray-400 hover:text-purple-600 transition">
                Privacidad
              </a>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}