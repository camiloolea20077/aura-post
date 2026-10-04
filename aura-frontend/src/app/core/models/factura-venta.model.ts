/** Facturación: factura de venta fuera del POS (docs/PLAN_FACTURACION.md). */

export type EstadoFacturaVenta = 'BORRADOR' | 'EMITIDA' | 'ANULADA';
export type FormaPagoFactura = 'CREDITO' | 'CONTADO';
export type MetodoContado = 'EFECTIVO' | 'TRANSFERENCIA' | 'CONSIGNACION' | 'TARJETA' | 'CHEQUE';

export interface FacturaVentaLinea {
  productoId: number | null;
  productoPresentacionId?: number | null;
  descripcion?: string | null;
  cantidad: number;
  /** Sin IVA. */
  precioUnitario: number;
  descuentoValor: number;
  impuestoPorcentaje: number;
  /** Línea de la cotización de origen. */
  cotizacionDetalleId?: number | null;
}

export interface GuardarFacturaVenta {
  sucursalId: number | null;
  bodegaId?: number | null;
  clienteId: number | null;
  vendedorId?: number | null;
  condicionPagoId?: number | null;
  formaPago: FormaPagoFactura;
  metodoPago?: MetodoContado | null;
  cuentaBancariaId?: number | null;
  centroCostoId?: number | null;
  /** yyyy-MM-dd; null = hoy + días de la condición. */
  fechaVencimiento?: string | null;
  ordenCompra?: string | null;
  notas?: string | null;
  /** Contrato AIU: las líneas son costo directo; A, I y U las agrega el servidor. */
  aiu?: boolean;
  aiuAdministracionPct?: number;
  aiuImprevistosPct?: number;
  aiuUtilidadPct?: number;
  aiuIvaPct?: number;
  lineas: FacturaVentaLinea[];
}

export interface FacturaVentaLineaDto extends FacturaVentaLinea {
  id: number;
  productoNombre: string;
  productoSku: string | null;
  unidadAbreviatura: string | null;
  manejaInventario: boolean;
  presentacionNombre: string | null;
  impuestoValor: number;
  subtotalLinea: number;
  /** ADMINISTRACION | IMPREVISTOS | UTILIDAD si la generó el AIU. */
  aiuTipo?: string | null;
}

export interface FacturaVentaDetalle {
  id: number;
  estado: EstadoFacturaVenta;
  sucursalId: number;
  sucursalNombre: string;
  bodegaId: number | null;
  bodegaNombre: string | null;
  clienteId: number;
  clienteNombre: string;
  clienteDocumento: string | null;
  vendedorId: number | null;
  vendedorNombre: string | null;
  condicionPagoId: number | null;
  condicionPagoNombre: string | null;
  formaPago: FormaPagoFactura;
  metodoPago: MetodoContado | null;
  cuentaBancariaId: number | null;
  cuentaBancariaNombre: string | null;
  cuentaBancariaBanco: string | null;
  cuentaBancariaTipo: string | null;
  cuentaBancariaNumero: string | null;
  fechaVencimiento: string | null;
  ordenCompra: string | null;
  notas: string | null;
  centroCostoId: number | null;
  centroCostoNombre: string | null;
  cotizacionId: number | null;
  cotizacionNumero: string | null;
  pedidoVendedorId: number | null;
  pedidoNumero: string | null;
  aiu: boolean;
  aiuAdministracionPct: number;
  aiuImprevistosPct: number;
  aiuUtilidadPct: number;
  aiuIvaPct: number;
  subtotal: number;
  descuentoTotal: number;
  impuestosTotal: number;
  total: number;
  createdAt: string;
  emitidaAt: string | null;
  ventaId: number | null;
  numero: string | null;
  estadoVenta: string | null;
  saldoPendiente: number | null;
  cufe: string | null;
  estadoDian: string | null;
  factusNumero: string | null;
  /** Contenido del QR de la factura electrónica. */
  qrData: string | null;
  factusUrl: string | null;
  /** Fecha y hora real de emisión (la de la venta). */
  fechaEmision: string | null;
  lineas: FacturaVentaLineaDto[];
}

export interface FacturaVentaFila {
  id: number;
  estado: EstadoFacturaVenta;
  numero: string | null;
  fecha: string;
  clienteNombre: string;
  clienteDocumento: string | null;
  sucursalNombre: string;
  formaPago: FormaPagoFactura;
  condicionPagoNombre: string | null;
  fechaVencimiento: string | null;
  total: number;
  saldoPendiente: number | null;
  estadoDian: string | null;
  ventaId: number | null;
}

export interface CondicionPago {
  id: number;
  nombre: string;
  dias: number;
  activa: boolean;
}

/** Anticipo activo del cliente que se puede cruzar al emitir a crédito. */
export interface AnticipoCliente {
  id: number;
  fecha: string;
  monto: number;
  saldo: number;
  observaciones: string | null;
}
