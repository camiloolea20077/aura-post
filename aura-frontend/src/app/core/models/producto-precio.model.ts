// ─── Detalle ─────────────────────────────────────────────────
export interface ProductoPrecioModel {
  id: number;
  listaPrecioId: number;
  listaPrecioNombre: string;
  productoId: number;
  productoPresentacionId: number | null;
  productoPresentacionNombre: string | null;
  productoNombre: string;
  precio: number;
  utilidadEsperada: number | null;
}

// ─── Tabla ───────────────────────────────────────────────────
export interface ProductoPrecioTableModel {
  id: number;
  listaPrecioId: number;
  listaPrecioNombre: string;
  productoId: number;
  productoPresentacionId: number | null;
  productoPresentacionNombre: string | null;
  productoNombre: string;
  precio: number;
  utilidadEsperada: number | null;
}

// ─── DTOs ────────────────────────────────────────────────────
export interface CreateProductoPrecioDto {
  listaPrecioId: number;
  productoPresentacionId: number | null;
  productoId: number | null;
  precio: number;
  utilidadEsperada: number | null;
}

export interface UpdateProductoPrecioDto {
  precio: number;
  utilidadEsperada: number | null;
}

// ─── Pageable (POST body) ─────────────────────────────────────
export interface ProductoPrecioPageableDto {
  page: number;
  rows: number;
  search?: string | null;
  order_by?: string | null;
  order?: string | null;
}
