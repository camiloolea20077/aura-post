export type EstadoPedido = 'PENDIENTE_DESPACHO' | 'DESPACHADA' | 'COBRADA' | 'ANULADA';

export interface PedidoVendedorTableModel {
  id: number;
  numeroPedido: string | null;
  vendedorId: number;
  vendedorNombre: string;
  clienteId: number | null;
  clienteNombre: string | null;
  totalPagar: number;
  estado: EstadoPedido;
  fechaCreacion: string;
  fechaDespacho: string | null;
  fechaCobro: string | null;
  cantidadItems: number;
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
  vendedorId: number;
  vendedorNombre: string;
  clienteId: number | null;
  clienteNombre: string | null;
  subtotal: number;
  descuentoTotal: number;
  impuestosTotal: number;
  totalPagar: number;
  estado: EstadoPedido;
  observaciones: string | null;
  fechaCreacion: string;
  fechaDespacho: string | null;
  fechaCobro: string | null;
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
