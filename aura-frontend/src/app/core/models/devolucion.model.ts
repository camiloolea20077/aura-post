export interface DevolucionDetalleModel {
  id?: number;
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  impuestoValor: number;
  subtotalLinea: number;
  loteId?: number;
}

export interface DevolucionModel {
  id: number;
  empresaId: number;
  sucursalId: number;
  ventaId: number;
  numeroVenta: string;
  clienteId?: number;
  clienteNombre?: string;
  usuarioId: number;
  consecutivo: number;
  tipo: 'TOTAL' | 'PARCIAL';
  estado: 'COMPLETADA' | 'ANULADA';
  motivo: string;
  totalDevolucion: number;
  reintegraInventario: boolean;
  observaciones?: string;
  metodoDevolucion?: string;
  afectoCartera?: boolean;
  montoCarteraAfectado?: number;
  createdAt: string;
  detalles: DevolucionDetalleModel[];
}

export interface DevolucionTableModel {
  id: number;
  consecutivo: number;
  ventaId: number;
  numeroVenta: string;
  clienteNombre?: string;
  tipo: string;
  estado: string;
  totalDevolucion: number;
  createdAt: string;
}

export interface CreateDevolucionDetalleDto {
  productoId: number;
  productoPresentacionId?: number;
  loteId?: number;
  cantidad: number;
}

export interface CreateDevolucionDto {
  ventaId: number;
  tipo: 'TOTAL' | 'PARCIAL';
  motivo: string;
  reintegraInventario: boolean;
  observaciones?: string;
  metodoDevolucion: string;
  detalles: CreateDevolucionDetalleDto[];
}

export interface DevolucionPageableDto {
  page: number;
  rows: number;
  search?: string;
  order_by?: string;
  order?: string;
}
