export interface PlanCuentaModel {
  id: number;
  codigo: string;
  nombre: string;
  tipo:
    | 'ACTIVO'
    | 'PASIVO'
    | 'PATRIMONIO'
    | 'INGRESO'
    | 'GASTO'
    | 'COSTO'
    | 'ORDEN';
  naturaleza: 'DEBITO' | 'CREDITO';
  nivel: number;
  padreId: number | null;
  padreNombre?: string;
  activa: boolean;
  auxiliar: boolean;
  /**
   * La cuenta puede elegirse como origen de un pago: caja, caja menor, bancos o
   * las cuentas puente de fondos entregados sin legalizar. Lo administra el
   * contador desde el plan de cuentas.
   */
  esMedioPago?: boolean;
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
  /** Se puede elegir como origen o destino de un pago (caja menor, bancos…). */
  esMedioPago?: boolean;
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
  terceroId?: number | null;
  terceroNombre?: string | null;
  centroCostoId?: number | null;
  centroCostoNombre?: string | null;
}

export interface CreateAsientoDetalleDto {
  /**
   * Nula solo en la línea de contrapartida (origen 'BANCO'): esa cuenta la
   * resuelve el backend a partir del origen de fondos declarado, para que no se
   * pueda acreditar la caja un pago que entró por transferencia.
   */
  cuentaId: number | null;
  /** MANUAL | CARTERA | BANCO. Por defecto MANUAL. */
  origen?: 'MANUAL' | 'CARTERA' | 'BANCO';
  descripcion?: string;
  debito: number;
  credito: number;
  terceroId?: number | null;
  centroCostoId?: number | null;
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
  // Cabecera de comprobante manual (null en asientos automáticos)
  tipoComprobante?: string | null;
  beneficiarioTerceroId?: number | null;
  beneficiarioNombre?: string | null;
  beneficiarioDireccion?: string | null;
  beneficiarioTelefono?: string | null;
  ciudad?: string | null;
  fechaVencimiento?: string | null;
  detalles?: AsientoDetalleModel[];
}

export interface CreateAsientoDto {
  fecha: string;
  descripcion: string;
  detalles: CreateAsientoDetalleDto[];
}

/** TipoComprobante: CD=Diario, CE=Egreso, RC=Ingreso/Recibo de caja. */
export type TipoComprobante = 'CD' | 'CE' | 'RC';

export interface CreateComprobanteDto {
  tipoComprobante: TipoComprobante;
  fecha: string;
  concepto: string;
  beneficiarioTerceroId?: number | null;
  beneficiarioNombre?: string | null;
  beneficiarioDireccion?: string | null;
  beneficiarioTelefono?: string | null;
  ciudad?: string | null;
  fechaVencimiento?: string | null;
  detalles: CreateAsientoDetalleDto[];
  aplicaciones?: AplicacionCarteraDto[];

  // ── Origen de fondos (obligatorio en CE y RC) ──
  // De dónde sale o entra la plata. Es lo que mete el comprobante en el cierre
  // de caja: sin esto el abono de cartera nacía sin turno y el efectivo se
  // movía sin aparecer en el arqueo de nadie.
  metodoPago?: string | null;
  turnoCajaId?: number | null;
  cuentaBancariaId?: number | null;
  cuentaContableId?: number | null;
  sucursalId?: number | null;
  /** La plata se movió del cajón otro día y ese arqueo ya cerró cuadrado. */
  cajaOtroDia?: boolean;
}

export interface AplicacionCarteraDto {
  tipo: 'CXC' | 'CXP';
  cuentaId: number;
  monto: number;
}

export interface SaldoInicialLineaDto {
  cuentaId: number;
  debito: number;
  credito: number;
  terceroId?: number | null;
}

export interface CreateSaldosInicialesDto {
  fechaApertura: string;
  cuentaAjusteId?: number | null;
  /** Si no cuadra, la diferencia va a patrimonio solo si el usuario lo confirma. */
  aceptarDiferencia?: boolean;
  lineas: SaldoInicialLineaDto[];
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

// ── Balance General profesional (Estado de Situación Financiera) ──────────
export interface LineaBalanceModel {
  codigo: string;
  nombre: string;
  saldo: number;
}

export interface GrupoBalanceModel {
  codigo: string;
  nombre: string;
  saldo: number;
  cuentas: LineaBalanceModel[];
}

export interface BalanceGeneralDetalladoModel {
  empresaNombre: string;
  nit: string;
  fechaCorte: string;
  activoCorriente: GrupoBalanceModel[];
  activoNoCorriente: GrupoBalanceModel[];
  pasivoCorriente: GrupoBalanceModel[];
  pasivoNoCorriente: GrupoBalanceModel[];
  patrimonio: GrupoBalanceModel[];
  totalActivoCorriente: number;
  totalActivoNoCorriente: number;
  totalActivo: number;
  totalPasivoCorriente: number;
  totalPasivoNoCorriente: number;
  totalPasivo: number;
  totalPatrimonio: number;
  totalPasivoPatrimonio: number;
  resultadoEjercicio: number;
  cuadra: boolean;
  diferencia: number;
}

// ─── Centro de Contabilidad (/contabilidad) ─────────────────────────
// GET contabilidad/dashboard?anio&mes — sale del mayor (CONTABILIZADO, sin CIERRE).
export interface ResultadoMesModel {
  anio: number;
  mes: number;
  ingresos: number;
  costos: number;
  gastos: number;
  /** Ingresos − costos − gastos. */
  utilidad: number;
}

export interface GrupoGastoModel {
  /** Cuenta de dos dígitos: 51, 52, 53, 54… */
  codigo: string;
  nombre: string;
  valor: number;
}

export interface EstadoContableModel {
  periodoEstado: 'ABIERTO' | 'CERRADO' | 'SIN_PERIODO';
  comprobantesMes: number;
  /** Borradores de todos los meses: bloquean el cierre. */
  comprobantesBorrador: number;
  conciliacionesAbiertas: number;
  cierreAnualAnio: number;
  cierreAnualEstado: 'NO_INICIADO' | 'PROVISIONADO' | 'CERRADO';
}

export interface DashboardContableModel {
  anio: number;
  mes: number;
  mesActual: ResultadoMesModel;
  mesAnterior: ResultadoMesModel;
  serie: ResultadoMesModel[];
  distribucionGastos: GrupoGastoModel[];
  estado: EstadoContableModel;
}

// ─── Documentos sin asiento (red del posting) ──────────────────────
// GET contabilidad/asientos/sin-asiento — vigentes 0 = falta en el mayor; >1 = duplicado.
export interface DocumentoSinAsientoModel {
  tipoOrigen: string;
  origenId: number;
  fecha: string;
  numero: string;
  vigentes: number;
}
