export type EstadoProyecto = 'ACTIVO' | 'SUSPENDIDO' | 'FINALIZADO' | 'ANULADO';
export type EstadoFrente = 'ACTIVO' | 'SUSPENDIDO' | 'FINALIZADO' | 'ANULADO';
export type EstadoTrabajador = 'ACTIVO' | 'RETIRADO' | 'SUSPENDIDO' | 'ANULADO';

export interface ProyectoTableModel {
  id: number;
  codigo: string;
  nombre: string;
  clienteId: number | null;
  clienteNombre: string | null;
  descripcion: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  estado: EstadoProyecto;
  centroCostoId: number | null;
  centroCostoNombre: string | null;
  responsableAdministrativoId: number | null;
  requiereControlAsistencia: boolean;
  ciudad: string | null;
  ubicacion: string | null;
  observacion: string | null;
  frentesCount: number;
  totalRows: number;
}

export interface CreateProyectoDto {
  codigo: string;
  nombre: string;
  clienteId?: number | null;
  descripcion?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  estado?: EstadoProyecto | null;
  centroCostoId?: number | null;
  responsableAdministrativoId?: number | null;
  requiereControlAsistencia?: boolean;
  ciudad?: string | null;
  ubicacion?: string | null;
  observacion?: string | null;
}
export type UpdateProyectoDto = CreateProyectoDto;

export interface ProyectoDto {
  id: number;
  codigo: string;
  nombre: string;
  estado: string;
}

export interface FrenteTableModel {
  id: number;
  proyectoId: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  ubicacion: string | null;
  liderId: number | null;
  liderNombre: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  estado: EstadoFrente;
  observacion: string | null;
  trabajadoresCount: number;
}

export interface CreateFrenteDto {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  ubicacion?: string | null;
  liderId?: number | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  estado?: EstadoFrente | null;
  observacion?: string | null;
  trabajadorIds?: number[];
}
export type UpdateFrenteDto = Omit<CreateFrenteDto, 'trabajadorIds'>;

export interface FrenteTrabajadorModel {
  id: number;
  empleadoId: number;
  empleadoNombre: string;
  documento: string;
  cargo: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  estado: EstadoTrabajador;
}

export interface AsignarTrabajadorDto {
  empleadoId: number;
  fechaInicio?: string | null;
  observacion?: string | null;
}

export interface FrenteTurnoModel {
  id: number;
  turnoId: number;
  turnoNombre: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
}

export interface AsignarFrenteTurnoDto {
  turnoId: number;
  fechaInicio?: string | null;
  fechaFin?: string | null;
}

export interface ProyectoPageableDto {
  page: number;
  rows: number;
  search?: string | null;
}
