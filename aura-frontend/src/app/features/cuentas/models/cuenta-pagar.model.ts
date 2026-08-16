export type EstadoCuentaPagar = 'activa' | 'parcial' | 'pagada' | 'vencida';
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
  cuentaBancariaId: number | null;
  fechaPago: string;
  usuarioId: number;
  usuarioNombre: string;
  turnoCajaId: number | null;
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
  numeroFacturaExterno: string | null;
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
  numeroFacturaExterno: string | null;
  proveedorId: number | null;
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
  numeroFacturaExterno?: string | null;
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
  /** Cuenta bancaria de origen del abono (null si es efectivo). */
  cuentaBancariaId?: number | null;
  /**
   * Cuenta contable de la que sale el pago. Opcional: solo hace falta cuando no
   * hay caja abierta y el pago no sale de un banco — el administrador pagando
   * fuera del horario del punto de venta.
   */
  cuentaContableId?: number | null;
  fechaPago: string;
  turnoCajaId?: number | null;
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
