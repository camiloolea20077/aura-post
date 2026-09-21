import { ConsumoComponenteModel, OpcionPresentacion } from './producto.model';

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
  productoSku: string | null;
  loteId: number | null;
  codigoLote: string | null;
  cantidad: number;
  costoUnitario: number;
  baseComercialUnitaria: number;
  ivaValor: number;
  /** Si se registró en una presentación (1 Paca); cantidad sigue en unidades. */
  presentacionNombre?: string | null;
  cantidadPresentacion?: number | null;
  /** Si salió por receta: lo que se descontó de cada componente. */
  componentes?: ConsumoComponenteModel[];
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
  /** Si viene, cantidad y baseComercialUnitaria están en esa presentación. */
  productoPresentacionId?: number | null;
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
  /** Base sin IVA; se precarga quitándole el IVA al precio de lista. */
  baseComercialUnitaria: number;
  ivaPorcentaje: number;
  subtotalCosto: number;
  subtotalIva: number;
  /** Precio del producto por unidad, con IVA: base al volver a "Unidad". */
  precioProducto: number;
  /** 0 = unidad de inventario; si no, la presentación en que se escribe la cantidad. */
  presentacionId: number;
  presentaciones: OpcionPresentacion[];
  manejaLotes: boolean;
  /** Tiene receta: salen sus componentes y el costo lo calculan ellos. */
  esCompuesto: boolean;
  /** Consumo de cada componente por UNA unidad; se escala con la cantidad. */
  componentesPorUnidad: ConsumoComponenteModel[];
}

export interface ObsequioPageableDto {
  page: number;
  rows: number;
  search?: string | null;
  order_by?: string;
  order?: string;
}
