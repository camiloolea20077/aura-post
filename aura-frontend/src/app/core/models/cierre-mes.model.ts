// Cierre de mes, fases 2 a 5 (docs/PLAN_CIERRE_CONTABLE.md). Espejo de CierreMesDtos.

export type EstadoChequeo = 'OK' | 'ADVERTENCIA' | 'BLOQUEA' | 'NO_APLICA';

export interface ChequeoModel {
  codigo: string;
  grupo: string;
  titulo: string;
  estado: EstadoChequeo;
  detalle: string;
  valorAuxiliar: number | null;
  valorMayor: number | null;
  diferencia: number | null;
  /** AJUSTE (arma el comprobante) o RUTA (pantalla donde se corrige). */
  accionTipo: 'AJUSTE' | 'RUTA' | null;
  accionValor: string | null;
  accionTexto: string | null;
  ejemplos: string[];
}

export interface ChequeoCierreModel {
  periodoId: number;
  periodo: string;
  estadoPeriodo: string;
  desde: string;
  hasta: string;
  generadoEn: string;
  puedeCerrar: boolean;
  bloqueos: number;
  advertencias: number;
  chequeos: ChequeoModel[];
}

export interface LineaBalanceModel {
  codigo: string;
  nombre: string;
  saldoAnterior: number;
  debitos: number;
  creditos: number;
  saldoFinal: number;
}

export interface LineaAsientoModel {
  codigo: string;
  nombre: string;
  debito: number;
  credito: number;
}

export interface ActaCierreModel {
  periodoId: number;
  periodo: string;
  estado: string;
  empresaNombre: string | null;
  empresaNit: string | null;
  fechaCierre: string | null;
  cerradoPor: string | null;
  observaciones: string | null;
  reaperturas: number;
  chequeo: ChequeoCierreModel;
  chequeoGuardado: boolean;
  balance: LineaBalanceModel[];
  asientoCierreNumero: string | null;
  asientoCierre: LineaAsientoModel[];
  ingresos: number;
  costos: number;
  gastos: number;
  utilidad: number;
}

export interface LineaComparativoModel {
  codigo: string;
  nombre: string;
  seccion: 'INGRESO' | 'COSTO' | 'GASTO';
  actual: number;
  mesAnterior: number;
  anioAnterior: number;
}

export interface ComparativoModel {
  periodo: string;
  mesAnterior: string;
  anioAnterior: string;
  lineas: LineaComparativoModel[];
}

export interface ResultadoAjusteModel {
  tipo: string;
  mensaje: string;
  cantidad: number;
}
