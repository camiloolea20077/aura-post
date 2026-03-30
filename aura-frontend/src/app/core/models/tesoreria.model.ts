export type TipoMovimiento = 'EGRESO' | 'RECAUDO' | 'TRANSFERENCIA_SALIDA' | 'TRANSFERENCIA_ENTRADA';

export interface TesoreriaMovimientoModel {
  id: number;
  cuentaBancariaId: number;
  cuentaBancariaNombre: string;
  tipo: TipoMovimiento;
  monto: number;
  concepto: string;
  beneficiario: string | null;
  referencia: string | null;
  fecha: string;
  categoria: string | null;
  conciliado: boolean;
  anulado: boolean;
}

export interface CreateMovimientoDto {
  cuentaBancariaId: number;
  monto: number;
  concepto: string;
  beneficiario?: string | null;
  referencia?: string | null;
  fecha: string;
  categoria: string;
}

export const CATEGORIAS_EGRESO = [
  { label: 'Pago a proveedor',  value: 'PAGO_PROVEEDOR' },
  { label: 'Gasto operativo',   value: 'GASTO_OPERATIVO' },
  { label: 'Nómina',            value: 'NOMINA' },
  { label: 'Impuesto',          value: 'IMPUESTO' },
  { label: 'Servicio',          value: 'SERVICIO' },
  { label: 'Otros',             value: 'OTROS' },
];

export const CATEGORIAS_RECAUDO = [
  { label: 'Venta',             value: 'VENTA' },
  { label: 'Cobro de cartera',  value: 'COBRO_CARTERA' },
  { label: 'Préstamo',          value: 'PRESTAMO' },
  { label: 'Devolución',        value: 'DEVOLUCION' },
  { label: 'Otros',             value: 'OTROS' },
];

export const CATEGORIA_LABELS: Record<string, string> = {
  PAGO_PROVEEDOR: 'Pago a proveedor',
  GASTO_OPERATIVO: 'Gasto operativo',
  NOMINA: 'Nómina',
  IMPUESTO: 'Impuesto',
  SERVICIO: 'Servicio',
  VENTA: 'Venta',
  COBRO_CARTERA: 'Cobro cartera',
  PRESTAMO: 'Préstamo',
  DEVOLUCION: 'Devolución',
  OTROS: 'Otros',
};
