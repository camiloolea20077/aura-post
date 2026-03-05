export type EstadoCuentaCobrar = 'activa' | 'pagada' | 'vencida';
export type MetodoPago = 'efectivo' | 'transferencia' | 'consignacion' | 'cheque';

export interface AbonoCobrarModel {
  id: number;
  cuentaCobrarId: number;
  monto: number;
  metodoPago: MetodoPago;
  referencia: string | null;
  fechaPago: string;
  usuarioId: number;
  usuarioNombre: string;
  turnoCajaId: number | null;
  createdAt: string;
}

export interface CuentaCobrarModel {
  id: number;
  empresaId: number;
  terceroId: number;
  clienteNombre: string;
  clienteDocumento: string;
  ventaId: number | null;
  numeroCuenta: string;
  fechaEmision: string;
  fechaVencimiento: string | null;
  totalDeuda: number;
  totalAbonado: number;
  saldoPendiente: number;
  estado: EstadoCuentaCobrar;
  observaciones: string | null;
  createdAt: string;
  abonos: AbonoCobrarModel[];
}

export interface CuentaCobrarTableModel {
  id: number;
  numeroCuenta: string;
  clienteNombre: string;
  clienteDocumento: string;
  fechaEmision: string;
  fechaVencimiento: string | null;
  totalDeuda: number;
  totalAbonado: number;
  saldoPendiente: number;
  estado: EstadoCuentaCobrar;
  totalRows: number;
}

export interface CreateCuentaCobrarDto {
  clienteId: number;
  ventaId?: number | null;
  totalDeuda: number;
  fechaEmision: string;
  fechaVencimiento?: string | null;
  observaciones?: string | null;
}

export interface UpdateCuentaCobrarDto {
  fechaVencimiento?: string | null;
  observaciones?: string | null;
}

export interface CreateAbonoCobrarDto {
  monto: number;
  metodoPago: MetodoPago;
  referencia?: string | null;
  fechaPago: string;
  turnoCajaId?: number | null;
}

export interface CuentaCobrarFilters {
  fechaDesde?: string | null;
  fechaHasta?: string | null;
  clienteId?: number | null;
  estado?: EstadoCuentaCobrar | null;
}

export interface ResumenCuentasCobrar {
  totalCuentas: number;
  totalDeuda: number;
  totalAbonado: number;
  saldoPendiente: number;
  cantidadActivas: number;
  cantidadPagadas: number;
  cantidadVencidas: number;
}
