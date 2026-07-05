export type TipoPlan = 'UNICO' | 'MENSUAL';
export type EstadoMembresia = 'PRUEBA' | 'ACTIVA' | 'SUSPENDIDA' | 'CANCELADA';
export type MetodoPago =
  | 'EFECTIVO'
  | 'TRANSFERENCIA'
  | 'TARJETA'
  | 'PASARELA'
  | 'OTRO';

export interface ClienteModel {
  empresaId: number;
  razonSocial: string;
  nombreComercial: string | null;
  nit: string;
  activa: boolean;

  tieneSuscripcion: boolean;
  suscripcionId: number | null;
  tipoPlan: TipoPlan | null;
  estado: EstadoMembresia | null;
  estadoEfectivo: string; // ACTIVA | VENCIDA | SUSPENDIDA | CANCELADA | PRUEBA | SIN_MEMBRESIA
  vencida: boolean;
  diasParaVencer: number | null;

  valor: number | null;
  moneda: string | null;
  fechaInicio: string | null;
  fechaProximoPago: string | null;

  contactoNombre: string | null;
  contactoEmail: string | null;
  contactoTelefono: string | null;

  totalPagado: number | null;
  ultimoPago: string | null;
}

export interface ClientesResumen {
  totalClientes: number;
  activos: number;
  vencidos: number;
  enPrueba: number;
  suspendidos: number;
  cancelados: number;
  mensuales: number;
  unicos: number;
  sinMembresia: number;
  mrr: number;
  recaudadoMesActual: number;
}

export interface GuardarSuscripcionDto {
  tipoPlan: TipoPlan;
  estado?: EstadoMembresia;
  valor?: number | null;
  moneda?: string | null;
  fechaInicio?: string | null;
  fechaProximoPago?: string | null;
  diaCobro?: number | null;
  contactoNombre?: string | null;
  contactoEmail?: string | null;
  contactoTelefono?: string | null;
  notas?: string | null;
}

export interface RegistrarPagoDto {
  fechaPago: string;
  monto: number;
  metodo?: MetodoPago | null;
  periodoDesde?: string | null;
  periodoHasta?: string | null;
  referencia?: string | null;
  observacion?: string | null;
  avanzarProximoPago?: boolean;
}

export interface SuscripcionPagoModel {
  id: number;
  fechaPago: string;
  monto: number;
  metodo: string | null;
  periodoDesde: string | null;
  periodoHasta: string | null;
  referencia: string | null;
  observacion: string | null;
}
