import { ConceptoModel } from '../../../core/models/concepto.model';

/** Color de la etiqueta de la clase del concepto. */
export function severidadClase(
  clase: string | null,
): 'success' | 'danger' | 'warn' | 'info' | 'secondary' {
  switch (clase) {
    case 'DEVENGADO':
      return 'success';
    case 'DEDUCCION':
      return 'danger';
    case 'APORTE_EMPLEADOR':
      return 'warn';
    case 'NO_IMPUTABLE':
      return 'secondary';
    default:
      return 'info';
  }
}

/** Cómo se calcula el concepto en una línea: porcentaje, valor fijo, motor o novedad. */
export function textoCalculo(
  c: Pick<ConceptoModel, 'base' | 'porcentaje' | 'valorFijo'>,
): string {
  if (c.base === 'FIJO') {
    return c.valorFijo != null
      ? c.valorFijo.toLocaleString('es-CO', {
          style: 'currency',
          currency: 'COP',
          maximumFractionDigits: 0,
        })
      : '—';
  }
  if (c.base === 'MANUAL') return 'Lo calcula el sistema';
  if (c.base === 'NOVEDAD') return 'Por novedad';
  if (c.base === 'FORMULA') return 'Fórmula';
  return c.porcentaje != null ? `${c.porcentaje} %` : '—';
}
