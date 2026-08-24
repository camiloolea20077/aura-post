// ─── Estados ──────────────────────────────────────────────────
export type EstadoCompra = 'RECIBIDA' | 'ANULADA';
export type TipoDocumentoCompra = 'FACTURA_COMPRA' | 'NOTA_DEBITO' | 'NOTA_CREDITO' | 'RECIBO';

/**
 * Qué se hace con la plata de una nota crédito de compra.
 *
 * - `CRUCE_CXP`: baja la deuda de la factura que corrige.
 * - `DEVOLUCION_DINERO`: el proveedor devuelve el dinero (entra a caja/banco).
 * - `SALDO_A_FAVOR`: queda como crédito con el proveedor.
 */
export type DestinoNotaCredito =
  | 'CRUCE_CXP'
  | 'DEVOLUCION_DINERO'
  | 'SALDO_A_FAVOR';

/** Factura de compra sobre la que aún se puede emitir nota crédito. */
export interface CompraAcreditableModel {
  id: number;
  numeroCompra: string | null;
  fecha: string;
  total: number;
  formaPago: FormaPago | null;
  /** Lo que aún se le debe al proveedor por esa factura; 0 si ya se pagó. */
  saldoPendiente: number;
  totalRows?: number;
}

/** Filtros del selector de facturas acreditables (van en `params`). */
export interface CompraAcreditableFiltroDto {
  proveedorId: number;
  sucursalId?: number | null;
}

/** Lo que queda por acreditar de un producto de una factura de compra. */
export interface CompraAcreditableItemModel {
  productoId: number;
  productoNombre: string;
  productoSku: string | null;
  cantidadDisponible: number;
  costoUnitario: number;
  ivaPct: number | null;
  /** Descuento de la línea original: la NC acredita lo que se cobró, no el bruto. */
  descuentoPct: number | null;
}

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
  /** Se declaró que la plata ya había salido del cajón otro día. */
  salidaCajaOtroDia?: boolean;
  tipoDocumento: TipoDocumentoCompra | null;
  /** Factura que corrige la nota crédito (solo NOTA_CREDITO). */
  compraOrigenId?: number | null;
  compraOrigenNumero?: string | null;
  destinoNotaCredito?: DestinoNotaCredito | null;
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
  tipoDocumento: TipoDocumentoCompra;
  /** Factura que corrige, cuando la fila es una nota crédito. */
  compraOrigenId: number | null;
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
  /**
   * Cuenta contable de la que sale el pago. Opcional: solo hace falta cuando la
   * plata no sale de la caja del punto ni de un banco — el caso del
   * administrador que compra sin turno abierto. Si viene, manda sobre el resto.
   */
  cuentaContableId?: number | null;
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
  /**
   * Por qué un documento de fecha anterior se carga a la caja de hoy. El
   * backend lo exige solo cuando excede la ventana de gracia de la empresa y
   * el pago va por caja.
   */
  motivoRetroactivo?: string | null;

  /**
   * La plata ya salió del cajón otro día y ese arqueo ya se cerró. Registra el
   * documento contablemente contra CAJA, sin tocar ningún arqueo.
   */
  salidaCajaOtroDia?: boolean;


  tipoDocumento?: TipoDocumentoCompra | null;

  /**
   * Factura de compra que corrige la nota crédito. El backend lo exige cuando
   * `tipoDocumento` es NOTA_CREDITO: una NC anula mercancía de una factura
   * concreta, no del proveedor en abstracto.
   */
  compraOrigenId?: number | null;
  /** Qué se hace con la plata de la nota crédito. */
  destinoNotaCredito?: DestinoNotaCredito | null;

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
