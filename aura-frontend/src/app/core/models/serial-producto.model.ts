// ─── Estados ──────────────────────────────────────────────────
export type EstadoSerial = 'DISPONIBLE' | 'VENDIDO' | 'GARANTIA';

type TagSeverity =
  | 'success'
  | 'secondary'
  | 'info'
  | 'warn'
  | 'danger'
  | 'contrast'
  | undefined;

// ─── Detalle ─────────────────────────────────────────────────
export interface SerialProductoModel {
  id: number;
  productoId: number;
  productoNombre: string;
  sucursalId: number;
  sucursalNombre: string;
  serial: string;
  estado: EstadoSerial;
}

// ─── Tabla ───────────────────────────────────────────────────
export interface SerialProductoTableModel {
  id: number;
  productoId: number;
  productoNombre: string;
  sucursalId: number;
  sucursalNombre: string;
  serial: string;
  estado: EstadoSerial;
}

// ─── DTOs ────────────────────────────────────────────────────
export interface CreateSerialProductoDto {
  productoId: number;
  sucursalId: number;
  serial: string;
  estado: EstadoSerial;
}

// ─── Pageable ─────────────────────────────────────────────────
export interface SerialPageableDto {
  page: number;
  rows: number;
  search?: string | null;
  order_by?: string | null;
  order?: string | null;
}

// ─── UI helpers ───────────────────────────────────────────────
export const ESTADO_SERIAL_OPTIONS: { label: string; value: EstadoSerial }[] = [
  { label: 'Disponible', value: 'DISPONIBLE' },
  { label: 'Vendido', value: 'VENDIDO' },
  { label: 'Garantía', value: 'GARANTIA' },
];

export const ESTADO_SEVERITY: Record<EstadoSerial, TagSeverity> = {
  DISPONIBLE: 'success',
  VENDIDO: 'info',
  GARANTIA: 'warn',
};
