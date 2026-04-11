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
  // Campos tributarios (V54)
  terceroId: number | null;
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
  { label: 'Arriendo / Alquiler',      value: 'ARRIENDO', deducible: true  },
  { label: 'Servicios públicos',        value: 'SERVICIOS_PUBLICOS', deducible: true  },
  { label: 'Salario diario',            value: 'SALARIO_DIARIO', deducible: false },
  { label: 'Nómina / Salarios',         value: 'NOMINA', deducible: false },
  { label: 'Papelería / Insumos',       value: 'PAPELERIA', deducible: true  },
  { label: 'Transporte / Fletes',       value: 'TRANSPORTE', deducible: true  },
  { label: 'Publicidad',                value: 'PUBLICIDAD', deducible: true  },
  { label: 'Multas / Sanciones',        value: 'MULTA', deducible: false },
  { label: 'Gastos personales',         value: 'PERSONAL', deducible: false },
  { label: 'Mantenimiento',             value: 'MANTENIMIENTO', deducible: true  },
  { label: 'Otro deducible',            value: 'OTRO_DEDUCIBLE', deducible: true  },
  { label: 'Otro no deducible',         value: 'OTRO_NO_DEDUCIBLE', deducible: false },
];
