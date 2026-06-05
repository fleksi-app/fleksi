export default function Terminos() {
  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 pt-12 pb-8">
        <div className="max-w-2xl mx-auto">
          <a href="/" className="text-white/70 text-sm hover:text-white transition">← Volver</a>
          <h1 className="text-white font-extrabold text-2xl mt-3">Términos y Condiciones de Uso</h1>
          <p className="text-white/70 text-sm mt-1">Versión 1.0 — Junio 2026</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-6">

        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <p className="text-sm text-yellow-800 font-semibold">⚠️ Documento en revisión legal. Pendiente de validación por abogado certificado.</p>
        </div>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">PREÁMBULO</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Los presentes Términos y Condiciones de Uso regulan el acceso y uso de la aplicación móvil y plataforma web denominada FLEKSI, operada por Luis Fernando Nájera Mora, persona física con actividad empresarial, con RFC NAML870430TS2, con domicilio en Calle Nogal 1469 Interior 102, Colonia Jardines de Irapuato, Irapuato, Guanajuato, C.P. 36660, México.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Al descargar, instalar, acceder o utilizar la Plataforma, el Usuario declara haber leído, entendido y aceptado en su totalidad los presentes Términos.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">1. Naturaleza de la plataforma</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Fleksi es una plataforma tecnológica de intermediación cuya función exclusiva es conectar digitalmente a personas que ofrecen servicios (Fleksers) con personas que los necesitan (Clientes y Empresas). El Operador no es parte en los contratos de prestación de servicios que se celebren entre Fleksers y Clientes.
          </p>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-sm font-bold text-blue-800 mb-1">⚡ Independencia de los Fleksers</p>
            <p className="text-sm text-blue-700">Los Fleksers son prestadores de servicios independientes y autónomos. La relación entre el Operador y los Fleksers no constituye, bajo ningún concepto, una relación laboral, de sociedad, de agencia ni de cualquier otra naturaleza que genere dependencia económica o subordinación, conforme a la Ley Federal del Trabajo.</p>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">2. Registro y cuenta</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-2">Para usar Fleksi debes registrarte. Al hacerlo, declaras que:</p>
          <ul className="text-gray-600 text-sm leading-relaxed space-y-1 list-none">
            <li>✓ Eres mayor de 18 años</li>
            <li>✓ La información proporcionada es veraz, completa y actualizada</li>
            <li>✓ No has sido suspendido previamente de la Plataforma</li>
            <li>✓ Tienes capacidad legal para celebrar contratos conforme a la legislación mexicana</li>
          </ul>
          <p className="text-gray-600 text-sm leading-relaxed mt-3">
            Eres responsable de mantener la confidencialidad de tus credenciales. Fleksi se reserva el derecho de suspender o cancelar cuentas que violen estos términos o presenten información falsa.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">3. Pagos y comisiones</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Los pagos se procesan de forma segura a través de Stripe. El dinero queda retenido hasta que el Cliente confirme que el trabajo fue completado satisfactoriamente. En caso de no confirmación en 24 horas, el pago se libera automáticamente al Flekser.
          </p>
          <div className="flex flex-col gap-3 mb-4">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="text-sm font-extrabold text-blue-800 mb-1">💳 Comisión al Cliente</p>
              <p className="text-sm text-blue-700">Se cobra un <span className="font-bold">15%</span> adicional sobre el precio acordado del servicio.</p>
              <p className="text-xs text-blue-500 mt-1">Ejemplo: servicio de $500 MXN → el cliente paga $575 MXN</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <p className="text-sm font-extrabold text-purple-800 mb-1">⚡ Comisión al Flekser</p>
              <p className="text-sm text-purple-700">Se descuenta un <span className="font-bold">10%</span> del precio acordado al momento de liberar el pago.</p>
              <p className="text-xs text-purple-500 mt-1">Ejemplo: servicio de $500 MXN → el flekser recibe $450 MXN</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            En caso de disputas, Fleksi actuará como mediador y podrá retener el pago hasta resolver el conflicto en un plazo máximo de 5 días hábiles.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">4. Cancelaciones y penalizaciones</h2>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-extrabold text-gray-900 mb-2">📅 Cancelación por el Cliente</p>
              <ul className="text-gray-600 text-sm leading-relaxed space-y-2 list-none">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 flex-shrink-0">✓</span>
                  <span><span className="font-semibold">Más de 2 horas antes:</span> Cancelación gratuita. Reembolso total.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 flex-shrink-0">✕</span>
                  <span><span className="font-semibold">Menos de 2 horas antes:</span> Se cobra el 20% del valor del servicio como compensación al Flekser por su tiempo.</span>
                </li>
              </ul>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-extrabold text-gray-900 mb-2">⚡ Cancelación por el Flekser</p>
              <ul className="text-gray-600 text-sm leading-relaxed space-y-2 list-none">
                <li className="flex items-start gap-2"><span className="text-yellow-500 flex-shrink-0">⚠️</span><span><span className="font-semibold">Primera cancelación:</span> Advertencia en el perfil y reducción temporal en visibilidad.</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-500 flex-shrink-0">⚠️</span><span><span className="font-semibold">Segunda cancelación:</span> Penalización de 0.5 puntos en calificación y suspensión de 48 horas.</span></li>
                <li className="flex items-start gap-2"><span className="text-red-500 flex-shrink-0">✕</span><span><span className="font-semibold">Tercera cancelación:</span> Suspensión de cuenta por 30 días. El Cliente recibe reembolso total.</span></li>
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">5. Obligaciones del Flekser</h2>
          <ul className="text-gray-600 text-sm leading-relaxed space-y-1 list-none">
            <li>✓ Proporcionar información veraz sobre sus habilidades y experiencia</li>
            <li>✓ Presentarse puntualmente en el lugar y hora acordados</li>
            <li>✓ Realizar el trabajo con profesionalismo y calidad</li>
            <li>✓ Tratar con respeto a los Clientes y sus propiedades</li>
            <li>✓ No solicitar pagos fuera de la plataforma</li>
            <li>✓ Cumplir con sus propias obligaciones fiscales como prestador independiente</li>
            <li>✓ No establecer relación de exclusividad con la plataforma</li>
          </ul>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">6. Obligaciones del Cliente y Empresa</h2>
          <ul className="text-gray-600 text-sm leading-relaxed space-y-1 list-none">
            <li>✓ Proporcionar información clara y completa sobre el servicio requerido</li>
            <li>✓ Garantizar un ambiente seguro para el Flekser</li>
            <li>✓ Confirmar o disputar el trabajo dentro de 24 horas de completado</li>
            <li>✓ No solicitar servicios fuera de la plataforma al mismo Flekser</li>
            <li>✓ Pagar el precio acordado a través de la plataforma</li>
          </ul>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">7. Conducta prohibida</h2>
          <ul className="text-gray-600 text-sm leading-relaxed space-y-1 list-none">
            <li>✕ Usar la plataforma para actividades ilegales</li>
            <li>✕ Acosar, amenazar o discriminar a otros usuarios</li>
            <li>✕ Publicar información falsa o engañosa</li>
            <li>✕ Eludir el sistema de pagos de Fleksi</li>
            <li>✕ Crear múltiples cuentas para evadir suspensiones</li>
            <li>✕ Compartir datos de contacto en el chat con fines de evasión de la plataforma</li>
          </ul>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">8. Limitación de responsabilidad</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            El Operador no es responsable por la calidad, idoneidad, legalidad, seguridad o cualquier aspecto de los servicios prestados por los Fleksers. La responsabilidad por la ejecución del servicio recae exclusivamente en el Flekser y en el Cliente que lo contrata.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            En ningún caso el Operador será responsable por daños indirectos, incidentales, especiales o consecuentes derivados del uso de la Plataforma. La responsabilidad máxima del Operador no podrá exceder el monto de las comisiones pagadas durante los 3 meses anteriores al evento reclamado.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">9. Propiedad intelectual</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            La Plataforma, incluyendo su diseño, código fuente, logotipos, marcas, interfaces y demás elementos, son propiedad exclusiva del Operador y están protegidos por la Ley Federal del Derecho de Autor y la Ley de Propiedad Industrial. Queda prohibida su reproducción sin autorización expresa por escrito.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">10. Modificaciones</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Fleksi se reserva el derecho de modificar estos términos con al menos 15 días naturales de anticipación. Los usuarios serán notificados a través de la aplicación o por correo electrónico. El uso continuado de la plataforma constituye la aceptación de los nuevos términos.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">11. Legislación aplicable y jurisdicción</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Para la interpretación y cumplimiento de los presentes Términos, las partes se someten expresamente a la jurisdicción y competencia de los tribunales competentes de la ciudad de Irapuato, Guanajuato, México, renunciando a cualquier otro fuero que pudiera corresponderles.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">12. Contacto</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Para cualquier duda sobre estos términos contáctanos en{' '}
            <a href="mailto:soporte.fleksi@gmail.com" className="text-purple-600 font-semibold hover:underline">soporte.fleksi@gmail.com</a>
            {' '}o{' '}
            <a href="mailto:contacto.fleksi@gmail.com" className="text-purple-600 font-semibold hover:underline">contacto.fleksi@gmail.com</a>.
          </p>
        </section>

      </div>
    </main>
  );
}