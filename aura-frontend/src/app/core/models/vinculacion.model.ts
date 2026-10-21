/**
 * Vinculaciones (rediseño de nómina R2): el contrato completo del empleado.
 *
 * Backend: `VinculacionController` → `/api/nomina/vinculaciones`. El cambio de
 * salario y la terminación siguen en `/api/contrato` (ContratoService).
 */
import { FrecuenciaPago, TipoContrato, TipoRemuneracion } from './nomina-parametros.model';

export type EstadoVinculacion = 'ACTIVO' | 'SUSPENDIDO' | 'TERMINADO';
export type FaseAprendiz = 'LECTIVA' | 'PRACTICA';

export interface VinculacionTableModel {
  id: number;
  codigo: string | null;
  empleadoId: number;
  empleadoNombre: string;
  empleadoDocumento: string;
  tipoVinculacionNombre: string | null;
  cargoNombre: string | null;
  grupoNominaNombre: string | null;
  tipoContrato: TipoContrato;
  tipoRemuneracion: TipoRemuneracion;
  salarioBase: number;
  fechaInicio: string;
  fechaFin: string | null;
  fechaFinPrueba: string | null;
  esPrincipal: boolean;
  estado: EstadoVinculacion;
}

export interface VinculacionModel {
  id: number;
  codigo: string | null;
  estado: EstadoVinculacion;
  empleadoId: number;
  /** Tercero del empleado (lo usa el buscador de terceros). */
  terceroId: number | null;
  empleadoNombre: string;
  empleadoDocumento: string;

  tipoVinculacionId: number | null;
  tipoVinculacionNombre: string | null;
  cargoId: number | null;
  cargoNombre: string | null;
  grupoNominaId: number | null;
  grupoNominaNombre: string | null;
  tipoContrato: TipoContrato;
  temporal: boolean;
  tipoRemuneracion: TipoRemuneracion;
  salarioBase: number;
  frecuenciaPago: FrecuenciaPago | null;
  horasSemana: number | null;
  calendarioId: number | null;
  calendarioNombre: string | null;
  fechaInicio: string;
  fechaFin: string | null;
  fechaFinPrueba: string | null;
  fase: FaseAprendiz | null;
  esPrincipal: boolean;
  primerEmpleo: boolean;

  sucursalId: number | null;
  sucursalNombre: string | null;
  area: string | null;
  municipioTrabajo: string | null;
  municipioTrabajoId: number | null;
  direccionTrabajo: string | null;
  telefonoTrabajo: string | null;
  jefeDirectoId: number | null;
  jefeDirectoTerceroId: number | null;
  jefeDirectoNombre: string | null;
  evaluadorId: number | null;
  evaluadorTerceroId: number | null;
  evaluadorNombre: string | null;

  tipoCotizante: string | null;
  subtipoCotizante: string | null;
  riesgoArlId: number | null;
  riesgoArlNombre: string | null;
  enExtranjero: boolean;

  docInternoTipo: string | null;
  docInternoNumero: string | null;
  docInternoFecha: string | null;
  docInternoUrl: string | null;
  docExternoUrl: string | null;

  causaRetiro: string | null;
  observacion: string | null;
}

export interface CreateVinculacionDto {
  /** Tercero del empleado; el back resuelve su ficha de empleado. */
  terceroId: number;
  tipoVinculacionId: number;
  cargoId: number;
  grupoNominaId: number | null;
  tipoContrato: TipoContrato;
  temporal: boolean;
  tipoRemuneracion: TipoRemuneracion;
  /** Solo al crear; después se cambia con historial. */
  salarioBase: number | null;
  frecuenciaPago: FrecuenciaPago;
  horasSemana: number | null;
  calendarioId: number | null;
  fechaInicio: string;
  fechaFin: string | null;
  fechaFinPrueba: string | null;
  fase: FaseAprendiz | null;
  esPrincipal: boolean;
  primerEmpleo: boolean;

  sucursalId: number | null;
  area: string | null;
  municipioTrabajoId: number | null;
  direccionTrabajo: string | null;
  telefonoTrabajo: string | null;
  jefeDirectoTerceroId: number | null;
  evaluadorTerceroId: number | null;

  tipoCotizante: string | null;
  subtipoCotizante: string | null;
  riesgoArlId: number | null;
  enExtranjero: boolean;

  docInternoTipo: string | null;
  docInternoNumero: string | null;
  docInternoFecha: string | null;
  observacion: string | null;
}

export const OPCIONES_ACTO_ADMINISTRATIVO = [
  { label: 'Resolución', value: 'RESOLUCION' },
  { label: 'Contrato', value: 'CONTRATO' },
  { label: 'Otrosí', value: 'OTROSI' },
  { label: 'Acta', value: 'ACTA' },
  { label: 'Otro', value: 'OTRO' },
];

// ── Pestañas de la vinculación (V212) ─────────────────────────────────────

/** Un centro de costo de la vinculación con su porcentaje. */
export interface CentroCostoVinculacion {
  centroCostoId: number;
  centroCostoCodigo?: string | null;
  centroCostoNombre?: string | null;
  porcentaje: number;
}

/** Concepto propio de la vinculación (bonificación fija, auxilio…). */
export interface VinculacionConcepto {
  id: number;
  conceptoCodigo: string;
  conceptoNombre: string | null;
  clase: string | null;
  cantidad: number | null;
  valor: number | null;
  porcentaje: number | null;
  fechaDesde: string;
  fechaHasta: string | null;
  observacion: string | null;
}

export interface CreateVinculacionConceptoDto {
  conceptoCodigo: string;
  cantidad: number | null;
  valor: number | null;
  porcentaje: number | null;
  fechaDesde: string;
  fechaHasta: string | null;
  observacion: string | null;
}

/** Concepto que se le puede registrar como novedad, con tope por período. */
export interface NovedadPermitida {
  id: number;
  conceptoCodigo: string;
  conceptoNombre: string | null;
  clase: string | null;
  topeCantidad: number | null;
  topeValor: number | null;
  requiereAutorizacion: boolean;
}

export interface CreateNovedadPermitidaDto {
  conceptoCodigo: string;
  topeCantidad: number | null;
  topeValor: number | null;
  requiereAutorizacion: boolean;
}

export interface FiltroVinculacion {
  estado: EstadoVinculacion | null;
  tipoVinculacionId: number | null;
  cargoId: number | null;
  grupoNominaId: number | null;
}

export type TipoSoporteVinculacion = 'interno' | 'externo';
