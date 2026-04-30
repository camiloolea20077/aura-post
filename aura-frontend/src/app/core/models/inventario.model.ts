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
  ubicacion: string | null;
}

// ─── Tabla ───────────────────────────────────────────────────
export interface InventarioTableModel {
  id: number;
  sucursalId: number;
  sucursalNombre: string;
  productoId: number;
  productoNombre: string;
  productoSku: string | null;
  stockActual: number;
  stockMinimo: number;
  ubicacion: string | null;
}

// ─── DTOs ────────────────────────────────────────────────────
export interface CreateInventarioDto {
  productoId: number;
  sucursalId: number;
  stockMinimo: number;
  stockActual: number;
  ubicacion: string | null;
}

export interface UpdateInventarioDto {
  stockActual?: number;
  stockMinimo: number;
  ubicacion: string | null;
}

// ─── Pageable ─────────────────────────────────────────────────
export interface InventarioPageableDto {
  page: number;
  rows: number;
  search?: string | null;
  order_by?: string | null;
  order?: string | null;
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
