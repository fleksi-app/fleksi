export const PORCENTAJE_PENALIZACION = 0.15; // 15% del precio del servicio

export type EvaluacionCancelacion = {
  aplicaPenalizacion: boolean;
  motivo: string; // explicación legible para mostrar al usuario
  horasRestantes: number | null; // null si no se pudo calcular (sin fecha)
};

/**
 * Evalúa si cancelar un servicio (que ya tiene un Flekser aceptado)
 * debe llevar penalización, según fecha y hora del servicio.
 *
 * Reglas:
 * - Si faltan 24 horas o más para el servicio: SIN penalización.
 * - Si faltan menos de 24 horas:
 *    - Si el servicio es HOY y faltan 3 horas o más para la hora: SIN penalización.
 *    - En cualquier otro caso (menos de 24h y no cumple lo anterior): CON penalización.
 */
export function evaluarCancelacion(fecha: string | null | undefined, hora: string | null | undefined): EvaluacionCancelacion {
  if (!fecha) {
    // Sin fecha definida, no podemos evaluar tiempos: no se penaliza por defecto.
    return { aplicaPenalizacion: false, motivo: 'Esta solicitud no tiene fecha definida.', horasRestantes: null };
  }

  const ahora = new Date();
  // Si no hay hora, asumimos el inicio del día para ser conservadores con el cálculo de "24 horas".
  const fechaHoraServicio = new Date(`${fecha}T${hora || '00:00'}:00`);

  if (isNaN(fechaHoraServicio.getTime())) {
    return { aplicaPenalizacion: false, motivo: 'No se pudo calcular la fecha del servicio.', horasRestantes: null };
  }

  const horasRestantes = (fechaHoraServicio.getTime() - ahora.getTime()) / (1000 * 60 * 60);

  const hoyStr = ahora.toISOString().split('T')[0];
  const esHoy = fecha === hoyStr;

  if (horasRestantes >= 24) {
    return {
      aplicaPenalizacion: false,
      motivo: 'Faltan 24 horas o más para el servicio, puedes cancelar sin penalización.',
      horasRestantes,
    };
  }

  if (esHoy && horasRestantes >= 3) {
    return {
      aplicaPenalizacion: false,
      motivo: 'El servicio es hoy pero faltan 3 horas o más, puedes cancelar sin penalización.',
      horasRestantes,
    };
  }

  return {
    aplicaPenalizacion: true,
    motivo: esHoy
      ? 'El servicio es hoy y faltan menos de 3 horas. Aplica penalización por cancelación.'
      : 'Faltan menos de 24 horas para el servicio. Aplica penalización por cancelación.',
    horasRestantes,
  };
}

export function calcularPenalizacion(precio: number): number {
  return Math.round(precio * PORCENTAJE_PENALIZACION);
}