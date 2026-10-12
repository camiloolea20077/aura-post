import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

import { environment } from '../../../environments/environment';
import { ComprobanteCajaModel } from '../../core/models/comprobante-caja.model';
import { EmpresaConfig, EmpresaService } from '../../core/services/empresa.service';
import { ResponseModel } from '../utils/responde.models';
import { pesosEnLetras } from '../utils/numero-letras';
import {
  PDF_COLOR,
  pdfBloqueDatos,
  pdfCajaDocumento,
  pdfEmpresa,
  pdfLayoutZebra,
  pdfTd,
  pdfTh,
  pdfTituloSeccion,
} from '../utils/pdf-estilo';

(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || pdfFonts;

/** Imputación contable que entrega GET /comprobantes-caja/{id}/contable. */
export interface ComprobanteContable {
  asientoId: number;
  numeroAsiento: string;
  fecha: string;
  descripcion: string;
  estado: string;
  beneficiarioDocumento: string | null;
  elaboradoPor: string | null;
  totalDebito: number;
  totalCredito: number;
  lineas: {
    cuentaCodigo: string;
    cuentaNombre: string;
    terceroNombre: string | null;
    terceroDocumento: string | null;
    centroCostoNombre: string | null;
    descripcion: string | null;
    debito: number;
    credito: number;
  }[];
}


/**
 * PDF del recibo de caja / comprobante de egreso con su imputación contable:
 * qué cuentas se movieron, a nombre de quién, débito y crédito, valor en letras
 * y firmas. Sirve para cualquier comprobante de la pantalla Comprobantes: el
 * asiento sale del documento que movió la plata (compra, gasto, abono…).
 */
@Injectable({ providedIn: 'root' })
export class ComprobanteContablePdfService {
  private readonly http = inject(HttpClient);
  private readonly empresaService = inject(EmpresaService);

  async abrir(c: ComprobanteCajaModel): Promise<void> {
    const [contRes, empRes] = await Promise.all([
      lastValueFrom(
        this.http.get<ResponseModel<ComprobanteContable | null>>(
          `${environment.apiUrl}comprobantes-caja/${c.id}/contable`,
        ),
      ),
      lastValueFrom(this.empresaService.getConfig()).catch(() => null),
    ]);
    const emp: EmpresaConfig = empRes?.data ?? {};
    const logo = emp.logoUrl ? await this.aBase64(emp.logoUrl) : null;
    // Se descarga con el número del comprobante (RC-000006.pdf): abierto en una
    // pestaña, el navegador le ponía un identificador al azar al guardarlo.
    const nombre = (c.numeroComprobante || 'comprobante').replace(/[^A-Za-z0-9_-]/g, '_');
    pdfMake.createPdf(this.documento(c, contRes?.data ?? null, emp, logo)).download(`${nombre}.pdf`);
  }

  private documento(c: ComprobanteCajaModel, cont: ComprobanteContable | null, emp: EmpresaConfig, logo: string | null): any {
    const ingreso = c.tipo === 'INGRESO';
    const titulo = ingreso ? 'RECIBO DE CAJA' : 'COMPROBANTE DE EGRESO';
    const pesos = (v: number) =>
      '$ ' + new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v) || 0);
    const fecha = cont?.fecha
      ? new Date(cont.fecha + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : new Date(c.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const nit = emp.nit ? `NIT ${emp.nit}${emp.dv ? '-' + emp.dv : ''}` : null;

    const encabezado = {
      columns: [
        {
          width: '*',
          ...pdfEmpresa(logo, emp.razonSocial || emp.nombreComercial || '', nit, [
            emp.direccion,
            emp.telefono ? `Tel: ${emp.telefono}` : null,
          ]),
        },
        { width: 180, ...pdfCajaDocumento(titulo, c.numeroComprobante, [['Fecha', fecha]]) },
      ],
      columnGap: 10,
    };

    const anulado = c.anulado
      ? [{ text: `ANULADO${c.motivoAnulacion ? ': ' + c.motivoAnulacion : ''}`, color: PDF_COLOR.rojo, bold: true, margin: [0, 6, 0, 0] }]
      : [];

    const datos = {
      columns: [
        {
          width: '*',
          ...pdfBloqueDatos([
            [ingreso ? 'Recibido de' : 'Pagado a', c.entregadoA || null],
            ['CC/NIT', cont?.beneficiarioDocumento ?? null],
            ['Concepto', c.concepto || cont?.descripcion || null],
            ['La suma de', pesosEnLetras(c.monto)],
          ], 70),
        },
        {
          width: 190,
          ...pdfBloqueDatos([
            ['Valor', pesos(c.monto)],
            ['Forma de pago', c.metodoPago || null],
            ['Asiento', cont ? `${cont.numeroAsiento}${cont.estado === 'ANULADO' ? ' (anulado)' : ''}` : null],
          ], 70),
        },
      ],
      columnGap: 10,
      margin: [0, 8, 0, 0],
    };

    const imputacion: any[] = [pdfTituloSeccion('Imputación contable')];
    if (cont && cont.lineas.length) {
      imputacion.push({
        table: {
          headerRows: 1,
          widths: [52, '*', 120, 72, 72],
          body: [
            [pdfTh('Código'), pdfTh('Cuenta'), pdfTh('Tercero'), pdfTh('Débito', 'right'), pdfTh('Crédito', 'right')],
            ...cont.lineas.map((l) => [
              pdfTd(l.cuentaCodigo, 'left', { bold: true }),
              {
                stack: [
                  { text: l.cuentaNombre, fontSize: 7.6 },
                  ...(l.descripcion ? [{ text: l.descripcion, fontSize: 6.6, color: PDF_COLOR.gris }] : []),
                  ...(l.centroCostoNombre ? [{ text: 'C. costo: ' + l.centroCostoNombre, fontSize: 6.6, color: PDF_COLOR.gris }] : []),
                ],
              },
              {
                stack: [
                  { text: l.terceroNombre || '—', fontSize: 7.6 },
                  ...(l.terceroDocumento ? [{ text: l.terceroDocumento, fontSize: 6.6, color: PDF_COLOR.gris }] : []),
                ],
              },
              pdfTd(Number(l.debito) ? pesos(l.debito) : '', 'right'),
              pdfTd(Number(l.credito) ? pesos(l.credito) : '', 'right'),
            ]),
          ],
        },
        layout: pdfLayoutZebra(1),
      });
      imputacion.push({
        table: {
          widths: ['*', 72, 72],
          body: [[
            { text: 'Sumas iguales', bold: true, alignment: 'right', fontSize: 8 },
            { text: pesos(cont.totalDebito), bold: true, alignment: 'right', fontSize: 8 },
            { text: pesos(cont.totalCredito), bold: true, alignment: 'right', fontSize: 8 },
          ]],
        },
        layout: { ...pdfLayoutZebra(1) },
      });
    } else {
      imputacion.push({
        text: 'Este comprobante no tiene asiento contable (documento anterior a la contabilidad automática o pendiente de contabilizar).',
        fontSize: 7.6,
        color: PDF_COLOR.gris,
        italics: true,
        margin: [0, 4, 0, 0],
      });
    }

    const firma = (t: string, sub?: string) => ({
      stack: [
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 115, y2: 0, lineWidth: 0.7, lineColor: PDF_COLOR.texto }], margin: [0, 34, 0, 3] },
        { text: t, fontSize: 8, bold: true },
        ...(sub ? [{ text: sub, fontSize: 7, color: PDF_COLOR.gris }] : []),
      ],
    });

    return {
      info: { title: c.numeroComprobante, subject: titulo },
      pageSize: 'LETTER',
      pageMargins: [28, 26, 28, 40],
      defaultStyle: { fontSize: 8, color: PDF_COLOR.texto },
      watermark: c.anulado ? { text: 'ANULADO', color: '#dc2626', opacity: 0.1, bold: true } : undefined,
      content: [
        encabezado,
        ...anulado,
        datos,
        ...imputacion,
        {
          columns: [
            firma('Elaboró', cont?.elaboradoPor ?? undefined),
            firma('Revisó'),
            firma('Aprobó'),
            firma(ingreso ? 'Entregó' : 'Recibí conforme', 'C.C. / NIT'),
          ],
          columnGap: 14,
          margin: [0, 24, 0, 0],
          unbreakable: true,
        },
      ],
      footer: (page: number, pages: number) => ({
        text: `${c.numeroComprobante} · página ${page} de ${pages}`,
        alignment: 'right',
        fontSize: 7,
        color: PDF_COLOR.gris,
        margin: [28, 10, 28, 0],
      }),
    };
  }

  private async aBase64(url: string): Promise<string | null> {
    try {
      const blob = await (await fetch(url)).blob();
      return await new Promise((resolve) => {
        const r = new FileReader();
        r.onloadend = () => resolve(r.result as string);
        r.onerror = () => resolve(null);
        r.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }
}
