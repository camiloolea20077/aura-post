/**
 * Causación de gastos y servicios (docs/PLAN_EXCEL_IMPORTADORES_MODULOS.md §4 en el
 * backend): la factura de un proveedor de servicios con varias líneas, IVA y
 * retenciones. Deja una cuenta por pagar por el neto y un asiento.
 */

export type TipoSoporteCausacion = 'FACTURA' | 'DOCUMENTO_SOPORTE' | 'CUENTA_COBRO' | 'OTRO';
export type EstadoCausacion = 'CAUSADA' | 'ANULADA';

export interface CausacionLineaCrear {
  cuentaId: number | null;
  descripcion: string | null;
  centroCostoId: number | null;
  base: number | null;
  tarifaIva: number | null;
  ivaDescontable: boolean;
  tarifaRetencionId: number | null;
  /** Tarifa de retefuente escrita a mano; manda sobre la del concepto. */
  tarifaRetefuente: number | null;
  tarifaReteiva: number | null;
  tarifaReteica: number | null;
}

export interface CausacionCrear {
  terceroId: number | null;
  sucursalId: number | null;
  fecha: string | null;
  fechaVencimiento: string | null;
  tipoSoporte: TipoSoporteCausacion;
  numeroSoporte: string | null;
  descripcion: string | null;
  cuentaPagarContableId: number | null;
  lineas: CausacionLineaCrear[];
}

export interface CausacionLinea {
  id?: number;
  cuentaId: number;
  cuentaCodigo?: string | null;
  cuentaNombre?: string | null;
  descripcion: string | null;
  centroCostoId: number | null;
  centroCostoNombre?: string | null;
  base: number;
  tarifaIva: number;
  valorIva: number;
  ivaDescontable: boolean;
  tarifaRetencionId: number | null;
  conceptoRetencion: string | null;
  tarifaRetefuente: number;
  valorRetefuente: number;
  tarifaReteiva: number;
  valorReteiva: number;
  tarifaReteica: number;
  valorReteica: number;
}

export interface CausacionCalculo {
  lineas: CausacionLinea[];
  subtotal: number;
  iva: number;
  retefuente: number;
  reteiva: number;
  reteica: number;
  totalPagar: number;
  tipoPersona: 'NATURAL' | 'JURIDICA';
  avisos: string[];
}

export interface CausacionDetalle extends CausacionCalculo {
  id: number;
  numero: string;
  terceroId: number;
  terceroNombre: string;
  terceroDocumento: string | null;
  sucursalId: number | null;
  sucursalNombre: string | null;
  fecha: string;
  fechaVencimiento: string | null;
  tipoSoporte: TipoSoporteCausacion;
  numeroSoporte: string | null;
  descripcion: string | null;
  cuentaPagarContableId: number | null;
  cuentaPagarCodigo: string | null;
  cuentaPagarNombre: string | null;
  cuentaPagarId: number | null;
  saldoPendiente: number | null;
  estado: EstadoCausacion;
  motivoAnulacion: string | null;
  createdAt: string;
  comprobante: string | null;
}

export interface CausacionFila {
  id: number;
  consecutivo: number;
  fecha: string;
  fechaVencimiento: string | null;
  terceroNombre: string;
  tipoSoporte: TipoSoporteCausacion;
  numeroSoporte: string | null;
  descripcion: string | null;
  subtotal: number;
  iva: number;
  retenciones: number;
  totalPagar: number;
  saldoPendiente: number;
  estado: EstadoCausacion;
}

export interface CausacionFiltro {
  estado?: EstadoCausacion | null;
  desde?: string | null;
  hasta?: string | null;
}

export const TIPOS_SOPORTE_CAUSACION: { label: string; value: TipoSoporteCausacion }[] = [
  { label: 'Factura electrónica', value: 'FACTURA' },
  { label: 'Documento soporte', value: 'DOCUMENTO_SOPORTE' },
  { label: 'Cuenta de cobro', value: 'CUENTA_COBRO' },
  { label: 'Otro', value: 'OTRO' },
];

export const etiquetaSoporte = (t: TipoSoporteCausacion | null | undefined): string =>
  TIPOS_SOPORTE_CAUSACION.find((x) => x.value === t)?.label ?? t ?? '';
