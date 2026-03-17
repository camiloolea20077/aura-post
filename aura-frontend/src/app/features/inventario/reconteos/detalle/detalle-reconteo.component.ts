import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { InputNumberModule } from 'primeng/inputnumber';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../../shared/pipes/alert.service';
import {
  ReconteoModel,
  ReconteoDetalleModel,
  EstadoReconteo,
} from '../../../../core/models/reconteo.model';
import { ReconteoService } from '../../../../core/services/reconteo.service';

type TagSeverity =
  | 'success'
  | 'secondary'
  | 'info'
  | 'warn'
  | 'danger'
  | 'contrast'
  | undefined;

@Component({
  selector: 'app-detalle-reconteo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    TagModule,
    SkeletonModule,
    TableModule,
    InputNumberModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './detalle-reconteo.component.html',
  styleUrls: ['./detalle-reconteo.component.scss'],
})
export class DetalleReconteoComponent {
  @Input() visible = false;
  @Input() reconteo: ReconteoModel | null = null;
  @Input() loading = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() aprobado = new EventEmitter<void>();
  @Output() anulado = new EventEmitter<void>();

  savingDetalleId: number | null = null;

  constructor(
    private readonly service: ReconteoService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  // ── Computed getters ──────────────────────────────────────

  get totalContadas(): number {
    return (
      this.reconteo?.detalles.filter((d) => d.stockContado !== null).length ?? 0
    );
  }

  get diferenciasPositivas(): number {
    return (
      this.reconteo?.detalles.filter(
        (d) => d.diferencia !== null && d.diferencia > 0,
      ).length ?? 0
    );
  }

  get diferenciasNegativas(): number {
    return (
      this.reconteo?.detalles.filter(
        (d) => d.diferencia !== null && d.diferencia < 0,
      ).length ?? 0
    );
  }

  get canEdit(): boolean {
    return (
      !!this.reconteo &&
      this.reconteo.estado !== 'APROBADO' &&
      this.reconteo.estado !== 'ANULADO'
    );
  }

  get canAprobar(): boolean {
    return (
      !!this.reconteo &&
      (this.reconteo.estado === 'BORRADOR' ||
        this.reconteo.estado === 'EN_CONTEO')
    );
  }

  get canAnular(): boolean {
    return (
      !!this.reconteo &&
      this.reconteo.estado !== 'APROBADO' &&
      this.reconteo.estado !== 'ANULADO'
    );
  }

  // ── Actualizar conteo físico de un detalle ─────────────────

  async saveDetalle(
    detalle: ReconteoDetalleModel,
    value: number | null,
  ): Promise<void> {
    if (!this.reconteo || value === null || value === undefined) return;
    this.savingDetalleId = detalle.id;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.updateDetalle(this.reconteo.id, detalle.id, {
          stockContado: value,
        }),
      );
      // Update local state from response
      const updated: ReconteoModel = res?.data;
      if (updated) {
        // Merge updated detalle into local reconteo
        const updatedDetalle = updated.detalles?.find(
          (d) => d.id === detalle.id,
        );
        if (updatedDetalle) {
          detalle.stockContado = updatedDetalle.stockContado;
          detalle.diferencia = updatedDetalle.diferencia;
        }
        if (this.reconteo) {
          this.reconteo.estado = updated.estado;
        }
      }
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudo guardar el conteo',
      );
    } finally {
      this.savingDetalleId = null;
      this.cdr.markForCheck();
    }
  }

  // ── Aprobar ───────────────────────────────────────────────

  confirmAprobar(): void {
    const pendientes =
      this.reconteo?.detalles.filter((d) => d.stockContado === null).length ??
      0;
    const msg =
      pendientes > 0
        ? `Hay <b>${pendientes}</b> producto(s) sin contar. ¿Aprobar de todas formas? Solo se ajustarán los productos contados.`
        : '¿Aprobar y aplicar los ajustes al inventario? Esta acción no se puede deshacer.';

    this.confirm.confirm({
      message: msg,
      header: 'Confirmar aprobación',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sí, aprobar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      accept: () => this.aprobar(),
    });
  }

  async aprobar(): Promise<void> {
    if (!this.reconteo) return;
    try {
      await lastValueFrom(this.service.aprobar(this.reconteo.id));
      this.alert.showSuccess(
        'Reconteo aprobado',
        'Los ajustes fueron aplicados al inventario',
      );
      this.aprobado.emit();
      this.close();
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudo aprobar',
      );
    }
  }

  // ── Anular ────────────────────────────────────────────────

  confirmAnular(): void {
    this.confirm.confirm({
      message: `¿Anular el reconteo <b>#${this.reconteo?.id}</b>? No se aplicarán cambios al inventario.`,
      header: 'Confirmar anulación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, anular',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.anularReconteo(),
    });
  }

  async anularReconteo(): Promise<void> {
    if (!this.reconteo) return;
    try {
      await lastValueFrom(this.service.anular(this.reconteo.id));
      this.alert.showSuccess('Anulado', 'El reconteo fue anulado');
      this.anulado.emit();
      this.close();
    } catch (err: any) {
      this.alert.showError('Error', err?.error?.message ?? 'No se pudo anular');
    }
  }

  // ── Utils ─────────────────────────────────────────────────

  getSeverity(estado: EstadoReconteo): TagSeverity {
    const map: Record<EstadoReconteo, Exclude<TagSeverity, undefined>> = {
      BORRADOR: 'secondary',
      EN_CONTEO: 'warn',
      APROBADO: 'success',
      ANULADO: 'danger',
    };
    return map[estado] ?? 'secondary';
  }

  getDiferenciaSeverity(diferencia: number | null): string {
    if (diferencia === null || diferencia === 0) return '';
    return diferencia > 0 ? 'text-success' : 'text-danger';
  }

  close(): void {
    this.visibleChange.emit(false);
  }

  trackById(_: number, d: ReconteoDetalleModel): number {
    return d.id;
  }
}
