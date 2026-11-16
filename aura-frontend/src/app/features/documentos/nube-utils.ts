import { NubeArchivo, NubeUso } from '../../core/models/nube.model';

/** Días que algo dura en la papelera antes de borrarse solo (igual al back). */
export const DIAS_PAPELERA = 30;

/** Versión del texto de términos (igual a NubeServiceImpl.TERMINOS_VERSION). */
export const TERMINOS_VERSION = '1';

/** Archivos por subida (igual a NubeServiceImpl.MAX_ARCHIVOS_POR_SUBIDA). */
export const MAX_ARCHIVOS_POR_SUBIDA = 10;

/** 1 536 000 → "1,5 MB". */
export function formatoBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2).replace('.', ',')} GB`;
}

/** 1024 → "1 GB", 500 → "500 MB". */
export function formatoMb(mb: number): string {
  return mb >= 1024 && mb % 1024 === 0 ? `${mb / 1024} GB` : `${mb} MB`;
}

const ICONOS: Record<string, string> = {
  pdf: 'pi pi-file-pdf',
  xlsx: 'pi pi-file-excel',
  xls: 'pi pi-file-excel',
  csv: 'pi pi-file-excel',
  docx: 'pi pi-file-word',
  jpg: 'pi pi-image',
  jpeg: 'pi pi-image',
  png: 'pi pi-image',
  webp: 'pi pi-image',
  xml: 'pi pi-code',
  txt: 'pi pi-file',
};

export function iconoArchivo(extension: string): string {
  return ICONOS[extension?.toLowerCase()] ?? 'pi pi-file';
}

export type TipoVista = 'pdf' | 'imagen' | 'texto' | null;

/** Qué se puede ver sin descargar (el resto solo se descarga). */
export function tipoVista(a: NubeArchivo): TipoVista {
  const ext = a.extension?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return 'imagen';
  if (['txt', 'csv', 'xml'].includes(ext)) return 'texto';
  return null;
}

/** Días que le quedan en la papelera (0 = se borra hoy o mañana temprano). */
export function diasRestantes(deletedAt: string | null): number {
  if (!deletedAt) return DIAS_PAPELERA;
  const borrado = new Date(deletedAt).getTime();
  const vence = borrado + DIAS_PAPELERA * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((vence - Date.now()) / (24 * 60 * 60 * 1000)));
}

/**
 * Revisión rápida antes de subir (el back revisa de verdad el contenido):
 * tamaño y extensión. Devuelve los que sí pasan y los motivos de los que no.
 */
export function revisarAntesDeSubir(
  archivos: File[],
  uso: NubeUso,
): { validos: File[]; rechazados: string[] } {
  const permitidas = new Set(uso.extensionesPermitidas.map((e) => e.toLowerCase()));
  const validos: File[] = [];
  const rechazados: string[] = [];
  for (const f of archivos) {
    const ext = f.name.includes('.') ? f.name.split('.').pop()!.toLowerCase() : '';
    if (f.size > uso.maxBytesArchivo) rechazados.push(`${f.name}: pesa más de ${formatoBytes(uso.maxBytesArchivo)}`);
    else if (f.size === 0) rechazados.push(`${f.name}: está vacío`);
    else if (!permitidas.has(ext)) rechazados.push(`${f.name}: tipo no permitido`);
    else validos.push(f);
  }
  return { validos, rechazados };
}

/** Opciones de espacio a solicitar: las mayores a la cuota actual. */
export function opcionesCuota(cuotaActualBytes: number): { label: string; value: number }[] {
  const actualMb = Math.round(cuotaActualBytes / 1024 / 1024);
  return [1024, 2048, 5120, 10240]
    .filter((mb) => mb > actualMb)
    .map((mb) => ({ label: formatoMb(mb), value: mb }));
}

const ACCIONES: Record<string, string> = {
  SUBIR: 'Subió',
  DESCARGAR: 'Descargó',
  VER: 'Vio',
  RENOMBRAR: 'Renombró',
  MOVER: 'Movió',
  ELIMINAR: 'Envió a la papelera',
  RESTAURAR: 'Restauró',
  PURGAR: 'Borró para siempre',
  CREAR_CARPETA: 'Creó la carpeta',
  ACCESO_DENEGADO: 'Intento de acceso denegado',
  ACEPTAR_TERMINOS: 'Aceptó los términos',
  SOLICITAR_ESPACIO: 'Solicitó más espacio',
  AMPLIAR_CUOTA: 'Aura amplió el espacio',
  RECHAZAR_ESPACIO: 'Aura rechazó la solicitud',
  LIBERAR_PRIVADA: 'Carpeta privada pasó a compartida',
};

export function textoAccion(accion: string): string {
  return ACCIONES[accion] ?? accion;
}
