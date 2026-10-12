import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { lastValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { VentaModel } from '../../../../core/models/venta.model';
import { TerceroModel } from '../../../../core/models/tercero.model';
import { TerceroService } from '../../../../core/services/tercero.service';
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
} from '../../../../shared/utils/pdf-estilo';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || pdfFonts;


@Component({
  selector: 'app-modal-factura',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonModule, DialogModule, DividerModule],
  templateUrl: './modal-factura.component.html',
  styleUrls: ['./modal-factura.component.scss'],
})
export class ModalFacturaComponent implements OnChanges {
  @Input() displayModal = false;
  @Input() venta: VentaModel | null = null;
  @Output() modalClosed = new EventEmitter<void>();

  generando = false;

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly terceroService: TerceroService,
  ) {}

  ngOnChanges(_changes: SimpleChanges): void {}

  // ── Helpers ───────────────────────────────────────────────

  get numeroFactura(): string {
    if (!this.venta) return '';
    const num = String(this.venta.consecutivo ?? 0).padStart(6, '0');
    return this.venta.prefijo ? `${this.venta.prefijo}-${num}` : num;
  }

  get esElectronica(): boolean {
    return !!this.venta?.cufe;
  }

  private formatCOP(v: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }

  /** Parsea ISO (yyyy-MM-dd / timestamp) o dd/MM/yyyy. Null si no es válida. */
  private parseFecha(s?: string | null): Date | null {
    if (!s) return null;
    let d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? s + 'T00:00:00' : s);
    if (!isNaN(d.getTime())) return d;
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) {
      d = new Date(+m[3], +m[2] - 1, +m[1]);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  }

  private formatFecha(iso?: string | null): string {
    const d = this.parseFecha(iso);
    if (!d) return '—';
    return d.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private metodoPagoLabel(m: string): string {
    const map: Record<string, string> = {
      EFECTIVO: 'Efectivo',
      NEQUI: 'Nequi',
      DAVIPLATA: 'Daviplata',
      TARJETA: 'Tarjeta',
      TRANSFERENCIA: 'Transferencia',
      CREDITO: 'Crédito',
    };
    return map[m] ?? m;
  }

  /** Descarga un recurso (logo) como dataURL. Null si falla (CORS / vacío). */
  private async toDataUrl(url?: string | null): Promise<string | null> {
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

  /** Genera el QR de la factura electrónica como imagen dataURL. */
  private async qrDataUrl(data?: string | null): Promise<string | null> {
    if (!data) return null;
    try {
      // qrcode no trae tipos propios; se usa en runtime.
      // @ts-ignore
      const mod: any = await import('qrcode');
      const toDataURL = mod.toDataURL || mod.default?.toDataURL;
      return await toDataURL(data, { margin: 1, width: 150 });
    } catch {
      return null;
    }
  }

  // ── Construir documento pdfmake ───────────────────────────

  /** Ficha del cliente (dirección, municipio, email): la venta solo trae nombre y documento. */
  private async cliente(id: number | null): Promise<TerceroModel | null> {
    if (!id) return null;
    try {
      return (await lastValueFrom(this.terceroService.getById(id)))?.data ?? null;
    } catch {
      return null;
    }
  }

  private num(v: number | null | undefined, dec = 2): string {
    return new Intl.NumberFormat('es-CO', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(Number(v ?? 0));
  }

  private fechaHora(iso?: string | null): string {
    const d = this.parseFecha(iso);
    if (!d) return '—';
    const conHora = !!iso && iso.length > 10;
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + (conHora ? ' ' + d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : '');
  }

  private async buildDocDefinition(): Promise<any> {
    const v = this.venta!;
    const [logo, qr, ter] = await Promise.all([
      this.toDataUrl(v.logoUrl),
      this.qrDataUrl(v.qrData),
      this.cliente(v.clienteId),
    ]);

    const nombreEmpresa = v.razonSocial || v.sucursalNombre || 'Empresa';
    const titulo = this.esElectronica ? 'FACTURA ELECTRÓNICA DE VENTA' : 'FACTURA DE VENTA';

    // ── Encabezado: empresa · caja del documento · QR ──
    const encabezado = {
      columns: [
        {
          width: '*',
          ...pdfEmpresa(logo, nombreEmpresa, v.empresaNit ? `NIT ${v.empresaNit}` : null, [
            v.empresaDireccion,
            v.municipio,
            [v.empresaTelefono, v.empresaEmail].filter(Boolean).join(' · '),
          ]),
        },
        {
          width: 180,
          stack: [
            pdfCajaDocumento(titulo, `No. ${this.numeroFactura}`, [
              ['Estado', v.estadoVenta === 'COMPLETADA' ? 'Pagada' : 'Anulada'],
              ...(v.estadoDian ? [['DIAN', v.estadoDian] as [string, string]] : []),
            ]),
          ],
        },
        ...(qr
          ? [{
              width: 95,
              stack: [
                { image: qr, fit: [90, 90], alignment: 'right' },
                { text: 'Factura electrónica', fontSize: 6.5, color: PDF_COLOR.gris, alignment: 'center', margin: [0, 2, 0, 0] },
              ],
            }]
          : []),
      ],
      columnGap: 10,
    };

    // ── Cliente y fechas ──
    const documento = ter
      ? `${ter.numeroDocumento}${ter.dv ? '-' + ter.dv : ''}`
      : v.clienteDocumento ?? '222222222222';
    const clienteBloque = {
      columns: [
        {
          width: '*',
          ...pdfBloqueDatos([
            ['CC/NIT', documento],
            ['Cliente', v.clienteNombre ?? 'Consumidor Final'],
            ['País', ter?.pais || 'Colombia'],
            ['Municipio', ter?.municipio ?? null],
            ['Dirección', ter?.direccion ?? null],
            ['Email', ter?.emailFe || ter?.email || null],
          ]),
        },
        {
          width: 210,
          ...pdfBloqueDatos(
            [
              ['Fecha generación', this.fechaHora(v.fechaEmision)],
              ['Fecha de validación', this.esElectronica ? this.fechaHora(v.fechaEmision) : '—'],
              ['Sede', v.sucursalNombre ?? null],
            ],
            92,
          ),
        },
      ],
      columnGap: 10,
      margin: [0, 8, 0, 0],
    };

    // ── Ítems ──
    // subtotalLinea YA incluye el IVA y tiene el descuento restado:
    //   subtotalLinea = (precio·cant − descuento) + IVA
    // → base gravable (neta) = subtotalLinea − IVA ; total de línea = subtotalLinea
    let baseImponible = 0;
    let bruto = 0;
    const body: any[] = [[
      pdfTh('#', 'center'),
      pdfTh('Código'),
      pdfTh('Descripción'),
      pdfTh('Val. Unit', 'right'),
      pdfTh('Cantidad', 'right'),
      pdfTh('Descuento', 'right'),
      pdfTh('IVA', 'right'),
      pdfTh('Val. Item', 'right'),
    ]];
    v.detalles.forEach((d, i) => {
      const totalLinea = d.subtotalLinea ?? 0;
      const imp = d.impuestoValor ?? 0;
      const neta = totalLinea - imp;
      const desc = (d as any).montoDescuento ?? 0;
      const ivaPct = neta > 0 ? (imp / neta) * 100 : 0;
      const unit = d.precioUnitario ?? (d.cantidad ? neta / d.cantidad : 0);
      bruto += unit * (d.cantidad ?? 0);
      if (imp > 0) baseImponible += neta;
      body.push([
        pdfTd(i + 1, 'center'),
        pdfTd(d.productoSku),
        pdfTd(d.presentacionNombre ? `${d.productoNombre} (${d.presentacionNombre})` : d.productoNombre),
        pdfTd(this.num(unit), 'right'),
        pdfTd(this.num(d.cantidad, d.cantidad % 1 === 0 ? 2 : 3), 'right'),
        pdfTd(this.num(desc), 'right'),
        pdfTd(this.num(Math.round(ivaPct * 100) / 100), 'right'),
        pdfTd(this.num(totalLinea), 'right', { bold: true }),
      ]);
    });

    // ── Totales ──
    const totales: [string, string][] = [
      ['Valor Bruto', '$ ' + this.num(bruto)],
      ['Base Imponible', '$ ' + this.num(baseImponible)],
      ['IVA', '$ ' + this.num(v.impuestosTotal)],
      ['Descuento global(-)', '$ ' + this.num(v.descuentoTotal)],
      ['Recargo global(+)', '$ ' + this.num(0)],
    ];

    // ── Pie izquierdo: observaciones, tipo de operación, detalles de pago ──
    const pagos = v.pagos ?? [];
    const credito = pagos.some((p) => p.metodoPago === 'CREDITO');
    const detallePago = {
      table: {
        widths: ['*', '*', 'auto'],
        body: [
          [pdfTh('Forma de pago'), pdfTh('Medio de pago'), pdfTh('Monto', 'right')],
          ...(pagos.length
            ? pagos.map((p) => [
                pdfTd(p.metodoPago === 'CREDITO' ? 'Crédito' : 'Pago de contado'),
                pdfTd(this.metodoPagoLabel(p.metodoPago)),
                pdfTd('$ ' + this.num(p.monto), 'right'),
              ])
            : [[pdfTd(credito ? 'Crédito' : 'Pago de contado'), pdfTd('—'), pdfTd('$ ' + this.num(v.totalPagar), 'right')]]),
        ],
      },
      layout: pdfLayoutZebra(1),
      margin: [0, 6, 0, 0],
    };
    const izquierda: any[] = [
      pdfRecuadro('Observaciones', v.observaciones ? [{ text: v.observaciones, fontSize: 7.5 }] : []),
      { ...pdfBloqueDatos([['Tipo de operación', 'Estándar']], 92), margin: [0, 6, 0, 0] },
      detallePago,
    ];

    const content: any[] = [
      encabezado,
      clienteBloque,
      {
        table: { headerRows: 1, widths: [14, 44, '*', 56, 46, 48, 32, 62], body },
        layout: pdfLayoutZebra(1),
        margin: [0, 8, 0, 0],
      },
      {
        columns: [
          { width: '*', stack: izquierda },
          { width: 210, ...pdfTablaTotales(totales, ['Total', '$ ' + this.num(v.totalPagar)]) },
        ],
        columnGap: 10,
        margin: [0, 8, 0, 0],
        unbreakable: true,
      },
    ];
    if (this.esElectronica) content.push(this.bloqueElectronico(v));

    return {
      pageSize: 'LETTER',
      pageMargins: [28, 26, 28, 40],
      content,
      defaultStyle: { fontSize: 8, color: PDF_COLOR.texto },
      watermark: v.estadoVenta === 'COMPLETADA' ? undefined : { text: 'ANULADA', color: '#dc2626', opacity: 0.1, bold: true },
      info: { title: `Factura ${this.numeroFactura}` },
      footer: (page: number, count: number) => ({
        columns: [
          { text: `Factura ${this.numeroFactura}`, fontSize: 7, color: PDF_COLOR.gris, margin: [28, 0, 0, 0] },
          { text: `Página ${page} de ${count}`, alignment: 'right', fontSize: 7, color: PDF_COLOR.gris, margin: [0, 0, 28, 0] },
        ],
        margin: [0, 12, 0, 0],
      }),
    };
  }

  /** Texto de la resolución DIAN (o null). Solo incluye vigencia si la fecha es válida. */
  private resolucionTexto(v: VentaModel): string | null {
    if (!v.resolucionNumero) return null;
    const rango = v.resolucionDesde && v.resolucionHasta
      ? ` del ${v.resolucionDesde} al ${v.resolucionHasta}` : '';
    const vig = this.parseFecha(v.resolucionFechaHasta)
      ? `, vigente hasta ${this.formatFecha(v.resolucionFechaHasta)}` : '';
    return `Resolución DIAN N.° ${v.resolucionNumero}`
      + `${v.resolucionPrefijo ? ' · Prefijo ' + v.resolucionPrefijo : ''}${rango}${vig}`;
  }

  /** Bloque inferior de facturación electrónica: CUFE + estado + resolución. */
  private bloqueElectronico(v: VentaModel): any {
    const stack: any[] = [
      { text: [{ text: 'CUFE: ', bold: true }, v.cufe ?? ''], fontSize: 7, color: PDF_COLOR.texto },
    ];
    if (v.estadoDian) {
      stack.push({ text: [{ text: 'Estado DIAN: ', bold: true }, v.estadoDian], fontSize: 7.5, margin: [0, 2, 0, 0] });
    }
    const reso = this.resolucionTexto(v);
    if (reso) stack.push({ text: reso, fontSize: 7, color: PDF_COLOR.gris, margin: [0, 2, 0, 0] });
    stack.push({
      text: 'Representación gráfica de la factura electrónica de venta. Verifíquela escaneando el código QR.',
      fontSize: 6.8, italics: true, color: PDF_COLOR.gris, margin: [0, 3, 0, 0],
    });
    return { ...pdfRecuadro('Facturación electrónica', stack), margin: [0, 10, 0, 0], unbreakable: true };
  }

  // ── Acciones ─────────────────────────────────────────────

  async descargar(): Promise<void> {
    if (!this.venta) return;
    this.generando = true;
    this.cdr.markForCheck();
    try {
      const doc = await this.buildDocDefinition();
      pdfMake.createPdf(doc).download(`Factura-${this.numeroFactura}.pdf`);
    } finally {
      this.generando = false;
      this.cdr.markForCheck();
    }
  }

  async imprimir(): Promise<void> {
    if (!this.venta) return;
    this.generando = true;
    this.cdr.markForCheck();
    try {
      const doc = await this.buildDocDefinition();
      pdfMake.createPdf(doc).print();
    } finally {
      this.generando = false;
      this.cdr.markForCheck();
    }
  }

  close(): void {
    this.modalClosed.emit();
  }

  formatCOPPublic = (v: number) => this.formatCOP(v);

  /** IVA % real de una línea (subtotalLinea incluye IVA; el descuento ya está restado). */
  ivaPorcentaje(d: { subtotalLinea: number; impuestoValor: number }): number {
    const neta = (d.subtotalLinea ?? 0) - (d.impuestoValor ?? 0);
    return neta > 0 ? (d.impuestoValor / neta) * 100 : 0;
  }
}
