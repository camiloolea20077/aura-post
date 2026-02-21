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
  @Input() venta: VentaResponse | null = null;
  @Output() modalClosed = new EventEmitter<void>();

  ancho: AnchoTirilla = 80;

  anchoOptions = [
    { label: '58 mm', value: 58 },
    { label: '80 mm', value: 80 },
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['venta'] && this.venta) {
      this.ancho = 80;
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
    const contenido = document.getElementById('tirilla-content');
    if (!contenido) return;

    const anchoMm = this.ancho === 58 ? '48mm' : '70mm';
    const fontSize = this.ancho === 58 ? '8pt' : '9pt';
    const html = contenido.innerHTML;

    const ventana = window.open('', '_blank', 'width=400,height=700');
    if (!ventana) return;

    ventana.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Tirilla</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: ${fontSize};
              color: #000;
              background: white;
              width: ${anchoMm};
            }
            .t-logo-wrap { text-align: center; margin-bottom: 6px; }
            .t-logo      { max-width: 60%; max-height: 18mm; object-fit: contain; }

            .t-header    { text-align: center; margin-bottom: 4px; }
            .t-empresa   { font-size: 1.15em; font-weight: bold; text-transform: uppercase; }
            .t-tipo-doc  { font-size: 0.9em; margin-top: 2px; }
            .t-numero    { font-weight: bold; margin-top: 1px; }
            .t-fecha     { font-size: 0.85em; color: #333; margin-top: 2px; }

            .t-separator      { border-top: 1px dashed #666; margin: 5px 0; }
            .t-separator-thin { border-top: 1px solid #999; margin: 3px 0; }

            .t-col-header {
              display: flex; font-weight: bold; font-size: 0.82em;
              text-transform: uppercase; padding: 2px 0;
            }
            .t-col-uds  { width: 22px; flex-shrink: 0; }
            .t-col-desc { flex: 1; padding: 0 3px; }
            .t-col-iva  { width: 30px; text-align: right; flex-shrink: 0; }
            .t-col-imp  { width: 55px; text-align: right; flex-shrink: 0; }

            .t-prod-row     { margin: 3px 0; }
            .t-prod-line    { display: flex; align-items: baseline; }
            .t-prod-desc-row {
              display: flex; justify-content: space-between;
              font-size: 0.82em; color: #555; padding-left: 22px;
            }

            .t-totales     { margin: 3px 0; }
            .t-tot-row     { display: flex; justify-content: space-between; font-size: 0.9em; padding: 1px 0; }
            .t-total-final {
              display: flex; justify-content: space-between;
              font-size: 1.2em; font-weight: bold;
              border-top: 2px solid #000; border-bottom: 2px solid #000;
              padding: 3px 0; margin: 4px 0;
            }

            .t-pagos-header {
              display: flex; justify-content: space-between;
              font-size: 0.8em; font-weight: bold;
              text-transform: uppercase; padding: 1px 0; color: #555;
            }
            .t-pago-row {
              display: flex; font-size: 0.9em; padding: 1px 0;
            }
            .t-pago-metodo { flex: 1; }
            .t-pago-monto  { width: 60px; text-align: right; }
            .t-pago-cambio { width: 55px; text-align: right; }

            .t-cliente { font-size: 0.85em; margin: 3px 0; }

            .t-footer     { text-align: center; margin-top: 8px; font-size: 0.88em; font-weight: bold; }
            .t-footer-sub { font-size: 0.8em; font-weight: normal; color: #555; margin-top: 2px; }

            @page { size: ${anchoMm} auto; margin: 3mm; }
          </style>
        </head>
        <body>${html}</body>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </html>
    `);
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
