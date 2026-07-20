/**
 * Contratos laborales (Fase 2 / backend V102).
 *
 * Antes el contrato estaba embebido en el empleado. Ahora es su propia entidad:
 * una persona puede tener varios contratos y el salario tiene historial.
 */

export type TipoContratoLaboral =
  | 'INDEFINIDO'
  | 'FIJO'
  | 'OBRA_LABOR'
  | 'PRESTACION_SERVICIOS'
  | 'APRENDIZAJE';

export type EstadoContrato = 'ACTIVO' | 'SUSPENDIDO' | 'TERMINADO';

/**
 * Causa del retiro.
 *
 * NO es descriptiva: determina si hay indemnización y cómo se calcula (CST
 * art. 64). Debe ser un selector, nunca texto libre.
 */
export type CausaRetiro =
  | 'JUSTA_CAUSA'
  | 'SIN_JUSTA_CAUSA'
  | 'RENUNCIA'
  | 'MUTUO_ACUERDO'
  | 'VENCIMIENTO_TERMINO'
  | 'OBRA_TERMINADA'
  | 'MUERTE';

export const TIPO_CONTRATO_OPTS = [
  { label: 'Indefinido', value: 'INDEFINIDO' },
  { label: 'Término fijo', value: 'FIJO' },
  { label: 'Obra o labor', value: 'OBRA_LABOR' },
  { label: 'Prestación de servicios', value: 'PRESTACION_SERVICIOS' },
  { label: 'Aprendizaje', value: 'APRENDIZAJE' },
];

export const CAUSA_RETIRO_OPTS = [
  { label: 'Renuncia', value: 'RENUNCIA' },
  { label: 'Despido sin justa causa', value: 'SIN_JUSTA_CAUSA' },
  { label: 'Despido con justa causa', value: 'JUSTA_CAUSA' },
  { label: 'Mutuo acuerdo', value: 'MUTUO_ACUERDO' },
  { label: 'Vencimiento del término', value: 'VENCIMIENTO_TERMINO' },
  { label: 'Obra terminada', value: 'OBRA_TERMINADA' },
  { label: 'Muerte', value: 'MUERTE' },
];

export const ESTADO_CONTRATO_OPTS = [
  { label: 'Activo', value: 'ACTIVO' },
  { label: 'Suspendido', value: 'SUSPENDIDO' },
  { label: 'Terminado', value: 'TERMINADO' },
];

// ─── Salida ───────────────────────────────────────────────────

export interface ContratoModel {
  id: number;
  empleadoId: number;
  empleadoNombre: string | null;
  empleadoDocumento: string | null;

  tipoContrato: TipoContratoLaboral;
  cargo: string | null;
  fechaInicio: string;
  /** Null = indefinido. */
  fechaFin: string | null;
  salarioBase: number;
  /** El IBC es el 70% y no se provisionan prestaciones. */
  esSalarioIntegral: boolean;
  periodicidad: string | null;
  /** Con multi-vínculo, cuál manda para reportes de un solo contrato. */
  esPrincipal: boolean;

  procedimientoRetefuente: '1' | '2';
  porcentajeFijoRetencion: number | null;

  estado: EstadoContrato;
  causaRetiro: CausaRetiro | null;
  observacion: string | null;

  // Seguridad social (Fase 5.5)
  tipoCotizante: string | null;
  subtipoCotizante: string | null;
  nivelRiesgoArl: number | null;
  tarifaArl: number | null;

  createdAt: string;
  updatedAt: string;
}

export interface ContratoTableModel {
  id: number;
  empleadoId: number;
  empleadoNombre: string | null;
  tipoContrato: TipoContratoLaboral;
  cargo: string | null;
  fechaInicio: string;
  fechaFin: string | null;
  salarioBase: number;
  esPrincipal: boolean;
  estado: EstadoContrato;
  /** Null si es indefinido. Negativo = ya venció. */
  diasParaVencer: number | null;
}

export interface SalarioHistorialModel {
  id: number;
  salario: number;
  fechaDesde: string;
  /** Null = vigente. */
  fechaHasta: string | null;
  motivo: string | null;
  createdAt: string;
  /** Variación respecto al salario anterior. Null en la primera fila. */
  variacionPorcentaje: number | null;
}

export interface RenovacionModel {
  id: number;
  fechaInicial: string;
  fechaFinal: string;
  descripcion: string | null;
  createdAt: string;
}

export interface CentroCostoContratoModel {
  id: number;
  centroCostoId: number;
  centroCostoNombre: string | null;
  porcentaje: number;
}

export interface ContratoDetalleModel {
  contrato: ContratoModel;
  historialSalarios: SalarioHistorialModel[];
  renovaciones: RenovacionModel[];
  centrosCosto: CentroCostoContratoModel[];
}

// ─── Entrada ──────────────────────────────────────────────────

export interface CreateContratoDto {
  empleadoId: number;
  tipoContrato: TipoContratoLaboral;
  cargo?: string | null;
  fechaInicio: string;
  /** Obligatorio si tipoContrato = FIJO; prohibido si INDEFINIDO. */
  fechaFin?: string | null;
  salarioBase: number;
  esSalarioIntegral?: boolean;
  periodicidad?: string | null;
  esPrincipal?: boolean;
  procedimientoRetefuente?: '1' | '2';
  /** Nivel de riesgo ARL (1..5). Lo exige PILA. */
  nivelRiesgoArl?: number | null;
  observacion?: string | null;
}

/**
 * Cambio de salario.
 *
 * NO es un update: preserva el histórico cerrando la vigencia anterior y
 * abriendo una nueva. Por eso `fechaDesde` y `motivo` son parte del contrato de
 * la operación — sin la fecha no se pueden liquidar retroactivos ni calcular la
 * bandera `vsp` de PILA.
 */
export interface CambiarSalarioDto {
  nuevoSalario: number;
  /** Desde cuándo rige. Puede ser retroactiva. */
  fechaDesde: string;
  motivo?: string | null;
}

export interface TerminarContratoDto {
  fechaFin: string;
  causaRetiro: CausaRetiro;
}

export interface CreateRenovacionDto {
  fechaInicial: string;
  fechaFinal: string;
  descripcion?: string | null;
}
