/**
 * Catálogo de conceptos de nómina (Fase 3 / backend V104).
 *
 * Reemplaza a las tarifas que estaban compiladas en el motor. Un cambio de ley
 * pasa de ser código nuevo + release a ser una fila.
 */

export type ClaseConcepto = 'DEVENGADO' | 'DEDUCCION' | 'APORTE_EMPLEADOR' | 'PROVISION';

/**
 * Sobre qué se calcula el concepto.
 *
 * **Es un enum acotado, no una fórmula.** El ERP de referencia guarda código
 * PHP en la base y lo ejecuta con eval(); aquí las opciones son cerradas: cubren
 * los casos reales sin abrir la puerta a ejecución de código arbitrario.
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
  /** Lo resuelve el motor (ARL, retefuente) o viene de una novedad. */
  | 'MANUAL';

export const CLASE_CONCEPTO_OPTS = [
  { label: 'Devengado', value: 'DEVENGADO' },
  { label: 'Deducción', value: 'DEDUCCION' },
  { label: 'Aporte del empleador', value: 'APORTE_EMPLEADOR' },
  { label: 'Provisión', value: 'PROVISION' },
];

export const BASE_CONCEPTO_OPTS = [
  { label: 'Salario proporcional', value: 'SALARIO' },
  { label: 'Salario + auxilio (base prestacional)', value: 'SALARIO_MAS_AUXILIO' },
  { label: 'IBC (sin auxilio de transporte)', value: 'IBC' },
  { label: 'Total devengado', value: 'DEVENGADO_TOTAL' },
  { label: 'Valor fijo', value: 'FIJO' },
  { label: 'Manual (lo resuelve el motor)', value: 'MANUAL' },
];

export interface ConceptoModel {
  id: number;
  /** NULL = concepto global de ley. No se edita desde el cliente. */
  empresaId: number | null;
  codigo: string;
  nombre: string;
  clase: ClaseConcepto;
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

  /** Derivado por el backend: los globales son de solo lectura. */
  esGlobal: boolean;
  /** Derivado: la empresa tiene su propia versión de este código. */
  personalizado: boolean;
}

export interface CreateConceptoDto {
  codigo: string;
  nombre: string;
  clase: ClaseConcepto;
  constituyeIbc?: boolean;
  base: BaseConcepto;
  /** Requerido salvo que base sea FIJO o MANUAL. */
  porcentaje?: number | null;
  /** Requerido si base = FIJO. */
  valorFijo?: number | null;
  /**
   * Desde cuándo rige.
   *
   * Cambiar una tarifa NO edita el concepto: crea una versión nueva. El backend
   * rechaza vigencias solapadas del mismo código.
   */
  vigenteDesde: string;
  vigenteHasta?: string | null;
  codigoDian?: string | null;
  orden?: number;
}
