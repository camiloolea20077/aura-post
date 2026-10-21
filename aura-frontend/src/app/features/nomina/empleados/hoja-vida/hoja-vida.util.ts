import { Familiar } from '../../../../core/models/empleado-hoja-vida.model';
import { aDate } from '../../../../shared/utils/fecha.util';

/** Edad cumplida a hoy a partir de 'YYYY-MM-DD' (null si no hay fecha). */
export function edadEnAnios(fecha: string | null): number | null {
  const nac = aDate(fecha);
  if (!nac) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const cumplio =
    hoy.getMonth() > nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() >= nac.getDate());
  if (!cumplio) edad--;
  return edad;
}

/** Marcas visibles del familiar en la tabla (convive, beneficiarios, emergencia). */
export function etiquetasFamiliar(f: Familiar): string[] {
  const e: string[] = [];
  if (f.convive) e.push('Convive');
  if (f.dependeEconomicamente) e.push('Dependiente');
  if (f.beneficiarioCaja) e.push('Benef. caja');
  if (f.beneficiarioSalud) e.push('Benef. EPS');
  if (f.contactoEmergencia) e.push('Emergencia');
  return e;
}

/** Tiempo entre dos fechas como "2 años 3 meses" (hasta hoy si no hay fin). */
export function duracion(inicio: string, fin: string | null): string {
  const a = aDate(inicio);
  const b = aDate(fin) ?? new Date();
  if (!a) return '';
  let meses = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (b.getDate() < a.getDate()) meses--;
  meses = Math.max(0, meses);
  const anios = Math.floor(meses / 12);
  const resto = meses % 12;
  const partes = [];
  if (anios) partes.push(`${anios} año${anios === 1 ? '' : 's'}`);
  if (resto || !anios) partes.push(`${resto} mes${resto === 1 ? '' : 'es'}`);
  return partes.join(' ');
}
