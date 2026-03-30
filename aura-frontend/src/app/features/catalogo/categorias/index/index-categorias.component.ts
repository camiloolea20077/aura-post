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

import { FormCategoriasComponent } from '../form/form-categorias.component';
import {
  CategoriaFilterParams,
  CategoriaTableModel,
} from '../../../../core/models/categoria.model';
import { ColsModel } from '../../../../shared/utils/cols.model';
import { CategoriaService } from '../../../../core/services/categoria.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { IFilterTable } from '../../../../shared/utils/filter-table';

@Component({
  selector: 'app-index-categorias',
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
    FormCategoriasComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-categorias.component.html',
  styleUrls: ['./index-categorias.component.scss'],
})
export class IndexCategoriasComponent implements OnInit {
  filtersTable!: IFilterTable<CategoriaFilterParams>;
  globalFilter: string = '';
  // ─── Modal ───────────────────────────────────────────────
  public showModal = false;
  public selectedId: number | null = null;
  public modalSlug = 'create';

  // ─── Tabla ───────────────────────────────────────────────
  public items: CategoriaTableModel[] = [];
  public loadingTable = true;
  public totalRecords = 0;
  public rowSize = 10;
  public searchQuery = '';
  private lastLazyEvent!: TableLazyLoadEvent;

  // ─── Columnas ────────────────────────────────────────────
  public cols: ColsModel[] = [
    { field: 'nombre', header: 'Nombre', type: 'string', minWidth: '200px' },
    {
      field: 'padrNombre',
      header: 'Categoría padre',
      type: 'string',
      minWidth: '160px',
    },
    {
      field: 'impuestoDefecto',
      header: 'Impuesto %',
      type: 'number',
      nameClass: 'text-right',
      width: '120px',
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
    private readonly categoriaService: CategoriaService,
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
        this.categoriaService.page(this.filtersTable),
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
  private prepareTableParams(
    lazyTable: TableLazyLoadEvent,
  ): IFilterTable<CategoriaFilterParams> {
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

  // ─── Buscar ───────────────────────────────────────────────
  onSearch(): void {
    if (this.lastLazyEvent) {
      this.loadTable({ ...this.lastLazyEvent, first: 0 });
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.onSearch();
  }

  // ─── Abrir modal ──────────────────────────────────────────
  openCreate(): void {
    this.selectedId = null;
    this.modalSlug = 'create';
    this.showModal = true;
  }

  openEdit(item: CategoriaTableModel): void {
    this.selectedId = item.id;
    this.modalSlug = 'edit';
    this.showModal = true;
  }

  // ─── Cerrar modal ─────────────────────────────────────────
  onModalClosed(): void {
    this.showModal = false;
    this.selectedId = null;
  }

  onItemSaved(): void {
    this.showModal = false;
    this.reloadTable();
  }

  private reloadTable(): void {
    if (this.lastLazyEvent) {
      this.loadTable(this.lastLazyEvent);
    }
  }

  // ─── Eliminar ─────────────────────────────────────────────
  confirmDelete(item: CategoriaTableModel): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar la categoría <strong>${item.nombre}</strong>?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteCategoria(item.id),
    });
  }

  private async deleteCategoria(id: number): Promise<void> {
    try {
      const response = await lastValueFrom(this.categoriaService.delete(id));
      if (response?.status === 200) {
        this.alertService.showSuccess('Categoría eliminada', response.message);
        this.reloadTable();
      }
    } catch (error: any) {
      this.alertService.showError(
        'No se pudo eliminar',
        error?.message ?? 'La categoría puede estar en uso.',
      );
    }
  }
  filterGlobal(event: Event) {
    this.loadTable({
      first: 0,
      rows: this.rowSize,
      globalFilter: (event.target as HTMLInputElement)?.value ?? '',
    });
  }
}
