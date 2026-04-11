export interface CentroCostoDto {
  id: number;
  codigo: string;
  nombre: string;
  tipo: string;
  permiteMovimientos: boolean;
}

export interface CentroCostoTableModel {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  tipo: string | null;
  nivel: number;
  permiteMovimientos: boolean;
  presupuestoAsignado: number | null;
  activo: boolean;
  padreId: number | null;
  nombrePadre: string | null;
  totalRows: number;
}

export interface CreateCentroCostoDto {
  codigo: string;
  nombre: string;
  descripcion: string | null;
  padreCentroCostoId: number | null;
  tipo: string | null;
  permiteMovimientos: boolean;
  presupuestoAsignado: number | null;
  sucursalId: number | null;
  responsableId: number | null;
}

export interface UpdateCentroCostoDto extends CreateCentroCostoDto {
  activo: boolean;
}

export interface CentroCostoPageableDto {
  page: number;
  rows: number;
  search: string;
}
