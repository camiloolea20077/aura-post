export interface UnidadMedidaModel {
  id: number;
  nombre: string;
  abreviatura: string;
  permiteDecimales: boolean;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UnidadMedidaTableModel {
  id: number;
  nombre: string;
  abreviatura: string;
  permiteDecimales: boolean;
  activo: boolean;
}

export interface CreateUnidadMedidaDto {
  nombre: string;
  abreviatura: string;
  permiteDecimales: boolean;
  activo: boolean;
}

export interface UpdateUnidadMedidaDto {
  nombre: string;
  abreviatura: string;
  permiteDecimales: boolean;
  activo: boolean;
}

export interface UnidadMedidaFilterParams {
  activo?: boolean | null;
  permiteDecimales?: boolean | null;
}
