/**
 * Prenómina y nómina por documento (rediseño de nómina R3.2).
 *
 * Backend: `NominaDocumentoController` (/api/nomina/documentos).
 */

import { TipoNovedad } from './nomina.model';
import { ClaseComprobanteNomina } from './nomina-parametros.model';

export type ClaseDocumentoNomina = 'PRENOMINA' | 'NOMINA';
export type EstadoDocumentoNomina = 'PRELIMINAR' | 'CONFIRMADO' | 'ANULADO';

export interface DocumentoNominaModel {
  id: number;
  periodoId: number;
  tipoComprobanteId: number;
  tipoComprobanteNombre: string;
  claseComprobante: ClaseComprobanteNomina;
  claseDocumento: ClaseDocumentoNomina;
  numero: number;
  /** PRE-NOM-00001 (prenómina) o NOM-00001 (nómina). */
  numeroCompleto: string;
  fecha: string;
  fechaDesde: string;
  fechaHasta: string;
  fechaLiquidacion: string;
  fechaPago: string | null;
  simulacion: boolean;
  descripcion: string | null;
  estado: EstadoDocumentoNomina;
  fechaConfirmacion: string | null;
  documentoOrigenId: number | null;
  totalDevengado: number;
  totalDeducido: number;
  totalNeto: number;
  totalAportes: number;
  empleados: number;
  /** Nómina: empleados ya pagados. */
  pagados: number;
  /** Prenómina: la nómina no anulada generada desde ella. */
  nominaGeneradaId: number | null;
  nominaGeneradaNumero: string | null;
  /** Nómina: número de la prenómina de la que salió. */
  documentoOrigenNumero: string | null;
}

/** Encabezado de la prenómina (fechas en yyyy-MM-dd). */
export interface CreateDocumentoNominaDto {
  tipoComprobanteId: number;
  fecha: string;
  fechaDesde: string;
  fechaHasta: string;
  fechaLiquidacion: string | null;
  fechaPago: string | null;
  simulacion: boolean;
  descripcion: string | null;
}

export interface FiltroDocumentoNominaDto {
  claseDocumento?: ClaseDocumentoNomina | null;
  tipoComprobanteId?: number | null;
  estado?: EstadoDocumentoNomina | null;
  desde?: string | null;
  hasta?: string | null;
}

export const OPCIONES_ESTADO_DOCUMENTO: { label: string; value: EstadoDocumentoNomina | null }[] = [
  { label: 'Todos los estados', value: null },
  { label: 'Preliminar', value: 'PRELIMINAR' },
  { label: 'Confirmado', value: 'CONFIRMADO' },
  { label: 'Anulado', value: 'ANULADO' },
];

/** Severidad del tag de estado. */
export function severidadEstadoDocumento(estado: EstadoDocumentoNomina): 'info' | 'success' | 'secondary' {
  if (estado === 'CONFIRMADO') return 'success';
  if (estado === 'ANULADO') return 'secondary';
  return 'info';
}

/** Etiqueta del estado. */
export function textoEstadoDocumento(estado: EstadoDocumentoNomina): string {
  return OPCIONES_ESTADO_DOCUMENTO.find((o) => o.value === estado)?.label ?? estado;
}

// ── Pestaña Empleados (R3.2b) ─────────────────────────────────────────────

export type TipoListaNomina = 'EMPLEADO' | 'VINCULACION' | 'GRUPO' | 'TIPO_VINCULACION' | 'TODOS';

export const OPCIONES_TIPO_LISTA: { label: string; value: TipoListaNomina }[] = [
  { label: 'Un empleado', value: 'EMPLEADO' },
  { label: 'Vinculaciones', value: 'VINCULACION' },
  { label: 'Grupo de nómina', value: 'GRUPO' },
  { label: 'Tipo de vinculación', value: 'TIPO_VINCULACION' },
  { label: 'Todos los activos', value: 'TODOS' },
];

/** Fila de la pestaña Empleados. */
export interface EmpleadoDocumentoModel {
  nominaId: number;
  contratoId: number;
  codigoVinculacion: string | null;
  empleadoNombre: string;
  empleadoDocumento: string;
  cargo: string | null;
  tipoVinculacion: string | null;
  grupoNomina: string | null;
  salarioBase: number;
  centrosCosto: string | null;
  estado: string;
}

/** Vinculación vigente evaluada; `motivo` null = se puede agregar. */
export interface CandidatoNominaModel {
  contratoId: number;
  empleadoId: number;
  codigoVinculacion: string | null;
  empleadoNombre: string;
  empleadoDocumento: string;
  salarioBase: number;
  motivo: string | null;
}

export interface AgregarEmpleadosDto {
  tipoLista: TipoListaNomina;
  ids: number[];
}

export interface ResultadoAgregarEmpleadosModel {
  agregados: number;
  omitidos: CandidatoNominaModel[];
}

// ── Liquidación y traza (R3.2c) ───────────────────────────────────────────

/** Fila de la pestaña Liquidación. */
export interface LiquidacionEmpleadoModel {
  nominaId: number;
  codigoVinculacion: string | null;
  empleadoNombre: string;
  empleadoDocumento: string;
  diasTrabajados: number | null;
  devengado: number;
  deducido: number;
  neto: number;
  aportes: number;
  liquidada: boolean;
  liquidadaAt: string | null;
  /** Causa del último intento fallido. */
  error: string | null;
  /** BORRADOR (prenómina), APROBADO (nómina por pagar), PAGADO, ANULADO. */
  estado: string;
  fechaPago: string | null;
  medioPago: string | null;
}

export type ClaseConceptoNomina = 'DEVENGADO' | 'DEDUCCION' | 'APORTE_EMPLEADOR' | 'PROVISION';

/** Línea del detalle por concepto. */
export interface DetalleLiquidacionModel {
  id: number;
  conceptoCodigo: string;
  conceptoNombre: string;
  clase: ClaseConceptoNomina;
  cantidad: number | null;
  base: number;
  porcentaje: number | null;
  valor: number;
  /** JSON [{paso, valor}] del motor. */
  traza: string | null;
}

/** Un paso de la traza del motor. */
export interface PasoTraza {
  paso: string;
  valor: string;
}

/** Corrida de liquidación (pestaña Traza). */
export interface ProcesoDocumentoModel {
  id: number;
  estado: string;
  progreso: number;
  mensaje: string | null;
  totalItems: number;
  itemsOk: number;
  itemsError: number;
  /** JSON [{referencia, error}]. */
  errores: string | null;
  usuario: string | null;
  iniciadoAt: string | null;
  finalizadoAt: string | null;
}

/** Lee la traza JSON del motor; vacía si no viene o no es válida. */
export function leerTraza(json: string | null): PasoTraza[] {
  if (!json) return [];
  try {
    const pasos = JSON.parse(json);
    return Array.isArray(pasos) ? pasos : [];
  } catch {
    return [];
  }
}

// ── Proyección contable (R4b) ─────────────────────────────────────────────

export interface LineaProyeccionModel {
  cuentaId: number;
  cuentaCodigo: string | null;
  cuentaNombre: string | null;
  descripcion: string | null;
  /** A nombre de quién va la línea (EPS, AFP, DIAN, el empleado…). */
  terceroId: number | null;
  terceroNombre: string | null;
  debito: number;
  credito: number;
}

export interface ProyeccionContableModel {
  lineas: LineaProyeccionModel[];
  totalDebito: number;
  totalCredito: number;
  empleados: number;
  advertencias: string[];
}

/** ¿La nómina confirmada ya tiene a todos sus empleados pagados? */
export function nominaPagada(d: DocumentoNominaModel): boolean {
  return d.claseDocumento === 'NOMINA' && d.estado === 'CONFIRMADO' && d.empleados > 0 && d.pagados === d.empleados;
}

// ── Pestaña Novedades (R4d) ───────────────────────────────────────────────

export interface NovedadDocumentoModel {
  id: number;
  nominaId: number;
  empleadoNombre: string;
  empleadoDocumento: string;
  tipo: TipoNovedad;
  subtipo: string | null;
  descripcion: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  dias: number | null;
  cantidad: number;
  valorUnitario: number;
  valorTotal: number;
  esDeduccion: boolean;
  origen: string;
}

/** Novedad nueva para un empleado de la prenómina (fechas en yyyy-MM-dd). */
export interface AgregarNovedadDocumentoDto {
  nominaId: number;
  tipo: TipoNovedad;
  descripcion: string | null;
  cantidad: number | null;
  valorUnitario: number | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  subtipo: string | null;
  numeroAutorizacion: string | null;
}

export const OPCIONES_TIPO_NOVEDAD: { label: string; value: TipoNovedad }[] = [
  { label: 'Hora extra diurna', value: 'HORA_EXTRA_DIURNA' },
  { label: 'Hora extra nocturna', value: 'HORA_EXTRA_NOCTURNA' },
  { label: 'Hora extra dominical', value: 'HORA_EXTRA_DOMINICAL' },
  { label: 'Hora extra festivo', value: 'HORA_EXTRA_FESTIVO' },
  { label: 'Incapacidad', value: 'INCAPACIDAD' },
  { label: 'Licencia remunerada', value: 'LICENCIA_REMUNERADA' },
  { label: 'Licencia NO remunerada', value: 'LICENCIA_NO_REMUNERADA' },
  { label: 'Licencia de maternidad', value: 'LICENCIA_MATERNIDAD' },
  { label: 'Vacaciones', value: 'VACACIONES' },
  { label: 'Bono', value: 'BONO' },
  { label: 'Comisión', value: 'COMISION' },
  { label: 'Préstamo (descuento)', value: 'PRESTAMO' },
  { label: 'Embargo (descuento)', value: 'EMBARGO' },
  { label: 'Otro devengo', value: 'OTRO_DEVENGO' },
  { label: 'Otro descuento', value: 'OTRO_DESCUENTO' },
];

/** Quién paga la incapacidad. */
export const OPCIONES_SUBTIPO_INCAPACIDAD: { label: string; value: string }[] = [
  { label: 'Enfermedad general (EPS)', value: 'GENERAL' },
  { label: 'Riesgo laboral (ARL)', value: 'RIESGO_LABORAL' },
];

/** Ausencias y licencias: piden fechas (descuento de días y reporte a PILA). */
const TIPOS_CON_FECHAS = new Set<TipoNovedad>([
  'INCAPACIDAD',
  'LICENCIA_NO_REMUNERADA',
  'LICENCIA_MATERNIDAD',
  'VACACIONES',
  'LICENCIA_REMUNERADA',
]);

export function novedadPideFechas(tipo: TipoNovedad | null): boolean {
  return !!tipo && TIPOS_CON_FECHAS.has(tipo);
}

/** Etiqueta del tipo de novedad. */
export function textoTipoNovedad(tipo: string): string {
  return OPCIONES_TIPO_NOVEDAD.find((o) => o.value === tipo)?.label ?? tipo;
}
