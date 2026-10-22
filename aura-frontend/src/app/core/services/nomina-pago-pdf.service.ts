import { Injectable } from '@angular/core';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || pdfFonts;

import { DesprendibleModel, LineaDesprendible } from '../models/desprendible.model';
import { DocumentoNominaModel } from '../models/nomina-documento.model';
import { EmpresaConfig } from './empresa.service';
import { PdfAdjunto, pdfABase64 } from '../../shared/utils/pdf-adjunto';
import {
  PDF_COLOR,
  pdfBloqueDatos,
  pdfCajaDocumento,
  pdfEmpresa,
  pdfLayoutZebra,
  pdfTablaTotales,
  pdfTd,
  pdfTh,
  pdfTituloSeccion,
} from '../../shared/utils/pdf-estilo';
import { imagenDataUrl } from '../../shared/utils/imagen-data-url';

/**
 * PDF del pago de una nómina (documento NOM-…):
 * <ul>
 *   <li><b>Comprobantes de pago</b>: uno por empleado (una página cada uno), con
 *       devengados, deducciones, neto y la cuenta donde se consigna.</li>
 *   <li><b>Planilla para el banco</b>: la lista de empleados con banco, tipo y número
 *       de cuenta y el neto a consignar, con el total y las firmas.</li>
 * </ul>
 * Los datos salen del desprendible de cada nómina (backend), así el PDF muestra lo
 * mismo que se liquidó.
 */
@Injectable({ providedIn: 'root' })
export class NominaPagoPdfService {
  private cop(v: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
      v ?? 0,
    );
  }

  private num(v: number | null | undefined): string {
    if (v == null) return '';
    return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(v);
  }

  private fecha(f: string | null | undefined): string {
    if (!f) return '—';
    const [y, m, d] = f.substring(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  /** Logo como dataURL; null si no hay o el servidor no deja leerlo (CORS). */
  private async logo(url?: string): Promise<string | null> {
    return imagenDataUrl(url);
  }

  private cabecera(empresa: EmpresaConfig, logo: string | null, titulo: string, doc: DocumentoNominaModel): any {
    const nit = empresa.nit ? `NIT ${empresa.nit}${empresa.dv ? '-' + empresa.dv : ''}` : null;
    return {
      columns: [
        pdfEmpresa(logo, empresa.razonSocial || empresa.nombreComercial || 'Empresa', nit, [
          empresa.direccion,
          [empresa.telefono, empresa.correo].filter(Boolean).join(' · '),
        ]),
        {
          width: 190,
          stack: [
            pdfCajaDocumento(titulo, doc.numeroCompleto, [
              ['Período', `${this.fecha(doc.fechaDesde)} – ${this.fecha(doc.fechaHasta)}`],
              ['Fecha de pago', this.fecha(doc.fechaPago ?? doc.fechaLiquidacion)],
            ]),
          ],
        },
      ],
      columnGap: 12,
      margin: [0, 0, 0, 8],
    };
  }

  private pie(): (page: number, count: number) => any {
    return (page: number, count: number) => ({
      text: `Página ${page} de ${count}`,
      alignment: 'center',
      fontSize: 7,
      color: PDF_COLOR.gris,
      margin: [0, 10, 0, 0],
    });
  }

  private firmas(izquierda: string, derecha: string): any {
    const firma = (t: string) => ({
      stack: [
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.6, lineColor: PDF_COLOR.texto }] },
        { text: t, fontSize: 7.6, color: PDF_COLOR.texto, margin: [0, 3, 0, 0] },
      ],
    });
    return { columns: [firma(izquierda), firma(derecha)], columnGap: 40, margin: [0, 40, 0, 0] };
  }

  /** Tabla de conceptos (devengados o deducciones). */
  private tablaConceptos(lineas: LineaDesprendible[]): any {
    const body: any[] = [
      [pdfTh('Concepto'), pdfTh('Cantidad', 'right'), pdfTh('%', 'right'), pdfTh('Valor', 'right')],
    ];
    for (const l of lineas) {
      body.push([
        pdfTd(l.concepto),
        pdfTd(this.num(l.cantidad), 'right'),
        pdfTd(this.num(l.porcentaje), 'right'),
        pdfTd(this.cop(l.valor), 'right'),
      ]);
    }
    if (!lineas.length) body.push([pdfTd('Sin conceptos', 'left', { colSpan: 4 }), {}, {}, {}]);
    return { table: { headerRows: 1, widths: ['*', 55, 40, 80], body }, layout: pdfLayoutZebra(1) };
  }

  /** Contenido del comprobante de un empleado. */
  private comprobante(d: DesprendibleModel): any[] {
    return [
      pdfTituloSeccion('Empleado'),
      {
        columns: [
          pdfBloqueDatos([
            ['Nombre', d.empleadoNombre],
            ['Documento', d.empleadoDocumento],
            ['Cargo', d.cargo],
          ]),
          pdfBloqueDatos([
            ['Salario', this.cop(d.salarioBase)],
            ['Días', d.diasTrabajados != null ? String(d.diasTrabajados) : null],
            ['Cuenta', [d.banco, d.tipoCuenta, d.numeroCuenta].filter(Boolean).join(' · ') || 'Sin cuenta registrada'],
          ]),
        ],
        columnGap: 8,
      },
      pdfTituloSeccion('Devengados'),
      this.tablaConceptos(d.devengados),
      pdfTituloSeccion('Deducciones'),
      this.tablaConceptos(d.deducciones),
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 220,
            margin: [0, 8, 0, 0],
            ...pdfTablaTotales(
              [
                ['Total devengado', this.cop(d.totalDevengado)],
                ['Total deducciones', this.cop(d.totalDeducciones)],
              ],
              ['Neto a pagar', this.cop(d.netoPagar)],
            ),
          },
        ],
      },
      this.firmas('Firma del empleado', 'Firma de la empresa'),
    ];
  }

  /**
   * Comprobantes de pago: un empleado por página.
   * @param nombreArchivo sin extensión
   */
  async comprobantes(
    desprendibles: DesprendibleModel[],
    doc: DocumentoNominaModel,
    empresa: EmpresaConfig,
    nombreArchivo: string,
  ): Promise<void> {
    pdfMake.createPdf(await this.docComprobantes(desprendibles, doc, empresa)).download(`${nombreArchivo}.pdf`);
  }

  /** Comprobante de un solo empleado en base64, para enviárselo por correo. */
  async comprobanteAdjunto(
    d: DesprendibleModel,
    doc: DocumentoNominaModel,
    empresa: EmpresaConfig,
    nombreArchivo: string,
  ): Promise<PdfAdjunto> {
    return { nombre: `${nombreArchivo}.pdf`, base64: await pdfABase64(await this.docComprobantes([d], doc, empresa)) };
  }

  private async docComprobantes(
    desprendibles: DesprendibleModel[],
    doc: DocumentoNominaModel,
    empresa: EmpresaConfig,
  ): Promise<any> {
    const logo = await this.logo(empresa.logoUrl);
    const content: any[] = [];
    // Una hoja por empleado: cada comprobante va en su propia página y no se parte.
    desprendibles.forEach((d, i) => {
      content.push({
        stack: [this.cabecera(empresa, logo, 'Comprobante de pago de nómina', doc), ...this.comprobante(d)],
        unbreakable: true,
        ...(i > 0 ? { pageBreak: 'before' } : {}),
      });
    });
    return { pageSize: 'LETTER', pageMargins: [36, 36, 36, 46], content, footer: this.pie() };
  }

  /** Planilla para el banco: a quién consignar, en qué cuenta y cuánto. */
  async planillaBanco(desprendibles: DesprendibleModel[], doc: DocumentoNominaModel, empresa: EmpresaConfig): Promise<void> {
    const logo = await this.logo(empresa.logoUrl);
    const filas = [...desprendibles].sort((a, b) => (a.empleadoNombre ?? '').localeCompare(b.empleadoNombre ?? ''));
    const body: any[] = [
      [
        pdfTh('#', 'center'),
        pdfTh('Empleado'),
        pdfTh('Documento'),
        pdfTh('Banco'),
        pdfTh('Tipo de cuenta'),
        pdfTh('Número de cuenta'),
        pdfTh('Valor a consignar', 'right'),
      ],
    ];
    filas.forEach((d, i) => {
      const sinCuenta = !d.numeroCuenta;
      body.push([
        pdfTd(i + 1, 'center'),
        pdfTd(d.empleadoNombre),
        pdfTd(d.empleadoDocumento),
        pdfTd(d.banco),
        pdfTd(d.tipoCuenta),
        pdfTd(sinCuenta ? 'SIN CUENTA' : d.numeroCuenta, 'left', sinCuenta ? { color: PDF_COLOR.rojo, bold: true } : {}),
        pdfTd(this.cop(d.netoPagar), 'right'),
      ]);
    });
    const total = filas.reduce((s, d) => s + (d.netoPagar ?? 0), 0);
    body.push([
      { text: 'TOTAL A CONSIGNAR', colSpan: 6, bold: true, fontSize: 8.4, alignment: 'right', fillColor: PDF_COLOR.cabecera },
      {}, {}, {}, {}, {},
      { text: this.cop(total), bold: true, fontSize: 8.4, alignment: 'right', fillColor: PDF_COLOR.cabecera },
    ]);
    const sinCuenta = filas.filter((d) => !d.numeroCuenta).length;

    const content: any[] = [
      this.cabecera(empresa, logo, 'Planilla de pago de nómina', doc),
      {
        text: `${filas.length} empleado(s)${doc.descripcion ? ' · ' + doc.descripcion : ''}`,
        fontSize: 8,
        color: PDF_COLOR.gris,
        margin: [0, 0, 0, 6],
      },
      {
        table: { headerRows: 1, widths: [18, '*', 62, 75, 58, 80, 72], body },
        layout: pdfLayoutZebra(1),
      },
    ];
    if (sinCuenta) {
      content.push({
        text: `${sinCuenta} empleado(s) sin cuenta bancaria registrada: complete su hoja de vida o págueles por otro medio.`,
        fontSize: 7.6,
        color: PDF_COLOR.rojo,
        margin: [0, 6, 0, 0],
      });
    }
    content.push(this.firmas('Elaboró', 'Autorizó'));

    pdfMake
      .createPdf({
        pageSize: 'LETTER',
        pageOrientation: 'landscape',
        pageMargins: [36, 36, 36, 46],
        content,
        footer: this.pie(),
      } as any)
      .download(`${doc.numeroCompleto}-planilla-banco.pdf`);
  }
}
