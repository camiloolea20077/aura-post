// ─── Dashboard ────────────────────────────────────────────────────
export interface CarteraDashboardModel {
  totalCartera: number;
  carteraVencida: number;
  carteraPorVencer: number;
  recaudoMes: number;
  clientesConMora: number;
  clientesBloqueados: number;
  solicitudesPendientes: number;
  edad0a30: number;
  edad31a60: number;
  edad61a90: number;
  edadMas90: number;
  alertasVencidas: CuentaVencidaAlertaModel[];
}

// ─── Alerta cuenta vencida ────────────────────────────────────────
export interface CuentaVencidaAlertaModel {
  cuentaId: number;
  numeroCuenta: string;
  terceroId: number;
  terceroNombre: string;
  terceroDocumento: string;
  saldoPendiente: number;
  fechaVencimiento: string;
  diasVencida: number;
  estadoCredito: string | null;
  scoreCrediticio: number;
  ultimaGestion: string | null;
  fechaUltimaGestion: string | null;
}

// ─── Clientes con cartera ─────────────────────────────────────────
export interface ClienteCarteraModel {
  terceroId: number;
  terceroNombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
  telefono: string | null;
  email: string | null;
  creditoId: number | null;
  cupoCreditoActual: number | null;
  saldoCartera: number;
  saldoDisponible: number;
  estadoCredito: string | null;
  nivelRiesgo: string | null;
  scoreCrediticio: number;
  plazoDias: number | null;
  totalVencido: number;
  diasMoraMaximo: number;
  documentosVencidos: number;
  ultimaGestion: string | null;
  fechaUltimaGestion: string | null;
}

// ─── Edades de cartera ────────────────────────────────────────────
export interface EdadCarteraModel {
  terceroId: number;
  terceroNombre: string;
  numeroDocumento: string;
  corriente: number;
  dias31a60: number;
  dias61a90: number;
  mas90dias: number;
  total: number;
}

// ─── Validación de venta a crédito ───────────────────────────────
export interface ValidacionCreditoModel {
  permitido: boolean;
  requiereAutorizacion: boolean;
  motivoBloqueo: string | null;
  cupoActual: number | null;
  saldoCartera: number | null;
  saldoDisponible: number | null;
  montoSolicitado: number;
  excedente: number;
  diasMoraMaximo: number;
  diasMoraTolerancia: number;
  estadoCredito: string | null;
  /** Aprobación vigente que permite pasar el cupo. */
  solicitudAutorizadaId: number | null;
  /** Solicitud enviada que sigue sin respuesta. */
  solicitudPendienteId: number | null;
  autorizacion: string | null;
}

// ─── DTOs de creación ─────────────────────────────────────────────
export interface CreateTerceroCreditoDto {
  terceroId: number;
  cupoCreditoInicial: number;
  plazoDias?: number;
  estadoCredito?: string;
  requiereAutorizacion?: boolean;
  diasMoraTolerancia?: number;
}

export interface CreateGestionCobroDto {
  terceroId: number;
  cuentaCobrarId?: number | null;
  tipoGestion: string;
  resultado?: string | null;
  nota?: string | null;
  fechaPromesaPago?: string | null;
  montoPrometido?: number | null;
}

// ─── Opciones UI ──────────────────────────────────────────────────
export type TabCartera = 'dashboard' | 'agenda' | 'autorizaciones' | 'clientes' | 'edades' | 'alertas' | 'recibos' | 'acuerdos';

export const TIPOS_GESTION = [
  { label: 'Llamada',      value: 'LLAMADA' },
  { label: 'Email',        value: 'EMAIL' },
  { label: 'Visita',       value: 'VISITA' },
  { label: 'Nota interna', value: 'NOTA' },
  { label: 'Acuerdo pago', value: 'ACUERDO_PAGO' },
  { label: 'Mensaje',      value: 'MENSAJE' },
];

export const RESULTADOS_GESTION = [
  { label: 'Contactado',     value: 'CONTACTADO' },
  { label: 'No contestó',    value: 'NO_CONTESTO' },
  { label: 'Promesa de pago',value: 'PROMESA_PAGO' },
  { label: 'Renuente',       value: 'RENUENTE' },
  { label: 'Pagado',         value: 'PAGADO' },
];

export const ESTADOS_CREDITO: { label: string; value: string; color: string }[] = [
  { label: 'Activo',      value: 'ACTIVO',      color: '#10b981' },
  { label: 'Suspendido',  value: 'SUSPENDIDO',  color: '#f59e0b' },
  { label: 'Bloqueado',   value: 'BLOQUEADO',   color: '#ef4444' },
  { label: 'En estudio',  value: 'EN_ESTUDIO',  color: '#6366f1' },
];

export const NIVELES_RIESGO: { label: string; value: string; color: string }[] = [
  { label: 'Bajo',    value: 'BAJO',    color: '#10b981' },
  { label: 'Medio',   value: 'MEDIO',   color: '#f59e0b' },
  { label: 'Alto',    value: 'ALTO',    color: '#ef4444' },
  { label: 'Crítico', value: 'CRITICO', color: '#7f1d1d' },
];

// ─── Ficha del cliente ────────────────────────────────────────────
export interface FichaClienteModel {
  terceroId: number;
  nombre: string;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  municipio: string | null;
  creditoId: number | null;
  cupoCredito: number | null;
  plazoDias: number | null;
  estadoCredito: string | null;
  nivelRiesgo: string | null;
  scoreCrediticio: number | null;
  diasMoraTolerancia: number | null;
  requiereAutorizacion: boolean | null;
}

export interface FichaResumenModel {
  saldoTotal: number;
  saldoVencido: number;
  saldoPorVencer: number;
  facturasAbiertas: number;
  facturasVencidas: number;
  diasMoraMaximo: number;
  cupoDisponible: number | null;
  anticipoDisponible: number;
  recaudado90Dias: number;
  promedioDiasPago: number | null;
  ultimoPagoFecha: string | null;
  ultimoPagoMonto: number | null;
  edadPorVencer: number;
  edad1a30: number;
  edad31a60: number;
  edad61a90: number;
  edadMas90: number;
}

export interface FichaFacturaModel {
  id: number;
  numeroCuenta: string;
  ventaId: number | null;
  numeroVenta: string | null;
  fechaEmision: string;
  fechaVencimiento: string | null;
  totalDeuda: number;
  totalAbonado: number;
  saldoPendiente: number;
  /** Positivo = días vencida; negativo = días que faltan. */
  diasVencida: number;
  /** Acuerdo de pago vivo; el vencimiento mostrado es el de su próxima cuota. */
  acuerdoId: number | null;
  acuerdoNumero: string | null;
}

export interface FichaPagoModel {
  tipo: 'ABONO' | 'CRUCE_ANTICIPO';
  id: number;
  fecha: string;
  monto: number;
  metodoPago: string | null;
  referencia: string | null;
  cuentaCobrarId: number;
  numeroCuenta: string;
  reciboCajaId: number | null;
  reciboNumero: string | null;
  usuarioNombre: string | null;
}

export interface ReciboCajaTableModel {
  id: number;
  numero: string;
  terceroId: number;
  terceroNombre: string;
  terceroDocumento: string;
  fechaPago: string;
  valorRecibido: number;
  valorAplicado: number;
  valorAnticipo: number;
  metodoPago: string;
  referencia: string | null;
  estado: 'ACTIVO' | 'ANULADO';
  facturas: number;
  usuarioNombre: string | null;
}

export interface FichaGestionModel {
  id: number;
  tipoGestion: string;
  resultado: string | null;
  nota: string | null;
  fechaPromesaPago: string | null;
  montoPrometido: number | null;
  estadoPromesa: EstadoPromesa | null;
  montoPagadoPromesa: number | null;
  numeroCuenta: string | null;
  usuarioNombre: string | null;
  createdAt: string;
}

export type EstadoPromesa = 'PENDIENTE' | 'CUMPLIDA' | 'INCUMPLIDA' | 'CANCELADA';

export const ESTADOS_PROMESA: Record<EstadoPromesa, { label: string; clase: string }> = {
  PENDIENTE: { label: 'Promesa pendiente', clase: 'warn' },
  CUMPLIDA: { label: 'Promesa cumplida', clase: 'ok' },
  INCUMPLIDA: { label: 'Promesa incumplida', clase: 'danger' },
  CANCELADA: { label: 'Reemplazada', clase: 'muted' },
};

// ─── Agenda del cobrador ──────────────────────────────────────────
export interface PromesaAgendaModel {
  gestionId: number;
  terceroId: number;
  terceroNombre: string;
  telefono: string | null;
  fechaPromesaPago: string;
  montoPrometido: number;
  montoPagado: number;
  estadoPromesa: EstadoPromesa;
  cuentaCobrarId: number | null;
  numeroCuenta: string | null;
  nota: string | null;
  usuarioNombre: string | null;
  createdAt: string;
  /** Positivo = días de atraso; negativo = días que faltan. */
  dias: number;
  saldoCliente: number;
}

export interface FacturaAgendaModel {
  cuentaCobrarId: number;
  numeroCuenta: string;
  terceroId: number;
  terceroNombre: string;
  telefono: string | null;
  fechaVencimiento: string;
  saldoPendiente: number;
  diasParaVencer: number;
}

export interface ClienteAgendaModel {
  terceroId: number;
  terceroNombre: string;
  telefono: string | null;
  facturasVencidas: number;
  saldoVencido: number;
  diasMoraMaximo: number;
  ultimaGestion: string | null;
  ultimoResultado: string | null;
}

export interface AgendaCobroModel {
  resumen: {
    promesasHoy: number;
    montoPromesasHoy: number;
    promesasIncumplidas: number;
    montoPromesasIncumplidas: number;
    facturasPorVencer: number;
    saldoPorVencer: number;
    clientesSinGestion: number;
    saldoSinGestion: number;
    promesasCumplidasMes: number;
    promesasResueltasMes: number;
  };
  promesasHoy: PromesaAgendaModel[];
  promesasIncumplidas: PromesaAgendaModel[];
  promesasProximas: PromesaAgendaModel[];
  porVencer: FacturaAgendaModel[];
  vencidosSinGestion: ClienteAgendaModel[];
}

export interface FichaAnticipoModel {
  id: number;
  fecha: string;
  monto: number;
  saldo: number;
  metodoPago: string | null;
  observaciones: string | null;
  reciboNumero: string | null;
}

export interface FichaClienteCarteraModel {
  cliente: FichaClienteModel;
  resumen: FichaResumenModel;
  facturas: FichaFacturaModel[];
  pagos: FichaPagoModel[];
  recibos: ReciboCajaTableModel[];
  gestiones: FichaGestionModel[];
  anticipos: FichaAnticipoModel[];
  historialCredito: FichaHistorialCreditoModel[];
  acuerdos: AcuerdoPagoModel[];
}

export interface FichaHistorialCreditoModel {
  id: number;
  tipoEvento: string;
  cupoAnterior: number | null;
  cupoNuevo: number | null;
  scoreAnterior: number | null;
  scoreNuevo: number | null;
  motivo: string | null;
  usuarioNombre: string | null;
  reglaNombre: string | null;
  createdAt: string;
}

// ─── Recibo de caja multi-factura ─────────────────────────────────
export interface CreateReciboCajaDto {
  terceroId: number;
  valorRecibido: number;
  metodoPago: string;
  referencia: string | null;
  cuentaContableId: number | null;
  turnoCajaId: number | null;
  sucursalId: number | null;
  cajaOtroDia: boolean;
  fechaPago: string;
  observaciones: string | null;
  aplicaciones: { cuentaCobrarId: number; monto: number }[];
}

export interface ReciboCajaModel extends Omit<ReciboCajaTableModel, 'facturas'> {
  cajaOtroDia: boolean;
  anticipoId: number | null;
  observaciones: string | null;
  motivoAnulacion: string | null;
  anuladoAt: string | null;
  createdAt: string;
  aplicaciones: {
    cuentaCobrarId: number;
    numeroCuenta: string;
    fechaVencimiento: string | null;
    saldoAnterior: number;
    monto: number;
    saldoDespues: number;
  }[];
}

export const METODOS_RECIBO: { label: string; value: string; icon: string }[] = [
  { label: 'Efectivo', value: 'EFECTIVO', icon: 'pi-money-bill' },
  { label: 'Transferencia', value: 'TRANSFERENCIA', icon: 'pi-send' },
  { label: 'Consignación', value: 'CONSIGNACION', icon: 'pi-building' },
  { label: 'Tarjeta', value: 'TARJETA', icon: 'pi-credit-card' },
  { label: 'Cheque', value: 'CHEQUE', icon: 'pi-file' },
];

// ─── Tablero gerencial ────────────────────────────────────────────
export interface TableroMesModel {
  mes: string;
  corte: string;
  saldoTotal: number;
  alDia: number;
  dias1a30: number;
  dias31a60: number;
  dias61a90: number;
  mas90: number;
  vencido: number;
  recaudado: number;
  ventasCredito: number;
  ventas90: number;
  cobrable: number;
  recaudoCobrable: number;
  dso: number | null;
  efectividad: number | null;
}

export interface TableroDeudorModel {
  terceroId: number;
  terceroNombre: string;
  numeroDocumento: string | null;
  facturas: number;
  saldo: number;
  vencido: number;
  diasMoraMaximo: number;
  scoreCrediticio: number | null;
  pctTotal: number | null;
}

export interface TableroGrupoModel {
  nombre: string;
  valor: number;
  vencido: number | null;
  cantidad: number;
}

export interface TableroCarteraModel {
  kpis: {
    saldoTotal: number;
    saldoTotalAnterior: number | null;
    vencido: number;
    pctVencido: number | null;
    pctVencidoAnterior: number | null;
    dso: number | null;
    dsoAnterior: number | null;
    recaudoMes: number;
    recaudoMesAnterior: number | null;
    efectividadMes: number | null;
    efectividadMesAnterior: number | null;
    clientesConSaldo: number;
    clientesEnMora: number;
    promesasCumplidasMes: number;
    promesasResueltasMes: number;
    concentracionTop5: number | null;
  };
  meses: TableroMesModel[];
  topDeudores: TableroDeudorModel[];
  porVendedor: TableroGrupoModel[];
  recaudoPorMedio: TableroGrupoModel[];
}

// ─── Reglas de crédito ────────────────────────────────────────────
export type TipoReglaCredito = 'AUMENTO_CUPO' | 'REDUCCION_CUPO' | 'SUSPENSION' | 'BLOQUEO' | 'ALERTA';
export type EventoReglaCredito = 'AL_PAGAR' | 'AL_VENDER' | 'PERIODICO';

export interface CondicionesReglaModel {
  scoreMinimo: number | null;
  scoreMaximo: number | null;
  moraMaximaDias: number | null;
  moraMayorDias: number | null;
  pagosConsecutivosATiempo: number | null;
  estadoCredito: string | null;
  promesasIncumplidasMinimo: number | null;
  usoCupoMinimoPct: number | null;
}

export interface ReglaCreditoModel {
  id: number | null;
  nombre: string;
  descripcion: string | null;
  tipo: TipoReglaCredito;
  evento: EventoReglaCredito;
  activo: boolean;
  orden: number;
  diasEntreAplicaciones: number;
  condiciones: CondicionesReglaModel;
  accion: {
    aumentarPct: number | null;
    cupoMaximo: number | null;
    reducirPct: number | null;
    cupoMinimo: number | null;
    mensaje: string | null;
  };
  vecesAplicada?: number;
  ultimaAplicacion?: string | null;
}

export interface SimulacionReglaModel {
  terceroId: number;
  terceroNombre: string;
  score: number;
  diasMora: number;
  estadoCredito: string;
  cupoActual: number;
  cupoResultante: number;
  estadoResultante: string;
  enEspera: boolean;
}

export const TIPOS_REGLA: { value: TipoReglaCredito; label: string; icon: string; clase: string }[] = [
  { value: 'AUMENTO_CUPO', label: 'Subir cupo', icon: 'pi-arrow-up', clase: 'ok' },
  { value: 'REDUCCION_CUPO', label: 'Bajar cupo', icon: 'pi-arrow-down', clase: 'warn' },
  { value: 'SUSPENSION', label: 'Suspender crédito', icon: 'pi-pause', clase: 'warn' },
  { value: 'BLOQUEO', label: 'Bloquear crédito', icon: 'pi-lock', clase: 'danger' },
  { value: 'ALERTA', label: 'Solo avisar', icon: 'pi-bell', clase: 'info' },
];

export const EVENTOS_REGLA: { value: EventoReglaCredito; label: string; frase: string }[] = [
  { value: 'AL_PAGAR', label: 'Cuando paga', frase: 'Cada vez que el cliente paga' },
  { value: 'AL_VENDER', label: 'Cuando compra a crédito', frase: 'Cada vez que compra a crédito' },
  { value: 'PERIODICO', label: 'Cada noche', frase: 'Cada noche' },
];

export type CampoCondicion = keyof CondicionesReglaModel;

export const CONDICIONES_REGLA: {
  campo: CampoCondicion;
  label: string;
  frase: (v: any) => string;
  sufijo?: string;
  tipo: 'numero' | 'estado';
}[] = [
  { campo: 'scoreMinimo', label: 'Score de al menos', frase: (v) => `score ≥ ${v}`, tipo: 'numero' },
  { campo: 'scoreMaximo', label: 'Score de máximo', frase: (v) => `score ≤ ${v}`, tipo: 'numero' },
  { campo: 'moraMaximaDias', label: 'Mora de máximo', frase: (v) => (v === 0 ? 'sin mora' : `mora ≤ ${v} días`), sufijo: ' días', tipo: 'numero' },
  { campo: 'moraMayorDias', label: 'Mora de más de', frase: (v) => `mora > ${v} días`, sufijo: ' días', tipo: 'numero' },
  { campo: 'pagosConsecutivosATiempo', label: 'Pagos seguidos a tiempo, al menos', frase: (v) => `${v}+ pagos seguidos a tiempo`, tipo: 'numero' },
  { campo: 'promesasIncumplidasMinimo', label: 'Promesas incumplidas (180 días), al menos', frase: (v) => `${v}+ promesas incumplidas`, tipo: 'numero' },
  { campo: 'usoCupoMinimoPct', label: 'Uso del cupo de al menos', frase: (v) => `usa ≥ ${v}% del cupo`, sufijo: ' %', tipo: 'numero' },
  { campo: 'estadoCredito', label: 'Estado del crédito es', frase: (v) => `crédito ${String(v).toLowerCase()}`, tipo: 'estado' },
];

// ─── Autorizaciones para pasar el cupo ────────────────────────────
export type EstadoSolicitudCredito = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'USADA' | 'VENCIDA';

export interface SolicitudCreditoModel {
  id: number;
  terceroId: number;
  terceroNombre: string;
  terceroDocumento: string | null;
  montoSolicitado: number;
  cupoDisponible: number;
  excedente: number;
  cupoActual: number | null;
  saldoActual: number;
  diasMora: number;
  scoreCrediticio: number | null;
  estado: EstadoSolicitudCredito;
  observacion: string | null;
  solicitadoPor: string | null;
  aprobadoPor: string | null;
  motivoRechazo: string | null;
  createdAt: string;
  respondidoAt: string | null;
  vigenteHasta: string | null;
  usadaAt: string | null;
  ventaId: number | null;
  numeroVenta: string | null;
}

export const ESTADOS_SOLICITUD: Record<EstadoSolicitudCredito, { label: string; clase: string }> = {
  PENDIENTE: { label: 'Pendiente', clase: 'warn' },
  APROBADA: { label: 'Aprobada', clase: 'ok' },
  RECHAZADA: { label: 'Rechazada', clase: 'danger' },
  USADA: { label: 'Usada en venta', clase: 'info' },
  VENCIDA: { label: 'Venció sin usarse', clase: 'muted' },
};

// ─── Acuerdos de pago (C4) ────────────────────────────────────────
export type EstadoAcuerdo = 'VIGENTE' | 'INCUMPLIDO' | 'CUMPLIDO' | 'ANULADO';
export type EstadoCuota = 'PENDIENTE' | 'PARCIAL' | 'PAGADA' | 'VENCIDA';
export type FrecuenciaAcuerdo = 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | 'PERSONALIZADA';

export const ESTADOS_ACUERDO: Record<EstadoAcuerdo, { label: string; clase: string }> = {
  VIGENTE: { label: 'Vigente', clase: 'info' },
  INCUMPLIDO: { label: 'Incumplido', clase: 'danger' },
  CUMPLIDO: { label: 'Cumplido', clase: 'ok' },
  ANULADO: { label: 'Anulado', clase: 'muted' },
};

export const ESTADOS_CUOTA: Record<EstadoCuota, { label: string; clase: string }> = {
  PENDIENTE: { label: 'Pendiente', clase: 'muted' },
  PARCIAL: { label: 'Abonada', clase: 'warn' },
  PAGADA: { label: 'Pagada', clase: 'ok' },
  VENCIDA: { label: 'Vencida', clase: 'danger' },
};

export const FRECUENCIAS_ACUERDO: { label: string; value: FrecuenciaAcuerdo }[] = [
  { label: 'Semanal', value: 'SEMANAL' },
  { label: 'Quincenal', value: 'QUINCENAL' },
  { label: 'Mensual', value: 'MENSUAL' },
];

export interface AcuerdoCuotaModel {
  id: number;
  numero: number;
  fechaVencimiento: string;
  valor: number;
  valorPagado: number;
  estado: EstadoCuota;
  pagadaAt: string | null;
  /** Positivo = días vencida; negativo = días que faltan. */
  diasVencida: number;
}

export interface AcuerdoCuentaModel {
  cuentaCobrarId: number;
  numeroCuenta: string;
  numeroVenta: string | null;
  saldoInicial: number;
  saldoActual: number;
  fechaVencimientoOriginal: string | null;
}

export interface AcuerdoPagoModel {
  id: number;
  numero: string;
  terceroId: number;
  terceroNombre: string;
  terceroDocumento: string | null;
  terceroTelefono: string | null;
  valorTotal: number;
  valorPagado: number;
  saldo: number;
  numeroCuotas: number;
  cuotasPagadas: number;
  frecuencia: FrecuenciaAcuerdo;
  diasGracia: number;
  estado: EstadoAcuerdo;
  observaciones: string | null;
  motivoAnulacion: string | null;
  usuarioNombre: string | null;
  createdAt: string;
  anuladoAt: string | null;
  cumplidoAt: string | null;
  incumplidoAt: string | null;
  proximaCuotaFecha: string | null;
  proximaCuotaSaldo: number | null;
  diasMora: number;
  /** null en los listados. */
  cuotas: AcuerdoCuotaModel[] | null;
  cuentas: AcuerdoCuentaModel[] | null;
}

export interface CreateAcuerdoPagoDto {
  terceroId: number;
  cuentaCobrarIds: number[];
  cuotas: { fechaVencimiento: string; valor: number }[];
  frecuencia: FrecuenciaAcuerdo;
  diasGracia: number;
  observaciones: string | null;
}
