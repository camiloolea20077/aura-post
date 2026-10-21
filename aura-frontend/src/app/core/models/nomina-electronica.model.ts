/**
 * Modelos de la nómina electrónica (Factus v2). El backend arma este payload
 * con {@code FactusNominaV2Builder} y lo devuelve tal cual en el preview, con las
 * claves en snake_case (fieles a Factus), por eso aquí se respetan.
 */

export interface NominaElectronicaMonto {
  amount: string;
  accrual_type_code?: string | number;
  deduction_type_code?: string;
  description?: string;
}

/** Cualquier devengado de Factus (bonificación, cesantía, prima, vacaciones, licencia…). */
export interface NominaElectronicaDevengado {
  amount: string;
  quantity?: string | number;
  percentage?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  accrual_type_code?: string | number;
}

/** Línea ya lista para pintar en la vista previa. */
export interface NominaElectronicaLinea {
  etiqueta: string;
  valor: string;
}

export interface NominaElectronicaHora {
  quantity: string;
  percentage: string;
  amount: string;
  start_date?: string;
  end_date?: string;
  accrual_type_code?: string;
}

export interface NominaElectronicaAporte {
  percentage?: string;
  amount: string;
  deduction_type_code?: string;
}

export interface NominaElectronicaPayment {
  payment_method_code?: string;
  bank_name?: string;
  account_type?: string;
  account_number?: string;
  payment_date?: string;
}

export interface NominaElectronicaWorker {
  identification_document_code?: string;
  identification_number?: string;
  first_name?: string;
  other_names?: string;
  first_surname?: string;
  second_surname?: string;
  address?: string;
  country_code?: string;
  municipality_code?: string;
  has_integral_salary?: boolean;
  has_high_risk?: boolean;
  worker_type_code?: string;
  worker_subtype?: string;
  contract_type?: string;
  employee_code?: string;
  salary?: string;
  entry_date?: string;
  days_worked?: string;
  retirement_date?: string;
}

export interface NominaElectronicaPeriodo {
  month?: string;
  year?: string;
  payroll_period_code?: string;
  pay_period_half?: string;
}

export interface NominaElectronicaAccruals {
  suel?: NominaElectronicaMonto;
  tra?: NominaElectronicaMonto[];
  hora?: NominaElectronicaHora[];
  comi?: NominaElectronicaMonto[];
  boni?: NominaElectronicaDevengado[];
  cesa?: NominaElectronicaDevengado[];
  prim?: NominaElectronicaDevengado;
  vaca?: NominaElectronicaDevengado[];
  inca?: NominaElectronicaDevengado[];
  lice?: NominaElectronicaDevengado[];
  otro?: NominaElectronicaDevengado[];
  inde?: NominaElectronicaMonto;
  [key: string]: unknown;
}

export interface NominaElectronicaDeductions {
  salu?: NominaElectronicaAporte;
  pens?: NominaElectronicaAporte;
  dedu?: NominaElectronicaAporte[];
  rete?: NominaElectronicaMonto;
  libr?: NominaElectronicaMonto[];
  otra?: NominaElectronicaMonto[];
  [key: string]: unknown;
}

/** Payload completo (lo que se le manda a Factus). */
export interface NominaElectronicaPayload {
  reference_code?: string;
  observation?: string;
  numbering_range_id?: string;
  settlement_period?: NominaElectronicaPeriodo;
  payment?: NominaElectronicaPayment;
  worker?: NominaElectronicaWorker;
  accruals?: NominaElectronicaAccruals;
  deductions?: NominaElectronicaDeductions;
}

/** Estado local persistido de la nómina electrónica de una nómina. */
export interface NominaElectronicaEstado {
  id: number;
  nominaId: number;
  empleadoNombre?: string | null;
  agno?: number | null;
  mes?: number | null;
  estado: 'PENDIENTE' | 'ENVIADO' | 'ACEPTADO' | 'RECHAZADO' | 'ANULADO';
  cune: string | null;
  referenceCode: string | null;
  prefijo: string | null;
  consecutivo: number | null;
  esAjuste: boolean | null;
  /** Número ante Factus/DIAN (prefijo + consecutivo). */
  numero?: string | null;
  /** En una nota de ajuste: la nómina electrónica que elimina. */
  nominaAjustadaId?: number | null;
  fechaEnvio: string | null;
  tieneXml: boolean | null;
}

/** Respuesta del envío a Factus. */
export interface NominaElectronicaRespuesta {
  codigoHttp: number;
  requestBody: string;
  responseBody: string;
  cune: string | null;
  referenceCode: string | null;
  duracionMs: number;
  exitoso: boolean;
}

/** Una nómina confirmada que entra en el documento del mes. */
export interface NominaElectronicaNominaDelMes {
  nominaId: number;
  /** Número del documento de nómina (NOM-00002). */
  numero: string | null;
  periodoInicio: string;
  periodoFin: string;
  /** PERIODICO | PRIMA | LIQUIDACION_DEFINITIVA | … */
  clase: string;
  totalDevengado: number;
}

/**
 * Nómina electrónica MENSUAL de un empleado: la DIAN recibe un solo documento por
 * empleado y mes con todo lo pagado. Se envía cuando el mes está completo (con
 * quincenas, al confirmar la 2ª).
 */
export interface NominaElectronicaMes {
  contratoId: number;
  empleadoNombre: string | null;
  empleadoDocumento: string | null;
  agno: number;
  mes: number;
  completo: boolean;
  /** Por qué aún no se puede enviar (p. ej. falta la 2ª quincena). */
  motivo: string | null;
  /** Con ella se abre la modal y se envía. */
  ultimaNominaId: number | null;
  totalDevengado: number;
  cantidadNominas: number;
  /** Solo en la consulta de un empleado; en la vista por mes va vacío. */
  nominas: NominaElectronicaNominaDelMes[];
  documentoId: number | null;
  documentoEstado: string | null;
  documentoNumero: string | null;
  cune: string | null;
}
