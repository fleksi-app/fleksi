export const COMISION_CLIENTE = 0.15;
export const COMISION_FLEKSER = 0.10;
export const COMISION_FLEKSER_REFERIDO = 0.075; // 7.5% primer trabajo con referido
export const BONO_REFERIDOR_PCT = 0.15; // 15% del valor del trabajo
export const BONO_REFERIDOR_TOPE = 200; // tope $200 MXN

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