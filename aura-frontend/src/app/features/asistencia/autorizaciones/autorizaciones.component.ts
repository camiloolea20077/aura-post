import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { AsistenciaService } from '../../../core/services/asistencia.service';
import { NominaService } from '../../../core/services/nomina.service';
import { AutorizacionModel } from '../../../core/models/asistencia.model';
import {
  EmpleadoTableModel,
  PeriodoNominaModel,
} from '../../../core/models/nomina.model';
import { AlertService } from '../../../shared/pipes/alert.service';

@Component({
  selector: 'app-autorizaciones',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, DropdownModule,
    InputTextModule, TagModule, ToastModule, TooltipModule, ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './autorizaciones.component.html',
  styleUrls: ['./autorizaciones.component.scss'],
})
export class AutorizacionesComponent implements OnInit {
  public periodos: PeriodoNominaModel[] = [];
  public periodoSel: number | null = null;
  public empleados: EmpleadoTableModel[] = [];
  public autorizaciones: AutorizacionModel[] = [];
  public loading = false;
  public creando = false;

  public form = { empleadoId: null as number | null, motivo: null as string | null, observacion: '' };

  public motivos = [
    { label: 'Falla del sistema de asistencia', value: 'FALLA_SISTEMA_ASISTENCIA' },
    { label: 'Marcación no disponible', value: 'MARCACION_NO_DISPONIBLE' },
    { label: 'Orden administrativa', value: 'ORDEN_ADMINISTRATIVA' },
    { label: 'Cierre urgente de nómina', value: 'CIERRE_URGENTE_NOMINA' },
    { label: 'Corrección posterior', value: 'CORRECCION_POSTERIOR' },
  ];

  constructor(
    private readonly asistenciaService: AsistenciaService,
    private readonly nominaService: NominaService,
    private readonly alertService: AlertService,
    private readonly confirm: ConfirmationService,
  ) {}

  async ngOnInit(): Promise<void> {
    const [pRes, eRes] = await Promise.all([
      lastValueFrom(this.nominaService.listPeriodos()).catch(() => null),
      lastValueFrom(this.nominaService.pageEmpleados({ page: 0, rows: 500, search: null })).catch(() => null),
    ]);
    this.periodos = (pRes?.data ?? []).filter(p => p.estado !== 'ANULADO');
    this.empleados = eRes?.data?.content ?? [];
  }

  get periodosOpts() {
    return this.periodos.map(p => ({
      label: `${this.fmt(p.fechaInicio)} → ${this.fmt(p.fechaFin)} (${p.estado})`,
      value: p.id,
    }));
  }
  get empleadosOpts() {
    return this.empleados.map(e => ({ label: e.nombreCompleto, value: e.id }));
  }

  async cargar(): Promise<void> {
    if (this.periodoSel == null) return;
    this.loading = true;
    try {
      const res = await lastValueFrom(this.asistenciaService.listAutorizaciones(this.periodoSel));
      this.autorizaciones = res?.data ?? [];
    } catch {
      this.autorizaciones = [];
    } finally {
      this.loading = false;
    }
  }

  async crear(): Promise<void> {
    if (this.periodoSel == null || this.form.empleadoId == null || !this.form.motivo) {
      this.alertService.showWarn('Requerido', 'Período, empleado y motivo son obligatorios');
      return;
    }
    this.creando = true;
    try {
      await lastValueFrom(this.asistenciaService.crearAutorizacion({
        empleadoId: this.form.empleadoId,
        periodoNominaId: this.periodoSel,
        motivo: this.form.motivo,
        observacion: this.form.observacion || null,
      }));
      this.alertService.showSuccess('Registrada', 'Autorización excepcional registrada');
      this.form = { empleadoId: null, motivo: null, observacion: '' };
      await this.cargar();
    } catch (err: any) {
      this.alertService.showError('Error', err?.error?.message ?? 'No se pudo registrar');
    } finally {
      this.creando = false;
    }
  }

  anular(a: AutorizacionModel): void {
    this.confirm.confirm({
      message: `¿Anular la autorización de ${a.empleadoNombre}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, anular',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await lastValueFrom(this.asistenciaService.anularAutorizacion(a.id));
          this.alertService.showSuccess('Anulada', 'Autorización anulada');
          await this.cargar();
        } catch {
          this.alertService.showError('Error', 'No se pudo anular');
        }
      },
    });
  }

  motivoLabel(v: string): string {
    return this.motivos.find(m => m.value === v)?.label ?? v;
  }
  private fmt(f: string): string {
    return new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
