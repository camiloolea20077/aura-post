import { Injectable } from '@angular/core';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || pdfFonts;

import { EmpresaConfig } from './empresa.service';
import { CotizacionModel } from '../models/cotizacion.model';

const AZUL = '#2563eb';
const GRIS = '#64748b';
const OSCURO = '#1e293b';

@Injectable({ providedIn: 'root' })
export class CotizacionPdfService {
  private cop(v: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }

  private fecha(f: string): string {
    return new Date(f + (f.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  /** Carga el logo como dataURL (base64). Devuelve null si no hay o falla (CORS). */
  private async logoDataUrl(url?: string): Promise<string | null> {
    if (!url) return null;
    try {
      const res = await fetch(url, { mode: 'cors' });
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onloadend = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  private encabezado(empresa: EmpresaConfig, logo: string | null): any {
    const nombre = empresa.razonSocial || empresa.nombreComercial || 'Empresa';
    const nit = empresa.nit ? `NIT ${empresa.nit}${empresa.dv ? '-' + empresa.dv : ''}` : '';
    const datos = [
      { text: nombre, fontSize: 13, bold: true, color: OSCURO, alignment: 'right' },
      { text: nit, fontSize: 8, color: GRIS, alignment: 'right', margin: [0, 2, 0, 0] },
      { text: empresa.direccion || '', fontSize: 8, color: GRIS, alignment: 'right' },
      { text: empresa.municipio || '', fontSize: 8, color: GRIS, alignment: 'right' },
      {
        text: [empresa.telefono, empresa.correo].filter(Boolean).join(' · '),
        fontSize: 8,
        color: GRIS,
        alignment: 'right',
      },
    ];
    const izquierda = logo
      ? { image: logo, fit: [130, 65], width: 130 }
      : { text: nombre, fontSize: 18, bold: true, color: AZUL, width: '*' };

    return {
      columns: [izquierda, { stack: datos, width: '*' }],
      margin: [0, 0, 0, 12],
    };
  }

  private linea(): any {
    return {
      canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: AZUL }],
      margin: [0, 0, 0, 14],
    };
  }

  async cotizacion(c: CotizacionModel, empresa: EmpresaConfig): Promise<void> {
    const logo = await this.logoDataUrl(empresa.logoUrl);

    // Tabla de ítems
    const body: any[] = [
      [
        { text: '#', style: 'th' },
        { text: 'Producto / Descripción', style: 'th' },
        { text: 'Cant.', style: 'th', alignment: 'right' },
        { text: 'Vlr. Unit.', style: 'th', alignment: 'right' },
        { text: 'IVA', style: 'th', alignment: 'right' },
        { text: 'Desc.', style: 'th', alignment: 'right' },
        { text: 'Subtotal', style: 'th', alignment: 'right' },
      ],
    ];
    (c.detalles ?? []).forEach((d, i) => {
      const nombre: any[] = [{ text: d.productoNombre, fontSize: 8 }];
      if (d.productoSku) nombre.push({ text: `  ${d.productoSku}`, fontSize: 7, color: GRIS });
      if (d.descripcion) nombre.push({ text: `\n${d.descripcion}`, fontSize: 7, color: GRIS, italics: true });
      body.push([
        { text: `${i + 1}`, fontSize: 8 },
        { text: nombre, fontSize: 8 },
        { text: `${d.cantidad}`, fontSize: 8, alignment: 'right' },
        { text: this.cop(d.precioUnitario), fontSize: 8, alignment: 'right' },
        { text: `${d.ivaPorcentaje ?? 0}%`, fontSize: 8, alignment: 'right' },
        { text: d.descuentoValor ? this.cop(d.descuentoValor) : '—', fontSize: 8, alignment: 'right' },
        { text: this.cop(d.subtotal), fontSize: 8, alignment: 'right' },
      ]);
    });

    // Bloque de totales (derecha)
    const totalesBody: any[] = [
      [
        { text: 'Subtotal', fontSize: 9, color: GRIS },
        { text: this.cop(c.subtotal), fontSize: 9, alignment: 'right' },
      ],
    ];
    if (c.descuento > 0) {
      totalesBody.push([
        { text: 'Descuento', fontSize: 9, color: '#dc2626' },
        { text: `- ${this.cop(c.descuento)}`, fontSize: 9, alignment: 'right', color: '#dc2626' },
      ]);
    }
    if (c.iva > 0) {
      totalesBody.push([
        { text: 'IVA', fontSize: 9, color: GRIS },
        { text: this.cop(c.iva), fontSize: 9, alignment: 'right' },
      ]);
    }
    totalesBody.push([
      { text: 'TOTAL', bold: true, fontSize: 12, color: '#fff', fillColor: AZUL, margin: [6, 5, 6, 5] },
      { text: this.cop(c.total), bold: true, fontSize: 12, color: '#fff', fillColor: AZUL, alignment: 'right', margin: [6, 5, 6, 5] },
    ]);

    const doc: any = {
      pageSize: 'LETTER',
      pageMargins: [40, 40, 40, 55],
      content: [
        this.encabezado(empresa, logo),
        this.linea(),
        {
          columns: [
            { text: 'COTIZACIÓN', fontSize: 18, bold: true, color: OSCURO },
            { text: `N.° ${c.numero}`, fontSize: 13, bold: true, color: AZUL, alignment: 'right' },
          ],
          margin: [0, 0, 0, 10],
        },
        // Datos del cliente y fechas
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: 'CLIENTE', fontSize: 8, bold: true, color: GRIS },
                { text: c.terceroNombre || 'Consumidor final', fontSize: 10, color: OSCURO, margin: [0, 1, 0, 0] },
                c.terceroDocumento
                  ? { text: `Documento: ${c.terceroDocumento}`, fontSize: 8, color: GRIS }
                  : {},
              ],
            },
            {
              width: 'auto',
              stack: [
                { text: [{ text: 'Fecha: ', bold: true }, this.fecha(c.fecha)], fontSize: 9, alignment: 'right' },
                { text: [{ text: 'Vence: ', bold: true }, this.fecha(c.fechaVencimiento)], fontSize: 9, alignment: 'right' },
                { text: `Validez: ${c.diasVigencia} día(s)`, fontSize: 9, color: GRIS, alignment: 'right' },
              ],
            },
          ],
          margin: [0, 0, 0, 14],
        },
        // Ítems
        {
          table: { headerRows: 1, widths: [14, '*', 30, 60, 30, 55, 65], body },
          layout: {
            fillColor: (row: number) => (row === 0 ? '#eff6ff' : row % 2 === 0 ? '#f8fafc' : null),
            hLineColor: () => '#e2e8f0',
            vLineColor: () => '#e2e8f0',
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
          },
        },
        // Totales alineados a la derecha
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 230,
              table: { widths: ['*', 'auto'], body: totalesBody },
              layout: 'noBorders',
              margin: [0, 12, 0, 0],
            },
          ],
        },
        // Observaciones
        c.observaciones
          ? {
              stack: [
                { text: 'Observaciones', fontSize: 8, bold: true, color: GRIS, margin: [0, 18, 0, 2] },
                { text: c.observaciones, fontSize: 9, color: OSCURO },
              ],
            }
          : {},
        {
          text: 'Esta cotización no constituye una factura de venta. Precios sujetos a cambios una vez vencida la validez indicada.',
          fontSize: 7.5,
          italics: true,
          color: GRIS,
          margin: [0, 24, 0, 0],
        },
      ],
      styles: {
        th: { bold: true, fontSize: 8, color: AZUL },
      },
      footer: (page: number, count: number) => ({
        columns: [
          { text: `Cotización ${c.numero}`, fontSize: 7, color: GRIS, margin: [40, 0, 0, 0] },
          { text: `Página ${page} de ${count}`, alignment: 'right', fontSize: 7, color: GRIS, margin: [0, 0, 40, 0] },
        ],
        margin: [0, 12, 0, 0],
      }),
    };

    pdfMake.createPdf(doc).download(`Cotizacion-${c.numero}.pdf`);
  }
}
