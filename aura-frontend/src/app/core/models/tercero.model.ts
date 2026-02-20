// ─── Tipos de documento ───────────────────────────────────────
export type TipoDocumento = 'NIT' | 'CC' | 'CE' | 'PAS' | 'TI' | 'RUT';

export const TIPO_DOCUMENTO_OPTIONS: { label: string; value: TipoDocumento }[] =
  [
    { label: 'NIT', value: 'NIT' },
    { label: 'Cédula (CC)', value: 'CC' },
    { label: 'Cédula Extranjería', value: 'CE' },
    { label: 'Pasaporte', value: 'PAS' },
    { label: 'Tarjeta de Identidad', value: 'TI' },
    { label: 'RUT', value: 'RUT' },
  ];

export const RESPONSABILIDAD_FISCAL_OPTIONS = [
  { label: 'Responsable de IVA', value: 'Responsable de IVA' },
  { label: 'No responsable de IVA', value: 'No responsable de IVA' },
  { label: 'Gran contribuyente', value: 'Gran contribuyente' },
  { label: 'Régimen simple', value: 'Régimen simple' },
  { label: 'Autorretenedor', value: 'Autorretenedor' },
];

// ─── Detalle ─────────────────────────────────────────────────
export interface TerceroModel {
  id: number;
  empresaId: number;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  dv: string | null;
  razonSocial: string | null;
  nombres: string | null;
  apellidos: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  emailFe: string | null;
  responsabilidadFiscal: string | null;
  esCliente: boolean;
  esProveedor: boolean;
  esEmpleado: boolean;
  activo: boolean;
}

// ─── Tabla ───────────────────────────────────────────────────
export interface TerceroTableModel {
  id: number;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombreCompleto: string;
  telefono: string | null;
  email: string | null;
  esCliente: boolean;
  esProveedor: boolean;
  esEmpleado: boolean;
  activo: boolean;
}

// ─── DTOs ────────────────────────────────────────────────────
export interface CreateTerceroDto {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  dv: string | null;
  razonSocial: string | null;
  nombres: string | null;
  apellidos: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  emailFe: string | null;
  responsabilidadFiscal: string | null;
  esCliente: boolean;
  esProveedor: boolean;
  esEmpleado: boolean;
  activo: boolean;
}

export interface UpdateTerceroDto extends CreateTerceroDto {
  id: number;
}

// ─── Pageable ─────────────────────────────────────────────────
export interface TerceroPageableDto {
  page: number;
  rows: number;
  search?: string | null;
  order_by?: string | null;
  order?: string | null;
}

// ─── Helper ───────────────────────────────────────────────────
export function esPersonaJuridica(tipo: TipoDocumento): boolean {
  return tipo === 'NIT' || tipo === 'RUT';
}
