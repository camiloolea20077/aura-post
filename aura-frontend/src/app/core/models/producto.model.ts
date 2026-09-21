// ─── Detalle completo (getById) ──────────────────────────────
export interface ProductoModel {
  id: number;
  empresaId: number;
  categoriaId: number | null;
  categoriaNombre: string | null;
  marcaId: number | null;
  marcaNombre: string | null;
  unidadMedidaBaseId: number;
  unidadMedidaNombre: string;
  sku: string | null;
  codigoBarras: string | null;
  nombre: string;
  descripcion: string | null;
  imagenUrl: string | null;
  tipoProducto: TipoProducto;
  usoProducto: UsoProducto;
  manejaInventario: boolean;
  manejaLotes: boolean;
  manejaSerial: boolean;
  mesesGarantia?: number | null;
  permitirStockNegativo: boolean;
  costo: number;
  precio: number;
  precio2: number | null;
  precio3: number | null;
  ivaPorcentaje: number;
  ivaIncluido: boolean;
  impoconsumo: number;
  activo: boolean;
  visibleEnPos: boolean;
  /** false = el POS solo ofrece sus presentaciones. */
  vendePorUnidad?: boolean;
  categoriaContableId: number | null;
  cuentaIngresoId: number | null;
  cuentaCostoId: number | null;
  cuentaInventarioId: number | null;
}
export interface PresentacionFormItem {
  id?: number; // null = nueva (no guardada aún)
  nombre: string;
  factor: number;
  codigoBarras: string | null;
  precio: number;
  activo: boolean;
  _editando: boolean; // controla modo edición inline
  _esNueva: boolean; // para saber si hacer POST o PUT
}
// ─── Tabla paginada ──────────────────────────────────────────
export interface ProductoTableModel {
  id: number;
  sku: string | null;
  nombre: string;
  codigoBarras: string | null;
  categoriaNombre: string | null;
  marcaNombre: string | null;
  tipoProducto: TipoProducto;
  usoProducto: UsoProducto;
  precio: number;
  costo: number;
  activo: boolean;
  ivaPorcentaje: number;
  /** Abreviatura de la unidad de inventario (kg, und). */
  unidadAbreviatura?: string | null;
  manejaLotes?: boolean;
  manejaSerial?: boolean;
}

// ─── DTOs ────────────────────────────────────────────────────
export interface CreateProductoDto {
  nombre: string;
  sku: string | null;
  codigoBarras: string | null;
  descripcion: string | null;
  imagenUrl: string | null;
  categoriaId: number | null;
  marcaId: number | null;
  unidadMedidaBaseId: number;
  tipoProducto: TipoProducto;
  usoProducto: UsoProducto;
  manejaInventario: boolean;
  manejaLotes: boolean;
  manejaSerial: boolean;
  mesesGarantia?: number | null;
  permitirStockNegativo: boolean;
  costo: number;
  precio: number;
  precio2?: number | null;
  precio3?: number | null;
  ivaPorcentaje: number;
  ivaIncluido: boolean;
  impoconsumo: number;
  activo: boolean;
  visibleEnPos: boolean;
  /** false = el POS solo ofrece sus presentaciones. */
  vendePorUnidad?: boolean;
  /** null = hereda de la categoría "General". */
  categoriaContableId: number | null;
  /** Overrides excepcionales; null = hereda de la categoría. */
  cuentaIngresoId: number | null;
  cuentaCostoId: number | null;
  cuentaInventarioId: number | null;
}

export interface UpdateProductoDto extends CreateProductoDto {}

// ─── PageableDto (POST body — igual al backend) ───────────────
export interface PageableDto {
  page: number;
  rows: number;
  search?: string | null;
  order_by?: string | null;
  order?: string | null;
  // Filtros avanzados
  codigoBarras?: string | null;
  categoriaId?: number | null;
  marcaId?: number | null;
  tipoProducto?: string | null;
  activo?: boolean | null;
  precioMin?: number | null;
  precioMax?: number | null;
  // El back lee los filtros por `params` (mapa), no por campos sueltos.
  params?: { uso?: string | null } | null;
}

// ─── Enum tipo producto ───────────────────────────────────────
export type TipoProducto = 'ESTANDAR' | 'KIT' | 'PESABLE' | 'SERVICIO';

export const TIPO_PRODUCTO_OPTIONS: { label: string; value: TipoProducto }[] = [
  { label: 'Estándar', value: 'ESTANDAR' },
  { label: 'Kit', value: 'KIT' },
  { label: 'Pesable', value: 'PESABLE' },
  { label: 'Servicio', value: 'SERVICIO' },
];

// ─── Uso del producto ─────────────────────────────────────────
// Eje distinto del tipo: la harina es PESABLE e INSUMO a la vez.
export type UsoProducto = 'VENTA' | 'INSUMO' | 'AMBOS';

export const USO_PRODUCTO_OPTIONS: {
  label: string;
  value: UsoProducto;
  desc: string;
}[] = [
  { label: 'Venta', value: 'VENTA', desc: 'Se vende en el POS' },
  {
    label: 'Insumo',
    value: 'INSUMO',
    desc: 'Entra en recetas y no aparece en el POS',
  },
  {
    label: 'Venta e insumo',
    value: 'AMBOS',
    desc: 'Se vende suelto y también es componente de recetas',
  },
];

// ─── Operaciones de inventario (merma, obsequio) ──────────────
/** Producto del buscador de inventario: incluye insumos ocultos del POS. */
export interface ProductoInventarioModel {
  manejaSerial?: boolean;
  id: number;
  nombre: string;
  sku: string | null;
  codigoBarras: string | null;
  stockActual: number;
  costo: number;
  precio: number;
  ivaPorcentaje: number;
  manejaLotes: boolean;
  manejaInventario: boolean;
  permitirStockNegativo: boolean;
  /** Tiene receta: lo que sale del inventario son sus componentes. */
  esCompuesto: boolean;
  unidadAbreviatura: string | null;
  usoProducto: UsoProducto;
}

/** Componente que sale del inventario por un producto con receta. */
export interface ConsumoComponenteModel {
  detalleId?: number | null;
  productoId: number;
  productoNombre: string;
  productoSku: string | null;
  unidadAbreviatura: string | null;
  /** En unidad base de stock del componente. */
  cantidad: number;
  costoUnitario: number;
  costoTotal: number;
  /** Solo en la vista previa; null = sin inventario en la sucursal. */
  stockDisponible?: number | null;
  permitirStockNegativo?: boolean;
  suficiente?: boolean;
}

// ─── Presentación elegible en una línea ───────────────────────
/**
 * Opción de una línea de compra, merma u obsequio: la unidad de inventario
 * (id 0, factor 1) o una presentación del producto (Paca, factor 25).
 */
export interface OpcionPresentacion {
  id: number;
  nombre: string;
  factor: number;
  precio: number | null;
  costo: number | null;
}

// ─── Pasar a unidad ───────────────────────────────────────────
export interface CambioUnidadStockModel {
  sucursalNombre: string;
  antes: number;
  despues: number;
}

/** Vista previa de pasar la base del producto a una presentación más pequeña. */
export interface CambioUnidadPreviewModel {
  productoId: number;
  productoNombre: string;
  presentacionId: number;
  presentacionNombre: string;
  /** Cuántas unidades pequeñas caben en la base actual. */
  factor: number;
  unidadActualId: number | null;
  unidadActualNombre: string;
  unidadSugeridaId: number | null;
  nombrePresentacionSugerido: string;
  precioAntes: number;
  precioDespues: number;
  costoAntes: number;
  costoDespues: number;
  stock: CambioUnidadStockModel[];
  movimientosKardex: number;
  lotes: number;
  lineasVenta: number;
  recetas: number;
  preciosLista: number;
  avisos: string[];
  bloqueos: string[];
  puedeAplicar: boolean;
}

export interface CambioUnidadRequest {
  presentacionId: number;
  unidadMedidaId: number;
  nombrePresentacion: string;
}

// ─── Contabilidad del producto ────────────────────────────────
export interface CategoriaContableProductoModel {
  id: number;
  nombre: string;
  tipo: 'BIEN' | 'SERVICIO' | 'INSUMO' | 'ACTIVO_FIJO';
  cuentaIngresoId: number | null;
  cuentaIngreso: string | null;
  cuentaInventarioId: number | null;
  cuentaInventario: string | null;
  cuentaCostoId: number | null;
  cuentaCosto: string | null;
  activo: boolean;
}
