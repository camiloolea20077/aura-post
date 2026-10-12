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
