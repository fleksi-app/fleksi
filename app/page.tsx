export default function Home() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center">

        {/* Logo */}
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
          <a href="/registro" className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold text-lg shadow-lg hover:opacity-90 transition text-center">
            👷 Soy prestador de servicios
          </a>
          <a href="/registro" className="w-full py-4 px-6 bg-white text-gray-800 rounded-2xl font-semibold text-lg border-2 border-gray-200 hover:border-purple-400 transition text-center">
            🙋 Necesito un servicio
          </a>
          <a href="/registro" className="w-full py-4 px-6 bg-white text-gray-800 rounded-2xl font-semibold text-lg border-2 border-gray-200 hover:border-purple-400 transition text-center">
            🏢 Soy empresa
          </a>
          <a href="/registro" className="w-full py-4 px-6 bg-white text-gray-800 rounded-2xl font-semibold text-lg border-2 border-gray-200 hover:border-purple-400 transition text-center">
            ✈️ Soy viajero
          </a>
        </div>

        <p className="mt-8 text-gray-400 text-sm">
          ¿Ya tienes cuenta?{" "}
          <a href="/login" className="text-purple-600 font-semibold hover:underline">
            Inicia sesión
          </a>
        </p>

      </div>
    </main>
  );
}