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
  manejaInventario: boolean;
  manejaLotes: boolean;
  manejaSerial: boolean;
  permitirStockNegativo: boolean;
  costo: number;
  precio: number;
  precio2: number | null;
  precio3: number | null;
  ivaPorcentaje: number;
  impoconsumo: number;
  activo: boolean;
  visibleEnPos: boolean;
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
  precio: number;
  costo: number;
  activo: boolean;
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
  manejaInventario: boolean;
  manejaLotes: boolean;
  manejaSerial: boolean;
  permitirStockNegativo: boolean;
  costo: number;
  precio: number;
  precio2?: number | null;
  precio3?: number | null;
  ivaPorcentaje: number;
  impoconsumo: number;
  activo: boolean;
  visibleEnPos: boolean;
}

export interface UpdateProductoDto extends CreateProductoDto {}

// ─── PageableDto (POST body — igual al backend) ───────────────
export interface PageableDto {
  page: number;
  rows: number;
  search?: string | null;
  order_by?: string | null;
  order?: string | null;
}

// ─── Enum tipo producto ───────────────────────────────────────
export type TipoProducto = 'ESTANDAR' | 'KIT' | 'PESABLE' | 'SERVICIO';

export const TIPO_PRODUCTO_OPTIONS: { label: string; value: TipoProducto }[] = [
  { label: 'Estándar', value: 'ESTANDAR' },
  { label: 'Kit', value: 'KIT' },
  { label: 'Pesable', value: 'PESABLE' },
  { label: 'Servicio', value: 'SERVICIO' },
];
