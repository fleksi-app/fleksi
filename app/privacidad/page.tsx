export default function Privacidad() {
  return (
    <main className="min-h-screen pb-16" style={{background: '#F8FAFC'}}>
      <div className="bg-white px-6 pt-12 pb-6 shadow-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto">
          <a href="/" className="text-gray-400 text-sm hover:text-gray-600 transition">← Volver</a>
          <h1 className="font-extrabold text-gray-900 text-2xl mt-3">Aviso de Privacidad</h1>
          <p className="text-gray-400 text-sm mt-1">Versión 2.0 — Junio 2026</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-6">

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">Identidad del Responsable</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Luis Fernando Nájera Mora, persona física con actividad empresarial, RFC NAML870430TS2, con domicilio en Calle Nogal 1469 Interior 102, Colonia Jardines de Irapuato, Irapuato, Guanajuato, C.P. 36660, México (en adelante "Fleksi"), es el responsable del tratamiento de sus datos personales, de conformidad con lo establecido en la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-4">Datos personales que recabamos</h2>
          <div className="flex flex-col gap-4 text-sm text-gray-600">
            <div>
              <p className="font-semibold text-gray-800 mb-2">Datos de identificación:</p>
              <p className="leading-relaxed">Nombre completo, correo electrónico, número de teléfono, ciudad de residencia, fotografía de perfil.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800 mb-2">Datos de verificación de identidad (solo Fleksers):</p>
              <p className="leading-relaxed">Identificación oficial (INE/IFE), CURP, comprobante de domicilio, constancia de situación fiscal, carta de antecedentes no penales (opcional).</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800 mb-2">Datos financieros:</p>
              <p className="leading-relaxed">CLABE interbancaria, banco y nombre del titular (para pagos a Fleksers). Los datos de tarjeta de crédito/débito son procesados directamente por nuestro proveedor de pagos (Stripe) y Fleksi no los almacena.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800 mb-2">Datos de uso de la plataforma:</p>
              <p className="leading-relaxed">Historial de servicios, calificaciones, mensajes dentro de la plataforma, geolocalización aproximada (solo durante check-in/check-out con su consentimiento expreso).</p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-4">Finalidades del tratamiento</h2>
          <div className="flex flex-col gap-3 text-sm text-gray-600">
            <div>
              <p className="font-semibold text-gray-800 mb-2">Finalidades primarias (necesarias para el servicio):</p>
              <div className="flex flex-col gap-1 ml-2">
                {[
                  'Registro, autenticación y gestión de su cuenta.',
                  'Verificación de identidad de Fleksers.',
                  'Publicación y gestión de solicitudes de servicio.',
                  'Procesamiento de pagos y dispersión de fondos.',
                  'Comunicación entre Clientes y Fleksers a través de la plataforma.',
                  'Envío de notificaciones relacionadas con sus transacciones.',
                  'Cumplimiento de obligaciones legales y fiscales.',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold flex-shrink-0 mt-0.5">•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-800 mb-2">Finalidades secundarias (puede oponerse):</p>
              <div className="flex flex-col gap-1 ml-2">
                {[
                  'Envío de comunicaciones de marketing y promociones de Fleksi.',
                  'Encuestas de satisfacción y estudios de mercado.',
                  'Mejora de algoritmos de recomendación.',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold flex-shrink-0 mt-0.5">•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-4">Transferencia de datos</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Fleksi puede compartir sus datos personales con terceros únicamente en los siguientes supuestos:
          </p>
          <div className="flex flex-col gap-2 text-sm text-gray-600">
            {[
              { who: 'Stripe Inc.', why: 'Procesamiento seguro de pagos con tarjeta.' },
              { who: 'Supabase Inc.', why: 'Almacenamiento de datos y autenticación de usuarios.' },
              { who: 'Vercel Inc.', why: 'Hospedaje y distribución de la aplicación.' },
              { who: 'Resend Inc.', why: 'Envío de correos electrónicos transaccionales.' },
              { who: 'Autoridades competentes', why: 'Cuando sea requerido por mandato legal, judicial o administrativo.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                <div className="flex-shrink-0 font-bold text-gray-900 min-w-28">{item.who}</div>
                <div className="text-gray-500">{item.why}</div>
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-xs mt-3 leading-relaxed">
            Todos nuestros proveedores cumplen con estándares internacionales de protección de datos. No vendemos ni cedemos sus datos a terceros con fines comerciales propios de dichos terceros.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-4">Sus derechos ARCO</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            De conformidad con la LFPDPPP, usted tiene derecho a:
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { letra: 'A', nombre: 'Acceso', desc: 'Conocer qué datos tenemos sobre usted.' },
              { letra: 'R', nombre: 'Rectificación', desc: 'Corregir datos inexactos o incompletos.' },
              { letra: 'C', nombre: 'Cancelación', desc: 'Solicitar la eliminación de sus datos.' },
              { letra: 'O', nombre: 'Oposición', desc: 'Oponerse al tratamiento de sus datos.' },
            ].map(item => (
              <div key={item.letra} className="rounded-2xl p-4 border border-gray-100" style={{background: '#F5F0FF'}}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-white text-sm mb-2" style={{background: '#7B2FE0'}}>{item.letra}</div>
                <p className="font-bold text-gray-900 text-sm">{item.nombre}</p>
                <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-gray-600 text-sm leading-relaxed mt-4">
            Para ejercer sus derechos ARCO, envíe su solicitud a <span className="font-semibold text-gray-900">soporte@fleksiapp.com</span> indicando su nombre completo, datos de contacto, descripción del derecho que desea ejercer y copia de identificación oficial. Responderemos en un plazo máximo de 20 días hábiles.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">Seguridad de los datos</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Fleksi implementa medidas técnicas, administrativas y físicas para proteger sus datos personales contra pérdida, robo, acceso no autorizado, divulgación, alteración o destrucción. La comunicación entre su dispositivo y nuestros servidores se realiza mediante cifrado TLS/HTTPS. Las contraseñas se almacenan con hash seguro y nunca en texto plano.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">Cookies y tecnologías de seguimiento</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Fleksi utiliza cookies de sesión estrictamente necesarias para el funcionamiento de la plataforma. No utilizamos cookies de seguimiento de terceros con fines publicitarios. Puede configurar su navegador para rechazar cookies, aunque esto puede afectar la funcionalidad de la plataforma.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">Cambios a este aviso</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Fleksi podrá modificar este Aviso de Privacidad en cualquier momento. Cuando lo haga, le notificaremos mediante un aviso en la plataforma o por correo electrónico. El uso continuado de la plataforma después de dichos cambios constituye su aceptación de los mismos.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">Contacto</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Para cualquier duda sobre el tratamiento de sus datos personales o para ejercer sus derechos ARCO:
          </p>
          <div className="mt-3 bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-900">Responsable: Luis Fernando Nájera Mora</p>
            <p className="text-sm text-gray-600 mt-1">Email: soporte@fleksiapp.com</p>
            <p className="text-sm text-gray-600">Dirección: Calle Nogal 1469 Int. 102, Jardines de Irapuato, Irapuato, Gto., C.P. 36660</p>
          </div>
        </section>

        <p className="text-xs text-gray-400 text-center">Última actualización: junio 2026. Este aviso cumple con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares y su Reglamento.</p>

      </div>
    </main>
  );
}