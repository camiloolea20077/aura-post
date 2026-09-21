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
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { FormSerialComponent } from '../form/form-serial.component';
import {
  ESTADO_SERIAL_OPTIONS,
  ESTADO_SEVERITY,
  EstadoSerial,
  SerialProductoTableModel,
  SerialTrazaModel,
  etiquetaEstadoSerial,
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
    DialogModule,
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
    ...ESTADO_SERIAL_OPTIONS,
  ];

  // Trazabilidad
  public trazaVisible = false;
  public trazaBusqueda = '';
  public trazaCargando = false;
  public traza: SerialTrazaModel[] = [];
  public trazaBuscada = false;

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
    return etiquetaEstadoSerial(e);
  }

  abrirTrazabilidad(serial?: string): void {
    this.trazaVisible = true;
    this.trazaBusqueda = serial ?? '';
    this.traza = [];
    this.trazaBuscada = false;
    if (serial) this.buscarTraza();
  }

  async buscarTraza(): Promise<void> {
    const q = this.trazaBusqueda.trim();
    if (q.length < 3) {
      this.alertService.showWarn('Trazabilidad', 'Escribe al menos 3 caracteres del serial');
      return;
    }
    this.trazaCargando = true;
    try {
      const res = await lastValueFrom(this.serialService.trazabilidad(q));
      this.traza = res?.data ?? [];
    } catch (err: any) {
      this.traza = [];
      this.alertService.showError('Error', err?.error?.message ?? 'No se pudo buscar el serial.');
    } finally {
      this.trazaCargando = false;
      this.trazaBuscada = true;
    }
  }

  confirmDelete(item: SerialProductoTableModel): void {
    this.confirmationService.confirm({
      message: `¿Eliminar el serial <strong>${item.serial}</strong>?<br>
                <small>Solo se puede con un serial disponible y sin historial.</small>`,
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
            err?.error?.message ?? 'No se pudo eliminar.',
          );
        }
      },
    });
  }
  getEstadoSeverity(estado: EstadoSerial): TagSeverity {
    return ESTADO_SEVERITY[estado];
  }
}
