// ─── Turnos ───────────────────────────────────────────────────
export interface TurnoModel {
  id: number;
  nombre: string;
  horaInicio: string; // HH:mm[:ss]
  horaFin: string;
  minutosDescanso: number;
  toleraLlegadaTardeMin: number;
  cruzaMedianoche: boolean;
  activo: boolean;
}

export interface CreateTurnoDto {
  nombre: string;
  horaInicio: string;
  horaFin: string;
  minutosDescanso?: number;
  toleraLlegadaTardeMin?: number;
  cruzaMedianoche?: boolean;
  activo?: boolean;
}

export interface EmpleadoTurnoModel {
  id: number;
  empleadoId: number;
  empleadoNombre: string;
  turnoId: number;
  turnoNombre: string;
  fechaInicio: string;
  fechaFin: string | null;
  diasSemana: string;
  activo: boolean;
}

export interface CreateEmpleadoTurnoDto {
  empleadoId: number;
  turnoId: number;
  fechaInicio: string;
  fechaFin?: string | null;
  diasSemana?: string;
}

// ─── Marcaje y día ────────────────────────────────────────────
export type TipoMarcaje =
  | 'ENTRADA'
  | 'SALIDA'
  | 'INICIO_DESCANSO'
  | 'FIN_DESCANSO';

export interface MarcajeModel {
  id: number;
  empleadoId: number;
  empleadoNombre: string;
  fecha: string;
  fechaHoraMarcaje: string;
  tipoMarcaje: TipoMarcaje;
  origenMarcaje: string;
  registradoPor: number | null;
  observacion: string | null;
  evidenciaUrl: string | null;
  estado: string;
}

export interface CreateMarcajeDto {
  empleadoId: number;
  fechaHoraMarcaje?: string | null;
  tipoMarcaje: TipoMarcaje;
  origenMarcaje?: string;
  observacion?: string | null;
  evidenciaUrl?: string | null;
}

export interface AsistenciaDiaModel {
  id: number;
  empleadoId: number;
  empleadoNombre: string;
  fecha: string;
  turnoId: number | null;
  turnoNombre: string | null;
  horaEntradaProgramada: string | null;
  horaSalidaProgramada: string | null;
  horaEntradaReal: string | null;
  horaSalidaReal: string | null;
  minutosProgramados: number;
  minutosTrabajados: number;
  minutosTarde: number;
  minutosSalidaTemprana: number;
  minutosExtraDiurna: number;
  minutosExtraNocturna: number;
  minutosDominicalFestiva: number;
  minutosNocturnos: number;
  estadoAsistencia: string;
  estadoAprobacion: string;
  observacion: string | null;
}

// ─── Incidencias ──────────────────────────────────────────────
export interface IncidenciaModel {
  id: number;
  asistenciaDiaId: number | null;
  empleadoId: number;
  empleadoNombre: string;
  fecha: string;
  tipoIncidencia: string;
  descripcion: string | null;
  estado: string;
  requiereSoporte: boolean;
  soporteUrl: string | null;
  revisadoPor: number | null;
  fechaRevision: string | null;
  observacionRevision: string | null;
}

export interface CrearIncidenciaDto {
  empleadoId: number;
  fecha: string;
  tipoIncidencia: string;
  descripcion?: string | null;
  requiereSoporte?: boolean;
  soporteUrl?: string | null;
}

export interface RevisarIncidenciaDto {
  estado: string;
  observacionRevision?: string | null;
  soporteUrl?: string | null;
}

// ─── Período de asistencia ────────────────────────────────────
export interface PeriodoAsistenciaModel {
  id: number;
  periodoNominaId: number | null;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
}

export interface CrearPeriodoAsistenciaDto {
  periodoNominaId?: number | null;
  fechaInicio: string;
  fechaFin: string;
}

// ─── Novedades desde asistencia ───────────────────────────────
export interface AsistenciaNovedadModel {
  id: number;
  periodoNominaId: number | null;
  empleadoId: number;
  empleadoNombre: string;
  tipoNovedad: string;
  unidad: string;
  cantidad: number;
  valorManual: number | null;
  origen: string;
  estado: string;
}

// ─── Autorización excepcional ─────────────────────────────────
export interface AutorizacionModel {
  id: number;
  empleadoId: number;
  empleadoNombre: string;
  periodoNominaId: number;
  motivo: string;
  observacion: string | null;
  estado: string;
  fechaAutorizacion: string;
}

export interface CrearAutorizacionDto {
  empleadoId: number;
  periodoNominaId: number;
  motivo: string;
  observacion?: string | null;
}

// ─── Preliquidación y auditoría ───────────────────────────────
export interface PreliquidacionItemModel {
  empleadoId: number;
  empleadoNombre: string;
  salarioBase: number;
  diasTrabajados: number | null;
  totalDevengado: number | null;
  totalDeducciones: number | null;
  netoPagar: number | null;
  estado: string;
  alertas: string[];
}

export interface AuditoriaModel {
  id: number;
  empresaId: number;
  entidad: string;
  entidadId: number | null;
  accion: string;
  usuarioId: number | null;
  fechaHora: string;
  valorAnterior: string | null;
  valorNuevo: string | null;
  motivo: string | null;
  origen: string | null;
}
