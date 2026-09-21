import { ConsumoComponenteModel, OpcionPresentacion } from './producto.model';

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
  /** Si se registró en una presentación (1 Paca); cantidad sigue en unidades. */
  presentacionNombre?: string | null;
  cantidadPresentacion?: number | null;
  /** Si salió por receta: lo que se descontó de cada componente. */
  componentes?: ConsumoComponenteModel[];
}

export interface CreateMermaDto {
  sucursalId: number;
  motivoId: number;
  observacion?: string | null;
  detalles: CreateMermaDetalleDto[];
}

export interface CreateMermaDetalleDto {
  productoId: number;
  /** Si viene, cantidad está en esa presentación; costoUnitario sigue por unidad. */
  productoPresentacionId?: number | null;
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
  unidadAbreviatura: string | null;
  stockActual: number;
  loteId: number | null;
  codigoLote: string | null;
  lotesDisponibles: {
    id: number;
    codigoLote: string;
    stockActual: number;
    fechaVencimiento: string;
    diasParaVencer?: number | null;
    etiqueta?: string;
  }[];
  /** Stock del producto, para volver a él al quitar el lote elegido. */
  stockProducto?: number;
  /** Producto con serial: uno por unidad, elegidos de los disponibles. */
  manejaSerial?: boolean;
  serialIds?: number[];
  cantidad: number;
  costoUnitario: number;
  subtotalCosto: number;
  /** 0 = unidad de inventario; si no, la presentación en que se escribe la cantidad. */
  presentacionId: number;
  presentaciones: OpcionPresentacion[];
  manejaLotes: boolean;
  /** Tiene receta: salen sus componentes y el costo lo calculan ellos. */
  esCompuesto: boolean;
  /** Consumo de cada componente por UNA unidad; se escala con la cantidad. */
  componentesPorUnidad: ConsumoComponenteModel[];
}

export interface MermaPageableDto {
  page: number;
  rows: number;
  search?: string | null;
  order_by?: string;
  order?: string;
}
