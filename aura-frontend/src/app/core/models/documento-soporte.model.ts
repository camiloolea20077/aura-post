/**
 * Documento soporte electrónico: lo que se emite ante la DIAN cuando se le
 * compra a alguien que no está obligado a facturar. Sin él, la compra o el
 * gasto no es deducible.
 */

export type OrigenDocumentoSoporte = 'COMPRA' | 'GASTO';
export type EstadoDocumentoSoporte = 'ACEPTADO' | 'RECHAZADO' | 'ELIMINADO';

export interface DocumentoSoporteModel {
  id: number;
  origenTipo: OrigenDocumentoSoporte;
  origenId: number;
  terceroId: number | null;
  terceroNombre: string | null;
  referenceCode: string;
  numero: string | null;
  cude: string | null;
  estado: EstadoDocumentoSoporte;
  total: number | null;
  retenciones: number | null;
  mensajeError: string | null;
  createdAt: string;
}

export interface PreviaItemModel {
  codigo: string;
  nombre: string;
  cantidad: number;
  precio: number;
  descuentoPct: number | null;
  ivaPct: number | null;
}

export interface PreviaDocumentoSoporteModel {
  origenTipo: OrigenDocumentoSoporte;
  origenId: number;
  origenNumero: string;
  terceroId: number | null;
  proveedorDocumento: string | null;
  proveedorNombre: string | null;
  proveedorDireccion: string | null;
  proveedorMunicipio: string | null;
  items: PreviaItemModel[];
  base: number;
  iva: number;
  total: number;
  retenciones: number;
  netoAPagar: number;
  formaPago: 'CONTADO' | 'CREDITO';
  faltantes: string[];
  advertencias: string[];
  puedeEmitirse: boolean;
  aceptado: DocumentoSoporteModel | null;
  intentos: DocumentoSoporteModel[];
}

export interface EmitirDocumentoSoporteDto {
  origenTipo: OrigenDocumentoSoporte;
  origenId: number;
  numberingRangeId?: string | null;
  observacion?: string | null;
}
