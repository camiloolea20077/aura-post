export type EstadoAsistenciaFrente =
  | 'BORRADOR'
  | 'ENVIADO_REVISION'
  | 'EN_CORRECCION'
  | 'APROBADO'
  | 'RECHAZADO'
  | 'ENVIADO_NOMINA'
  | 'ANULADO';

export type EstadoAsistencia =
  | 'ASISTIO'
  | 'NO_ASISTIO'
  | 'LLEGO_TARDE'
  | 'SALIO_TEMPRANO'
  | 'PERMISO'
  | 'INCAPACIDAD'
  | 'VACACIONES'
  | 'SUSPENDIDO'
  | 'SIN_REGISTRO';

export interface AsistenciaAlertaModel {
  id: number;
  tipoAlerta: string;
  nivel: 'INFO' | 'ADVERTENCIA' | 'CRITICA';
  descripcion: string;
  estado: string;
  empleadoId: number | null;
  empleadoNombre: string | null;
}

export interface AsistenciaDetalleModel {
  id?: number | null;
  empleadoId: number;
  empleadoNombre: string;
  documento: string;
  cargo: string | null;
  horaEntrada: string | null;
  horaSalida: string | null;
  horasTrabajadas: number;
  horasExtraDiurnas?: number;
  horasExtraNocturnas?: number;
  horasDominicalesFestivas?: number;
  estadoAsistencia: EstadoAsistencia;
  estadoRevision: string;
  observacionLider: string | null;
}

export interface AsistenciaFrenteModel {
  id?: number | null;
  proyectoId: number;
  frenteId: number;
  frenteNombre: string;
  fecha: string;
  estado: EstadoAsistenciaFrente;
  liderId: number | null;
  observacionLider: string | null;
  soportePdfId?: number | null;
  soportePdfUrl?: string | null;
  soportePdfNombre?: string | null;
  soportePdfSubidoPor?: string | null;
  soportePdfSubidoAt?: string | null;
  detalles: AsistenciaDetalleModel[];
  alertas: AsistenciaAlertaModel[];
}

export interface RevisarDetalleItem {
  detalleId: number;
  estadoRevision: string;
}

export interface PreliquidacionFrenteItem {
  empleadoId: number;
  empleadoNombre: string;
  documento: string;
  proyectoNombre: string;
  frenteNombre: string;
  fecha: string;
  estadoAsistencia: string;
  horasTrabajadas: number;
  horasExtra: number;
  estadoFrente: string;
  novedadGenerada: string | null;
}

export interface GuardarDetalleDto {
  empleadoId: number;
  horaEntrada?: string | null;
  horaSalida?: string | null;
  estadoAsistencia?: string | null;
  observacionLider?: string | null;
}

export interface GuardarBorradorDto {
  fecha: string;
  observacionLider?: string | null;
  detalles: GuardarDetalleDto[];
}

export interface RevisionTableModel {
  id: number;
  proyectoId: number;
  proyectoCodigo: string;
  proyectoNombre: string;
  frenteId: number;
  frenteCodigo: string;
  frenteNombre: string;
  liderNombre: string | null;
  fecha: string;
  estado: EstadoAsistenciaFrente;
  enviadoRevisionAt: string | null;
  trabajadoresCount: number;
  alertasCriticas: number;
  soportePdfId: number | null;
  totalRows: number;
}

export interface RevisionFilterDto {
  page: number;
  rows: number;
  estado?: string | null;
  proyectoId?: number | null;
  fecha?: string | null;
}
