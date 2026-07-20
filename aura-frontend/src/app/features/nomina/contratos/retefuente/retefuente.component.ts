import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { RetefuenteService } from '../../../../core/services/retefuente.service';
import {
  CreateDeduccionDto,
  DeduccionModel,
  TIPOS_DEDUCCION,
  TipoDeduccion,
} from '../../../../core/models/retefuente.model';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { aFechaLocal } from '../../../../shared/utils/fecha.util';

/**
 * Retención en la fuente de un contrato (Fase 4.5): procedimiento y deducciones.
 */
@Component({
  selector: 'app-retefuente',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DialogModule, ButtonModule, DropdownModule,
    InputNumberModule, InputTextModule, CalendarModule, SkeletonModule, TooltipModule,
  ],
  templateUrl: './retefuente.component.html',
  styleUrls: ['./retefuente.component.scss'],
})
export class RetefuenteComponent implements OnChanges {
  @Input() visible = false;
  @Input() contratoId: number | null = null;
  @Input() contratoLabel = '';
  /** Inline: se muestra dentro de un tab (sin diálogo). */
  @Input() inline = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  readonly tiposDeduccion = TIPOS_DEDUCCION;
  readonly procedimientoOpts = [
    { label: 'Procedimiento 1 (mensual)', value: '1' },
    { label: 'Procedimiento 2 (% fijo semestral)', value: '2' },
  ];

  deducciones: DeduccionModel[] = [];
  loading = false;

  procedimiento: '1' | '2' = '1';
  guardandoProc = false;

  // Form nueva deducción
  mostrarForm = false;
  tipo: TipoDeduccion = 'DEPENDIENTES';
  valor: number | null = null;
  vigenteDesde: Date | null = null;
  vigenteHasta: Date | null = null;
  soporte: string | null = null;
  guardando = false;

  constructor(
    private readonly service: RetefuenteService,
    private readonly alert: AlertService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    const abrioDialogo = changes['visible']?.currentValue && this.contratoId;
    const cambioContratoInline = this.inline && changes['contratoId']?.currentValue;
    if (abrioDialogo || cambioContratoInline) {
      this.cargar();
    }
    if (!this.inline && changes['visible'] && !changes['visible'].currentValue) {
      this.reset();
    }
  }

  async cargar(): Promise<void> {
    this.loading = true;
    try {
      const res = await lastValueFrom(this.service.deducciones(this.contratoId!));
      this.deducciones = res?.data ?? [];
    } catch {
      this.alert.showError('Error', 'No se pudieron cargar las deducciones.');
    } finally {
      this.loading = false;
    }
  }

  /** DEPENDIENTES no lleva valor: lo calcula el motor. */
  get esDependientes(): boolean {
    return this.tipo === 'DEPENDIENTES';
  }

  hintDe(tipo: TipoDeduccion): string {
    return this.tiposDeduccion.find((t) => t.value === tipo)?.hint ?? '';
  }

  labelDe(tipo: TipoDeduccion): string {
    return this.tiposDeduccion.find((t) => t.value === tipo)?.label ?? tipo;
  }

  async guardarProcedimiento(): Promise<void> {
    this.guardandoProc = true;
    try {
      await lastValueFrom(this.service.cambiarProcedimiento(this.contratoId!, this.procedimiento));
      this.alert.showSuccess('Procedimiento actualizado', '');
    } catch (err: any) {
      this.alert.showError('Error', err?.error?.message ?? 'No se pudo actualizar.');
    } finally {
      this.guardandoProc = false;
    }
  }

  abrirForm(): void {
    this.mostrarForm = true;
    this.tipo = 'DEPENDIENTES';
    this.valor = null;
    this.vigenteDesde = new Date();
    this.vigenteHasta = null;
    this.soporte = null;
  }

  cancelarForm(): void {
    this.mostrarForm = false;
  }

  async guardar(): Promise<void> {
    if (!this.vigenteDesde) {
      this.alert.showWarn('Datos incompletos', 'Indica desde cuándo aplica.');
      return;
    }
    if (!this.esDependientes && (this.valor == null || this.valor <= 0)) {
      this.alert.showWarn('Datos incompletos', 'Indica el valor de la deducción.');
      return;
    }
    const dto: CreateDeduccionDto = {
      contratoId: this.contratoId!,
      tipo: this.tipo,
      valor: this.esDependientes ? null : this.valor,
      vigenteDesde: aFechaLocal(this.vigenteDesde)!,
      vigenteHasta: aFechaLocal(this.vigenteHasta),
      soporte: this.soporte?.trim() || null,
    };
    this.guardando = true;
    try {
      await lastValueFrom(this.service.crear(dto));
      this.alert.showSuccess('Deducción registrada', '');
      this.mostrarForm = false;
      await this.cargar();
    } catch (err: any) {
      this.alert.showError('Error', err?.error?.message ?? 'No se pudo registrar.');
    } finally {
      this.guardando = false;
    }
  }

  async eliminar(d: DeduccionModel): Promise<void> {
    if (!confirm(`¿Eliminar la deducción de ${this.labelDe(d.tipo)}?`)) return;
    try {
      await lastValueFrom(this.service.eliminar(d.id));
      this.alert.showSuccess('Eliminada', '');
      await this.cargar();
    } catch {
      this.alert.showError('Error', 'No se pudo eliminar.');
    }
  }

  onHide(): void {
    this.reset();
    this.visibleChange.emit(false);
  }

  private reset(): void {
    this.deducciones = [];
    this.mostrarForm = false;
    this.procedimiento = '1';
  }
}
