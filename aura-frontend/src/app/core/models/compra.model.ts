// ─── Estados ──────────────────────────────────────────────────
export type EstadoCompra = 'RECIBIDA' | 'ANULADA';

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

// ─── Detalle completo (con detalles) ─────────────────────────
export interface CompraModel {
  id: number;
  empresaId: number;
  sucursalId: number;
  sucursalNombre: string;
  proveedorId: number;
  proveedorNombre: string;
  usuarioId: number | null;
  numeroCompra: string | null;
  fecha: string; // ISO LocalDateTime
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
  codigoLote: string | null;
  fechaVencimiento: string | null; // "YYYY-MM-DD"
  cantidad: number;
  costoUnitario: number;
  impuestoValor: number;
}

export interface CreateCompraDto {
  proveedorId: number;
  sucursalId: number;
  numeroCompra: string | null;
  fecha: string | null; // ISO LocalDateTime
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
  _id: string; // UUID local para trackBy
  productoId: number | null;
  productoNombre: string;
  manejaLotes: boolean;
  codigoLote: string | null;
  fechaVencimiento: Date | null;
  cantidad: number | null;
  costoUnitario: number | null;
  impuestoValor: number;
  // calculados
  subtotal: number;
}

// ─── Opciones de producto para el dropdown ────────────────────
export interface ProductoOpcion {
  label: string;
  value: number;
  manejaLotes: boolean;
  sku: string | null;
}
