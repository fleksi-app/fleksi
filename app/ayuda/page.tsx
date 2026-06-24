'use client';
import { useState } from 'react';
import Nav from '@/lib/nav';

const MORADO = '#7B2FE0';

const guias = {
  flekser: [
    {
      id: 'registro',
      titulo: '1. Crea tu perfil Flekser',
      emoji: '👤',
      pasos: [
        { icono: '📸', texto: 'Sube una foto profesional — fleksers con foto reciben 5x más solicitudes.' },
        { icono: '🛠️', texto: 'Agrega tus habilidades (limpieza, mecánica, plomería, etc.).' },
        { icono: '📝', texto: 'Escribe una descripción corta de ti y tu experiencia.' },
        { icono: '📍', texto: 'Confirma tu ciudad para aparecer en búsquedas locales.' },
        { icono: '🪪', texto: 'Verifica tu identidad para generar confianza y aparecer primero.' },
      ],
      tip: 'Los fleksers con perfil al 100% aparecen primero en el catálogo y reciben más solicitudes.'
    },
    {
      id: 'trabajos',
      titulo: '2. Encuentra y aplica a trabajos',
      emoji: '🔍',
      pasos: [
        { icono: '🏠', texto: 'En el Home verás trabajos disponibles en tu ciudad.' },
        { icono: '🔎', texto: 'Usa el buscador para encontrar trabajos por palabra clave.' },
        { icono: '👆', texto: 'Toca un trabajo para ver todos los detalles.' },
        { icono: '✋', texto: 'Toca "Aplicar" y propón tu precio u horario.' },
        { icono: '⏳', texto: 'Espera a que el cliente acepte tu propuesta.' },
      ],
      tip: 'Sé el primero en aplicar — los clientes suelen contratar a los primeros fleksers que responden.'
    },
    {
      id: 'checkin',
      titulo: '3. Realiza el trabajo',
      emoji: '✅',
      pasos: [
        { icono: '📍', texto: 'Cuando llegues, haz Check-in desde la app para registrar tu llegada.' },
        { icono: '🤝', texto: 'Realiza el trabajo acordado con el cliente.' },
        { icono: '📷', texto: 'Toma fotos del resultado (antes y después si es posible).' },
        { icono: '✅', texto: 'Haz Check-out al terminar para registrar la finalización.' },
        { icono: '⭐', texto: 'El cliente calificará tu trabajo — ¡sé puntual y profesional!' },
      ],
      tip: 'Las fotos de tu trabajo se agregan automáticamente a tu portafolio y atraen más clientes.'
    },
    {
      id: 'pago',
      titulo: '4. Recibe tu pago',
      emoji: '💰',
      pasos: [
        { icono: '⏱️', texto: 'El pago se libera automáticamente 24 horas después de completar el trabajo.' },
        { icono: '💳', texto: 'El dinero llega a tu Wallet dentro de la app.' },
        { icono: '🏦', texto: 'Solicita un retiro a tu CLABE interbancaria desde la sección Wallet.' },
        { icono: '📅', texto: 'Los retiros tardan 1-3 días hábiles en llegar a tu cuenta.' },
        { icono: '📊', texto: 'Revisa tu historial de ganancias en Wallet → Saldo.' },
      ],
      tip: 'Fleksi retiene el 10% como comisión de plataforma. El 90% es tuyo.'
    },
    {
      id: 'crecer',
      titulo: '5. Crece en Fleksi',
      emoji: '🚀',
      pasos: [
        { icono: '⭐', texto: 'Mantén una calificación alta para aparecer primero en búsquedas.' },
        { icono: '🏅', texto: 'Desbloquea insignias completando trabajos y verificando tu identidad.' },
        { icono: '📸', texto: 'Agrega fotos a tu portafolio después de cada trabajo.' },
        { icono: '🎁', texto: 'Comparte tu código de referido y gana bonos por cada amigo que se registre.' },
        { icono: '🌆', texto: 'Expande a más ciudades — activa tu modo Viajero si trabajas fuera de tu ciudad.' },
      ],
      tip: 'Los mejores fleksers completan su perfil al 100%, verifican su identidad y responden rápido.'
    },
  ],
  empresa: [
    {
      id: 'publicar',
      titulo: '1. Publica una solicitud',
      emoji: '📋',
      pasos: [
        { icono: '➕', texto: 'Toca el botón "Publicar" en el menú inferior.' },
        { icono: '🏷️', texto: 'Selecciona la categoría del servicio que necesitas.' },
        { icono: '📝', texto: 'Describe con detalle qué necesitas, cuándo y dónde.' },
        { icono: '💵', texto: 'Define un presupuesto aproximado — esto atrae mejores candidatos.' },
        { icono: '🔴', texto: 'Si es urgente, actívalo — recibirás propuestas en minutos.' },
      ],
      tip: 'Las solicitudes con descripción detallada y presupuesto definido reciben 3x más propuestas.'
    },
    {
      id: 'seleccionar',
      titulo: '2. Selecciona al mejor Flekser',
      emoji: '👥',
      pasos: [
        { icono: '📱', texto: 'Recibirás notificaciones cuando Fleksers apliquen a tu solicitud.' },
        { icono: '👤', texto: 'Revisa el perfil, calificación y portafolio de cada candidato.' },
        { icono: '✅', texto: 'Acepta la propuesta del flekser que más te convenza.' },
        { icono: '💬', texto: 'Usa el chat dentro de la app para coordinar detalles.' },
        { icono: '❌', texto: 'Puedes rechazar propuestas sin penalización si ninguna te convence.' },
      ],
      tip: 'Revisa el portafolio y las reseñas de cada flekser antes de aceptar.'
    },
    {
      id: 'servicio',
      titulo: '3. Coordina el servicio',
      emoji: '🤝',
      pasos: [
        { icono: '📍', texto: 'El flekser hará Check-in cuando llegue — verás la notificación.' },
        { icono: '💬', texto: 'Comunícate por el chat de la app si necesitas algo.' },
        { icono: '✅', texto: 'Al terminar, el flekser hará Check-out.' },
        { icono: '👀', texto: 'Revisa el trabajo realizado y las fotos del resultado.' },
        { icono: '✓', texto: 'Confirma la finalización para liberar el pago.' },
      ],
      tip: 'Si no confirmas en 24 horas, el pago se libera automáticamente para proteger al flekser.'
    },
    {
      id: 'pago_empresa',
      titulo: '4. Pagos y comisiones',
      emoji: '💳',
      pasos: [
        { icono: '💵', texto: 'Pagas el precio acordado más un 15% de comisión de plataforma.' },
        { icono: '🔒', texto: 'El pago queda retenido hasta confirmar la finalización del trabajo.' },
        { icono: '💳', texto: 'Acepta tarjeta de crédito/débito o saldo de tu Wallet.' },
        { icono: '🧾', texto: 'Descarga tu historial de pagos desde Wallet → Saldo.' },
        { icono: '↩️', texto: 'Si hay un problema, puedes abrir una disputa dentro de 24 horas.' },
      ],
      tip: 'Fleksi actúa solo como intermediario. La comisión del 15% cubre el servicio de la plataforma.'
    },
    {
      id: 'calificar',
      titulo: '5. Califica y vuelve a contratar',
      emoji: '⭐',
      pasos: [
        { icono: '⭐', texto: 'Califica al flekser honestamente — ayuda a otros clientes a elegir bien.' },
        { icono: '💬', texto: 'Deja un comentario sobre tu experiencia.' },
        { icono: '❤️', texto: 'Si quedaste satisfecho, guarda al flekser como favorito.' },
        { icono: '🔄', texto: 'Puedes volver a contratarlo directamente desde su perfil.' },
        { icono: '📢', texto: 'Comparte Fleksi con otros — crece la comunidad y hay más opciones.' },
      ],
      tip: 'Los fleksers bien calificados se esfuerzan más. Tu calificación importa para toda la comunidad.'
    },
  ]
};

const faqs = [
  { p: '¿Es seguro contratar por Fleksi?', r: 'Sí. Los Fleksers verifican su identidad con documentos oficiales. Además, el pago queda retenido hasta confirmar que el trabajo fue completado correctamente.' },
  { p: '¿Qué pasa si el trabajo no quedó bien?', r: 'Tienes 24 horas para abrir una disputa desde que el trabajo fue marcado como completado. Fleksi actuará como intermediario para resolver el problema.' },
  { p: '¿Cuánto cobra Fleksi?', r: 'Fleksi cobra un 15% adicional al cliente sobre el precio del servicio, y retiene un 10% del pago al Flekser. El margen total de la plataforma es del 25%.' },
  { p: '¿Cuándo recibo mi pago como Flekser?', r: 'El pago se libera automáticamente 24 horas después de que el cliente confirme la finalización. Luego puedes solicitar un retiro a tu CLABE en 1-3 días hábiles.' },
  { p: '¿Puedo cancelar una solicitud?', r: 'Sí. Puedes cancelar antes de que alguien sea aceptado sin penalización. Si ya hay un flekser aceptado, se recomienda coordinarlo directamente por chat.' },
  { p: '¿Qué es la verificación de identidad?', r: 'Es un proceso donde subes tu INE, CURP y comprobante de domicilio. Nuestro equipo los revisa en 1-3 días. Los perfiles verificados generan más confianza y aparecen primero.' },
  { p: '¿Puedo ser Flekser y Empresa al mismo tiempo?', r: 'Sí. Puedes cambiar de modo en el menú de la app. Como Flekser ofreces servicios; como Empresa los contratas.' },
  { p: '¿Cómo funciona el código de referido?', r: 'Comparte tu código y cuando alguien se registre y complete su primer trabajo, recibes un bono en tu Wallet automáticamente.' },
];

export default function Ayuda() {
  const [seccion, setSeccion] = useState<'flekser' | 'empresa'>('flekser');
  const [guiaAbierta, setGuiaAbierta] = useState<string | null>(null);
  const [faqAbierta, setFaqAbierta] = useState<number | null>(null);

  return (
    <main className="min-h-screen pb-32" style={{background: '#F8FAFC'}}>
      <div className="bg-white px-6 pt-12 pb-4 shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto">
          <a href="/" className="text-gray-400 text-sm">← Volver</a>
          <h1 className="font-extrabold text-gray-900 text-xl mt-2">❓ Ayuda y soporte</h1>
          <p className="text-gray-400 text-sm mt-0.5">Aprende a sacarle el máximo a Fleksi</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 pt-5">

        {/* Selector */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
          <button onClick={() => setSeccion('flekser')}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition"
            style={{background: seccion === 'flekser' ? MORADO : 'transparent', color: seccion === 'flekser' ? 'white' : '#6B7280'}}>
            💼 Soy Flekser
          </button>
          <button onClick={() => setSeccion('empresa')}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition"
            style={{background: seccion === 'empresa' ? MORADO : 'transparent', color: seccion === 'empresa' ? 'white' : '#6B7280'}}>
            🏢 Soy Empresa
          </button>
        </div>

        {/* Banner intro */}
        <div className="rounded-2xl p-5 mb-5 text-white" style={{background: MORADO}}>
          {seccion === 'flekser' ? (
            <>
              <p className="font-extrabold text-lg mb-1">Gana dinero con tus habilidades 💪</p>
              <p className="text-white/80 text-sm">Sigue estas guías paso a paso para empezar a recibir trabajos y generar ingresos desde hoy.</p>
            </>
          ) : (
            <>
              <p className="font-extrabold text-lg mb-1">Encuentra ayuda de confianza 🤝</p>
              <p className="text-white/80 text-sm">Aprende a publicar solicitudes, seleccionar fleksers y gestionar tus servicios fácilmente.</p>
            </>
          )}
        </div>

        {/* Guías paso a paso */}
        <h2 className="font-extrabold text-gray-900 mb-3">📖 Guías paso a paso</h2>
        <div className="flex flex-col gap-3 mb-6">
          {guias[seccion].map((guia) => (
            <div key={guia.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button
                onClick={() => setGuiaAbierta(guiaAbierta === guia.id ? null : guia.id)}
                className="w-full flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{guia.emoji}</span>
                  <p className="font-extrabold text-gray-900 text-sm text-left">{guia.titulo}</p>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5"
                  style={{transform: guiaAbierta === guia.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s'}}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>

              {guiaAbierta === guia.id && (
                <div className="border-t border-gray-100 px-4 pb-4 pt-3">
                  <div className="flex flex-col gap-3 mb-4">
                    {guia.pasos.map((paso, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-lg" style={{background: '#F5F0FF'}}>
                          {paso.icono}
                        </div>
                        <div className="flex-1 pt-1">
                          <p className="text-sm text-gray-700 leading-relaxed">{paso.texto}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl p-3" style={{background: '#F5F0FF'}}>
                    <p className="text-xs font-bold mb-0.5" style={{color: MORADO}}>💡 Tip</p>
                    <p className="text-xs leading-relaxed" style={{color: '#6D28D9'}}>{guia.tip}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* FAQ */}
        <h2 className="font-extrabold text-gray-900 mb-3">🙋 Preguntas frecuentes</h2>
        <div className="flex flex-col gap-2 mb-6">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button
                onClick={() => setFaqAbierta(faqAbierta === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left">
                <p className="font-semibold text-gray-900 text-sm pr-4">{faq.p}</p>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" className="flex-shrink-0"
                  style={{transform: faqAbierta === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s'}}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              {faqAbierta === i && (
                <div className="border-t border-gray-100 px-4 pb-4 pt-3">
                  <p className="text-sm text-gray-600 leading-relaxed">{faq.r}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contacto */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-extrabold text-gray-900 mb-1">¿Sigues con dudas?</h3>
          <p className="text-gray-400 text-sm mb-4">Contáctanos y te ayudamos directamente.</p>
          <div className="flex flex-col gap-2">
            <a href="https://wa.me/524771234567" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-100 hover:opacity-90 transition">
              <span className="text-xl">💬</span>
              <div>
                <p className="font-bold text-green-700 text-sm">WhatsApp</p>
                <p className="text-xs text-green-600">Respuesta en minutos</p>
              </div>
              <span className="ml-auto text-green-500 font-bold">→</span>
            </a>
            <a href="mailto:soporte@fleksiapp.com"
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:opacity-90 transition">
              <span className="text-xl">✉️</span>
              <div>
                <p className="font-bold text-gray-700 text-sm">Email</p>
                <p className="text-xs text-gray-400">soporte@fleksiapp.com</p>
              </div>
              <span className="ml-auto text-gray-400 font-bold">→</span>
            </a>
          </div>
        </div>

      </div>
      <Nav activo="inicio" />
    </main>
  );
}