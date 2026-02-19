import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmationService, MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { FormProductoPrecioComponent } from '../form/form-producto-precio.component';
import {
  ProductoPrecioPageableDto,
  ProductoPrecioTableModel,
} from '../../../../core/models/producto-precio.model';
import { ProductoPrecioService } from '../../../../core/services/producto-precio.service';
import { ListaPreciosService } from '../../../../core/services/lista-precios.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { IFilterTable } from '../../../../shared/utils/filter-table';

@Component({
  selector: 'app-index-producto-precio',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    TableModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    SkeletonModule,
    DropdownModule,
    FormProductoPrecioComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-producto-precio.component.html',
  styleUrls: ['./index-producto-precio.component.scss'],
})
export class IndexProductoPrecioComponent implements OnInit {
  public showModal = false;
  public selectedId: number | null = null;
  public modalSlug = 'create';
  filtersTable!: IFilterTable<any>;
  public items: ProductoPrecioTableModel[] = [];
  public loadingTable = true;
  public totalRecords = 0;
  public rowSize = 15;
  public searchQuery = '';
  public lastLazyEvent!: TableLazyLoadEvent;

  // Filtro por lista
  public listaFiltro: number | null = null;
  public listasOpts: { label: string; value: number | null }[] = [
    { label: 'Todas las listas', value: null },
  ];

  constructor(
    private readonly productoPrecioService: ProductoPrecioService,
    private readonly listaPreciosService: ListaPreciosService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.loadListas();
  }

  private async loadListas(): Promise<void> {
    try {
      const res = await lastValueFrom(this.listaPreciosService.list());
      if (res?.data) {
        this.listasOpts = [
          { label: 'Todas las listas', value: null },
          ...res.data.map((l) => ({ label: l.nombre, value: l.id })),
        ];
      }
    } catch {
      /* no bloquear */
    }
  }

  async loadTable(lazyTable: TableLazyLoadEvent): Promise<void> {
    this.loadingTable = true;
    this.filtersTable = this.prepareTableParams(lazyTable);

    try {
      const response = await lastValueFrom(
        this.productoPrecioService.page(this.filtersTable),
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

  onSearch(): void {
    if (this.lastLazyEvent) this.loadTable({ ...this.lastLazyEvent, first: 0 });
  }
  clearSearch(): void {
    this.searchQuery = '';
    this.onSearch();
  }
  onListaChange(): void {
    this.onSearch();
  }

  openCreate(): void {
    this.selectedId = null;
    this.modalSlug = 'create';
    this.showModal = true;
  }
  openEdit(item: ProductoPrecioTableModel): void {
    this.selectedId = item.id;
    this.modalSlug = 'edit';
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

  confirmDelete(item: ProductoPrecioTableModel): void {
    this.confirmationService.confirm({
      message: `¿Eliminar el precio de <strong>${item.productoNombre}</strong>
                en la lista <strong>${item.listaPrecioNombre}</strong>?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await lastValueFrom(this.productoPrecioService.delete(item.id));
          this.alertService.showSuccess('Precio eliminado', '');
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

  getUtilidadClass(u: number | null): string {
    if (u === null) return '';
    if (u >= 20) return 'util-ok';
    if (u > 0) return 'util-warn';
    return 'util-neg';
  }
}
