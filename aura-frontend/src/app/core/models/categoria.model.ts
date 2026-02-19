// ─── Modelo completo (respuesta del backend) ─────────────────
export interface CategoriaModel {
  id: number;
  nombre: string;
  impuestoDefecto: number | null;
  activo: boolean;
  padreId: number | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Modelo ligero para tabla ────────────────────────────────
export interface CategoriaTableModel {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  slug: string;
}

// ─── DTOs ────────────────────────────────────────────────────
export interface CreateCategoriaDto {
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface CategoriaDto {
  id: number;
  nombre: string;
}

export interface UpdateCategoriaDto {
  nombre: string;
  impuestoDefecto: number | null;
  padreId: number | null;
  activo: boolean;
}

// ─── Parámetros de filtro para tabla ─────────────────────────
export interface CategoriaFilterParams {
  activo?: boolean | null;
}
