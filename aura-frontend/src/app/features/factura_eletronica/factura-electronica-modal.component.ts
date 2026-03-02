import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import { VentaService } from '../../core/services/venta.service';

export type EstadoFE = 'PREGUNTA' | 'GENERANDO' | 'EMITIDA' | 'ERROR';

export interface FacturaElectronicaResult {
  ventaId: number;
  facturaNumero: string;
  cufe: string;
  qr: string;
  pdfUrl: string;
  estadoDian: string;
}

@Component({
  selector: 'app-factura-electronica-modal',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    ProgressSpinnerModule,
    ToastModule,
    TooltipModule,
  ],
  providers: [MessageService],
  templateUrl: './factura-electronica-modal.component.html',
  styleUrls: ['./factura-electronica-modal.component.scss'],
})
export class FacturaElectronicaModalComponent implements OnChanges {
  // ── Inputs ────────────────────────────────────────────────────────
  @Input() visible = false;
  @Input() ventaId: number | null = null;

  // Datos del cliente ya vinculado a la venta (los pasa el componente padre)
  @Input() clienteNombre = '';
  @Input() clienteDocumento = '';
  @Input() clienteEmail = '';

  // ── Outputs ───────────────────────────────────────────────────────
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() facturaEmitida = new EventEmitter<FacturaElectronicaResult>();
  @Output() omitida = new EventEmitter<void>();

  // ── Estado interno ────────────────────────────────────────────────
  public estado: EstadoFE = 'PREGUNTA';
  public isLoading = false;

  // Resultado
  public facturaNumero = '';
  public cufe = '';
  public qr = '';
  public pdfUrl = '';
  public errorMsg = '';

  constructor(
    private readonly ventaService: VentaService,
    private readonly messageService: MessageService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Resetear cuando se abre el modal
    if (changes['visible'] && this.visible) {
      this.reset();
    }
  }

  // ── Acción principal ──────────────────────────────────────────────
  async generarFactura(): Promise<void> {
    if (!this.ventaId) return;

    this.estado = 'GENERANDO';
    this.isLoading = true;

    try {
      const res = await lastValueFrom(
        this.ventaService.generarFacturaElectronica(this.ventaId),
      );

      if (res?.data) {
        this.facturaNumero = res.data.facturaNumero;
        this.cufe = res.data.cufe;
        this.qr = res.data.qr;
        this.pdfUrl = res.data.pdfUrl;
        this.estado = 'EMITIDA';

        this.facturaEmitida.emit(res.data);
      }
    } catch (err: any) {
      this.estado = 'ERROR';
      this.errorMsg =
        err?.error?.message ??
        'Ocurrió un error al conectar con el servicio de facturación.';
    } finally {
      this.isLoading = false;
    }
  }

  // ── Copiar CUFE ───────────────────────────────────────────────────
  copiarCufe(): void {
    navigator.clipboard.writeText(this.cufe).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Copiado',
        detail: 'CUFE copiado al portapapeles',
        life: 2000,
      });
    });
  }

  // ── Cerrar ────────────────────────────────────────────────────────
  onCerrar(): void {
    if (this.isLoading) return;
    if (this.estado === 'PREGUNTA') this.omitida.emit();
    this.visible = false;
    this.visibleChange.emit(false);
  }

  private reset(): void {
    this.estado = 'PREGUNTA';
    this.isLoading = false;
    this.facturaNumero = '';
    this.cufe = '';
    this.qr = '';
    this.pdfUrl = '';
    this.errorMsg = '';
  }
}
