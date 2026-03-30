// ─── Estados ──────────────────────────────────────────────────
export type EstadoCompra = 'RECIBIDA' | 'ANULADA';
export type TipoDocumentoCompra = 'FACTURA_COMPRA' | 'NOTA_DEBITO' | 'NOTA_CREDITO' | 'RECIBO';

// ─── Detalle línea ────────────────────────────────────────────
export interface CompraDetalleModel {
  id: number;
  productoId: number;
  productoNombre: string;
  productoSku: string | null;
  cantidad: number;
  costoUnitario: number;
  descuentoPct: number;
  descuentoValor: number;
  impuestoValor: number;
  subtotalLinea: number;
  precioVenta1: number | null;
  precioVenta2: number | null;
  precioVenta3: number | null;
}

// ─── Pago de compra ───────────────────────────────────────────
export interface CompraPagoModel {
  id: number;
  metodoPago: string; // EFECTIVO | TARJETA | TRANSFERENCIA | CREDITO
  monto: number;
  banco: string | null;
}

// ─── Modelo completo ──────────────────────────────────────────
export type FormaPago = 'CONTADO' | 'CREDITO';

export interface CompraModel {
  id: number;
  empresaId: number;
  sucursalId: number;
  sucursalNombre: string;
  proveedorId: number;
  proveedorNombre: string;
  usuarioId: number | null;
  numeroCompra: string | null;
  fecha: string;
  formaPago: FormaPago | null;
  tipoDocumento: TipoDocumentoCompra | null;
  fletes: number;
  subtotal: number;
  descuentoTotal: number;
  impuestosTotal: number;
  total: number;
  observaciones: string | null;
  estado: EstadoCompra;
  retefuentePct: number | null;
  retefuenteValor: number | null;
  reteivaPct: number | null;
  reteivaValor: number | null;
  reteicaPct: number | null;
  reteicaValor: number | null;
  totalRetenciones: number | null;
  netaAPagar: number | null;
  detalles: CompraDetalleModel[];
  pagos: CompraPagoModel[];
}

// ─── Tabla ───────────────────────────────────────────────────
export interface CompraTableModel {
  id: number;
  numeroCompra: string | null;
  proveedorNombre: string;
  sucursalNombre: string;
  fecha: string;
  total: number;
  estado: EstadoCompra;
}

// ─── DTOs de creación ─────────────────────────────────────────
export interface CreateCompraDetalleDto {
  productoId: number;
  cantidad: number;
  costoUnitario: number;
  descuentoPct: number;
  impuestoValor: number;
  precioVenta1: number | null;
  precioVenta2: number | null;
  precioVenta3: number | null;
}

export interface CreateCompraPagoDto {
  metodoPago: string; // EFECTIVO | TRANSFERENCIA | NEQUI | TARJETA | CHEQUE
  monto: number;
  banco?: string | null;
  cuentaBancariaId?: number | null;
}

export interface CreateCompraDto {
  proveedorId: number;
  sucursalId: number;
  numeroCompra: string | null;
  fecha: string | null;
  fechaVencimiento?: string | null;
  observaciones: string | null;
  detalles: CreateCompraDetalleDto[];
  retefuentePct?: number | null;
  reteivaPct?: number | null;
  reteicaPct?: number | null;
  formaPago?: FormaPago | null;
  tipoDocumento?: TipoDocumentoCompra | null;
  fletes?: number | null;
  pagos?: CreateCompraPagoDto[] | null;
}

// ─── Pageable ─────────────────────────────────────────────────
export interface CompraPageableDto {
  page: number;
  rows: number;
  search?: string | null;
  order_by?: string | null;
  order?: string | null;
}

// ─── UI — línea en el builder ─────────────────────────────────
export interface CompraLineaUI {
  _id: string;
  productoId: number | null;
  productoNombre: string;
  cantidad: number | null;
  costoUnitario: number | null;
  descuentoPct: number;
  descuentoValor: number;
  ivaPorcentaje: number;
  impuestoValor: number;
  subtotal: number;
  precioVenta1: number | null;
  precioVenta2: number | null;
  precioVenta3: number | null;
}

// ─── Pre-fill desde Orden de Compra ──────────────────────────
export interface PrefilledCompraOC {
  proveedorId: number;
  proveedorNombre: string;
  sucursalId: number;
  observaciones: string | null;
  lineas: {
    productoId: number;
    productoNombre: string;
    cantidad: number;
    costoUnitario: number;
  }[];
}

// ─── Opciones de producto para el dropdown ────────────────────
export interface ProductoOpcion {
  label: string;
  value: number;
  sku: string | null;
  ivaPorcentaje: number;
  costo: number | null;
  precio: number | null;
  precio2: number | null;
  precio3: number | null;
}
