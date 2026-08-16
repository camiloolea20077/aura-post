// ─── Obsequio ─────────────────────────────────────────────────
// Entrega de producto sin cobro. No genera ingreso: saca inventario contra
// gasto de promoción y, si aplica, causa el IVA por retiro de inventario.

export type EstadoObsequio = 'APROBADO' | 'ANULADO';

export type MotivoObsequio =
  | 'MUESTRA_COMERCIAL'
  | 'PROMOCION'
  | 'CORTESIA_CLIENTE'
  | 'DONACION'
  | 'OTRO';

export const MOTIVOS_OBSEQUIO: { label: string; value: MotivoObsequio }[] = [
  { label: 'Muestra comercial', value: 'MUESTRA_COMERCIAL' },
  { label: 'Promoción', value: 'PROMOCION' },
  { label: 'Cortesía a cliente', value: 'CORTESIA_CLIENTE' },
  { label: 'Donación', value: 'DONACION' },
  { label: 'Otro', value: 'OTRO' },
];

export interface ObsequioModel {
  id: number;
  sucursalId: number;
  sucursalNombre: string;
  terceroId: number | null;
  terceroNombre: string | null;
  usuarioNombre: string;
  fecha: string;
  motivo: MotivoObsequio;
  observacion: string | null;
  costoTotal: number;
  baseComercialTotal: number;
  ivaTotal: number;
  generaIva: boolean;
  estado: EstadoObsequio;
  detalles: ObsequioDetalleModel[];
}

export interface ObsequioTableModel {
  id: number;
  sucursalNombre: string;
  terceroNombre: string | null;
  fecha: string;
  motivo: MotivoObsequio;
  costoTotal: number;
  ivaTotal: number;
  estado: EstadoObsequio;
  totalRows: number;
}

export interface ObsequioDetalleModel {
  id: number;
  productoId: number;
  productoNombre: string;
  loteId: number | null;
  codigoLote: string | null;
  cantidad: number;
  costoUnitario: number;
  baseComercialUnitaria: number;
  ivaValor: number;
}

export interface CreateObsequioDto {
  sucursalId: number;
  terceroId?: number | null;
  motivo: MotivoObsequio;
  observacion?: string | null;
  generaIva: boolean;
  detalles: CreateObsequioDetalleDto[];
}

export interface CreateObsequioDetalleDto {
  productoId: number;
  loteId?: number | null;
  cantidad: number;
  /** Valor comercial unitario SIN IVA. Si se omite, el back lo deriva del precio. */
  baseComercialUnitaria?: number | null;
}

// ─── UI — línea en el formulario ──────────────────────────────
export interface ObsequioLineaUI {
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
  /** Base sin IVA; se precarga quitándole el IVA al precio de lista. */
  baseComercialUnitaria: number;
  ivaPorcentaje: number;
  subtotalCosto: number;
  subtotalIva: number;
  manejaLotes: boolean;
}

export interface ObsequioPageableDto {
  page: number;
  rows: number;
  search?: string | null;
  order_by?: string;
  order?: string;
}
