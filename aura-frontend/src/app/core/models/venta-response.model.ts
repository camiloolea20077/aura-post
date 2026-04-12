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
  unidadMedidaNombre: string | null;
}

export interface VentaPagoResponse {
  id: number;
  metodoPago: string;
  monto: number;
  montoRecibido: number | null;
  referencia: string | null;
}

export interface VentaResponse {
  id: number;
  empresaId: number;
  sucursalId: number;
  sucursalNombre: string;
  clienteId: number | null;
  clienteNombre: string | null;
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
  cajaNombre: string | null;
  numeroVenta: string | null;
  cufe: string | null;
  estadoDian: string | null;
  // Desglose IVA por tarifa (V53)
  ivaBase0: number;
  ivaBase5: number;
  ivaValor5: number;
  ivaBase19: number;
  ivaValor19: number;
}
