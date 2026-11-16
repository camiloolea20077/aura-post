/**
 * Nube de documentos de la empresa (back: /api/nube, docs/PLAN_NUBE_DOCUMENTOS.md).
 * Ningún modelo trae URL del archivo: solo se baja por la descarga autenticada.
 */

export type VisibilidadCarpeta = 'COMPARTIDA' | 'SOLO_FIRMA';

export interface NubeCarpeta {
  id: number;
  padreId: number | null;
  nombre: string;
  visibilidad: VisibilidadCarpeta;
  nivel: number;
  creadaPorFirma: boolean;
  createdAt: string;
  deletedAt: string | null;
}

export interface NubeArchivo {
  id: number;
  carpetaId: number | null;
  nombre: string;
  extension: string;
  mime: string;
  tamanoBytes: number;
  sha256: string;
  subidoPorFirma: boolean;
  createdAt: string;
  deletedAt: string | null;
}

export interface NubeTramoRuta {
  id: number;
  nombre: string;
}

export interface NubeContenido {
  carpeta: NubeCarpeta | null;
  ruta: NubeTramoRuta[];
  carpetas: NubeCarpeta[];
  archivos: NubeArchivo[];
}

export type EstadoSolicitudEspacio = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export interface NubeSolicitudEspacio {
  id: number;
  cuotaActualMb: number;
  cuotaSolicitadaMb: number;
  estado: EstadoSolicitudEspacio;
  observacion: string | null;
  createdAt: string;
  atendidoAt: string | null;
}

/** aviso: null, "80", "95" o "LLENO". */
export interface NubeUso {
  usadoBytes: number;
  cuotaBytes: number;
  archivos: number;
  maxArchivos: number;
  porcentaje: number;
  aviso: '80' | '95' | 'LLENO' | null;
  terminosAceptados: boolean;
  terminosVersion: string;
  esFirma: boolean;
  esAdministrador: boolean;
  extensionesPermitidas: string[];
  maxBytesArchivo: number;
  solicitud: NubeSolicitudEspacio | null;
}

export interface NubePapelera {
  carpetas: NubeCarpeta[];
  archivos: NubeArchivo[];
}

export interface NubeEvento {
  id: number;
  accion: string;
  usuarioId: number;
  usuario: string | null;
  porFirma: boolean;
  archivoId: number | null;
  carpetaId: number | null;
  detalle: string | null;
  ip: string | null;
  createdAt: string;
}

export interface CrearCarpetaNube {
  nombre: string;
  padreId: number | null;
  visibilidad?: VisibilidadCarpeta;
}

/** Renombrar y/o mover; moverA con raiz=true = a la raíz. */
export interface ActualizarCarpetaNube {
  nombre?: string;
  moverA?: number | null;
  raiz?: boolean;
  visibilidad?: VisibilidadCarpeta;
}

export interface ActualizarArchivoNube {
  nombre?: string;
  moverA?: number | null;
  raiz?: boolean;
}

/** Panel de plataforma: solicitud de más espacio (sin documentos, solo uso). */
export interface SolicitudEspacioPlataforma {
  id: number;
  empresaId: number;
  empresaNombre: string;
  empresaNit: string;
  solicitadoPor: string | null;
  cuotaActualMb: number;
  cuotaSolicitadaMb: number;
  usadoBytes: number;
  estado: EstadoSolicitudEspacio;
  createdAt: string;
}
