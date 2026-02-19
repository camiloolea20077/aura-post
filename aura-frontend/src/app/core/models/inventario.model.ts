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
  ubicacion: string | null;
}

export interface UpdateInventarioDto {
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
