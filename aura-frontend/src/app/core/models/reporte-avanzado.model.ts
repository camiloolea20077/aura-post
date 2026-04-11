export interface ReporteVentasCategoriaModel {
  categoriaId: number;
  categoriaNombre: string;
  totalVentas: number;
  totalUnidades: number;
  ingresos: number;
  costoEstimado: number;
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
  margenBrutoPeriodo: number;
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
