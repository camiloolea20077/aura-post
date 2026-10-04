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
  /** La persona del usuario (obligatoria desde V192). */
  terceroId?: number | null;
  username: string;
  rol: string;
  /** Perfil de permisos (docs/PLAN_PERMISOS.md en el backend). */
  perfilId?: number | null;
  perfilNombre?: string | null;
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
  perfilNombre?: string | null;
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
  /** Tercero que ya existe: nombre, documento y correo salen de él. */
  terceroId: number;
  /** Vacío = el correo del tercero. */
  username: string | null;
  password: string;
  pinAccesoRapido?: string | null;
  rol: string;
  /** null = el perfil de sistema de su tipo de usuario. */
  perfilId?: number | null;
  sucursales: SucursalAsignacion[];
}

export interface UpdateUsuarioDto {
  /** Cambiar la persona del usuario; null = no cambia. */
  terceroId?: number | null;
  password?: string | null;
  pinAccesoRapido?: string | null;
  rol?: string;
  /** null = se conserva (o pasa al del tipo nuevo si tenía el del tipo anterior). */
  perfilId?: number | null;
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
