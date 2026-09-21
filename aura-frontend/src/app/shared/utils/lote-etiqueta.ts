/** Lote como lo devuelve /lotes/disponibles. */
export interface LoteParaEtiqueta {
  codigoLote: string;
  fechaVencimiento: string | null;
  stockActual: number;
  diasParaVencer?: number | null;
}

/**
 * "L2409-A · vence 01/03/2027 · 6" o "VIN-C · VENCIDO 01/09/2026 · 1": el
 * vencimiento a la vista para que nadie elija a ciegas.
 */
export function etiquetaLote(l: LoteParaEtiqueta): string {
  const stock = Number(l.stockActual ?? 0).toLocaleString('es-CO', {
    maximumFractionDigits: 4,
  });
  if (!l.fechaVencimiento) return `${l.codigoLote} · sin vencimiento · ${stock}`;
  const [a, m, d] = l.fechaVencimiento.split('-');
  const fecha = `${d}/${m}/${a}`;
  const dias = l.diasParaVencer;
  const vencido = dias !== null && dias !== undefined && dias < 0;
  return `${l.codigoLote} · ${vencido ? 'VENCIDO' : 'vence'} ${fecha} · ${stock}`;
}
