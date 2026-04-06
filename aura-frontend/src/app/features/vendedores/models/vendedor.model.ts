// ─── Local ─────────────────────────────────────────────────────
export interface LocalModel {
  id: number;
  empresaId: number;
  nombre: string;
  direccion: string;
  barrio: string | null;
  ciudadId: number | null;
  ciudadNombre: string | null;
  departamentoId: number | null;
  departamentoNombre: string | null;
  latitud: number | null;
  longitud: number | null;
  imagenFachada: string | null;
  telefono: string | null;
  email: string | null;
  horaApertura: string | null;
  horaCierre: string | null;
  diaInicioSemana: number | null;
  diaFinSemana: number | null;
  preferenciaVisita: string | null;
  rutaId: number | null;
  rutaNombre: string | null;
  vendedorActualId: number | null;
  vendedorActualNombre: string | null;
  vendedorAnteriorId: number | null;
  vendedorAnteriorNombre: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocalTableModel {
  id: number;
  nombre: string;
  direccion: string;
  barrio: string | null;
  ciudadId: number | null;
  ciudadNombre: string | null;
  departamentoId: number | null;
  departamentoNombre: string | null;
  vendedorActualNombre: string | null;
  vendedorAnteriorNombre: string | null;
  rutaNombre: string | null;
  activo: boolean;
  totalRows: number;
}

export interface createLocalSimpleModel {
  nombre: string;
  direccion: string;
  ciudad: string;
  ciudadId: number;
  barrio: string;
  latitud: number;
  longitud: number;
  imagenFachada: string;
  horarioJson: string;
  preferenciaDiasJson: string;
  vendedorActualId: number | null;
}

export interface CreateLocalDto {
  nombre: string;
  direccion: string;
  barrio?: string | null;
  ciudadId?: number | null;
  departamentoId?: number | null;
  latitud?: number | null;
  longitud?: number | null;
  imagenFachada?: string | null;
  telefono?: string | null;
  email?: string | null;
  horaApertura?: string | null;
  horaCierre?: string | null;
  diaInicioSemana?: number | null;
  diaFinSemana?: number | null;
  preferenciaVisita?: string | null;
  rutaId?: number | null;
  vendedorActualId?: number | null;
}

export interface LocalFilter {
  vendedorActualId?: number | null;
  vendedorAnteriorId?: number | null;
  rutaId?: number | null;
  activo?: boolean | null;
}

// ─── Ruta ─────────────────────────────────────────────────────
export interface RutaModel {
  id: number;
  empresaId: number;
  nombre: string;
  descripcion: string | null;
  diaSemana: number | null;
  vendedorId: number;
  vendedorNombre: string;
  localIds: number[];
  locales: LocalTableModel[];
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RutaTableModel {
  id: number;
  nombre: string;
  descripcion: string | null;
  diaSemana: number | null;
  diaSemanaNombre: string | null;
  vendedorId: number;
  vendedorNombre: string;
  totalLocales: number;
  activo: boolean;
  totalRows: number;
}

export interface CreateRutaDto {
  nombre: string;
  descripcion?: string | null;
  diaSemana?: number | null;
  vendedorId: number;
  localIds?: number[];
}

export interface RutaFilter {
  vendedorId?: number | null;
  activo?: boolean | null;
}

// ─── Visita ───────────────────────────────────────────────────
export type EstadoVisita = 'PROGRAMADA' | 'COMPLETADA' | 'CANCELADA';

export interface VisitaModel {
  id: number;
  empresaId: number;
  localId: number;
  localNombre: string;
  localDireccion: string;
  localLatitud: number | null;
  localLongitud: number | null;
  vendedorId: number;
  vendedorNombre: string;
  rutaId: number | null;
  rutaNombre: string | null;
  fechaProgramada: string;
  horaProgramada: string | null;
  fechaReal: string | null;
  latitudLlegada: number | null;
  longitudLlegada: number | null;
  distanciaMetros: number | null;
  estado: EstadoVisita;
  observaciones: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VisitaTableModel {
  id: number;
  localNombre: string;
  localDireccion: string;
  vendedorNombre: string;
  rutaNombre: string | null;
  fechaProgramada: string;
  horaProgramada: string | null;
  estado: EstadoVisita;
  totalRows: number;
}

export interface CreateVisitaDto {
  localId: number;
  rutaId?: number | null;
  fechaProgramada: string;
  horaProgramada?: string | null;
  observaciones?: string | null;
  latitud?: number | null;
  longitud?: number | null;
}

export interface CreateVisitaAndConfirmarDto {
  localId: number;
  rutaId?: number | null;
  vendedorId: number | null;
  fechaProgramada: string;
  horaProgramada?: string | null;
  observaciones?: string | null;
  latitudLlegada?: number | null;
  longitudLlegada?: number | null;
}

export interface ConfirmarLlegadaDto {
  latitud?: number | null;
  longitud?: number | null;
  confirmacionManual?: boolean;
  observaciones?: string | null;
}

export interface VisitaFilter {
  vendedorId?: number | null;
  rutaId?: number | null;
  estado?: EstadoVisita | null;
  fechaDesde?: string | null;
  fechaHasta?: string | null;
}

// ─── Vendedor (Empleado) ───────────────────────────────────────
export interface VendedorModel {
  id: number;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  tipoDocumento: string;
  numeroDocumento: string;
  telefono: string | null;
  email: string | null;
  activo: boolean;
  totalLocales: number;
  totalRows: number;
  usuarioId: number;
}

export interface VendedorFilter {
  activo?: boolean | null;
  cargo?: string | null;
}

// ─── Pageable ─────────────────────────────────────────────────
export interface VendedorPageableDto {
  page: number;
  rows: number;
  search?: string | null;
  order_by?: string | null;
  order?: string | null;
  params?: VendedorFilter | null;
}

export interface LocalPageableDto {
  page: number;
  rows: number;
  search?: string | null;
  order_by?: string | null;
  order?: string | null;
  params?: LocalFilter | null;
}

export interface RutaPageableDto {
  page: number;
  rows: number;
  search?: string | null;
  order_by?: string | null;
  order?: string | null;
  params?: RutaFilter | null;
}

export interface VisitaPageableDto {
  page: number;
  rows: number;
  search?: string | null;
  order_by?: string | null;
  order?: string | null;
  params?: VisitaFilter | null;
}
