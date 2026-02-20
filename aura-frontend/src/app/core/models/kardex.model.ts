// ─── Tipos de movimiento (9 en total) ─────────────────────────
export type TipoMovimiento =
  | 'COMPRA'
  | 'ANULACION_COMPRA'
  | 'VENTA'
  | 'ANULACION_VENTA'
  | 'MERMA'
  | 'ANULACION_MERMA'
  | 'TRASLADO_SALIDA'
  | 'TRASLADO_ENTRADA'
  | 'ANULACION_TRASLADO';

export interface MovimientoInventarioModel {
  id: number;
  sucursalId: number;
  sucursalNombre: string;
  productoId: number;
  productoNombre: string;
  productoSku: string | null;
  loteId: number | null;
  codigoLote: string | null;
  tipoMovimiento: TipoMovimiento;
  cantidad: number;
  saldoAnterior: number;
  saldoNuevo: number;
  costoHistorico: number;
  referenciaOrigen: string | null; // "Venta #123", "Compra #45"
  createdAt: string;
}

export interface MovimientoTableModel {
  id: number;
  sucursalNombre: string;
  productoNombre: string;
  productoSku: string | null;
  codigoLote: string | null;
  tipoMovimiento: TipoMovimiento;
  cantidad: number;
  saldoAnterior: number;
  saldoNuevo: number;
  costoHistorico: number;
  referenciaOrigen: string | null;
  createdAt: string;
  totalRows: number;
}

// ─── Filtros ───────────────────────────────────────────────────
export interface KardexFiltroDto {
  page: number;
  rows: number;
  sucursalId?: number | null;
  productoId?: number | null;
  tipoMovimiento?: TipoMovimiento | null;
  fechaDesde?: string | null; // ISO yyyy-MM-dd
  fechaHasta?: string | null;
  search?: string | null;
}

// ─── Selectores ────────────────────────────────────────────────
export interface TipoMovimientoOpcion {
  label: string;
  value: TipoMovimiento;
  grupo: 'entrada' | 'salida' | 'neutro';
}

export const TIPOS_MOVIMIENTO_OPCIONES: TipoMovimientoOpcion[] = [
  { label: 'Compra', value: 'COMPRA', grupo: 'entrada' },
  { label: 'Anulación compra', value: 'ANULACION_COMPRA', grupo: 'entrada' },
  { label: 'Venta', value: 'VENTA', grupo: 'salida' },
  { label: 'Anulación venta', value: 'ANULACION_VENTA', grupo: 'salida' },
  { label: 'Merma', value: 'MERMA', grupo: 'salida' },
  { label: 'Anulación merma', value: 'ANULACION_MERMA', grupo: 'salida' },
  { label: 'Traslado salida', value: 'TRASLADO_SALIDA', grupo: 'salida' },
  { label: 'Traslado entrada', value: 'TRASLADO_ENTRADA', grupo: 'entrada' },
  { label: 'Anulación traslado', value: 'ANULACION_TRASLADO', grupo: 'neutro' },
];
