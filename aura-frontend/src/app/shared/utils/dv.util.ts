/**
 * Dígito de verificación de la DIAN para un NIT o número de documento.
 * Aplica a persona jurídica y a persona natural (la DIAN lo calcula igual).
 * Devuelve null si el número no es solo dígitos.
 */
export function calcularDv(numero: string | null | undefined): string | null {
  const n = (numero ?? '').replace(/[\s.-]/g, '');
  if (!/^\d+$/.test(n) || n.length > 15) return null;
  const pesos = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  let suma = 0;
  for (let i = 0; i < n.length; i++) {
    suma += Number(n[n.length - 1 - i]) * pesos[i];
  }
  const r = suma % 11;
  return String(r > 1 ? 11 - r : r);
}
