import {
  Component,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ViewChild,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectButtonModule } from 'primeng/selectbutton';
import {
  VentaDetalleResponse,
  VentaPagoResponse,
  VentaResponse,
} from '../../../../core/models/venta-response.model';
import { VentaModel } from '../../../../core/models/venta.model';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { QRCodeModule } from 'angularx-qrcode';

type AnchoTirilla = 58 | 80;

@Component({
  selector: 'app-modal-tirilla',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DecimalPipe,
    FormsModule,
    ButtonModule,
    DialogModule,
    SelectButtonModule,
    QRCodeModule,
  ],
  templateUrl: './modal-tirilla.component.html',
  styleUrls: ['./modal-tirilla.component.scss'],
})
export class ModalTirillaComponent implements OnChanges {
  @Input() displayModal = false;
  @Input() venta: VentaModel | null = null;
  @Input() qrData: string | null = null;
  @Input() cufeCode: string | null = null;
  @Output() modalClosed = new EventEmitter<void>();
  @ViewChild('qrWrap', { read: ElementRef }) qrWrapRef?: ElementRef;
  logoSafeUrl: SafeUrl | null = null;
  ancho: AnchoTirilla = 80;

  descuentoAdicional: number = 0;
  descuentoTotal: number = 0;

  anchoOptions = [
    { label: '58 mm', value: 58 },
    { label: '80 mm', value: 80 },
  ];
  constructor(private sanitizer: DomSanitizer) {}
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['venta'] && this.venta) {
      this.ancho = 58;
      this.logoSafeUrl = this.venta.logoUrl
        ? this.sanitizer.bypassSecurityTrustUrl(this.venta.logoUrl)
        : null;
      this.descuentoTotal = this.venta.detalles.reduce(
        (acc, d) => acc + d.montoDescuento,
        0,
      );
      this.descuentoAdicional = this.venta.descuentoTotal - this.descuentoTotal;
    }
  }

  get numeroVenta(): string {
    if (!this.venta) return '';
    return String(this.venta.consecutivo).padStart(6, '0');
  }

  // Calcula % IVA estimado de la línea
  getPctIva(d: VentaDetalleResponse): number {
    if (!d.subtotalLinea || d.subtotalLinea === 0) return 0;
    return Math.round((d.impuestoValor / d.subtotalLinea) * 100);
  }

  // Cambio por cada pago EFECTIVO
  getCambio(p: VentaPagoResponse): number {
    if (!this.venta || p.metodoPago !== 'EFECTIVO') return 0;
    return Math.max(0, p.monto - this.venta.totalPagar);
  }

  imprimir(): void {
    if (!this.venta) return;

    const v = this.venta;
    const anchoPage = this.ancho === 58 ? '58mm' : '80mm';
    const fontSize = this.ancho === 58 ? '11px' : '13px';
    // Columnas en % del ancho total — nunca se desbordan
    const colCant = '8%';
    const colVal = '22%';
    const colTot = '22%';
    const numeroVenta = String(v.consecutivo).padStart(6, '0');

    // ── Construir filas de productos ──────────────────────────────
    const filasProductos = v.detalles
      .map((d) => {
        const cantStr =
          d.cantidad % 1 === 0
            ? String(Math.round(d.cantidad))
            : d.cantidad.toFixed(3);
        const total = d.subtotalLinea;
        const descRow =
          d.montoDescuento > 0
            ? `<div style="display:flex;justify-content:space-between;font-size:0.85em;padding-left:4px;">
             <span>DESCUENTO:</span><span>-${this.formatCOP(d.montoDescuento)}</span>
           </div>`
            : '';
        return `
        <div style="margin:2px 0;">
          <div style="display:table;width:100%;table-layout:fixed;">
            <span style="display:table-cell;overflow:hidden;">${d.productoNombre}</span>
            <span style="display:table-cell;width:${colCant};text-align:center;">${cantStr}</span>
            <span style="display:table-cell;width:${colVal};text-align:right;">${this.formatCOP(d.precioUnitario)}</span>
            <span style="display:table-cell;width:${colTot};text-align:right;">${this.formatCOP(total)}</span>
          </div>
          ${descRow}
        </div>`;
      })
      .join('');

    // ── Construir filas de pagos ──────────────────────────────────
    const filasPagos = v.pagos
      .map((p) => {
        const cambio =
          p.metodoPago === 'EFECTIVO' ? Math.max(0, p.monto - v.totalPagar) : 0;
        const cambioHtml =
          cambio > 0
            ? `<span style="text-align:right;">Cambio: ${this.formatCOP(cambio)}</span>`
            : '';
        return `
        <div style="display:flex;gap:4px;font-size:0.92em;padding:1px 0;">
          <span style="flex:1;">${this.metodoPagoLabel(p.metodoPago)}</span>
          <span style="text-align:right;">${this.formatCOP(p.monto)}</span>
          ${cambioHtml}
        </div>`;
      })
      .join('');

    // ── Logo ──────────────────────────────────────────────────────
    const logoHtml = v.logoUrl
      ? `<div style="text-align:center;margin-bottom:5px;">
           <img src="${v.logoUrl}" style="max-width:55%;max-height:16mm;object-fit:contain;" onerror="this.style.display='none'" />
         </div>`
      : '';

    // ── Totales opcionales ────────────────────────────────────────
    const impuestoHtml =
      v.impuestosTotal > 0
        ? `<div style="display:flex;justify-content:space-between;padding:1px 0;">
           <span>Impuesto (Impo + Iva)</span><span>${this.formatCOP(v.impuestosTotal)}</span>
         </div>`
        : '';
    const descuentoHtml =
      v.descuentoTotal > 0
        ? `<div style="display:flex;justify-content:space-between;padding:1px 0;">
           <span>Descuento</span><span>-${this.formatCOP(v.descuentoTotal)}</span>
         </div>`
        : '';

    // ── QR y CUFE ─────────────────────────────────────────────────
    let qrImageData = '';
    if (this.qrData && this.qrWrapRef) {
      const canvas = this.qrWrapRef.nativeElement.querySelector(
        'canvas',
      ) as HTMLCanvasElement | null;
      if (canvas) qrImageData = canvas.toDataURL('image/png');
    }
    const feHtml =
      this.qrData || this.cufeCode
        ? `<hr class="dash"/>
           <div style="text-align:center;font-size:0.8em;font-weight:bold;letter-spacing:1px;margin-bottom:3px;">FACTURA ELECTRÓNICA</div>
           ${qrImageData ? `<div style="text-align:center;margin:4px 0;"><img src="${qrImageData}" style="width:110px;height:110px;" /></div>` : ''}
           ${
             this.cufeCode
               ? `<div style="font-size:0.65em;text-align:center;word-break:break-all;line-height:1.3;margin-top:2px;">
                    <span style="font-weight:bold;">CUFE:</span> ${this.cufeCode}
                  </div>`
               : ''
           }`
        : '';

    // ── Cajero / cliente ──────────────────────────────────────────
    const cajeroHtml = v.cajeroNombre
      ? `<div style="display:flex;gap:3px;padding:1px 0;">
           <span style="white-space:nowrap;">Atendido Por :</span>
           <span style="flex:1;">${v.cajeroNombre}</span>
         </div>`
      : '';
    const clienteHtml = v.clienteNombre
      ? `<div style="display:flex;gap:3px;padding:1px 0;">
           <span style="white-space:nowrap;">Cliente</span>
           <span style="flex:1;">${v.clienteDocumento ? v.clienteDocumento + ' - ' : ''}${v.clienteNombre}</span>
         </div>`
      : '';

    const ventana = window.open('', '_blank', 'width=400,height=700');
    if (!ventana) return;

    ventana.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Tirilla</title>
  <style>
    @page {
      size: ${anchoPage} auto;
      margin: 0 !important;
    }
    * { margin:0; padding:0; box-sizing:border-box; }
    html {
      width: ${anchoPage};
      max-width: ${anchoPage};
    }
    body {
      width: ${anchoPage};
      max-width: ${anchoPage};
      overflow: hidden;
      font-family: 'Courier New', Courier, monospace;
      font-size: ${fontSize};
      line-height: 1.4;
      color: #000;
      background: #fff;
      padding: 2mm 2.5mm;
      font-weight: 600;
    }
    img { -webkit-print-color-adjust:exact; print-color-adjust:exact; max-width:100%; display: block; margin: 0 auto; }
    .dash  { border:none; border-top:1.5px dashed #333; margin:6px 0; }
    .solid { border:none; border-top:1px solid #000; margin:3px 0; }
    
    .header-text { text-align:center; margin-bottom:10px; }
    .company-name { font-size:1.25em; text-transform:uppercase; font-weight: 800; margin-bottom: 2px; }
    .company-info { font-size:0.95em; font-weight: 600; line-height: 1.2; }
    
    .doc-info { display:flex; justify-content:space-between; font-size:1em; font-weight: 700; margin: 8px 0; }
    
    .table-header { display:table; width:100%; table-layout:fixed; font-size:0.9em; font-weight: 700; border-bottom: 1.5px solid #000; padding-bottom: 2px; margin-bottom: 4px; }
    .product-row { margin: 4px 0; font-size: 0.95em; }
    .product-grid { display:table; width:100%; table-layout:fixed; }
    .cell { display:table-cell; overflow:hidden; vertical-align: top; }
    
    .totals-area { margin: 10px 0; border-top: 1px solid #000; padding-top: 5px; }
    .total-row { display:flex; justify-content:space-between; padding:2px 0; }
    .grand-total { 
      display:flex; justify-content:space-between; 
      font-size:1.35em; font-weight: 800; 
      border-top:2px solid #000; border-bottom:2px solid #000; 
      padding:6px 0; margin:8px 0; 
    }
    
    .footer { text-align:center; margin-top:15px; font-size: 0.9em; }
    .thanks { font-weight: 800; font-size: 1.1em; margin-bottom: 5px; }
    
    /* Utility for table columns */
    .col-cant { width:${colCant}; text-align:center; }
    .col-val { width:${colVal}; text-align:right; }
    .col-tot { width:${colTot}; text-align:right; }
  </style>
</head>
<body>

  ${logoHtml}

  <div class="header-text">
    <div class="company-name">${v.razonSocial ?? ''}</div>
    <div class="company-info">
      ${v.empresaNit ? `<div>Nit ${v.empresaNit}</div>` : ''}
      ${v.empresaDireccion ? `<div>${v.empresaDireccion}</div>` : ''}
      ${v.empresaEmail ? `<div>${v.empresaEmail}</div>` : ''}
      ${v.empresaTelefono ? `<div>Cel. ${v.empresaTelefono}</div>` : ''}
      ${v.municipio ? `<div>${v.municipio}</div>` : ''}
    </div>
  </div>

  <div class="dash"></div>

  <div class="doc-info">
    <span style="text-transform:uppercase;">${v.tipoDocumento ?? 'D.E POS'}</span>
    <span>${numeroVenta}</span>
  </div>
  <div style="text-align:center; font-size: 0.9em; margin-bottom: 8px;">
    ${this.formatFecha(v.fechaEmision)}
  </div>

  <hr class="solid"/>

  <div style="font-size: 0.95em; line-height: 1.4; margin: 5px 0;">
    ${cajeroHtml}
    ${clienteHtml}
    <div style="display:flex;gap:5px;">
      <span style="white-space:nowrap;">FORMA PAGO:</span>
      <span style="font-weight: 800;">${this.metodoPagoLabel(v.pagos[0]?.metodoPago || '')}</span>
    </div>
  </div>

  <div class="dash"></div>

  <div class="table-header">
    <span class="cell">ARTÍCULO</span>
    <span class="cell col-cant">CANT</span>
    <span class="cell col-val">VALOR</span>
    <span class="cell col-tot">TOTAL</span>
  </div>

  <div style="margin-bottom: 8px;">
    ${filasProductos}
  </div>

  <div class="totals-area">
    <div class="total-row">
      <span>SUBTOTAL</span><span>${this.formatCOP(v.subtotal - v.descuentoTotal)}</span>
    </div>
    ${impuestoHtml}
    ${descuentoHtml}
  </div>

  <div class="grand-total">
    <span>TOTAL</span><span>${this.formatCOP(v.totalPagar)}</span>
  </div>

  <div class="payments-area" style="font-size: 0.95em;">
    ${filasPagos}
  </div>

  <div class="dash"></div>

  <div style="font-size:0.75em; text-align:center; margin:10px 0; line-height:1.4; font-style: italic;">
    Esta factura se asimila a los efectos legales de las facturas de cambio ART. 744 del Código del Comercio.
  </div>

  ${feHtml}

  <div class="footer">
    <div class="thanks">*** GRACIAS POR SU COMPRA ***</div>
    <div style="font-size: 0.85em;">Conserve su comprobante para cualquier trámite.</div>
    <div style="font-size: 0.75em; margin-top: 5px; color: #444;">Powered by Aura POS</div>
  </div>

</body>
<script>
  window.onload = function() {
    window.print();
    window.onafterprint = function() { window.close(); };
  };
</script>
</html>`);
    ventana.document.close();
  }

  close(): void {
    this.modalClosed.emit();
  }

  formatCOP(v: number | null | undefined): string {
    if (v === null || v === undefined) return '$0';
    return (
      '$' +
      new Intl.NumberFormat('es-CO', {
        style: 'decimal',
        maximumFractionDigits: 0,
      }).format(v)
    );
  }

  formatFecha(iso: string): string {
    return new Date(iso).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  metodoPagoLabel(m: string): string {
    const map: Record<string, string> = {
      EFECTIVO: 'Efectivo',
      NEQUI: 'Nequi',
      TARJETA: 'Tarjeta CF',
    };
    return map[m] ?? m;
  }
}
