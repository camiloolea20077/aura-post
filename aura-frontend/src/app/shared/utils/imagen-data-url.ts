/**
 * Descarga una imagen (el logo de la empresa) como dataURL para pdfmake.
 *
 * Devuelve null si no hay URL, si el servidor no deja leerla (CORS), si la
 * respuesta no es 2xx o si lo que llega no es una imagen. Ojo: cuando el fetch
 * falla, el service worker responde un 504 sintético sin cuerpo; antes ese
 * cuerpo vacío se convertía en dataURL y pdfmake reventaba con "Unknown image
 * format". pdfmake solo entiende PNG y JPEG: otros formatos (webp, gif, svg)
 * se pasan a PNG con un canvas.
 */
export async function imagenDataUrl(url?: string | null): Promise<string | null> {
  if (!url) return null;
  if (/^data:image\/(png|jpe?g);/i.test(url)) return url;
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.size || !blob.type.startsWith('image/')) return null;
    if (/^image\/(png|jpe?g)$/i.test(blob.type)) return await leerDataUrl(blob);
    return await aPng(blob);
  } catch {
    return null;
  }
}

function leerDataUrl(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onloadend = () => resolve(typeof r.result === 'string' ? r.result : null);
    r.onerror = () => resolve(null);
    r.readAsDataURL(blob);
  });
}

async function aPng(blob: Blob): Promise<string | null> {
  const src = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = src;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 1;
    canvas.height = img.naturalHeight || 1;
    canvas.getContext('2d')?.drawImage(img, 0, 0);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(src);
  }
}
