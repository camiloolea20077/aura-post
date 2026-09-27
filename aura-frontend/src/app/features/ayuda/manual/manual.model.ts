/**
 * Manual de usuario de Aura. El contenido vive en código (no en la base) para
 * que viaje con cada versión: si una pantalla cambia, su manual cambia en el
 * mismo commit. Es también la base de conocimiento del futuro asistente.
 */

/** Un error que el usuario puede ver, con su causa y cómo salir de él. */
export interface ManualError {
  /** El mensaje tal como aparece en pantalla (o su comienzo). */
  mensaje: string;
  causa: string;
  solucion: string;
}

export interface ManualSeccion {
  titulo: string;
  /** Párrafos de explicación. */
  texto?: string[];
  /** Pasos numerados. */
  pasos?: string[];
  /** Consejos o advertencias que se muestran resaltados. */
  notas?: string[];
}

export interface ManualModulo {
  id: string;
  grupo: string;
  titulo: string;
  icono: string;
  /** Rutas de las pantallas que explica: el botón de ayuda abre este módulo desde ellas. */
  rutas: string[];
  resumen: string;
  secciones: ManualSeccion[];
  errores: ManualError[];
}
