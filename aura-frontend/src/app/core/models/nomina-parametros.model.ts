/**
 * Parámetros de nómina (rediseño R1/R3): catálogos simples, cargos, tipos de
 * vinculación y tipos de comprobante.
 *
 * Backend: `NominaCatalogoController` (/api/nomina/catalogos/{catalogo}),
 * `NominaCargoController` (/api/nomina/cargos) y
 * `NominaTipoVinculacionController` (/api/nomina/tipos-vinculacion).
 */

// ── Catálogos simples ─────────────────────────────────────────────────────

export type TipoAtributoCatalogo = 'TEXTO' | 'ENTERO' | 'DECIMAL' | 'BOOLEANO' | 'OPCION';

/** Campo propio de un catálogo (la prioridad de un embargo, quién paga un ausentismo…). */
export interface AtributoCatalogoModel {
  nombre: string;
  etiqueta: string;
  tipo: TipoAtributoCatalogo;
  obligatorio: boolean;
  opciones: string[];
  minimo: number | null;
  maximo: number | null;
  ayuda: string | null;
}

/** Definición de un catálogo: el front arma la pantalla con esto. */
export interface TipoCatalogoNominaModel {
  ruta: string;
  nombre: string;
  descripcion: string;
  atributos: AtributoCatalogoModel[];
}

export type ValorAtributo = string | number | boolean | null;

export interface NominaCatalogoModel {
  id: number;
  tipo: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  orden: number;
  activo: boolean;
  atributos: Record<string, ValorAtributo>;
}

export interface CreateNominaCatalogoDto {
  codigo: string;
  nombre: string;
  descripcion: string | null;
  orden: number;
  activo: boolean;
  atributos: Record<string, ValorAtributo>;
}

// ── Cargos ────────────────────────────────────────────────────────────────

export interface NominaCargoModel {
  id: number;
  codigo: string;
  nombre: string;
  nivelId: number | null;
  nivelNombre: string | null;
  tipoCargoId: number | null;
  tipoCargoNombre: string | null;
  /** Plazas aprobadas; null = sin límite. */
  plazas: number | null;
  ocupadas: number | null;
  salarioReferencia: number | null;
  salarioMinimo: number | null;
  salarioMaximo: number | null;
  mision: string | null;
  funciones: string | null;
  activo: boolean;
}

export interface CreateNominaCargoDto {
  codigo: string;
  nombre: string;
  nivelId: number | null;
  tipoCargoId: number | null;
  plazas: number | null;
  salarioReferencia: number | null;
  salarioMinimo: number | null;
  salarioMaximo: number | null;
  mision: string | null;
  funciones: string | null;
  activo: boolean;
}

// ── Tipos de vinculación ──────────────────────────────────────────────────

export type TipoContrato = 'INDEFINIDO' | 'FIJO' | 'OBRA_LABOR' | 'PRESTACION_SERVICIOS' | 'APRENDIZAJE';
export type TipoRemuneracion = 'MENSUAL' | 'INTEGRAL' | 'JORNAL' | 'HORA';
export type FrecuenciaPago = 'MENSUAL' | 'QUINCENAL' | 'SEMANAL';

export interface TipoVinculacionModel {
  id: number;
  codigo: string;
  nombre: string;
  tipoContrato: TipoContrato | null;
  tipoRemuneracion: TipoRemuneracion;
  frecuenciaPago: FrecuenciaPago;
  exigeFechaFin: boolean;
  unicaPorEmpleado: boolean;
  descripcion: string | null;
  activo: boolean;
}

export interface CreateTipoVinculacionDto {
  codigo: string;
  nombre: string;
  tipoContrato: TipoContrato | null;
  tipoRemuneracion: TipoRemuneracion;
  frecuenciaPago: FrecuenciaPago;
  exigeFechaFin: boolean;
  unicaPorEmpleado: boolean;
  descripcion: string | null;
  activo: boolean;
}

/** Contratos que por ley tienen fecha de terminación (el back lo valida igual). */
export const CONTRATOS_CON_FIN: TipoContrato[] = ['FIJO', 'OBRA_LABOR', 'APRENDIZAJE'];

export const OPCIONES_TIPO_CONTRATO: { label: string; value: TipoContrato | null }[] = [
  { label: 'Cualquiera', value: null },
  { label: 'Término indefinido', value: 'INDEFINIDO' },
  { label: 'Término fijo', value: 'FIJO' },
  { label: 'Obra o labor', value: 'OBRA_LABOR' },
  { label: 'Prestación de servicios', value: 'PRESTACION_SERVICIOS' },
  { label: 'Aprendizaje', value: 'APRENDIZAJE' },
];

export const OPCIONES_REMUNERACION: { label: string; value: TipoRemuneracion }[] = [
  { label: 'Salario mensual', value: 'MENSUAL' },
  { label: 'Salario integral', value: 'INTEGRAL' },
  { label: 'Jornal (por día)', value: 'JORNAL' },
  { label: 'Por hora', value: 'HORA' },
];

export const OPCIONES_FRECUENCIA: { label: string; value: FrecuenciaPago }[] = [
  { label: 'Mensual', value: 'MENSUAL' },
  { label: 'Quincenal', value: 'QUINCENAL' },
  { label: 'Semanal', value: 'SEMANAL' },
];

/** Filtro del listado paginado (mismo cuerpo que el resto de /page). */
export interface FiltroPagina {
  page: number;
  rows: number;
  search?: string | null;
}

/** Página de Spring (PageImpl) como llega dentro de ResponseModel.data. */
export interface PaginaModel<T> {
  content: T[];
  totalElements: number;
}

// ── Tipos de comprobante de nómina (R3) ───────────────────────────────────
// Backend: `NominaTipoComprobanteController` (/api/nomina/tipos-comprobante).

export type ClaseComprobanteNomina =
  | 'PERIODICO'
  | 'PRIMA'
  | 'CESANTIAS'
  | 'INTERESES_CESANTIAS'
  | 'LIQUIDACION_DEFINITIVA'
  | 'RETROACTIVO'
  | 'OTROS_PAGOS';

export interface TipoComprobanteModel {
  id: number;
  codigo: string;
  nombre: string;
  clase: ClaseComprobanteNomina;
  prefijo: string;
  /** Solo los periódicos. */
  frecuencia: FrecuenciaPago | null;
  descripcion: string | null;
  activo: boolean;
  /** Tipos de vinculación admitidos; vacío = todos. */
  tiposVinculacionIds: number[];
  tiposVinculacionNombres: string | null;
}

export interface CreateTipoComprobanteDto {
  codigo: string;
  nombre: string;
  clase: ClaseComprobanteNomina;
  prefijo: string;
  frecuencia: FrecuenciaPago | null;
  descripcion: string | null;
  tiposVinculacionIds: number[];
  activo: boolean;
}

export const OPCIONES_CLASE_COMPROBANTE: { label: string; value: ClaseComprobanteNomina }[] = [
  { label: 'Nómina periódica', value: 'PERIODICO' },
  { label: 'Prima de servicios', value: 'PRIMA' },
  { label: 'Cesantías', value: 'CESANTIAS' },
  { label: 'Intereses de cesantías', value: 'INTERESES_CESANTIAS' },
  { label: 'Liquidación definitiva', value: 'LIQUIDACION_DEFINITIVA' },
  { label: 'Retroactivo', value: 'RETROACTIVO' },
  { label: 'Otros pagos', value: 'OTROS_PAGOS' },
];

// ── Cuentas contables por concepto de nómina (R4c-2) ──────────────────────
// Backend: `NominaConceptoContableController` (/api/nomina/conceptos-contables).

export type TerceroCreditoNomina = 'EMPLEADO' | 'EPS' | 'AFP' | 'ARL' | 'CCF' | 'DIAN' | 'NINGUNO' | 'FIJO';

export interface ConceptoContableNominaModel {
  codigo: string;
  nombre: string;
  clase: 'DEVENGADO' | 'DEDUCCION' | 'APORTE_EMPLEADOR' | 'PROVISION';
  aplicaDebito: boolean;
  aplicaCredito: boolean;
  debitoDefecto: string | null;
  creditoDefecto: string | null;
  terceroDefecto: string | null;
  cuentaDebitoId: number | null;
  cuentaDebito: string | null;
  cuentaCreditoId: number | null;
  cuentaCredito: string | null;
  terceroCredito: TerceroCreditoNomina | null;
  terceroFijoId: number | null;
  terceroFijo: string | null;
  personalizado: boolean;
}

/** Cambio de un concepto; lo nulo vuelve al valor por defecto. */
export interface GuardarConceptoContableDto {
  cuentaDebitoId: number | null;
  cuentaCreditoId: number | null;
  terceroCredito: TerceroCreditoNomina | null;
  terceroFijoId: number | null;
}

export const OPCIONES_TERCERO_CREDITO: { label: string; value: TerceroCreditoNomina | null }[] = [
  { label: 'Por defecto', value: null },
  { label: 'Empleado', value: 'EMPLEADO' },
  { label: 'EPS del empleado', value: 'EPS' },
  { label: 'Fondo de pensiones del empleado', value: 'AFP' },
  { label: 'ARL del empleado', value: 'ARL' },
  { label: 'Caja de compensación del empleado', value: 'CCF' },
  { label: 'DIAN', value: 'DIAN' },
  { label: 'Sin tercero', value: 'NINGUNO' },
  { label: 'Un tercero fijo…', value: 'FIJO' },
];

export const TEXTO_CLASE_CONCEPTO: Record<string, string> = {
  DEVENGADO: 'Devengado',
  DEDUCCION: 'Deducción',
  APORTE_EMPLEADOR: 'Aporte empleador',
  PROVISION: 'Provisión',
};
