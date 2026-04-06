export interface TipoEmpleadoModel {
  id: number;
  empresaId: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface TipoEmpleadoTableModel {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  totalRows: number;
}

export interface CreateTipoEmpleadoDto {
  nombre: string;
  descripcion?: string | null;
}

export interface UpdateTipoEmpleadoDto {
  nombre?: string;
  descripcion?: string | null;
  activo?: boolean;
}