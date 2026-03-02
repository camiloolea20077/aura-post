import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { VentaService } from '../../../../core/services/venta.service';

@Component({
  selector: 'app-factura-viewer-modal',
  standalone: true,
  imports: [CommonModule, ButtonModule, DialogModule, ProgressSpinnerModule],
  templateUrl: './factura-viewer-modal.component.html',
  styleUrls: ['./factura-viewer-modal.component.scss'],
})
export class FacturaViewerModalComponent implements OnChanges, OnDestroy {
  @Input() visible = false;
  @Input() ventaId: number | null = null;
  @Input() factusUrl: string | null = null;
  @Input() cufe: string | null = null;
  @Input() numero: string | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();

  loading = false;
  error = false;
  pdfSrc: SafeResourceUrl | null = null;
  objectUrl: string | null = null;

  constructor(
    private ventaService: VentaService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']) {
      if (this.visible && this.ventaId) {
        this.cargarPdf();
      } else if (!this.visible) {
        this.limpiar();
      }
    }
  }

  private cargarPdf(): void {
    this.loading = true;
    this.error = false;
    this.pdfSrc = null;

    this.ventaService.descargarFacturaPdf(this.ventaId!).subscribe({
      next: (blob) => {
        this.objectUrl = URL.createObjectURL(blob);
        this.pdfSrc = this.sanitizer.bypassSecurityTrustResourceUrl(
          this.objectUrl,
        );
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      },
    });
  }
  descargar(): void {
    if (!this.objectUrl) return;
    const a = document.createElement('a');
    a.href = this.objectUrl;
    a.download = `factura-${this.numero ?? this.ventaId}.pdf`;
    a.click();
  }

  abrirEnFactus(): void {
    if (this.factusUrl) window.open(this.factusUrl, '_blank');
  }

  copiarCufe(): void {
    if (this.cufe) navigator.clipboard.writeText(this.cufe);
  }

  cerrar(): void {
    this.limpiar();
    this.visible = false;
    this.visibleChange.emit(false);
  }

  private limpiar(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    this.pdfSrc = null;
    this.loading = false;
    this.error = false;
  }

  ngOnDestroy(): void {
    this.limpiar();
  }
}
