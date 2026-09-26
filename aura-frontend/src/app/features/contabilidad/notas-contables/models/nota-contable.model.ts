/**
 * Nota contable = comprobante de diario (CD) que elabora el contador.
 * Nace en BORRADOR (sin consecutivo, editable), se CONTABILIZA (recibe su
 * CD-######) y solo se ANULA con motivo si su período sigue abierto.
 */
export type EstadoNota = 'BORRADOR' | 'CONTABILIZADO' | 'ANULADO';

export type ClasificacionNota =
  | 'AJUSTE'
  | 'RECLASIFICACION'
  | 'PROVISION'
  | 'CAUSACION'
  | 'DEPRECIACION'
  | 'CORRECCION'
  | 'OTRO';

/** Mismas claves que NotaDiarioLineasBuilder.CLASIFICACIONES en el backend. */
export const CLASIFICACIONES: { label: string; value: ClasificacionNota }[] = [
  { label: 'Ajuste', value: 'AJUSTE' },
  { label: 'Reclasificación', value: 'RECLASIFICACION' },
  { label: 'Provisión', value: 'PROVISION' },
  { label: 'Causación', value: 'CAUSACION' },
  { label: 'Depreciación', value: 'DEPRECIACION' },
  { label: 'Corrección', value: 'CORRECCION' },
  { label: 'Otro', value: 'OTRO' },
];

export const clasificacionLabel = (c: string | null | undefined): string =>
  CLASIFICACIONES.find((x) => x.value === c)?.label ?? '';

export interface NotaContableTableModel {
  id: number;
  numeroComprobante: string | null;
  fecha: string;
  descripcion: string;
  totalDebito: number;
  totalCredito: number;
  estado: EstadoNota;
  cantidadLineas: number;
  elaboradoPor: string | null;
  contabilizadoPor: string | null;
  createdAt: string;
  clasificacion: ClasificacionNota | null;
  reversaDeNumero: string | null;
  revertidoPorNumero: string | null;
  cantidadSoportes: number;
}

export interface NotaContableLineaModel {
  id: number;
  cuentaId: number;
  cuentaCodigo: string;
  cuentaNombre: string;
  descripcion: string | null;
  debito: number;
  credito: number;
  terceroId: number | null;
  terceroNombre: string | null;
  terceroDocumento: string | null;
  centroCostoId: number | null;
  centroCostoNombre: string | null;
  proyectoId: number | null;
  proyectoNombre: string | null;
  frenteId: number | null;
  frenteNombre: string | null;
}

export interface NotaContableModel {
  id: number;
  numeroComprobante: string | null;
  fecha: string;
  descripcion: string;
  totalDebito: number;
  totalCredito: number;
  estado: EstadoNota;
  periodo: string | null;
  elaboradoPor: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  contabilizadoPor: string | null;
  contabilizadoAt: string | null;
  anuladoPor: string | null;
  anuladoAt: string | null;
  motivoAnulacion: string | null;
  clasificacion: ClasificacionNota | null;
  reversionAutomatica: boolean;
  reversaDeId: number | null;
  reversaDeNumero: string | null;
  revertidoPorId: number | null;
  revertidoPorNumero: string | null;
  plantillaId: number | null;
  plantillaNombre: string | null;
  lineas: NotaContableLineaModel[];
  soportes: NotaContableSoporteModel[];
}

export interface NotaContableSoporteModel {
  id: number;
  nombreArchivo: string;
  archivoUrl: string;
  contentType: string | null;
  tamanoBytes: number | null;
  subidoPor: string | null;
  createdAt: string;
}

export interface SaveNotaContableLineaDto {
  cuentaId: number;
  descripcion: string | null;
  debito: number;
  credito: number;
  terceroId: number | null;
  centroCostoId: number | null;
  proyectoId: number | null;
  frenteId: number | null;
}

export interface SaveNotaContableDto {
  fecha: string;
  descripcion: string;
  lineas: SaveNotaContableLineaDto[];
  /** true = guardar y contabilizar en el mismo paso. */
  contabilizar: boolean;
  clasificacion: ClasificacionNota | null;
  /** Al contabilizar, generar también la reversión el día 1 del mes siguiente. */
  reversionAutomatica: boolean;
  plantillaId: number | null;
}

export interface NotaContableFiltro {
  fechaDesde?: string | null;
  fechaHasta?: string | null;
  estado?: EstadoNota | null;
  clasificacion?: ClasificacionNota | null;
}

// ── Importar desde Excel ─────────────────────────────────────────────
export interface ImportarLineasResultado {
  lineas: NotaContableLineaModel[];
  errores: { fila: number; mensaje: string }[];
}

// ── Plantillas ───────────────────────────────────────────────────────
export interface NotaPlantillaModel {
  id: number;
  nombre: string;
  descripcion: string;
  clasificacion: ClasificacionNota | null;
  recurrente: boolean;
  diaMes: number | null;
  /** 'YYYY-MM' del último mes generado. */
  ultimoPeriodo: string | null;
  activa: boolean;
  cantidadLineas: number;
  totalDebito: number;
  totalCredito: number;
  lineas?: NotaContableLineaModel[];
}

export interface SaveNotaPlantillaDto {
  nombre: string;
  descripcion: string;
  clasificacion: ClasificacionNota | null;
  recurrente: boolean;
  diaMes: number | null;
  activa: boolean;
  /** null = conservar las líneas actuales. */
  lineas: SaveNotaContableLineaDto[] | null;
}
