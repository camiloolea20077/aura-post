// E11 · Información exógena DIAN: formatos, mapeos cuenta→concepto,
// validador previo y lotes versionados.

export interface ExogenaFormato {
  id: number;
  codigo: string;
  nombre: string;
  versionDian: number;
  activo: boolean;
}

export interface ExogenaConcepto {
  id: number;
  formatoId: number;
  codigo: string;
  nombre: string;
}

export interface ExogenaMapeo {
  id: number;
  conceptoId: number;
  cuentaDesde: string;
  cuentaHasta: string | null;
  tipoValor: 'MOVIMIENTO_DB' | 'MOVIMIENTO_CR' | 'SALDO_DB' | 'SALDO_CR';
}

export interface CrearMapeoDto {
  conceptoId: number;
  cuentaDesde: string;
  cuentaHasta?: string | null;
  tipoValor: string;
}

export interface ExogenaError {
  id?: number;
  tipo:
    | 'TERCERO_INCOMPLETO'
    | 'SIN_MAPEO'
    | 'COMPROBANTE_BORRADOR'
    | 'PERIODO_ABIERTO'
    | 'SIN_TERCERO';
  detalle: string;
  terceroId: number | null;
}

export interface ExogenaLote {
  id: number;
  formatoId: number;
  anio: number;
  version: number;
  estado: 'BORRADOR' | 'APROBADO';
  cuantiaMenorUmbral: number;
  generadoEn: string;
  aprobadoEn: string | null;
}

export interface ExogenaLinea {
  id: number;
  concepto: string;
  conceptoNombre: string;
  terceroId: number | null;
  documento: string;
  tercero: string;
  valor: number;
  cuantiaMenor: boolean;
}
