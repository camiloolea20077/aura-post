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
import { SidebarModule } from 'primeng/sidebar';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import { CompraModel } from '../../../core/models/compra.model';
import { CompraService } from '../../../core/services/compra.service';
import { AlertService } from '../../../shared/pipes/alert.service';

@Component({
  selector: 'app-detalle-compra',
  standalone: true,
  imports: [
    CommonModule,
    SidebarModule,
    ButtonModule,
    TagModule,
    DividerModule,
    TooltipModule,
    ToastModule,
    ConfirmDialogModule,
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

  constructor(
    private readonly compraService: CompraService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
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
    this.closed.emit();
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
