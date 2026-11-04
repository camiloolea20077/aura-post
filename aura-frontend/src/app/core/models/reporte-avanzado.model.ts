export interface ReporteVentasCategoriaModel {
  categoriaId: number;
  categoriaNombre: string;
  totalVentas: number;
  totalUnidades: number;
  /** Total cobrado con IVA. */
  ingresos: number;
  /** Venta sin IVA, después de descuentos: base de la utilidad. */
  ventaNeta: number;
  /** Costo congelado al vender. */
  costoEstimado: number;
  /** ventaNeta − costoEstimado. */
  margenBruto: number;
}

export interface ReporteTopProductoModel {
  productoId: number;
  productoNombre: string;
  sku: string;
  categoriaNombre: string;
  cantidadVendida: number;
  ingresos: number;
  precioPromedio: number;
  numeroPedidos: number;
}

export interface ReporteVentasVendedorModel {
  usuarioId: number;
  vendedorNombre: string;
  totalVentas: number;
  ingresos: number;
  ticketPromedio: number;
  descuentoTotal: number;
}

export interface ReporteMargenesProductoModel {
  productoId: number;
  productoNombre: string;
  sku: string;
  categoriaNombre: string;
  precioVenta: number;
  costo: number;
  margenBruto: number;
  margenPorcentaje: number;
  cantidadVendida: number;
  ingresoTotal: number;
  ventaNeta: number;
  costoTotal: number;
  utilidad: number;
}

export interface ReporteRotacionInventarioModel {
  productoId: number;
  productoNombre: string;
  sku: string;
  categoriaNombre: string;
  stockActual: number;
  stockMinimo: number;
  unidadesVendidas: number;
  diasSinMovimiento: number;
  rotacion: number;
  estadoStock: 'CRITICO' | 'BAJO' | 'NORMAL' | 'ALTO';
}

export interface ReporteLineaMovimientoCajaModel {
  fecha: string;
  tipo: 'INGRESO' | 'EGRESO';
  concepto: string;
  monto: number;
  cajaNombre: string;
  usuarioNombre: string;
}

export interface ReporteMovimientosCajaModel {
  totalIngresos: number;
  totalEgresos: number;
  saldoNeto: number;
  movimientos: ReporteLineaMovimientoCajaModel[];
}

export interface ReporteResumenAvanzadoModel {
  totalVentasPeriodo: number;
  totalVentasPeriodoAnterior: number;
  variacionVentas: number;
  totalComprasPeriodo: number;
  /** Utilidad bruta: ventaNetaPeriodo − costoPeriodo. */
  margenBrutoPeriodo: number;
  /** Venta sin IVA, con descuentos, contado y crédito. */
  ventaNetaPeriodo: number;
  costoPeriodo: number;
  cantidadTransacciones: number;
  ticketPromedio: number;
  clientesNuevos: number;
  clientesRecurrentes: number;
  topCategoria: string;
  topProducto: string;
  topVendedor: string;
  ventasPorDia: Array<{ dia: string; total: number }>;
  ventasPorMetodoPago: Array<{ metodoPago: string; total: number }>;
}

// ── Utilidad en ventas ──────────────────────────────────────────────

export type AgrupacionUtilidad = 'PRODUCTO' | 'CATEGORIA' | 'VENDEDOR' | 'CLIENTE' | 'MES';
export type FormaUtilidad = 'TODAS' | 'CONTADO' | 'CREDITO';

export interface ReporteUtilidadFiltro {
  desde: string;
  hasta: string;
  agrupar: AgrupacionUtilidad;
  forma: FormaUtilidad;
}

/** Una fila: un producto, categoría, vendedor, cliente o mes. */
export interface ReporteUtilidadFilaModel {
  clave: string;
  nombre: string;
  /** SKU del producto o identificación del cliente. */
  detalle: string | null;
  ventas: number;
  cantidad: number;
  /** Venta sin IVA, después de descuentos. */
  ventaNeta: number;
  /** Costo promedio congelado al vender. */
  costo: number;
  utilidad: number;
  /** Utilidad / venta neta × 100. */
  margenVenta: number;
  /** Utilidad / costo × 100. */
  margenCosto: number;
  lineasSinCosto: number;
  lineasBajoCosto: number;
}

export interface ReporteUtilidadModel {
  ventas: number;
  ventaNeta: number;
  costo: number;
  utilidad: number;
  margenVenta: number;
  margenCosto: number;
  ventaNetaCredito: number;
  utilidadCredito: number;
  /** Lo que los clientes aún deben de las ventas del período. */
  saldoPorCobrar: number;
  lineasSinCosto: number;
  lineasBajoCosto: number;
  filas: ReporteUtilidadFilaModel[];
}

/** Una venta a crédito del período: su utilidad y lo que falta por cobrar. */
export interface ReporteUtilidadCreditoModel {
  ventaId: number;
  /** Prefijo-consecutivo de la venta. */
  documento: string;
  /** Cuenta por cobrar que generó (CC-…). */
  numeroCuenta: string | null;
  fecha: string;
  clienteNombre: string;
  clienteDocumento: string | null;
  ventaNeta: number;
  costo: number;
  utilidad: number;
  totalVenta: number;
  abonado: number;
  porCobrar: number;
  /** activa, pagada, castigada… */
  estadoCartera: string | null;
}
