export interface PlanCuentaModel {
  id: number;
  codigo: string;
  nombre: string;
  tipo: 'ACTIVO' | 'PASIVO' | 'PATRIMONIO' | 'INGRESO' | 'GASTO' | 'COSTO' | 'ORDEN';
  naturaleza: 'DEBITO' | 'CREDITO';
  nivel: number;
  padreId: number | null;
  padreNombre?: string;
  activa: boolean;
  auxiliar: boolean;
  codigoDian?: string;
}

export interface CreatePlanCuentaDto {
  codigo: string;
  nombre: string;
  tipo: string;
  naturaleza: string;
  nivel: number;
  padreId?: number | null;
  auxiliar?: boolean;
  codigoDian?: string;
}

export interface AsientoDetalleModel {
  id: number;
  cuentaId: number;
  cuentaCodigo: string;
  cuentaNombre: string;
  cuentaTipo: string;
  descripcion: string;
  debito: number;
  credito: number;
}

export interface CreateAsientoDetalleDto {
  cuentaId: number;
  descripcion?: string;
  debito: number;
  credito: number;
}

export interface AsientoContableModel {
  id: number;
  numeroComprobante?: string;
  fecha: string;
  descripcion: string;
  tipoOrigen: string;
  origenId?: number;
  totalDebito: number;
  totalCredito: number;
  estado: string;
  createdAt: string;
  totalRows?: number;
  detalles?: AsientoDetalleModel[];
}

export interface CreateAsientoDto {
  fecha: string;
  descripcion: string;
  detalles: CreateAsientoDetalleDto[];
}

export interface EstadoResultadosLineaModel {
  tipo: string;
  codigo: string;
  nombre: string;
  saldo: number;
}

export interface EstadoResultadosModel {
  desde: string;
  hasta: string;
  ingresos: EstadoResultadosLineaModel[];
  costos: EstadoResultadosLineaModel[];
  gastos: EstadoResultadosLineaModel[];
  totalIngresos: number;
  totalCostos: number;
  totalGastos: number;
  utilidadBruta: number;
  utilidadNeta: number;
  margenBruto: number;
  margenNeto: number;
}

export interface LibroMayorLineaModel {
  fecha: string;
  numeroComprobante: string;
  descripcion: string;
  descripcionLinea?: string;
  tipoOrigen: string;
  debito: number;
  credito: number;
  saldoAcumulado: number;
}

export interface FlujoCajaLineaModel {
  fecha: string;
  concepto: string;
  tipo: 'INGRESO' | 'EGRESO';
  categoria: string;
  cuentaBanco: string;
  monto: number;
}

export interface FlujoCajaProyeccionModel {
  fechaVencimiento: string;
  tercero: string;
  referencia: string;
  saldo: number;
  tipo: 'CXC' | 'CXP';
}

export interface FlujoCajaModel {
  desde: string;
  hasta: string;
  saldoInicial: number;
  movimientos: FlujoCajaLineaModel[];
  totalIngresos: number;
  totalEgresos: number;
  saldoFinal: number;
  proyeccionCxC: FlujoCajaProyeccionModel[];
  proyeccionCxP: FlujoCajaProyeccionModel[];
  totalPorCobrar: number;
  totalPorPagar: number;
}

export interface BalanceGeneralModel {
  hasta: string;
  totalActivo: number;
  totalPasivo: number;
  totalPatrimonio: number;
  totalIngreso: number;
  totalGasto: number;
  totalCosto: number;
  utilidadNeta: number;
  ecuacionContable: number;
}
