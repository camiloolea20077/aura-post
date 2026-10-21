// Cartera C5 (intereses de mora) y C9 (deterioro y castigo). Espejo de MoraCastigoDtos.

export interface PoliticaCarteraModel {
  interesActivo: boolean;
  /** % mensual pactado. */
  tasaMoraMensual: number;
  /** % mensual de usura vigente, la registra el usuario. */
  tasaUsuraMensual: number;
  usuraVigenteHasta: string | null;
  diasGracia: number;
  /** Días de mora mínimos → % de deterioro. */
  deterioroTramos: Record<string, number>;
  diasSugerirCastigo: number;
  // Solo lectura
  tasaAplicable?: number | null;
  avisos?: string[];
  updatedAt?: string | null;
}

export interface InteresCuentaModel {
  cuentaCobrarId: number;
  numeroCuenta: string;
  referencia: string | null;
  fechaVencimiento: string;
  saldo: number;
  diasMora: number;
  desde: string;
  hasta: string;
  dias: number;
  valor: number;
}

export interface InteresClienteModel {
  terceroId: number;
  terceroNombre: string;
  documento: string | null;
  saldoVencido: number;
  valor: number;
  cuentas: InteresCuentaModel[];
}

export interface CalculoInteresModel {
  fecha: string;
  interesActivo: boolean;
  tasaMensual: number;
  diasGracia: number;
  total: number;
  clientes: InteresClienteModel[];
  avisos: string[];
}

export interface FacturarInteresDto {
  terceroId: number;
  fecha: string | null;
  plazoDias: number | null;
  cuentaCobrarIds: number[] | null;
  observaciones: string | null;
}

export interface InteresDetalleModel {
  cuentaCobrarId: number;
  numeroCuenta: string;
  desde: string;
  hasta: string;
  dias: number;
  saldoBase: number;
  valor: number;
}

export type EstadoInteresMora = 'FACTURADO' | 'ANULADO';

export interface InteresMoraModel {
  id: number;
  numero: string;
  fecha: string;
  terceroId: number;
  terceroNombre: string;
  documento: string | null;
  tasaMensual: number;
  valor: number;
  cuentaCobrarId: number | null;
  numeroCuenta: string | null;
  saldoCuenta: number | null;
  estado: EstadoInteresMora;
  observaciones: string | null;
  motivoAnulacion: string | null;
  usuarioNombre: string | null;
  createdAt: string;
  detalle: InteresDetalleModel[];
}

export interface ResumenInteresClienteModel {
  interesActivo: boolean;
  tasaMensual: number;
  causado: number;
  facturadoPendiente: number;
  cuentas: InteresCuentaModel[];
}

export interface DeterioroFacturaModel {
  cuentaCobrarId: number;
  numeroCuenta: string;
  terceroNombre: string;
  fechaVencimiento: string;
  diasMora: number;
  saldo: number;
  porcentaje: number;
  valor: number;
}

export interface DeterioroSugeridoModel {
  fecha: string;
  tramos: Record<string, number>;
  totalCalculado: number;
  provisionActual: number;
  /** calculado − provisión; negativo = sobra provisión. */
  ajuste: number;
  borradoresPendientes: number;
  facturas: DeterioroFacturaModel[];
}

export interface CandidatoCastigoModel {
  cuentaCobrarId: number;
  numeroCuenta: string;
  referencia: string | null;
  terceroId: number;
  terceroNombre: string;
  documento: string | null;
  fechaVencimiento: string;
  diasMora: number;
  saldo: number;
}

export interface CastigarDto {
  cuentaCobrarIds: number[];
  fecha: string | null;
  motivo: string;
}

export type EstadoCastigo = 'CASTIGADO' | 'ANULADO';

export interface CastigoModel {
  id: number;
  numero: string;
  fecha: string;
  cuentaCobrarId: number;
  numeroCuenta: string;
  terceroId: number;
  terceroNombre: string;
  documento: string | null;
  valor: number;
  contraProvision: number;
  contraGasto: number;
  diasMora: number;
  motivo: string;
  estado: EstadoCastigo;
  motivoAnulacion: string | null;
  usuarioNombre: string | null;
  createdAt: string;
}

export interface PaginaModel<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
}
