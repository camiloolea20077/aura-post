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
  tipo: 'IVA' | 'RETENCION';
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
}
