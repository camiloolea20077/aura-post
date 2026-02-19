// ─── Detalle ─────────────────────────────────────────────────
export interface ProductoComposicionModel {
  id: number;
  productoPadreId: number;
  productoPadreNombre: string;
  productoHijoId: number;
  productoHijoNombre: string;
  cantidad: number;
  tipo: TipoComposicion;
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
}

// ─── DTOs ────────────────────────────────────────────────────
export interface CreateProductoComposicionDto {
  productoPadreId: number;
  productoHijoId: number;
  cantidad: number;
  tipo: TipoComposicion;
}

export interface UpdateProductoComposicionDto {
  cantidad: number;
  tipo: TipoComposicion;
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
