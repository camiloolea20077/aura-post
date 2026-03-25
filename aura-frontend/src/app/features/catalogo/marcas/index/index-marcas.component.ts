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

import { FormMarcasComponent } from '../form/form-marcas.component';
import {
  MarcaFilterParams,
  MarcaTableModel,
} from '../../../../core/models/marca.model';
import { ColsModel } from '../../../../shared/utils/cols.model';
import { MarcaService } from '../../../../core/services/marca.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { IFilterTable } from '../../../../shared/utils/filter-table';

@Component({
  selector: 'app-index-marcas',
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
    FormMarcasComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-marcas.component.html',
  styleUrls: ['./index-marcas.component.scss'],
})
export class IndexMarcasComponent implements OnInit {
  globalFilter: string = '';
  public showModal = false;
  public selectedId: number | null = null;
  public modalSlug = 'create';
  filtersTable!: IFilterTable<MarcaFilterParams>;
  public items: MarcaTableModel[] = [];
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
      minWidth: '200px',
    },
    {
      field: 'activo',
      header: 'Estado',
      type: 'icon',
      nameClass: 'text-center',
      width: '110px',
    },
  ];

  constructor(
    private readonly marcaService: MarcaService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.loadTable;
  }

  async loadTable(lazyTable: TableLazyLoadEvent): Promise<void> {
    this.lastLazyEvent = lazyTable;
    this.loadingTable = true;
    this.filtersTable = this.prepareTableParams(lazyTable);

    try {
      const response = await lastValueFrom(
        this.marcaService.page(this.filtersTable),
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
  openEdit(item: MarcaTableModel): void {
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

  confirmDelete(item: MarcaTableModel): void {
    this.confirmationService.confirm({
      message: `¿Eliminar la marca <strong>${item.nombre}</strong>?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          const response = await lastValueFrom(
            this.marcaService.delete(item.id),
          );
          if (response?.status === 200) {
            this.alertService.showSuccess('Marca eliminada', response.message);
            this.reloadTable();
          }
        } catch (error: any) {
          this.alertService.showError(
            'No se pudo eliminar',
            error?.message ?? 'La marca puede estar en uso.',
          );
        }
      },
    });
  }
}
