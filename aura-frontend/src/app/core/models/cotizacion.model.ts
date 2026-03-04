export type EstadoCotizacion = 'PENDIENTE' | 'VENCIDA' | 'ANULADA' | 'CONVERTIDA';

export interface CotizacionDetalleModel {
  id: number;
  productoId: number;
  productoNombre: string;
  productoSku: string | null;
  descripcion: string | null;
  cantidad: number;
  precioUnitario: number;
  ivaPorcentaje: number;
  descuentoValor: number;
  subtotal: number;
}

export interface CotizacionModel {
  id: number;
  empresaId: number;
  terceroId: number | null;
  terceroNombre: string | null;
  terceroDocumento: string | null;
  turnoCajaId: number | null;
  numero: string;
  fecha: string;
  fechaVencimiento: string;
  subtotal: number;
  iva: number;
  descuento: number;
  total: number;
  observaciones: string | null;
  estado: EstadoCotizacion;
  diasVigencia: number;
  detalles: CotizacionDetalleModel[];
}

export interface CotizacionTableModel {
  id: number;
  numero: string;
  terceroNombre: string | null;
  terceroDocumento: string | null;
  fecha: string;
  fechaVencimiento: string;
  total: number;
  estado: EstadoCotizacion;
  totalRows: number;
}

export interface CreateCotizacionDetalleDto {
  productoId: number;
  descripcion: string | null;
  cantidad: number;
  precioUnitario: number;
  ivaPorcentaje: number;
  descuentoValor: number;
}

export interface CreateCotizacionDto {
  terceroId: number | null;
  turnoCajaId: number | null;
  observaciones: string | null;
  diasVigencia: number;
  detalles: CreateCotizacionDetalleDto[];
}

export interface CotizacionPageableDto {
  page: number;
  rows: number;
  search: string | null;
  order_by?: string;
  order?: string;
}
