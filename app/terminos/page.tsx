export default function Terminos() {
  return (
    <main className="min-h-screen pb-16" style={{background: '#F8FAFC'}}>
      <div className="bg-white px-6 pt-12 pb-6 shadow-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto">
          <a href="/" className="text-gray-400 text-sm hover:text-gray-600 transition">← Volver</a>
          <h1 className="font-extrabold text-gray-900 text-2xl mt-3">Términos y Condiciones de Uso</h1>
          <p className="text-gray-400 text-sm mt-1">Versión 2.0 — Junio 2026</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-6">

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">1. Quiénes somos</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            FLEKSI es una plataforma digital de intermediación operada por Luis Fernando Nájera Mora, persona física con actividad empresarial, RFC NAML870430TS2, con domicilio en Calle Nogal 1469 Interior 102, Colonia Jardines de Irapuato, Irapuato, Guanajuato, C.P. 36660, México (en adelante "Fleksi", "la Plataforma" o "el Operador").
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Fleksi actúa exclusivamente como intermediario tecnológico que conecta a personas que requieren servicios (en adelante "Clientes") con personas independientes que ofrecen sus servicios (en adelante "Fleksers"). Fleksi no es empleador, contratante, agencia de colocación, ni parte en ningún contrato de prestación de servicios entre Clientes y Fleksers.
          </p>
        </section>

        <section className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
          <h2 className="font-extrabold text-amber-900 text-lg mb-3">⚠️ Naturaleza jurídica — Punto fundamental</h2>
          <div className="flex flex-col gap-3 text-sm text-amber-800 leading-relaxed">
            <p><span className="font-bold">Fleksi NO es un empleador.</span> No existe relación laboral, de subordinación, ni vínculo jurídico de trabajo entre Fleksi y los Fleksers. Los Fleksers son trabajadores independientes que prestan servicios por cuenta propia.</p>
            <p><span className="font-bold">Fleksi NO es parte del contrato de servicio.</span> El contrato de prestación de servicios se celebra exclusivamente entre el Cliente y el Flekser. Fleksi únicamente facilita el encuentro entre ambas partes a través de su plataforma tecnológica.</p>
            <p><span className="font-bold">Fleksi NO es responsable de la calidad del servicio.</span> La ejecución, calidad, puntualidad y resultado del servicio es responsabilidad exclusiva del Flekser contratado.</p>
            <p><span className="font-bold">Fleksi NO garantiza disponibilidad de Fleksers.</span> La plataforma muestra perfiles disponibles, pero no garantiza que se encontrará un proveedor para cada solicitud.</p>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-4">2. Comisiones y pagos</h2>
          <div className="flex flex-col gap-3 text-sm text-gray-600 leading-relaxed">
            <p>Fleksi cobra una comisión por el uso de la plataforma de intermediación. Esta comisión se estructura de la siguiente manera:</p>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-700">Comisión al Cliente (cargo adicional)</span>
                <span className="font-extrabold text-purple-700">15%</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-700">Comisión al Flekser (retención)</span>
                <span className="font-extrabold text-purple-700">10%</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="font-bold text-gray-900">Margen total de la plataforma</span>
                <span className="font-extrabold text-purple-700">25%</span>
              </div>
            </div>
            <p>Ejemplo: si el Flekser cobra $100 MXN por su servicio, el Cliente paga $115 MXN (precio + 15% de comisión de plataforma), y el Flekser recibe $90 MXN (precio menos 10% de comisión de plataforma). Fleksi retiene $25 MXN como contraprestación por los servicios de intermediación.</p>
            <p>Todos los pagos se procesan a través de pasarelas de pago autorizadas. Fleksi no almacena datos de tarjetas de crédito o débito.</p>
            <p>Los pagos al Flekser se liberan automáticamente 24 horas después de que el Cliente confirme la finalización del servicio, o bien cuando el sistema lo detecte como completado. En caso de disputa, el pago puede retenerse hasta su resolución.</p>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-4">3. Obligaciones del Flekser</h2>
          <div className="flex flex-col gap-2 text-sm text-gray-600 leading-relaxed">
            {[
              'Ser persona física mayor de 18 años con capacidad legal para contratar.',
              'Proporcionar información verídica y documentación válida durante el proceso de registro y verificación.',
              'Cumplir con las leyes fiscales aplicables, incluyendo el pago de impuestos sobre sus ingresos como trabajador independiente.',
              'No tiene relación laboral con Fleksi; es responsable de su propia seguridad social, IMSS u otras coberturas.',
              'Prestar el servicio con profesionalismo, puntualidad y calidad.',
              'No compartir datos de contacto (teléfono, WhatsApp, correo) con Clientes fuera de la plataforma para evadir el pago de comisiones.',
              'Reportar cualquier incidente, accidente o problema ocurrido durante la prestación del servicio.',
              'Mantener actualizado su perfil, habilidades y disponibilidad.',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-white" style={{background: '#7B2FE0'}}>{i+1}</div>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-4">4. Obligaciones del Cliente</h2>
          <div className="flex flex-col gap-2 text-sm text-gray-600 leading-relaxed">
            {[
              'Ser persona física mayor de 18 años o persona moral legalmente constituida.',
              'Describir con exactitud el servicio requerido, fecha, lugar y condiciones.',
              'Proporcionar un ambiente seguro al Flekser durante la prestación del servicio.',
              'Pagar el monto acordado a través de la plataforma, incluyendo la comisión de Fleksi.',
              'No solicitar datos de contacto del Flekser fuera de la plataforma con el fin de evadir comisiones.',
              'Confirmar la finalización del servicio dentro de las 24 horas posteriores a su conclusión.',
              'Calificar honestamente al Flekser una vez concluido el servicio.',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-white" style={{background: '#7B2FE0'}}>{i+1}</div>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-4">5. Limitación de responsabilidad</h2>
          <div className="flex flex-col gap-3 text-sm text-gray-600 leading-relaxed">
            <p>Fleksi no será responsable por:</p>
            <ul className="flex flex-col gap-2 ml-4">
              {[
                'Daños materiales o personales ocurridos durante la prestación del servicio.',
                'Incumplimiento del Flekser en cuanto a calidad, tiempo o forma del servicio.',
                'Pérdida de datos, información o contenido dentro de la plataforma por causas ajenas a Fleksi.',
                'Interrupciones del servicio por mantenimiento, fallas técnicas o causas de fuerza mayor.',
                'Disputas entre Clientes y Fleksers derivadas de la prestación del servicio.',
                'El comportamiento, antecedentes o conducta de los usuarios fuera de la plataforma.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold flex-shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p>La responsabilidad total de Fleksi frente a cualquier usuario, por cualquier concepto, no excederá el monto de las comisiones cobradas en la transacción objeto de la disputa.</p>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-4">6. Disputas y reembolsos</h2>
          <div className="flex flex-col gap-3 text-sm text-gray-600 leading-relaxed">
            <p>En caso de disputa entre Cliente y Flekser, cualquiera de las partes puede abrir una disputa dentro de las 24 horas posteriores a la fecha del servicio. Fleksi actuará como intermediario imparcial para intentar llegar a una resolución, pero sin obligación de dictar un laudo vinculante.</p>
            <p>Las comisiones cobradas por Fleksi no son reembolsables, salvo en caso de error técnico comprobable imputable directamente a la plataforma.</p>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-4">7. Propiedad intelectual</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            El nombre "Fleksi", su logotipo, diseño, código fuente y todos los elementos visuales y funcionales de la plataforma son propiedad exclusiva del Operador. Queda prohibida su reproducción, distribución o uso sin autorización escrita.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-4">8. Terminación de cuenta</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            Fleksi se reserva el derecho de suspender o cancelar cuentas de usuarios que violen estos términos, proporcionen información falsa, cometan fraude, o generen disputas reiteradas sin fundamento. Los saldos pendientes en wallet serán reembolsados previo a la cancelación definitiva, salvo que existan disputas en proceso.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-4">9. Jurisdicción y legislación aplicable</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Estos Términos se rigen por las leyes de los Estados Unidos Mexicanos, en particular por el Código de Comercio, la Ley Federal de Protección al Consumidor, la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, y las demás disposiciones aplicables. Para cualquier controversia, las partes se someten expresamente a la jurisdicción de los tribunales competentes de la ciudad de Irapuato, Guanajuato, México, renunciando a cualquier otro fuero que pudiera corresponderles.
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-extrabold text-gray-900 text-lg mb-3">10. Contacto</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Para dudas, aclaraciones o ejercicio de derechos: <span className="font-semibold text-gray-900">soporte@fleksiapp.com</span>
          </p>
        </section>

        <p className="text-xs text-gray-400 text-center">Al usar Fleksi, aceptas estos términos en su totalidad. Última actualización: junio 2026.</p>

      </div>
    </main>
  );
}