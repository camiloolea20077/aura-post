import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import {
  EstadoPedido,
  PedidoPageableDto,
  PedidoVendedorModel,
  PedidoVendedorTableModel,
  RegistrarCobroDto,
} from '../../../core/models/pedido-vendedor.model';
import { PedidoVendedorService } from '../../../core/services/pedido-vendedor.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { FormPedidoVendedorComponent } from '../nueva-venta/form-pedido-vendedor.component';

type TagSeverity =
  | 'success'
  | 'secondary'
  | 'info'
  | 'warn'
  | 'danger'
  | 'contrast'
  | undefined;

@Component({
  selector: 'app-index-ventas-campo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ToastModule,
    TooltipModule,
    SkeletonModule,
    DialogModule,
    DropdownModule,
    ConfirmDialog,
    FormPedidoVendedorComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-ventas-campo.component.html',
  styleUrls: ['./index-ventas-campo.component.scss'],
})
export class IndexVentasCampoComponent implements OnInit {
  public items: PedidoVendedorTableModel[] = [];
  public loadingTable = true;
  public totalRecords = 0;
  public rowSize = 15;
  public searchQuery = '';
  public filtroEstado: EstadoPedido | null = null;
  public lastLazyEvent!: TableLazyLoadEvent;

  // Modal nueva venta
  public showNueva = false;

  // Modal cobro
  public showCobro = false;
  public pedidoSeleccionado: PedidoVendedorTableModel | null = null;
  public cobro_metodoPago = 'EFECTIVO';
  public cobro_referencia = '';
  public loadingCobro = false;

  // Modal detalle
  public showDetalle = false;
  public pedidoDetalle: PedidoVendedorModel | null = null;
  public loadingDetalle = false;

  // Loading despachar/anular
  public loadingAccion = false;

  public readonly metodosPago = [
    { label: 'Efectivo', value: 'EFECTIVO' },
    { label: 'Tarjeta', value: 'TARJETA' },
    { label: 'Nequi', value: 'NEQUI' },
    { label: 'Transferencia', value: 'TRANSFERENCIA' },
    { label: 'Daviplata', value: 'DAVIPLATA' },
  ];

  public readonly estadosFiltro: {
    label: string;
    value: EstadoPedido | null;
  }[] = [
    { label: 'Todos', value: null },
    { label: 'Pendiente', value: 'PENDIENTE_DESPACHO' },
    { label: 'Despachada', value: 'DESPACHADA' },
    { label: 'Cobrada', value: 'COBRADA' },
    { label: 'Anulada', value: 'ANULADA' },
  ];

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly pedidoService: PedidoVendedorService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {}

  async loadTable(event: TableLazyLoadEvent): Promise<void> {
    this.lastLazyEvent = event;
    this.loadingTable = true;
    const page =
      event.first != null && event.rows
        ? Math.floor(event.first / event.rows)
        : 0;
    const sortField = Array.isArray(event.sortField)
      ? event.sortField[0]
      : event.sortField;
    const dto: PedidoPageableDto = {
      page,
      rows: event.rows ?? this.rowSize,
      search: this.searchQuery || null,
      estado: this.filtroEstado,
      order_by: sortField ?? 'pv.id',
      order: event.sortOrder === 1 ? 'ASC' : 'DESC',
    };
    try {
      const res = await lastValueFrom(this.pedidoService.page(dto));
      this.items = res?.data?.content ?? [];
      this.totalRecords = res?.data?.totalElements ?? 0;
    } catch (err: any) {
      if (err?.status !== 206)
        this.alertService.showError(
          'Error',
          'No se pudieron cargar los pedidos.',
        );
      this.items = [];
      this.totalRecords = 0;
    } finally {
      this.loadingTable = false;
      this.cdr.markForCheck();
    }
  }

  onSearch(): void {
    if (this.lastLazyEvent) this.loadTable({ ...this.lastLazyEvent, first: 0 });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.onSearch();
  }

  setFiltroEstado(estado: EstadoPedido | null): void {
    this.filtroEstado = estado;
    this.onSearch();
  }

  private reloadTable(): void {
    if (this.lastLazyEvent) this.loadTable(this.lastLazyEvent);
  }

  // ── Nueva venta ───────────────────────────────────────────
  abrirNueva(): void {
    this.showNueva = true;
    this.cdr.markForCheck();
  }

  onNuevaModalClosed(): void {
    this.showNueva = false;
    this.cdr.markForCheck();
  }

  onPedidoCreado(): void {
    this.showNueva = false;
    this.reloadTable();
    this.alertService.showSuccess(
      'Pedido creado',
      'El pedido fue registrado correctamente.',
    );
    this.cdr.markForCheck();
  }

  // ── Despachar ─────────────────────────────────────────────
  confirmarDespachar(item: PedidoVendedorTableModel, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      message: `¿Despachar el pedido ${item.numeroPedido ?? '#' + item.id}?`,
      header: 'Confirmar despacho',
      icon: 'pi pi-truck',
      acceptLabel: 'Despachar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-primary',
      accept: () => this.despachar(item),
    });
  }

  private async despachar(item: PedidoVendedorTableModel): Promise<void> {
    this.loadingAccion = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(this.pedidoService.despachar(item.id));
      this.alertService.showSuccess('Despachado', 'El pedido fue despachado.');
      this.reloadTable();
    } catch {
      this.alertService.showError('Error', 'No se pudo despachar el pedido.');
    } finally {
      this.loadingAccion = false;
      this.cdr.markForCheck();
    }
  }

  // ── Anular ────────────────────────────────────────────────
  confirmarAnular(item: PedidoVendedorTableModel, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      message: `¿Anular el pedido ${item.numeroPedido ?? '#' + item.id}? Esta acción no se puede deshacer.`,
      header: 'Confirmar anulación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Anular',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.anular(item),
    });
  }

  private async anular(item: PedidoVendedorTableModel): Promise<void> {
    this.loadingAccion = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(this.pedidoService.anular(item.id));
      this.alertService.showSuccess('Anulado', 'El pedido fue anulado.');
      this.reloadTable();
    } catch {
      this.alertService.showError('Error', 'No se pudo anular el pedido.');
    } finally {
      this.loadingAccion = false;
      this.cdr.markForCheck();
    }
  }

  // ── Cobro ─────────────────────────────────────────────────
  abrirCobro(item: PedidoVendedorTableModel, event: Event): void {
    event.stopPropagation();
    this.pedidoSeleccionado = item;
    this.cobro_metodoPago = 'EFECTIVO';
    this.cobro_referencia = '';
    this.showCobro = true;
    this.cdr.markForCheck();
  }

  async confirmarCobro(): Promise<void> {
    if (!this.pedidoSeleccionado) return;
    this.loadingCobro = true;
    this.cdr.markForCheck();
    const dto: RegistrarCobroDto = {
      metodoPago: this.cobro_metodoPago,
      referencia: this.cobro_referencia || null,
      turnoId: null,
    };
    try {
      await lastValueFrom(
        this.pedidoService.registrarCobro(this.pedidoSeleccionado.id, dto),
      );
      this.alertService.showSuccess(
        'Cobro registrado',
        'El pedido fue marcado como cobrado.',
      );
      this.showCobro = false;
      this.pedidoSeleccionado = null;
      this.reloadTable();
    } catch {
      this.alertService.showError('Error', 'No se pudo registrar el cobro.');
    } finally {
      this.loadingCobro = false;
      this.cdr.markForCheck();
    }
  }

  cerrarCobro(): void {
    this.showCobro = false;
    this.pedidoSeleccionado = null;
    this.cdr.markForCheck();
  }

  // ── Detalle ───────────────────────────────────────────────
  async abrirDetalle(
    item: PedidoVendedorTableModel,
    event: Event,
  ): Promise<void> {
    event.stopPropagation();
    this.pedidoDetalle = null;
    this.showDetalle = true;
    this.loadingDetalle = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.pedidoService.getById(item.id));
      this.pedidoDetalle = res?.data ?? null;
    } catch {
      this.alertService.showError(
        'Error',
        'No se pudo cargar el detalle del pedido.',
      );
      this.showDetalle = false;
    } finally {
      this.loadingDetalle = false;
      this.cdr.markForCheck();
    }
  }

  cerrarDetalle(): void {
    this.showDetalle = false;
    this.pedidoDetalle = null;
    this.cdr.markForCheck();
  }

  // ── Helpers ───────────────────────────────────────────────
  getEstadoSeverity(e: EstadoPedido): TagSeverity {
    const map: Record<EstadoPedido, TagSeverity> = {
      PENDIENTE_DESPACHO: 'warn',
      DESPACHADA: 'info',
      COBRADA: 'success',
      ANULADA: 'danger',
    };
    return map[e] ?? 'secondary';
  }

  getEstadoLabel(e: EstadoPedido): string {
    const map: Record<EstadoPedido, string> = {
      PENDIENTE_DESPACHO: 'Pendiente',
      DESPACHADA: 'Despachada',
      COBRADA: 'Cobrada',
      ANULADA: 'Anulada',
    };
    return map[e] ?? e;
  }

  formatCOP = (v: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v);

  formatFecha(f: string): string {
    return new Date(f).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
