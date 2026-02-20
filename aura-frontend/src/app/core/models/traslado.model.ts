// ─── Traslado ──────────────────────────────────────────────────
export type EstadoTraslado = 'PENDIENTE' | 'COMPLETADO' | 'ANULADO';

export interface TrasladoModel {
  id: number;
  empresaId: number;
  sucursalOrigenId: number;
  sucursalOrigenNombre: string;
  sucursalDestinoId: number;
  sucursalDestinoNombre: string;
  usuarioId: number;
  usuarioNombre: string;
  fecha: string;
  observacion: string | null;
  estado: EstadoTraslado;
  detalles: TrasladoDetalleModel[];
}

export interface TrasladoTableModel {
  id: number;
  sucursalOrigenNombre: string;
  sucursalDestinoNombre: string;
  usuarioNombre: string;
  fecha: string;
  totalProductos: number;
  estado: EstadoTraslado;
  totalRows: number;
}

export interface TrasladoDetalleModel {
  id: number;
  productoId: number;
  productoNombre: string;
  productoSku: string | null;
  loteId: number | null;
  codigoLote: string | null;
  cantidad: number;
  costoUnitario: number;
}

export interface CreateTrasladoDto {
  sucursalOrigenId: number;
  sucursalDestinoId: number;
  observacion?: string | null;
  detalles: CreateTrasladoDetalleDto[];
}

export interface CreateTrasladoDetalleDto {
  productoId: number;
  loteId?: number | null;
  cantidad: number;
  costoUnitario: number;
}

export interface TrasladoPageableDto {
  page: number;
  rows: number;
  search?: string | null;
  order_by?: string;
  order?: string;
}

// ─── UI — línea en el formulario ──────────────────────────────
export interface TrasladoLineaUI {
  _id: string; // UUID para trackBy
  productoId: number | null;
  productoNombre: string;
  productoSku: string | null;
  stockOrigen: number; // stock disponible en sucursal origen
  manejaLotes: boolean;
  loteId: number | null;
  codigoLote: string | null;
  lotesDisponibles: LoteDisponible[];
  cantidad: number;
  costoUnitario: number;
}

export interface LoteDisponible {
  id: number;
  codigoLote: string;
  stockActual: number;
  fechaVencimiento: string | null;
}

// ─── Sucursal selector ────────────────────────────────────────
export interface SucursalSelectorModel {
  id: number;
  nombre: string;
}
