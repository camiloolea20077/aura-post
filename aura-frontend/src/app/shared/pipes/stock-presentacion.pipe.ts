import { Pipe, PipeTransform } from '@angular/core';

/**
 * Stock "como se cuenta": 28 und con Caja ×10 → "2 Cajas + 8 und". Solo
 * visual; el saldo sigue en unidad base. Sin presentación de contenido entero
 * (factor < 2) devuelve null y la pantalla muestra solo el número.
 *
 * Uso: {{ stock | stockPresentacion: 'Caja' : 10 : 'und' }}
 */
@Pipe({ name: 'stockPresentacion', standalone: true })
export class StockPresentacionPipe implements PipeTransform {
  transform(
    stock: number | null | undefined,
    presentacion: string | null | undefined,
    factor: number | null | undefined,
    unidad?: string | null,
  ): string | null {
    const f = Number(factor ?? 0);
    const s = Number(stock ?? 0);
    if (!presentacion || !Number.isInteger(f) || f < 2 || s <= 0 || s < f) return null;

    const completas = Math.floor(s / f);
    const sueltas = Math.round((s - completas * f) * 10000) / 10000;
    const nombre = completas === 1 ? presentacion : plural(presentacion);
    const und = unidad || 'und';
    return sueltas > 0 ? `${completas} ${nombre} + ${sueltas} ${und}` : `${completas} ${nombre}`;
  }
}

function plural(nombre: string): string {
  if (/[aeiouáéó]$/i.test(nombre)) return nombre + 's';
  if (/[^s]$/i.test(nombre)) return nombre + 'es';
  return nombre;
}
