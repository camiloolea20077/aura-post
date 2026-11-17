import { ConceptoModel } from '../../../../core/models/concepto.model';

/** Opción del select de conceptos de nómina. */
export interface OpcionConcepto {
  label: string;
  value: string;
}

/**
 * Conceptos vigentes como opciones "NÚMERO — Nombre", sin repetir concepto.
 * El valor sigue siendo la clave interna mientras la vinculación la guarde.
 */
export function opcionesConcepto(conceptos: ConceptoModel[]): OpcionConcepto[] {
  const vistos = new Set<string>();
  return conceptos
    .filter(
      (c) =>
        c.activo !== false && !vistos.has(c.codigo) && vistos.add(c.codigo),
    )
    .map((c) => ({ label: `${c.numero} — ${c.nombre}`, value: c.codigo }));
}

/** Color de la etiqueta de la clase del concepto. */
export function severidadClase(
  clase: string | null,
): 'success' | 'danger' | 'warn' | 'info' {
  switch (clase) {
    case 'DEVENGADO':
      return 'success';
    case 'DEDUCCION':
      return 'danger';
    case 'APORTE_EMPLEADOR':
      return 'warn';
    default:
      return 'info';
  }
}
