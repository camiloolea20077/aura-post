// E11 · Información exógena DIAN: formatos, mapeos cuenta→concepto,
// validador previo y lotes versionados.

export interface ExogenaFormato {
  id: number;
  codigo: string;
  nombre: string;
  versionDian: number;
  activo: boolean;
  /** AMBAS | JURIDICA (el 1010 de socios solo para sociedades). */
  aplicaA: 'AMBAS' | 'JURIDICA';
  /** CONTABILIDAD (mapeos de cuentas) | NOMINA (2276, desde la nómina). */
  fuente: 'CONTABILIDAD' | 'NOMINA';
  /** Columna que debe tener valor para reportar la línea (1003: RETENCION). */
  columnaRequerida: string | null;
  /** Umbral por defecto de cuantías menores (0 = no agrupa). */
  cuantiaMenor: number;
  encabezado: string;
}

/** Columna de valor de un formato, en el orden del prevalidador DIAN. */
export interface ExogenaColumna {
  id: number;
  formatoId: number;
  codigo: string;
  nombre: string;
  orden: number;
  principal: boolean;
}

/** Tipo de persona del informante. */
export type TipoPersonaExogena = 'NATURAL' | 'JURIDICA';

/** Resultado de "Generar todos los formatos" por formato. */
export interface ExogenaResumenFormato {
  formato: string;
  nombre: string;
  generado: boolean;
  motivo?: string;
  loteId?: number;
  version?: number;
  lineas?: number;
  hallazgos?: number;
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
  /** Columna del formato a la que va (null = la principal). */
  columna: string | null;
}

export interface CrearMapeoDto {
  conceptoId: number;
  cuentaDesde: string;
  cuentaHasta?: string | null;
  tipoValor: string;
  columna?: string | null;
}

export interface ExogenaError {
  id?: number;
  tipo:
    | 'TERCERO_INCOMPLETO'
    | 'SIN_MAPEO'
    | 'COMPROBANTE_BORRADOR'
    | 'PERIODO_ABIERTO'
    | 'SIN_TERCERO'
    | 'INFORMANTE_INCOMPLETO';
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
  /** Todos los valores de la línea por columna. */
  valores: Record<string, number>;
  cuantiaMenor: boolean;
}
