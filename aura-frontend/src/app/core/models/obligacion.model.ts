export interface CuotaAmortizacionModel {
  id: number;
  numeroCuota: number;
  fechaVencimiento: string;
  cuota: number;
  abonoCapital: number;
  interes: number;
  saldo: number;
  estado: string;
  fechaPago: string | null;
}

export interface ObligacionModel {
  id: number;
  entidad: string;
  terceroId: number | null;
  numero: string | null;
  montoPrincipal: number;
  tasaMensual: number;
  plazoMeses: number;
  fechaDesembolso: string;
  cuentaBancariaId: number | null;
  saldoCapital: number;
  estado: string;
  cuotas: CuotaAmortizacionModel[];
}

export interface CreateObligacionDto {
  entidad: string;
  terceroId: number | null;
  numero: string | null;
  montoPrincipal: number;
  tasaMensual: number;
  plazoMeses: number;
  fechaDesembolso: string;
  cuentaBancariaId: number | null;
}
