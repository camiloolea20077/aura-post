// Agregar a venta.model.ts

export interface VentaDetalleResponse {
  id: number;
  productoId: number;
  productoNombre: string;
  productoSku: string | null;
  cantidad: number;
  precioUnitario: number;
  montoDescuento: number;
  impuestoValor: number;
  subtotalLinea: number;
}

export interface VentaPagoResponse {
  id: number;
  metodoPago: string;
  monto: number;
  referencia: string | null;
}

export interface VentaResponse {
  id: number;
  empresaId: number;
  sucursalId: number;
  sucursalNombre: string;
  clienteId: number | null;
  clienteNombre: string;
  usuarioId: number;
  turnoCajaId: number;
  tipoDocumento: string;
  prefijo: string | null;
  consecutivo: number;
  fechaEmision: string;
  subtotal: number;
  descuentoTotal: number;
  impuestosTotal: number;
  totalPagar: number;
  estadoVenta: string;
  observaciones: string | null;
  detalles: VentaDetalleResponse[];
  pagos: VentaPagoResponse[];
}
