// ─── Detalle completo ────────────────────────────────────────
export interface ProductoPresentacionModel {
  id: number;
  productoId: number;
  productoNombre: string;
  nombre: string;
  codigoBarras: string | null;
  factorConversion: number;
  activo: boolean;
}

// ─── Tabla ───────────────────────────────────────────────────
export interface ProductoPresentacionTableModel {
  id: number;
  productoId: number;
  productoNombre: string;
  nombre: string;
  codigoBarras: string | null;
  factorConversion: number;
  activo: boolean;
}

// ─── DTOs ────────────────────────────────────────────────────
export interface CreateProductoPresentacionDto {
  productoId: number;
  nombre: string;
  codigoBarras: string | null;
  factorConversion: number;
  activo: boolean;
}

export interface UpdateProductoPresentacionDto {
  nombre: string;
  codigoBarras: string | null;
  factorConversion: number;
  activo: boolean;
}

// ─── PageableDto (POST body) ──────────────────────────────────
export interface PresentacionPageableDto {
  page: number;
  rows: number;
  search?: string | null;
  order_by?: string | null;
  order?: string | null;
}
