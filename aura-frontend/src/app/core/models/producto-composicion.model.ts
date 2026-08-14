// ─── Detalle ─────────────────────────────────────────────────
export interface ProductoComposicionModel {
  id: number;
  productoPadreId: number;
  productoPadreNombre: string;
  productoHijoId: number;
  productoHijoNombre: string;
  /** Derivada por el backend: consumo en unidad base del hijo por 1 unidad del padre. */
  cantidad: number;
  tipo: TipoComposicion;
  cantidadReceta: number;
  unidadMedidaId: number | null;
  unidadMedidaAbreviatura: string | null;
  productoPresentacionId: number | null;
  factorUnidad: number;
  mermaPorcentaje: number;
  orden: number | null;
  nota: string | null;
}

// ─── Tabla ───────────────────────────────────────────────────
export interface ProductoComposicionTableModel {
  id: number;
  productoPadreId: number;
  productoPadreNombre: string;
  productoHijoId: number;
  productoHijoNombre: string;
  cantidad: number;
  tipo: TipoComposicion;
  cantidadReceta: number;
  unidadMedidaAbreviatura: string | null;
  factorUnidad: number;
  mermaPorcentaje: number;
  rendimiento: number;
}

// ─── DTOs ────────────────────────────────────────────────────
export interface CreateProductoComposicionDto {
  productoPadreId: number;
  productoHijoId: number;
  cantidad: number;
  tipo: TipoComposicion;
  unidadMedidaId?: number | null;
  productoPresentacionId?: number | null;
  factorUnidad?: number | null;
  mermaPorcentaje?: number | null;
  orden?: number | null;
  nota?: string | null;
}

export interface UpdateProductoComposicionDto {
  cantidad: number;
  tipo: TipoComposicion;
  unidadMedidaId?: number | null;
  productoPresentacionId?: number | null;
  factorUnidad?: number | null;
  mermaPorcentaje?: number | null;
  orden?: number | null;
  nota?: string | null;
}

// ═══════════════════════════════════════════════════════════════
// Receta completa — reemplaza el alta línea por línea
// ═══════════════════════════════════════════════════════════════

/** Una fila por producto con receta, no por ingrediente. */
export interface RecetaResumenTableModel {
  productoPadreId: number;
  productoPadreNombre: string;
  productoPadreSku: string | null;
  tipo: TipoComposicion;
  rendimiento: number;
  totalComponentes: number;
  /** Costo plano (no explota subrecetas). El fino lo da el endpoint de costeo. */
  costoEstimado: number | null;
  costoActual: number | null;
  precio: number | null;
}

/** Línea de receta como la devuelve el backend, lista para la grilla. */
export interface RecetaComponenteDetalleModel {
  id: number;
  productoHijoId: number;
  productoHijoNombre: string;
  productoHijoSku: string | null;

  cantidadReceta: number;
  unidadMedidaId: number | null;
  unidadMedidaNombre: string | null;
  unidadMedidaAbreviatura: string | null;

  productoPresentacionId: number | null;
  productoPresentacionNombre: string | null;
  factorUnidad: number;
  mermaPorcentaje: number;

  /** Derivada: consumo por 1 unidad del padre. */
  cantidad: number;
  unidadBaseAbreviatura: string | null;

  manejaInventario: boolean;
  stockDisponible: number;

  orden: number | null;
  nota: string | null;
}

export interface RecetaModel {
  productoPadreId: number;
  productoPadreNombre: string;
  tipo: TipoComposicion;
  /** Unidades que salen de un lote (ej: 40 panes). */
  rendimiento: number;
  unidadBaseAbreviatura: string | null;
  componentes: RecetaComponenteDetalleModel[];
}

/** Una línea al guardar. La cantidad va por LOTE, no por unidad. */
export interface RecetaComponenteDto {
  id?: number | null;
  productoHijoId: number;
  cantidadReceta: number;
  unidadMedidaId?: number | null;
  productoPresentacionId?: number | null;
  factorUnidad?: number | null;
  mermaPorcentaje?: number | null;
  orden?: number | null;
  nota?: string | null;
}

/** Reemplazo total: lo que no venga en `componentes` se borra. */
export interface GuardarRecetaDto {
  tipo: TipoComposicion;
  rendimiento?: number | null;
  componentes: RecetaComponenteDto[];
}

// ─── Costeo ──────────────────────────────────────────────────
export interface RecetaCosteoLineaModel {
  productoHijoId: number;
  productoHijoNombre: string;
  cantidad: number;
  cantidadLote: number;
  costoUnitario: number;
  costoTotal: number;
  participacion: number;
  costoDerivadoDeReceta: boolean;
  advertencia: string | null;
}

export interface RecetaCosteoModel {
  productoPadreId: number;
  productoPadreNombre: string;
  rendimiento: number;
  lineas: RecetaCosteoLineaModel[];
  costoLote: number;
  costoUnitario: number;
  costoActual: number | null;
  precioVenta: number | null;
  utilidadUnitaria: number | null;
  margenPorcentaje: number | null;
  /** true si algún componente no tenía costo: el total está subestimado. */
  costoIncompleto: boolean;
}

// ─── PageableDto (POST body) ──────────────────────────────────
export interface ComposicionPageableDto {
  page: number;
  rows: number;
  search?: string | null;
  order_by?: string | null;
  order?: string | null;
}

// ─── Tipos ───────────────────────────────────────────────────
export type TipoComposicion = 'KIT' | 'RECETA';

export const TIPO_COMPOSICION_OPTIONS: {
  label: string;
  value: TipoComposicion;
  icon: string;
  desc: string;
}[] = [
  {
    label: 'Kit',
    value: 'KIT',
    icon: 'pi-th-large',
    desc: 'Agrupa productos para vender juntos. El stock se descuenta de cada componente.',
  },
  {
    label: 'Receta',
    value: 'RECETA',
    icon: 'pi-list',
    desc: 'Producto elaborado con insumos. El stock de los ingredientes se consume al producir.',
  },
];
