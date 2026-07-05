import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { ProyectoService } from '../../core/services/proyecto.service';
import { NominaService } from '../../core/services/nomina.service';
import { AlertService } from '../../shared/pipes/alert.service';
import { PreliquidacionFrenteItem } from '../../core/models/asistencia-frente.model';

@Component({
  selector: 'app-preliquidacion-frente',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    DropdownModule,
    TagModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './preliquidacion.component.html',
  styleUrls: ['./preliquidacion.component.scss'],
})
export class PreliquidacionFrenteComponent implements OnInit {
  periodoId: number | null = null;
  proyectoId: number | null = null;
  frenteId: number | null = null;

  periodoOpts: { label: string; value: number }[] = [];
  proyectoOpts: { label: string; value: number | null }[] = [];
  frenteOpts: { label: string; value: number | null }[] = [];

  rows: PreliquidacionFrenteItem[] = [];
  loading = false;

  constructor(
    private readonly service: ProyectoService,
    private readonly nominaService: NominaService,
    private readonly alertService: AlertService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarPeriodos();
    this.cargarProyectos();
  }

  async cargarPeriodos(): Promise<void> {
    try {
      const res = await lastValueFrom(this.nominaService.listPeriodos());
      this.periodoOpts = (res?.data ?? []).map((p) => ({
        label: `${p.fechaInicio} → ${p.fechaFin} (${p.estado})`,
        value: p.id,
      }));
      this.cdr.markForCheck();
    } catch {
      /* no bloqueante */
    }
  }

  async cargarProyectos(): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.list());
      this.proyectoOpts = [
        { label: 'Todos los proyectos', value: null },
        ...(res?.data ?? []).map((p) => ({
          label: `${p.codigo} — ${p.nombre}`,
          value: p.id,
        })),
      ];
      this.cdr.markForCheck();
    } catch {
      /* no bloqueante */
    }
  }

  async onProyectoChange(): Promise<void> {
    this.frenteId = null;
    this.frenteOpts = [{ label: 'Todos los frentes', value: null }];
    if (!this.proyectoId) return;
    try {
      const res = await lastValueFrom(this.service.frentes(this.proyectoId));
      this.frenteOpts = [
        { label: 'Todos los frentes', value: null },
        ...(res?.data ?? []).map((f) => ({
          label: `${f.codigo} — ${f.nombre}`,
          value: f.id,
        })),
      ];
      this.cdr.markForCheck();
    } catch {
      /* no bloqueante */
    }
  }

  async cargar(): Promise<void> {
    if (!this.periodoId) {
      this.alertService.showWarn(
        'Selecciona período',
        'Debes elegir un período de nómina',
      );
      return;
    }
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.preliquidacionFrente(
          this.periodoId,
          this.proyectoId,
          this.frenteId,
        ),
      );
      this.rows = res?.data ?? [];
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo cargar la preliquidación',
      );
      this.rows = [];
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  // ── KPIs ──────────────────────────────────────────────────
  get totalRegistros(): number {
    return this.rows.length;
  }
  get totalTrabajadores(): number {
    return new Set(this.rows.map((r) => r.empleadoId)).size;
  }
  get totalAusencias(): number {
    return this.rows.filter((r) => r.estadoAsistencia === 'NO_ASISTIO').length;
  }
  get totalHorasExtra(): number {
    return this.rows.reduce((s, r) => s + (r.horasExtra ?? 0), 0);
  }

  irALiquidar(): void {
    this.router.navigate(['/nomina/liquidacion']);
  }

  asistenciaSeverity(
    estado: string,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const m: Record<
      string,
      'success' | 'info' | 'warn' | 'danger' | 'secondary'
    > = {
      ASISTIO: 'success',
      NO_ASISTIO: 'danger',
      LLEGO_TARDE: 'warn',
      SALIO_TEMPRANO: 'warn',
      PERMISO: 'info',
      INCAPACIDAD: 'info',
      VACACIONES: 'info',
    };
    return m[estado] ?? 'secondary';
  }
  frenteSeverity(
    estado: string,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    return estado === 'ENVIADO_NOMINA' ? 'success' : 'info';
  }
}
