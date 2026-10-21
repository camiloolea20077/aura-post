/**
 * Retiros de vinculaciones (rediseño de nómina R5).
 *
 * Backend: `NominaRetiroController` (/api/nomina/retiros).
 */

export type EstadoRetiro = 'PENDIENTE' | 'EN_LIQUIDACION' | 'LIQUIDADO' | 'PAGADO' | 'ANULADO';

export interface RetiroModel {
  id: number;
  contratoId: number;
  codigoVinculacion: string | null;
  empleadoId: number;
  empleadoNombre: string;
  empleadoDocumento: string;
  cargo: string | null;
  tipoContrato: string;
  fechaInicio: string;
  fechaRetiro: string;
  motivoId: number;
  motivo: string;
  indemniza: boolean;
  fechaFinPactada: string | null;
  cesantiasCorteHasta: string | null;
  observacion: string | null;
  estado: EstadoRetiro;
  documentoId: number | null;
  documentoNumero: string | null;
  nominaId: number | null;
  nominaNumero: string | null;
  createdAt: string | null;
}

/** Registrar un retiro (fechas en yyyy-MM-dd). */
export interface RegistrarRetiroDto {
  contratoId: number;
  fechaRetiro: string;
  motivoId: number;
  cesantiasCorteHasta: string | null;
  observacion: string | null;
}

export const TEXTO_ESTADO_RETIRO: Record<EstadoRetiro, string> = {
  PENDIENTE: 'Pendiente de liquidar',
  EN_LIQUIDACION: 'En liquidación',
  LIQUIDADO: 'Liquidado',
  PAGADO: 'Pagado',
  ANULADO: 'Anulado',
};

export function severidadEstadoRetiro(e: EstadoRetiro): 'warn' | 'info' | 'success' | 'secondary' {
  if (e === 'PENDIENTE') return 'warn';
  if (e === 'EN_LIQUIDACION') return 'info';
  if (e === 'ANULADO') return 'secondary';
  return 'success';
}
