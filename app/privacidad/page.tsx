export default function Privacidad() {
  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 pt-12 pb-8">
        <div className="max-w-2xl mx-auto">
          <a href="/" className="text-white/70 text-sm hover:text-white transition">← Volver</a>
          <h1 className="text-white font-extrabold text-2xl mt-3">Política de Privacidad</h1>
          <p className="text-white/70 text-sm mt-1">Última actualización: Mayo 2026</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-8">

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">1. Responsable del tratamiento</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Fleksi es responsable del tratamiento de tus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) de México. Puedes contactarnos en <span className="text-purple-600 font-semibold">privacidad@fleksi.app</span>.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">2. Datos que recopilamos</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">Recopilamos los siguientes datos personales:</p>
          <div className="flex flex-col gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-sm font-bold text-gray-900 mb-1">📋 Datos de registro</p>
              <p className="text-xs text-gray-500">Nombre, correo electrónico, teléfono, foto de perfil, ciudad.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-sm font-bold text-gray-900 mb-1">🪪 Datos de verificación</p>
              <p className="text-xs text-gray-500">INE, CURP, comprobante de domicilio, antecedentes no penales (solo para Fleksers).</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-sm font-bold text-gray-900 mb-1">📍 Datos de ubicación</p>
              <p className="text-xs text-gray-500">Ubicación aproximada al momento del check-in para verificar presencia en el lugar de trabajo.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-sm font-bold text-gray-900 mb-1">💳 Datos de pago</p>
              <p className="text-xs text-gray-500">Los datos de tarjeta son procesados directamente por Stripe. Fleksi no almacena números de tarjeta.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-sm font-bold text-gray-900 mb-1">📸 Fotos de trabajo</p>
              <p className="text-xs text-gray-500">Fotografías tomadas antes y después del servicio para documentación.</p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">3. Finalidad del tratamiento</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-2">Usamos tus datos para:</p>
          <ul className="text-gray-600 text-sm leading-relaxed space-y-1 list-none">
            <li>✓ Crear y gestionar tu cuenta en la plataforma</li>
            <li>✓ Conectarte con Clientes o Fleksers según tu rol</li>
            <li>✓ Procesar pagos y transacciones</li>
            <li>✓ Verificar tu identidad y prevenir fraudes</li>
            <li>✓ Enviar notificaciones relacionadas con tus servicios</li>
            <li>✓ Mejorar la plataforma y personalizar tu experiencia</li>
            <li>✓ Cumplir con obligaciones legales</li>
          </ul>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">4. Compartición de datos</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Compartimos tus datos únicamente con:
          </p>
          <ul className="text-gray-600 text-sm leading-relaxed space-y-2 list-none">
            <li><span className="font-semibold">Stripe</span> — procesamiento de pagos</li>
            <li><span className="font-semibold">Supabase</span> — almacenamiento seguro de datos</li>
            <li><span className="font-semibold">Resend</span> — envío de correos transaccionales</li>
            <li><span className="font-semibold">Otros usuarios</span> — solo la información necesaria para coordinar el servicio (nombre, foto, calificación)</li>
          </ul>
          <p className="text-gray-600 text-sm leading-relaxed mt-3">
            No vendemos, alquilamos ni compartimos tus datos con terceros para fines publicitarios.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">5. Retención de datos</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Conservamos tus datos mientras tu cuenta esté activa. Si solicitas la eliminación de tu cuenta, borraremos tus datos personales en un plazo de 30 días, excepto aquellos que debamos conservar por obligaciones legales o fiscales (hasta 5 años según la legislación mexicana).
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">6. Tus derechos ARCO</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Conforme a la LFPDPPP, tienes derecho a:
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { letra: 'A', nombre: 'Acceso', desc: 'Conocer qué datos tenemos sobre ti' },
              { letra: 'R', nombre: 'Rectificación', desc: 'Corregir datos incorrectos' },
              { letra: 'C', nombre: 'Cancelación', desc: 'Solicitar la eliminación de tus datos' },
              { letra: 'O', nombre: 'Oposición', desc: 'Oponerte al tratamiento de tus datos' },
            ].map((d) => (
              <div key={d.letra} className="bg-gray-50 rounded-xl p-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm mb-2">
                  {d.letra}
                </div>
                <p className="text-sm font-bold text-gray-900">{d.nombre}</p>
                <p className="text-xs text-gray-500 mt-0.5">{d.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-gray-600 text-sm leading-relaxed mt-3">
            Para ejercer tus derechos ARCO escríbenos a <span className="text-purple-600 font-semibold">privacidad@fleksi.app</span>. Responderemos en un plazo máximo de 20 días hábiles.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">7. Seguridad</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Implementamos medidas técnicas y organizativas para proteger tus datos: cifrado SSL/TLS, autenticación segura, acceso restringido a datos sensibles y almacenamiento en servidores seguros. Los documentos de verificación se almacenan en servidores cifrados y solo son accesibles por el equipo de revisión de Fleksi.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">8. Cookies</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Fleksi usa cookies de sesión para mantener tu inicio de sesión activo. No usamos cookies de seguimiento ni publicidad. Puedes configurar tu navegador para rechazar cookies, aunque esto puede afectar el funcionamiento de la aplicación.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">9. Menores de edad</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Fleksi no está dirigida a menores de 18 años. No recopilamos intencionalmente datos de menores. Si detectamos que un usuario es menor de edad, cancelaremos su cuenta y eliminaremos sus datos.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">10. Cambios a esta política</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Podemos actualizar esta política periódicamente. Te notificaremos de cambios importantes a través de la app o por correo. El uso continuado de Fleksi después de los cambios implica tu aceptación.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">11. Contacto</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Para cualquier duda sobre esta política contacta a nuestro equipo de privacidad en <span className="text-purple-600 font-semibold">privacidad@fleksi.app</span>.
          </p>
        </section>

      </div>
    </main>
  );
}