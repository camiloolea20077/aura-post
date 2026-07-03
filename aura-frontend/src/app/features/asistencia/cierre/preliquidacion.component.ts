import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { lastValueFrom } from 'rxjs';

import { AsistenciaService } from '../../../core/services/asistencia.service';
import { NominaService } from '../../../core/services/nomina.service';
import {
  AuditoriaModel,
  PreliquidacionItemModel,
} from '../../../core/models/asistencia.model';
import { PeriodoNominaModel } from '../../../core/models/nomina.model';
import { AlertService } from '../../../shared/pipes/alert.service';

@Component({
  selector: 'app-preliquidacion',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, DropdownModule,
    TabViewModule, TagModule, ToastModule,
  ],
  templateUrl: './preliquidacion.component.html',
  styleUrls: ['./preliquidacion.component.scss'],
})
export class PreliquidacionComponent implements OnInit {
  public activeTab = 0;

  // Preliquidación
  public periodos: PeriodoNominaModel[] = [];
  public periodoSel: number | null = null;
  public items: PreliquidacionItemModel[] = [];
  public loading = false;

  // Auditoría
  public auditoria: AuditoriaModel[] = [];
  public loadingAud = false;

  private alertMeta: Record<string, { label: string; sev: 'danger' | 'warn' | 'info' }> = {
    SIN_LIQUIDAR: { label: 'Sin liquidar', sev: 'info' },
    ASISTENCIA_PENDIENTE: { label: 'Asistencia pendiente', sev: 'danger' },
    INCIDENCIAS_PENDIENTES: { label: 'Incidencias pendientes', sev: 'warn' },
    NOVEDADES_ASISTENCIA_PENDIENTES: { label: 'Novedades pendientes', sev: 'warn' },
    SIN_CONFIGURACION_ARL: { label: 'Sin ARL', sev: 'warn' },
    SIN_TURNO_ASIGNADO: { label: 'Sin turno', sev: 'warn' },
    LIQUIDACION_EXCEPCIONAL: { label: 'Liquidación excepcional', sev: 'info' },
  };

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
    this.cargarAuditoria();
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
      const res = await lastValueFrom(this.asistenciaService.preliquidacion(this.periodoSel));
      this.items = res?.data ?? [];
    } catch {
      this.items = [];
    } finally {
      this.loading = false;
    }
  }

  async cargarAuditoria(): Promise<void> {
    this.loadingAud = true;
    try {
      const res = await lastValueFrom(this.asistenciaService.auditoria());
      this.auditoria = res?.data ?? [];
    } catch {
      this.auditoria = [];
    } finally {
      this.loadingAud = false;
    }
  }

  alertLabel(a: string): string { return this.alertMeta[a]?.label ?? a; }
  alertSev(a: string): 'danger' | 'warn' | 'info' { return this.alertMeta[a]?.sev ?? 'warn'; }

  formatMonto(v: number | null): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v ?? 0);
  }
  private fmt(f: string): string {
    return new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
