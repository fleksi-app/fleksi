export default function Privacidad() {
  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 pt-12 pb-8">
        <div className="max-w-2xl mx-auto">
          <a href="/" className="text-white/70 text-sm hover:text-white transition">← Volver</a>
          <h1 className="text-white font-extrabold text-2xl mt-3">Aviso de Privacidad Integral</h1>
          <p className="text-white/70 text-sm mt-1">Versión 1.0 — Junio 2026 — Conforme a la LFPDPPP</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-6">

        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <p className="text-sm text-yellow-800 font-semibold">⚠️ Documento en revisión legal. Pendiente de validación por abogado certificado.</p>
        </div>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">I. Identidad y domicilio del responsable</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Luis Fernando Nájera Mora, persona física con actividad empresarial, con domicilio en Calle Nogal 1469 Interior 102, Colonia Jardines de Irapuato, Irapuato, Guanajuato, C.P. 36660, México, RFC NAML870430TS2, es responsable del tratamiento de sus datos personales conforme al presente Aviso de Privacidad.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Para consultas relacionadas con el tratamiento de sus datos personales:{' '}
            <a href="mailto:privacidad.fleksi@gmail.com" className="text-purple-600 font-semibold hover:underline">privacidad.fleksi@gmail.com</a>
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">II. Datos personales que recabamos</h2>
          <div className="flex flex-col gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-sm font-bold text-gray-900 mb-1">📋 Datos de identificación</p>
              <p className="text-xs text-gray-500">Nombre completo, fecha de nacimiento, fotografía de perfil, copia de INE/IFE, CURP.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-sm font-bold text-gray-900 mb-1">📱 Datos de contacto</p>
              <p className="text-xs text-gray-500">Correo electrónico, número de teléfono celular, ciudad y estado de residencia.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-sm font-bold text-gray-900 mb-1">🪪 Datos de verificación</p>
              <p className="text-xs text-gray-500">Antecedentes no penales, comprobante de domicilio, constancia fiscal (para Empresas).</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-sm font-bold text-gray-900 mb-1">💳 Datos financieros</p>
              <p className="text-xs text-gray-500">Los datos de tarjeta son procesados directamente por Stripe. Fleksi no almacena números de tarjeta. CLABE bancaria para retiros.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-sm font-bold text-gray-900 mb-1">📍 Datos de ubicación</p>
              <p className="text-xs text-gray-500">Ubicación al momento del check-in para verificar presencia en el lugar del servicio (solo con autorización expresa del usuario).</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-sm font-bold text-gray-900 mb-1">📸 Datos de uso</p>
              <p className="text-xs text-gray-500">Historial de servicios, calificaciones, reseñas, fotografías antes/después del servicio, dirección IP y datos del dispositivo.</p>
            </div>
          </div>
          <div className="mt-3 bg-green-50 rounded-xl p-3 border border-green-100">
            <p className="text-xs text-green-700 font-semibold">✅ Fleksi NO recaba datos personales sensibles (estado de salud, origen étnico, creencias religiosas, orientación sexual, etc.).</p>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">III. Finalidades del tratamiento</h2>
          <p className="text-gray-600 text-sm font-bold mb-2">Finalidades primarias (necesarias):</p>
          <ul className="text-gray-600 text-sm leading-relaxed space-y-1 list-none mb-4">
            <li>✓ Crear y gestionar su cuenta de usuario</li>
            <li>✓ Verificar su identidad y prevenir fraudes</li>
            <li>✓ Facilitar la conexión entre Fleksers y Clientes/Empresas</li>
            <li>✓ Procesar pagos y administrar el Fleksi Wallet</li>
            <li>✓ Enviar notificaciones relacionadas con el servicio</li>
            <li>✓ Cumplir con obligaciones legales y fiscales (Ley de Plataformas Digitales)</li>
            <li>✓ Resolver disputas y brindar soporte</li>
          </ul>
          <p className="text-gray-600 text-sm font-bold mb-2">Finalidades secundarias (opcionales):</p>
          <ul className="text-gray-600 text-sm leading-relaxed space-y-1 list-none">
            <li>✓ Enviar comunicaciones de marketing y promociones</li>
            <li>✓ Realizar encuestas de satisfacción</li>
            <li>✓ Mejorar los algoritmos de la plataforma</li>
          </ul>
          <p className="text-gray-600 text-sm mt-3">
            Para oponerse a las finalidades secundarias envía un correo a{' '}
            <a href="mailto:privacidad.fleksi@gmail.com" className="text-purple-600 font-semibold hover:underline">privacidad.fleksi@gmail.com</a>.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">IV. Transferencia de datos</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">Compartimos tus datos únicamente con los siguientes terceros para las finalidades indicadas:</p>
          <div className="flex flex-col gap-2">
            {[
              { nombre: 'Stripe Inc.', fin: 'Procesamiento de pagos y prevención de fraude', pais: 'EUA' },
              { nombre: 'Supabase Inc.', fin: 'Almacenamiento de base de datos y autenticación', pais: 'EUA' },
              { nombre: 'Resend Inc.', fin: 'Envío de correos transaccionales', pais: 'EUA' },
              { nombre: 'Vercel Inc.', fin: 'Hospedaje de la plataforma web', pais: 'EUA' },
              { nombre: 'SAT (México)', fin: 'Cumplimiento de obligaciones fiscales', pais: 'México' },
              { nombre: 'Autoridades competentes', fin: 'Cumplimiento de órdenes judiciales o legales', pais: 'México' },
            ].map((t, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-gray-900">{t.nombre}</p>
                  <p className="text-xs text-gray-500">{t.fin}</p>
                </div>
                <span className="text-xs bg-gray-200 text-gray-600 font-semibold px-2 py-0.5 rounded-full flex-shrink-0">{t.pais}</span>
              </div>
            ))}
          </div>
          <p className="text-gray-600 text-sm mt-3">No vendemos, alquilamos ni compartimos tus datos con terceros para fines publicitarios.</p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">V. Derechos ARCO</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Conforme a la LFPDPPP, tienes derecho a Acceder, Rectificar, Cancelar u Oponerte al tratamiento de tus datos personales.
          </p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { letra: 'A', nombre: 'Acceso', desc: 'Conocer qué datos tenemos sobre ti' },
              { letra: 'R', nombre: 'Rectificación', desc: 'Corregir datos incorrectos' },
              { letra: 'C', nombre: 'Cancelación', desc: 'Solicitar la eliminación de tus datos' },
              { letra: 'O', nombre: 'Oposición', desc: 'Oponerte al tratamiento de tus datos' },
            ].map((d) => (
              <div key={d.letra} className="bg-gray-50 rounded-xl p-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm mb-2">{d.letra}</div>
                <p className="text-sm font-bold text-gray-900">{d.nombre}</p>
                <p className="text-xs text-gray-500 mt-0.5">{d.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-sm text-blue-700">
              Envía tu solicitud ARCO a{' '}
              <a href="mailto:privacidad.fleksi@gmail.com" className="font-bold hover:underline">privacidad.fleksi@gmail.com</a>.
              Responderemos en un plazo máximo de <span className="font-bold">20 días hábiles</span>.
            </p>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">VI. Medidas de seguridad</h2>
          <ul className="text-gray-600 text-sm leading-relaxed space-y-1 list-none">
            <li>✓ Cifrado de datos en tránsito mediante protocolo HTTPS/TLS</li>
            <li>✓ Almacenamiento en servidores con controles de acceso restringido</li>
            <li>✓ Procesamiento de pagos a través de Stripe (estándar PCI DSS)</li>
            <li>✓ Acceso a datos personales limitado al personal autorizado</li>
            <li>✓ Autenticación segura para acceso a la plataforma</li>
          </ul>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">VII. Retención de datos</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Conservamos tus datos mientras tu cuenta esté activa. Si solicitas la eliminación, borraremos tus datos personales en un plazo de 30 días, excepto aquellos que debamos conservar por obligaciones legales o fiscales (hasta 5 años conforme a la legislación mexicana).
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">VIII. Cookies</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Fleksi usa cookies esenciales de sesión para mantener tu inicio de sesión activo, y cookies analíticas anónimas para mejorar la plataforma. No usamos cookies de seguimiento ni publicidad. Puedes configurar tu navegador para rechazar cookies no esenciales.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">IX. Menores de edad</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Fleksi no está dirigida a personas menores de 18 años y no recopilamos intencionalmente datos de menores. Si detectamos que un usuario es menor de edad, cancelaremos su cuenta y eliminaremos sus datos.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">X. Autoridad competente</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Si considera que sus derechos de protección de datos han sido vulnerados, puede presentar una queja ante la Secretaría de Anticorrupción y Buen Gobierno, que a partir de 2025 asumió las funciones del INAI en materia de protección de datos personales en posesión de particulares.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">XI. Cambios a este aviso</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Podemos actualizar este aviso periódicamente. Te notificaremos de cambios importantes con al menos 15 días de anticipación a través de la app o por correo. El uso continuado de Fleksi implica tu aceptación.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">XII. Contacto</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Para cualquier duda sobre esta política contacta a:{' '}
            <a href="mailto:privacidad.fleksi@gmail.com" className="text-purple-600 font-semibold hover:underline">privacidad.fleksi@gmail.com</a>
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mt-2">
            Responsable: Luis Fernando Nájera Mora · Irapuato, Guanajuato, México
          </p>
        </section>

      </div>
    </main>
  );
}