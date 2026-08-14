/**
 * Desprendible de pago (Fase 10 / backend `CertificadoController`).
 *
 * Sale de `nomina_detalle` con su `traza` (Fase 3): cada línea trae el desglose
 * paso a paso del cálculo, que es lo que permite explicarle al empleado de dónde
 * salió cada número.
 */

/** Un paso del cálculo, como viene serializado en `nomina_detalle.traza`. */
export interface PasoTraza {
  paso: string;
  valor: string;
}

export interface LineaDesprendible {
  concepto: string;
  cantidad: number | null;
  base: number | null;
  porcentaje: number | null;
  valor: number;
  /** JSON crudo de la traza; se parsea con {@link parseTraza}. */
  traza: string | null;
}

export interface DesprendibleModel {
  nominaId: number;
  empresaRazonSocial: string | null;
  empresaNit: string | null;

  empleadoNombre: string | null;
  empleadoDocumento: string | null;
  cargo: string | null;

  periodoInicio: string | null;
  periodoFin: string | null;
  diasTrabajados: number | null;
  salarioBase: number | null;

  devengados: LineaDesprendible[];
  deducciones: LineaDesprendible[];

  totalDevengado: number;
  totalDeducciones: number;
  netoPagar: number;

  banco: string | null;
  tipoCuenta: string | null;
  numeroCuenta: string | null;
}

/**
 * Parsea la traza JSON de una línea a pasos.
 *
 * El backend la guarda como texto (viene de una columna JSONB); si está vacía o
 * corrupta se devuelve una lista vacía en vez de romper la vista.
 */
export function parseTraza(traza: string | null): PasoTraza[] {
  if (!traza) return [];
  try {
    const parsed = JSON.parse(traza);
    return Array.isArray(parsed) ? (parsed as PasoTraza[]) : [];
  } catch {
    return [];
  }
}
