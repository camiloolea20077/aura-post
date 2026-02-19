// dashboard.model.ts

export interface DashboardDto {
  ventasHoy:            ResumenVentasDto;
  ventasMes:            ResumenVentasDto;
  totalComprasMes:      number;
  stockBajo:            ProductoStockBajoDto[];
  lotesProximosVencer:  LoteVencimientoDto[];
  ultimasVentas:        VentaRecienteDto[];
  topProductos:         TopProductoDto[];
  ultimosMovimientos:   MovimientoRecienteDto[];
}

export interface ResumenVentasDto {
  total:    number;
  cantidad: number;
  promedio: number;
}

export interface ProductoStockBajoDto {
  productoId:     number;
  productoNombre: string;
  productoSku:    string;
  sucursalId:     number;
  sucursalNombre: string;
  stockActual:    number;
  stockMinimo:    number;
}

export interface LoteVencimientoDto {
  loteId:           number;
  codigoLote:       string;
  productoNombre:   string;
  sucursalNombre:   string;
  fechaVencimiento: string;
  stockActual:      number;
  diasRestantes:    number;
}

export interface VentaRecienteDto {
  id:           number;
  prefijo:      string;
  consecutivo:  number;
  clienteNombre: string;
  totalPagar:   number;
  fechaEmision: string;
  estadoVenta:  string;
}

export interface TopProductoDto {
  productoId:     number;
  productoNombre: string;
  productoSku:    string;
  totalVendido:   number;
  totalIngresos:  number;
}

export interface MovimientoRecienteDto {
  id:             number;
  tipoMovimiento: string;
  productoNombre: string;
  sucursalNombre: string;
  cantidad:       number;
  saldoNuevo:     number;
  createdAt:      string;
}

export interface VentasSemanaDto {
  fecha:     string;
  diaNombre: string;
  total:     number;
  cantidad:  number;
}

export interface MetodoPagoDto {
  metodo_pago:     string;
  total:          number;
  cantidadVentas: number;
}