/**
 * Reporte gerencial de auditoría.
 *
 * El mismo filtro alimenta la vista previa (JSON) y el PDF, así que lo que se
 * ve en pantalla es exactamente lo que sale impreso.
 */

export type Severidad = 'ALTA' | 'MEDIA' | 'BAJA';

export type AreaAuditoria =
  | 'CAJA'
  | 'CARTERA'
  | 'INVENTARIO'
  | 'CONTABILIDAD'
  | 'GASTOS'
  | 'FACTURACION';

export interface AuditoriaFiltroDto {
  fechaDesde?: string | null;
  fechaHasta?: string | null;
  /** Trae las filas de cada hallazgo. Pesado: solo cuando se van a mostrar. */
  incluirDetalle?: boolean;
  limiteDetalle?: number;
  /**
   * Debajo de este monto un descuadre de caja o cartera es redondeo, no un
   * problema. No aplica a los asientos: ahí la partida doble cuadra al centavo.
   */
  umbralMonto?: number | null;
  incluirHeredados?: boolean;
}

export interface HallazgoDetalleModel {
  referencia: string;
  fecha: string | null;
  descripcion: string;
  monto: number;
  origenTipo: string | null;
  origenId: number | null;
}

export interface HallazgoModel {
  codigo: string;
  titulo: string;
  descripcion: string;
  /** Las dos fuentes que se compararon: lo que hace defendible la cifra. */
  cruce: string;
  recomendacion: string;
  /** Hipótesis ordenadas por frecuencia, no diagnósticos. */
  causasProbables: string[];
  severidad: Severidad;
  area: AreaAuditoria;
  cantidad: number;
  monto: number;
  /** La magnitud cuando el monto no cuenta la historia ("10 unidades"). */
  magnitud: string | null;
  heredado: boolean;
  detalle: HallazgoDetalleModel[];
  /** Evidencia de otra área que ayuda a explicar el hallazgo. */
  contexto: HallazgoDetalleModel[];
  contextoTitulo: string | null;
}

export interface AuditoriaResultadoModel {
  fechaDesde: string;
  fechaHasta: string;
  generadoEn: string;
  duracionMs: number;
  hallazgos: HallazgoModel[];
  /** Descuadres anteriores a las correcciones: van aparte, no mezclados. */
  heredados: HallazgoModel[];
  alta: number;
  media: number;
  baja: number;
  /** Suma de los hallazgos ALTA. Mezclar severidades daría una cifra sin sentido. */
  montoEnRiesgo: number;
}
