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
  totalAgregado?: number;
  netoDiferencia?: number;
  fechaDevolucion?: string;
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

export interface CreateDevolucionAgregadoDto {
  productoId: number;
  productoPresentacionId?: number;
  cantidad: number;
  /** Precio unitario SIN IVA. */
  precioUnitario: number;
  /** Valor total de IVA de la línea (por la cantidad). */
  impuestoValor: number;
}

export interface CreateDevolucionDto {
  ventaId: number;
  tipo: 'TOTAL' | 'PARCIAL';
  motivo: string;
  reintegraInventario: boolean;
  observaciones?: string;
  /** Fecha de registro de la devolución (yyyy-MM-dd). */
  fechaDevolucion?: string;
  metodoDevolucion: string;
  detalles: CreateDevolucionDetalleDto[];
  /** Productos que se lleva el cliente en un cambio (se suman a la venta). */
  productosAgregados?: CreateDevolucionAgregadoDto[];
}

export interface DevolucionPageableDto {
  page: number;
  rows: number;
  search?: string;
  order_by?: string;
  order?: string;
}
