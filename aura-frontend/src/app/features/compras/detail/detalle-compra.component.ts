import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import {
  CompraModel,
  DevolucionCompraModel,
} from '../../../core/models/compra.model';
import { HistorialCostoProductoComponent } from '../../../shared/components/historial-costo-producto/historial-costo-producto.component';
import { CompraService } from '../../../core/services/compra.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { CompraPdfService } from '../../../core/services/compra-pdf.service';

@Component({
  selector: 'app-detalle-compra',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    TagModule,
    DividerModule,
    TooltipModule,
    ToastModule,
    ConfirmDialogModule,
    HistorialCostoProductoComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './detalle-compra.component.html',
  styleUrls: ['./detalle-compra.component.scss'],
})
export class DetalleCompraComponent implements OnChanges {
  @Input() visible = false;
  @Input() compraId: number | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() anulada = new EventEmitter<void>();

  public compra: CompraModel | null = null;
  public isLoading = false;
  public isAnulando = false;
  public generandoPDF = false;
  /** Devoluciones (notas crédito) hechas sobre esta compra. */
  public devoluciones: DevolucionCompraModel[] = [];

  // Historial de costos del producto de una línea (V226)
  public historialCostoVisible = false;
  public historialCostoProductoId: number | null = null;

  /** Abre el historial de costos del producto. */
  verHistorialCosto(productoId: number): void {
    this.historialCostoProductoId = productoId;
    this.historialCostoVisible = true;
  }

  constructor(
    private readonly compraService: CompraService,
    private readonly compraPdf: CompraPdfService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.compraId) {
      this.loadCompra(this.compraId);
    }
    if (changes['visible'] && !this.visible) {
      this.compra = null;
    }
  }

  private async loadCompra(id: number): Promise<void> {
    this.isLoading = true;
    try {
      const res = await lastValueFrom(this.compraService.getById(id));
      this.compra = res?.data ?? null;
      this.devoluciones = [];
      if (this.compra && !this.esNotaCredito) {
        const dev = await lastValueFrom(this.compraService.devolucionesDeCompra(id)).catch(() => null);
        this.devoluciones = dev?.data ?? [];
      }
    } catch {
      this.alertService.showError(
        'Error',
        'No se pudo cargar el detalle de la compra.',
      );
      this.close();
    } finally {
      this.isLoading = false;
    }
  }

  close(): void {
    this.compra = null;
    this.devoluciones = [];
    this.closed.emit();
  }

  get esNotaCredito(): boolean {
    return this.compra?.tipoDocumento === 'NOTA_CREDITO';
  }

  /** Valor devuelto sin contar las devoluciones anuladas. */
  get totalDevuelto(): number {
    return this.devoluciones
      .filter((d) => d.estado !== 'ANULADA')
      .reduce((s, d) => s + (Number(d.total) || 0), 0);
  }

  /** Abre el formulario de devolución con esta compra ya elegida. */
  devolverMercancia(): void {
    if (!this.compra) return;
    const id = this.compra.id;
    this.close();
    this.router.navigate(['/compras/nueva'], { queryParams: { devolucion: id } });
  }

  confirmarAnular(): void {
    if (!this.compra) return;
    this.confirmationService.confirm({
      message: `¿Anular la compra <strong>${this.compra.numeroCompra ?? '#' + this.compra.id}</strong>?<br>
                <small>Se revertirá el stock y lotes de todos los productos.</small>`,
      header: 'Confirmar anulación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, anular',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        await this.anular();
      },
    });
  }

  private async anular(): Promise<void> {
    if (!this.compra) return;
    this.isAnulando = true;
    try {
      await lastValueFrom(this.compraService.anular(this.compra.id));
      this.alertService.showSuccess(
        'Compra anulada',
        'El stock fue revertido correctamente.',
      );
      this.anulada.emit();
      this.close();
    } catch (err: any) {
      this.alertService.showError(
        'Error al anular',
        err?.message ?? 'No se pudo anular la compra.',
      );
    } finally {
      this.isAnulando = false;
    }
  }

  // ── PDF ───────────────────────────────────────────────────────────

  /** Ver el PDF en una pestaña o descargarlo con el número de la compra. */
  async pdf(modo: 'ver' | 'descargar'): Promise<void> {
    if (!this.compra) return;
    this.generandoPDF = true;
    this.cdr.markForCheck();
    try {
      if (modo === 'ver') await this.compraPdf.ver(this.compra);
      else await this.compraPdf.descargar(this.compra);
    } catch {
      this.alertService.showError('Error', 'No se pudo generar el PDF.');
    } finally {
      this.generandoPDF = false;
      this.cdr.markForCheck();
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────

  formatFecha(f: string | null): string {
    if (!f) return '—';
    return new Date(f).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

