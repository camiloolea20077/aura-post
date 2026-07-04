import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { DetalleNominaComponent } from '../detail/detalle-nomina.component';
import { DocumentoPeriodoComponent } from '../documento/documento-periodo.component';
import { NominaService } from '../../../../core/services/nomina.service';
import {
  EstadoPeriodo,
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
    ConfirmDialogModule, DetalleNominaComponent, DocumentoPeriodoComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-liquidacion.component.html',
  styleUrls: ['./index-liquidacion.component.scss'],
})
export class IndexLiquidacionComponent implements OnInit {
  // Detalle de un empleado (nómina individual)
  public showDetalle = false;
  public selectedNominaId: number | null = null;

  // Documento del período (maestro-detalle)
  public showDocumento = false;
  public selectedPeriodoId: number | null = null;

  // Períodos (maestro de la tabla)
  public periodos: PeriodoNominaModel[] = [];
  public loadingPeriodos = true;
  public periodoSeleccionado: PeriodoNominaModel | null = null;
  public liquidandoTodos = false;

  constructor(
    private readonly nominaService: NominaService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.cargarPeriodos();
  }

  get periodosParaLiquidar(): PeriodoNominaModel[] {
    return this.periodos.filter(p => p.estado !== 'ANULADO' && p.estado !== 'PAGADO');
  }

  async cargarPeriodos(): Promise<void> {
    this.loadingPeriodos = true;
    try {
      const res = await lastValueFrom(this.nominaService.listPeriodos());
      this.periodos = res?.data ?? [];
    } catch {
      this.alertService.showError('Error', 'No se pudieron cargar los períodos');
      this.periodos = [];
    } finally {
      this.loadingPeriodos = false;
    }
  }

  liquidarTodos(): void {
    if (!this.periodoSeleccionado) {
      this.alertService.showWarn('Período requerido', 'Selecciona un período para liquidar');
      return;
    }
    const periodo = this.periodoSeleccionado;
    this.confirmationService.confirm({
      message: `¿Liquidar nómina para todos los empleados activos del período ${this.formatFecha(periodo.fechaInicio)} - ${this.formatFecha(periodo.fechaFin)}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, liquidar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        this.liquidandoTodos = true;
        try {
          await lastValueFrom(this.nominaService.liquidarTodos(periodo.id));
          this.alertService.showSuccess('Liquidado', 'Nómina liquidada para todos los empleados activos');
          await this.cargarPeriodos();
          // Abre el documento recién liquidado
          this.abrirDocumento(periodo);
        } catch {
          this.alertService.showError('Error', 'No se pudo liquidar la nómina');
        } finally {
          this.liquidandoTodos = false;
        }
      },
    });
  }

  // ── Documento del período ──
  abrirDocumento(p: PeriodoNominaModel): void {
    this.selectedPeriodoId = p.id;
    this.showDocumento = true;
  }
  onDocumentoClosed(): void {
    this.showDocumento = false;
    this.selectedPeriodoId = null;
  }

  // ── Detalle de empleado (desde dentro del documento) ──
  onVerNomina(nominaId: number): void {
    this.selectedNominaId = nominaId;
    this.showDetalle = true;
  }
  onDetalleClosed(): void { this.showDetalle = false; this.selectedNominaId = null; }
  onNominaActualizada(): void {
    this.showDetalle = false;
    this.selectedNominaId = null;
    // Recarga el documento abierto para reflejar cambios de estado/valores
    if (this.selectedPeriodoId != null) {
      const id = this.selectedPeriodoId;
      this.showDocumento = false;
      setTimeout(() => { this.selectedPeriodoId = id; this.showDocumento = true; }, 0);
    }
    this.cargarPeriodos();
  }

  formatFecha(f: string): string {
    return new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  documentoLabel(p: PeriodoNominaModel): string {
    return `NOM-${p.id}`;
  }

  estadoLabel(e: EstadoPeriodo): string {
    const m: Record<EstadoPeriodo, string> = {
      ABIERTO: 'Abierto', LIQUIDADO: 'Liquidado', PAGADO: 'Pagado', ANULADO: 'Anulado',
    };
    return m[e] ?? e;
  }

  estadoSeverity(e: EstadoPeriodo): TagSeverity {
    const m: Record<EstadoPeriodo, TagSeverity> = {
      ABIERTO: 'success', LIQUIDADO: 'info', PAGADO: 'secondary', ANULADO: 'danger',
    };
    return m[e];
  }

  periodoLabel(p: PeriodoNominaModel): string {
    return `${this.formatFecha(p.fechaInicio)} → ${this.formatFecha(p.fechaFin)}`;
  }
}
