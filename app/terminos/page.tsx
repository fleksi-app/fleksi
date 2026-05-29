export default function Terminos() {
  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 pt-12 pb-8">
        <div className="max-w-2xl mx-auto">
          <a href="/" className="text-white/70 text-sm hover:text-white transition">← Volver</a>
          <h1 className="text-white font-extrabold text-2xl mt-3">Términos y Condiciones</h1>
          <p className="text-white/70 text-sm mt-1">Última actualización: Mayo 2026</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-8">

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">1. Aceptación de los términos</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Al acceder y usar la plataforma Fleksi, aceptas estar sujeto a estos Términos y Condiciones. Si no estás de acuerdo con alguno de estos términos, no podrás usar los servicios de Fleksi. Fleksi es una plataforma tecnológica que conecta a personas que necesitan servicios ("Clientes") con personas que ofrecen sus servicios ("Fleksers").
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">2. Descripción del servicio</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Fleksi es una plataforma de intermediación que facilita la conexión entre Clientes y Fleksers. Fleksi no es empleador de los Fleksers ni presta directamente los servicios solicitados por los Clientes.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Los servicios disponibles incluyen, sin limitarse a: limpieza del hogar, jardinería, plomería, electricidad, mudanzas, eventos, cocina particular, chofer ejecutivo, entre otros.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">3. Registro y cuenta</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Para usar Fleksi debes registrarte con información veraz y actualizada. Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades que ocurran en tu cuenta.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Fleksi se reserva el derecho de suspender o cancelar cuentas que violen estos términos o que presenten información falsa.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">4. Pagos y comisiones</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Fleksi cobra una comisión del 10% sobre el valor de cada servicio completado. Los pagos se procesan de forma segura a través de Stripe. El dinero queda retenido por Fleksi hasta que el Cliente confirme que el trabajo fue completado satisfactoriamente.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            En caso de disputas, Fleksi actuará como mediador y podrá retener el pago hasta resolver el conflicto. Fleksi no se hace responsable por servicios no completados o realizados de forma insatisfactoria.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">5. Fleksi Protege</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            El seguro "Fleksi Protege" es un servicio opcional con un costo adicional de $45 MXN por servicio. Cubre daños accidentales ocasionados durante la prestación del servicio. La cobertura está sujeta a verificación y tiene un límite máximo de $5,000 MXN por incidente. No cubre daños intencionales, robo, o situaciones fuera del alcance del servicio contratado.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">6. Responsabilidades del Flekser</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-2">El Flekser se compromete a:</p>
          <ul className="text-gray-600 text-sm leading-relaxed space-y-1 list-none">
            <li>✓ Proporcionar información veraz sobre sus habilidades y experiencia</li>
            <li>✓ Presentarse puntualmente en el lugar y hora acordados</li>
            <li>✓ Realizar el trabajo con profesionalismo y calidad</li>
            <li>✓ Tratar con respeto a los Clientes y sus propiedades</li>
            <li>✓ No solicitar pagos fuera de la plataforma</li>
            <li>✓ Cumplir con todas las leyes y regulaciones aplicables</li>
          </ul>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">7. Responsabilidades del Cliente</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-2">El Cliente se compromete a:</p>
          <ul className="text-gray-600 text-sm leading-relaxed space-y-1 list-none">
            <li>✓ Proporcionar información clara y completa sobre el servicio requerido</li>
            <li>✓ Garantizar un ambiente seguro para el Flekser</li>
            <li>✓ Confirmar o disputar el trabajo dentro de 24 horas de completado</li>
            <li>✓ No solicitar servicios fuera de la plataforma al mismo Flekser</li>
            <li>✓ Pagar el precio acordado a través de la plataforma</li>
          </ul>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">8. Cancelaciones y reembolsos</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            El Cliente puede cancelar una solicitud sin costo hasta 2 horas antes del inicio del servicio. Cancelaciones con menos de 2 horas de anticipación pueden generar un cargo del 20% del valor del servicio como compensación al Flekser.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Los reembolsos se procesan en un plazo de 5 a 10 días hábiles dependiendo del banco emisor de la tarjeta.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">9. Conducta prohibida</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-2">Está estrictamente prohibido:</p>
          <ul className="text-gray-600 text-sm leading-relaxed space-y-1 list-none">
            <li>✕ Usar la plataforma para actividades ilegales</li>
            <li>✕ Acosar, amenazar o discriminar a otros usuarios</li>
            <li>✕ Publicar información falsa o engañosa</li>
            <li>✕ Eludir el sistema de pagos de Fleksi</li>
            <li>✕ Crear múltiples cuentas para evadir suspensiones</li>
            <li>✕ Usar bots o automatizaciones no autorizadas</li>
          </ul>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">10. Modificaciones</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Fleksi se reserva el derecho de modificar estos términos en cualquier momento. Los usuarios serán notificados de cambios significativos a través de la aplicación o por correo electrónico. El uso continuado de la plataforma después de dichos cambios constituye la aceptación de los nuevos términos.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">11. Ley aplicable</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier disputa será resuelta ante los tribunales competentes de la Ciudad de México, México.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">12. Contacto</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Para cualquier pregunta sobre estos términos, contáctanos en <span className="text-purple-600 font-semibold">soporte@fleksi.app</span> o a través del chat de soporte dentro de la aplicación.
          </p>
        </section>

      </div>
    </main>
  );
}