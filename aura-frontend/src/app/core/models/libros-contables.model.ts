/**
 * Libros oficiales. Los saldos del auxiliar vienen según la naturaleza de la
 * cuenta: un proveedor al que se le debe sale positivo en la 2205.
 */

export interface AuxiliarLineaModel {
  fecha: string;
  numeroComprobante: string | null;
  tipoOrigen: string;
  descripcion: string | null;
  debito: number;
  credito: number;
  saldo: number;
}

export interface AuxiliarTerceroModel {
  /** null: movimientos sin tercero (caja, bancos, cierres…). */
  terceroId: number | null;
  documento: string | null;
  nombre: string | null;
  saldoAnterior: number;
  debito: number;
  credito: number;
  saldoFinal: number;
  lineas: AuxiliarLineaModel[];
}

export interface AuxiliarCuentaModel {
  cuentaId: number;
  codigo: string;
  nombre: string;
  naturaleza: 'DEBITO' | 'CREDITO';
  saldoAnterior: number;
  debito: number;
  credito: number;
  saldoFinal: number;
  terceros: AuxiliarTerceroModel[];
}

export interface LibroAuxiliarModel {
  empresaNombre: string | null;
  nit: string | null;
  desde: string;
  hasta: string;
  cuentas: AuxiliarCuentaModel[];
  totalDebito: number;
  totalCredito: number;
}

export interface DiarioLineaModel {
  cuentaCodigo: string;
  cuentaNombre: string;
  terceroDocumento: string | null;
  terceroNombre: string | null;
  descripcion: string | null;
  debito: number;
  credito: number;
}

export interface DiarioComprobanteModel {
  asientoId: number;
  fecha: string;
  numeroComprobante: string | null;
  tipoOrigen: string;
  descripcion: string | null;
  debito: number;
  credito: number;
  lineas: DiarioLineaModel[];
}

export interface LibroDiarioModel {
  empresaNombre: string | null;
  nit: string | null;
  desde: string;
  hasta: string;
  comprobantes: DiarioComprobanteModel[];
  totalDebito: number;
  totalCredito: number;
  cuadrado: boolean;
}

export interface FiltroAuxiliar {
  desde: string;
  hasta: string;
  cuentaDesde?: string | null;
  cuentaHasta?: string | null;
  terceroId?: number | null;
}
