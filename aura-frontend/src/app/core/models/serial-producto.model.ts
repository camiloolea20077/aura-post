// ─── Estados ──────────────────────────────────────────────────
export type EstadoSerial =
  | 'DISPONIBLE'
  | 'VENDIDO'
  | 'GARANTIA'
  | 'EN_GARANTIA'
  | 'DEVUELTO_PROVEEDOR'
  | 'MERMA'
  | 'OBSEQUIADO'
  | 'CONSUMO_INTERNO';

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
  costo?: number | null;
  fechaIngreso?: string | null;
  garantiaClienteHasta?: string | null;
  compraNumero?: string | null;
}

// ─── Trazabilidad ────────────────────────────────────────────
export interface SerialEventoModel {
  serialId: number;
  fecha: string;
  tipo: string;
  documento: string;
  tercero: string | null;
  sucursal: string | null;
  estadoDocumento: string | null;
}

export interface SerialTrazaModel {
  serialId: number;
  serial: string;
  productoId: number;
  productoNombre: string;
  sucursalNombre: string;
  estado: EstadoSerial;
  costo: number | null;
  fechaIngreso: string | null;
  garantiaClienteHasta: string | null;
  eventos: SerialEventoModel[];
}

export interface SerialBuscadoModel {
  serialId: number;
  serial: string;
  productoId: number;
  productoNombre: string;
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
  { label: 'En garantía', value: 'EN_GARANTIA' },
  { label: 'Devuelto al proveedor', value: 'DEVUELTO_PROVEEDOR' },
  { label: 'Merma', value: 'MERMA' },
  { label: 'Obsequiado', value: 'OBSEQUIADO' },
  { label: 'Consumo interno', value: 'CONSUMO_INTERNO' },
];

export const ESTADO_SEVERITY: Record<EstadoSerial, TagSeverity> = {
  DISPONIBLE: 'success',
  VENDIDO: 'info',
  GARANTIA: 'warn',
  EN_GARANTIA: 'warn',
  DEVUELTO_PROVEEDOR: 'secondary',
  MERMA: 'danger',
  OBSEQUIADO: 'secondary',
  CONSUMO_INTERNO: 'secondary',
};

export function etiquetaEstadoSerial(estado: string): string {
  return ESTADO_SERIAL_OPTIONS.find((o) => o.value === estado)?.label ?? estado;
}
