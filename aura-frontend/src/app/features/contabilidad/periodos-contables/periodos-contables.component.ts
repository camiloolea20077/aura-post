import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TabViewModule } from 'primeng/tabview';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';

import { PeriodoContableService } from '../../../core/services/periodo-contable.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  AbrirPeriodoDto,
  BalanceComprobacionLinea,
  BalanceComprobacionModel,
  MESES,
  PeriodoContableModel,
} from '../../../core/models/periodo-contable.model';

@Component({
  selector: 'app-periodos-contables',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    TagModule,
    ToastModule,
    TooltipModule,
    DialogModule,
    DropdownModule,
    InputTextModule,
    TextareaModule,
    TabViewModule,
    SkeletonModule,
  ],
  providers: [MessageService],
  templateUrl: './periodos-contables.component.html',
  styleUrls: ['./periodos-contables.component.scss'],
})
export class PeriodosContablesComponent implements OnInit {
  periodos: PeriodoContableModel[] = [];
  periodoActivo: PeriodoContableModel | null = null;
  loading = false;
  saving = false;

  // Dialog abrir período
  showAbrirDialog = false;
  formAbrir: AbrirPeriodoDto = this.emptyFormAbrir();

  // Dialog cerrar período
  showCerrarDialog = false;
  periodoCerrarId: number | null = null;
  observacionesCierre = '';

  // Balance de Comprobación
  periodoBalanceId: number | null = null;
  balance: BalanceComprobacionModel | null = null;
  loadingBalance = false;

  readonly mesesOpts = MESES;
  readonly anioOpts = this.buildAnioOpts();

  constructor(
    private readonly service: PeriodoContableService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const [listRes, activoRes] = await Promise.all([
        lastValueFrom(this.service.listar()),
        lastValueFrom(this.service.getPeriodoActivo()),
      ]);
      this.periodos = listRes?.data ?? [];
      this.periodoActivo = activoRes?.data ?? null;
    } catch {
      this.alertService.showError('Error', 'No se pudieron cargar los períodos contables');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  abrirDialogNuevo(): void {
    const hoy = new Date();
    this.formAbrir = {
      anio: hoy.getFullYear(),
      mes: hoy.getMonth() + 1,
      observaciones: null,
    };
    this.showAbrirDialog = true;
    this.cdr.markForCheck();
  }

  async confirmarAbrir(): Promise<void> {
    if (!this.formAbrir.anio || !this.formAbrir.mes) return;
    this.saving = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(this.service.abrir(this.formAbrir));
      this.alertService.showSuccess('Período abierto', `${this.mesLabel(this.formAbrir.mes)} ${this.formAbrir.anio} abierto correctamente`);
      this.showAbrirDialog = false;
      await this.cargar();
    } catch (e: any) {
      this.alertService.showError('Error', e?.error?.message ?? 'No se pudo abrir el período');
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  abrirDialogCerrar(periodo: PeriodoContableModel): void {
    this.periodoCerrarId = periodo.id;
    this.observacionesCierre = '';
    this.showCerrarDialog = true;
    this.cdr.markForCheck();
  }

  async confirmarCerrar(): Promise<void> {
    if (!this.periodoCerrarId) return;
    this.saving = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(
        this.service.cerrar(this.periodoCerrarId, { observaciones: this.observacionesCierre || null }),
      );
      this.alertService.showSuccess('Período cerrado', 'El período fue cerrado exitosamente');
      this.showCerrarDialog = false;
      await this.cargar();
    } catch (e: any) {
      this.alertService.showError('Error al cerrar', e?.error?.message ?? 'No se pudo cerrar el período');
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  async cargarBalance(): Promise<void> {
    if (!this.periodoBalanceId) return;
    this.loadingBalance = true;
    this.balance = null;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.balanceComprobacion(this.periodoBalanceId));
      this.balance = res?.data ?? null;
    } catch (e: any) {
      this.alertService.showError('Error', e?.error?.message ?? 'No se pudo cargar el balance de comprobación');
    } finally {
      this.loadingBalance = false;
      this.cdr.markForCheck();
    }
  }

  mesLabel(mes: number): string {
    return MESES.find((m) => m.value === mes)?.label ?? String(mes);
  }

  estadoSeverity(estado: string): 'success' | 'danger' {
    return estado === 'ABIERTO' ? 'success' : 'danger';
  }

  private emptyFormAbrir(): AbrirPeriodoDto {
    const hoy = new Date();
    return { anio: hoy.getFullYear(), mes: hoy.getMonth() + 1, observaciones: null };
  }

  private buildAnioOpts(): { label: string; value: number }[] {
    const anioActual = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => {
      const v = anioActual - 2 + i;
      return { label: String(v), value: v };
    });
  }
}
