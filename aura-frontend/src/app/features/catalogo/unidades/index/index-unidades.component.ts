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
import { ConfirmationService, MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { FormUnidadesComponent } from '../form/form-unidades.component';
import {
  UnidadMedidaFilterParams,
  UnidadMedidaTableModel,
} from '../../../../core/models/unidad-medida.model';
import { ColsModel } from '../../../../shared/utils/cols.model';
import { UnidadMedidaService } from '../../../../core/services/unidad-medida.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { IFilterTable } from '../../../../shared/utils/filter-table';
@Component({
  selector: 'app-index-unidades',
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
    FormUnidadesComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-unidades.component.html',
  styleUrls: ['./index-unidades.component.scss'],
})
export class IndexUnidadesComponent implements OnInit {
  globalFilter: string = '';
  public showModal = false;
  public selectedId: number | null = null;
  public modalSlug = 'create';
  filtersTable!: IFilterTable<UnidadMedidaFilterParams>;
  public items: UnidadMedidaTableModel[] = [];
  public loadingTable = true;
  public totalRecords = 0;
  public rowSize = 10;
  public searchQuery = '';
  public lastLazyEvent!: TableLazyLoadEvent;

  public cols: ColsModel[] = [
    {
      field: 'nombre',
      header: 'Nombre',
      type: 'string',
      minWidth: '180px',
    },
    {
      field: 'abreviatura',
      header: 'Abreviatura',
      type: 'string',
      width: '130px',
      nameClass: 'text-center',
    },
    {
      field: 'permiteDecimales',
      header: 'Decimales',
      type: 'icon',
      width: '120px',
      nameClass: 'text-center',
    },
    {
      field: 'activo',
      header: 'Estado',
      type: 'icon',
      width: '110px',
      nameClass: 'text-center',
    },
  ];

  constructor(
    private readonly unidadMedidaService: UnidadMedidaService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.loadTable;
  }

  async loadTable(lazyTable: TableLazyLoadEvent): Promise<void> {
    this.loadingTable = true;
    this.filtersTable = this.prepareTableParams(lazyTable);

    try {
      const response = await lastValueFrom(
        this.unidadMedidaService.page(this.filtersTable),
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
      search: lazyTable.globalFilter,
      order: lazyTable.sortOrder === -1 ? 'desc' : 'asc',
      order_by: lazyTable.sortField ?? 'id',
    };
  }
  filterGlobal(event: Event) {
    this.loadTable({
      first: 0,
      rows: this.rowSize,
      globalFilter: (event.target as HTMLInputElement)?.value ?? '',
    });
  }
  onSearch(): void {
    if (this.lastLazyEvent) this.loadTable({ ...this.lastLazyEvent, first: 0 });
  }
  clearSearch(): void {
    this.searchQuery = '';
    this.onSearch();
  }

  openCreate(): void {
    this.selectedId = null;
    this.modalSlug = 'create';
    this.showModal = true;
  }
  openEdit(item: UnidadMedidaTableModel): void {
    this.selectedId = item.id;
    this.modalSlug = 'edit';
    this.showModal = true;
  }

  onModalClosed(): void {
    this.showModal = false;
    this.selectedId = null;
  }
  onItemSaved(): void {
    this.showModal = false;
    this.reloadTable();
  }
  private reloadTable(): void {
    if (this.lastLazyEvent) this.loadTable(this.lastLazyEvent);
  }

  confirmDelete(item: UnidadMedidaTableModel): void {
    this.confirmationService.confirm({
      message: `¿Eliminar la unidad <strong>${item.nombre}</strong>?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          const response = await lastValueFrom(
            this.unidadMedidaService.delete(item.id),
          );
          if (response?.status === 200) {
            this.alertService.showSuccess('Unidad eliminada', response.message);
            this.reloadTable();
          }
        } catch (error: any) {
          this.alertService.showError(
            'No se pudo eliminar',
            error?.message ?? 'La unidad puede estar en uso.',
          );
        }
      },
    });
  }
}
