export interface MarcaModel {
  id: number;
  empresaId: number;
  nombre: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarcaTableModel {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface CreateMarcaDto {
  nombre: string;
  activo: boolean;
}

export interface UpdateMarcaDto {
  nombre: string;
  activo: boolean;
}

export interface MarcaFilterParams {
  activo?: boolean | null;
}
