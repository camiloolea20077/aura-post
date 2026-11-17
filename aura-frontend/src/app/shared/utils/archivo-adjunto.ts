import { PdfAdjunto } from './pdf-adjunto';

/** Documento adicional elegido para un correo, ya leído en base64. */
export interface ArchivoAdjunto extends PdfAdjunto {
  /** Tamaño en bytes, para mostrarlo y validar el total. */
  tamano: number;
}

/** Lo que se puede adjuntar además del PDF del documento (igual que el backend). */
export const EXTENSIONES_ADJUNTO = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'xlsx', 'xls', 'docx', 'doc', 'csv', 'txt'];
export const MAX_ADJUNTOS = 5;
/** Total de los documentos adicionales (el PDF del documento va aparte). */
export const MAX_TOTAL_ADJUNTOS = 15 * 1024 * 1024;

/** Lee un archivo del equipo como base64 (sin el prefijo data:). */
export function leerArchivo(file: File): Promise<ArchivoAdjunto> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const texto = String(r.result ?? '');
      resolve({ nombre: file.name, base64: texto.substring(texto.indexOf(',') + 1), tamano: file.size });
    };
    r.onerror = () => reject(new Error(`No se pudo leer ${file.name}`));
    r.readAsDataURL(file);
  });
}

/**
 * Por qué un archivo no se puede agregar a la lista actual; null si se puede.
 */
export function motivoRechazo(file: File, actuales: ArchivoAdjunto[]): string | null {
  const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
  if (!EXTENSIONES_ADJUNTO.includes(ext))
    return `${file.name}: tipo no permitido. Se aceptan PDF, imágenes (JPG, PNG), Excel, Word, CSV y TXT.`;
  if (file.size === 0) return `${file.name} está vacío.`;
  if (actuales.length >= MAX_ADJUNTOS) return `Máximo ${MAX_ADJUNTOS} documentos adicionales.`;
  const total = actuales.reduce((s, a) => s + a.tamano, 0) + file.size;
  if (total > MAX_TOTAL_ADJUNTOS) return `Los documentos adicionales no pueden pasar de 15 MB en total.`;
  if (actuales.some((a) => a.nombre === file.name)) return `${file.name} ya está adjunto.`;
  return null;
}

/** "1,2 MB", "340 KB". */
export function tamanoTexto(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
