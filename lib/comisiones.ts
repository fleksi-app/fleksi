export const COMISION_CLIENTE = 0.174; // 17.4% sobre el precio (incluye IVA)
export const COMISION_FLEKSER = 0.116; // 11.6% del precio (incluye IVA)
export const COMISION_FLEKSER_REFERIDO = 0.058; // 5.8% primer trabajo con referido (mitad de 11.6%)
export const BONO_REFERIDOR_PCT = 0.15;
export const BONO_REFERIDOR_TOPE = 200;

export function calcularPagoCliente(precio: number, seguro: boolean = false) {
  const comision = Math.round(precio * COMISION_CLIENTE);
  const seguroMonto = seguro ? 45 : 0;
  return {
    precio,
    comision,
    seguro: seguroMonto,
    total: precio + comision + seguroMonto,
  };
}

export function calcularPagoFlekser(precio: number, esReferido: boolean = false) {
  const pct = esReferido ? COMISION_FLEKSER_REFERIDO : COMISION_FLEKSER;
  const comision = Math.round(precio * pct);
  return {
    precio,
    comision,
    total: precio - comision,
    esReferido,
  };
}

export function calcularBonoReferidor(precio: number): number {
  const bono = Math.round(precio * BONO_REFERIDOR_PCT);
  return Math.min(bono, BONO_REFERIDOR_TOPE);
}

// Desglose IVA para declaración SAT
export function calcularIVA(precio: number) {
  const comisionNeta = Math.round(precio * 0.25); // 25% neto Fleksi
  const iva = Math.round(comisionNeta * 0.16); // 16% IVA sobre la comisión neta
  return {
    comisionNeta,
    iva,
    comisionBruta: comisionNeta + iva,
  };
}