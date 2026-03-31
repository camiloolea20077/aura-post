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
}

export interface UpdateSubmoduloDto {
  nombre?: string;
  descripcion?: string;
  orden?: number;
  activo?: boolean;
}
