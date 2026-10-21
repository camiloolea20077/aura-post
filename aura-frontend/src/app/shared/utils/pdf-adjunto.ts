import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || pdfFonts;

/** PDF listo para adjuntar a un correo: el mismo que se descarga, en base64. */
export interface PdfAdjunto {
  nombre: string;
  base64: string;
}

/** Genera el PDF de una definición de pdfmake y lo devuelve en base64 (sin "data:"). */
export function pdfABase64(doc: any): Promise<string> {
  const pdf: any = pdfMake.createPdf(doc);
  // pdfmake 0.3 devuelve una promesa; versiones anteriores usan callback.
  return new Promise<string>((resolve, reject) => {
    try {
      const r = pdf.getBase64((b64: string) => resolve(b64));
      if (r && typeof r.then === 'function') r.then(resolve, reject);
    } catch (e) {
      reject(e);
    }
  });
}
