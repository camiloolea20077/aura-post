import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmationService, MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { FormSerialComponent } from '../form/form-serial.component';
import {
  ESTADO_SEVERITY,
  EstadoSerial,
  SerialPageableDto,
  SerialProductoTableModel,
} from '../../../../core/models/serial-producto.model';
import { SerialProductoService } from '../../../../core/services/serial-producto.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { IFilterTable } from '../../../../shared/utils/filter-table';
type TagSeverity =
  | 'success'
  | 'secondary'
  | 'info'
  | 'warn'
  | 'danger'
  | 'contrast'
  | undefined;
@Component({
  selector: 'app-index-seriales',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    SkeletonModule,
    DropdownModule,
    FormSerialComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-seriales.component.html',
  styleUrls: ['./index-seriales.component.scss'],
})
export class IndexSerialesComponent implements OnInit {
  public showModal = false;
  filtersTable!: IFilterTable<any>;
  public items: SerialProductoTableModel[] = [];
  public loadingTable = true;
  public totalRecords = 0;
  public rowSize = 15;
  public searchQuery = '';
  public estadoFiltro: EstadoSerial | null = null;
  public lastLazyEvent!: TableLazyLoadEvent;

  public readonly ESTADO_SEVERITY = ESTADO_SEVERITY;

  public estadoOpts = [
    { label: 'Todos los estados', value: null },
    { label: 'Disponible', value: 'DISPONIBLE' },
    { label: 'Vendido', value: 'VENDIDO' },
    { label: 'Garantía', value: 'GARANTIA' },
  ];

  constructor(
    private readonly serialService: SerialProductoService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {}

  async loadTable(lazyTable: TableLazyLoadEvent): Promise<void> {
    this.loadingTable = true;
    this.lastLazyEvent = lazyTable;
    this.filtersTable = this.prepareTableParams(lazyTable);

    try {
      const response = await lastValueFrom(
        this.serialService.page(this.filtersTable),
      );
      this.items = response.data?.content ?? [];
      this.totalRecords = response.data?.totalElements ?? 0;
      this.loadingTable = false;
    } catch (error) {
      this.items = [];
      this.totalRecords = 0;
      this.loadingTable = false;
    }
  }
  private prepareTableParams(lazyTable: TableLazyLoadEvent): IFilterTable<any> {
    this.rowSize = lazyTable.rows ?? this.rowSize;
    const currentPage = lazyTable.first
      ? Math.floor(lazyTable.first / this.rowSize)
      : 0;
    return {
      page: currentPage,
      rows: this.rowSize,
      search: this.searchQuery || null, // ← tu variable
      estado: this.estadoFiltro ?? undefined, // ← filtro estado
      order: lazyTable.sortOrder === -1 ? 'desc' : 'asc',
      order_by: lazyTable.sortField ?? 'id',
    };
  }

  onSearch(): void {
    if (this.lastLazyEvent) this.loadTable({ ...this.lastLazyEvent, first: 0 });
  }
  clearSearch(): void {
    this.searchQuery = '';
    this.onSearch();
  }
  onEstadoChange(): void {
    this.onSearch();
  }

  openCreate(): void {
    this.showModal = true;
  }
  onModalClosed(): void {
    this.showModal = false;
  }
  onItemSaved(): void {
    this.showModal = false;
    this.reloadTable();
  }
  private reloadTable(): void {
    if (this.lastLazyEvent) this.loadTable(this.lastLazyEvent);
  }

  getEstadoLabel(e: EstadoSerial): string {
    return (
      { DISPONIBLE: 'Disponible', VENDIDO: 'Vendido', GARANTIA: 'Garantía' }[
        e
      ] ?? e
    );
  }

  confirmDelete(item: SerialProductoTableModel): void {
    this.confirmationService.confirm({
      message: `¿Eliminar el serial <strong>${item.serial}</strong>?<br>
                <small>Esta acción es definitiva (hard delete).</small>`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await lastValueFrom(this.serialService.delete(item.id));
          this.alertService.showSuccess('Serial eliminado', '');
          this.reloadTable();
        } catch (err: any) {
          this.alertService.showError(
            'Error',
            err?.message ?? 'No se pudo eliminar.',
          );
        }
      },
    });
  }
  getEstadoSeverity(estado: EstadoSerial): TagSeverity {
    return ESTADO_SEVERITY[estado];
  }
}
