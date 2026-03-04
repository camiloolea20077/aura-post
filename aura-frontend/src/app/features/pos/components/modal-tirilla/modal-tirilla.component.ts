import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
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
  ],
  templateUrl: './modal-tirilla.component.html',
  styleUrls: ['./modal-tirilla.component.scss'],
})
export class ModalTirillaComponent implements OnChanges {
  @Input() displayModal = false;
  @Input() venta: VentaModel | null = null;
  @Output() modalClosed = new EventEmitter<void>();
  logoSafeUrl: SafeUrl | null = null;
  ancho: AnchoTirilla = 80;

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
        const total = d.subtotalLinea + d.impuestoValor - d.montoDescuento;
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
    * { margin:0; padding:0; box-sizing:border-box; font-weight:bold; }
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
      line-height: 1.5;
      color: #000;
      background: #fff;
      -webkit-font-smoothing: none;
      font-smooth: never;
      padding: 1mm 1.5mm;
    }
    img { -webkit-print-color-adjust:exact; print-color-adjust:exact; max-width:100%; }
    hr.dash  { border:none; border-top:2px dashed #000; margin:4px 0; }
    hr.solid { border:none; border-top:1px solid #000; margin:2px 0; }
    /* Todo el contenido se adapta al ancho */
    div, span { max-width: 100%; }
    .fila { display:table; width:100%; table-layout:fixed; }
    .fila span { display:table-cell; overflow:hidden; }
  </style>
</head>
<body>

  ${logoHtml}

  <div style="text-align:center;margin-bottom:3px;">
    <div style="font-size:1.15em;text-transform:uppercase;">${v.razonSocial ?? ''}</div>
    ${v.empresaNit ? `<div style="font-size:0.92em;">Nit ${v.empresaNit}</div>` : ''}
    ${v.empresaDireccion ? `<div style="font-size:0.92em;">${v.empresaDireccion}</div>` : ''}
    ${v.empresaEmail ? `<div style="font-size:0.92em;">${v.empresaEmail}</div>` : ''}
    ${v.empresaTelefono ? `<div style="font-size:0.92em;">Cel. ${v.empresaTelefono}</div>` : ''}
    ${v.municipio ? `<div style="font-size:0.92em;">${v.municipio}</div>` : ''}
  </div>

  <hr class="dash"/>

  <div style="display:flex;justify-content:space-between;font-size:0.92em;padding:2px 0;">
    <span style="text-transform:uppercase;">${v.tipoDocumento ?? 'D.E POS'}</span>
    <span>${numeroVenta}</span>
    <span style="font-size:0.88em;">${this.formatFecha(v.fechaEmision)}</span>
  </div>

  <hr class="solid"/>

  ${cajeroHtml}
  ${clienteHtml}
  <div style="display:flex;gap:3px;padding:1px 0;">
    <span style="white-space:nowrap;">Pago :</span>
    <span>${this.metodoPagoLabel(v.pagos[0]?.metodoPago || '')}</span>
  </div>

  <hr class="dash"/>

  <div style="display:table;width:100%;table-layout:fixed;font-size:0.88em;padding:2px 0;">
    <span style="display:table-cell;">Artículo</span>
    <span style="display:table-cell;width:${colCant};text-align:center;">Cant</span>
    <span style="display:table-cell;width:${colVal};text-align:right;">Valor</span>
    <span style="display:table-cell;width:${colTot};text-align:right;">Total</span>
  </div>
  <hr class="solid"/>

  ${filasProductos}

  <hr class="solid"/>

  <div style="margin:2px 0;">
    <div style="display:flex;justify-content:space-between;padding:1px 0;">
      <span>Sub Total</span><span>${this.formatCOP(v.subtotal - v.descuentoTotal)}</span>
    </div>
    ${impuestoHtml}
    ${descuentoHtml}
  </div>

  <div style="display:flex;justify-content:space-between;font-size:1.2em;border-top:2px solid #000;border-bottom:2px solid #000;padding:3px 0;margin:3px 0;">
    <span>Total Pedido</span><span>${this.formatCOP(v.totalPagar)}</span>
  </div>

  <hr class="solid"/>

  ${filasPagos}

  <hr class="dash"/>

  <div style="font-size:0.78em;text-align:justify;margin:4px 0;line-height:1.35;">
    Esta factura se asimila a los efectos legales de las facturas de cambio ART. 744 del Código del Comercio.
  </div>

  <hr class="solid"/>

  <div style="text-align:center;margin-top:6px;">
    <div>*** GRACIAS POR SU COMPRA ***</div>
    <div style="font-size:0.82em;margin-top:2px;">Conserve su comprobante</div>
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
    if (v === null || v === undefined) return '$ 0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v);
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
