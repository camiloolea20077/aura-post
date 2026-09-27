import { Injectable } from '@angular/core';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || pdfFonts;

import { ManualModulo } from '../manual/manual.model';
import { GRUPOS_MANUAL, MANUAL } from '../manual/manual';

const AZUL = '#2563eb';
const GRIS = '#64748b';
const OSCURO = '#1e293b';
const SUAVE = '#eff6ff';
const ROJO_SUAVE = '#fef2f2';

/** Roboto (la fuente de pdfmake) no trae la flecha →: sale como un cuadro vacío. */
const limpiar = (s: string): string => (s ?? '').replace(/→/g, '›');

/**
 * El manual en PDF: completo (con portada e índice) o un solo tema. Sale del
 * mismo contenido que la pantalla de ayuda, así nunca se desactualizan entre sí.
 */
@Injectable({ providedIn: 'root' })
export class ManualPdfService {
  descargarModulo(m: ManualModulo): void {
    const doc = this.documento([m], false);
    pdfMake.createPdf(doc).download(`Manual Aura - ${m.titulo}.pdf`);
  }

  descargarCompleto(): void {
    const doc = this.documento(MANUAL, true);
    pdfMake.createPdf(doc).download('Manual de usuario Aura.pdf');
  }

  private documento(modulos: ManualModulo[], completo: boolean): any {
    const hoy = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
    const content: any[] = [];

    if (completo) {
      content.push(...this.portada(hoy), ...this.indice(modulos));
    }

    // En el manual completo cada grupo empieza en página nueva; dentro del
    // grupo los temas van seguidos para no gastar una hoja por tema.
    modulos.forEach((m, i) => {
      const nuevoGrupo = i > 0 && m.grupo !== modulos[i - 1].grupo;
      content.push(...this.modulo(m, completo && nuevoGrupo, completo && i > 0 && !nuevoGrupo));
    });

    return {
      pageSize: 'LETTER',
      pageMargins: [48, 56, 48, 56],
      info: { title: completo ? 'Manual de usuario Aura' : `Manual Aura - ${modulos[0]?.titulo}` },
      header: (pagina: number) =>
        pagina === 1 && completo
          ? null
          : {
              columns: [
                { text: 'Aura · Manual de usuario', color: GRIS, fontSize: 8 },
                { text: hoy, color: GRIS, fontSize: 8, alignment: 'right' },
              ],
              margin: [48, 24, 48, 0],
            },
      footer: (pagina: number, total: number) => ({
        text: `${pagina} de ${total}`,
        alignment: 'center',
        color: GRIS,
        fontSize: 8,
        margin: [0, 16, 0, 0],
      }),
      content,
      defaultStyle: { fontSize: 10, color: OSCURO, lineHeight: 1.25 },
      styles: {
        grupo: { fontSize: 9, bold: true, color: AZUL, characterSpacing: 1 },
        titulo: { fontSize: 18, bold: true, color: OSCURO, margin: [0, 2, 0, 6] },
        resumen: { fontSize: 11, color: GRIS, margin: [0, 0, 0, 10] },
        seccion: { fontSize: 12, bold: true, color: AZUL, margin: [0, 10, 0, 4] },
        th: { bold: true, fontSize: 9, color: '#ffffff' },
      },
    };
  }

  private portada(hoy: string): any[] {
    return [
      { text: 'AURA', fontSize: 14, bold: true, color: AZUL, characterSpacing: 4, margin: [0, 160, 0, 8] },
      { text: 'Manual de usuario', fontSize: 32, bold: true, color: OSCURO },
      {
        text: 'Cómo funciona cada módulo, paso a paso, y qué hacer con cada error que puede aparecer.',
        fontSize: 13,
        color: GRIS,
        margin: [0, 10, 0, 0],
      },
      { text: `Versión del ${hoy}`, fontSize: 10, color: GRIS, margin: [0, 40, 0, 0] },
      {
        text: 'Este manual no incluye Nómina ni Recursos Humanos, que tienen su propio manual.',
        fontSize: 9,
        color: GRIS,
        margin: [0, 6, 0, 0],
        pageBreak: 'after',
      },
    ];
  }

  private indice(modulos: ManualModulo[]): any[] {
    const filas: any[] = [{ text: 'Contenido', style: 'titulo', margin: [0, 0, 0, 12] }];
    for (const g of GRUPOS_MANUAL) {
      const delGrupo = modulos.filter((m) => m.grupo === g);
      if (!delGrupo.length) continue;
      filas.push({ text: g.toUpperCase(), style: 'grupo', margin: [0, 8, 0, 2] });
      for (const m of delGrupo) {
        filas.push({
          columns: [
            { text: m.titulo, linkToDestination: `m-${m.id}`, color: OSCURO },
            { pageReference: `m-${m.id}`, width: 30, alignment: 'right', color: GRIS },
          ],
          margin: [8, 1, 0, 1],
        });
      }
    }
    filas[filas.length - 1].pageBreak = 'after';
    return filas;
  }

  private modulo(m: ManualModulo, saltoAntes: boolean, separado: boolean): any[] {
    const bloques: any[] = [
      {
        text: m.grupo.toUpperCase(),
        style: 'grupo',
        id: `m-${m.id}`,
        pageBreak: saltoAntes ? 'before' : undefined,
        margin: [0, separado ? 28 : 0, 0, 0],
      },
      { text: limpiar(m.titulo), style: 'titulo' },
      { text: limpiar(m.resumen), style: 'resumen' },
    ];

    for (const s of m.secciones) {
      bloques.push({ text: limpiar(s.titulo), style: 'seccion' });
      for (const p of s.texto ?? []) bloques.push({ text: limpiar(p), margin: [0, 0, 0, 4] });
      if (s.pasos?.length) {
        bloques.push({ ol: s.pasos.map(limpiar), margin: [4, 0, 0, 4] });
      }
      for (const n of s.notas ?? []) {
        bloques.push({
          table: { widths: ['*'], body: [[{ text: limpiar(n), fillColor: SUAVE, margin: [6, 4, 6, 4] }]] },
          layout: 'noBorders',
          margin: [0, 2, 0, 4],
        });
      }
    }

    if (m.errores.length) {
      bloques.push({ text: 'Errores comunes y cómo resolverlos', style: 'seccion' });
      const body: any[] = [
        [
          { text: 'Mensaje', style: 'th', fillColor: AZUL },
          { text: 'Por qué pasa', style: 'th', fillColor: AZUL },
          { text: 'Qué hacer', style: 'th', fillColor: AZUL },
        ],
      ];
      for (const e of m.errores) {
        body.push([
          { text: limpiar(e.mensaje), bold: true, fontSize: 9, fillColor: ROJO_SUAVE },
          { text: limpiar(e.causa), fontSize: 9 },
          { text: limpiar(e.solucion), fontSize: 9 },
        ]);
      }
      bloques.push({
        table: { headerRows: 1, widths: ['34%', '28%', '38%'], body, dontBreakRows: true },
        layout: {
          hLineColor: () => '#e2e8f0',
          vLineColor: () => '#e2e8f0',
          paddingLeft: () => 5,
          paddingRight: () => 5,
          paddingTop: () => 4,
          paddingBottom: () => 4,
        },
      });
    }
    return bloques;
  }
}
