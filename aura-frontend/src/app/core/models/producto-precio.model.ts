// ─── Detalle ─────────────────────────────────────────────────
export interface ProductoPrecioModel {
  id: number;
  listaPrecioId: number;
  listaPrecioNombre: string;
  productoPresentacionId: number;
  productoPresentacionNombre: string;
  productoNombre: string;
  precio: number;
  utilidadEsperada: number | null;
}

// ─── Tabla ───────────────────────────────────────────────────
export interface ProductoPrecioTableModel {
  id: number;
  listaPrecioId: number;
  listaPrecioNombre: string;
  productoPresentacionId: number;
  productoPresentacionNombre: string;
  productoNombre: string;
  precio: number;
  utilidadEsperada: number | null;
}

// ─── DTOs ────────────────────────────────────────────────────
export interface CreateProductoPrecioDto {
  listaPrecioId: number;
  productoPresentacionId: number;
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
