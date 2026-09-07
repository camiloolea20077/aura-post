export type OrigenFondos =
  | 'CREDITO'
  | 'CAJA'
  | 'BANCO'
  | 'CUENTA'
  | 'CAJA_OTRO_DIA';

export interface GastoModel {
  id: number;
  empresaId: number;
  sucursalId: number | null;
  sucursalNombre: string | null;
  usuarioId: number | null;
  usuarioNombre: string | null;
  categoria: string;
  descripcion: string | null;
  monto: number;
  fecha: string;
  deducible: boolean;
  estado: string;
  createdAt: string;
  // Origen de fondos (V142)
  formaPago: 'CONTADO' | 'CREDITO' | null;
  metodoPago: string | null;
  cuentaBancariaId: number | null;
  /** Cuenta acreditada (crédito); distinta de cuentaContableId. */
  cuentaPagoId: number | null;
  /** La plata ya había salido del cajón otro día y ese arqueo ya se cerró. */
  salidaCajaOtroDia: boolean | null;
  /**
   * De dónde salió la plata, tal como se preguntó al registrarlo.
   *
   * Lo calcula el backend. Antes el formulario lo deducía de las tres piezas
   * sueltas, pero no alcanzan: un pago de caja normal también deja
   * `cuentaPagoId` lleno — con la cuenta de CAJA que resolvió el sistema — y
   * cualquier gasto en efectivo se reabría como "Otra cuenta".
   */
  origenFondos: OrigenFondos | null;
  // Campos tributarios (V54)
  terceroId: number | null;
  terceroNombre: string | null;
  cuentaContableId: number | null;
  cuentaContableNombre: string | null;
  centroCostoId: number | null;
  periodoContableId: number | null;
  baseIva: number;
  tarifaIva: number;
  valorIva: number;
  baseRetefuente: number;
  tarifaRetefuente: number;
  valorRetefuente: number;
  baseReteica: number;
  tarifaReteica: number;
  valorReteica: number;
  tipoDocSoporte: string | null;
  numeroDocSoporte: string | null;
}

export interface GastoTableModel {
  id: number;
  categoria: string;
  descripcion: string | null;
  monto: number;
  fecha: string;
  deducible: boolean;
  estado: string;
  sucursalNombre: string | null;
  usuarioNombre: string | null;
}

export interface CreateGastoDto {
  sucursalId: number;
  categoria: string;
  descripcion: string | null;
  monto: number;
  fecha: string | null;
  deducible: boolean;
  // Origen de fondos (V142): de dónde sale la plata.
  formaPago: 'CONTADO' | 'CREDITO';
  metodoPago: string;
  /** Cuenta bancaria de la que sale el pago. */
  cuentaBancariaId: number | null;
  /** Cuenta contable de la que sale el pago — el CRÉDITO del asiento. */
  cuentaPagoId: number | null;
  fechaVencimiento?: string | null;
  // Campos tributarios (V54)
  terceroId: number | null;

  /**
   * Por qué un documento de fecha anterior se carga a la caja de hoy. El
   * backend lo exige solo cuando excede la ventana de gracia de la empresa y
   * el pago va por caja.
   */
  motivoRetroactivo?: string | null;

  /**
   * La plata ya salió del cajón otro día y ese arqueo ya se cerró. Registra el
   * documento contablemente contra CAJA, sin tocar ningún arqueo.
   */
  salidaCajaOtroDia?: boolean;


  /** Cuenta de gasto a la que se imputa — el DÉBITO. No confundir con cuentaPagoId. */
  cuentaContableId: number | null;
  centroCostoId: number | null;
  periodoContableId: number | null;
  baseIva: number;
  tarifaIva: number;
  valorIva: number;
  baseRetefuente: number;
  tarifaRetefuente: number;
  valorRetefuente: number;
  baseReteica: number;
  tarifaReteica: number;
  valorReteica: number;
  tipoDocSoporte: string | null;
  numeroDocSoporte: string | null;
}

export const TIPO_DOC_SOPORTE_OPTIONS = [
  { label: 'Factura', value: 'FACTURA' },
  { label: 'Documento Soporte', value: 'DOCUMENTO_SOPORTE' },
  { label: 'Recibo', value: 'RECIBO' },
  { label: 'Otro', value: 'OTRO' },
];

export const CATEGORIAS_GASTO = [
  { label: 'Arriendo / Alquiler', value: 'ARRIENDO', deducible: true },
  { label: 'Servicios públicos', value: 'SERVICIOS_PUBLICOS', deducible: true },
  { label: 'Salario diario', value: 'SALARIO_DIARIO', deducible: false },
  { label: 'Nómina / Salarios', value: 'NOMINA', deducible: false },
  { label: 'Papelería / Insumos', value: 'PAPELERIA', deducible: true },
  { label: 'Transporte / Fletes', value: 'TRANSPORTE', deducible: true },
  { label: 'Publicidad', value: 'PUBLICIDAD', deducible: true },
  { label: 'Multas / Sanciones', value: 'MULTA', deducible: false },
  { label: 'Gastos personales', value: 'PERSONAL', deducible: false },
  { label: 'Mantenimiento', value: 'MANTENIMIENTO', deducible: true },
  { label: 'Otro deducible', value: 'OTRO_DEDUCIBLE', deducible: true },
  { label: 'Otro no deducible', value: 'OTRO_NO_DEDUCIBLE', deducible: false },
];

// ─── Reporte de gastos ─────────────────────────────────────────

export type AgrupacionGastos =
  | 'CATEGORIA'
  | 'TERCERO'
  | 'CENTRO_COSTO'
  | 'CUENTA'
  | 'MES'
  | 'SUCURSAL';

export interface ReporteGastosFiltroDto {
  page?: number;
  rows?: number;
  fechaDesde?: string | null;
  fechaHasta?: string | null;
  sucursalId?: number | null;
  categoria?: string | null;
  terceroId?: number | null;
  centroCostoId?: number | null;
  cuentaContableId?: number | null;
  proyectoId?: number | null;
  formaPago?: string | null;
  metodoPago?: string | null;
  /** true solo deducibles, false solo no deducibles, null ambos. */
  deducible?: boolean | null;
  search?: string | null;
  /** ACTIVO por defecto; TODOS para auditar lo eliminado. */
  estado?: string | null;
  agrupacion?: AgrupacionGastos;
}

export interface ReporteGastosLineaModel {
  grupo: string;
  grupoId: number | null;
  cantidad: number;
  total: number;
  totalDeducible: number;
  totalNoDeducible: number;
  totalContado: number;
  totalCredito: number;
  baseIva: number;
  valorIva: number;
  valorRetefuente: number;
  valorReteica: number;
  participacion: number;
}

/**
 * Los totales vienen del período completo, no de sumar `lineas`: si el resumen
 * se paginara, el pie tiene que seguir cuadrando con la declaración.
 */
export interface ReporteGastosResumenModel {
  lineas: ReporteGastosLineaModel[];
  cantidad: number;
  total: number;
  totalDeducible: number;
  totalNoDeducible: number;
  totalContado: number;
  totalCredito: number;
  baseIva: number;
  valorIva: number;
  valorRetefuente: number;
  valorReteica: number;
}

export interface ReporteGastosDetalleModel {
  id: number;
  fecha: string;
  categoria: string;
  descripcion: string | null;
  terceroNombre: string | null;
  terceroDocumento: string | null;
  sucursalNombre: string | null;
  centroCostoNombre: string | null;
  cuentaCodigo: string | null;
  cuentaNombre: string | null;
  proyectoNombre: string | null;
  monto: number;
  deducible: boolean;
  formaPago: string;
  metodoPago: string;
  tipoDocSoporte: string | null;
  numeroDocSoporte: string | null;
  baseIva: number;
  valorIva: number;
  valorRetefuente: number;
  valorReteica: number;
  salidaCajaOtroDia: boolean;
  motivoRetroactivo: string | null;
  estado: string;
  usuarioNombre: string | null;
  totalRows: number;
}
