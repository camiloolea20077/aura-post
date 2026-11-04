/**
 * Catálogo de conceptos de nómina (backend V104, ampliado en V230).
 *
 * El usuario identifica cada concepto por su **número** (1 SUELDO, 32 SALUD…).
 * `codigo` es una clave interna que no se muestra
 * (docs/PLAN_CONCEPTOS_CARGOS_NOMINA.md en el backend).
 */

export type ClaseConcepto =
  | 'DEVENGADO'
  | 'DEDUCCION'
  | 'APORTE_EMPLEADOR'
  | 'PROVISION'
  | 'NO_IMPUTABLE';

/**
 * Sobre qué se calcula el concepto.
 *
 * Es un enum acotado, no una fórmula: el editor de fórmulas llega en la fase 3
 * del plan, con un evaluador cerrado (nunca código ejecutable).
 */
export type BaseConcepto =
  /** Salario proporcional a días trabajados. */
  | 'SALARIO'
  /** Base prestacional: salario + auxilio (prima, cesantías). */
  | 'SALARIO_MAS_AUXILIO'
  /** Base de seguridad social. SIN auxilio de transporte. */
  | 'IBC'
  /** Todo lo devengado. */
  | 'DEVENGADO_TOTAL'
  /** Valor fijo, sin cálculo. */
  | 'FIJO'
  /** Lo resuelve el motor (ARL, retefuente). */
  | 'MANUAL'
  /** El valor lo trae la novedad o el concepto propio de la vinculación (V217). */
  | 'NOVEDAD'
  /** El valor sale de la fórmula del concepto (V233). */
  | 'FORMULA';

/** Qué se captura al registrar el concepto como novedad. */
export type EntradaConcepto = 'NINGUNA' | 'VALOR' | 'CANTIDAD' | 'PORCENTAJE';
export type RedondeoPrecision =
  | 'NINGUNO'
  | 'ENTERO'
  | 'DECENA'
  | 'CENTENA'
  | 'MIL';
export type RedondeoModo = 'AUTOMATICO' | 'ARRIBA' | 'ABAJO';
export type FrecuenciaConcepto =
  | 'CADA_PAGO'
  | 'MENSUAL'
  | 'SEMESTRAL'
  | 'ANUAL'
  | 'LIQUIDACION';

export interface OpcionConcepto<T = string> {
  label: string;
  value: T;
}

export const CLASE_CONCEPTO_OPTS: OpcionConcepto<ClaseConcepto>[] = [
  { label: 'Devengado', value: 'DEVENGADO' },
  { label: 'Deducido', value: 'DEDUCCION' },
  { label: 'Aporte del empleador', value: 'APORTE_EMPLEADOR' },
  { label: 'Provisión', value: 'PROVISION' },
  { label: 'No imputable', value: 'NO_IMPUTABLE' },
];

export const BASE_CONCEPTO_OPTS: OpcionConcepto<BaseConcepto>[] = [
  { label: 'Salario proporcional', value: 'SALARIO' },
  {
    label: 'Salario + auxilio (base prestacional)',
    value: 'SALARIO_MAS_AUXILIO',
  },
  { label: 'IBC (sin auxilio de transporte)', value: 'IBC' },
  { label: 'Total devengado', value: 'DEVENGADO_TOTAL' },
  { label: 'Valor fijo', value: 'FIJO' },
  { label: 'Manual (lo resuelve el motor)', value: 'MANUAL' },
  { label: 'Novedad (el valor lo trae la novedad)', value: 'NOVEDAD' },
  { label: 'Fórmula', value: 'FORMULA' },
];

export const ENTRADA_CONCEPTO_OPTS: OpcionConcepto<EntradaConcepto>[] = [
  { label: 'Ninguna (lo calcula el sistema)', value: 'NINGUNA' },
  { label: 'Valor', value: 'VALOR' },
  { label: 'Cantidad (horas o días)', value: 'CANTIDAD' },
  { label: 'Porcentaje', value: 'PORCENTAJE' },
];

export const REDONDEO_PRECISION_OPTS: OpcionConcepto<RedondeoPrecision>[] = [
  { label: 'No redondea', value: 'NINGUNO' },
  { label: 'Entero', value: 'ENTERO' },
  { label: 'Decena', value: 'DECENA' },
  { label: 'Centena', value: 'CENTENA' },
  { label: 'Mil', value: 'MIL' },
];

export const REDONDEO_MODO_OPTS: OpcionConcepto<RedondeoModo>[] = [
  { label: 'Automático', value: 'AUTOMATICO' },
  { label: 'Hacia arriba', value: 'ARRIBA' },
  { label: 'Hacia abajo', value: 'ABAJO' },
];

export const FRECUENCIA_CONCEPTO_OPTS: OpcionConcepto<FrecuenciaConcepto>[] = [
  { label: 'En cada pago', value: 'CADA_PAGO' },
  { label: 'Mensual (última nómina del mes)', value: 'MENSUAL' },
  { label: 'Semestral', value: 'SEMESTRAL' },
  { label: 'Anual', value: 'ANUAL' },
  { label: 'Solo en la liquidación definitiva', value: 'LIQUIDACION' },
];

export const SI_NO_OPTS: OpcionConcepto<boolean>[] = [
  { label: 'Sí', value: true },
  { label: 'No', value: false },
];

export interface ConceptoModel {
  id: number;
  /** NULL = concepto global de ley. */
  empresaId: number | null;
  /** Código visible del concepto. */
  numero: number;
  /** Clave interna: no se muestra. La usan la vinculación y las cuentas de nómina. */
  codigo: string;
  nombre: string;
  clase: ClaseConcepto;
  tipoId: number | null;
  tipoNombre: string | null;
  entrada: EntradaConcepto;
  redondeoPrecision: RedondeoPrecision;
  redondeoModo: RedondeoModo;
  frecuencia: FrecuenciaConcepto;
  grupoId: number | null;
  grupoNombre: string | null;
  aplicaArt383: boolean;
  /** De ley: en la empresa solo se cambian los datos descriptivos. */
  deLey: boolean;
  descripcion: string | null;
  /** Fórmula cuando base = FORMULA. */
  formula: string | null;
  /** Suma a la base de prima y cesantías. */
  haceBasePrestacional: boolean;
  /** Centro de costo fijo; null = se reparte por los de la vinculación. */
  centroCostoId: number | null;
  centroCostoNombre: string | null;
  /**
   * ¿Entra en la base de seguridad social?
   *
   * El auxilio de transporte NO. Un bono no salarial NO. Horas extra SÍ.
   */
  constituyeIbc: boolean;
  base: BaseConcepto;
  porcentaje: number | null;
  valorFijo: number | null;
  vigenteDesde: string;
  /** Null = vigente indefinidamente. */
  vigenteHasta: string | null;
  /** Etiqueta que exige la DIAN en el XML de nómina electrónica. */
  codigoDian: string | null;
  /** Orden de cálculo. Los que dependen de otros van después. */
  orden: number;
  activo: boolean;

  /** Derivado por el backend: concepto global (sin empresa). */
  esGlobal: boolean;
  /** Derivado: la empresa tiene su propia versión de este concepto. */
  personalizado: boolean;
}

/** Datos del formulario de concepto (alta y edición). */
export interface ConceptoFormDto {
  /** Solo al crear: si llega vacío el backend asigna el siguiente libre. */
  numero?: number | null;
  nombre: string;
  clase: ClaseConcepto;
  tipoId: number | null;
  entrada: EntradaConcepto;
  redondeoPrecision: RedondeoPrecision;
  redondeoModo: RedondeoModo;
  frecuencia: FrecuenciaConcepto;
  grupoId: number | null;
  aplicaArt383: boolean;
  descripcion: string | null;
  /** Requerida si base = FORMULA. */
  formula: string | null;
  haceBasePrestacional: boolean;
  centroCostoId: number | null;
  constituyeIbc: boolean;
  base: BaseConcepto;
  /** Requerido salvo que base sea FIJO, MANUAL o NOVEDAD. */
  porcentaje: number | null;
  /** Requerido si base = FIJO. */
  valorFijo: number | null;
  /** Solo al crear. */
  vigenteDesde?: string;
  codigoDian: string | null;
  orden: number;
  /** Solo al editar. */
  activo?: boolean;
}

/**
 * Nueva vigencia de un concepto propio.
 *
 * Cambiar una tarifa no edita el concepto: crea una versión nueva y cierra la
 * anterior el día antes, para reliquidar períodos viejos con su tarifa.
 */
export interface NuevaVigenciaDto {
  base: BaseConcepto;
  /** Requerida si base = FORMULA. */
  formula: string | null;
  porcentaje: number | null;
  valorFijo: number | null;
  constituyeIbc: boolean;
  vigenteDesde: string;
}

/** Filtros del buscador avanzado. Todos opcionales. */
export interface BuscarConceptoParams {
  clase?: ClaseConcepto | null;
  tipoId?: number | null;
  grupoId?: number | null;
  entrada?: EntradaConcepto | null;
  frecuencia?: FrecuenciaConcepto | null;
  /** 'YYYY-MM-DD'; por defecto, hoy. */
  fecha?: string | null;
  incluirInactivos?: boolean;
}

/** Qué es el concepto (salud del empleado, libranza, hora extra…). */
export interface ConceptoTipoModel {
  id: number;
  nombre: string;
  clase: ClaseConcepto;
}

/** Texto de una opción por su valor, para mostrar en tablas. */
export function etiquetaOpcion<T>(
  opciones: OpcionConcepto<T>[],
  valor: T | null | undefined,
): string {
  return opciones.find((o) => o.value === valor)?.label ?? '—';
}

// ── Editor de fórmulas (F3) ───────────────────────────────────────────────

/** Concepto referenciado en una fórmula: [32]. */
export interface ReferenciaFormula {
  numero: number;
  nombre: string | null;
  existe: boolean;
}

export interface ValidacionFormula {
  valida: boolean;
  error: string | null;
  /** Carácter (desde 1) del error; 0 si no aplica. */
  posicion: number;
  conceptos: ReferenciaFormula[];
  variables: string[];
}

export interface ProbarFormulaDto {
  formula: string;
  variables: Record<string, number | null>;
  conceptos: Record<number, number | null>;
}

export interface PruebaFormula {
  valor: number | null;
  error: string | null;
  pasos: { nombre: string; valor: number }[];
}

/** Variable que puede usar una fórmula, con un valor de ejemplo. */
export interface VariableFormula {
  nombre: string;
  descripcion: string;
  ejemplo: number | null;
}

/** Concepto o dato que alimenta la base de otro concepto. */
export interface AfectadoPor {
  numero: number | null;
  nombre: string;
  clase: ClaseConcepto | null;
  motivo: string;
}

/** Funciones del lenguaje de fórmulas, para los atajos del editor. */
export const FUNCIONES_FORMULA: { nombre: string; plantilla: string; ayuda: string }[] = [
  { nombre: 'SI', plantilla: 'SI( ; ; )', ayuda: 'SI(condición; si se cumple; si no)' },
  { nombre: 'MIN', plantilla: 'MIN( ; )', ayuda: 'El menor de los valores' },
  { nombre: 'MAX', plantilla: 'MAX( ; )', ayuda: 'El mayor de los valores' },
  { nombre: 'REDONDEAR', plantilla: 'REDONDEAR( ; 0)', ayuda: 'REDONDEAR(valor; decimales). -3 = al mil' },
  { nombre: 'REDONDEAR_ARRIBA', plantilla: 'REDONDEAR_ARRIBA( ; 0)', ayuda: 'Redondea hacia arriba' },
  { nombre: 'REDONDEAR_ABAJO', plantilla: 'REDONDEAR_ABAJO( ; 0)', ayuda: 'Redondea hacia abajo' },
  { nombre: 'ABS', plantilla: 'ABS( )', ayuda: 'Valor absoluto' },
  { nombre: 'Y', plantilla: 'Y( ; )', ayuda: 'Se cumplen todas' },
  { nombre: 'O', plantilla: 'O( ; )', ayuda: 'Se cumple alguna' },
  { nombre: 'NO', plantilla: 'NO( )', ayuda: 'Lo contrario' },
];
