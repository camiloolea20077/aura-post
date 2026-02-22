import { IFilterTable } from '../../shared/utils/filter-table';

// ─── Sucursal asignada (dentro de usuario) ───────────────────
export interface UsuarioSucursalModel {
  sucursalId: number;
  sucursalNombre: string;
  esDefault: boolean;
}

// ─── Detalle completo ─────────────────────────────────────────
export interface UsuarioModel {
  id: number;
  username: string;
  rol: string;
  activo: boolean;
  createdAt: string;
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  telefono: string | null;
  email: string | null;
  sucursales: UsuarioSucursalModel[];
}

// ─── Tabla ────────────────────────────────────────────────────
export interface UsuarioTableModel {
  id: number;
  username: string;
  rol: string;
  nombreCompleto: string;
  numeroDocumento: string;
  telefono: string | null;
  activo: boolean;
  totalRows: number;
}

// ─── DTOs ─────────────────────────────────────────────────────
export interface SucursalAsignacion {
  sucursalId: number;
  esDefault: boolean;
}

export interface CreateUsuarioDto {
  username: string;
  password: string;
  pinAccesoRapido?: string | null;
  rol: string;
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  telefono?: string | null;
  email?: string | null;
  sucursales: SucursalAsignacion[];
}

export interface UpdateUsuarioDto {
  password?: string | null;
  pinAccesoRapido?: string | null;
  rol?: string;
  nombres?: string;
  apellidos?: string;
  telefono?: string | null;
  email?: string | null;
  activo?: boolean;
  sucursales?: SucursalAsignacion[] | null;
}

// ─── Filtros para la tabla ────────────────────────────────────
export interface UsuarioFilterParams {
  search?: string | null;
  rol?: string | null;
  activo?: boolean | null;
}

// ─── Alias tipado del filtro paginado ─────────────────────────
export type UsuarioPageableDto = IFilterTable<UsuarioFilterParams>;

// ─── Opciones UI ─────────────────────────────────────────────
export const ROLES_OPTIONS = [
  { label: 'Administrador', value: 'ADMIN' },
  { label: 'Cajero', value: 'CAJERO' },
  { label: 'Supervisor', value: 'SUPERVISOR' },
];

export const TIPO_DOC_OPTIONS = [
  { label: 'Cédula de Ciudadanía', value: 'CC' },
  { label: 'NIT', value: 'NIT' },
  { label: 'Cédula Extranjería', value: 'CE' },
  { label: 'Pasaporte', value: 'PA' },
];
