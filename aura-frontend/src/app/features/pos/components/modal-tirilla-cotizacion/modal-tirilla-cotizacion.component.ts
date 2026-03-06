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
import { CotizacionModel } from '../../../../core/models/cotizacion.model';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

type AnchoTirilla = 58 | 80;

@Component({
  selector: 'app-modal-tirilla-cotizacion',
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
  templateUrl: './modal-tirilla-cotizacion.component.html',
  styleUrls: ['./modal-tirilla-cotizacion.component.scss'],
})
export class ModalTirillaCotizacionComponent implements OnChanges {
  @Input() displayModal = false;
  @Input() cotizacion: CotizacionModel | null = null;
  @Input() empresaNombre = '';
  @Input() empresaNit = '';
  @Input() empresaDireccion = '';
  @Input() empresaTelefono = '';
  @Input() empresaEmail = '';
  @Input() municipio = '';
  @Input() logoUrl = '';
  @Output() modalClosed = new EventEmitter<void>();

  ancho: AnchoTirilla = 80;
  anchoOptions = [
    { label: '58 mm', value: 58 },
    { label: '80 mm', value: 80 },
  ];
  logoSafeUrl: SafeUrl | null = null;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cotizacion'] && this.cotizacion) {
      this.ancho = 58;
    }
    if (changes['logoUrl']) {
      this.logoSafeUrl = this.logoUrl
        ? this.sanitizer.bypassSecurityTrustUrl(this.logoUrl)
        : null;
    }
  }

  imprimir(): void {
    const contenido = document.getElementById('tirilla-cot-content');
    if (!contenido) return;

    const anchoPage = this.ancho === 58 ? '58mm' : '80mm';
    const fontSize = this.ancho === 58 ? '11px' : '13px';
    const html = contenido.innerHTML;

    const ventana = window.open('', '_blank', 'width=400,height=700');
    if (!ventana) return;

    ventana.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Cotización</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-weight: bold; }
            @page { size: ${anchoPage} auto; margin: 0; }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: ${fontSize};
              line-height: 1.45;
              color: #000;
              background: #fff;
              width: ${anchoPage};
              padding: 3mm 2mm;
              -webkit-font-smoothing: none;
              -moz-osx-font-smoothing: grayscale;
              font-smooth: never;
              text-rendering: optimizeSpeed;
            }

            .t-logo-wrap { text-align: center; margin-bottom: 5px; }
            .t-logo      { max-width: 55%; max-height: 16mm; object-fit: contain; }

            .t-header  { text-align: center; margin-bottom: 3px; }
            .t-empresa { font-size: 1.1em; font-weight: bold; text-transform: uppercase; }
            .t-dato    { font-size: 0.88em; line-height: 1.4; }

            .t-separator      { border-top: 1px dashed #555; margin: 4px 0; }
            .t-separator-thin { border-top: 1px solid #999; margin: 2px 0; }

            .t-doc-row   { display: flex; justify-content: space-between; align-items: baseline; font-weight: bold; font-size: 0.88em; padding: 2px 0; }
            .t-doc-tipo  { text-transform: uppercase; }
            .t-doc-fecha { font-weight: normal; font-size: 0.85em; }

            .t-info-row   { display: flex; gap: 3px; font-size: 0.85em; padding: 1px 0; }
            .t-info-label { font-weight: bold; white-space: nowrap; }
            .t-info-val   { flex: 1; }

            .t-col-header { display: flex; font-weight: bold; font-size: 0.82em; text-transform: capitalize; padding: 2px 0; }
            .t-col-art  { flex: 1; overflow: hidden; }
            .t-col-cant { width: 26px; text-align: center; flex-shrink: 0; }
            .t-col-val  { width: 50px; text-align: right; flex-shrink: 0; }
            .t-col-tot  { width: 50px; text-align: right; flex-shrink: 0; }

            .t-prod-row     { margin: 2px 0; }
            .t-prod-line    { display: flex; align-items: baseline; font-size: 0.9em; }
            .t-prod-desc-row{ display: flex; justify-content: space-between; font-size: 0.78em; color: #444; padding-left: 4px; }

            .t-totales   { margin: 2px 0; }
            .t-tot-row   { display: flex; justify-content: space-between; font-size: 0.88em; padding: 1px 0; }

            .t-total-final {
              display: flex; justify-content: space-between;
              font-size: 1.15em; font-weight: bold;
              border-top: 1.5px solid #000; border-bottom: 1.5px solid #000;
              padding: 3px 0; margin: 3px 0;
            }

            .t-vigencia-box {
              text-align: center; font-size: 0.85em;
              border: 1px solid #000; padding: 3px;
              margin: 4px 0;
            }
            .t-vigencia-label { font-weight: bold; text-transform: uppercase; font-size: 0.8em; }
            .t-vigencia-fecha { font-size: 1em; font-weight: bold; }

            .t-obs { font-size: 0.82em; font-style: italic; margin: 3px 0; line-height: 1.35; }

            .t-footer     { text-align: center; margin-top: 6px; font-size: 0.85em; font-weight: bold; }
            .t-footer-sub { font-size: 0.78em; font-weight: normal; color: #444; margin-top: 2px; }
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
    if (v == null) return '$ 0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v);
  }

  formatFecha(iso: string): string {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
