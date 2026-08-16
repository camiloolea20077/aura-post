export interface ComprobanteCajaModel {
  id: number;
  numeroComprobante: string;
  tipo: 'INGRESO' | 'EGRESO';
  concepto: string;
  monto: number;
  metodoPago?: string;    // EFECTIVO | TRANSFERENCIA
  entregadoA?: string;
  origen: string;         // MANUAL | DEVOLUCION | ABONO_CXC | ABONO_CXP | COMPRA | GASTO
  origenId?: number;
  turnoCajaId?: number;
  usuarioId?: number;
  createdAt: string;
  /**
   * El comprobante conserva su número pero ya no soporta ningún pago: el
   * documento que lo originó pasó a crédito o se anuló.
   */
  anulado?: boolean;
  motivoAnulacion?: string;
  totalRows?: number;
}

export interface ComprobanteCajaPageableDto {
  page: number;
  rows: number;
  tipo?: string;
  desde?: string;
  hasta?: string;
}
