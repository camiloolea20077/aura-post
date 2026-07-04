export type TipoPrestacion =
  | 'PRIMA'
  | 'VACACIONES'
  | 'CESANTIAS'
  | 'INTERESES_CESANTIAS'
  | 'INDEMNIZACION';
export type EstadoPrestacion = 'BORRADOR' | 'APROBADA' | 'PAGADA' | 'ANULADA';

export interface PrestacionModel {
  id: number;
  empleadoId: number;
  empleadoNombre: string;
  empleadoDocumento: string;
  tipo: TipoPrestacion;
  fechaDesde: string;
  fechaHasta: string;
  dias: number;
  baseSalarial: number;
  valor: number;
  estado: EstadoPrestacion;
  medioPago: string | null;
  cuentaBancariaId: number | null;
  fechaPago: string | null;
  observacion: string | null;
  createdAt: string;
}

export interface CrearPrestacionDto {
  empleadoId: number;
  tipo: TipoPrestacion;
  fechaDesde: string;
  fechaHasta: string;
  observacion?: string | null;
}

export type MotivoRetiro =
  | 'RENUNCIA'
  | 'DESPIDO_SIN_JUSTA_CAUSA'
  | 'DESPIDO_CON_JUSTA_CAUSA'
  | 'MUTUO_ACUERDO'
  | 'FIN_CONTRATO';

export interface LiquidacionDefinitivaDto {
  empleadoId: number;
  fechaRetiro?: string | null;
  motivo?: MotivoRetiro | null;
}
