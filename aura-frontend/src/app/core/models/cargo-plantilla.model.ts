/**
 * Plantilla de nómina del cargo (backend V231): conceptos que liquida siempre,
 * novedades que se le pueden reportar, máximo de horas extra y recargos, y
 * adjuntos. Los conceptos se identifican por su número.
 *
 * Backend: `NominaCargoPlantillaController` → `/api/nomina/cargos/{id}/…`
 */

import { ClaseConcepto, EntradaConcepto, RedondeoModo, RedondeoPrecision } from './concepto.model';

export interface CargoConceptoModel {
  id: number;
  conceptoNumero: number;
  conceptoNombre: string | null;
  clase: ClaseConcepto | null;
  tipoNombre: string | null;
  entrada: EntradaConcepto | null;
  redondeoPrecision: RedondeoPrecision | null;
  redondeoModo: RedondeoModo | null;
  /** Vacíos = los del concepto. */
  cantidad: number | null;
  valor: number | null;
  porcentaje: number | null;
  observacion: string | null;
}

export interface CargoNovedadModel {
  id: number;
  conceptoNumero: number;
  conceptoNombre: string | null;
  clase: ClaseConcepto | null;
  tipoNombre: string | null;
  entrada: EntradaConcepto | null;
  /** Vacío = sin tope. */
  topeCantidad: number | null;
  topeValor: number | null;
  requiereAutorizacion: boolean;
}

export interface GuardarCargoConceptoDto {
  cantidad: number | null;
  valor: number | null;
  porcentaje: number | null;
  observacion: string | null;
}

export interface GuardarCargoNovedadDto {
  topeCantidad: number | null;
  topeValor: number | null;
  requiereAutorizacion: boolean;
}

/** Máximo de horas de un tipo. Vacío = sin tope. */
export interface CargoTopeHorasModel {
  tipoConceptoId: number;
  tipoNombre: string;
  /** Hora extra (tope legal 2 al día y 12 a la semana) o recargo. */
  esHoraExtra: boolean;
  topeDia: number | null;
  topeSemana: number | null;
  topeMes: number | null;
}

export interface CargoAdjuntoModel {
  id: number;
  nombreArchivo: string;
  archivoUrl: string;
  contentType: string | null;
  tamanoBytes: number | null;
  createdAt: string;
}

export interface CopiaPlantillaModel {
  conceptos: number;
  novedades: number;
  topes: number;
}
