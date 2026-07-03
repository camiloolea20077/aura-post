import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { AsistenciaService } from '../../../core/services/asistencia.service';
import { NominaService } from '../../../core/services/nomina.service';
import {
  AsistenciaDiaModel,
  MarcajeModel,
  TipoMarcaje,
} from '../../../core/models/asistencia.model';
import { EmpleadoTableModel } from '../../../core/models/nomina.model';
import { AlertService } from '../../../shared/pipes/alert.service';

@Component({
  selector: 'app-marcaje',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, DropdownModule,
    CalendarModule, TagModule, ToastModule, TooltipModule,
  ],
  templateUrl: './marcaje.component.html',
  styleUrls: ['./marcaje.component.scss'],
})
export class MarcajeComponent implements OnInit {
  public empleados: EmpleadoTableModel[] = [];
  public empleadoSel: number | null = null;
  public fecha: Date = new Date();

  public marcajes: MarcajeModel[] = [];
  public dia: AsistenciaDiaModel | null = null;
  public loading = false;
  public marcando = false;
  public consolidando = false;

  constructor(
    private readonly asistenciaService: AsistenciaService,
    private readonly nominaService: NominaService,
    private readonly alertService: AlertService,
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const res = await lastValueFrom(
        this.nominaService.pageEmpleados({ page: 0, rows: 500, search: null }),
      );
      this.empleados = res?.data?.content ?? [];
    } catch {
      this.empleados = [];
    }
  }

  get empleadosOpts() {
    return this.empleados.map(e => ({ label: e.nombreCompleto, value: e.id }));
  }

  get fechaStr(): string {
    return this.fecha.toISOString().split('T')[0];
  }

  async cargar(): Promise<void> {
    if (this.empleadoSel == null) return;
    this.loading = true;
    try {
      const [mRes, dRes] = await Promise.all([
        lastValueFrom(this.asistenciaService.listMarcajes(this.empleadoSel, this.fechaStr)),
        lastValueFrom(this.asistenciaService.listDias(this.empleadoSel, this.fechaStr, this.fechaStr)),
      ]);
      this.marcajes = mRes?.data ?? [];
      this.dia = (dRes?.data ?? [])[0] ?? null;
    } catch {
      this.marcajes = [];
      this.dia = null;
    } finally {
      this.loading = false;
    }
  }

  async marcar(tipo: TipoMarcaje): Promise<void> {
    if (this.empleadoSel == null) {
      this.alertService.showWarn('Requerido', 'Selecciona un empleado');
      return;
    }
    this.marcando = true;
    try {
      // Marca en la fecha seleccionada, con la hora actual
      const ahora = new Date();
      const fh = new Date(this.fecha);
      fh.setHours(ahora.getHours(), ahora.getMinutes(), 0, 0);
      await lastValueFrom(this.asistenciaService.registrarMarcaje({
        empleadoId: this.empleadoSel,
        tipoMarcaje: tipo,
        fechaHoraMarcaje: this.toLocalIso(fh),
        origenMarcaje: 'ASISTENTE',
      }));
      this.alertService.showSuccess('Marcado', `Marcaje ${tipo} registrado`);
      await this.cargar();
    } catch {
      this.alertService.showError('Error', 'No se pudo registrar el marcaje');
    } finally {
      this.marcando = false;
    }
  }

  async anular(m: MarcajeModel): Promise<void> {
    try {
      await lastValueFrom(this.asistenciaService.anularMarcaje(m.id));
      this.alertService.showSuccess('Anulado', 'Marcaje anulado');
      await this.cargar();
    } catch {
      this.alertService.showError('Error', 'No se pudo anular');
    }
  }

  async consolidar(): Promise<void> {
    if (this.empleadoSel == null) return;
    this.consolidando = true;
    try {
      const res = await lastValueFrom(
        this.asistenciaService.consolidarDia(this.empleadoSel, this.fechaStr),
      );
      this.dia = res?.data ?? null;
      this.alertService.showSuccess('Consolidado', 'Día consolidado');
    } catch {
      this.alertService.showError('Error', 'No se pudo consolidar el día');
    } finally {
      this.consolidando = false;
    }
  }

  horaSolo(dt: string): string {
    return new Date(dt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }
  hhmm(h: string | null): string {
    return h ? h.substring(0, 5) : '—';
  }
  min(v: number): string {
    return `${v} min`;
  }
  private toLocalIso(d: Date): string {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`;
  }

  estadoAsistSeverity(e: string): 'success' | 'warn' | 'danger' | 'secondary' | 'info' {
    if (e === 'ASISTIO') return 'success';
    if (e === 'TARDE' || e === 'SALIDA_TEMPRANA') return 'warn';
    if (e === 'AUSENTE') return 'danger';
    if (e === 'SIN_MARCAJE_COMPLETO') return 'info';
    return 'secondary';
  }
}
