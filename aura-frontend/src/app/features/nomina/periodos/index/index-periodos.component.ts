import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { NominaService } from '../../../../core/services/nomina.service';
import {
  EstadoPeriodo,
  PeriodoNominaModel,
} from '../../../../core/models/nomina.model';
import { AlertService } from '../../../../shared/pipes/alert.service';

import { aFechaLocal } from '../../../../shared/utils/fecha.util';
type TagSeverity =
  | 'success'
  | 'secondary'
  | 'info'
  | 'warn'
  | 'danger'
  | 'contrast'
  | undefined;

@Component({
  selector: 'app-index-periodos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CalendarModule,
    DialogModule,
    TagModule,
    ToastModule,
    TooltipModule,
    SkeletonModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-periodos.component.html',
  styleUrls: ['./index-periodos.component.scss'],
})
export class IndexPeriodosComponent implements OnInit {
  public periodos: PeriodoNominaModel[] = [];
  public loading = true;
  public showModal = false;
  public saving = false;

  public fechaInicio: Date | null = null;
  public fechaFin: Date | null = null;

  constructor(
    private readonly nominaService: NominaService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      const res = await lastValueFrom(this.nominaService.listPeriodos());
      this.periodos = res?.data ?? [];
    } catch {
      this.alertService.showError(
        'Error',
        'No se pudieron cargar los períodos',
      );
    } finally {
      this.loading = false;
    }
  }

  openModal(): void {
    this.fechaInicio = null;
    this.fechaFin = null;
    this.showModal = true;
  }

  async crear(): Promise<void> {
    if (!this.fechaInicio || !this.fechaFin) {
      this.alertService.showWarn(
        'Requerido',
        'Selecciona las fechas de inicio y fin',
      );
      return;
    }
    if (this.fechaFin < this.fechaInicio) {
      this.alertService.showWarn(
        'Fechas inválidas',
        'La fecha fin no puede ser anterior a la de inicio',
      );
      return;
    }
    this.saving = true;
    try {
      await lastValueFrom(
        this.nominaService.createPeriodo({
          fechaInicio: aFechaLocal(this.fechaInicio),
          fechaFin: aFechaLocal(this.fechaFin),
        }),
      );
      this.alertService.showSuccess('Creado', 'Período creado exitosamente');
      this.showModal = false;
      await this.load();
    } catch {
      this.alertService.showError('Error', 'No se pudo crear el período');
    } finally {
      this.saving = false;
    }
  }

  anular(p: PeriodoNominaModel): void {
    this.confirmationService.confirm({
      message: `¿Anular el período del ${this.fmt(p.fechaInicio)} al ${this.fmt(p.fechaFin)}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, anular',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await lastValueFrom(this.nominaService.anularPeriodo(p.id));
          this.alertService.showSuccess('Anulado', 'Período anulado');
          await this.load();
        } catch {
          this.alertService.showError('Error', 'No se pudo anular el período');
        }
      },
    });
  }

  fmt(f: string): string {
    return new Date(f).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  estadoLabel(e: EstadoPeriodo): string {
    const m: Record<EstadoPeriodo, string> = {
      ABIERTO: 'Abierto',
      LIQUIDADO: 'Liquidado',
      PAGADO: 'Pagado',
      ANULADO: 'Anulado',
    };
    return m[e] ?? e;
  }

  estadoSeverity(e: EstadoPeriodo): TagSeverity {
    const m: Record<EstadoPeriodo, TagSeverity> = {
      ABIERTO: 'success',
      LIQUIDADO: 'info',
      PAGADO: 'secondary',
      ANULADO: 'danger',
    };
    return m[e];
  }
}
