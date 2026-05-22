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

// ─── Movimientos de caja (ingresos / egresos manuales) ────────
export type TipoMovimiento = 'INGRESO' | 'EGRESO';

export interface MovimientoCajaDto {
  id: number;
  tipo: TipoMovimiento;
  concepto: string | null;
  monto: number;
  fecha: string;
  usuarioNombre?: string;
  cuentaNumero?: string | null;
  terceroNombre?: string | null;
  metodoPago?: string;
  entregadoA?: string;
  comprobanteId?: number;
  numeroComprobante?: string;
}

export interface CreateMovimientoCajaDto {
  tipo: TipoMovimiento;
  concepto: string;
  monto: number;
  cuentaCobrarId?: number | null;
  cuentaPagarId?: number | null;
  metodoPago?: string;   // EFECTIVO | TRANSFERENCIA
  entregadoA?: string;   // opcional
}

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

export type EstadoLiquidacionTurno = 'SIN_LIQUIDAR' | 'PENDIENTE' | 'PAGADA';

export interface ComisionTurnoDto {
  tecnicoNombre: string;
  totalServicios: number;
  totalComision: number;
  estadoLiquidacion: EstadoLiquidacionTurno;
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

  // Movimientos manuales (ingresos / egresos)
  movimientos: MovimientoCajaDto[];
  totalIngresos: number;
  totalEgresos: number;

  // Comisiones generadas en el turno
  comisiones: ComisionTurnoDto[];
  totalComisiones: number;

  // Ventas a crédito del turno
  cantidadVentasCredito: number;
  totalVentasCredito: number;
  detalleVentasCredito: DetalleVentaCreditoItem[];

  // Diagnóstico: detalle de cada pago en efectivo del turno
  detalleEfectivo: DetalleEfectivoItem[];
}

export interface DetalleEfectivoItem {
  ventaId: number;
  consecutivo: number;
  montoEfectivo: number;
  totalVenta: number;
  estadoVenta: string;
}

export interface DetalleVentaCreditoItem {
  ventaId: number;
  prefijo: string;
  consecutivo: number;
  clienteNombre: string;
  clienteDocumento: string | null;
  totalVenta: number;
  montoAbonado: number;
  montoCredito: number;
}
