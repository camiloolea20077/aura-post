// ─── Detalle ─────────────────────────────────────────────────
export interface InventarioModel {
  id: number;
  sucursalId: number;
  sucursalNombre: string;
  productoId: number;
  productoNombre: string;
  productoSku: string | null;
  stockActual: number;
  stockMinimo: number;
  /** Hasta dónde llenar al pedir. */
  stockMaximo?: number | null;
  /** Con este saldo o menos hay que pedir. */
  puntoReorden?: number | null;
  ubicacion: string | null;
}

// ─── Tabla ───────────────────────────────────────────────────
export interface InventarioTableModel {
  id: number;
  sucursalId: number;
  sucursalNombre: string;
  bodegaId?: number | null;
  bodegaNombre?: string | null;
  productoId: number;
  productoNombre: string;
  productoSku: string | null;
  stockActual: number;
  stockMinimo: number;
  /** Hasta dónde llenar al pedir. */
  stockMaximo?: number | null;
  /** Con este saldo o menos hay que pedir. */
  puntoReorden?: number | null;
  ubicacion: string | null;
  unidadAbreviatura?: string | null;
  /** Presentación de mayor contenido entero, para "3 Cajas + 4 und". */
  presentacionNombre?: string | null;
  presentacionFactor?: number | null;
}

// ─── DTOs ────────────────────────────────────────────────────
export interface CreateInventarioDto {
  productoId: number;
  sucursalId: number;
  stockMinimo: number;
  stockMaximo?: number | null;
  puntoReorden?: number | null;
  stockActual: number;
  ubicacion: string | null;
}

export interface UpdateInventarioDto {
  stockActual?: number;
  stockMinimo: number;
  stockMaximo?: number | null;
  puntoReorden?: number | null;
  ubicacion: string | null;
  /** Obligatorio si cambia stockActual: queda en el kardex. */
  motivoAjuste?: string | null;
}

// ─── Pageable ─────────────────────────────────────────────────
export interface InventarioPageableDto {
  page: number;
  rows: number;
  search?: string | null;
  order_by?: string | null;
  order?: string | null;
  /** Sede y bodega a mirar; sucursalId null = todas las sedes. */
  params?: { sucursalId: number | null; bodegaId: number | null };
}

// ─── Historial de producto ────────────────────────────────────
export interface HistorialMovimiento {
  id: number;
  tipo: 'COMPRA' | 'VENTA' | 'MERMA' | 'TRASLADO_ENTRADA' | 'TRASLADO_SALIDA' | 'AJUSTE';
  documentoId: number;
  documentoNumero: string | null;
  fecha: string;
  cantidad: number;
  costoUnitario: number | null;
  precioUnitario: number | null;
  saldoAnterior: number;
  saldoNuevo: number;
  terceroNombre: string | null;
  sucursalNombre: string;
}

export interface HistorialProductoResponse {
  productoId: number;
  productoNombre: string;
  sku: string | null;
  movimientos: HistorialMovimiento[];
}

// ─── Sugerido de compra ──────────────────────────────────────
export interface SugeridoCompraModel {
  inventarioId: number;
  sucursalId: number;
  sucursalNombre: string;
  bodegaId: number | null;
  bodegaNombre: string | null;
  productoId: number;
  productoNombre: string;
  productoSku: string | null;
  unidadAbreviatura: string | null;
  stockActual: number;
  stockMinimo: number;
  puntoReorden: number | null;
  stockMaximo: number | null;
  cantidadSugerida: number;
  costo: number | null;
  valorEstimado: number;
  /** Sin máximo el sugerido solo vuelve al punto de reorden. */
  sinMaximo: boolean;
  ultimoProveedorId: number | null;
  ultimoProveedorNombre: string | null;
  ultimaCompra: string | null;
}
