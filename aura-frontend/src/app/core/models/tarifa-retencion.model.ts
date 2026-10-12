export type TipoRetencion = 'RETEFUENTE' | 'RETEIVA' | 'RETEICA';

export interface TarifaRetencionModel {
  id: number;
  empresaId: number;
  tipo: TipoRetencion;
  concepto: string;
  codigoConcepto: string | null;
  tarifaNatural: number;
  tarifaJuridica: number;
  baseMinima: number;
  activo: boolean;
  /** Cuenta del concepto (2365xx / 2367xx / 2368xx). Sin ella, la cuenta por defecto. */
  cuentaContableId: number | null;
  cuentaCodigo: string | null;
  cuentaNombre: string | null;
  /** A quién se le paga: DIAN (retefuente, reteIVA) o la secretaría de hacienda (reteICA). */
  terceroAcreedorId: number | null;
  terceroAcreedorNombre: string | null;
}

export interface CreateTarifaRetencionDto {
  tipo: TipoRetencion;
  concepto: string;
  codigoConcepto?: string | null;
  tarifaNatural: number;
  tarifaJuridica: number;
  baseMinima?: number;
  activo?: boolean;
  cuentaContableId?: number | null;
  terceroAcreedorId?: number | null;
}

export interface RetencionesSugeridasModel {
  terceroId: number;
  tipoPersona: string;
  retefuentePct: number;
  retefuenteConcepto: string | null;
  reteivaPct: number;
  reteivaConcepto: string | null;
  reteicaPct: number;
  reteicaConcepto: string | null;
}

export const TIPO_RETENCION_OPTIONS: { label: string; value: TipoRetencion }[] = [
  { label: 'Retefuente', value: 'RETEFUENTE' },
  { label: 'ReteIVA',    value: 'RETEIVA' },
  { label: 'ReteICA',    value: 'RETEICA' },
];
