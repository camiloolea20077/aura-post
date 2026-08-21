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
