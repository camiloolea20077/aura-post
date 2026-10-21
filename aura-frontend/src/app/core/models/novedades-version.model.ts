/**
 * Novedades de una versión desplegada. Se escriben en `appData` de
 * `ngsw-config.json` en cada envío y el service worker las entrega con el aviso
 * de versión nueva (VersionReadyEvent.latestVersion.appData).
 */
export interface CambioVersion {
  /** Módulo o pantalla a la que afecta (p. ej. "Nómina electrónica"). */
  modulo: string;
  /** Qué cambia, en una o dos frases para el usuario. */
  texto: string;
}

export interface NovedadesVersion {
  /** Identificador del envío (p. ej. "2026.10.12"); si no cambia, no se muestran novedades. */
  version: string;
  cambios: CambioVersion[];
}

/** Las novedades de la versión nueva, solo si su `version` difiere de la actual. */
export function novedadesNuevas(actual: unknown, nueva: unknown): CambioVersion[] {
  const n = nueva as NovedadesVersion | undefined;
  const a = actual as NovedadesVersion | undefined;
  if (!n?.cambios?.length || n.version === a?.version) return [];
  return n.cambios;
}
