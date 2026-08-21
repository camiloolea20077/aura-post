/**
 * Traslado de dinero entre dos bolsillos de la propia empresa.
 *
 * No es ni una compra ni un gasto: no hay tercero, no hay resultado, solo cambia
 * dónde está la plata. Cubre la constitución y el reembolso de la caja menor, la
 * consignación del efectivo del día al banco y los movimientos entre bancos.
 */

/** De dónde sale o a dónde entra el dinero. */
export type ExtremoTraslado = 'CAJA' | 'BANCO' | 'CUENTA';

export type ConceptoTraslado =
  | 'CONSTITUCION_CAJA_MENOR'
  | 'REEMBOLSO_CAJA_MENOR'
  | 'CONSIGNACION'
  | 'TRASLADO';

export interface TrasladoFondosModel {
  id: number;
  sucursalId: number | null;
  fecha: string;
  monto: number;

  origenTipo: ExtremoTraslado;
  origenTurnoCajaId: number | null;
  origenCuentaBancoId: number | null;
  origenCuentaId: number | null;
  /** Nombre legible que arma el backend: "Caja Principal", "Bancolombia"… */
  origenNombre: string | null;

  destinoTipo: ExtremoTraslado;
  destinoTurnoCajaId: number | null;
  destinoCuentaBancoId: number | null;
  destinoCuentaId: number | null;
  destinoNombre: string | null;

  concepto: ConceptoTraslado;
  observacion: string | null;
  responsableId: number | null;
  responsableNombre: string | null;
  usuarioId: number | null;
  estado: 'CONFIRMADO' | 'ANULADO';
  createdAt: string | null;
}

/**
 * De cada extremo se manda el tipo y **solo** el identificador que le
 * corresponde. El backend rechaza las combinaciones incoherentes en vez de
 * adivinar, así que mandar dos identificadores es un error, no una ayuda.
 */
export interface CreateTrasladoFondosDto {
  sucursalId: number | null;
  fecha: string | null;
  monto: number;

  origenTipo: ExtremoTraslado;
  origenTurnoCajaId: number | null;
  origenCuentaBancoId: number | null;
  origenCuentaId: number | null;

  destinoTipo: ExtremoTraslado;
  destinoTurnoCajaId: number | null;
  destinoCuentaBancoId: number | null;
  destinoCuentaId: number | null;

  concepto: ConceptoTraslado;
  observacion: string | null;
  responsableId: number | null;
}

/**
 * Los conceptos con su explicación contable. Son solo etiquetas — el asiento es
 * el mismo (débito destino, crédito origen) — pero permiten listar "los
 * reembolsos de caja menor del mes" sin leer observaciones una por una.
 */
export const CONCEPTOS_TRASLADO: {
  label: string;
  value: ConceptoTraslado;
  hint: string;
}[] = [
  {
    label: 'Constituir caja menor',
    value: 'CONSTITUCION_CAJA_MENOR',
    hint: 'Entrega inicial del fondo al administrador. Después sus gastos salen de esa cuenta y no del arqueo del cajero.',
  },
  {
    label: 'Reembolsar caja menor',
    value: 'REEMBOLSO_CAJA_MENOR',
    hint: 'Repone el fondo por lo que ya se gastó y legalizó.',
  },
  {
    label: 'Consignación bancaria',
    value: 'CONSIGNACION',
    hint: 'El efectivo del día pasa del cajón a la cuenta del banco.',
  },
  {
    label: 'Traslado',
    value: 'TRASLADO',
    hint: 'Cualquier otro movimiento entre cuentas propias.',
  },
];

export const EXTREMOS_TRASLADO: {
  label: string;
  value: ExtremoTraslado;
  hint: string;
}[] = [
  {
    label: 'Caja',
    value: 'CAJA',
    hint: 'Un turno de caja abierto. Mueve su arqueo.',
  },
  {
    label: 'Banco',
    value: 'BANCO',
    hint: 'Una cuenta bancaria de la empresa.',
  },
  {
    label: 'Cuenta contable',
    value: 'CUENTA',
    hint: 'Caja menor y otras cuentas de fondos.',
  },
];
