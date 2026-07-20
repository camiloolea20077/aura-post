/**
 * Afiliaciones a seguridad social por contrato (Fase 5.5 / backend
 * `AfiliacionController`).
 *
 * Bloquea PILA. La entidad se elige del catálogo nacional, nunca se digita el
 * código: si cada cliente lo digitara, divergirían y PILA se rechazaría.
 */

export type TipoAfiliacion = 'EPS' | 'AFP' | 'CCF' | 'ARL' | 'CESANTIAS';

export const TIPOS_AFILIACION: { tipo: TipoAfiliacion; label: string }[] = [
  { tipo: 'EPS', label: 'Salud (EPS)' },
  { tipo: 'AFP', label: 'Pensión (AFP)' },
  { tipo: 'CCF', label: 'Caja de compensación (CCF)' },
  { tipo: 'ARL', label: 'Riesgos laborales (ARL)' },
  { tipo: 'CESANTIAS', label: 'Cesantías (fondo)' },
];

/** Una entrada del catálogo nacional. */
export interface EntidadSeguridadSocial {
  id: number;
  tipo: TipoAfiliacion;
  codigoOficial: string | null;
  nit: string | null;
  nombre: string;
}

export interface AfiliacionModel {
  id: number;
  tipo: TipoAfiliacion;
  entidadId: number | null;
  entidadNombre: string | null;
  entidadNit: string | null;
  /** null = el tercero no está enlazado al catálogo → sin código para PILA. */
  codigoOficial: string | null;
  fechaDesde: string;
  fechaHasta: string | null;
  vigente: boolean;
}

export interface AfiliarDto {
  /** Id del tercero (EPS/AFP/CCF/ARL) elegido del selector. */
  entidadId: number;
  /** EPS | AFP | CCF | ARL. */
  tipo: TipoAfiliacion;
  /** Desde cuándo rige. En un traslado, PILA deriva las banderas de esta fecha. */
  desde: string;
}

export interface TipoCotizanteDto {
  tipoCotizante: string;
  subtipoCotizante?: string | null;
}

/** Tipos de cotizante UGPP más comunes (código → etiqueta). */
export const TIPOS_COTIZANTE: { value: string; label: string }[] = [
  { value: '01', label: '01 - Dependiente' },
  { value: '02', label: '02 - Servicio doméstico' },
  { value: '12', label: '12 - Aprendiz Sena en lectiva' },
  { value: '19', label: '19 - Aprendiz Sena en productiva' },
  { value: '21', label: '21 - Estudiante (Decreto 055/2015)' },
  { value: '22', label: '22 - Profesor de establecimiento particular' },
  { value: '23', label: '23 - Desempleado con subsidio de caja' },
  { value: '30', label: '30 - Dependiente entidad o universidad pública' },
  { value: '51', label: '51 - Trabajador de tiempo parcial' },
];
