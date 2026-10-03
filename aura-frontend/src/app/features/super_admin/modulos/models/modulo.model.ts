export interface ModuloModel {
  id: number;
  nombre: string;
  codigo: string;
  descripcion?: string;
  orden: number;
  activo: boolean;
}

export interface ModuloTableModel extends ModuloModel {
  totalRows: number;
}

export interface CreateModuloDto {
  nombre: string;
  codigo: string;
  descripcion?: string;
  orden?: number;
  activo?: boolean;
}

export interface UpdateModuloDto {
  nombre?: string;
  descripcion?: string;
  orden?: number;
  activo?: boolean;
}

export interface SubmoduloModel {
  id: number;
  moduloId: number;
  moduloNombre: string;
  nombre: string;
  codigo: string;
  descripcion?: string;
  orden: number;
  activo: boolean;
  /** Grupo del que cuelga (null = directo del módulo). */
  padreId?: number | null;
  padreNombre?: string | null;
  /** Tiene pantallas colgando: es un grupo. */
  esGrupo?: boolean;
  totalRows: number;
}

export interface SubmoduloTableModel extends SubmoduloModel {}

export interface CreateSubmoduloDto {
  moduloId: number;
  nombre: string;
  codigo: string;
  descripcion?: string;
  orden?: number;
  activo?: boolean;
  padreId?: number | null;
}

export interface UpdateSubmoduloDto {
  nombre?: string;
  codigo?: string;
  descripcion?: string;
  orden?: number;
  activo?: boolean;
  /** Mover a este grupo (mismo módulo). */
  padreId?: number | null;
  /** true = sacarlo de su grupo. */
  sinPadre?: boolean;
}
