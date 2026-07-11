// E8 · Cierre anual fiscal: provisión de renta, traslado 3605→3705,
// distribución de utilidades y pago de dividendos.

export interface CierreAnualOperacion {
  id: number;
  anio: number;
  tipo: 'PROVISION_RENTA' | 'TRASLADO';
  monto: number;
  detalle: string | null;
  fecha: string;
  createdAt?: string;
}

export interface SugerenciaProvision {
  anio: number;
  utilidadAntesDeImpuesto: number;
  tarifa: number;
  provisionSugerida: number;
  yaProvisionado: boolean;
}

export interface ProvisionRentaDto {
  anio: number;
  monto: number;
  detalle?: string | null;
  fecha?: string | null;
}

export interface SugerenciaDistribucion {
  utilidadesAcumuladas: number;
  reservaLegalActual: number;
  capitalSocial: number;
  topeReservaLegal: number | null;
  reservaSugerida: number;
  dividendosDisponibles: number;
}

export interface DistribucionUtilidades {
  id: number;
  anio: number;
  utilidadBase: number;
  reservaLegal: number;
  dividendos: number;
  observaciones: string | null;
  fecha: string;
}

export interface DistribucionDto {
  anio: number;
  reservaLegal: number;
  dividendos: number;
  observaciones?: string | null;
  fecha?: string | null;
}

export interface DividendoPago {
  id: number;
  distribucionId: number;
  monto: number;
  metodoPago: string;
  cuentaBancariaId: number | null;
  terceroId: number | null;
  fecha: string;
}

export interface PagoDividendoDto {
  distribucionId: number;
  monto: number;
  metodoPago: string;
  cuentaBancariaId?: number | null;
  terceroId?: number | null;
  fecha?: string | null;
}
