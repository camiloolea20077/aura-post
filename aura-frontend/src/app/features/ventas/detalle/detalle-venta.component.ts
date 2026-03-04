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
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService, ConfirmationService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import { METODOS_PAGO, VentaModel } from '../../../core/models/venta.model';
import { VentaService } from '../../../core/services/venta.service';
import { AlertService } from '../../../shared/pipes/alert.service';

@Component({
  selector: 'app-detalle-venta',
  standalone: true,
  imports: [
    CommonModule,
    SidebarModule,
    ButtonModule,
    TagModule,
    DividerModule,
    ToastModule,
    ConfirmDialogModule,
    SkeletonModule,
  ],
  templateUrl: './detalle-venta.component.html',
  styleUrls: ['./detalle-venta.component.scss'],
})
export class DetalleVentaComponent implements OnChanges {
  @Input() ventaId: number | null = null;
  @Input() visible = false;
  @Output() closed = new EventEmitter<void>();
  @Output() anulada = new EventEmitter<void>();

  public venta: VentaModel | null = null;
  public isLoading = false;
  public isAnulando = false;
  private ventaIdToAnular: number | null = null;

  constructor(
    private readonly ventaService: VentaService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.ventaId) {
      this.loadVenta(this.ventaId);
    }
    if (changes['visible'] && !this.visible) {
      this.venta = null;
    }
  }

  private async loadVenta(id: number): Promise<void> {
    this.isLoading = true;
    try {
      const res = await lastValueFrom(this.ventaService.getById(id));
      this.venta = res?.data ?? null;
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar la venta.');
      this.closePanel();
    } finally {
      this.isLoading = false;
    }
  }

  confirmarAnular(): void {
    this.ventaIdToAnular = this.venta?.id ?? null;
    this.confirmationService.confirm({
      message: `¿Anular la venta <strong>${this.venta?.numeroVenta ?? '#' + this.venta?.id}</strong>?<br>
        <small>Se revertirá el stock de todos los productos.</small>`,
      header: 'Confirmar anulación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, anular',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.anularVenta(),
    });
  }

  private async anularVenta(): Promise<void> {
    const idToAnular = this.ventaIdToAnular ?? this.venta?.id;
    if (!idToAnular) return;
    this.isAnulando = true;
    try {
      await lastValueFrom(this.ventaService.anular(idToAnular));
      this.alertService.showSuccess('Venta anulada', '');
      this.anulada.emit();
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.message ?? 'No se pudo anular la venta.',
      );
    } finally {
      this.isAnulando = false;
    }
  }

  closePanel(): void {
    this.closed.emit();
  }

  getMetodoInfo(m: string) {
    return (
      METODOS_PAGO.find((x) => x.value === m) ?? {
        label: m,
        icon: 'pi pi-wallet',
        color: '#64748B',
      }
    );
  }

  formatCOP = (v: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v);

  formatFecha(f: string): string {
    return new Date(f).toLocaleString('es-CO', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
