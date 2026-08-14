/**
 * Proceso asíncrono de nómina (Fase 7 / backend `ProcesoNominaController`).
 *
 * Al liquidar un período completo el backend ya no responde síncrono: devuelve
 * este proceso en PENDIENTE y el front hace polling a `GET /api/proceso/{id}`.
 */

export type EstadoProceso =
  | 'PENDIENTE'
  | 'EN_PROCESO'
  | 'COMPLETADO'
  /** El lote terminó pero algunos items fallaron. NO es un fallo del proceso. */
  | 'COMPLETADO_CON_ERRORES'
  | 'FALLIDO'
  | 'REVERSADO';

/** Un item que no se pudo liquidar; el resto del lote sí siguió. */
export interface ProcesoError {
  referencia: string;
  error: string;
}

export interface ProcesoModel {
  id: number;
  tipo: string;
  estado: EstadoProceso;
  /** 0-100. */
  progreso: number;
  mensaje: string | null;
  totalItems: number;
  itemsOk: number;
  itemsError: number;
  iniciadoAt: string | null;
  finalizadoAt: string | null;
  errores: ProcesoError[];
}

/** Estados en los que el proceso ya no cambia: el polling debe detenerse. */
export const ESTADOS_TERMINALES: EstadoProceso[] = [
  'COMPLETADO',
  'COMPLETADO_CON_ERRORES',
  'FALLIDO',
  'REVERSADO',
];

export function esTerminal(estado: EstadoProceso): boolean {
  return ESTADOS_TERMINALES.includes(estado);
}
