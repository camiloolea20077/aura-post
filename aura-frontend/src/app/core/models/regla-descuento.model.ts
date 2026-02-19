// ─── Tipos ───────────────────────────────────────────────────
export type TipoDescuento = 'PORCENTAJE' | 'MONTO';
export type AplicaA = 'TODO' | 'CATEGORIA' | 'PRODUCTO';

// ─── Detalle completo ────────────────────────────────────────
export interface ReglaDescuentoModel {
  id: number;
  empresaId: number;
  nombre: string;
  fechaInicio: string | null; // ISO LocalDateTime
  fechaFin: string | null;
  diasSemana: number[] | null; // [1..7] Lun=1 … Dom=7
  horaInicio: string | null; // "HH:mm:ss"
  horaFin: string | null;
  categoriaId: number | null;
  categoriaNombre: string | null;
  productoId: number | null;
  productoNombre: string | null;
  tipoDescuento: TipoDescuento;
  valor: number;
  activo: boolean;
}

// ─── Tabla ───────────────────────────────────────────────────
export interface ReglaDescuentoTableModel {
  id: number;
  nombre: string;
  categoriaNombre: string | null;
  productoNombre: string | null;
  tipoDescuento: TipoDescuento;
  valor: number;
  fechaInicio: string | null;
  fechaFin: string | null;
  activo: boolean;
}

// ─── DTOs ────────────────────────────────────────────────────
export interface CreateReglaDescuentoDto {
  nombre: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  diasSemana: number[] | null;
  horaInicio: string | null;
  horaFin: string | null;
  categoriaId: number | null;
  productoId: number | null;
  tipoDescuento: TipoDescuento;
  valor: number;
  activo: boolean;
}

export interface UpdateReglaDescuentoDto extends CreateReglaDescuentoDto {}

// ─── Pageable ─────────────────────────────────────────────────
export interface DescuentoPageableDto {
  page: number;
  rows: number;
  search?: string | null;
  order_by?: string | null;
  order?: string | null;
}

// ─── Constantes UI ────────────────────────────────────────────
export const DIAS_SEMANA = [
  { label: 'Lun', value: 1 },
  { label: 'Mar', value: 2 },
  { label: 'Mié', value: 3 },
  { label: 'Jue', value: 4 },
  { label: 'Vie', value: 5 },
  { label: 'Sáb', value: 6 },
  { label: 'Dom', value: 7 },
];

export const DIAS_LABELS: Record<number, string> = {
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
  6: 'Sáb',
  7: 'Dom',
};
