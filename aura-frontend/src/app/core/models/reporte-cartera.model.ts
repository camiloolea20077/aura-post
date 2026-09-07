/**
 * Estado de cuenta de cartera: clientes (CXC) y proveedores (CXP).
 *
 * Un solo modelo para las dos caras. La pregunta es la misma — quién debe qué,
 * desde cuándo — y duplicarlo garantizaría que una de las dos se quede atrás.
 */

export type TipoCartera = 'CXC' | 'CXP';

/** PENDIENTE arranca por defecto: lo ya pagado entierra lo que falta cobrar. */
export type EstadoCartera = 'PENDIENTE' | 'VENCIDA' | 'PAGADA' | 'TODAS';

export interface ReporteCarteraFiltroDto {
  tipo: TipoCartera;
  page?: number;
  rows?: number;
  fechaDesde?: string | null;
  fechaHasta?: string | null;
  terceroId?: number | null;
  estado?: EstadoCartera;
  diasMoraMin?: number | null;
  search?: string | null;
  /** Trae los abonos de cada documento: lo que lo vuelve un estado de cuenta. */
  incluirAbonos?: boolean;
}

/**
 * Un abono. `cajaNombre` es el dato que no existía hasta que los abonos de
 * comprobante quedaron atados a su turno: permite responder "¿quién recibió
 * este abono y dónde cayó?" sin buscar en los arqueos uno por uno.
 */
export interface ReporteCarteraAbonoModel {
  id: number;
  cuentaId: number;
  fechaPago: string;
  monto: number;
  metodoPago: string | null;
  referencia: string | null;
  turnoCajaId: number | null;
  cajaNombre: string | null;
  usuarioNombre: string | null;
  cajaOtroDia: boolean;
}

export interface ReporteCarteraDocumentoModel {
  id: number;
  numeroCuenta: string;
  numeroFacturaExterno: string | null;
  terceroId: number | null;
  terceroNombre: string;
  terceroDocumento: string | null;
  fechaEmision: string;
  fechaVencimiento: string | null;
  totalDeuda: number;
  totalAbonado: number;
  saldoPendiente: number;
  /** Negativo si aún no vence: una sola columna dice las dos cosas. */
  diasMora: number;
  edad: string;
  estado: string;
  abonos: ReporteCarteraAbonoModel[];
  totalRows: number;
}

export interface ReporteCarteraTerceroModel {
  terceroId: number | null;
  terceroNombre: string;
  terceroDocumento: string | null;
  terceroTelefono: string | null;
  documentos: number;
  totalDeuda: number;
  totalAbonado: number;
  saldoPendiente: number;
  corriente: number;
  mora1a30: number;
  mora31a60: number;
  mora61a90: number;
  moraMas90: number;
  /** La mora más vieja del tercero: por dónde empezar a llamar. */
  diasMoraMax: number;
  totalRows: number;
}

export interface ReporteCarteraResumenModel {
  tipo: TipoCartera;
  terceros: ReporteCarteraTerceroModel[];
  documentos: number;
  cantidadTerceros: number;
  totalDeuda: number;
  totalAbonado: number;
  saldoPendiente: number;
  corriente: number;
  mora1a30: number;
  mora31a60: number;
  mora61a90: number;
  moraMas90: number;
}
