export type EstadoCuentaPagar = 'activa' | 'pagada' | 'vencida';
export type MetodoPago =
  | 'efectivo'
  | 'transferencia'
  | 'consignacion'
  | 'cheque';

export interface AbonoPagarModel {
  id: number;
  cuentaPagarId: number;
  monto: number;
  metodoPago: MetodoPago;
  referencia: string | null;
  banco: string | null;
  fechaPago: string;
  usuarioId: number;
  usuarioNombre: string;
  createdAt: string;
}

export interface CuentaPagarModel {
  id: number;
  empresaId: number;
  terceroId: number;
  proveedorNombre: string;
  proveedorDocumento: string;
  compraId: number | null;
  numeroCuenta: string;
  fechaEmision: string;
  fechaVencimiento: string | null;
  totalDeuda: number;
  totalAbonado: number;
  saldoPendiente: number;
  estado: EstadoCuentaPagar;
  observaciones: string | null;
  createdAt: string;
  abonos: AbonoPagarModel[];
}

export interface CuentaPagarTableModel {
  id: number;
  numeroCuenta: string;
  proveedorNombre: string;
  proveedorDocumento: string;
  fechaEmision: string;
  fechaVencimiento: string | null;
  totalDeuda: number;
  totalAbonado: number;
  saldoPendiente: number;
  estado: EstadoCuentaPagar;
  totalRows: number;
}

export interface CreateCuentaPagarDto {
  proveedorId: number;
  compraId?: number | null;
  totalDeuda: number;
  fechaEmision: string;
  fechaVencimiento?: string | null;
  observaciones?: string | null;
}

export interface UpdateCuentaPagarDto {
  fechaVencimiento?: string | null;
  observaciones?: string | null;
}

export interface CreateAbonoPagarDto {
  monto: number;
  metodoPago: MetodoPago;
  referencia?: string | null;
  banco?: string | null;
  fechaPago: string;
}

export interface CuentaPagarFilters {
  fechaDesde?: string | null;
  fechaHasta?: string | null;
  proveedorId?: number | null;
  params: {
    estado?: EstadoCuentaPagar | null;
  };
}

export interface ResumenCuentasPagar {
  totalCuentas: number;
  totalDeuda: number;
  totalAbonado: number;
  saldoPendiente: number;
  cantidadActivas: number;
  cantidadPagadas: number;
  cantidadVencidas: number;
}
