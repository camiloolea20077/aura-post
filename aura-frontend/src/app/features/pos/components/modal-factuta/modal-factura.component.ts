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
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { VentaModel } from '../../../../core/models/venta.model';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || pdfFonts;

const AZUL = '#2563eb';
const GRIS = '#64748b';
const OSCURO = '#1e293b';

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

  constructor(private readonly cdr: ChangeDetectorRef) {}

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

  private async buildDocDefinition(): Promise<any> {
    const v = this.venta!;
    const [logo, qr] = await Promise.all([
      this.toDataUrl(v.logoUrl),
      this.qrDataUrl(v.qrData),
    ]);

    const nombreEmpresa = v.razonSocial || v.sucursalNombre || 'Empresa';
    const nit = v.empresaNit ? `NIT ${v.empresaNit}` : '';

    // Izquierda: logo arriba y TODOS los datos de la empresa debajo del logo.
    const empresaStack: any[] = [];
    if (logo) empresaStack.push({ image: logo, fit: [150, 60], margin: [0, 0, 0, 6] });
    empresaStack.push({ text: nombreEmpresa, fontSize: 13, bold: true, color: OSCURO });
    if (nit) empresaStack.push({ text: nit, fontSize: 8, color: GRIS, margin: [0, 1, 0, 0] });
    if (v.empresaDireccion) empresaStack.push({ text: v.empresaDireccion, fontSize: 8, color: GRIS });
    if (v.municipio) empresaStack.push({ text: v.municipio, fontSize: 8, color: GRIS });
    const contacto = [v.empresaTelefono, v.empresaEmail].filter(Boolean).join(' · ');
    if (contacto) empresaStack.push({ text: contacto, fontSize: 8, color: GRIS });

    // Derecha: QR de la factura electrónica en la misma línea del encabezado.
    const columnaDerecha = qr
      ? {
          width: 'auto',
          stack: [
            { image: qr, fit: [95, 95], alignment: 'right' },
            { text: 'Factura Electrónica', fontSize: 7, color: GRIS, alignment: 'center', margin: [0, 2, 0, 0] },
          ],
        }
      : { width: 'auto', text: '' };

    // Encabezado: empresa (izq) + QR (der)
    const encabezado = {
      columns: [{ width: '*', stack: empresaStack }, columnaDerecha],
      columnGap: 12,
      margin: [0, 0, 0, 12],
    };

    // Filas de productos.
    // subtotalLinea YA incluye el IVA y tiene el descuento restado:
    //   subtotalLinea = (precio·cant − descuento) + IVA
    // → base gravable (neta) = subtotalLinea − IVA ; total de línea = subtotalLinea
    const bodyRows = v.detalles.map((d) => {
      const totalLinea = d.subtotalLinea ?? 0;
      const imp = d.impuestoValor ?? 0;
      const neta = totalLinea - imp;
      const desc = (d as any).montoDescuento ?? 0;
      const ivaPct = neta > 0 ? Math.round((imp / neta) * 100) : 0;
      return [
        { text: d.productoNombre, fontSize: 8, color: OSCURO, margin: [0, 2, 0, 2] },
        { text: d.cantidad % 1 === 0 ? d.cantidad.toFixed(0) : d.cantidad.toFixed(3), fontSize: 8, alignment: 'right' },
        { text: this.formatCOP(d.precioUnitario ?? (d.cantidad ? neta / d.cantidad : 0)), fontSize: 8, alignment: 'right' },
        { text: imp > 0 ? `${ivaPct}%` : '—', fontSize: 8, alignment: 'right' },
        { text: desc > 0 ? `-${this.formatCOP(desc)}` : '—', fontSize: 8, alignment: 'right' },
        { text: this.formatCOP(totalLinea), fontSize: 8, alignment: 'right', bold: true },
      ];
    });

    // Métodos de pago
    const pagoRows = (v.pagos ?? []).map((p) => [
      { text: this.metodoPagoLabel(p.metodoPago), fontSize: 9 },
      { text: this.formatCOP(p.monto), fontSize: 9, alignment: 'right' },
    ]);

    // Subtotales
    const totalesBody: any[] = [
      [{ text: 'Subtotal', fontSize: 9, color: GRIS }, { text: this.formatCOP(v.subtotal), fontSize: 9, alignment: 'right' }],
    ];
    if (v.descuentoTotal > 0) {
      totalesBody.push([
        { text: 'Descuento', fontSize: 9, color: '#dc2626' },
        { text: `- ${this.formatCOP(v.descuentoTotal)}`, fontSize: 9, alignment: 'right', color: '#dc2626' },
      ]);
    }
    if (v.impuestosTotal > 0) {
      totalesBody.push([
        { text: 'IVA', fontSize: 9, color: GRIS },
        { text: this.formatCOP(v.impuestosTotal), fontSize: 9, alignment: 'right' },
      ]);
    }
    totalesBody.push([
      { text: 'TOTAL', bold: true, fontSize: 12, color: '#fff', fillColor: AZUL, margin: [6, 5, 6, 5] },
      { text: this.formatCOP(v.totalPagar), bold: true, fontSize: 12, color: '#fff', fillColor: AZUL, alignment: 'right', margin: [6, 5, 6, 5] },
    ]);

    // Bloque de facturación electrónica (CUFE + estado + resolución), va ABAJO.
    const bloqueFE = this.esElectronica ? this.bloqueElectronico(v) : null;

    const content: any[] = [
      encabezado,
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2.5, lineColor: AZUL }], margin: [0, 0, 0, 12] },
      {
        columns: [
          { text: this.esElectronica ? 'FACTURA ELECTRÓNICA DE VENTA' : 'FACTURA DE VENTA', fontSize: 15, bold: true, color: OSCURO },
          { text: `N.° ${this.numeroFactura}`, fontSize: 13, bold: true, color: AZUL, alignment: 'right' },
        ],
        margin: [0, 0, 0, 14],
      },
    ];

    // Cliente + fechas
    content.push({
      table: {
        widths: ['*', 'auto'],
        body: [[
          {
            border: [false, false, false, false],
            stack: [
              { text: 'FACTURAR A', fontSize: 8, bold: true, color: AZUL, margin: [0, 0, 0, 3] },
              { text: v.clienteNombre ?? 'Consumidor Final', fontSize: 11, bold: true, color: OSCURO },
              v.clienteDocumento ? { text: `Documento: ${v.clienteDocumento}`, fontSize: 8, color: GRIS, margin: [0, 1, 0, 0] } : {},
            ],
          },
          {
            border: [false, false, false, false],
            stack: [
              { text: [{ text: 'Fecha: ', bold: true }, this.formatFecha(v.fechaEmision)], fontSize: 9, alignment: 'right' },
              { text: [{ text: 'Estado: ', bold: true }, v.estadoVenta === 'COMPLETADA' ? 'Pagada' : 'Anulada'], fontSize: 9, alignment: 'right', color: v.estadoVenta === 'COMPLETADA' ? '#16a34a' : '#dc2626' },
              v.estadoDian ? { text: [{ text: 'DIAN: ', bold: true }, v.estadoDian], fontSize: 9, alignment: 'right', color: GRIS } : {},
            ],
          },
        ]],
      },
      layout: { fillColor: () => '#f8fafc', paddingLeft: () => 8, paddingRight: () => 8, paddingTop: () => 6, paddingBottom: () => 6, hLineWidth: () => 0, vLineWidth: () => 0 },
      margin: [0, 0, 0, 16],
    });

    // Tabla de productos
    content.push({
      table: {
        headerRows: 1,
        widths: ['*', 40, 65, 32, 60, 68],
        body: [
          [
            { text: 'DESCRIPCIÓN', style: 'th' },
            { text: 'CANT.', style: 'th', alignment: 'right' },
            { text: 'PRECIO', style: 'th', alignment: 'right' },
            { text: 'IVA', style: 'th', alignment: 'right' },
            { text: 'DESC.', style: 'th', alignment: 'right' },
            { text: 'TOTAL', style: 'th', alignment: 'right' },
          ],
          ...bodyRows,
        ],
      },
      layout: {
        fillColor: (row: number) => (row === 0 ? AZUL : row % 2 === 0 ? '#f8fafc' : null),
        hLineColor: () => '#e2e8f0',
        hLineWidth: () => 0.5,
        vLineWidth: () => 0,
      },
      margin: [0, 0, 0, 16],
    });

    // Totales + pagos
    content.push({
      columns: [
        {
          width: '*',
          stack: [
            { text: 'MÉTODOS DE PAGO', fontSize: 8, bold: true, color: AZUL, margin: [0, 4, 0, 4] },
            {
              table: { widths: [90, 70], body: pagoRows.length ? pagoRows : [[{ text: '—', fontSize: 9 }, { text: '', fontSize: 9 }]] },
              layout: 'noBorders',
            },
          ],
        },
        {
          width: 240,
          table: { widths: ['*', 'auto'], body: totalesBody },
          layout: 'noBorders',
        },
      ],
    });

    if (bloqueFE) content.push(bloqueFE);

    if (v.observaciones) {
      content.push({
        stack: [
          { text: 'OBSERVACIONES', fontSize: 8, bold: true, color: AZUL, margin: [0, 18, 0, 3] },
          { text: v.observaciones, fontSize: 9, color: OSCURO, italics: true },
        ],
      });
    }

    return {
      pageSize: 'LETTER',
      pageMargins: [40, 40, 40, 55],
      content,
      styles: { th: { fontSize: 8, bold: true, color: '#fff', margin: [0, 4, 0, 4] } },
      defaultStyle: { fontSize: 9, color: OSCURO },
      footer: (page: number, count: number) => ({
        columns: [
          { text: `Factura ${this.numeroFactura}`, fontSize: 7, color: GRIS, margin: [40, 0, 0, 0] },
          { text: `Página ${page} de ${count}`, alignment: 'right', fontSize: 7, color: GRIS, margin: [0, 0, 40, 0] },
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
      { text: 'FACTURACIÓN ELECTRÓNICA', fontSize: 8, bold: true, color: AZUL, margin: [0, 0, 0, 4] },
      { text: [{ text: 'CUFE: ', bold: true }, v.cufe ?? ''], fontSize: 7.5, color: OSCURO },
    ];
    if (v.estadoDian) {
      stack.push({ text: [{ text: 'Estado DIAN: ', bold: true }, v.estadoDian], fontSize: 8, color: GRIS, margin: [0, 2, 0, 0] });
    }
    const reso = this.resolucionTexto(v);
    if (reso) stack.push({ text: reso, fontSize: 7.5, color: GRIS, margin: [0, 2, 0, 0] });
    stack.push({
      text: 'Documento validado por la DIAN. Verifíquelo escaneando el código QR del encabezado.',
      fontSize: 7, italics: true, color: GRIS, margin: [0, 3, 0, 0],
    });

    return {
      table: { widths: ['*'], body: [[{ stack, margin: [8, 6, 8, 6], border: [false, false, false, false] }]] },
      layout: { fillColor: () => '#f8fafc' },
      margin: [0, 20, 0, 0],
    };
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
