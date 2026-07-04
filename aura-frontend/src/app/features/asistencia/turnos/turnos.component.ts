import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { AsistenciaService } from '../../../core/services/asistencia.service';
import { NominaService } from '../../../core/services/nomina.service';
import {
  CreateTurnoDto,
  EmpleadoTurnoModel,
  TurnoModel,
} from '../../../core/models/asistencia.model';
import { EmpleadoTableModel } from '../../../core/models/nomina.model';
import { AlertService } from '../../../shared/pipes/alert.service';

@Component({
  selector: 'app-turnos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    DropdownModule,
    CalendarModule,
    InputTextModule,
    InputNumberModule,
    TagModule,
    ToastModule,
    TooltipModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './turnos.component.html',
  styleUrls: ['./turnos.component.scss'],
})
export class TurnosComponent implements OnInit {
  public turnos: TurnoModel[] = [];
  public loading = true;

  // Form turno
  public showForm = false;
  public saving = false;
  public editId: number | null = null;
  public form: CreateTurnoDto = this.emptyForm();
  public horaInicioD: Date | null = null;
  public horaFinD: Date | null = null;

  // Asignaciones
  public showAsignar = false;
  public empleados: EmpleadoTableModel[] = [];
  public empleadoSel: number | null = null;
  public asignaciones: EmpleadoTurnoModel[] = [];
  public loadingAsign = false;
  public asignForm = {
    turnoId: null as number | null,
    fechaInicio: null as Date | null,
    fechaFin: null as Date | null,
    diasSemana: '1,2,3,4,5',
  };
  public asignando = false;

  constructor(
    private readonly asistenciaService: AsistenciaService,
    private readonly nominaService: NominaService,
    private readonly alertService: AlertService,
    private readonly confirm: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      const res = await lastValueFrom(this.asistenciaService.listTurnos(false));
      this.turnos = res?.data ?? [];
    } catch {
      this.alertService.showError('Error', 'No se pudieron cargar los turnos');
    } finally {
      this.loading = false;
    }
  }

  // ── Form turno ──
  nuevo(): void {
    this.editId = null;
    this.form = this.emptyForm();
    this.horaInicioD = null;
    this.horaFinD = null;
    this.showForm = true;
  }

  editar(t: TurnoModel): void {
    this.editId = t.id;
    this.form = {
      nombre: t.nombre,
      horaInicio: t.horaInicio,
      horaFin: t.horaFin,
      minutosDescanso: t.minutosDescanso,
      toleraLlegadaTardeMin: t.toleraLlegadaTardeMin,
      cruzaMedianoche: t.cruzaMedianoche,
      activo: t.activo,
    };
    this.horaInicioD = this.parseHora(t.horaInicio);
    this.horaFinD = this.parseHora(t.horaFin);
    this.showForm = true;
  }

  async guardar(): Promise<void> {
    if (!this.form.nombre || !this.horaInicioD || !this.horaFinD) {
      this.alertService.showWarn(
        'Requerido',
        'Nombre y horas son obligatorios',
      );
      return;
    }
    this.form.horaInicio = this.fmtHora(this.horaInicioD);
    this.form.horaFin = this.fmtHora(this.horaFinD);
    this.saving = true;
    try {
      if (this.editId) {
        await lastValueFrom(
          this.asistenciaService.updateTurno(this.editId, this.form),
        );
        this.alertService.showSuccess('Actualizado', 'Turno actualizado');
      } else {
        await lastValueFrom(this.asistenciaService.createTurno(this.form));
        this.alertService.showSuccess('Creado', 'Turno creado');
      }
      this.showForm = false;
      await this.load();
    } catch {
      this.alertService.showError('Error', 'No se pudo guardar el turno');
    } finally {
      this.saving = false;
    }
  }

  eliminar(t: TurnoModel): void {
    this.confirm.confirm({
      message: `¿Desactivar el turno "${t.nombre}"?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'Cancelar',
      accept: async () => {
        try {
          await lastValueFrom(this.asistenciaService.deleteTurno(t.id));
          this.alertService.showSuccess('Desactivado', 'Turno desactivado');
          await this.load();
        } catch {
          this.alertService.showError('Error', 'No se pudo desactivar');
        }
      },
    });
  }

  // ── Asignaciones ──
  async abrirAsignar(): Promise<void> {
    this.showAsignar = true;
    this.empleadoSel = null;
    this.asignaciones = [];
    this.asignForm = {
      turnoId: null,
      fechaInicio: null,
      fechaFin: null,
      diasSemana: '1,2,3,4,5',
    };
    if (this.empleados.length === 0) {
      try {
        const res = await lastValueFrom(
          this.nominaService.pageEmpleados({
            page: 0,
            rows: 500,
            search: null,
          }),
        );
        this.empleados = res?.data?.content ?? [];
      } catch {
        this.empleados = [];
      }
    }
  }

  async onEmpleadoChange(): Promise<void> {
    if (this.empleadoSel == null) return;
    this.loadingAsign = true;
    try {
      const res = await lastValueFrom(
        this.asistenciaService.listAsignaciones(this.empleadoSel),
      );
      this.asignaciones = res?.data ?? [];
    } catch {
      this.asignaciones = [];
    } finally {
      this.loadingAsign = false;
    }
  }

  async asignar(): Promise<void> {
    if (
      this.empleadoSel == null ||
      this.asignForm.turnoId == null ||
      !this.asignForm.fechaInicio
    ) {
      this.alertService.showWarn(
        'Requerido',
        'Empleado, turno y fecha de inicio son obligatorios',
      );
      return;
    }
    this.asignando = true;
    try {
      await lastValueFrom(
        this.asistenciaService.asignarTurno({
          empleadoId: this.empleadoSel,
          turnoId: this.asignForm.turnoId,
          fechaInicio: this.fmtFecha(this.asignForm.fechaInicio),
          fechaFin: this.asignForm.fechaFin
            ? this.fmtFecha(this.asignForm.fechaFin)
            : null,
          diasSemana: this.asignForm.diasSemana,
        }),
      );
      this.alertService.showSuccess('Asignado', 'Turno asignado al empleado');
      this.asignForm.turnoId = null;
      this.asignForm.fechaFin = null;
      await this.onEmpleadoChange();
    } catch {
      this.alertService.showError('Error', 'No se pudo asignar el turno');
    } finally {
      this.asignando = false;
    }
  }

  async quitarAsignacion(a: EmpleadoTurnoModel): Promise<void> {
    try {
      await lastValueFrom(this.asistenciaService.eliminarAsignacion(a.id));
      this.alertService.showSuccess('Eliminada', 'Asignación eliminada');
      await this.onEmpleadoChange();
    } catch {
      this.alertService.showError('Error', 'No se pudo eliminar');
    }
  }

  get turnosActivos(): TurnoModel[] {
    return this.turnos.filter((t) => t.activo);
  }

  get empleadosOpts() {
    return this.empleados.map((e) => ({
      label: e.nombreCompleto,
      value: e.id,
    }));
  }

  get turnosOpts() {
    return this.turnosActivos.map((t) => ({
      label: `${t.nombre} (${this.hhmm(t.horaInicio)}–${this.hhmm(t.horaFin)})`,
      value: t.id,
    }));
  }

  // ── Helpers ──
  hhmm(h: string | null): string {
    if (!h) return '—';
    return h.substring(0, 5);
  }
  private parseHora(h: string): Date {
    const [hh, mm] = h.split(':');
    const d = new Date();
    d.setHours(+hh, +mm, 0, 0);
    return d;
  }
  private fmtHora(d: Date): string {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  private fmtFecha(d: Date): string {
    return d.toISOString().split('T')[0];
  }
  private emptyForm(): CreateTurnoDto {
    return {
      nombre: '',
      horaInicio: '08:00',
      horaFin: '17:00',
      minutosDescanso: 0,
      toleraLlegadaTardeMin: 0,
      cruzaMedianoche: false,
      activo: true,
    };
  }
}
