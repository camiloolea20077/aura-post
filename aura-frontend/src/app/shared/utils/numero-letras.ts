/**
 * Valor en letras para recibos y comprobantes:
 * 1250500 → "UN MILLÓN DOSCIENTOS CINCUENTA MIL QUINIENTOS PESOS M/CTE".
 */
const UNIDADES = [
  '', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
  'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE',
  'VEINTE', 'VEINTIUNO', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISÉIS',
  'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE',
];
const DECENAS = ['', '', '', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
const CENTENAS = [
  '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS',
  'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS',
];

/** 0..999 */
function centenas(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'CIEN';
  const c = Math.floor(n / 100);
  const r = n % 100;
  let txt = CENTENAS[c];
  if (r > 0) {
    let dec: string;
    if (r < 30) dec = UNIDADES[r];
    else {
      const d = Math.floor(r / 10);
      const u = r % 10;
      dec = DECENAS[d] + (u ? ' Y ' + UNIDADES[u] : '');
    }
    txt = (txt ? txt + ' ' : '') + dec;
  }
  return txt;
}

/** "UNO" se apocopa a "UN" delante de MIL / MILLÓN. */
function apocope(txt: string): string {
  return txt.replace(/VEINTIUNO$/, 'VEINTIÚN').replace(/UNO$/, 'UN');
}

function enteroALetras(n: number): string {
  if (n === 0) return 'CERO';
  const millones = Math.floor(n / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;
  const partes: string[] = [];
  if (millones > 0) {
    partes.push(millones === 1 ? 'UN MILLÓN' : `${apocope(enteroALetras(millones))} MILLONES`);
  }
  if (miles > 0) {
    partes.push(miles === 1 ? 'MIL' : `${apocope(centenas(miles))} MIL`);
  }
  if (resto > 0) partes.push(centenas(resto));
  return partes.join(' ');
}

export function pesosEnLetras(valor: number): string {
  const v = Math.abs(Number(valor) || 0);
  const entero = Math.floor(v);
  const centavos = Math.round((v - entero) * 100);
  let txt = enteroALetras(entero);
  // "UN MILLÓN DE PESOS", "DOS MILLONES DE PESOS"
  if (entero > 0 && entero % 1_000_000 === 0) txt += ' DE';
  txt += ' PESOS';
  if (centavos > 0) txt += ` CON ${enteroALetras(centavos)} CENTAVOS`;
  return `${txt} M/CTE`;
}
