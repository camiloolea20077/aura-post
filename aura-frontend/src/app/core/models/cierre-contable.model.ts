export interface CierreContableDto {
  fechaDesde: string;
  fechaHasta: string;

  // Ventas
  cantidadVentas: number;
  totalVentasBruto: number;
  totalDescuentos: number;
  totalImpuestos: number;
  totalVentasNeto: number;

  // Compras
  cantidadCompras: number;
  totalComprasNeto: number;

  // Comisiones
  cantidadComisiones: number;
  totalComisionesTecnicos: number;

  // Mermas
  cantidadMermas: number;
  totalMermas: number;

  // Resultados
  utilidadBruta: number;
  utilidadNeta: number;
  margenBruto: number;
  margenNeto: number;

  // CxC
  cxcTotalDeuda: number;
  cxcSaldoPendiente: number;
  cxcCantidadActivas: number;
  cxcCantidadVencidas: number;

  // CxP
  cxpTotalDeuda: number;
  cxpSaldoPendiente: number;
  cxpCantidadActivas: number;
  cxpCantidadVencidas: number;

  // Posición neta
  posicionNeta: number;

  // Movimientos de caja (internos / POS)
  totalIngresos: number;
  totalEgresos: number;
  cantidadIngresos: number;
  cantidadEgresos: number;
  detalleMovimientos: MovimientoCierreItem[];

  // Gastos del período
  cantidadGastos: number;
  totalGastosDeducibles: number;
  totalGastosNoDeducibles: number;
  totalGastos: number;
}

export interface ReporteIvaDto {
  fechaDesde: string;
  fechaHasta: string;
  ivaVentas: number;
  cantidadVentas: number;
  ivaCompras: number;
  cantidadCompras: number;
  ivaADeclararOPagarAlEstado: number;
}

export interface MovimientoCierreItem {
  tipo: 'INGRESO' | 'EGRESO';
  concepto: string | null;
  monto: number;
  fecha: string;
  cajaNombre: string;
  usuarioNombre: string;
}
