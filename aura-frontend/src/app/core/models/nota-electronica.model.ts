/**
 * Notas crédito/débito electrónicas (Factus v1). Las claves van en snake_case
 * porque el backend las reenvía tal cual a Factus.
 */

export interface FactusCustomerPayload {
  identification: string;
  dv?: string | null;
  company?: string | null;
  trade_name?: string | null;
  names?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  legal_organization_id?: string;
  tribute_id?: string;
  identification_document_id?: string;
  municipality_id?: string | null;
}

export interface FactusItemPayload {
  code_reference: string;
  name: string;
  quantity: number;
  discount_rate: number;
  price: number;
  tax_rate: string;
  tribute_id: number;
  unit_measure_id: number;
  standard_code_id: number;
  is_excluded: number;
  withholding_taxes?: unknown[];
}

export interface CrearNotaCreditoDto {
  numbering_range_id?: number | null;
  correction_concept_code: number;
  customization_id: number;
  bill_id?: number | null;
  reference_code: string;
  payment_method_code: string;
  observation?: string | null;
  customer?: FactusCustomerPayload | null;
  items: FactusItemPayload[];
}

/** Prefill de una factura (detalle Factus o venta local): CUFE + ítems con IVA. */
export interface FacturaDetalle {
  ventaId: number | null;
  numero: string | null;
  cufe: string | null;
  total: number | null;
  items: FactusItemPayload[];
}

/** Estado local persistido de una nota. */
export interface NotaElectronicaEstado {
  id: number;
  tipo: 'CREDITO' | 'DEBITO';
  referenceCode: string;
  billId: number | null;
  numero: string | null;
  cude: string | null;
  estado: 'PENDIENTE' | 'ENVIADO' | 'ACEPTADO' | 'RECHAZADO' | 'ANULADO';
  customizationId: number | null;
  correctionConceptCode: number | null;
  total: number | null;
  tieneXml: boolean | null;
  createdAt: string;
}

/** Opciones de UI. */
export const TIPO_OPERACION_OPTS = [
  { label: 'Nota crédito que referencia una factura electrónica', value: 20 },
  { label: 'Nota crédito sin referencia a una factura electrónica', value: 22 },
];

export const CONCEPTO_CORRECCION_OPTS = [
  { label: 'Devolución de parte de los bienes', value: 1 },
  { label: 'Anulación de factura electrónica', value: 2 },
  { label: 'Rebaja o descuento parcial o total', value: 3 },
  { label: 'Ajuste de precio', value: 4 },
  { label: 'Otros', value: 5 },
];

/** Tipo de operación para nota débito (verificar códigos con la tabla de Factus). */
export const TIPO_OPERACION_DEBITO_OPTS = [
  { label: 'Nota débito que referencia una factura electrónica', value: 30 },
  { label: 'Nota débito sin referencia a una factura electrónica', value: 32 },
];

/** Conceptos de corrección para nota débito (verificar con la tabla de Factus). */
export const CONCEPTO_CORRECCION_DEBITO_OPTS = [
  { label: 'Intereses', value: 1 },
  { label: 'Gastos por cobrar', value: 2 },
  { label: 'Cambio del valor', value: 3 },
  { label: 'Otros', value: 4 },
];

export const METODO_PAGO_OPTS = [
  { label: 'Efectivo', value: '10' },
  { label: 'Consignación bancaria', value: '42' },
  { label: 'Transferencia', value: '31' },
  { label: 'Tarjeta débito', value: '48' },
  { label: 'Tarjeta crédito', value: '49' },
];

export const TAX_RATE_OPTS = [
  { label: 'IVA 19%', value: '19.00' },
  { label: 'IVA 5%', value: '5.00' },
  { label: 'Excluido / 0%', value: '0.00' },
];
