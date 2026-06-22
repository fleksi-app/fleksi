export default function Privacidad() {
  return (
    <main className="min-h-screen pb-16" style={{background: '#F8FAFC'}}>
      <div className="bg-white px-6 pt-12 pb-6 shadow-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto">
          <a href="/" className="text-gray-400 text-sm hover:text-gray-600 transition">← Volver</a>
          <h1 className="font-extrabold text-gray-900 text-2xl mt-3">Aviso de Privacidad Integral</h1>
          <p className="text-gray-400 text-sm mt-1">Versión 1.0 — Junio 2026 — Conforme a la LFPDPPP</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-6">

        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <p className="text-sm text-yellow-800 font-semibold">⚠️ Documento en revisión legal. Pendiente de validación por abogado certificado.</p>
        </div>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">I. Identidad y domicilio del responsable</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Luis Fernando Nájera Mora, persona física con actividad empresarial (en adelante el "Responsable"), con domicilio en Calle Nogal 1469 Interior 102, Colonia Jardines de Irapuato, Irapuato, Guanajuato, C.P. 36660, México, RFC NAML870430TS2, es responsable del tratamiento de sus datos personales conforme al presente Aviso de Privacidad.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mb-2">
            El Responsable opera la plataforma tecnológica FLEKSI, disponible en la aplicación móvil y en fleksi.vercel.app.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Para ejercer sus derechos o presentar consultas relacionadas con el tratamiento de sus datos personales, puede contactarnos en:{' '}
            <a href="mailto:privacidad.fleksi@gmail.com" className="text-purple-600 font-semibold hover:underline">privacidad.fleksi@gmail.com</a>
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-4">II. Datos personales que recabamos</h2>
          <div className="flex flex-col gap-3">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-bold text-gray-900 mb-2">2.1 Datos de Identificación</p>
              <ul className="text-xs text-gray-500 space-y-1 list-none">
                <li>• Nombre completo</li>
                <li>• Fecha de nacimiento</li>
                <li>• Fotografía de perfil</li>
                <li>• Copia de identificación oficial (INE/IFE, pasaporte)</li>
                <li>• CURP</li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-bold text-gray-900 mb-2">2.2 Datos de Contacto</p>
              <ul className="text-xs text-gray-500 space-y-1 list-none">
                <li>• Correo electrónico</li>
                <li>• Número de teléfono celular</li>
                <li>• Ciudad y estado de residencia</li>
                <li>• Dirección para prestación de servicios (cuando aplique)</li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-bold text-gray-900 mb-2">2.3 Datos Financieros y Patrimoniales</p>
              <ul className="text-xs text-gray-500 space-y-1 list-none">
                <li>• Información de tarjeta (procesada por Stripe, no almacenada por Fleksi)</li>
                <li>• Cuenta bancaria para retiros (CLABE interbancaria)</li>
                <li>• Historial de transacciones dentro de la Plataforma</li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-bold text-gray-900 mb-2">2.4 Datos de Verificación de Identidad</p>
              <ul className="text-xs text-gray-500 space-y-1 list-none">
                <li>• Documento de antecedentes no penales</li>
                <li>• Comprobante de domicilio</li>
                <li>• Constancia fiscal (para usuarios tipo Empresa)</li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-bold text-gray-900 mb-2">2.5 Datos de Uso de la Plataforma</p>
              <ul className="text-xs text-gray-500 space-y-1 list-none">
                <li>• Historial de servicios solicitados y prestados</li>
                <li>• Calificaciones y reseñas emitidas y recibidas</li>
                <li>• Preferencias y configuración de la cuenta</li>
                <li>• Dirección IP y datos de dispositivo</li>
                <li>• Datos de geolocalización (solo con autorización expresa del Usuario)</li>
              </ul>
            </div>
          </div>
          <div className="mt-3 bg-green-50 rounded-xl p-3 border border-green-100">
            <p className="text-xs text-green-700 font-semibold">✅ Fleksi NO recaba datos personales sensibles conforme al Artículo 3, fracción VI de la LFPDPPP (estado de salud, origen étnico, creencias religiosas, datos genéticos, vida sexual, etc.). En caso de que en el futuro sea necesario recabarlos, se solicitará consentimiento expreso y por escrito.</p>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-4">III. Finalidades del tratamiento</h2>
          <h3 className="font-bold text-gray-800 text-sm mb-2">3.1 Finalidades Primarias (Necesarias)</h3>
          <ul className="text-gray-600 text-sm leading-relaxed space-y-1 list-none mb-4">
            <li>✓ Crear y gestionar su cuenta de usuario en la Plataforma.</li>
            <li>✓ Verificar su identidad y prevenir el fraude.</li>
            <li>✓ Facilitar la conexión entre Fleksers y Clientes/Empresas.</li>
            <li>✓ Procesar pagos y administrar el Fleksi Wallet.</li>
            <li>✓ Enviar notificaciones relacionadas con el servicio (confirmaciones, alertas, disputas).</li>
            <li>✓ Cumplir con obligaciones legales, incluyendo las fiscales conforme a la Ley de Plataformas Digitales.</li>
            <li>✓ Resolver disputas y brindar soporte al Usuario.</li>
          </ul>
          <h3 className="font-bold text-gray-800 text-sm mb-2">3.2 Finalidades Secundarias (Opcionales)</h3>
          <ul className="text-gray-600 text-sm leading-relaxed space-y-1 list-none mb-3">
            <li>✓ Enviarle comunicaciones de marketing y promociones de Fleksi.</li>
            <li>✓ Realizar encuestas de satisfacción y estudios de mercado.</li>
            <li>✓ Mejorar los algoritmos de recomendación de la Plataforma.</li>
          </ul>
          <p className="text-gray-600 text-sm">
            Si no desea que sus datos sean tratados para estas finalidades secundarias, puede manifestarlo enviando un correo a{' '}
            <a href="mailto:privacidad.fleksi@gmail.com" className="text-purple-600 font-semibold hover:underline">privacidad.fleksi@gmail.com</a>{' '}
            con el asunto "Oposición a finalidades secundarias".
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-4">IV. Transferencia de datos personales</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">Sus datos personales podrán ser compartidos con los siguientes terceros para las finalidades indicadas:</p>
          <div className="flex flex-col gap-2 mb-4">
            {[
              { nombre: 'Stripe Inc.', fin: 'Procesamiento de pagos y prevención de fraude', pais: 'EUA' },
              { nombre: 'Supabase Inc.', fin: 'Almacenamiento de base de datos y autenticación', pais: 'EUA' },
              { nombre: 'Resend Inc.', fin: 'Envío de correos transaccionales', pais: 'EUA' },
              { nombre: 'Vercel Inc.', fin: 'Hospedaje de la plataforma web', pais: 'EUA' },
              { nombre: 'SAT (México)', fin: 'Cumplimiento de obligaciones fiscales (Ley de Plataformas)', pais: 'México' },
              { nombre: 'Autoridades competentes', fin: 'Cumplimiento de órdenes judiciales o legales', pais: 'México' },
            ].map((t, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">{t.nombre}</p>
                  <p className="text-xs text-gray-500">{t.fin}</p>
                </div>
                <span className="text-xs bg-gray-200 text-gray-600 font-semibold px-2 py-0.5 rounded-full flex-shrink-0">{t.pais}</span>
              </div>
            ))}
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            Los proveedores de servicios en el extranjero (Stripe, Supabase, Resend, Vercel) están sujetos a sus propias políticas de privacidad. Le recomendamos consultarlas. Dichas transferencias se realizan conforme al Artículo 37 de la LFPDPPP, ya que son necesarias para la ejecución del servicio que usted solicita.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-4">V. Derechos ARCO</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse (derechos ARCO) al tratamiento de sus datos personales, conforme a lo dispuesto por los Artículos 22 al 36 de la LFPDPPP.
          </p>
          <h3 className="font-bold text-gray-800 text-sm mb-2">5.1 Cómo ejercer sus derechos ARCO</h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-2">
            Para ejercer cualquiera de estos derechos, deberá enviar una solicitud a{' '}
            <a href="mailto:privacidad.fleksi@gmail.com" className="text-purple-600 font-semibold hover:underline">privacidad.fleksi@gmail.com</a>{' '}
            con los siguientes datos:
          </p>
          <ul className="text-gray-600 text-sm leading-relaxed space-y-1 list-none mb-4">
            <li>• Nombre completo y correo electrónico registrado en la Plataforma.</li>
            <li>• Descripción clara del derecho que desea ejercer.</li>
            <li>• Copia de identificación oficial vigente.</li>
            <li>• Cualquier documento que facilite la localización de sus datos.</li>
          </ul>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { letra: 'A', nombre: 'Acceso', desc: 'Conocer qué datos tenemos sobre ti' },
              { letra: 'R', nombre: 'Rectificación', desc: 'Corregir datos incorrectos' },
              { letra: 'C', nombre: 'Cancelación', desc: 'Solicitar la eliminación de tus datos' },
              { letra: 'O', nombre: 'Oposición', desc: 'Oponerte al tratamiento de tus datos' },
            ].map((d) => (
              <div key={d.letra} className="bg-gray-50 rounded-xl p-3">
                <div className="w-8 h-8 bg-purple-700 rounded-lg flex items-center justify-center text-white font-extrabold text-sm mb-2">{d.letra}</div>
                <p className="text-sm font-bold text-gray-900">{d.nombre}</p>
                <p className="text-xs text-gray-500 mt-0.5">{d.desc}</p>
              </div>
            ))}
          </div>
          <h3 className="font-bold text-gray-800 text-sm mb-2">5.2 Plazos de respuesta</h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            El Responsable dará respuesta a su solicitud dentro de los 20 días hábiles siguientes a su recepción. En caso de que la solicitud sea procedente, los cambios se realizarán dentro de los 15 días hábiles siguientes a la comunicación de la respuesta.
          </p>
          <h3 className="font-bold text-gray-800 text-sm mb-2">5.3 Revocación del consentimiento</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Usted puede revocar el consentimiento otorgado para el tratamiento de sus datos personales en cualquier momento, siempre que no exista un impedimento legal o contractual que lo impida. La revocación podrá resultar en la imposibilidad de continuar utilizando la Plataforma.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">VI. Medidas de seguridad</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            El Responsable implementa medidas de seguridad técnicas, administrativas y físicas para proteger sus datos personales contra daño, pérdida, alteración, destrucción, uso, acceso o tratamiento no autorizados, incluyendo:
          </p>
          <ul className="text-gray-600 text-sm leading-relaxed space-y-1 list-none mb-3">
            <li>✓ Cifrado de datos en tránsito mediante protocolo HTTPS/TLS.</li>
            <li>✓ Almacenamiento en servidores con controles de acceso restringido (Supabase).</li>
            <li>✓ Políticas de contraseñas seguras y autenticación de usuarios.</li>
            <li>✓ Acceso a datos personales limitado al personal autorizado del Responsable.</li>
            <li>✓ Procesamiento de pagos a través de Stripe, que cumple con el estándar PCI DSS.</li>
          </ul>
          <p className="text-gray-600 text-sm leading-relaxed">
            En caso de que ocurra una vulneración de seguridad que afecte de forma significativa sus derechos patrimoniales o morales, el Responsable lo notificará de forma inmediata a través de los medios de contacto registrados.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">VII. Uso de cookies y tecnologías de rastreo</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            La Plataforma puede utilizar cookies y tecnologías similares para mejorar la experiencia del Usuario, analizar el tráfico y personalizar el contenido. Las cookies utilizadas son:
          </p>
          <ul className="text-gray-600 text-sm leading-relaxed space-y-1 list-none mb-3">
            <li>• <span className="font-semibold">Cookies esenciales:</span> necesarias para el funcionamiento de la Plataforma (sesión de usuario, autenticación).</li>
            <li>• <span className="font-semibold">Cookies analíticas:</span> para comprender cómo los Usuarios interactúan con la Plataforma (métricas anónimas).</li>
          </ul>
          <p className="text-gray-600 text-sm leading-relaxed">
            Puede configurar su navegador o dispositivo para rechazar las cookies no esenciales, aunque esto podría afectar la funcionalidad de la Plataforma.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">VIII. Datos de menores de edad</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            La Plataforma no está dirigida a personas menores de 18 años. El Responsable no recaba intencionalmente datos personales de menores de edad. Si un menor de edad ha proporcionado datos personales sin el consentimiento de su representante legal, este deberá notificarlo al Responsable para proceder con la eliminación de dichos datos.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">IX. Cambios al aviso de privacidad</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            El presente Aviso de Privacidad podrá ser modificado en cualquier momento. Los cambios serán notificados a través de la Plataforma y/o por correo electrónico al menos 15 días naturales antes de su entrada en vigor. El uso continuado de la Plataforma después de la fecha de entrada en vigor de las modificaciones constituirá la aceptación del nuevo Aviso. La versión vigente siempre estará disponible en la sección de privacidad de la Plataforma.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">X. Autoridad competente</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Si considera que sus derechos de protección de datos han sido vulnerados, puede presentar una queja ante la Secretaría de Anticorrupción y Buen Gobierno (que a partir de 2025 absorbió las funciones del INAI en materia de protección de datos personales en posesión de particulares), a través de los medios oficiales que dicha dependencia habilite.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">Contacto</h2>
          <ul className="text-gray-600 text-sm leading-relaxed space-y-1 list-none">
            <li>📧 <a href="mailto:privacidad.fleksi@gmail.com" className="text-purple-600 font-semibold hover:underline">privacidad.fleksi@gmail.com</a></li>
            <li>📧 <a href="mailto:contacto.fleksi@gmail.com" className="text-purple-600 font-semibold hover:underline">contacto.fleksi@gmail.com</a></li>
            <li>📍 Responsable: Luis Fernando Nájera Mora · Irapuato, Guanajuato, México</li>
          </ul>
        </section>

        <p className="text-center text-xs text-gray-400 italic">
          Aviso de Privacidad Integral — Versión 1.0 — Junio 2026 — Fleksi
        </p>

      </div>
    </main>
  );
}