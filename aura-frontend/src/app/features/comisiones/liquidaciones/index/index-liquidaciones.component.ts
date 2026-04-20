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
import { DialogModule } from 'primeng/dialog';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { MessageService, ConfirmationService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { ComisionService } from '../../../../core/services/comision.service';
import { CuentaBancariaService } from '../../../../core/services/cuenta-bancaria.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import {
  ComisionLiquidacionTableModel,
  EstadoLiquidacion,
  TipoLiquidacion,
} from '../../../../core/models/comision.model';
import { CuentaBancariaModel } from '../../../../core/models/cuenta-bancaria.model';
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
    DialogModule,
    SelectButtonModule,
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
  filtroTipo: TipoLiquidacion | null = null;

  showForm = false;
  showDetalle = false;
  detalleId: number | null = null;

  // ── Diálogo de pago ──────────────────────────────────────────
  showPagoDialog = false;
  pagoItem: ComisionLiquidacionTableModel | null = null;
  metodoPagoSel = 'EFECTIVO';
  cuentaBancariaIdSel: number | null = null;
  cuentasBancarias: CuentaBancariaModel[] = [];
  loadingCuentas = false;
  submittingPago = false;

  readonly metodoPagoOptions = [
    { label: 'Efectivo',      value: 'EFECTIVO' },
    { label: 'Transferencia', value: 'TRANSFERENCIA' },
    { label: 'Nequi',         value: 'NEQUI' },
    { label: 'Daviplata',     value: 'DAVIPLATA' },
    { label: 'Banco',         value: 'BANCO' },
  ];

  get requiereCuenta(): boolean {
    return this.metodoPagoSel !== 'EFECTIVO';
  }

  readonly estadoOptions = [
    { label: 'Todos', value: null },
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'Pagada', value: 'PAGADA' },
  ];

  readonly tipoOptions = [
    { label: 'Todos', value: null },
    { label: 'Técnico', value: 'TECNICO' },
    { label: 'Vendedor', value: 'VENDEDOR' },
  ];

  constructor(
    private readonly comisionService: ComisionService,
    private readonly cuentaBancariaService: CuentaBancariaService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadCuentas();
  }

  private async loadCuentas(): Promise<void> {
    this.loadingCuentas = true;
    try {
      const res = await lastValueFrom(this.cuentaBancariaService.list());
      this.cuentasBancarias = (res?.data ?? []).filter((c) => c.activa);
    } catch {
      this.cuentasBancarias = [];
    } finally {
      this.loadingCuentas = false;
      this.cdr.markForCheck();
    }
  }

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
          params: { estado: this.filtroEstado, tipo: this.filtroTipo },
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
    this.pagoItem = item;
    this.metodoPagoSel = 'EFECTIVO';
    this.cuentaBancariaIdSel = null;
    this.showPagoDialog = true;
    this.cdr.markForCheck();
  }

  closePagoDialog(): void {
    this.showPagoDialog = false;
    this.pagoItem = null;
    this.cdr.markForCheck();
  }

  async confirmarPagoDialog(): Promise<void> {
    if (!this.pagoItem) return;
    if (this.requiereCuenta && !this.cuentaBancariaIdSel) {
      this.alertService.showWarn('Campo requerido', 'Selecciona la cuenta bancaria');
      return;
    }
    this.submittingPago = true;
    const fechaPago = new Date().toISOString().split('T')[0];
    try {
      await lastValueFrom(
        this.comisionService.marcarPagada(this.pagoItem.id, {
          fechaPago,
          metodoPago: this.metodoPagoSel,
          cuentaBancariaId: this.requiereCuenta ? this.cuentaBancariaIdSel : null,
        }),
      );
      this.alertService.showSuccess('Pagada', 'Liquidación marcada como pagada');
      this.closePagoDialog();
      this.reloadTable();
    } catch (err: any) {
      this.alertService.showError('Error', err?.message ?? 'No se pudo registrar el pago');
    } finally {
      this.submittingPago = false;
      this.cdr.markForCheck();
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
