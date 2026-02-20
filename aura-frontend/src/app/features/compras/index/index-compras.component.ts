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
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { FormCompraComponent } from '../form/form-compra.component';
import {
  CompraPageableDto,
  CompraTableModel,
  EstadoCompra,
} from '../../../core/models/compra.model';
import { CompraService } from '../../../core/services/compra.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { DetalleCompraComponent } from '../detail/detalle-compra.component';

type TagSeverity =
  | 'success'
  | 'secondary'
  | 'info'
  | 'warn'
  | 'danger'
  | 'contrast'
  | undefined;
@Component({
  selector: 'app-index-compras',
  standalone: true,
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
    FormCompraComponent,
    DetalleCompraComponent,
  ],
  providers: [MessageService],
  templateUrl: './index-compras.component.html',
  styleUrls: ['./index-compras.component.scss'],
})
export class IndexComprasComponent implements OnInit {
  // Modal nueva compra
  public showFormModal = false;

  // Sidebar detalle
  public showDetalle = false;
  public selectedCompraId: number | null = null;

  // Tabla
  public items: CompraTableModel[] = [];
  public loadingTable = true;
  public totalRecords = 0;
  public rowSize = 15;
  public searchQuery = '';
  public lastLazyEvent!: TableLazyLoadEvent;

  constructor(
    private readonly compraService: CompraService,
    private readonly alertService: AlertService,
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

    const dto: CompraPageableDto = {
      page,
      rows: event.rows ?? this.rowSize,
      search: this.searchQuery || null,
      order_by: sortField ?? 'c.id',
      order: event.sortOrder === 1 ? 'ASC' : 'DESC',
    };

    try {
      const res = await lastValueFrom(this.compraService.page(dto));
      this.items = res?.data?.content ?? [];
      this.totalRecords = res?.data?.totalElements ?? 0;
    } catch (err: any) {
      if (err?.status !== 206)
        this.alertService.showError(
          'Error',
          'No se pudieron cargar las compras.',
        );
      this.items = [];
      this.totalRecords = 0;
    } finally {
      this.loadingTable = false;
    }
  }

  onSearch(): void {
    if (this.lastLazyEvent) this.loadTable({ ...this.lastLazyEvent, first: 0 });
  }
  clearSearch(): void {
    this.searchQuery = '';
    this.onSearch();
  }
  private reloadTable(): void {
    if (this.lastLazyEvent) this.loadTable(this.lastLazyEvent);
  }

  // ─── Nueva compra ─────────────────────────────────────────
  openForm(): void {
    this.showFormModal = true;
  }
  onFormClosed(): void {
    this.showFormModal = false;
  }
  onCompraSaved(): void {
    this.showFormModal = false;
    this.reloadTable();
  }

  // ─── Detalle ──────────────────────────────────────────────
  verDetalle(item: CompraTableModel): void {
    this.selectedCompraId = item.id;
    this.showDetalle = true;
  }
  onDetalleClosed(): void {
    this.showDetalle = false;
    this.selectedCompraId = null;
  }
  onCompraAnulada(): void {
    this.showDetalle = false;
    this.selectedCompraId = null;
    this.reloadTable();
  }

  // ─── UI helpers ───────────────────────────────────────────
  formatFecha(f: string): string {
    return new Date(f).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  getEstadoSeverity(e: EstadoCompra): TagSeverity {
    return e === 'RECIBIDA' ? 'success' : 'danger';
  }

  getEstadoLabel(e: EstadoCompra): string {
    return e === 'RECIBIDA' ? 'Recibida' : 'Anulada';
  }
}
