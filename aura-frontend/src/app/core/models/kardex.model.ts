// ─── Tipos de movimiento ──────────────────────────────────────
// La lista ya NO vive aquí: la sirve GET /kardex/tipos-movimiento desde el
// enum TipoMovimientoInventario del backend. Mantenerla hardcodeada fue el bug:
// el front conocía 9 tipos y el backend escribía 17, así que merma, obsequio,
// devolución y reconteo se veían en la tabla pero no se podían filtrar.
export type TipoMovimiento = string;

export type GrupoMovimiento = 'ENTRADA' | 'SALIDA' | 'MIXTO';

export type FamiliaMovimiento =
  | 'COMPRAS'
  | 'VENTAS'
  | 'DEVOLUCIONES'
  | 'MERMAS'
  | 'OBSEQUIOS'
  | 'TRASLADOS'
  | 'ANULACIONES'
  | 'RECONTEOS';

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
  /** Etiqueta legible que resuelve el backend desde el catálogo. */
  tipoEtiqueta?: string;
  grupo?: GrupoMovimiento | null;
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
  tipoEtiqueta?: string;
  grupo?: GrupoMovimiento | null;
  cantidad: number;
  saldoAnterior: number;
  saldoNuevo: number;
  costoHistorico: number;
  referenciaOrigen: string | null;
  createdAt: string;
  totalRows: number;
}

/**
 * Si el movimiento sumó o restó stock.
 *
 * Se mira el saldo, no el nombre del tipo. Las listas hardcodeadas que había
 * antes clasificaban `ANULACION_COMPRA` como entrada cuando saca stock, y
 * `ANULACION_TRASLADO` como salida cuando genera una fila de cada signo. El
 * saldo está en todas las filas y no se puede equivocar.
 */
export function esEntradaPorSaldo(
  saldoAnterior: number | null | undefined,
  saldoNuevo: number | null | undefined,
): boolean {
  return (saldoNuevo ?? 0) >= (saldoAnterior ?? 0);
}

// ─── Filtros ───────────────────────────────────────────────────
export interface KardexFiltroDto {
  page: number;
  rows: number;
  sucursalId?: number | null;
  productoId?: number | null;
  loteId?: number | null;
  categoriaId?: number | null;
  marcaId?: number | null;
  /** Un solo tipo. Si viene `tiposMovimiento`, este se ignora. */
  tipoMovimiento?: TipoMovimiento | null;
  /** Varios tipos a la vez: "todas las anulaciones", merma + obsequio, etc. */
  tiposMovimiento?: TipoMovimiento[] | null;
  grupoMovimiento?: GrupoMovimiento | null;
  fechaDesde?: string | null; // ISO
  fechaHasta?: string | null;
  search?: string | null;
}

// ─── Reporte de movimiento ─────────────────────────────────────

export type AgrupacionKardex =
  | 'PRODUCTO'
  | 'PRODUCTO_SUCURSAL'
  | 'PRODUCTO_LOTE';

export interface KardexReporteFiltroDto extends KardexFiltroDto {
  agrupacion?: AgrupacionKardex;
}

/**
 * Una fila del reporte. Los saldos se leen del primer y último movimiento del
 * rango, no se calculan sumando cantidades: así el reporte cuadra contra el
 * stock real y, cuando no cuadra, el descuadre se ve.
 *
 * Agrupando por lote los saldos van en null — el lote no tiene stock propio.
 */
export interface KardexReporteLineaModel {
  productoId: number;
  productoNombre: string;
  productoSku: string | null;
  categoriaNombre: string | null;
  marcaNombre: string | null;
  sucursalId: number | null;
  sucursalNombre: string | null;
  loteId: number | null;
  codigoLote: string | null;

  saldoInicial: number | null;
  saldoFinal: number | null;
  entradas: number;
  salidas: number;
  variacionNeta: number;
  valorEntradas: number;
  valorSalidas: number;
  cantidadMovimientos: number;

  compras: number;
  ventas: number;
  devoluciones: number;
  mermas: number;
  obsequios: number;
  traslados: number;
  anulaciones: number;
  reconteos: number;
  otros: number;

  totalRows: number;
}

/** Una línea del kardex clásico, en orden cronológico con saldo corrido. */
export interface KardexDetalleLineaModel {
  id: number;
  fecha: string;
  tipoMovimiento: TipoMovimiento;
  tipoEtiqueta: string;
  grupo: GrupoMovimiento | null;
  referenciaOrigen: string | null;
  sucursalNombre: string | null;
  codigoLote: string | null;
  /** saldoNuevo − saldoAnterior: la variación real, no la columna `cantidad`. */
  movimiento: number;
  saldoAnterior: number;
  saldoNuevo: number;
  costoHistorico: number;
  valorMovimiento: number;
  totalRows: number;
}

// ─── Selectores ────────────────────────────────────────────────
export interface TipoMovimientoOpcion {
  label: string;
  value: TipoMovimiento;
  grupo: GrupoMovimiento;
  familia: FamiliaMovimiento;
}


