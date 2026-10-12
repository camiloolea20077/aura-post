/**
 * Vacaciones (rediseño de nómina R7): en tiempo o en dinero; se pagan en la nómina
 * periódica del período como novedad.
 *
 * Backend: `NominaVacacionController` (/api/nomina/vacaciones).
 */

export type TipoVacacion = 'TIEMPO' | 'DINERO';
export type EstadoVacacion = 'REGISTRADA' | 'INTERRUMPIDA' | 'ANULADA';

export interface VacacionModel {
  id: number;
  contratoId: number;
  codigoVinculacion: string | null;
  empleadoId: number;
  empleadoNombre: string;
  empleadoDocumento: string;
  tipo: TipoVacacion;
  fechaInicio: string;
  fechaFin: string | null;
  fechaRegreso: string | null;
  /** TIEMPO: hábiles de disfrute; DINERO: días compensados. */
  diasHabiles: number;
  fechaRegresoAnticipado: string | null;
  diasNoDisfrutados: number;
  estado: EstadoVacacion;
  lote: string | null;
  observacion: string | null;
  createdAt: string | null;
}

/** Registrar vacaciones (fechas en yyyy-MM-dd). */
export interface RegistrarVacacionDto {
  contratoId: number;
  tipo: TipoVacacion;
  fechaInicio: string;
  fechaFin: string | null;
  dias: number | null;
  observacion: string | null;
}

/** Vacaciones colectivas en tiempo; sin vinculaciones = todas las activas. */
export interface VacacionesColectivasDto {
  contratoIds: number[];
  fechaInicio: string;
  fechaFin: string;
  observacion: string | null;
}

export interface ResultadoColectivasModel {
  registradas: number;
  lote: string;
  /** "Empleado: causa" de a quienes no se les pudo registrar. */
  omitidos: string[];
}

export const TEXTO_TIPO_VACACION: Record<TipoVacacion, string> = {
  TIEMPO: 'En tiempo',
  DINERO: 'En dinero',
};

export const TEXTO_ESTADO_VACACION: Record<EstadoVacacion, string> = {
  REGISTRADA: 'Registrada',
  INTERRUMPIDA: 'Regreso anticipado',
  ANULADA: 'Anulada',
};

export function severidadEstadoVacacion(e: EstadoVacacion): 'success' | 'info' | 'secondary' {
  if (e === 'REGISTRADA') return 'success';
  if (e === 'INTERRUMPIDA') return 'info';
  return 'secondary';
}
