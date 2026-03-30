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
export type TabCartera = 'dashboard' | 'clientes' | 'edades' | 'alertas';

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
