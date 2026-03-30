import { IFilterTable } from '../../shared/utils/filter-table';

// ─── Técnico simple (usuario) ─────────────────────────────────
export interface TecnicoDto {
  id: number;
  nombreCompleto: string;
}

// ─── Comisión Config ──────────────────────────────────────────
export interface ComisionConfigModel {
  id: number;
  empresaId: number;
  modalidad: ModalidadComision;
  productoId: number | null;
  productoNombre: string | null;
  categoriaId: number | null;
  categoriaNombre: string | null;
  tecnicoId: number | null;
  tecnicoNombre: string | null;
  tipo: TipoComision;
  porcentajeTecnico: number;
  porcentajeNegocio: number;
  activo: boolean;
}

export interface ComisionConfigTableModel {
  id: number;
  modalidad: ModalidadComision;
  productoNombre: string | null;
  categoriaNombre: string | null;
  tecnicoNombre: string | null;
  tipo: TipoComision;
  porcentajeTecnico: number;
  porcentajeNegocio: number;
  activo: boolean;
}

export interface CreateComisionConfigDto {
  modalidad: ModalidadComision;
  productoId?: number | null;
  categoriaId?: number | null;
  tecnicoId?: number | null;
  tipo: TipoComision;
  porcentajeTecnico: number;
  porcentajeNegocio: number;
}

export interface UpdateComisionConfigDto extends CreateComisionConfigDto {
  activo?: boolean;
}

export type TipoComision = 'PORCENTAJE' | 'VALOR_FIJO';
export type ModalidadComision = 'SERVICIO' | 'VENTA';

export interface ComisionConfigFilterParams {
  search?: string | null;
  activo?: boolean | null;
}

export type ComisionConfigPageableDto = IFilterTable<ComisionConfigFilterParams>;

// ─── Comisión Venta ───────────────────────────────────────────
export interface ComisionVentaModel {
  id: number;
  ventaId: number;
  ventaDetalleId: number;
  productoNombre: string;
  tecnicoNombre: string;
  valorTotal: number;
  porcentajeTecnico: number;
  valorTecnico: number;
  valorNegocio: number;
  liquidacionId: number | null;
  createdAt: string;
}

// ─── Liquidación ──────────────────────────────────────────────
export interface ComisionLiquidacionModel {
  id: number;
  empresaId: number;
  tecnicoId: number;
  tecnicoNombre: string;
  fechaDesde: string;
  fechaHasta: string;
  totalServicios: number;
  valorTotal: number;
  estado: EstadoLiquidacion;
  observaciones: string | null;
  fechaPago: string | null;
  createdAt: string;
  detalles?: ComisionVentaModel[];
}

export interface ComisionLiquidacionTableModel {
  id: number;
  tecnicoNombre: string;
  fechaDesde: string;
  fechaHasta: string;
  totalServicios: number;
  valorTotal: number;
  estado: EstadoLiquidacion;
  fechaPago: string | null;
}

export interface CreateLiquidacionDto {
  tecnicoId: number;
  fechaDesde: string;
  fechaHasta: string;
  observaciones?: string | null;
}

export interface MarcarPagadaDto {
  fechaPago: string;
  metodoPago: string;
  cuentaBancariaId?: number | null;
}

export interface LiquidacionFilterParams {
  estado?: EstadoLiquidacion | null;
  tecnicoId?: number | null;
}

export type LiquidacionPageableDto = IFilterTable<LiquidacionFilterParams>;

export type EstadoLiquidacion = 'PENDIENTE' | 'PAGADA';

// ─── Reporte técnico ──────────────────────────────────────────
export interface ReporteTecnicoItem {
  tecnicoId: number;
  tecnicoNombre: string;
  totalServicios: number;
  valorPendiente: number;
}
