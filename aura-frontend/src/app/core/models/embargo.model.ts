/**
 * Embargos sobre el salario (V113 / backend `EmbargoController`).
 *
 * La prelación y los límites los aplica el motor al liquidar. El monto es "o
 * valor total o porcentaje", nunca ambos (hay CHECK en BD).
 */

export type TipoEmbargo = 'ALIMENTOS' | 'COOPERATIVA' | 'JUDICIAL_ORDINARIO' | 'FISCAL';
export type EstadoEmbargo = 'ACTIVO' | 'SUSPENDIDO' | 'TERMINADO';

export const TIPOS_EMBARGO: { value: TipoEmbargo; label: string; hint: string }[] = [
  { value: 'ALIMENTOS', label: 'Alimentos', hint: 'Prelación absoluta. Hasta el 50% del salario' },
  { value: 'COOPERATIVA', label: 'Cooperativa', hint: 'Hasta el 50% del salario' },
  { value: 'JUDICIAL_ORDINARIO', label: 'Judicial ordinario', hint: 'Quinta parte del excedente sobre 1 SMMLV' },
  { value: 'FISCAL', label: 'Fiscal', hint: '' },
];

export interface EmbargoModel {
  id: number;
  expediente: string;
  tipo: TipoEmbargo;
  prioridad: number;
  valorTotal: number | null;
  porcentaje: number | null;
  saldo: number;
  fechaInicio: string;
  fechaFin: string | null;
  estado: EstadoEmbargo;
  observacion: string | null;
  cupoAmpliado: boolean;
}

export interface CreateEmbargoDto {
  contratoId: number;
  expediente: string;
  tipo: TipoEmbargo;
  prioridad?: number | null;
  juzgadoId?: number | null;
  demandanteId?: number | null;
  valorTotal?: number | null;
  porcentaje?: number | null;
  fechaInicio: string;
  observacion?: string | null;
}
