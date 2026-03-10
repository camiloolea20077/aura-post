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
}
