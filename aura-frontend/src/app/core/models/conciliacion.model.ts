// E9 · Conciliación bancaria: extracto importado del banco, matching contra
// el libro y ajustes (comisiones, GMF, intereses) desde la misma pantalla.

export interface ExtractoBancario {
  id: number;
  cuentaBancariaId: number;
  periodo: string; // 'yyyy-MM'
  saldoInicial: number;
  saldoFinal: number;
  estado: 'ABIERTO' | 'CONCILIADO';
  conciliadoAt: string | null;
  createdAt?: string;
}

export interface ExtractoLinea {
  id: number;
  extractoId: number;
  fecha: string;
  descripcion: string | null;
  valor: number; // >0 abono del banco / <0 cargo
  estado: 'PENDIENTE' | 'CONCILIADO' | 'AJUSTE';
  asientoDetalleId: number | null;
  tipoAjuste: string | null;
}

export interface MovimientoLibro {
  asientoDetalleId: number;
  fecha: string;
  numeroComprobante: string;
  descripcion: string;
  tipoOrigen: string;
  debito: number;
  credito: number;
  conciliado: boolean;
}

export interface SugerenciaMatching {
  linea: ExtractoLinea;
  candidatos: MovimientoLibro[];
}

export interface ResumenConciliacion {
  extracto: ExtractoBancario;
  totalLineas: number;
  pendientes: number;
  conciliadas: number;
  ajustes: number;
  sumaValores: number;
  saldoConciliado: number;
  diferencia: number;
  partidasEnTransito: MovimientoLibro[];
  netoPartidasEnTransito: number;
  puedeCerrar: boolean;
}

export interface CrearExtractoDto {
  cuentaBancariaId: number;
  periodo: string;
  saldoInicial: number;
  saldoFinal: number;
}

export type TipoAjusteBancario = 'GASTO_BANCARIO' | 'GMF' | 'INTERES';
