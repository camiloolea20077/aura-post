import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { CalendarModule } from 'primeng/calendar';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';

import { ProyectoService } from '../../../core/services/proyecto.service';
import { AsistenciaService } from '../../../core/services/asistencia.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  CreateFrenteDto,
  EstadoFrente,
  FrenteTableModel,
  FrenteTrabajadorModel,
  FrenteTurnoModel,
} from '../../../core/models/proyecto.model';

type Sev = 'success' | 'info' | 'warn' | 'danger' | 'secondary';

@Component({
  selector: 'app-frentes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    DropdownModule,
    MultiSelectModule,
    CalendarModule,
    TagModule,
    ToastModule,
    TooltipModule,
    TextareaModule,
  ],
  providers: [MessageService],
  templateUrl: './frentes.component.html',
  styleUrls: ['./frentes.component.scss'],
})
export class FrentesComponent implements OnInit {
  proyectoId!: number;
  proyectoNombre = '';

  frentes: FrenteTableModel[] = [];
  loading = false;

  showForm = false;
  saving = false;
  editId: number | null = null;
  form: CreateFrenteDto = this.emptyForm();

  empleadoOpts: { label: string; value: number }[] = [];

  // Trabajadores (modo edición)
  trabajadores: FrenteTrabajadorModel[] = [];
  nuevoTrabajadorId: number | null = null;

  // Turnos del frente (modo edición)
  turnoOpts: { label: string; value: number }[] = [];
  frenteTurnos: FrenteTurnoModel[] = [];
  nuevoTurnoId: number | null = null;
  nuevoTurnoFecha: Date | null = null;

  readonly estadoOpts: { label: string; value: EstadoFrente }[] = [
    { label: 'Activo', value: 'ACTIVO' },
    { label: 'Suspendido', value: 'SUSPENDIDO' },
    { label: 'Finalizado', value: 'FINALIZADO' },
    { label: 'Anulado', value: 'ANULADO' },
  ];

  constructor(
    private readonly service: ProyectoService,
    private readonly asistenciaService: AsistenciaService,
    private readonly alertService: AlertService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.proyectoId = Number(this.route.snapshot.paramMap.get('proyectoId'));
    this.cargar();
    this.cargarEmpleados();
    this.cargarProyecto();
    this.cargarTurnosCatalogo();
  }

  async cargarTurnosCatalogo(): Promise<void> {
    try {
      const res = await lastValueFrom(this.asistenciaService.listTurnos(true));
      this.turnoOpts = (res?.data ?? []).map((t) => ({ label: t.nombre, value: t.id }));
      this.cdr.markForCheck();
    } catch {
      /* no bloqueante */
    }
  }

  async cargarProyecto(): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.getById(this.proyectoId));
      this.proyectoNombre = res?.data
        ? `${res.data.codigo} — ${res.data.nombre}`
        : '';
      this.cdr.markForCheck();
    } catch {
      /* no bloqueante */
    }
  }

  async cargar(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.frentes(this.proyectoId));
      this.frentes = res?.data ?? [];
    } catch {
      this.alertService.showError('Error', 'No se pudieron cargar los frentes');
      this.frentes = [];
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async cargarEmpleados(): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.empleados());
      this.empleadoOpts = (res?.data ?? []).map((e) => ({
        label: `${e.nombres} ${e.apellidos} — ${e.numeroDocumento}`,
        value: e.id,
      }));
      this.cdr.markForCheck();
    } catch {
      /* no bloqueante */
    }
  }

  volver(): void {
    this.router.navigate(['/proyectos']);
  }

  nuevo(): void {
    this.editId = null;
    this.form = this.emptyForm();
    this.trabajadores = [];
    this.nuevoTrabajadorId = null;
    this.showForm = true;
    this.cdr.markForCheck();
  }

  async editar(f: FrenteTableModel): Promise<void> {
    this.editId = f.id;
    this.form = {
      codigo: f.codigo,
      nombre: f.nombre,
      descripcion: f.descripcion,
      ubicacion: f.ubicacion,
      liderId: f.liderId,
      fechaInicio: f.fechaInicio,
      fechaFin: f.fechaFin,
      estado: f.estado,
      observacion: f.observacion,
      trabajadorIds: [],
    };
    this.nuevoTurnoId = null;
    this.nuevoTurnoFecha = new Date();
    this.showForm = true;
    this.cdr.markForCheck();
    await this.cargarTrabajadores();
    await this.cargarFrenteTurnos();
  }

  cancelar(): void {
    this.showForm = false;
    this.cdr.markForCheck();
  }

  formValido(): boolean {
    return !!this.form.codigo?.trim() && !!this.form.nombre?.trim();
  }

  async guardar(): Promise<void> {
    if (!this.formValido()) return;
    this.saving = true;
    this.cdr.markForCheck();
    try {
      if (this.editId) {
        const { trabajadorIds, ...dto } = this.form;
        await lastValueFrom(this.service.actualizarFrente(this.editId, dto));
        this.alertService.showSuccess(
          'Actualizado',
          'Frente actualizado correctamente',
        );
      } else {
        await lastValueFrom(
          this.service.crearFrente(this.proyectoId, this.form),
        );
        this.alertService.showSuccess('Creado', 'Frente creado exitosamente');
      }
      this.showForm = false;
      await this.cargar();
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo guardar el frente',
      );
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  async eliminar(f: FrenteTableModel): Promise<void> {
    if (!confirm(`¿Eliminar el frente "${f.codigo} — ${f.nombre}"?`)) return;
    try {
      await lastValueFrom(this.service.eliminarFrente(f.id));
      this.alertService.showSuccess('Eliminado', 'Frente eliminado');
      await this.cargar();
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo eliminar',
      );
    }
  }

  // ── Turno del frente (modo edición) ──────────────────────────
  async cargarFrenteTurnos(): Promise<void> {
    if (!this.editId) return;
    try {
      const res = await lastValueFrom(this.service.frenteTurnos(this.editId));
      this.frenteTurnos = res?.data ?? [];
      this.cdr.markForCheck();
    } catch {
      this.frenteTurnos = [];
    }
  }

  async asignarTurno(): Promise<void> {
    if (!this.editId || !this.nuevoTurnoId) return;
    const fechaInicio = this.nuevoTurnoFecha
      ? `${this.nuevoTurnoFecha.getFullYear()}-${String(this.nuevoTurnoFecha.getMonth() + 1).padStart(2, '0')}-${String(this.nuevoTurnoFecha.getDate()).padStart(2, '0')}`
      : null;
    try {
      await lastValueFrom(
        this.service.asignarFrenteTurno(this.editId, { turnoId: this.nuevoTurnoId, fechaInicio }),
      );
      this.nuevoTurnoId = null;
      await this.cargarFrenteTurnos();
      this.alertService.showSuccess('Asignado', 'Turno asignado al frente');
    } catch (e: any) {
      this.alertService.showError('Error', e?.error?.message ?? 'No se pudo asignar el turno');
    }
  }

  async eliminarTurno(ft: FrenteTurnoModel): Promise<void> {
    if (!confirm(`¿Eliminar la asignación del turno "${ft.turnoNombre}"?`)) return;
    try {
      await lastValueFrom(this.service.eliminarFrenteTurno(ft.id));
      await this.cargarFrenteTurnos();
      this.alertService.showSuccess('Eliminada', 'Asignación de turno eliminada');
    } catch (e: any) {
      this.alertService.showError('Error', e?.error?.message ?? 'No se pudo eliminar');
    }
  }

  // ── Trabajadores (modo edición) ──────────────────────────────
  async cargarTrabajadores(): Promise<void> {
    if (!this.editId) return;
    try {
      const res = await lastValueFrom(this.service.trabajadores(this.editId));
      this.trabajadores = res?.data ?? [];
      this.cdr.markForCheck();
    } catch {
      this.trabajadores = [];
    }
  }

  async agregarTrabajador(): Promise<void> {
    if (!this.editId || !this.nuevoTrabajadorId) return;
    try {
      await lastValueFrom(
        this.service.asignarTrabajador(this.editId, {
          empleadoId: this.nuevoTrabajadorId,
        }),
      );
      this.nuevoTrabajadorId = null;
      await this.cargarTrabajadores();
      this.alertService.showSuccess(
        'Asignado',
        'Trabajador asignado al frente',
      );
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo asignar',
      );
    }
  }

  async retirar(t: FrenteTrabajadorModel): Promise<void> {
    if (!this.editId) return;
    if (!confirm(`¿Retirar a ${t.empleadoNombre} del frente?`)) return;
    try {
      await lastValueFrom(
        this.service.retirarTrabajador(this.editId, t.empleadoId),
      );
      await this.cargarTrabajadores();
      this.alertService.showSuccess(
        'Retirado',
        'Trabajador retirado del frente',
      );
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo retirar',
      );
    }
  }

  estadoSeverity(estado: string): Sev {
    const m: Record<string, Sev> = {
      ACTIVO: 'success',
      SUSPENDIDO: 'warn',
      FINALIZADO: 'info',
      ANULADO: 'danger',
      RETIRADO: 'danger',
    };
    return m[estado] ?? 'secondary';
  }

  private emptyForm(): CreateFrenteDto {
    return {
      codigo: '',
      nombre: '',
      descripcion: null,
      ubicacion: null,
      liderId: null,
      fechaInicio: null,
      fechaFin: null,
      estado: 'ACTIVO',
      observacion: null,
      trabajadorIds: [],
    };
  }
}
