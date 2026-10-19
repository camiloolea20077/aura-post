/** Envío de documentos por correo (docs/PLAN_CUENTA_COBRO_CORREO.md, backend). */

import { PdfAdjunto } from '../../shared/utils/pdf-adjunto';

/**
 * Grupo de documentos: decide la ruta y el permiso (Facturas de venta, Cotizaciones, Cartera).
 * cartera = cobro al cliente: documentoId es el cliente y el estado de cuenta lo adjunta el servidor.
 */
export type GrupoCorreo = 'facturas' | 'cotizaciones' | 'cartera';

export type EstadoCorreo = 'PENDIENTE' | 'ENVIANDO' | 'ENVIADO' | 'FALLIDO';

export interface SugerenciaCorreo {
  para: string[];
  asunto: string;
  mensaje: string;
  /** El envío de correos está configurado en el servidor. */
  disponible: boolean;
}

export interface EnviarCorreo {
  para: string[];
  cc: string[];
  asunto: string;
  mensaje: string | null;
  /** null en el cobro de cartera: el servidor adjunta el estado de cuenta. */
  adjunto: PdfAdjunto | null;
}

export interface CorreoFila {
  id: number;
  tipo: string;
  documentoId: number;
  destinatario: string;
  asunto: string;
  estado: EstadoCorreo;
  error: string | null;
  createdAt: string;
  enviadoAt: string | null;
  usuarioNombre: string | null;
  empleadoNombre: string | null;
}

/** Un comprobante del lote de nómina: el correo del empleado lo pone el backend. */
export interface ItemLoteNomina {
  nominaId: number;
  adjunto: PdfAdjunto;
}

export interface LoteNomina {
  loteId: string | null;
  asunto: string;
  mensaje: string | null;
  items: ItemLoteNomina[];
}

export interface LoteEncolado {
  loteId: string;
  encolados: number;
  /** Empleados sin correo: no se encolaron. */
  sinCorreo: string[];
}

export interface ResumenLote {
  loteId: string;
  total: number;
  pendientes: number;
  enviados: number;
  fallidos: number;
  filas: CorreoFila[];
}
