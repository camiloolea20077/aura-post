import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputTextModule } from 'primeng/inputtext';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { AsistenciaService } from '../../../core/services/asistencia.service';
import { NominaService } from '../../../core/services/nomina.service';
import {
  AsistenciaDiaModel,
  IncidenciaModel,
  PeriodoAsistenciaModel,
} from '../../../core/models/asistencia.model';
import { EmpleadoTableModel } from '../../../core/models/nomina.model';
import { AlertService } from '../../../shared/pipes/alert.service';

type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined;

@Component({
  selector: 'app-revision-asistencia',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
    DropdownModule, CalendarModule, InputTextModule, TabViewModule, TagModule,
    ToastModule, TooltipModule, ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './revision.component.html',
  styleUrls: ['./revision.component.scss'],
})
export class RevisionAsistenciaComponent implements OnInit {
  public activeTab = 0;

  // ── Períodos de asistencia ──
  public periodos: PeriodoAsistenciaModel[] = [];
  public loadingPeriodos = true;
  public showFormPeriodo = false;
  public savingPeriodo = false;
  public periodoForm = { fechaInicio: null as Date | null, fechaFin: null as Date | null };

  // ── Revisión por empleado ──
  public empleados: EmpleadoTableModel[] = [];
  public empleadoSel: number | null = null;
  public desde: Date = this.startOfMonth();
  public hasta: Date = new Date();
  public dias: AsistenciaDiaModel[] = [];
  public incidencias: IncidenciaModel[] = [];
  public loadingRev = false;

  // ── Revisar incidencia ──
  public showRevisar = false;
  public incSel: IncidenciaModel | null = null;
  public revForm = { estado: null as string | null, observacionRevision: '', soporteUrl: '' };
  public revisando = false;

  public estadosRevision = [
    { label: 'Justificada', value: 'JUSTIFICADA' },
    { label: 'No justificada', value: 'NO_JUSTIFICADA' },
    { label: 'Aprobar como novedad', value: 'APROBADA_COMO_NOVEDAD' },
    { label: 'Rechazada', value: 'RECHAZADA' },
    { label: 'Corregida', value: 'CORREGIDA' },
    { label: 'Anulada', value: 'ANULADA' },
  ];

  constructor(
    private readonly asistenciaService: AsistenciaService,
    private readonly nominaService: NominaService,
    private readonly alertService: AlertService,
    private readonly confirm: ConfirmationService,
  ) {}

  async ngOnInit(): Promise<void> {
    await Promise.all([this.cargarPeriodos(), this.cargarEmpleados()]);
  }

  // ── Períodos ──
  async cargarPeriodos(): Promise<void> {
    this.loadingPeriodos = true;
    try {
      const res = await lastValueFrom(this.asistenciaService.listPeriodosAsistencia());
      this.periodos = res?.data ?? [];
    } catch {
      this.periodos = [];
    } finally {
      this.loadingPeriodos = false;
    }
  }

  async crearPeriodo(): Promise<void> {
    if (!this.periodoForm.fechaInicio || !this.periodoForm.fechaFin) {
      this.alertService.showWarn('Requerido', 'Selecciona las fechas');
      return;
    }
    this.savingPeriodo = true;
    try {
      await lastValueFrom(this.asistenciaService.crearPeriodoAsistencia({
        fechaInicio: this.fmt(this.periodoForm.fechaInicio),
        fechaFin: this.fmt(this.periodoForm.fechaFin),
      }));
      this.alertService.showSuccess('Creado', 'Período de asistencia creado');
      this.showFormPeriodo = false;
      this.periodoForm = { fechaInicio: null, fechaFin: null };
      await this.cargarPeriodos();
    } catch {
      this.alertService.showError('Error', 'No se pudo crear el período');
    } finally {
      this.savingPeriodo = false;
    }
  }

  accionPeriodo(p: PeriodoAsistenciaModel, accion: 'cerrar' | 'aprobar' | 'enviar'): void {
    const labels = { cerrar: 'enviar a revisión', aprobar: 'aprobar', enviar: 'enviar a nómina' };
    this.confirm.confirm({
      message: `¿${labels[accion]} el período ${p.fechaInicio} → ${p.fechaFin}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'Cancelar',
      accept: async () => {
        try {
          const call =
            accion === 'cerrar' ? this.asistenciaService.cerrarPeriodoAsistencia(p.id)
            : accion === 'aprobar' ? this.asistenciaService.aprobarPeriodoAsistencia(p.id)
            : this.asistenciaService.enviarPeriodoANomina(p.id);
          await lastValueFrom(call);
          this.alertService.showSuccess('Listo', 'Período actualizado');
          await this.cargarPeriodos();
        } catch (err: any) {
          this.alertService.showError('Error', err?.error?.message ?? 'No se pudo actualizar el período');
        }
      },
    });
  }

  // ── Revisión por empleado ──
  async cargarEmpleados(): Promise<void> {
    try {
      const res = await lastValueFrom(this.nominaService.pageEmpleados({ page: 0, rows: 500, search: null }));
      this.empleados = res?.data?.content ?? [];
    } catch {
      this.empleados = [];
    }
  }

  get empleadosOpts() {
    return this.empleados.map(e => ({ label: e.nombreCompleto, value: e.id }));
  }

  async cargarRevision(): Promise<void> {
    if (this.empleadoSel == null) {
      this.alertService.showWarn('Requerido', 'Selecciona un empleado');
      return;
    }
    this.loadingRev = true;
    try {
      const [dRes, iRes] = await Promise.all([
        lastValueFrom(this.asistenciaService.listDias(this.empleadoSel, this.fmt(this.desde), this.fmt(this.hasta))),
        lastValueFrom(this.asistenciaService.listIncidencias(this.empleadoSel, this.fmt(this.desde), this.fmt(this.hasta))),
      ]);
      this.dias = dRes?.data ?? [];
      this.incidencias = iRes?.data ?? [];
    } catch {
      this.dias = [];
      this.incidencias = [];
    } finally {
      this.loadingRev = false;
    }
  }

  async aprobarDia(d: AsistenciaDiaModel): Promise<void> {
    try {
      await lastValueFrom(this.asistenciaService.aprobarDia(d.id));
      this.alertService.showSuccess('Aprobado', 'Día aprobado');
      await this.cargarRevision();
    } catch (err: any) {
      this.alertService.showError('Error', err?.error?.message ?? 'No se pudo aprobar');
    }
  }

  rechazarDia(d: AsistenciaDiaModel): void {
    this.confirm.confirm({
      message: `¿Rechazar la asistencia del ${d.fecha}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, rechazar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await lastValueFrom(this.asistenciaService.rechazarDia(d.id, null));
          this.alertService.showSuccess('Rechazado', 'Día rechazado');
          await this.cargarRevision();
        } catch {
          this.alertService.showError('Error', 'No se pudo rechazar');
        }
      },
    });
  }

  async generarIncidencias(d: AsistenciaDiaModel): Promise<void> {
    if (this.empleadoSel == null) return;
    try {
      await lastValueFrom(this.asistenciaService.generarIncidencias(this.empleadoSel, d.fecha));
      this.alertService.showSuccess('Generadas', 'Incidencias generadas para el día');
      await this.cargarRevision();
    } catch (err: any) {
      this.alertService.showError('Error', err?.error?.message ?? 'No se pudieron generar');
    }
  }

  abrirRevisar(i: IncidenciaModel): void {
    this.incSel = i;
    this.revForm = { estado: null, observacionRevision: '', soporteUrl: i.soporteUrl ?? '' };
    this.showRevisar = true;
  }

  async guardarRevision(): Promise<void> {
    if (!this.incSel || !this.revForm.estado) {
      this.alertService.showWarn('Requerido', 'Selecciona el estado de revisión');
      return;
    }
    this.revisando = true;
    try {
      await lastValueFrom(this.asistenciaService.revisarIncidencia(this.incSel.id, {
        estado: this.revForm.estado,
        observacionRevision: this.revForm.observacionRevision || null,
        soporteUrl: this.revForm.soporteUrl || null,
      }));
      this.alertService.showSuccess('Revisada', 'Incidencia actualizada');
      this.showRevisar = false;
      await this.cargarRevision();
    } catch (err: any) {
      this.alertService.showError('Error', err?.error?.message ?? 'No se pudo revisar');
    } finally {
      this.revisando = false;
    }
  }

  // ── Helpers ──
  private fmt(d: Date): string { return d.toISOString().split('T')[0]; }
  private startOfMonth(): Date { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); }

  periodoSeverity(e: string): TagSeverity {
    const m: Record<string, TagSeverity> = {
      ABIERTO: 'success', EN_REVISION: 'warn', APROBADO: 'info',
      BLOQUEADO: 'secondary', ENVIADO_A_NOMINA: 'contrast', ANULADO: 'danger',
    };
    return m[e] ?? 'secondary';
  }
  aprobSeverity(e: string): TagSeverity {
    const m: Record<string, TagSeverity> = {
      PENDIENTE: 'warn', APROBADO: 'success', RECHAZADO: 'danger', ENVIADO_A_NOMINA: 'info',
    };
    return m[e] ?? 'secondary';
  }
  incSeverity(e: string): TagSeverity {
    if (e === 'PENDIENTE_REVISION') return 'warn';
    if (e === 'JUSTIFICADA' || e === 'CORREGIDA') return 'success';
    if (e === 'NO_JUSTIFICADA' || e === 'RECHAZADA') return 'danger';
    if (e === 'APROBADA_COMO_NOVEDAD') return 'info';
    return 'secondary';
  }
}
