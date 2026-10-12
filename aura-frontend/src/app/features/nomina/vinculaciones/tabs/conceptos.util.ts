import { ConceptoModel } from '../../../../core/models/concepto.model';

/** Opción del select de conceptos de nómina. */
export interface OpcionConcepto {
  label: string;
  value: string;
}

/** Conceptos vigentes como opciones "CÓDIGO — Nombre", sin repetir código. */
export function opcionesConcepto(conceptos: ConceptoModel[]): OpcionConcepto[] {
  const vistos = new Set<string>();
  return conceptos
    .filter((c) => c.activo !== false && !vistos.has(c.codigo) && vistos.add(c.codigo))
    .map((c) => ({ label: `${c.codigo} — ${c.nombre}`, value: c.codigo }));
}

/** Color de la etiqueta de la clase del concepto. */
export function severidadClase(clase: string | null): 'success' | 'danger' | 'warn' | 'info' {
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
