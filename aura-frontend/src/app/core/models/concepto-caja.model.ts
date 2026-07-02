export type TipoConceptoCaja = 'INGRESO' | 'EGRESO';

export interface ConceptoCajaModel {
  id: number;
  nombre: string;
  tipo: TipoConceptoCaja;
  cuentaContableId: number;
  cuentaCodigo?: string | null;
  cuentaNombre?: string | null;
  activo: boolean;
}

export interface CreateConceptoCajaDto {
  nombre: string;
  tipo: TipoConceptoCaja;
  cuentaContableId: number;
  activo?: boolean;
}
