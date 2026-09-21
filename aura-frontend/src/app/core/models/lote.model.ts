// ─── Detalle ─────────────────────────────────────────────────
export interface LoteModel {
  id: number;
  productoId: number;
  productoNombre: string;
  sucursalId: number;
  sucursalNombre: string;
  codigoLote: string;
  fechaVencimiento: string | null; // ISO date "YYYY-MM-DD"
  stockActual: number;
  costoUnitario: number;
  activo: boolean;
}

// ─── Tabla ───────────────────────────────────────────────────
export interface LoteTableModel {
  id: number;
  productoId: number;
  productoNombre: string;
  sucursalId: number;
  sucursalNombre: string;
  codigoLote: string;
  fechaVencimiento: string | null;
  fechaFabricacion?: string | null;
  stockActual: number;
  costoUnitario: number;
  activo: boolean;
  unidadAbreviatura?: string | null;
  /** Compra que metió mercancía al lote; null en SIN-LOTE. */
  compraId?: number | null;
  compraNumero?: string | null;
  proveedorNombre?: string | null;
}

// ─── DTOs ────────────────────────────────────────────────────
/** Los lotes nacen con la compra: aquí solo se corrige código y vencimiento. */
export interface UpdateLoteDto {
  codigoLote: string;
  fechaVencimiento: string | null; // "YYYY-MM-DD"
  motivo: string;
}

// ─── Pageable ─────────────────────────────────────────────────
export interface LotePageableDto {
  page: number;
  rows: number;
  search?: string | null;
  order_by?: string | null;
  order?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────
export function diasParaVencer(fechaVencimiento: string | null): number | null {
  if (!fechaVencimiento) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vence = new Date(fechaVencimiento + 'T00:00:00');
  return Math.floor((vence.getTime() - hoy.getTime()) / 86_400_000);
}

export function estadoVencimiento(
  dias: number | null,
): 'vencido' | 'critico' | 'proximo' | 'ok' | 'sin-fecha' {
  if (dias === null) return 'sin-fecha';
  if (dias < 0) return 'vencido';
  if (dias <= 7) return 'critico';
  if (dias <= 30) return 'proximo';
  return 'ok';
}

// ─── Vencimientos ─────────────────────────────────────────────
export interface VencimientoLoteModel {
  loteId: number;
  productoId: number;
  productoNombre: string;
  productoSku: string | null;
  categoriaNombre: string | null;
  sucursalId: number;
  sucursalNombre: string;
  codigoLote: string;
  fechaVencimiento: string;
  /** Negativo = ya venció. */
  diasParaVencer: number;
  stockActual: number;
  unidadAbreviatura: string | null;
  costoUnitario: number;
  valorCosto: number;
  precioVenta: number;
  valorVenta: number;
}

/** Lo que Lotes le pasa a Mermas para abrir el formulario ya lleno. */
export interface MermaDesdeLotes {
  sucursalId: number;
  lineas: { productoId: number; loteId: number; cantidad: number }[];
}
