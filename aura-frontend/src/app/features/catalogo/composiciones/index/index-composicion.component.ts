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

import { FormComposicionComponent } from '../form/form-composicion.component';
import {
  ComposicionPageableDto,
  ProductoComposicionTableModel,
  TipoComposicion,
} from '../../../../core/models/producto-composicion.model';
import { ProductoComposicionService } from '../../../../core/services/producto-composicion.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { IFilterTable } from '../../../../shared/utils/filter-table';

@Component({
  selector: 'app-index-composicion',
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
    FormComposicionComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-composicion.component.html',
  styleUrls: ['./index-composicion.component.scss'],
})
export class IndexComposicionComponent implements OnInit {
  public showModal = false;
  public selectedId: number | null = null;
  public modalSlug = 'create';

  public items: ProductoComposicionTableModel[] = [];
  public loadingTable = true;
  public totalRecords = 0;
  public rowSize = 10;
  public searchQuery = '';
  public lastLazyEvent!: TableLazyLoadEvent;
  filtersTable!: IFilterTable<any>;
  // Filtro por tipo
  public tipoFiltro: TipoComposicion | null = null;
  public tipoOpts = [
    { label: 'Todos los tipos', value: null },
    { label: 'Kit', value: 'KIT' },
    { label: 'Receta', value: 'RECETA' },
  ];

  constructor(
    private readonly composicionService: ProductoComposicionService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {}

  async loadTable(lazyTable: TableLazyLoadEvent): Promise<void> {
    this.loadingTable = true;
    this.filtersTable = this.prepareTableParams(lazyTable);

    try {
      const response = await lastValueFrom(
        this.composicionService.page(this.filtersTable),
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
  onTipoChange(): void {
    this.onSearch();
  }

  openCreate(): void {
    this.selectedId = null;
    this.modalSlug = 'create';
    this.showModal = true;
  }
  openEdit(item: ProductoComposicionTableModel): void {
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

  confirmDelete(item: ProductoComposicionTableModel): void {
    this.confirmationService.confirm({
      message: `¿Eliminar la composición de <strong>${item.productoHijoNombre}</strong>
                en <strong>${item.productoPadreNombre}</strong>?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          const response = await lastValueFrom(
            this.composicionService.delete(item.id),
          );
          if (response?.status === 200) {
            this.alertService.showSuccess(
              'Composición eliminada',
              response.message,
            );
            this.reloadTable();
          }
        } catch (error: any) {
          this.alertService.showError(
            'No se pudo eliminar',
            error?.message ?? 'Error inesperado.',
          );
        }
      },
    });
  }

  getTipoSeverity(tipo: TipoComposicion): 'info' | 'success' {
    return tipo === 'KIT' ? 'info' : 'success';
  }
}
