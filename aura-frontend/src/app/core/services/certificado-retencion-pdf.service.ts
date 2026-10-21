import { Injectable, inject } from '@angular/core';
import { lastValueFrom } from 'rxjs';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || pdfFonts;

import {
  CertificadoRetencion,
  CertificadosRetencionModel,
  TipoCertificadoRetencion,
} from '../models/declaraciones.model';
import { EmpresaConfig, EmpresaService } from './empresa.service';
import {
  PDF_COLOR,
  pdfBloqueDatos,
  pdfCajaDocumento,
  pdfEmpresa,
  pdfLayoutZebra,
  pdfRecuadro,
  pdfTd,
  pdfTh,
} from '../../shared/utils/pdf-estilo';
import { imagenDataUrl } from '../../shared/utils/imagen-data-url';
import { pesosEnLetras } from '../../shared/utils/numero-letras';

const TITULOS: Record<TipoCertificadoRetencion, string> = {
  FUENTE: 'CERTIFICADO DE RETENCIÓN EN LA FUENTE',
  IVA: 'CERTIFICADO DE RETENCIÓN DE IVA',
  ICA: 'CERTIFICADO DE RETENCIÓN DE INDUSTRIA Y COMERCIO',
};

const QUE_SE_RETUVO: Record<TipoCertificadoRetencion, string> = {
  FUENTE: 'retención en la fuente a título de renta',
  IVA: 'retención a título del impuesto sobre las ventas (IVA)',
  ICA: 'retención a título del impuesto de industria y comercio (ReteICA)',
};

/**
 * PDF de los certificados de retención que la empresa expide como agente
 * retenedor: en la fuente, de IVA y de ICA. Un certificado por página; con
 * varios terceros sale un solo PDF con todos.
 */
@Injectable({ providedIn: 'root' })
export class CertificadoRetencionPdfService {
  private readonly empresaService = inject(EmpresaService);

  /** Abre en una pestaña los certificados indicados (por defecto todos). */
  async ver(datos: CertificadosRetencionModel, certificados = datos.certificados): Promise<void> {
    const doc = await this.preparar(datos, certificados);
    await pdfMake.createPdf(doc).open();
  }

  async descargar(datos: CertificadosRetencionModel, certificados = datos.certificados): Promise<void> {
    const doc = await this.preparar(datos, certificados);
    const quien = certificados.length === 1 ? certificados[0].numeroDocumento ?? certificados[0].terceroId : 'todos';
    const nombre = `Certificado-${datos.tipo}-${datos.desde}_${datos.hasta}-${quien}`.replace(/[^A-Za-z0-9_-]/g, '_');
    await pdfMake.createPdf(doc).download(`${nombre}.pdf`);
  }

  private async preparar(datos: CertificadosRetencionModel, certificados: CertificadoRetencion[]): Promise<any> {
    const empRes = await lastValueFrom(this.empresaService.getConfig()).catch(() => null);
    const emp: EmpresaConfig = empRes?.data ?? {};
    const logo = await imagenDataUrl(emp.logoUrl);
    const paginas = certificados.map((c, i) => {
      const pagina = this.certificado(datos, c, emp, logo);
      return i > 0 ? { stack: pagina, pageBreak: 'before' } : { stack: pagina };
    });
    return {
      pageSize: 'LETTER',
      pageMargins: [36, 30, 36, 40],
      defaultStyle: { color: PDF_COLOR.texto },
      content: paginas,
      footer: (page: number, count: number) => ({
        columns: [
          { text: 'Generado con Aura.', fontSize: 6.5, color: PDF_COLOR.gris },
          { text: `Página ${page} de ${count}`, fontSize: 6.5, color: PDF_COLOR.gris, alignment: 'right', width: 70 },
        ],
        margin: [36, 12, 36, 0],
      }),
      info: { title: TITULOS[datos.tipo] },
    };
  }

  private certificado(d: CertificadosRetencionModel, c: CertificadoRetencion, emp: EmpresaConfig, logo: string | null): any[] {
    const razonSocial = d.empresaNombre ?? emp.razonSocial ?? '';
    const nit = d.nit ? `NIT ${d.nit}${d.dv ? '-' + d.dv : ''}` : null;
    const ciudad = emp.municipio || '';
    const ahora = new Date();
    const hoy = `${`${ahora.getDate()}`.padStart(2, '0')}/${`${ahora.getMonth() + 1}`.padStart(2, '0')}/${ahora.getFullYear()}`;
    const periodo = `${this.fecha(d.desde)} al ${this.fecha(d.hasta)}`;
    const documento = c.numeroDocumento ? `${c.numeroDocumento}${c.dv ? '-' + c.dv : ''}` : '—';

    const encabezado = {
      columns: [
        { width: '*', ...pdfEmpresa(logo, razonSocial, nit, [emp.direccion, ciudad, emp.telefono]) },
        {
          width: 200,
          ...pdfCajaDocumento(TITULOS[d.tipo], `${d.desde.slice(0, 4)}`, [
            ['Período', periodo],
            ['Expedido', hoy],
          ]),
        },
      ],
      columnGap: 10,
    };

    const intro = {
      text: [
        { text: razonSocial, bold: true },
        `${nit ? ', identificada con ' + nit : ''}, en calidad de agente retenedor, certifica que durante el período ` +
          `comprendido entre el ${periodo} practicó ${QUE_SE_RETUVO[d.tipo]} a:`,
      ],
      fontSize: 8.5,
      lineHeight: 1.25,
      margin: [0, 14, 0, 6],
    };

    const tercero = pdfBloqueDatos(
      [
        ['Nombre', c.terceroNombre],
        [c.tipoDocumento || 'Documento', documento],
        ['Dirección', c.direccion],
        ['Municipio', c.municipio],
      ],
      80,
    );

    const esIca = d.tipo === 'ICA';
    const body: any[] = [
      [pdfTh('Concepto'), pdfTh('Base sometida a retención', 'right'), pdfTh('Tarifa', 'right'), pdfTh('Valor retenido', 'right')],
      ...c.lineas.map((l) => [
        pdfTd(l.concepto),
        pdfTd(l.base != null ? this.cop(l.base) : 'Sin base registrada', 'right'),
        pdfTd(l.tarifa != null ? this.tarifa(l.tarifa, esIca) : '—', 'right'),
        pdfTd(this.cop(l.retenido), 'right'),
      ]),
      [
        pdfTd('Total', 'left', { bold: true }),
        pdfTd(this.cop(c.totalBase), 'right', { bold: true }),
        pdfTd(''),
        pdfTd(this.cop(c.totalRetenido), 'right', { bold: true }),
      ],
    ];

    const consignado = esIca
      ? `El valor retenido fue declarado y pagado a favor del municipio${ciudad ? ' de ' + ciudad : ''}.`
      : `El valor retenido fue declarado y consignado a favor de la Dirección de Impuestos y Aduanas Nacionales (DIAN)` +
        `${ciudad ? ' en la ciudad de ' + ciudad : ''}.`;

    return [
      encabezado,
      intro,
      tercero,
      {
        table: { headerRows: 1, widths: ['*', 110, 50, 95], body },
        layout: pdfLayoutZebra(1),
        margin: [0, 10, 0, 0],
      },
      {
        ...pdfRecuadro('Valor retenido en letras', [{ text: pesosEnLetras(Math.abs(c.totalRetenido)), fontSize: 7.8 }]),
        margin: [0, 8, 0, 0],
      },
      { text: consignado, fontSize: 8.5, margin: [0, 12, 0, 0] },
      {
        text: `Se expide en ${ciudad || '—'}, el ${hoy}.`,
        fontSize: 8.5,
        margin: [0, 6, 0, 0],
      },
      esIca
        ? {}
        : {
            text: 'Certificado expedido sin firma autógrafa, de conformidad con el artículo 10 del Decreto 836 de 1991.',
            fontSize: 7,
            color: PDF_COLOR.gris,
            margin: [0, 18, 0, 0],
          },
    ];
  }

  /** La tarifa se guarda en %; el ReteICA se lee por mil. */
  private tarifa(v: number, porMil: boolean): string {
    const n = (x: number) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 3 }).format(x);
    return porMil ? `${n(v * 10)} ‰` : `${n(v)} %`;
  }

  private cop(v: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v ?? 0);
  }

  /** AAAA-MM-DD → DD/MM/AAAA sin pasar por Date (evita el corrimiento de zona horaria). */
  private fecha(iso: string): string {
    const [a, m, d] = iso.slice(0, 10).split('-');
    return `${d}/${m}/${a}`;
  }
}
