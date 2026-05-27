export const COMISION_CLIENTE = 0.15; // 15% sobre el precio
export const COMISION_FLEKSER = 0.10; // 10% del precio

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

export function calcularPagoFlekser(precio: number) {
  const comision = Math.round(precio * COMISION_FLEKSER);
  return {
    precio,
    comision,
    total: precio - comision,
  };
}