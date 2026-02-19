// ─── Detalle ─────────────────────────────────────────────────
export interface ListaPreciosModel {
  id: number;
  empresaId: number;
  nombre: string;
  activa: boolean;
}

// ─── Tabla ───────────────────────────────────────────────────
export interface ListaPreciosTableModel {
  id: number;
  nombre: string;
  activa: boolean;
}

// ─── DTOs ────────────────────────────────────────────────────
export interface CreateListaPreciosDto {
  nombre: string;
  activa: boolean;
}

export interface UpdateListaPreciosDto {
  nombre: string;
  activa: boolean;
}

// ─── Pageable (POST body) ─────────────────────────────────────
export interface ListaPreciosPageableDto {
  page: number;
  rows: number;
  search?: string | null;
  order_by?: string | null;
  order?: string | null;
}
