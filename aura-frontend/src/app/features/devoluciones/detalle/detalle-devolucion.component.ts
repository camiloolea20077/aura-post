import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService, ConfirmationService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { DevolucionModel } from '../../../core/models/devolucion.model';
import { DevolucionService } from '../../../core/services/devolucion.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { IndexDBService } from '../../../core/services/index-db.service';

type TagSeverity =
  | 'success'
  | 'secondary'
  | 'info'
  | 'warn'
  | 'danger'
  | 'contrast'
  | undefined;

@Component({
  selector: 'app-detalle-devolucion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    TagModule,
    DividerModule,
    ToastModule,
    ConfirmDialogModule,
    SkeletonModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './detalle-devolucion.component.html',
  styleUrls: ['./detalle-devolucion.component.scss'],
})
export class DetalleDevolucionComponent implements OnChanges {
  @Input() devolucionId: number | null = null;
  @Input() visible = false;
  @Output() closed = new EventEmitter<void>();
  @Output() anulada = new EventEmitter<void>();

  public devolucion: DevolucionModel | null = null;
  public isLoading = false;
  public isAnulando = false;
  public puedeAnular = false;

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly devolucionService: DevolucionService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
    private readonly indexDBService: IndexDBService,
  ) {
    this.indexDBService.loadDataAuthDB().then((auth) => {
      this.puedeAnular = auth?.rol === 'ADMIN' || auth?.rol === 'SUPER_ADMIN';
      this.cdr.markForCheck();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.devolucionId) {
      this.loadDevolucion(this.devolucionId);
    }
    if (changes['visible'] && !this.visible) {
      this.devolucion = null;
    }
  }

  private async loadDevolucion(id: number): Promise<void> {
    this.isLoading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.devolucionService.getById(id));
      this.devolucion = res?.data ?? null;
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar la devolución.');
      this.closePanel();
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  confirmarAnular(): void {
    this.confirmationService.confirm({
      message: `¿Anular la devolución <strong>DEV-${this.devolucion?.consecutivo}</strong>?<br>
        <small>Esta acción no se puede deshacer.</small>`,
      header: 'Confirmar anulación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, anular',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.anularDevolucion(),
    });
  }

  private async anularDevolucion(): Promise<void> {
    if (!this.devolucion?.id) return;
    this.isAnulando = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(this.devolucionService.anular(this.devolucion.id));
      this.alertService.showSuccess('Devolución anulada', '');
      this.anulada.emit();
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.error?.message ?? 'No se pudo anular la devolución.',
      );
    } finally {
      this.isAnulando = false;
      this.cdr.markForCheck();
    }
  }

  closePanel(): void {
    this.closed.emit();
  }

  getEstadoSeverity(estado: string): TagSeverity {
    return estado === 'COMPLETADA' ? 'success' : 'danger';
  }

  getEstadoLabel(estado: string): string {
    return estado === 'COMPLETADA' ? 'Completada' : 'Anulada';
  }

  getTipoSeverity(tipo: string): TagSeverity {
    return tipo === 'TOTAL' ? 'info' : 'warn';
  }

  getTipoLabel(tipo: string): string {
    return tipo === 'TOTAL' ? 'Total' : 'Parcial';
  }

  getMetodoLabel(metodo: string): string {
    const map: Record<string, string> = {
      EFECTIVO: 'Efectivo',
      TRANSFERENCIA: 'Transferencia',
      NOTA_CREDITO: 'Nota crédito',
      SIN_DEVOLUCION: 'Sin devolución de dinero',
    };
    return map[metodo] ?? metodo;
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
