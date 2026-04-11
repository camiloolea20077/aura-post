export interface PeriodoContableModel {
  id: number;
  anio: number;
  mes: number;
  estado: 'ABIERTO' | 'CERRADO';
  fechaApertura: string;
  fechaCierre: string | null;
  observaciones: string | null;
  createdAt: string;
  totalAsientos: number;
}

export interface AbrirPeriodoDto {
  anio: number;
  mes: number;
  observaciones?: string | null;
}

export interface CerrarPeriodoDto {
  observaciones?: string | null;
}

export interface BalanceComprobacionLinea {
  cuentaId: number;
  codigo: string;
  nombre: string;
  tipo: string;
  naturaleza: string;
  totalDebito: number;
  totalCredito: number;
  saldo: number;
}

export interface BalanceComprobacionModel {
  periodoId: number;
  anio: number;
  mes: number;
  estadoPeriodo: string;
  lineas: BalanceComprobacionLinea[];
  totalDebito: number;
  totalCredito: number;
  cuadrado: boolean;
}

export const MESES = [
  { label: 'Enero',      value: 1  },
  { label: 'Febrero',    value: 2  },
  { label: 'Marzo',      value: 3  },
  { label: 'Abril',      value: 4  },
  { label: 'Mayo',       value: 5  },
  { label: 'Junio',      value: 6  },
  { label: 'Julio',      value: 7  },
  { label: 'Agosto',     value: 8  },
  { label: 'Septiembre', value: 9  },
  { label: 'Octubre',    value: 10 },
  { label: 'Noviembre',  value: 11 },
  { label: 'Diciembre',  value: 12 },
];
