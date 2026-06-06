'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const slides: Record<string, any[]> = {
  flekser: [
    {
      bg: 'from-blue-600 to-purple-700',
      ilustracion: (
        <svg viewBox="0 0 300 220" className="w-full max-w-xs mx-auto">
          <rect x="20" y="120" width="40" height="80" rx="4" fill="rgba(255,255,255,0.15)"/>
          <rect x="25" y="110" width="30" height="10" rx="2" fill="rgba(255,255,255,0.2)"/>
          <rect x="70" y="90" width="50" height="110" rx="4" fill="rgba(255,255,255,0.2)"/>
          <rect x="78" y="80" width="34" height="12" rx="2" fill="rgba(255,255,255,0.25)"/>
          <rect x="130" y="70" width="60" height="130" rx="4" fill="rgba(255,255,255,0.25)"/>
          <rect x="140" y="58" width="40" height="14" rx="2" fill="rgba(255,255,255,0.3)"/>
          <rect x="200" y="100" width="45" height="100" rx="4" fill="rgba(255,255,255,0.2)"/>
          <rect x="255" y="130" width="35" height="70" rx="4" fill="rgba(255,255,255,0.15)"/>
          {[0,1,2,3].map(i => [0,1,2].map(j => (
            <rect key={`${i}-${j}`} x={75+i*14} y={95+j*18} width="8" height="10" rx="1" fill="rgba(255,255,255,0.4)"/>
          )))}
          <circle cx="155" cy="35" r="14" fill="rgba(255,255,255,0.9)"/>
          <rect x="147" y="50" width="16" height="20" rx="4" fill="rgba(255,255,255,0.8)"/>
          <rect x="168" y="55" width="18" height="14" rx="3" fill="rgba(255,255,255,0.7)"/>
          <rect x="172" y="52" width="10" height="4" rx="1" fill="rgba(255,255,255,0.6)"/>
          <polygon points="175,15 165,32 172,32 162,50 178,28 170,28" fill="rgba(255,220,50,0.9)"/>
        </svg>
      ),
      titulo: '¡Bienvenido a Fleksi! ⚡',
      subtitulo: 'Tu trabajo, tus reglas',
      descripcion: 'Encuentra trabajos cerca de ti, aplica con tu precio y empieza a ganar dinero hoy mismo.',
    },
    {
      bg: 'from-purple-600 to-pink-600',
      ilustracion: (
        <svg viewBox="0 0 300 220" className="w-full max-w-xs mx-auto">
          <rect x="100" y="20" width="100" height="180" rx="16" fill="rgba(255,255,255,0.2)"/>
          <rect x="108" y="35" width="84" height="130" rx="8" fill="rgba(255,255,255,0.15)"/>
          <rect x="114" y="45" width="72" height="16" rx="4" fill="rgba(255,255,255,0.5)"/>
          <rect x="114" y="68" width="50" height="8" rx="3" fill="rgba(255,255,255,0.35)"/>
          <rect x="114" y="82" width="60" height="8" rx="3" fill="rgba(255,255,255,0.3)"/>
          <rect x="114" y="96" width="40" height="8" rx="3" fill="rgba(255,255,255,0.25)"/>
          <rect x="114" y="115" width="72" height="24" rx="8" fill="rgba(255,255,255,0.6)"/>
          <rect x="125" y="121" width="50" height="12" rx="3" fill="rgba(100,50,200,0.5)"/>
          <circle cx="185" cy="38" r="12" fill="rgba(255,80,80,0.9)"/>
          <text x="185" y="43" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">1</text>
          <circle cx="55" cy="80" r="20" fill="rgba(255,220,50,0.8)"/>
          <text x="55" y="86" textAnchor="middle" fill="rgba(150,100,0,0.9)" fontSize="18" fontWeight="bold">$</text>
          <circle cx="245" cy="120" r="16" fill="rgba(255,220,50,0.7)"/>
          <text x="245" y="126" textAnchor="middle" fill="rgba(150,100,0,0.9)" fontSize="14" fontWeight="bold">$</text>
          <circle cx="65" cy="150" r="12" fill="rgba(255,220,50,0.6)"/>
          <text x="65" y="155" textAnchor="middle" fill="rgba(150,100,0,0.9)" fontSize="11" fontWeight="bold">$</text>
        </svg>
      ),
      titulo: 'Aplica y gana 💰',
      subtitulo: 'Tú pones tu precio',
      descripcion: 'Ve los trabajos disponibles, aplica con el precio que quieres y espera a que te contraten.',
    },
    {
      bg: 'from-green-500 to-teal-600',
      ilustracion: (
        <svg viewBox="0 0 300 220" className="w-full max-w-xs mx-auto">
          <path d="M150 20 L220 50 L220 110 Q220 160 150 190 Q80 160 80 110 L80 50 Z" fill="rgba(255,255,255,0.2)"/>
          <path d="M150 35 L205 60 L205 110 Q205 150 150 175 Q95 150 95 110 L95 60 Z" fill="rgba(255,255,255,0.15)"/>
          <polyline points="120,110 140,130 180,90" stroke="rgba(255,255,255,0.9)" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="50" cy="60" r="18" fill="rgba(255,220,50,0.85)"/>
          <text x="50" y="66" textAnchor="middle" fill="rgba(120,80,0,0.9)" fontSize="16" fontWeight="bold">$</text>
          <circle cx="250" cy="80" r="15" fill="rgba(255,220,50,0.8)"/>
          <text x="250" y="86" textAnchor="middle" fill="rgba(120,80,0,0.9)" fontSize="14" fontWeight="bold">$</text>
          <path d="M68 65 Q100 40 130 60" stroke="rgba(255,255,255,0.5)" strokeWidth="2" fill="none" strokeDasharray="4,3"/>
          <path d="M235 85 Q210 60 185 75" stroke="rgba(255,255,255,0.5)" strokeWidth="2" fill="none" strokeDasharray="4,3"/>
          <polygon points="150,195 155,208 168,208 158,216 162,229 150,221 138,229 142,216 132,208 145,208" fill="rgba(255,220,50,0.9)"/>
        </svg>
      ),
      titulo: 'Pago 100% seguro 🔒',
      subtitulo: 'Fleksi protege tu dinero',
      descripcion: 'El cliente paga antes de que empieces. Tú terminas el trabajo y el dinero se libera automáticamente.',
    },
    {
      bg: 'from-blue-700 to-indigo-800',
      ilustracion: (
        <svg viewBox="0 0 300 220" className="w-full max-w-xs mx-auto">
          <rect x="60" y="30" width="180" height="140" rx="12" fill="rgba(255,255,255,0.15)"/>
          <line x1="60" y1="80" x2="240" y2="80" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
          <line x1="60" y1="120" x2="240" y2="120" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
          <line x1="120" y1="30" x2="120" y2="170" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
          <line x1="180" y1="30" x2="180" y2="170" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
          <circle cx="150" cy="90" r="18" fill="rgba(255,80,80,0.9)"/>
          <circle cx="150" cy="90" r="8" fill="rgba(255,255,255,0.9)"/>
          <line x1="150" y1="108" x2="150" y2="125" stroke="rgba(255,80,80,0.9)" strokeWidth="3"/>
          <ellipse cx="150" cy="128" rx="10" ry="4" fill="rgba(255,80,80,0.4)"/>
          <circle cx="150" cy="185" r="14" fill="rgba(255,255,255,0.85)"/>
          <rect x="142" y="200" width="16" height="18" rx="4" fill="rgba(255,255,255,0.75)"/>
          {[0,1,2,3,4].map(i => (
            <polygon key={i} points={`${55+i*40},195 ${57+i*40},201 ${63+i*40},201 ${58+i*40},205 ${60+i*40},211 ${55+i*40},207 ${50+i*40},211 ${52+i*40},205 ${47+i*40},201 ${53+i*40},201`} fill="rgba(255,220,50,0.85)"/>
          ))}
        </svg>
      ),
      titulo: '¡Listo para empezar! 🚀',
      subtitulo: 'Hay trabajos esperándote',
      descripcion: 'Completa tu perfil, agrega tus habilidades y empieza a recibir trabajos cerca de ti.',
    },
  ],

  empresa: [
    {
      bg: 'from-slate-700 to-blue-900',
      ilustracion: (
        <svg viewBox="0 0 300 220" className="w-full max-w-xs mx-auto">
          <rect x="80" y="40" width="140" height="160" rx="6" fill="rgba(255,255,255,0.15)"/>
          <rect x="70" y="34" width="160" height="16" rx="4" fill="rgba(255,255,255,0.2)"/>
          {[0,1,2,3,4].map(i => [0,1,2,3].map(j => (
            <rect key={`${i}-${j}`} x={90+i*24} y={60+j*28} width="14" height="18" rx="2" fill={i===2&&j===1 ? "rgba(255,220,50,0.7)" : "rgba(255,255,255,0.25)"}/>
          )))}
          <rect x="133" y="160" width="34" height="40" rx="3" fill="rgba(255,255,255,0.3)"/>
          <circle cx="161" cy="182" r="3" fill="rgba(255,220,50,0.8)"/>
          <circle cx="150" cy="20" r="16" fill="rgba(255,255,255,0.2)"/>
          <text x="150" y="26" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">F</text>
          <circle cx="100" cy="195" r="7" fill="rgba(255,255,255,0.6)"/>
          <rect x="95" y="203" width="10" height="12" rx="2" fill="rgba(255,255,255,0.5)"/>
          <circle cx="200" cy="195" r="7" fill="rgba(255,255,255,0.6)"/>
          <rect x="195" y="203" width="10" height="12" rx="2" fill="rgba(255,255,255,0.5)"/>
        </svg>
      ),
      titulo: '¡Bienvenida tu empresa! 🏢',
      subtitulo: 'Talento cuando lo necesitas',
      descripcion: 'Conecta con profesionales independientes para eventos, limpieza, logística y más. Rápido y sin complicaciones.',
    },
    {
      bg: 'from-blue-800 to-cyan-700',
      ilustracion: (
        <svg viewBox="0 0 300 220" className="w-full max-w-xs mx-auto">
          <ellipse cx="150" cy="130" rx="100" ry="40" fill="rgba(255,255,255,0.15)"/>
          <rect x="50" y="125" width="200" height="12" rx="6" fill="rgba(255,255,255,0.2)"/>
          {[[150,75],[80,100],[220,100],[60,150],[240,150],[150,175]].map(([x,y],i) => (
            <g key={i}>
              <circle cx={x} cy={y-8} r="10" fill="rgba(255,255,255,0.7)"/>
              <rect x={x-8} y={y+2} width="16" height="14" rx="4" fill="rgba(255,255,255,0.55)"/>
            </g>
          ))}
          <rect x="125" y="108" width="50" height="32" rx="4" fill="rgba(255,255,255,0.25)"/>
          <rect x="120" y="138" width="60" height="4" rx="2" fill="rgba(255,255,255,0.2)"/>
          <polyline points="132,130 140,118 148,124 156,112 164,120 168,115" stroke="rgba(255,220,50,0.8)" strokeWidth="2" fill="none"/>
        </svg>
      ),
      titulo: 'Profesionales verificados 👥',
      subtitulo: 'Para cada tipo de servicio',
      descripcion: 'Meseros, cocineros, personal de limpieza, choferes y más. Todos con perfil verificado y calificaciones reales.',
    },
    {
      bg: 'from-emerald-700 to-teal-800',
      ilustracion: (
        <svg viewBox="0 0 300 220" className="w-full max-w-xs mx-auto">
          <rect x="70" y="30" width="160" height="180" rx="12" fill="rgba(255,255,255,0.15)"/>
          <rect x="85" y="50" width="130" height="16" rx="4" fill="rgba(255,255,255,0.3)"/>
          {[0,1,2,3,4].map(i => (
            <g key={i}>
              <rect x="85" y={78+i*24} width="16" height="16" rx="4" fill={i<3 ? "rgba(100,255,150,0.7)" : "rgba(255,255,255,0.2)"}/>
              {i<3 && <polyline points={`88,${86+i*24} 91,${90+i*24} 99,${82+i*24}`} stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>}
              <rect x="110" y={80+i*24} width={i<3 ? 80 : 60} height="8" rx="3" fill="rgba(255,255,255,0.25)"/>
            </g>
          ))}
          <circle cx="220" cy="60" r="30" fill="rgba(100,255,150,0.2)" stroke="rgba(100,255,150,0.6)" strokeWidth="3"/>
          <polyline points="207,60 215,68 233,50" stroke="rgba(100,255,150,0.9)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      titulo: 'Gestión simplificada ✅',
      subtitulo: 'Todo en un solo lugar',
      descripcion: 'Publica el servicio que necesitas, selecciona al profesional ideal y paga de forma segura. Así de simple.',
    },
    {
      bg: 'from-violet-800 to-purple-900',
      ilustracion: (
        <svg viewBox="0 0 300 220" className="w-full max-w-xs mx-auto">
          <rect x="50" y="160" width="200" height="3" rx="1" fill="rgba(255,255,255,0.3)"/>
          <rect x="50" y="40" width="3" height="120" rx="1" fill="rgba(255,255,255,0.3)"/>
          {[[70,120,30],[110,90,30],[150,60,30],[190,35,30]].map(([x,y,w],i) => (
            <rect key={i} x={x} y={y} width={w} height={160-y} rx="4" fill={`rgba(255,255,255,${0.15+i*0.07})`}/>
          ))}
          <polyline points="85,140 125,110 165,75 205,48" stroke="rgba(255,220,50,0.9)" strokeWidth="3" fill="none" strokeLinecap="round"/>
          {[[85,140],[125,110],[165,75],[205,48]].map(([x,y],i) => (
            <circle key={i} cx={x} cy={y} r="5" fill="rgba(255,220,50,0.9)"/>
          ))}
          <polygon points="255,30 245,50 251,50 251,80 259,80 259,50 265,50" fill="rgba(100,255,150,0.8)"/>
          <text x="150" y="195" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11">Eficiencia operativa</text>
        </svg>
      ),
      titulo: '¡Optimiza tu operación! 📈',
      subtitulo: 'Paga solo por servicio completado',
      descripcion: 'Conecta con profesionales independientes cuando los necesites. El pago está protegido hasta que el servicio quede bien.',
    },
  ],
};

function OnboardingContent() {
  const searchParams = useSearchParams();
  const [paso, setPaso] = useState(0);
  const [rol, setRol] = useState('flekser');
  const [cargando, setCargando] = useState(true);
  const [animando, setAnimando] = useState(false);
  const [direccion, setDireccion] = useState<'left' | 'right'>('right');
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const verificar = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }
      const { data: perfil } = await supabase
        .from('usuarios').select('rol, rol_activo, onboarding_completado').eq('id', user.id).single();
      if (perfil?.onboarding_completado) {
        redirigir(perfil.rol_activo || perfil.rol);
        return;
      }
      setRol(perfil?.rol_activo || perfil?.rol || searchParams.get('rol') || 'flekser');
      setCargando(false);
    };
    verificar();
  }, []);

  const redirigir = (r: string) => {
    if (r === 'empresa') window.location.href = '/home-empresa';
    else window.location.href = '/home';
  };

  const completarOnboarding = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('usuarios')
        .update({ onboarding_completado: true, rol_activo: rol })
        .eq('id', user.id);
    }
    redirigir(rol);
  };

  const irAPaso = (nuevoPaso: number, dir: 'left' | 'right') => {
    if (animando) return;
    setDireccion(dir);
    setAnimando(true);
    setTimeout(() => {
      setPaso(nuevoPaso);
      setAnimando(false);
    }, 200);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && paso < slidesList.length - 1) irAPaso(paso + 1, 'right');
      if (diff < 0 && paso > 0) irAPaso(paso - 1, 'left');
    }
    touchStartX.current = null;
  };

  if (cargando) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"/>
      </main>
    );
  }

  const slidesList = slides[rol] || slides.flekser;
  const slide = slidesList[paso];
  const esUltimo = paso === slidesList.length - 1;

  return (
    <main
      className={`min-h-screen bg-gradient-to-br ${slide.bg} flex flex-col transition-colors duration-500`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex justify-end px-6 pt-12">
        <button onClick={completarOnboarding} className="text-white/60 text-sm font-semibold hover:text-white transition">
          Saltar
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-4">
        <div
          className="w-full max-w-xs"
          style={{
            opacity: animando ? 0 : 1,
            transform: animando
              ? `translateX(${direccion === 'right' ? '-20px' : '20px'})`
              : 'translateX(0)',
            transition: 'opacity 0.2s ease, transform 0.2s ease',
          }}
        >
          {slide.ilustracion}
        </div>
      </div>

      <div
        className="px-8 pb-4"
        style={{
          opacity: animando ? 0 : 1,
          transform: animando
            ? `translateX(${direccion === 'right' ? '-20px' : '20px'})`
            : 'translateX(0)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}
      >
        <h1 className="text-3xl font-extrabold text-white text-center mb-2">{slide.titulo}</h1>
        <p className="text-white/70 text-sm font-semibold text-center mb-2">{slide.subtitulo}</p>
        <p className="text-white/80 text-base text-center font-light leading-relaxed">{slide.descripcion}</p>
      </div>

      <div className="flex justify-center gap-2 py-4">
        {slidesList.map((_: any, i: number) => (
          <button key={i} onClick={() => irAPaso(i, i > paso ? 'right' : 'left')}
            className={`rounded-full transition-all duration-300 ${i === paso ? 'w-6 h-2.5 bg-white' : 'w-2.5 h-2.5 bg-white/35'}`}/>
        ))}
      </div>

      <div className="px-8 pb-12 flex gap-3">
        {paso > 0 && (
          <button onClick={() => irAPaso(paso - 1, 'left')}
            className="flex-1 py-4 bg-white/20 text-white rounded-2xl font-bold text-lg hover:bg-white/30 transition">
            ←
          </button>
        )}
        <button onClick={() => esUltimo ? completarOnboarding() : irAPaso(paso + 1, 'right')}
          className="flex-1 py-4 bg-white text-gray-900 rounded-2xl font-extrabold text-lg shadow-lg hover:opacity-90 transition">
          {esUltimo ? '¡Empezar! 🚀' : 'Siguiente →'}
        </button>
      </div>
    </main>
  );
}

export default function Onboarding() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"/>
      </main>
    }>
      <OnboardingContent />
    </Suspense>
  );
}