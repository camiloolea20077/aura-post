import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { CreateExperienciaDto, Experiencia } from '../../../../core/models/empleado-hoja-vida.model';
import { EmpleadoHojaVidaService } from '../../../../core/services/empleado-hoja-vida.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { aDate, aFechaLocal } from '../../../../shared/utils/fecha.util';
import { duracion } from './hoja-vida.util';

/** Historial laboral: dónde trabajó el empleado antes de la empresa. */
@Component({
  selector: 'app-experiencia-empleado',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CalendarModule,
    ConfirmDialogModule,
    DialogModule,
    InputTextModule,
    TableModule,
    TextareaModule,
    TooltipModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './experiencia-empleado.component.html',
  styleUrls: ['../../tab-detalle.scss'],
})
export class ExperienciaEmpleadoComponent implements OnChanges {
  @Input({ required: true }) empleadoId!: number;

  readonly hoy = new Date();
  readonly duracion = duracion;

  filas: Experiencia[] = [];
  mostrarForm = false;
  editando: Experiencia | null = null;
  guardando = false;
  form: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: EmpleadoHojaVidaService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
  ) {
    this.form = this.fb.group({
      empresa: ['', [Validators.required, Validators.maxLength(150)]],
      cargo: ['', [Validators.required, Validators.maxLength(150)]],
      fechaInicio: [null as Date | null, Validators.required],
      fechaFin: [null as Date | null],
      motivoRetiro: ['', Validators.maxLength(150)],
      jefeInmediato: ['', Validators.maxLength(150)],
      telefono: ['', Validators.maxLength(30)],
      funciones: ['', Validators.maxLength(1000)],
    });
  }

  ngOnChanges(): void {
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.experiencia(this.empleadoId));
      this.filas = res.data ?? [];
    } catch {
      this.alert.showError('Historial laboral', 'No se pudo cargar.');
    }
  }

  nueva(): void {
    this.editando = null;
    this.form.reset({ empresa: '', cargo: '', motivoRetiro: '', jefeInmediato: '', telefono: '', funciones: '' });
    this.mostrarForm = true;
  }

  editar(x: Experiencia): void {
    this.editando = x;
    this.form.reset({ ...x, fechaInicio: aDate(x.fechaInicio), fechaFin: aDate(x.fechaFin) });
    this.mostrarForm = true;
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    if (v.fechaFin && v.fechaFin < v.fechaInicio) {
      this.alert.showWarn('Historial laboral', 'La fecha de retiro no puede ser anterior a la de ingreso.');
      return;
    }
    const texto = (s: string | null) => s?.trim() || null;
    const dto: CreateExperienciaDto = {
      empresa: v.empresa.trim(),
      cargo: v.cargo.trim(),
      fechaInicio: aFechaLocal(v.fechaInicio)!,
      fechaFin: aFechaLocal(v.fechaFin),
      motivoRetiro: texto(v.motivoRetiro),
      jefeInmediato: texto(v.jefeInmediato),
      telefono: texto(v.telefono),
      funciones: texto(v.funciones),
    };
    this.guardando = true;
    try {
      const res = await lastValueFrom(
        this.editando
          ? this.service.actualizarExperiencia(this.empleadoId, this.editando.id, dto)
          : this.service.crearExperiencia(this.empleadoId, dto),
      );
      this.filas = res.data ?? [];
      this.mostrarForm = false;
      this.alert.showSuccess('Historial laboral', 'Experiencia guardada.');
    } catch (err: any) {
      this.alert.showError('Historial laboral', err?.error?.message ?? 'No se pudo guardar.');
    } finally {
      this.guardando = false;
    }
  }

  confirmarEliminar(x: Experiencia): void {
    this.confirm.confirm({
      message: `¿Quitar la experiencia en <b>${x.empresa}</b>?`,
      header: 'Confirmar',
      icon: 'pi pi-trash',
      acceptLabel: 'Sí, quitar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => void this.eliminar(x),
    });
  }

  private async eliminar(x: Experiencia): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.eliminarExperiencia(this.empleadoId, x.id));
      this.filas = res.data ?? [];
    } catch (err: any) {
      this.alert.showError('Historial laboral', err?.error?.message ?? 'No se pudo quitar.');
    }
  }
}
