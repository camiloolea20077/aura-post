export interface ComprobanteCajaModel {
  id: number;
  numeroComprobante: string;
  tipo: 'INGRESO' | 'EGRESO';
  concepto: string;
  monto: number;
  metodoPago?: string;    // EFECTIVO | TRANSFERENCIA
  entregadoA?: string;
  origen: string;         // MANUAL | DEVOLUCION | ABONO_CXC | ABONO_CXP
  origenId?: number;
  turnoCajaId?: number;
  usuarioId?: number;
  createdAt: string;
  totalRows?: number;
}

export interface ComprobanteCajaPageableDto {
  page: number;
  rows: number;
  tipo?: string;
  desde?: string;
  hasta?: string;
}
