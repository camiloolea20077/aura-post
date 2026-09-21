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
  periodoCerrar: PeriodoContableModel | null = null;
  observacionesCierre = '';

  // Dialog reabrir período
  showReabrirDialog = false;
  periodoReabrir: PeriodoContableModel | null = null;
  motivoReapertura = '';

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
    this.periodoCerrar = periodo;
    this.observacionesCierre = '';
    this.showCerrarDialog = true;
    this.cdr.markForCheck();
  }

  abrirDialogReabrir(periodo: PeriodoContableModel): void {
    this.periodoReabrir = periodo;
    this.motivoReapertura = '';
    this.showReabrirDialog = true;
    this.cdr.markForCheck();
  }

  async confirmarReabrir(): Promise<void> {
    if (!this.periodoReabrir || !this.motivoReapertura.trim()) return;
    this.saving = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(
        this.service.reabrir(this.periodoReabrir.id, {
          observaciones: this.motivoReapertura.trim(),
        }),
      );
      this.alertService.showSuccess(
        'Período reabierto',
        'Se anularon los asientos de cierre: el mes vuelve a admitir movimientos',
      );
      this.showReabrirDialog = false;
      await this.cargar();
    } catch (e: any) {
      this.alertService.showError(
        'No se pudo reabrir',
        e?.error?.message ?? 'No se pudo reabrir el período',
      );
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  /** Solo el último mes cerrado se puede reabrir: los de atrás piden reabrir primero los de adelante. */
  esUltimoCerrado(periodo: PeriodoContableModel): boolean {
    if (periodo.estado !== 'CERRADO') return false;
    return !this.periodos.some(
      (p) =>
        p.estado === 'CERRADO' &&
        p.id !== periodo.id &&
        (p.anio > periodo.anio || (p.anio === periodo.anio && p.mes > periodo.mes)),
    );
  }

  /** Meses abiertos anteriores a este: hay que cerrarlos primero. */
  pendientesAntesDe(periodo: PeriodoContableModel): PeriodoContableModel[] {
    return this.periodos.filter(
      (p) =>
        p.estado === 'ABIERTO' &&
        p.id !== periodo.id &&
        (p.anio < periodo.anio || (p.anio === periodo.anio && p.mes < periodo.mes)),
    );
  }

  /** El mes abierto más viejo: es el único que se puede cerrar. */
  get masAntiguoAbierto(): PeriodoContableModel | null {
    return (
      [...this.abiertos].sort(
        (a, b) => a.anio - b.anio || a.mes - b.mes,
      )[0] ?? null
    );
  }

  get abiertos(): PeriodoContableModel[] {
    return this.periodos.filter((p) => p.estado === 'ABIERTO');
  }

  async confirmarCerrar(): Promise<void> {
    if (!this.periodoCerrar) return;
    this.saving = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(
        this.service.cerrar(this.periodoCerrar!.id, { observaciones: this.observacionesCierre || null }),
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
