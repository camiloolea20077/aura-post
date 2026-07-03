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
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CompraModel } from '../../../core/models/compra.model';

type AnchoTirilla = 58 | 80;

@Component({
  selector: 'app-comprobante-egreso',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    SelectButtonModule,
  ],
  templateUrl: './comprobante-egreso.component.html',
  styleUrls: ['./comprobante-egreso.component.scss'],
})
export class ComprobanteEgresoComponent implements OnChanges {
  @Input() compra: CompraModel | null = null;
  @Input() visible = false;
  @Output() closed = new EventEmitter<void>();

  ancho: AnchoTirilla = 80;
  anchoOptions = [
    { label: '58 mm', value: 58 },
    { label: '80 mm', value: 80 },
  ];

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['compra'] && this.compra) {
      this.ancho = 80;
      this.cdr.markForCheck();
    }
  }

  close(): void {
    this.closed.emit();
  }

  get numeroDisplay(): string {
    if (!this.compra) return '';
    return (
      this.compra.numeroCompra ??
      `CE-${String(this.compra.id).padStart(6, '0')}`
    );
  }

  get montoEgreso(): number {
    if (!this.compra) return 0;
    return this.compra.netaAPagar ?? this.compra.total ?? 0;
  }

  get fechaFormateada(): string {
    if (!this.compra?.fecha) return '';
    const dateOnly = this.compra.fecha.substring(0, 10);
    return new Date(dateOnly + 'T00:00:00').toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatCOP(v: number | null | undefined): string {
    if (v == null) return '$0';
    return (
      '$' +
      new Intl.NumberFormat('es-CO', {
        style: 'decimal',
        maximumFractionDigits: 0,
      }).format(v)
    );
  }

  imprimir(): void {
    if (!this.compra) return;
    const c = this.compra;
    const anchoPage = this.ancho === 58 ? '58mm' : '80mm';
    const fontSize = this.ancho === 58 ? '11px' : '13px';

    const numCompra = c.numeroCompra ?? `CE-${String(c.id).padStart(6, '0')}`;

    // Filas de productos
    const filasProductos = c.detalles
      .map((d) => {
        const ivaRow =
          d.impuestoValor > 0
            ? `<div style="display:flex;justify-content:space-between;font-size:0.8em;padding-left:6px;">
                <span>IVA:</span><span>${this.formatCOP(d.impuestoValor)}</span>
               </div>`
            : '';
        return `
        <div style="margin:3px 0;">
          <div style="word-break:break-word;white-space:normal;">${d.productoNombre}</div>
          <div style="display:flex;justify-content:space-between;padding-left:6px;">
            <span>${d.cantidad} und x ${this.formatCOP(d.costoUnitario)}</span>
            <span style="white-space:nowrap;">${this.formatCOP(d.subtotalLinea)}</span>
          </div>
          ${ivaRow}
        </div>`;
      })
      .join('');

    // Retenciones
    const retefuenteHtml =
      (c.retefuenteValor ?? 0) > 0
        ? `<div style="display:flex;justify-content:space-between;padding:1px 0;">
            <span>Retefuente (${c.retefuentePct ?? 0}%)</span>
            <span>-${this.formatCOP(c.retefuenteValor)}</span>
           </div>`
        : '';
    const reteivaHtml =
      (c.reteivaValor ?? 0) > 0
        ? `<div style="display:flex;justify-content:space-between;padding:1px 0;">
            <span>ReteIVA (${c.reteivaPct ?? 0}%)</span>
            <span>-${this.formatCOP(c.reteivaValor)}</span>
           </div>`
        : '';
    const reteicaHtml =
      (c.reteicaValor ?? 0) > 0
        ? `<div style="display:flex;justify-content:space-between;padding:1px 0;">
            <span>ReteICA (${c.reteicaPct ?? 0}%)</span>
            <span>-${this.formatCOP(c.reteicaValor)}</span>
           </div>`
        : '';

    const ivaHtml =
      c.impuestosTotal > 0
        ? `<div style="display:flex;justify-content:space-between;padding:1px 0;">
            <span>IVA</span><span>${this.formatCOP(c.impuestosTotal)}</span>
           </div>`
        : '';

    const descuentoHtml =
      c.descuentoTotal > 0
        ? `<div style="display:flex;justify-content:space-between;padding:1px 0;">
            <span>Descuento</span><span>-${this.formatCOP(c.descuentoTotal)}</span>
           </div>`
        : '';

    const obsHtml = c.observaciones
      ? `<hr class="dash"/>
         <div style="font-size:0.85em;line-height:1.4;">
           <div style="font-weight:700;margin-bottom:2px;">Observaciones:</div>
           <div>${c.observaciones}</div>
         </div>`
      : '';

    const ventana = window.open('', '_blank', 'width=400,height=700');
    if (!ventana) return;

    ventana.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Comprobante de Egreso</title>
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
    .dash  { border:none; border-top:1.5px dashed #333; margin:6px 0; }
    .solid { border:none; border-top:1px solid #000; margin:3px 0; }
    .header-text { text-align:center; margin-bottom:8px; }
    .title { font-size:1.1em; font-weight:800; letter-spacing:1px; text-transform:uppercase; margin:4px 0 2px; }
    .sub { font-size:0.9em; font-weight:600; }
    .doc-info { display:flex; justify-content:space-between; font-size:0.95em; font-weight:700; margin:6px 0; }
    .grand-total {
      display:flex; justify-content:space-between;
      font-size:1.3em; font-weight:800;
      border-top:2px solid #000; border-bottom:2px solid #000;
      padding:6px 0; margin:8px 0;
    }
    .footer { text-align:center; margin-top:12px; font-size:0.85em; }
    .firma-area { display:flex; justify-content:space-around; margin-top:18mm; }
    .firma { text-align:center; font-size:0.8em; }
    .firma-linea { border-top:1px solid #000; width:30mm; margin:0 auto 3px; }
  </style>
</head>
<body>

  <div class="header-text">
    <div class="sub">${c.sucursalNombre}</div>
    <div class="title">Comprobante de Egreso</div>
  </div>

  <hr class="solid"/>

  <div class="doc-info">
    <span>N° ${numCompra}</span>
    <span>${this.fechaFormateada}</span>
  </div>

  <hr class="solid"/>

  <div style="font-size:0.95em;line-height:1.5;margin:4px 0;">
    <div style="display:flex;gap:4px;">
      <span style="white-space:nowrap;">Proveedor :</span>
      <span style="flex:1;">${c.proveedorNombre}</span>
    </div>
    <div style="display:flex;gap:4px;">
      <span style="white-space:nowrap;">Forma pago :</span>
      <span style="font-weight:800;">${c.formaPago === 'CONTADO' ? 'CONTADO' : 'CRÉDITO'}</span>
    </div>
  </div>

  <hr class="dash"/>

  <div style="display:flex;justify-content:space-between;font-weight:700;border-bottom:1.5px solid #000;padding-bottom:2px;margin-bottom:4px;">
    <span>PRODUCTO</span><span>TOTAL</span>
  </div>

  <div style="margin-bottom:8px;">
    ${filasProductos}
  </div>

  <hr class="solid"/>

  <div style="margin:6px 0;">
    <div style="display:flex;justify-content:space-between;padding:1px 0;">
      <span>Subtotal</span><span>${this.formatCOP(c.subtotal)}</span>
    </div>
    ${ivaHtml}
    ${descuentoHtml}
    ${retefuenteHtml}
    ${reteivaHtml}
    ${reteicaHtml}
  </div>

  <div class="grand-total">
    <span>TOTAL EGRESO</span><span>${this.formatCOP(this.montoEgreso)}</span>
  </div>

  ${obsHtml}

  <div class="firma-area">
    <div class="firma">
      <div class="firma-linea"></div>
      <div>Elaborado por</div>
    </div>
    <div class="firma">
      <div class="firma-linea"></div>
      <div>Aprobado por</div>
    </div>
  </div>

  <div class="footer">
    <div style="margin-top:10px;font-size:0.75em;color:#444;">Powered by Aura NUBE</div>
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
}
