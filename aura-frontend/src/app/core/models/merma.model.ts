// ─── Motivo Merma ─────────────────────────────────────────────
export interface MotivoMermaModel {
  id: number;
  empresaId: number;
  nombre: string;
  afectaContabilidad: boolean;
}

export interface MotivoMermaTableModel {
  id: number;
  nombre: string;
  afectaContabilidad: boolean;
  totalRows: number;
}

export interface CreateMotivoMermaDto {
  nombre: string;
  afectaContabilidad: boolean;
}

// ─── Merma ────────────────────────────────────────────────────
export type EstadoMerma = 'APROBADA' | 'ANULADA';

export interface MermaModel {
  id: number;
  sucursalId: number;
  sucursalNombre: string;
  usuarioId: number;
  usuarioNombre: string;
  motivoId: number;
  motivoNombre: string;
  fecha: string;
  observacion: string | null;
  costoTotal: number;
  estado: EstadoMerma;
  detalles: MermaDetalleModel[];
}

export interface MermaTableModel {
  id: number;
  sucursalNombre: string;
  usuarioNombre: string;
  motivoNombre: string;
  fecha: string;
  costoTotal: number;
  estado: EstadoMerma;
  totalRows: number;
}

export interface MermaDetalleModel {
  id: number;
  productoId: number;
  productoNombre: string;
  productoSku: string;
  loteId: number | null;
  codigoLote: string | null;
  cantidad: number;
  costoUnitario: number;
  subtotalCosto: number;
}

export interface CreateMermaDto {
  sucursalId: number;
  motivoId: number;
  observacion?: string | null;
  detalles: CreateMermaDetalleDto[];
}

export interface CreateMermaDetalleDto {
  productoId: number;
  loteId?: number | null;
  cantidad: number;
  costoUnitario: number;
}

// ─── UI — línea en el formulario ──────────────────────────────
export interface MermaLineaUI {
  _id: string;
  productoId: number | null;
  productoNombre: string;
  productoSku: string;
  stockActual: number;
  loteId: number | null;
  codigoLote: string | null;
  lotesDisponibles: {
    id: number;
    codigoLote: string;
    stockActual: number;
    fechaVencimiento: string;
  }[];
  cantidad: number;
  costoUnitario: number;
  subtotalCosto: number;
  manejaLotes: boolean;
}

export interface MermaPageableDto {
  page: number;
  rows: number;
  search?: string | null;
  order_by?: string;
  order?: string;
}
