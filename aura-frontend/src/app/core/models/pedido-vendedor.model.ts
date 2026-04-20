export type EstadoPedido = 'CREADA' | 'PENDIENTE_DESPACHO' | 'DESPACHADA' | 'COBRADA' | 'ANULADA';

export interface PedidoVendedorTableModel {
  id: number;
  numeroPedido: string | null;
  vendedorNombre: string | null;
  clienteNombre: string | null;
  total: number;
  estado: EstadoPedido;
  createdAt: string;
  ventaId: number | null;
}

export interface PedidoVendedorDetalleModel {
  id: number;
  productoId: number;
  productoNombre: string;
  productoSku: string | null;
  cantidad: number;
  precioUnitario: number;
  descuentoValor: number;
  impuestoValor: number;
  subtotalLinea: number;
  unidadMedidaNombre: string | null;
}

export interface PedidoVendedorModel {
  id: number;
  numeroPedido: string | null;
  vendedorNombre: string | null;
  clienteId: number | null;
  clienteNombre: string | null;
  subtotal: number;
  descuentoTotal: number;
  impuestoTotal: number;
  total: number;
  estado: EstadoPedido;
  observaciones: string | null;
  createdAt: string;
  fechaCobro: string | null;
  ventaId: number | null;
  detalles: PedidoVendedorDetalleModel[];
}

export interface CreatePedidoDetalleDto {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  descuentoValor: number;
  impuestoValor: number;
}

export interface CreatePedidoDto {
  clienteId: number | null;
  observaciones: string | null;
  detalles: CreatePedidoDetalleDto[];
}

export interface RegistrarCobroDto {
  metodoPago: string;
  referencia: string | null;
  turnoId: number | null;
}

export interface PedidoPageableDto {
  page: number;
  rows: number;
  search: string | null;
  estado: EstadoPedido | null;
  order_by: string;
  order: string;
}

export interface PedidoItemCarrito {
  productoId: number;
  productoNombre: string;
  productoSku: string | null;
  cantidad: number;
  precioUnitario: number;
  descuentoValor: number;
  impuesto: number;
  impuestoValor: number;
  subtotal: number;
}
