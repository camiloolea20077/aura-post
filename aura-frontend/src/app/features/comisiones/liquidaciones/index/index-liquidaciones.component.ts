import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { MessageService, ConfirmationService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { ComisionService } from '../../../../core/services/comision.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import {
  ComisionLiquidacionModel,
  ComisionLiquidacionTableModel,
  EstadoLiquidacion,
} from '../../../../core/models/comision.model';
import { DetalleLiquidacionComponent } from '../detalle/detalle-liquidacion.component';
import { FormLiquidacionComponent } from '../form/form-liquidacion.component';
@Component({
  selector: 'app-index-liquidaciones',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    TagModule,
    ToastModule,
    TooltipModule,
    SkeletonModule,
    ConfirmDialogModule,
    DetalleLiquidacionComponent,
    FormLiquidacionComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-liquidaciones.component.html',
  styleUrls: ['./index-liquidaciones.component.scss'],
})
export class IndexLiquidacionesComponent implements OnInit {
  rows: ComisionLiquidacionTableModel[] = [];
  totalRows = 0;
  loadingTable = true;
  rowSize = 15;
  lastEvent!: TableLazyLoadEvent;

  filtroEstado: EstadoLiquidacion | null = null;

  showForm = false;
  showDetalle = false;
  detalleId: number | null = null;

  readonly estadoOptions = [
    { label: 'Todos', value: null },
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'Pagada', value: 'PAGADA' },
  ];

  constructor(
    private readonly comisionService: ComisionService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {}

  async loadTable(event: TableLazyLoadEvent): Promise<void> {
    this.lastEvent = event;
    this.loadingTable = true;
    const page =
      event.first != null && event.rows
        ? Math.floor(event.first / event.rows)
        : 0;
    const sortField = Array.isArray(event.sortField)
      ? event.sortField[0]
      : event.sortField;

    try {
      const res = await lastValueFrom(
        this.comisionService.pageLiquidaciones({
          page,
          rows: event.rows ?? this.rowSize,
          order_by: sortField ?? 'id',
          order: event.sortOrder === 1 ? 'ASC' : 'DESC',
          params: { estado: this.filtroEstado },
        }),
      );
      this.rows = res?.data?.content ?? [];
      this.totalRows = res?.data?.totalElements ?? 0;
    } catch (err: any) {
      if (err?.status !== 206)
        this.alertService.showError(
          'Error',
          'No se pudieron cargar las liquidaciones',
        );
      this.rows = [];
      this.totalRows = 0;
    } finally {
      this.loadingTable = false;
      this.cdr.markForCheck();
    }
  }

  onFiltroChange(): void {
    if (this.lastEvent) this.loadTable({ ...this.lastEvent, first: 0 });
  }

  private reloadTable(): void {
    if (this.lastEvent) this.loadTable(this.lastEvent);
  }

  nueva(): void {
    this.showForm = true;
  }

  verDetalle(id: number, event: Event): void {
    event.stopPropagation();
    this.detalleId = id;
    this.showDetalle = true;
    this.cdr.markForCheck();
  }

  confirmarPagar(item: ComisionLiquidacionTableModel, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `¿Marcar la liquidación de <strong>${item.tecnicoNombre}</strong> por <strong>$${item.valorTotal.toLocaleString('es-CO')}</strong> como PAGADA?`,
      header: 'Confirmar pago',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sí, marcar pagada',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      accept: () => this.marcarPagada(item.id),
    });
  }

  private async marcarPagada(id: number): Promise<void> {
    const fechaPago = new Date().toISOString().split('T')[0];
    try {
      await lastValueFrom(this.comisionService.marcarPagada(id, fechaPago));
      this.alertService.showSuccess(
        'Pagada',
        'Liquidación marcada como pagada',
      );
      this.reloadTable();
    } catch {
      this.alertService.showError('Error', 'No se pudo registrar el pago');
    }
  }

  onSaved(): void {
    this.showForm = false;
    this.reloadTable();
  }

  getEstadoSeverity(estado: EstadoLiquidacion): 'success' | 'warn' {
    return estado === 'PAGADA' ? 'success' : 'warn';
  }

  formatCOP(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }
}
