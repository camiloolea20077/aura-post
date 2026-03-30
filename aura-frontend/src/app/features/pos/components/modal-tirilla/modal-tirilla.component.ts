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

  get pagosResumen(): string {
    if (!this.venta?.pagos?.length) return '';
    return this.venta.pagos
      .map((p) => this.metodoPagoLabel(p.metodoPago))
      .join(' + ');
  }

  // Calcula % IVA estimado de la línea
  getPctIva(d: VentaDetalleResponse): number {
    if (!d.subtotalLinea || d.subtotalLinea === 0) return 0;
    return Math.round((d.impuestoValor / d.subtotalLinea) * 100);
  }

  // Cambio total = suma de lo tendido - total (montoRecibido guarda lo que el cliente entregó)
  get cambioTotal(): number {
    if (!this.venta?.pagos?.length) return 0;
    const totalTendido = this.venta.pagos.reduce(
      (s, p) => s + (p.montoRecibido ?? p.monto), 0
    );
    return Math.max(0, totalTendido - this.venta.totalPagar);
  }

  // Mantener para compatibilidad con template existente
  getCambio(p: VentaPagoResponse): number {
    return 0; // reemplazado por cambioTotal
  }

  imprimir(): void {
    if (!this.venta) return;

    const v = this.venta;
    const anchoPage = this.ancho === 58 ? '58mm' : '80mm';
    const fontSize = this.ancho === 58 ? '11px' : '13px';
    const numeroVenta = String(v.consecutivo).padStart(6, '0');

    // ── Construir filas de productos — formato 2 líneas ───────────
    const filasProductos = v.detalles
      .map((d) => {
        const cantStr = this.formatCantidad(d);
        const unidad = this.abreviarUnidad(d.unidadMedidaNombre);
        const vunit = this.formatCOP(
          d.precioUnitario + d.impuestoValor / d.cantidad,
        );
        const total = this.formatCOP(d.subtotalLinea);
        const descRow =
          d.montoDescuento > 0
            ? `<div style="display:flex;justify-content:space-between;font-size:0.8em;padding-left:6px;">
                <span>DESCUENTO:</span><span>-${this.formatCOP(d.montoDescuento)}</span>
               </div>`
            : '';
        return `
        <div style="margin:3px 0;">
          <div style="word-break:break-word;white-space:normal;">${d.productoNombre}</div>
          <div style="display:flex;justify-content:space-between;padding-left:6px;">
            <span>${cantStr} ${unidad} x ${vunit}</span>
            <span style="white-space:nowrap;">${total}</span>
          </div>
          ${descRow}
        </div>`;
      })
      .join('');

    // ── Construir filas de pagos ──────────────────────────────────
    const totalTendido = v.pagos.reduce((s, p) => s + (p.montoRecibido ?? p.monto), 0);
    const cambioTotal = Math.max(0, totalTendido - v.totalPagar);

    const filasPagos = v.pagos
      .map(
        (p) => `
        <div style="display:flex;gap:4px;font-size:0.92em;padding:1px 0;">
          <span style="flex:1;">${this.metodoPagoLabel(p.metodoPago)}</span>
          <span style="text-align:right;">${this.formatCOP(p.montoRecibido ?? p.monto)}</span>
        </div>`,
      )
      .join('');

    const cambioHtml =
      cambioTotal > 0
        ? `<div style="display:flex;gap:4px;font-size:0.92em;padding:2px 0;font-weight:bold;">
           <span style="flex:1;">Cambio entregado</span>
           <span style="text-align:right;">${this.formatCOP(cambioTotal)}</span>
         </div>`
        : '';

    // ── Logo ──────────────────────────────────────────────────────
    const logoHtml = v.logoUrl
      ? `<div style="text-align:center;margin-bottom:5px;">
           <img src="${v.logoUrl}" style="max-width:55%;max-height:16mm;object-fit:contain;" onerror="this.style.display='none'" />
         </div>`
      : '';

    // ── Totales opcionales ────────────────────────────────────────
    const descuentoHtml =
      v.descuentoTotal > 0
        ? `<div style="display:flex;justify-content:space-between;padding:1px 0;">
           <span>Descuento</span><span>-${this.formatCOP(v.descuentoTotal)}</span>
         </div>`
        : '';
    const impuestoHtml =
      v.impuestosTotal > 0
        ? `<div style="display:flex;justify-content:space-between;padding:1px 0;">
           <span>IVA</span><span>${this.formatCOP(v.impuestosTotal)}</span>
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
    const resolucionHtml = v.resolucionNumero
      ? `<div style="font-size:0.7em;color:#444;line-height:1.5;text-align:center;margin-bottom:3px;">
           <div>Resolución DIAN No. ${v.resolucionNumero}${v.resolucionPrefijo ? ` - Prefijo ${v.resolucionPrefijo}` : ''}</div>
           ${v.resolucionDesde && v.resolucionHasta ? `<div>Rango ${v.resolucionDesde} al ${v.resolucionHasta}</div>` : ''}
           ${v.resolucionFechaDesde && v.resolucionFechaHasta ? `<div>Vigencia: ${v.resolucionFechaDesde} al ${v.resolucionFechaHasta}</div>` : ''}
         </div>`
      : '';

    const feHtml =
      this.qrData || this.cufeCode
        ? `<hr class="dash"/>
           <div style="text-align:center;font-size:0.8em;font-weight:bold;letter-spacing:1px;margin-bottom:3px;">FACTURA ELECTRÓNICA</div>
           ${resolucionHtml}
           ${qrImageData ? `<div style="text-align:center;margin:4px 0;"><img src="${qrImageData}" style="width:110px;height:110px;" /></div>` : ''}
           ${
             this.cufeCode
               ? `<div style="font-size:0.65em;text-align:center;word-break:break-all;line-height:1.3;margin-top:2px;">
                    <span style="font-weight:bold;">CUFE:</span> ${this.cufeCode}
                  </div>`
               : ''
           }`
        : '';

    // ── Cajero / sucursal / cliente ───────────────────────────────
    const cajeroHtml = v.cajeroNombre
      ? `<div style="display:flex;gap:3px;padding:1px 0;">
           <span style="white-space:nowrap;">Cajero :</span>
           <span style="flex:1;">${v.cajeroNombre}</span>
         </div>`
      : '';
    const sucursalHtml = v.sucursalNombre
      ? `<div style="display:flex;gap:3px;padding:1px 0;">
           <span style="white-space:nowrap;">Sucursal :</span>
           <span style="flex:1;">${v.sucursalNombre}</span>
         </div>`
      : '';
    const clienteNombre = v.clienteNombre ?? 'CONSUMIDOR FINAL';
    const clienteDocumento = v.clienteDocumento ?? '222.222.222-2';
    const clienteHtml = `
      <div style="display:flex;gap:3px;padding:1px 0;">
        <span style="white-space:nowrap;">Cliente :</span>
        <span style="flex:1;">${clienteNombre}</span>
      </div>
      <div style="display:flex;gap:3px;padding:1px 0;">
        <span style="white-space:nowrap;">CC/NIT :</span>
        <span style="flex:1;">${clienteDocumento}</span>
      </div>`;

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
    ${sucursalHtml}
    ${clienteHtml}
    <div style="display:flex;gap:5px;">
      <span style="white-space:nowrap;">FORMA PAGO:</span>
      <span style="font-weight: 800;">${v.pagos.map((p) => this.metodoPagoLabel(p.metodoPago)).join(' + ')}</span>
    </div>
  </div>

  <div class="dash"></div>

  <div style="display:flex;justify-content:space-between;font-weight:700;border-bottom:1.5px solid #000;padding-bottom:2px;margin-bottom:4px;">
    <span>PRODUCTO</span>
    <span>TOTAL</span>
  </div>

  <div style="margin-bottom: 8px;">
    ${filasProductos}
  </div>

  <div class="totals-area">
    <div class="total-row">
      <span>SUBTOTAL</span><span>${this.formatCOP(v.subtotal)}</span>
    </div>
    ${descuentoHtml}
    ${impuestoHtml}
  </div>

  <div class="grand-total">
    <span>TOTAL</span><span>${this.formatCOP(v.totalPagar)}</span>
  </div>

  <div class="payments-area" style="font-size: 0.95em;">
    ${filasPagos}
    ${cambioHtml}
  </div>

  <div class="dash"></div>

  <div style="font-size:0.75em; text-align:center; margin:10px 0; line-height:1.4; font-style: italic;">
    ${
      this.qrData || this.cufeCode
        ? 'Factura electrónica válida ante la DIAN. Esta factura se asimila a los efectos legales de las facturas de cambio ART. 744 C.Co.'
        : 'Este documento equivalente POS no es una factura de venta. Para factura electrónica, solicítela al cajero.'
    }
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

  formatCantidad(d: VentaDetalleResponse): string {
    const esPeso = [
      'KILOGRAMO',
      'KILOGRAMOS',
      'GRAMO',
      'GRAMOS',
      'LIBRA',
      'LIBRAS',
      'TONELADA',
      'TONELADAS',
    ].includes((d.unidadMedidaNombre ?? '').toUpperCase());

    if (d.cantidad % 1 === 0) return String(Math.round(d.cantidad));
    if (esPeso) return d.cantidad.toFixed(3);
    // Para otras unidades: mostrar decimales naturales sin ceros extra
    return parseFloat(d.cantidad.toString()).toString();
  }

  abreviarUnidad(u: string | null | undefined): string {
    if (!u) return 'und';
    const map: Record<string, string> = {
      KILOGRAMO: 'kg',
      KILOGRAMOS: 'kg',
      GRAMO: 'g',
      GRAMOS: 'g',
      LIBRA: 'lb',
      LIBRAS: 'lb',
      TONELADA: 'ton',
      TONELADAS: 'ton',
      LITRO: 'lt',
      LITROS: 'lt',
      MILILITRO: 'ml',
      MILILITROS: 'ml',
      METRO: 'm',
      METROS: 'm',
      CENTIMETRO: 'cm',
      CENTIMETROS: 'cm',
      UNIDAD: 'und',
      UNIDADES: 'und',
      CAJA: 'caj',
      CAJAS: 'caj',
      DOCENA: 'doc',
      DOCENAS: 'doc',
      PAR: 'par',
      PARES: 'par',
      PAQUETE: 'paq',
      PAQUETES: 'paq',
      BULTO: 'bto',
      BULTOS: 'bto',
      ROLLO: 'rll',
      ROLLOS: 'rll',
      BOTELLA: 'bot',
      BOTELLAS: 'bot',
      BOLSA: 'bol',
      BOLSAS: 'bol',
    };
    return map[u.toUpperCase()] ?? u.toLowerCase();
  }

  metodoPagoLabel(m: string): string {
    const map: Record<string, string> = {
      EFECTIVO: 'Efectivo',
      TARJETA: 'Tarjeta',
      TRANSFERENCIA: 'Transferencia',
      NEQUI: 'Nequi',
      DAVIPLATA: 'Daviplata',
      CREDITO: 'Crédito',
    };
    return map[m] ?? m;
  }
}
