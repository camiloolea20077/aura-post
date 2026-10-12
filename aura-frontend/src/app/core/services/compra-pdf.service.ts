import { Injectable, inject } from '@angular/core';
import { lastValueFrom } from 'rxjs';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || pdfFonts;

import { CompraModel } from '../models/compra.model';
import { TerceroModel } from '../models/tercero.model';
import { CompraService } from './compra.service';
import { EmpresaConfig, EmpresaService } from './empresa.service';
import { TerceroService } from './tercero.service';
import { pesosEnLetras } from '../../shared/utils/numero-letras';
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
} from '../../shared/utils/pdf-estilo';

/**
 * PDF de la compra (factura de compra, nota débito/crédito, recibo) con el
 * estilo común de documentos. Sirve para cualquier forma de pago y estado: la
 * anulada sale con marca de agua.
 *
 * Las notas crédito guardan cantidades y valores con signo negativo; en el PDF
 * se muestran en positivo porque el título ya dice que es una devolución.
 */
@Injectable({ providedIn: 'root' })
export class CompraPdfService {
  private readonly compraService = inject(CompraService);
  private readonly empresaService = inject(EmpresaService);
  private readonly terceroService = inject(TerceroService);

  /** Abre el PDF en una pestaña para verlo. */
  async ver(compra: CompraModel | number): Promise<void> {
    const { doc } = await this.preparar(compra);
    await pdfMake.createPdf(doc).open();
  }

  /** Descarga el PDF con el número de la compra como nombre (FC-000012.pdf). */
  async descargar(compra: CompraModel | number): Promise<void> {
    const { doc, nombre } = await this.preparar(compra);
    await pdfMake.createPdf(doc).download(`${nombre}.pdf`);
  }

  private async preparar(compra: CompraModel | number): Promise<{ doc: any; nombre: string }> {
    const c =
      typeof compra === 'number'
        ? (await lastValueFrom(this.compraService.getById(compra)))?.data
        : compra;
    if (!c) throw new Error('No se encontró la compra');

    const [empRes, provRes] = await Promise.all([
      lastValueFrom(this.empresaService.getConfig()).catch(() => null),
      lastValueFrom(this.terceroService.getById(c.proveedorId)).catch(() => null),
    ]);
    const emp: EmpresaConfig = empRes?.data ?? {};
    const prov: TerceroModel | null = provRes?.data ?? null;
    const logo = emp.logoUrl ? await this.aBase64(emp.logoUrl) : null;

    const numero = this.numero(c);
    return {
      doc: this.documento(c, emp, prov, logo, numero),
      nombre: numero.replace(/[^A-Za-z0-9_-]/g, '_'),
    };
  }

  private numero(c: CompraModel): string {
    return c.numeroCompra ?? `C-${String(c.id).padStart(6, '0')}`;
  }

  private titulo(c: CompraModel): string {
    switch (c.tipoDocumento) {
      case 'NOTA_CREDITO':
        return 'NOTA CRÉDITO DE COMPRA';
      case 'NOTA_DEBITO':
        return 'NOTA DÉBITO DE COMPRA';
      case 'RECIBO':
        return 'RECIBO DE COMPRA';
      default:
        return 'FACTURA DE COMPRA';
    }
  }

  private num(v: number | null | undefined, dec = 2): string {
    return new Intl.NumberFormat('es-CO', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(
      Math.abs(Number(v ?? 0)),
    );
  }

  private cop(v: number | null | undefined): string {
    return '$ ' + this.num(v);
  }

  private cantidad(v: number | null | undefined): string {
    const n = Math.abs(Number(v ?? 0));
    return this.num(n, n % 1 === 0 ? 0 : 3);
  }

  private fecha(v: string | null | undefined): string {
    if (!v) return '—';
    // "2026-10-09" se lee como fecha local (sin el corrimiento de UTC).
    const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(v + 'T00:00:00') : new Date(v);
    return isNaN(d.getTime())
      ? v
      : d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private metodoPago(m: string): string {
    const map: Record<string, string> = {
      EFECTIVO: 'Efectivo',
      TARJETA: 'Tarjeta',
      TRANSFERENCIA: 'Transferencia',
      CREDITO: 'Crédito',
      CHEQUE: 'Cheque',
    };
    return map[m] ?? m;
  }

  private destinoNotaCredito(d: string | null | undefined): string | null {
    const map: Record<string, string> = {
      CRUCE_CXP: 'Cruce con la cuenta por pagar',
      DEVOLUCION_DINERO: 'Devolución de dinero',
      SALDO_A_FAVOR: 'Saldo a favor con el proveedor',
    };
    return d ? (map[d] ?? d) : null;
  }

  private documento(
    c: CompraModel,
    emp: EmpresaConfig,
    prov: TerceroModel | null,
    logo: string | null,
    numero: string,
  ): any {
    const titulo = this.titulo(c);
    const esNC = c.tipoDocumento === 'NOTA_CREDITO';
    const anulada = c.estado === 'ANULADA';
    const nitEmpresa = emp.nit ? `NIT ${emp.nit}${emp.dv ? '-' + emp.dv : ''}` : null;

    const formaPago = c.formaPago === 'CONTADO' ? 'Contado' : c.formaPago === 'CREDITO' ? 'Crédito' : '—';

    const encabezado = {
      columns: [
        {
          width: '*',
          ...pdfEmpresa(logo, emp.razonSocial || emp.nombreComercial || '', nitEmpresa, [
            emp.direccion,
            [emp.municipio, emp.telefono ? `Tel: ${emp.telefono}` : null].filter(Boolean).join(' · ') || null,
            emp.correo,
          ]),
        },
        {
          width: 185,
          ...pdfCajaDocumento(titulo, `No. ${numero}`, [
            ['Fecha', this.fecha(c.fecha)],
            ['Estado', anulada ? 'Anulada' : 'Recibida'],
          ]),
        },
      ],
      columnGap: 10,
    };

    const provNombre = prov
      ? prov.razonSocial || `${prov.nombres ?? ''} ${prov.apellidos ?? ''}`.trim() || c.proveedorNombre
      : c.proveedorNombre;
    const provDoc = prov
      ? `${prov.tipoDocumento} ${prov.numeroDocumento}${prov.dv ? '-' + prov.dv : ''}`
      : null;

    const datos = {
      columns: [
        {
          width: '*',
          ...pdfBloqueDatos([
            ['Proveedor', provNombre],
            ['CC/NIT', provDoc],
            ['Dirección', prov?.direccion ?? null],
            ['Municipio', prov?.municipio ?? null],
            ['Teléfono', prov?.telefono ?? null],
            ['Email', prov?.email ?? null],
          ]),
        },
        {
          width: 200,
          ...pdfBloqueDatos(
            [
              ['Forma de pago', formaPago],
              ['Sucursal', c.sucursalNombre],
              ...(esNC
                ? ([
                    ['Afecta a', c.compraOrigenNumero ?? null],
                    ['Destino', this.destinoNotaCredito(c.destinoNotaCredito)],
                  ] as [string, string | null][])
                : []),
            ],
            72,
          ),
        },
      ],
      columnGap: 10,
      margin: [0, 8, 0, 0],
    };

    const items = {
      table: {
        headerRows: 1,
        widths: [16, 58, '*', 40, 62, 46, 50, 66],
        body: [
          [
            pdfTh('#', 'center'),
            pdfTh('Código'),
            pdfTh('Descripción'),
            pdfTh('Cant.', 'right'),
            pdfTh('Costo unit.', 'right'),
            pdfTh('Desc.', 'right'),
            pdfTh('IVA', 'right'),
            pdfTh('Valor', 'right'),
          ],
          ...c.detalles.map((d, i) => {
            const enPresentacion = !!d.presentacionNombre && d.cantidadPresentacion != null;
            const descripcion: any[] = [{ text: d.productoNombre, fontSize: 7.6 }];
            if (enPresentacion) {
              descripcion.push({
                text: `${this.cantidad(d.cantidadPresentacion)} ${d.presentacionNombre} · ${this.cantidad(d.cantidad)} ${d.unidadAbreviatura || 'und'}`,
                fontSize: 6.6,
                color: PDF_COLOR.gris,
              });
            }
            for (const l of d.lotes ?? []) {
              descripcion.push({
                text: `Lote ${l.codigoLote}${l.fechaVencimiento ? ' · vence ' + this.fecha(l.fechaVencimiento) : ''}`,
                fontSize: 6.6,
                color: PDF_COLOR.gris,
              });
            }
            if (d.seriales?.length) {
              descripcion.push({ text: 'Seriales: ' + d.seriales.join(', '), fontSize: 6.6, color: PDF_COLOR.gris });
            }
            return [
              pdfTd(i + 1, 'center'),
              pdfTd(d.productoSku),
              { stack: descripcion },
              pdfTd(enPresentacion ? this.cantidad(d.cantidadPresentacion) : this.cantidad(d.cantidad), 'right'),
              pdfTd(this.num(enPresentacion ? d.costoPresentacion : d.costoUnitario), 'right'),
              pdfTd(Number(d.descuentoValor) ? this.num(d.descuentoValor) : '', 'right'),
              pdfTd(Number(d.impuestoValor) ? this.num(d.impuestoValor) : '', 'right'),
              pdfTd(this.num(Number(d.subtotalLinea ?? 0) + Number(d.impuestoValor ?? 0)), 'right', { bold: true }),
            ];
          }),
        ],
      },
      layout: pdfLayoutZebra(1),
      margin: [0, 10, 0, 0],
    };

    // Totales: subtotal bruto − descuento + IVA + fletes = total; menos retenciones = neto.
    const filasTotales: [string, string][] = [['Subtotal', this.cop(c.subtotal)]];
    if (Number(c.descuentoTotal)) filasTotales.push(['Descuento', '− ' + this.cop(c.descuentoTotal)]);
    if (Number(c.impuestosTotal)) filasTotales.push(['IVA', this.cop(c.impuestosTotal)]);
    if (Number(c.fletes)) filasTotales.push(['Fletes', this.cop(c.fletes)]);
    const retenciones: [string, number | null, number | null][] = [
      ['Retefuente', c.retefuentePct, c.retefuenteValor],
      ['ReteIVA', c.reteivaPct, c.reteivaValor],
      ['ReteICA', c.reteicaPct, c.reteicaValor],
    ];
    const hayRetenciones = retenciones.some(([, , v]) => Number(v));
    if (hayRetenciones) {
      filasTotales.push(['Total', this.cop(c.total)]);
      for (const [nombre, pct, valor] of retenciones) {
        if (Number(valor)) filasTotales.push([`${nombre} (${Number(pct ?? 0)}%)`, '− ' + this.cop(valor)]);
      }
    }
    const totalFinal = hayRetenciones ? (c.netaAPagar ?? c.total) : c.total;
    const etiquetaTotal = esNC ? 'Total devuelto' : hayRetenciones ? 'Neto a pagar' : 'Total';

    const pagos = (c.pagos ?? []).map((p) => ({
      columns: [
        { text: this.metodoPago(p.metodoPago) + (p.banco ? ` · ${p.banco}` : ''), fontSize: 7.6, width: '*' },
        { text: this.cop(p.monto), fontSize: 7.6, alignment: 'right', width: 80 },
      ],
      margin: [0, 1, 0, 1],
    }));

    const pie = {
      columns: [
        {
          width: '*',
          stack: [
            pdfRecuadro('Valor en letras', [{ text: pesosEnLetras(Math.abs(Number(totalFinal ?? 0))), fontSize: 7.6 }]),
            { text: '', margin: [0, 4, 0, 0] },
            pdfRecuadro(
              'Detalle de pago',
              pagos.length
                ? pagos
                : [{ text: c.formaPago === 'CREDITO' ? 'Compra a crédito: queda como cuenta por pagar.' : '—', fontSize: 7.6 }],
            ),
            { text: '', margin: [0, 4, 0, 0] },
            pdfRecuadro('Observaciones', c.observaciones ? [{ text: c.observaciones, fontSize: 7.6 }] : []),
          ],
        },
        { width: 200, ...pdfTablaTotales(filasTotales, [etiquetaTotal, this.cop(totalFinal)]) },
      ],
      columnGap: 10,
      margin: [0, 10, 0, 0],
    };

    const firma = (t: string) => ({
      stack: [
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 0.7, lineColor: PDF_COLOR.texto }], margin: [0, 34, 0, 3] },
        { text: t, fontSize: 8, bold: true },
      ],
    });

    return {
      info: { title: numero, subject: titulo },
      pageSize: 'LETTER',
      pageMargins: [28, 26, 28, 40],
      defaultStyle: { fontSize: 8, color: PDF_COLOR.texto },
      watermark: anulada ? { text: 'ANULADA', color: '#dc2626', opacity: 0.1, bold: true } : undefined,
      content: [
        encabezado,
        ...(anulada ? [{ text: 'COMPRA ANULADA', color: PDF_COLOR.rojo, bold: true, margin: [0, 6, 0, 0] }] : []),
        datos,
        items,
        pie,
        {
          columns: [firma('Elaboró'), firma('Recibió mercancía'), firma('Proveedor')],
          columnGap: 24,
          margin: [0, 24, 0, 0],
          unbreakable: true,
        },
      ],
      footer: (page: number, pages: number) => ({
        columns: [
          { text: 'AURA NUBE — Software de gestión empresarial', fontSize: 7, color: PDF_COLOR.gris },
          { text: `${numero} · página ${page} de ${pages}`, alignment: 'right', fontSize: 7, color: PDF_COLOR.gris },
        ],
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

