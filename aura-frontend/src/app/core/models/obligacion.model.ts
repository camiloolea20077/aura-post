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
  metodoPago?: string | null;
  cuentaBancariaIdPago?: number | null;
}

/**
 * Origen del dinero al pagar una cuota. Todos los campos son opcionales:
 * si se omite, el pago sale de la cuenta bancaria del desembolso.
 */
export interface PagarCuotaDto {
  metodoPago?: string | null;
  cuentaBancariaId?: number | null;
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
