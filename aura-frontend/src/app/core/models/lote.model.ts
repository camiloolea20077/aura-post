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
  stockActual: number;
  costoUnitario: number;
  activo: boolean;
}

// ─── DTOs ────────────────────────────────────────────────────
export interface CreateLoteDto {
  productoId: number;
  sucursalId: number;
  codigoLote: string;
  fechaVencimiento: string | null; // "YYYY-MM-DD"
  stockActual: number;
  costoUnitario: number;
  activo: boolean;
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
