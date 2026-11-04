import { Injectable, inject } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

import { CarteraService } from './cartera.service';
import { EmpresaConfig, EmpresaService } from './empresa.service';
import { TerceroService } from './tercero.service';
import { METODOS_RECIBO, ReciboCajaModel } from '../models/cartera.model';
import { TerceroModel } from '../models/tercero.model';
import { pesosEnLetras } from '../../shared/utils/numero-letras';
import { imagenDataUrl } from '../../shared/utils/imagen-data-url';
import {
  PDF_COLOR,
  pdfBloqueDatos,
  pdfCajaDocumento,
  pdfEmpresa,
  pdfLayoutZebra,
  pdfRecuadro,
  pdfTablaTotales,
  pdfTd,
  pdfTh,
  pdfTituloSeccion,
} from '../../shared/utils/pdf-estilo';

(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || pdfFonts;

/**
 * PDF del recibo de caja de Cartera (un pago del cliente repartido entre sus
 * facturas), con el mismo estilo de la factura y el comprobante: empresa y caja
 * del documento, datos del cliente, facturas abonadas, totales, valor en letras
 * y firmas.
 *
 * Se descarga con el número del recibo (RC-000006.pdf). Antes el backend lo
 * devolvía y se abría en una pestaña: el navegador le ponía un nombre al azar.
 */
@Injectable({ providedIn: 'root' })
export class ReciboCajaPdfService {
  private readonly cartera = inject(CarteraService);
  private readonly empresas = inject(EmpresaService);
  private readonly terceros = inject(TerceroService);

  /**
   * Arma y descarga el PDF del recibo.
   *
   * @param id id del recibo de caja
   */
  async descargar(id: number): Promise<void> {
    const res = await lastValueFrom(this.cartera.recibo(id));
    const r = res?.data;
    if (!r) throw new Error('Recibo no encontrado');

    const [empRes, terRes] = await Promise.all([
      lastValueFrom(this.empresas.getConfig()).catch(() => null),
      r.terceroId ? lastValueFrom(this.terceros.getById(r.terceroId)).catch(() => null) : Promise.resolve(null),
    ]);
    const emp: EmpresaConfig = empRes?.data ?? {};
    const logo = emp.logoUrl ? await imagenDataUrl(emp.logoUrl) : null;

    const nombre = (r.numero || `recibo-caja-${r.id}`).replace(/[^A-Za-z0-9_-]/g, '_');
    pdfMake.createPdf(this.documento(r, emp, terRes?.data ?? null, logo)).download(`${nombre}.pdf`);
  }

  private documento(r: ReciboCajaModel, emp: EmpresaConfig, t: TerceroModel | null, logo: string | null): any {
    const anulado = r.estado === 'ANULADO';
    const nit = emp.nit ? `NIT ${emp.nit}${emp.dv ? '-' + emp.dv : ''}` : null;
    const retenciones = r.aplicaciones.reduce((a, x) => a + (Number(x.retenciones) || 0), 0);
    const hayRetenciones = retenciones > 0;

    const encabezado = {
      columns: [
        {
          width: '*',
          ...pdfEmpresa(logo, emp.razonSocial || emp.nombreComercial || '', nit, [
            emp.direccion,
            emp.telefono ? `Tel: ${emp.telefono}` : null,
          ]),
        },
        {
          width: 180,
          ...pdfCajaDocumento('RECIBO DE CAJA', r.numero, [
            ['Fecha', this.fecha(r.fechaPago, true)],
            ['Estado', anulado ? 'Anulado' : 'Vigente'],
          ]),
        },
      ],
      columnGap: 10,
    };

    const avisoAnulado = anulado
      ? [{
          text: `ANULADO${r.motivoAnulacion ? ': ' + r.motivoAnulacion : ''}${r.anuladoAt ? ' · ' + this.fecha(r.anuladoAt, true) : ''}`,
          color: PDF_COLOR.rojo,
          bold: true,
          margin: [0, 6, 0, 0],
        }]
      : [];

    const cliente = {
      columns: [
        {
          width: '*',
          ...pdfBloqueDatos([
            [t?.tipoDocumento && t.tipoDocumento !== 'NIT' ? t.tipoDocumento : 'CC/NIT',
              this.documentoTercero(r.terceroDocumento, t?.dv)],
            ['Recibido de', r.terceroNombre],
            ['Municipio', t?.municipio ?? null],
            ['Dirección', t?.direccion ?? null],
            ['Email', t?.email ?? null],
          ], 70),
        },
        {
          width: 210,
          ...pdfBloqueDatos([
            ['Teléfono', t?.telefono ?? null],
            ['Medio de pago', this.metodo(r.metodoPago)],
            ['Referencia', r.referencia],
            ['Elaboró', r.usuarioNombre],
            ['Registrado', this.fecha(r.createdAt, true)],
          ], 72),
        },
      ],
      columnGap: 10,
      margin: [0, 8, 0, 0],
    };

    const suma = {
      ...pdfBloqueDatos([['La suma de', pesosEnLetras(r.valorRecibido)]], 70),
      margin: [0, 6, 0, 0],
    };

    // ── Facturas abonadas ──
    const cols = hayRetenciones
      ? [16, '*', 62, 78, 72, 66, 78]
      : [16, '*', 70, 86, 80, 86];
    const cabecera = [
      pdfTh('#', 'center'),
      pdfTh('Factura'),
      pdfTh('Vence'),
      pdfTh('Saldo anterior', 'right'),
      pdfTh('Abono', 'right'),
      ...(hayRetenciones ? [pdfTh('Retenciones', 'right')] : []),
      pdfTh('Nuevo saldo', 'right'),
    ];
    const filas = r.aplicaciones.map((a, i) => [
      pdfTd(i + 1, 'center'),
      pdfTd(a.numeroCuenta, 'left', { bold: true }),
      pdfTd(a.fechaVencimiento ? this.fecha(a.fechaVencimiento, false) : null),
      pdfTd(this.cop(a.saldoAnterior), 'right'),
      pdfTd(this.cop(a.monto), 'right', { bold: true }),
      ...(hayRetenciones ? [pdfTd(Number(a.retenciones) ? this.cop(a.retenciones) : '', 'right')] : []),
      pdfTd(this.cop(a.saldoDespues), 'right'),
    ]);
    const facturas: any[] = [pdfTituloSeccion('Facturas abonadas')];
    if (filas.length) {
      facturas.push({ table: { headerRows: 1, widths: cols, body: [cabecera, ...filas] }, layout: pdfLayoutZebra(1) });
    } else {
      facturas.push({
        text: 'Este pago no se aplicó a facturas: todo el valor queda como anticipo (saldo a favor del cliente).',
        fontSize: 7.6,
        color: PDF_COLOR.gris,
        italics: true,
        margin: [0, 4, 0, 0],
      });
    }

    // ── Pie: observaciones a la izquierda, totales a la derecha ──
    const notas: any[] = [];
    if (r.observaciones) notas.push({ text: r.observaciones, fontSize: 7.5, color: PDF_COLOR.texto });
    if (r.cajaOtroDia) {
      notas.push({ text: 'El dinero entró a caja otro día distinto al del pago.', fontSize: 7, color: PDF_COLOR.gris, margin: [0, 2, 0, 0] });
    }
    const totales: [string, string][] = [['Aplicado a facturas', this.cop(r.valorAplicado)]];
    if (hayRetenciones) totales.push(['Retenciones practicadas', this.cop(retenciones)]);
    if (Number(r.valorAnticipo) > 0) totales.push(['Anticipo (saldo a favor)', this.cop(r.valorAnticipo)]);

    const pie = {
      columns: [
        { width: '*', ...pdfRecuadro('Observaciones', notas) },
        { width: 210, ...pdfTablaTotales(totales, ['Total recibido', this.cop(r.valorRecibido)]) },
      ],
      columnGap: 10,
      margin: [0, 8, 0, 0],
    };

    const firma = (titulo: string, sub?: string | null) => ({
      stack: [
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 0.7, lineColor: PDF_COLOR.texto }], margin: [0, 36, 0, 3] },
        { text: titulo, fontSize: 8, bold: true },
        ...(sub ? [{ text: sub, fontSize: 7, color: PDF_COLOR.gris }] : []),
      ],
    });

    return {
      info: { title: r.numero, subject: 'Recibo de caja' },
      pageSize: 'LETTER',
      pageMargins: [28, 26, 28, 40],
      defaultStyle: { fontSize: 8, color: PDF_COLOR.texto },
      watermark: anulado ? { text: 'ANULADO', color: '#dc2626', opacity: 0.1, bold: true } : undefined,
      content: [
        encabezado,
        ...avisoAnulado,
        cliente,
        suma,
        ...facturas,
        pie,
        {
          columns: [
            firma('Elaboró', r.usuarioNombre),
            { width: '*', text: '' },
            firma('Recibí conforme / Cliente', 'C.C. / NIT'),
          ],
          columnGap: 14,
          margin: [0, 26, 0, 0],
          unbreakable: true,
        },
      ],
      footer: (page: number, pages: number) => ({
        text: `${r.numero} · página ${page} de ${pages}`,
        alignment: 'right',
        fontSize: 7,
        color: PDF_COLOR.gris,
        margin: [28, 10, 28, 0],
      }),
    };
  }

  private cop(v: number | null | undefined): string {
    return '$ ' + new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v) || 0);
  }

  /** dd/mm/aaaa (y hora si se pide) de una fecha ISO del backend. */
  private fecha(iso: string | null | undefined, conHora: boolean): string {
    if (!iso) return '—';
    const d = new Date(iso.length === 10 ? iso + 'T00:00:00' : iso);
    if (isNaN(d.getTime())) return iso;
    const f = d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return conHora ? `${f} ${d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}` : f;
  }

  private metodo(m: string | null | undefined): string {
    if (!m) return '—';
    return METODOS_RECIBO.find((x) => x.value === m.toUpperCase())?.label ?? m;
  }

  private documentoTercero(numero: string | null | undefined, dv: string | null | undefined): string {
    if (!numero) return '—';
    return dv ? `${numero}-${dv}` : numero;
  }
}
