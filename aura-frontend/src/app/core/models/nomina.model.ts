// ─── Tipos ────────────────────────────────────────────────────
export type ModoNomina = 'COMPLETO' | 'SIMPLIFICADO';
export type Periodicidad = 'MENSUAL' | 'QUINCENAL' | 'SEMANAL';
export type EstadoNomina = 'BORRADOR' | 'APROBADO' | 'PAGADO' | 'ANULADO';
export type EstadoPeriodo = 'ABIERTO' | 'LIQUIDADO' | 'PAGADO' | 'ANULADO';
export type TipoContrato =
  | 'INDEFINIDO'
  | 'FIJO'
  | 'OBRA_LABOR'
  | 'PRESTACION_SERVICIOS';
export type TipoNovedad =
  | 'HORA_EXTRA_DIURNA'
  | 'HORA_EXTRA_NOCTURNA'
  | 'HORA_EXTRA_DOMINICAL'
  | 'HORA_EXTRA_FESTIVO'
  | 'INCAPACIDAD'
  | 'LICENCIA_REMUNERADA'
  | 'BONO'
  | 'COMISION'
  | 'PRESTAMO'
  | 'EMBARGO'
  | 'OTRO_DEVENGO'
  | 'OTRO_DESCUENTO';

// ─── Configuración ────────────────────────────────────────────
export interface NominaConfigModel {
  id: number;
  modoNomina: ModoNomina;
  periodicidad: Periodicidad;
  smmlv: number;
  auxilioTransporte: number;
  pctSaludEmpleado: number;
  pctPensionEmpleado: number;
  pctSaludEmpleador: number;
  pctPensionEmpleador: number;
  pctCajaCompensacion: number;
  pctIcbf: number;
  pctSena: number;
}

export interface UpdateNominaConfigDto {
  modoNomina?: ModoNomina;
  periodicidad?: Periodicidad;
  smmlv?: number;
  auxilioTransporte?: number;
  pctSaludEmpleado?: number;
  pctPensionEmpleado?: number;
  pctSaludEmpleador?: number;
  pctPensionEmpleador?: number;
  pctCajaCompensacion?: number;
  pctIcbf?: number;
  pctSena?: number;
}

// ─── Empleados ────────────────────────────────────────────────
export interface EmpleadoModel {
  id: number;
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  cargo: string | null;
  tipoEmpleadoId: number | null;
  tipoEmpleadoNombre: string | null;
  fechaIngreso: string;
  fechaRetiro: string | null;
  salarioBase: number;
  tipoContrato: TipoContrato;
  banco: string | null;
  numeroCuenta: string | null;
  tipoCuenta: string | null;
  activo: boolean;
  nivelRiesgoArl: number | null;
  porcentajeArl: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmpleadoTableModel {
  id: number;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  tipoDocumento: string;
  numeroDocumento: string;
  cargo: string | null;
  tipoEmpleadoId: number | null;
  tipoEmpleadoNombre: string | null;
  fechaIngreso: string;
  salarioBase: number;
  tipoContrato: TipoContrato;
  activo: boolean;
  totalRows: number;
}

export interface CreateEmpleadoDto {
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  cargo?: string | null;
  tipoEmpleadoId?: number | null;
  fechaIngreso: string;
  salarioBase: number;
  tipoContrato: TipoContrato;
  banco?: string | null;
  numeroCuenta?: string | null;
  tipoCuenta?: string | null;
  nivelRiesgoArl?: number | null;
}

// ─── Períodos ─────────────────────────────────────────────────
export interface PeriodoNominaModel {
  id: number;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoPeriodo;
  createdAt: string;
}

export interface CreatePeriodoDto {
  fechaInicio: string;
  fechaFin: string;
}

// ─── Novedades ────────────────────────────────────────────────
export interface NominaNovedadModel {
  id: number;
  tipo: TipoNovedad;
  descripcion: string | null;
  cantidad: number;
  valorUnitario: number;
  valorTotal: number;
  esDeduccion: boolean;
}

export interface AddNovedadDto {
  tipo: TipoNovedad;
  descripcion?: string | null;
  cantidad?: number;
  valorUnitario: number;
}

// ─── Nómina ───────────────────────────────────────────────────
export interface NominaModel {
  id: number;
  periodoId: number;
  periodoFechaInicio: string;
  periodoFechaFin: string;
  empleadoId: number;
  empleadoNombre: string;
  empleadoDocumento: string;
  cargo: string | null;
  tipoContrato: TipoContrato;
  salarioBase: number;
  diasTrabajados: number;
  salarioProporcional: number;
  auxilioTransporte: number;
  totalNovedadesDev: number;
  totalDevengado: number;
  deduccionSalud: number;
  deduccionPension: number;
  deduccionOtros: number;
  totalDeducciones: number;
  netoPagar: number;
  aporteSalud: number;
  aportePension: number;
  aporteArl: number;
  aporteCaja: number;
  aporteIcbf: number;
  aporteSena: number;
  provisionPrima: number;
  provisionCesantias: number;
  provisionIntCesantias: number;
  provisionVacaciones: number;
  estado: EstadoNomina;
  novedades: NominaNovedadModel[];
  createdAt: string;
  updatedAt: string;
}

export interface NominaTableModel {
  id: number;
  periodoId: number;
  periodoFechaInicio: string;
  periodoFechaFin: string;
  empleadoId: number;
  empleadoNombre: string;
  empleadoDocumento: string;
  cargo: string | null;
  diasTrabajados: number;
  totalDevengado: number;
  totalDeducciones: number;
  netoPagar: number;
  estado: EstadoNomina;
  totalRows: number;
}

// ─── Pageable ─────────────────────────────────────────────────
export interface NominaPageableDto {
  page: number;
  rows: number;
  search?: string | null;
  order_by?: string | null;
  order?: string | null;
}
