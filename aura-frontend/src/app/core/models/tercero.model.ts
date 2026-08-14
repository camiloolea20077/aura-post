// ─── Tipos de documento ───────────────────────────────────────
export type TipoDocumento = 'NIT' | 'CC' | 'CE' | 'PAS' | 'TI' | 'RUT';

// ─── Constantes fiscales ──────────────────────────────────────
export const TIPO_PERSONA_OPTIONS = [
  { label: 'Persona Natural', value: 'NATURAL' },
  { label: 'Persona Jurídica', value: 'JURIDICA' },
];
export const REGIMEN_OPTIONS = [
  { label: 'No responsable de IVA', value: 'NO_RESPONSABLE_IVA' },
  { label: 'Responsable de IVA', value: 'RESPONSABLE_IVA' },
  { label: 'Gran Contribuyente', value: 'GRAN_CONTRIBUYENTE' },
  { label: 'Régimen Simple', value: 'REGIMEN_SIMPLE' },
];

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

export const SEXO_OPTS = [
  { label: 'Masculino', value: 'M' },
  { label: 'Femenino', value: 'F' },
  { label: 'Otro', value: 'OTRO' },
];

export type Sexo = 'M' | 'F' | 'OTRO';

/**
 * Campos de identificación y fiscales de la Fase 1 (backend V97).
 *
 * Se comparten entre TerceroModel y los DTOs: son los mismos campos de ida y
 * de vuelta.
 */
export interface TerceroCamposFase1 {
  // ── Identificación desagregada ─────────────────────────────
  // La DIAN (nómina electrónica) y la UGPP (PILA) exigen los CUATRO
  // componentes por separado. No partir `nombres`/`apellidos` con split(' '):
  // falla con "DE LA ROSA", "VAN DER BERG" o nombres de una sola palabra.
  // El backend tampoco lo hace, a propósito.
  nombre1: string | null;
  nombre2: string | null;
  apellido1: string | null;
  apellido2: string | null;

  // ── Persona natural — requeridos por PILA ──────────────────
  fechaNacimiento: string | null;
  sexo: Sexo | null;
  fechaExpedicionDocumento: string | null;
  municipioExpedicionId: number | null;

  // ── Persona jurídica ───────────────────────────────────────
  // El representante legal es obligatorio en el encabezado de PILA.
  nombreComercial: string | null;
  representanteLegalNombre: string | null;
  representanteLegalDocumento: string | null;

  // ── Fiscal ─────────────────────────────────────────────────
  // `autoRetenedor` era uno solo, pero son autorretenciones DISTINTAS:
  // se puede ser de renta y no de ICA.
  esAutoretenedorIca: boolean;
  esAutoretenedorFuente: boolean;
  declarante: boolean;

  // ── Bancario ───────────────────────────────────────────────
  bancoTerceroId: number | null;
  tipoCuenta: string | null;
  numeroCuenta: string | null;
}

// ─── Detalle ─────────────────────────────────────────────────
export interface TerceroModel extends TerceroCamposFase1 {
  id: number;
  empresaId: number;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  dv: string | null;
  razonSocial: string | null;
  /** @deprecated Usar nombre1/nombre2. Se conserva para compatibilidad. */
  nombres: string | null;
  /** @deprecated Usar apellido1/apellido2. */
  apellidos: string | null;
  direccion: string | null;
  municipioId: number | null;
  municipio?: string | null;
  telefono: string | null;
  email: string | null;
  emailFe: string | null;
  responsabilidadFiscal: string | null;
  esCliente: boolean;
  esProveedor: boolean;
  esEmpleado: boolean;
  esBanco?: boolean;
  activo: boolean;
  // Campos fiscales (V52)
  tipoPersona: 'NATURAL' | 'JURIDICA';
  regimen: string;
  granContribuyente: boolean;
  /** @deprecated Usar esAutoretenedorIca / esAutoretenedorFuente. */
  autoRetenedor: boolean;
  codigoCIIU: string | null;
  actividadEconomica: string | null;
  pais: string;
  codigoPais: string;
  /** Roles del tercero (backend V98). Solo lectura. */
  roles?: string[];
  /** Nombre del banco (resuelto) para mostrar en el selector. Solo lectura. */
  bancoTerceroNombre?: string | null;
  /** Código oficial UGPP si es EPS/AFP/CCF/ARL (V120). */
  codigoSeguridadSocial?: string | null;
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
  esBanco?: boolean;
  activo: boolean;
  /** Todos los roles reales (tercero_rol), separados por coma. */
  roles?: string | null;
}

// ─── DTOs ────────────────────────────────────────────────────
/**
 * Los campos de la Fase 1 son OPCIONALES al crear/editar.
 *
 * El backend los tiene nullable, y no todos los flujos los necesitan: el modal
 * de creación rápida (un cliente durante una venta) no debe pedir fecha de
 * nacimiento ni representante legal. Los exige quien los necesita —el formulario
 * completo— y PILA valida su presencia al liquidar, no al crear el tercero.
 */
export interface CreateTerceroDto extends Partial<TerceroCamposFase1> {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  dv: string | null;
  razonSocial: string | null;
  /** @deprecated Usar nombre1/nombre2. */
  nombres: string | null;
  /** @deprecated Usar apellido1/apellido2. */
  apellidos: string | null;
  direccion: string | null;
  municipioId: number;
  municipio?: string | null;
  telefono: string | null;
  email: string | null;
  emailFe: string | null;
  responsabilidadFiscal: string | null;
  esCliente: boolean;
  esProveedor: boolean;
  esEmpleado: boolean;
  esBanco?: boolean;
  activo: boolean;
  // Campos fiscales (V52)
  tipoPersona: 'NATURAL' | 'JURIDICA';
  regimen: string;
  granContribuyente: boolean;
  /** @deprecated Usar esAutoretenedorIca / esAutoretenedorFuente. */
  autoRetenedor: boolean;
  codigoCIIU: string | null;
  actividadEconomica: string | null;
  pais: string;
  codigoPais: string;
  /** Roles de seguridad social a asignar: EPS | AFP | CCF | ARL (V120). */
  roles?: string[];
  /** Código oficial UGPP si es EPS/AFP/CCF/ARL (V120). */
  codigoSeguridadSocial?: string | null;
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

// ─── Municipio ───────────────────────────────────────────────
export interface MunicipioDto {
  id: number;
  nombre: string;
  label: string;
  codigoDane: string | null;
}

// ─── Estado de cuenta ────────────────────────────────────────
export interface MovimientoCuentaModel {
  tipo: 'VENTA' | 'ABONO' | 'NOTA_CREDITO' | 'NOTA_DEBITO';
  fecha: string;
  referencia: string;
  descripcion: string;
  cargo: number;
  abono: number;
  saldoAcumulado: number;
  esCredito: boolean;
}

export interface EstadoCuentaClienteModel {
  clienteId: number;
  nombreCliente: string;
  tipoDocumento: string;
  numeroDocumento: string;
  email: string | null;
  telefono: string | null;
  municipio: string | null;
  totalVentas: number;
  totalDeuda: number;
  totalAbonado: number;
  saldoPendiente: number;
  cuentasActivas: number;
  cuentasVencidas: number;
  movimientos: MovimientoCuentaModel[];
}
