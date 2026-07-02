export interface CierreContableDto {
  fechaDesde: string;
  fechaHasta: string;

  // Ventas
  cantidadVentas: number;
  totalVentasBruto: number;
  totalDescuentos: number;
  totalImpuestos: number;
  totalVentasNeto: number;
  totalVentasSinIva: number;
  ventasBrutasConDisponible: number;

  // Compras
  cantidadCompras: number;
  totalComprasNeto: number;
  totalComprasSinIva: number;
  totalIvaCompras: number;

  // COGS (costo real de lo vendido)
  costoVentas: number;
  productosSinCosto: number;
  valorVentasSinCosto: number;

  // Comisiones
  cantidadComisiones: number;
  totalComisionesTecnicos: number;

  // Mermas
  cantidadMermas: number;
  totalMermas: number;

  // Resultados (P&L sin IVA con COGS real)
  utilidadBruta: number;
  utilidadOperativa: number;
  utilidadNeta: number;
  margenBruto: number;
  margenOperativo: number;
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

  // Posición de efectivo (saldos del mayor caja/bancos 11xx)
  disponible: SaldoDisponibleItem[];
  totalDisponible: number;
}

export interface SaldoDisponibleItem {
  codigo: string;
  nombre: string;
  saldo: number;
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
