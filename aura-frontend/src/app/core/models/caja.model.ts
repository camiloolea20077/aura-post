// ─── Caja ─────────────────────────────────────────────────────
export interface CajaModel {
  id: number;
  sucursalId: number;
  sucursalNombre: string;
  nombre: string;
  activa: boolean;
}

export interface CajaTableModel {
  id: number;
  sucursalId: number;
  sucursalNombre: string;
  nombre: string;
  activa: boolean;
}

export interface CreateCajaDto {
  sucursalId: number;
  nombre: string;
  activa: boolean;
}

export interface UpdateCajaDto {
  nombre: string;
  activa: boolean;
}

export interface CajaPageableDto {
  page: number;
  rows: number;
  search?: string | null;
  order_by?: string | null;
  order?: string | null;
}

// ─── Turno ────────────────────────────────────────────────────
export type EstadoTurno = 'ABIERTA' | 'CERRADA';

export interface TurnoCajaModel {
  id: number;
  cajaId: number;
  cajaNombre: string;
  usuarioId: number;
  usuarioNombre: string;
  fechaApertura: string; // ISO
  fechaCierre: string | null;
  baseInicial: number;
  totalEfectivoSistema: number | null;
  totalEfectivoReal: number | null;
  diferencia: number | null;
  estado: EstadoTurno;
}

export interface TurnoCajaTableModel extends TurnoCajaModel {}

export interface AbrirTurnoDto {
  cajaId: number;
  baseInicial: number;
}

export interface CerrarTurnoDto {
  totalEfectivoReal: number;
}

export interface TurnoPageableDto {
  page: number;
  rows: number;
  search?: string | null;
  order_by?: string | null;
  order?: string | null;
}
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────

export interface VentaCategoriaDto {
  categoriaId: number;
  categoriaNombre: string;
  totalProductosVendidos: number;
  totalBruto: number;
  totalDescuentos: number;
  totalNeto: number;
}

export interface VentaMetodoPagoDto {
  metodoPago: string; // EFECTIVO | NEQUI | TARJETA
  totalPagos: number;
  totalMonto: number;
}

export interface ResumenTurnoDto {
  turnoId: number;
  cajaNombre: string;
  usuarioNombre: string;
  fechaApertura: string;
  baseInicial: number;
  estado: EstadoTurno;

  ventasPorCategoria: VentaCategoriaDto[];
  ventasPorMetodoPago: VentaMetodoPagoDto[];

  totalVentasBruto: number;
  totalDescuentos: number;
  totalImpuestos: number;
  totalNeto: number;
  totalTransacciones: number;

  // Disponible solo al cerrar
  totalEfectivoSistema: number | null;
  totalEfectivoReal: number | null;
  diferencia: number | null;
  totalEsperado: number | null;
}
