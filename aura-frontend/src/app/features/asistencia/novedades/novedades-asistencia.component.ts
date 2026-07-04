import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { AsistenciaService } from '../../../core/services/asistencia.service';
import { NominaService } from '../../../core/services/nomina.service';
import { AsistenciaNovedadModel } from '../../../core/models/asistencia.model';
import { PeriodoNominaModel } from '../../../core/models/nomina.model';
import { AlertService } from '../../../shared/pipes/alert.service';

type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined;

@Component({
  selector: 'app-novedades-asistencia',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, DropdownModule,
    TagModule, ToastModule, TooltipModule,
  ],
  templateUrl: './novedades-asistencia.component.html',
  styleUrls: ['./novedades-asistencia.component.scss'],
})
export class NovedadesAsistenciaComponent implements OnInit {
  public periodos: PeriodoNominaModel[] = [];
  public periodoSel: number | null = null;
  public novedades: AsistenciaNovedadModel[] = [];
  public loading = false;
  public generando = false;

  constructor(
    private readonly asistenciaService: AsistenciaService,
    private readonly nominaService: NominaService,
    private readonly alertService: AlertService,
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const res = await lastValueFrom(this.nominaService.listPeriodos());
      this.periodos = (res?.data ?? []).filter(p => p.estado !== 'ANULADO');
    } catch {
      this.periodos = [];
    }
  }

  get periodosOpts() {
    return this.periodos.map(p => ({
      label: `${this.fmt(p.fechaInicio)} → ${this.fmt(p.fechaFin)} (${p.estado})`,
      value: p.id,
    }));
  }

  async cargar(): Promise<void> {
    if (this.periodoSel == null) return;
    this.loading = true;
    try {
      const res = await lastValueFrom(this.asistenciaService.listNovedades(this.periodoSel));
      this.novedades = res?.data ?? [];
    } catch {
      this.novedades = [];
    } finally {
      this.loading = false;
    }
  }

  async generar(): Promise<void> {
    if (this.periodoSel == null) {
      this.alertService.showWarn('Requerido', 'Selecciona un período');
      return;
    }
    this.generando = true;
    try {
      const res = await lastValueFrom(this.asistenciaService.generarNovedades(this.periodoSel));
      const n = res?.data?.length ?? 0;
      this.alertService.showSuccess('Generadas', `${n} novedad(es) generada(s) desde asistencia`);
      await this.cargar();
    } catch (err: any) {
      this.alertService.showError('Error', err?.error?.message ?? 'No se pudieron generar');
    } finally {
      this.generando = false;
    }
  }

  async aprobar(n: AsistenciaNovedadModel): Promise<void> {
    try {
      await lastValueFrom(this.asistenciaService.aprobarNovedad(n.id));
      this.alertService.showSuccess('Aprobada', 'Novedad aprobada');
      await this.cargar();
    } catch (err: any) {
      this.alertService.showError('Error', err?.error?.message ?? 'No se pudo aprobar');
    }
  }

  async rechazar(n: AsistenciaNovedadModel): Promise<void> {
    try {
      await lastValueFrom(this.asistenciaService.rechazarNovedad(n.id));
      this.alertService.showSuccess('Rechazada', 'Novedad rechazada');
      await this.cargar();
    } catch (err: any) {
      this.alertService.showError('Error', err?.error?.message ?? 'No se pudo rechazar');
    }
  }

  async aprobarPendientes(): Promise<void> {
    const pend = this.novedades.filter(n => n.estado === 'PENDIENTE');
    if (pend.length === 0) {
      this.alertService.showWarn('Sin pendientes', 'No hay novedades pendientes');
      return;
    }
    for (const n of pend) {
      try { await lastValueFrom(this.asistenciaService.aprobarNovedad(n.id)); } catch { /* continúa */ }
    }
    this.alertService.showSuccess('Aprobadas', `${pend.length} novedad(es) aprobada(s)`);
    await this.cargar();
  }

  private fmt(f: string): string {
    return new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  estadoSeverity(e: string): TagSeverity {
    const m: Record<string, TagSeverity> = {
      PENDIENTE: 'warn', APROBADA: 'success', RECHAZADA: 'danger', ENVIADA_A_NOMINA: 'info',
    };
    return m[e] ?? 'secondary';
  }
}
