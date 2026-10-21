/** Conciliación fiscal 2516 / 2517 (PLAN_EXCEL §5 en el backend). */

export type FormatoFiscal = '2516' | '2517';
export type TipoAjusteFiscal = 'MENOR' | 'MAYOR';
export type DiferenciaFiscal = 'PERMANENTE' | 'TEMPORARIA';
export type SeccionFiscal = 'ESF_ACTIVO' | 'ESF_PASIVO' | 'ESF_PATRIMONIO' | 'ERI_INGRESO' | 'ERI_COSTO' | 'ERI_GASTO';

export interface ConciliacionCabecera {
  id: number;
  anio: number;
  formato: FormatoFiscal;
  tarifaRenta: number;
  origen: 'EXCEL' | 'SISTEMA' | null;
  cargadoAt: string | null;
  estado: 'BORRADOR' | 'CERRADA';
  cuentas: number;
  ajustes: number;
}

export interface ConciliacionCuenta {
  id: number;
  codigo: string;
  nombre: string | null;
  saldo: number;
  renglon: string | null;
  renglonNombre: string | null;
  renglonManual: boolean;
}

export interface ConciliacionAjuste {
  id?: number;
  renglon: string;
  renglonNombre?: string | null;
  tipo: TipoAjusteFiscal;
  diferencia: DiferenciaFiscal;
  valor: number;
  concepto: string;
  cuentaCodigo?: string | null;
  sugerencia?: string | null;
}

export interface ConciliacionRenglon {
  codigo: string;
  seccion: SeccionFiscal;
  seccionTitulo: string;
  nombre: string;
  contable: number;
  menorValor: number;
  mayorValor: number;
  fiscal: number;
  cuentas: number;
}

export interface ConciliacionSugerencia {
  clave: string;
  renglon: string;
  renglonNombre: string;
  cuentaCodigo: string;
  cuentaNombre: string | null;
  tipo: TipoAjusteFiscal;
  diferencia: DiferenciaFiscal;
  valor: number;
  concepto: string;
  fundamento: string;
  revisar: boolean;
}

export interface ConciliacionValidacion {
  nivel: 'ERROR' | 'ADVERTENCIA' | 'OK';
  mensaje: string;
}

export interface ConciliacionImpuestoDiferido {
  renglon: string;
  nombre: string;
  seccion: SeccionFiscal;
  contable: number;
  fiscal: number;
  diferencia: number;
  tipo: 'DEDUCIBLE' | 'IMPONIBLE';
  activo: number;
  pasivo: number;
}

export interface ConciliacionResumen {
  cabecera: ConciliacionCabecera;
  renglones: ConciliacionRenglon[];
  activosContable: number;
  activosFiscal: number;
  pasivosContable: number;
  pasivosFiscal: number;
  patrimonioContable: number;
  patrimonioFiscal: number;
  ingresosContable: number;
  ingresosFiscal: number;
  costosContable: number;
  costosFiscal: number;
  gastosContable: number;
  gastosFiscal: number;
  resultadoContable: number;
  rentaLiquida: number;
  impuestoRenta: number;
  impuestoDiferidoActivo: number;
  impuestoDiferidoPasivo: number;
  impuestoDiferido: ConciliacionImpuestoDiferido[];
  sinClasificar: ConciliacionCuenta[];
  sugerencias: ConciliacionSugerencia[];
  validaciones: ConciliacionValidacion[];
  ajustes: ConciliacionAjuste[];
}

export interface RenglonCatalogo {
  codigo: string;
  nombre: string;
  seccion: SeccionFiscal;
  seccionTitulo: string;
}

export const NOMBRE_FORMATO: Record<FormatoFiscal, string> = {
  '2516': 'Formato 2516 · personas jurídicas',
  '2517': 'Formato 2517 · personas naturales',
};

/** Lo que la contabilidad no sabe y escribe el contador en el 110. */
export interface Manuales110 {
  ingresosNoConstitutivos: number;
  compensaciones: number;
  descuentosTributarios: number;
  anticipoSiguiente: number;
  saldoFavorAnterior: number;
}

export interface Linea110 {
  concepto: string;
  valor: number;
  manual: boolean;
  total: boolean;
}

export interface Formulario110 {
  anio: number;
  tarifa: number;
  bloques: { titulo: string; lineas: Linea110[] }[];
  saldoPagar: number;
  saldoFavor: number;
  advertencias: string[];
}
