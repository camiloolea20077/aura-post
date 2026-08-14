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
  [key: string]: unknown;
}

export interface NominaElectronicaDeductions {
  salu?: NominaElectronicaAporte;
  pens?: NominaElectronicaAporte;
  dedu?: NominaElectronicaAporte;
  rete?: NominaElectronicaMonto;
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
