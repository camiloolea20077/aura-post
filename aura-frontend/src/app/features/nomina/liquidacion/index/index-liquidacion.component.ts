import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { DropdownModule } from 'primeng/dropdown';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { DetalleNominaComponent } from '../detail/detalle-nomina.component';
import { NominaService } from '../../../../core/services/nomina.service';
import {
  EstadoNomina,
  NominaPageableDto,
  NominaTableModel,
  PeriodoNominaModel,
} from '../../../../core/models/nomina.model';
import { AlertService } from '../../../../shared/pipes/alert.service';

type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined;

@Component({
  selector: 'app-index-liquidacion',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
    TagModule, ToastModule, TooltipModule, SkeletonModule, DropdownModule,
    DetalleNominaComponent,
  ],
  providers: [MessageService],
  templateUrl: './index-liquidacion.component.html',
  styleUrls: ['./index-liquidacion.component.scss'],
})
export class IndexLiquidacionComponent implements OnInit {
  // Detalle
  public showDetalle = false;
  public selectedNominaId: number | null = null;

  // Tabla
  public items: NominaTableModel[] = [];
  public loadingTable = true;
  public totalRecords = 0;
  public rowSize = 15;
  public searchQuery = '';
  public lastLazyEvent!: TableLazyLoadEvent;

  // Períodos
  public periodos: PeriodoNominaModel[] = [];
  public periodoSeleccionado: PeriodoNominaModel | null = null;
  public loadingPeriodos = false;
  public liquidandoTodos = false;

  constructor(
    private readonly nominaService: NominaService,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.cargarPeriodos();
  }

  async cargarPeriodos(): Promise<void> {
    this.loadingPeriodos = true;
    try {
      const res = await lastValueFrom(this.nominaService.listPeriodos());
      this.periodos = (res?.data ?? []).filter(p => p.estado !== 'ANULADO');
    } catch {
      this.alertService.showError('Error', 'No se pudieron cargar los períodos');
    } finally {
      this.loadingPeriodos = false;
    }
  }

  async loadTable(event: TableLazyLoadEvent): Promise<void> {
    this.lastLazyEvent = event;
    this.loadingTable = true;
    const page = event.first != null && event.rows ? Math.floor(event.first / event.rows) : 0;

    const dto: NominaPageableDto = {
      page,
      rows: event.rows ?? this.rowSize,
      search: this.searchQuery || null,
    };

    try {
      const res = await lastValueFrom(this.nominaService.pageNomina(dto));
      this.items = res?.data?.content ?? [];
      this.totalRecords = res?.data?.totalElements ?? 0;
    } catch (err: any) {
      if (err?.status !== 206)
        this.alertService.showError('Error', 'No se pudieron cargar las nóminas');
      this.items = [];
      this.totalRecords = 0;
    } finally {
      this.loadingTable = false;
    }
  }

  onSearch(): void { if (this.lastLazyEvent) this.loadTable({ ...this.lastLazyEvent, first: 0 }); }
  clearSearch(): void { this.searchQuery = ''; this.onSearch(); }
  private reloadTable(): void { if (this.lastLazyEvent) this.loadTable(this.lastLazyEvent); }

  async liquidarTodos(): Promise<void> {
    if (!this.periodoSeleccionado) {
      this.alertService.showWarn('Período requerido', 'Selecciona un período para liquidar');
      return;
    }
    if (!confirm(`¿Liquidar nómina para todos los empleados activos del período ${this.formatFecha(this.periodoSeleccionado.fechaInicio)} - ${this.formatFecha(this.periodoSeleccionado.fechaFin)}?`)) return;

    this.liquidandoTodos = true;
    try {
      await lastValueFrom(this.nominaService.liquidarTodos(this.periodoSeleccionado.id));
      this.alertService.showSuccess('Liquidado', 'Nómina liquidada para todos los empleados activos');
      this.reloadTable();
    } catch {
      this.alertService.showError('Error', 'No se pudo liquidar la nómina');
    } finally {
      this.liquidandoTodos = false;
    }
  }

  verDetalle(item: NominaTableModel): void {
    this.selectedNominaId = item.id;
    this.showDetalle = true;
  }

  onDetalleClosed(): void { this.showDetalle = false; this.selectedNominaId = null; }
  onNominaActualizada(): void { this.showDetalle = false; this.selectedNominaId = null; this.reloadTable(); }

  formatFecha(f: string): string {
    return new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatMonto(v: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
  }

  estadoLabel(e: EstadoNomina): string {
    const m: Record<EstadoNomina, string> = {
      BORRADOR: 'Borrador', APROBADO: 'Aprobado', PAGADO: 'Pagado', ANULADO: 'Anulado',
    };
    return m[e] ?? e;
  }

  estadoSeverity(e: EstadoNomina): TagSeverity {
    const m: Record<EstadoNomina, TagSeverity> = {
      BORRADOR: 'warn', APROBADO: 'success', PAGADO: 'info', ANULADO: 'danger',
    };
    return m[e];
  }

  periodoLabel(p: PeriodoNominaModel): string {
    return `${this.formatFecha(p.fechaInicio)} → ${this.formatFecha(p.fechaFin)}`;
  }
}
