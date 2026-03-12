// ─── Estados ──────────────────────────────────────────────────
export type EstadoCompra = 'RECIBIDA' | 'ANULADA';

// ─── Opción de presentación para el dropdown de línea ─────────
export interface PresentacionOpcion {
  label: string; // "Caja x 100 (×100)"
  value: number; // id presentación
  factor: number; // factorConversion
  costo: number; // costo por presentación
  esDefaultCompra: boolean;
}

// ─── Detalle línea ────────────────────────────────────────────
export interface CompraDetalleModel {
  id: number;
  productoId: number;
  productoNombre: string;
  productoSku: string | null;
  loteId: number | null;
  codigoLote: string | null;
  cantidad: number;
  costoUnitario: number;
  impuestoValor: number;
  subtotalLinea: number;
}

// ─── Modelo completo ──────────────────────────────────────────
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
  subtotal: number;
  descuentoTotal: number;
  impuestosTotal: number;
  total: number;
  observaciones: string | null;
  estado: EstadoCompra;
  detalles: CompraDetalleModel[];
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
  presentacionId: number | null; // ← nuevo
  factorConversion: number; // ← nuevo (default 1)
  codigoLote: string | null;
  fechaVencimiento: string | null;
  cantidad: number;
  costoUnitario: number;
  impuestoValor: number;
}

export interface CreateCompraDto {
  proveedorId: number;
  sucursalId: number;
  numeroCompra: string | null;
  fecha: string | null;
  observaciones: string | null;
  detalles: CreateCompraDetalleDto[];
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
  manejaLotes: boolean;
  codigoLote: string | null;
  fechaVencimiento: Date | null;

  // Presentación
  presentacionId: number | null;
  presentacionNombre: string;
  factorConversion: number;
  presentacionesOpts: PresentacionOpcion[];

  cantidad: number | null;
  costoUnitario: number | null;
  ivaPorcentaje: number;
  impuestoValor: number;
  subtotal: number;
}

// ─── Opciones de producto para el dropdown ────────────────────
export interface ProductoOpcion {
  label: string;
  value: number;
  manejaLotes: boolean;
  sku: string | null;
  ivaPorcentaje: number;
}
