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
}

export interface CreateTarifaRetencionDto {
  tipo: TipoRetencion;
  concepto: string;
  codigoConcepto?: string | null;
  tarifaNatural: number;
  tarifaJuridica: number;
  baseMinima?: number;
  activo?: boolean;
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
