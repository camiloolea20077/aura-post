/** Borrador de apoyo para diligenciar IVA (300) o retención (350). */

export interface RenglonDeclaracion {
  concepto: string;
  valor: number;
}

export interface SeccionDeclaracion {
  titulo: string;
  renglones: RenglonDeclaracion[];
  total: number;
  /** Resta en el resultado (descontables, retenciones a favor). */
  resta: boolean;
  /** Solo informa: no entra al resultado. */
  informativa: boolean;
}

export interface TarifaDeclaracion {
  origen: 'VENTAS' | 'COMPRAS' | 'GASTOS';
  tarifa: number;
  base: number;
  valor: number;
  documentos: number;
}

export interface CuentaDeclaracion {
  codigo: string;
  nombre: string;
  tipoOrigen: string;
  debito: number;
  credito: number;
}

export interface BorradorDeclaracionModel {
  tipo: 'IVA' | 'RETENCION' | 'ICA';
  empresaNombre: string | null;
  nit: string | null;
  desde: string;
  hasta: string;
  secciones: SeccionDeclaracion[];
  resultado: number;
  resultadoEtiqueta: string;
  basesPorTarifa: TarifaDeclaracion[];
  cuentas: CuentaDeclaracion[];
  advertencias: string[];
  /** A quién se le paga y cuánto, con el pago si ya se registró (V204). */
  porPagar: PorPagarDeclaracion[];
}

export type TipoPagoDeclaracion = 'IVA' | 'RETENCION' | 'RETEICA' | 'ICA';

/** Datos del municipio para el borrador de ICA. */
export interface ParametrosIca {
  desde: string;
  hasta: string;
  tarifaPorMil: number;
  avisosTableros: boolean;
  bomberilPct: number;
  deducciones: number;
  terceroAcreedorId: number | null;
}

export interface PorPagarDeclaracion {
  tipo: TipoPagoDeclaracion;
  /** null: sin entidad asignada (no se puede pagar aún). */
  terceroId: number | null;
  terceroNombre: string;
  terceroDocumento: string | null;
  /** Positivo = a pagar; negativo = saldo a favor. */
  valor: number;
  cuentas: { cuentaId: number; codigo: string; nombre: string; valor: number }[];
  pagoId: number | null;
  pagoNumero: string | null;
  pagoFecha: string | null;
  pagoValor: number | null;
  pagoFormulario: string | null;
  /** Comprobante del asiento del pago; null si no se generó. */
  pagoAsiento: string | null;
}

export interface RegistrarPagoDeclaracionDto {
  tipo: TipoPagoDeclaracion;
  desde: string;
  hasta: string;
  terceroAcreedorId: number;
  fecha: string;
  numeroFormulario: string | null;
  metodoPago: string;
  cuentaBancariaId: number | null;
  cuentaContableId: number | null;
  /** Aproximar al múltiplo de mil (art. 577 E.T.). */
  redondearMiles: boolean;
  intereses: number | null;
  sancion: number | null;
}

/** FUENTE (2365) | IVA (2367) | ICA (2368) */
export type TipoCertificadoRetencion = 'FUENTE' | 'IVA' | 'ICA';

/** Lo retenido a un tercero por concepto y tarifa. */
export interface LineaCertificadoRetencion {
  concepto: string;
  cuentaCodigo: string;
  /** Porcentaje; null si la retención no viene de un documento con tarifa. */
  tarifa: number | null;
  /** null si ningún documento aporta la base (notas contables). */
  base: number | null;
  retenido: number;
}

export interface CertificadoRetencion {
  terceroId: number;
  terceroNombre: string;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  dv: string | null;
  direccion: string | null;
  municipio: string | null;
  correo: string | null;
  lineas: LineaCertificadoRetencion[];
  totalBase: number;
  totalRetenido: number;
}

/** Certificados de retención del período, uno por tercero (GET /certificados). */
export interface CertificadosRetencionModel {
  tipo: TipoCertificadoRetencion;
  empresaNombre: string | null;
  nit: string | null;
  dv: string | null;
  desde: string;
  hasta: string;
  certificados: CertificadoRetencion[];
  advertencias: string[];
}
