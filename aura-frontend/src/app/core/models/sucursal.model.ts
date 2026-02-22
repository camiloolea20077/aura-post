import { IFilterTable } from '../../shared/utils/filter-table';

// ─── Sucursal Model (detalle completo) ───────────────────────
export interface SucursalModel {
  id: number;
  codigo: string | null;
  nombre: string;
  direccion: string | null;
  ciudad: string | null;
  telefono: string | null;
  prefijoFacturacion: string | null;
  consecutivoActual: number;
  activa: boolean;
}

// ─── Tabla paginada ───────────────────────────────────────────
export interface SucursalTableModel {
  id: number;
  codigo: string | null;
  nombre: string;
  ciudad: string | null;
  telefono: string | null;
  activa: boolean;
  totalRows: number;
}

// ─── DTO simple para dropdowns ────────────────────────────────
export interface SucursalDto {
  id: number;
  nombre: string;
  activa: boolean;
}

// ─── DTOs ─────────────────────────────────────────────────────
export interface CreateSucursalDto {
  codigo?: string | null;
  nombre: string;
  direccion?: string | null;
  ciudad?: string | null;
  telefono?: string | null;
  prefijoFacturacion?: string | null;
}

export interface UpdateSucursalDto extends CreateSucursalDto {
  activa?: boolean;
}

// ─── Filtros para la tabla ────────────────────────────────────
export interface SucursalFilterParams {
  search?: string | null;
  activa?: boolean | null;
}

// ─── Alias tipado del filtro paginado ─────────────────────────
export type SucursalPageableDto = IFilterTable<SucursalFilterParams>;
