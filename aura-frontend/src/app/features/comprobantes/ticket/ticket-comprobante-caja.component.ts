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
import { ComprobanteCajaModel } from '../../../core/models/comprobante-caja.model';

type AnchoTirilla = 58 | 80;

@Component({
  selector: 'app-ticket-comprobante-caja',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonModule, DialogModule, SelectButtonModule],
  templateUrl: './ticket-comprobante-caja.component.html',
  styleUrls: ['./ticket-comprobante-caja.component.scss'],
})
export class TicketComprobanteCajaComponent implements OnChanges {
  @Input() comprobante: ComprobanteCajaModel | null = null;
  @Input() visible = false;
  @Output() closed = new EventEmitter<void>();

  ancho: AnchoTirilla = 80;
  anchoOptions = [
    { label: '58 mm', value: 58 },
    { label: '80 mm', value: 80 },
  ];

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['comprobante'] && this.comprobante) {
      this.ancho = 80;
      this.cdr.markForCheck();
    }
  }

  close(): void {
    this.closed.emit();
  }

  get tituloComprobante(): string {
    if (!this.comprobante) return '';
    return this.comprobante.tipo === 'INGRESO'
      ? 'COMPROBANTE DE INGRESO'
      : 'COMPROBANTE DE EGRESO';
  }

  get totalLabel(): string {
    if (!this.comprobante) return '';
    return this.comprobante.tipo === 'INGRESO' ? 'TOTAL INGRESO' : 'TOTAL EGRESO';
  }

  get fechaFormateada(): string {
    if (!this.comprobante?.createdAt) return '';
    return new Date(this.comprobante.createdAt).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  get origenLabel(): string {
    const map: Record<string, string> = {
      MANUAL: 'Manual',
      DEVOLUCION: 'Devolución',
      ABONO_CXC: 'Abono CxC',
      ABONO_CXP: 'Abono CxP',
    };
    return this.comprobante?.origen ? (map[this.comprobante.origen] ?? this.comprobante.origen) : '';
  }

  get entregadoALabel(): string {
    if (!this.comprobante) return '';
    return this.comprobante.tipo === 'INGRESO' ? 'Recibido de' : 'Entregado a';
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
    if (!this.comprobante) return;
    const c = this.comprobante;
    const anchoPage = this.ancho === 58 ? '58mm' : '80mm';
    const fontSize = this.ancho === 58 ? '11px' : '13px';

    const titulo = c.tipo === 'INGRESO' ? 'COMPROBANTE DE INGRESO' : 'COMPROBANTE DE EGRESO';
    const totalLabel = c.tipo === 'INGRESO' ? 'TOTAL INGRESO' : 'TOTAL EGRESO';

    const metodoPagoHtml = c.metodoPago
      ? `<div style="display:flex;gap:4px;padding:1px 0;">
           <span style="white-space:nowrap;">Método pago :</span>
           <span style="font-weight:800;">${c.metodoPago}</span>
         </div>`
      : '';

    const origenMap: Record<string, string> = {
      MANUAL: 'Manual',
      DEVOLUCION: 'Devolución',
      ABONO_CXC: 'Abono CxC',
      ABONO_CXP: 'Abono CxP',
    };

    const origenLabel = origenMap[c.origen] ?? c.origen;

    const entregadoLabel = c.tipo === 'INGRESO' ? 'Recibido de' : 'Entregado a';
    const entregadoHtml = c.entregadoA
      ? `<div style="display:flex;gap:4px;padding:1px 0;">
           <span style="white-space:nowrap;">${entregadoLabel} :</span>
           <span style="flex:1;">${c.entregadoA}</span>
         </div>`
      : '';

    const ventana = window.open('', '_blank', 'width=400,height=600');
    if (!ventana) return;

    ventana.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${titulo}</title>
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
    .doc-info { display:flex; justify-content:space-between; font-size:0.95em; font-weight:700; margin:6px 0; }
    .grand-total {
      display:flex; justify-content:space-between;
      font-size:1.3em; font-weight:800;
      border-top:2px solid #000; border-bottom:2px solid #000;
      padding:6px 0; margin:8px 0;
    }
    .info-block { font-size:0.92em; line-height:1.5; margin:4px 0; }
    .concepto-block { font-size:0.9em; line-height:1.4; margin:4px 0; }
    .footer { text-align:center; margin-top:12px; font-size:0.85em; }
    .firma-area { display:flex; justify-content:space-around; margin-top:18mm; }
    .firma { text-align:center; font-size:0.8em; }
    .firma-linea { border-top:1px solid #000; width:30mm; margin:0 auto 3px; }
  </style>
</head>
<body>

  <div class="header-text">
    <div class="title">${titulo}</div>
  </div>

  <hr class="solid"/>

  <div class="doc-info">
    <span>N° ${c.numeroComprobante}</span>
  </div>
  <div style="font-size:0.85em;color:#444;margin-bottom:4px;">${new Date(c.createdAt).toLocaleString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>

  <hr class="solid"/>

  <div class="info-block">
    ${metodoPagoHtml}
    ${entregadoHtml}
    <div style="display:flex;gap:4px;padding:1px 0;">
      <span style="white-space:nowrap;">Origen :</span>
      <span>${origenLabel}</span>
    </div>
  </div>

  <hr class="dash"/>

  <div class="concepto-block">
    <div style="font-weight:700;margin-bottom:2px;">Concepto:</div>
    <div>${c.concepto}</div>
  </div>

  <div class="grand-total">
    <span>${totalLabel}</span>
    <span>${this.formatCOP(c.monto)}</span>
  </div>

  <div class="firma-area">
    <div class="firma">
      <div class="firma-linea"></div>
      <div>Elaborado por</div>
    </div>
    <div class="firma">
      <div class="firma-linea"></div>
      <div>Recibido por</div>
    </div>
  </div>

  <div class="footer">
    <div style="margin-top:10px;font-size:0.75em;color:#444;">Powered by Aura POS</div>
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
