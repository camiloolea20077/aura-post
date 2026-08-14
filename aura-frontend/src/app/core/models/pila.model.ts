/**
 * PILA — planilla integrada de liquidación de aportes (Fase 6 / backend
 * `PilaController`).
 *
 * El backend genera y guarda los datos estructurados; el archivo plano es un
 * export aparte y depende del operador, así que no vive en estos modelos.
 */

export type EstadoPila = 'BORRADOR' | 'GENERADA' | 'PRESENTADA' | 'PAGADA' | 'ANULADA';

export interface PilaEncabezadoModel {
  id: number;
  /** 'YYYY-MM'. */
  periodo: string;
  razonSocial: string | null;
  numeroDocumento: string | null;
  estado: EstadoPila;
  totalEmpleados: number | null;
  totalNomina: number | null;
}

export interface PilaCotizanteModel {
  secuencia: number;
  nombreCompleto: string;
  tipoDocumento: string | null;
  numeroIdentificacion: string | null;
  tipoCotizante: string | null;

  diasCotizadosSalud: number;
  diasCotizadosPension: number;

  ibcSalud: number;
  ibcPension: number;

  aporteSalud: number;
  aportePension: number;
  aporteRiesgos: number;
  aporteCcf: number;

  codEps: string | null;
  codAfp: string | null;
  codArl: string | null;
  codCcf: string | null;

  ingreso: boolean;
  retiro: boolean;
}

// ── Validación tipo UGPP (P1) ─────────────────────────────────────────────
export type SeveridadPila = 'ERROR' | 'ADVERTENCIA' | 'INFORMACION' | 'NO_EVALUABLE';
export type EstadoCotizantePila =
  | 'BLOQUEADO' | 'NO_EVALUABLE' | 'APTO_CON_ADVERTENCIAS' | 'APTO';
export type EstadoPlanillaPila =
  | 'BLOQUEADA' | 'NO_EVALUABLE' | 'LISTA_CON_ADVERTENCIAS' | 'LISTA';

export interface HallazgoPilaModel {
  codigo: string;
  severidad: SeveridadPila;
  campo: string | null;
  valorRecibido: string | null;
  descripcion: string | null;
  condicionEsperada: string | null;
  accionSugerida: string | null;
  fundamento: string | null;
  riesgo: string | null;
}

export interface CotizanteValidacionModel {
  secuencia: number;
  nombreCompleto: string;
  tipoDocumento: string | null;
  numeroIdentificacion: string | null;
  tipoCotizante: string | null;
  subtipoCotizante: string | null;
  estado: EstadoCotizantePila;
  hallazgos: HallazgoPilaModel[];
}

// ── Configuración del aportante (P4b) ─────────────────────────────────────
export interface PilaAportanteConfigModel {
  empresaId?: number;
  tipoAportante: string | null;
  claseAportante: string | null;
  naturalezaAportante: string | null;
  codActividadEconomica: string | null;
  codOperador: string | null;
  formaPresentacion: string | null;
  repLegalTipoDocumento: string | null;
  repLegalDocumento: string | null;
  repLegalApellido1: string | null;
  repLegalApellido2: string | null;
  repLegalNombre1: string | null;
  repLegalNombre2: string | null;
}

export interface ReporteValidacionPilaModel {
  periodo: string;
  tipoPlanilla: string | null;
  tipoAportante: string | null;
  numeroAportante: string | null;
  estadoPlanilla: EstadoPlanillaPila;
  totalCotizantes: number;
  cotizantesAptos: number;
  cotizantesAptosConAdvertencias: number;
  cotizantesBloqueados: number;
  cotizantesNoEvaluables: number;
  totalErrores: number;
  totalAdvertencias: number;
  totalInformacion: number;
  totalNoEvaluable: number;
  hallazgosPlanilla: HallazgoPilaModel[];
  cotizantes: CotizanteValidacionModel[];
}
