import { ConsumoComponenteModel } from './producto.model';
import { ObsequioLineaUI } from './obsequio.model';

// ─── Consumo interno ──────────────────────────────────────────
// El negocio usa su propio inventario (aseo, mantenimiento, cafetería). Saca
// stock contra la cuenta de gasto del concepto y, si aplica, causa el IVA por
// retiro de inventario para uso propio.

export type EstadoConsumoInterno = 'APROBADO' | 'ANULADO';

export interface ConceptoConsumoInternoModel {
  id: number;
  nombre: string;
  /** Null = la cuenta por defecto de la configuración contable (5195). */
  cuentaId: number | null;
  cuentaCodigo: string | null;
  cuentaNombre: string | null;
  generaIva: boolean;
  activo: boolean;
}

export interface SaveConceptoConsumoInternoDto {
  nombre: string;
  cuentaId: number | null;
  generaIva: boolean;
  activo: boolean;
}

export interface ConsumoInternoModel {
  id: number;
  sucursalId: number;
  sucursalNombre: string;
  conceptoId: number;
  conceptoNombre: string;
  responsableTerceroId: number | null;
  responsableNombre: string | null;
  usuarioNombre: string;
  fecha: string;
  observacion: string | null;
  costoTotal: number;
  baseComercialTotal: number;
  ivaTotal: number;
  generaIva: boolean;
  estado: EstadoConsumoInterno;
  detalles: ConsumoInternoDetalleModel[];
}

export interface ConsumoInternoTableModel {
  id: number;
  sucursalNombre: string;
  conceptoNombre: string;
  responsableNombre: string | null;
  fecha: string;
  costoTotal: number;
  ivaTotal: number;
  estado: EstadoConsumoInterno;
  totalRows: number;
}

export interface ConsumoInternoDetalleModel {
  id: number;
  productoId: number;
  productoNombre: string;
  productoSku: string | null;
  unidadAbreviatura: string | null;
  loteId: number | null;
  codigoLote: string | null;
  cantidad: number;
  costoUnitario: number;
  baseComercialUnitaria: number;
  ivaValor: number;
  presentacionNombre?: string | null;
  cantidadPresentacion?: number | null;
  componentes?: ConsumoComponenteModel[];
}

export interface CreateConsumoInternoDto {
  sucursalId: number;
  conceptoId: number;
  responsableTerceroId?: number | null;
  observacion?: string | null;
  generaIva: boolean;
  detalles: CreateConsumoInternoDetalleDto[];
}

export interface CreateConsumoInternoDetalleDto {
  productoId: number;
  productoPresentacionId?: number | null;
  loteId?: number | null;
  cantidad: number;
  /** Valor comercial unitario SIN IVA. Si se omite, el back lo deriva del precio. */
  baseComercialUnitaria?: number | null;
}

/** La línea del formulario es la misma del obsequio: producto, lote, presentación y receta. */
export type ConsumoInternoLineaUI = ObsequioLineaUI;

export interface ConsumoInternoPageableDto {
  page: number;
  rows: number;
  search?: string | null;
}
