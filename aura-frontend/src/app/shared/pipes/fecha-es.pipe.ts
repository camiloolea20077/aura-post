import { Pipe, PipeTransform } from '@angular/core';

import { aDate } from '../utils/fecha.util';
import { capitalizar, MESES, MESES_CORTOS } from '../utils/meses-es';

export type FormatoFechaEs = 'corta' | 'larga' | 'mes' | 'fechaHora';

/**
 * Fecha con el mes en español, sin depender del idioma del navegador.
 *
 *   {{ '2026-09-21' | fechaEs }}               → 21 sep 2026
 *   {{ '2026-09-21' | fechaEs: 'larga' }}      → 21 de septiembre de 2026
 *   {{ '2026-09-21' | fechaEs: 'mes' }}        → Septiembre 2026
 *   {{ '2026-09-21 14:05:00' | fechaEs: 'fechaHora' }} → 21 sep 2026, 2:05 p. m.
 *
 * Un 'YYYY-MM-DD' se lee como fecha LOCAL: `new Date('2026-09-21')` lo toma
 * como UTC y en Colombia pintaría el 20.
 */
@Pipe({
  name: 'fechaEs',
  standalone: true,
})
export class FechaEsPipe implements PipeTransform {
  transform(value: string | Date | null | undefined, formato: FormatoFechaEs = 'corta'): string {
    const d = leer(value);
    if (!d) return '';

    const dia = d.getDate();
    const mes = d.getMonth();
    const anio = d.getFullYear();

    switch (formato) {
      case 'larga':
        return `${dia} de ${MESES[mes]} de ${anio}`;
      case 'mes':
        return `${capitalizar(MESES[mes])} ${anio}`;
      case 'fechaHora': {
        const h = d.getHours();
        const min = String(d.getMinutes()).padStart(2, '0');
        const h12 = h % 12 === 0 ? 12 : h % 12;
        return `${dia} ${MESES_CORTOS[mes]} ${anio}, ${h12}:${min} ${h < 12 ? 'a. m.' : 'p. m.'}`;
      }
      default:
        return `${dia} ${MESES_CORTOS[mes]} ${anio}`;
    }
  }
}

function leer(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  const s = value.trim();
  // Solo fecha: constructor local para no correr el día.
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return aDate(s);
  // Fecha y hora sin zona ('2026-09-21 14:05:00' o con 'T'): se toma tal cual,
  // como hora local. Se recortan los microsegundos que manda PostgreSQL.
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (m) {
    return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0));
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
