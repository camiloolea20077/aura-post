export type EstadoReconteo = 'BORRADOR' | 'EN_CONTEO' | 'APROBADO' | 'ANULADO';
export type TipoReconteo = 'TOTAL' | 'PARCIAL';

export interface ReconteoModel {
  id: number;
  sucursalId: number;
  sucursalNombre: string;
  estado: EstadoReconteo;
  tipo: TipoReconteo;
  observaciones: string | null;
  creadoPorNombre: string;
  aprobadoPorNombre: string | null;
  fechaInicio: string;
  fechaCierre: string | null;
  detalles: ReconteoDetalleModel[];
}

export interface ReconteoTableModel {
  id: number;
  sucursalNombre: string;
  estado: EstadoReconteo;
  tipo: TipoReconteo;
  fechaInicio: string;
  fechaCierre: string | null;
  totalProductos: number;
  diferenciasEncontradas: number;
  totalRows: number;
}

export interface ReconteoDetalleModel {
  id: number;
  productoId: number;
  productoNombre: string;
  productoSku: string | null;
  loteId: number | null;
  codigoLote: string | null;
  stockSistema: number;
  stockContado: number | null;
  diferencia: number | null;
  ajusteAplicado: boolean;
}

export interface CreateReconteoDto {
  sucursalId: number;
  tipo: TipoReconteo;
  observaciones?: string | null;
}

export interface UpdateReconteoDetalleDto {
  stockContado: number;
}

export interface ReconteoPageableDto {
  page: number;
  rows: number;
  search?: string | null;
  order_by?: string;
  order?: string;
}
