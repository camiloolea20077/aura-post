import { Component } from '@angular/core';
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

import { FormRecetaComponent } from '../receta/form-receta.component';
import {
  RecetaResumenTableModel,
  TipoComposicion,
} from '../../../../core/models/producto-composicion.model';
import { ProductoComposicionService } from '../../../../core/services/producto-composicion.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { IFilterTable } from '../../../../shared/utils/filter-table';

/**
 * Listado de composiciones agrupado por producto.
 *
 * Antes mostraba una fila por ingrediente: un negocio con 60 productos
 * compuestos veía cientos de filas sueltas y tenía que editarlas de a una.
 * Ahora cada fila es una receta completa y se edita entera en un solo guardado.
 */
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
    FormRecetaComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-composicion.component.html',
  styleUrls: ['./index-composicion.component.scss'],
})
export class IndexComposicionComponent {
  public showModal = false;
  public selectedPadreId: number | null = null;

  public items: RecetaResumenTableModel[] = [];
  public loadingTable = true;
  public totalRecords = 0;
  public rowSize = 10;
  public searchQuery = '';
  public lastLazyEvent!: TableLazyLoadEvent;
  filtersTable!: IFilterTable<any>;

  constructor(
    private readonly composicionService: ProductoComposicionService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
  ) {}

  async loadTable(lazyTable: TableLazyLoadEvent): Promise<void> {
    this.loadingTable = true;
    this.lastLazyEvent = lazyTable;
    this.filtersTable = this.prepareTableParams(lazyTable);

    try {
      const response = await lastValueFrom(
        this.composicionService.pageRecetas(this.filtersTable),
      );
      this.items = response.data?.content ?? [];
      this.totalRecords = response.data?.totalElements ?? 0;
    } catch {
      this.items = [];
      this.totalRecords = 0;
    } finally {
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

  filterGlobal(event: Event): void {
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
    this.selectedPadreId = null;
    this.showModal = true;
  }

  openEdit(item: RecetaResumenTableModel): void {
    this.selectedPadreId = item.productoPadreId;
    this.showModal = true;
  }

  onModalClosed(): void {
    this.showModal = false;
    this.selectedPadreId = null;
  }

  onRecetaSaved(): void {
    this.showModal = false;
    this.selectedPadreId = null;
    this.reloadTable();
  }

  private reloadTable(): void {
    if (this.lastLazyEvent) this.loadTable(this.lastLazyEvent);
  }

  /**
   * Borrar la receta = guardarla sin componentes. No hay endpoint de borrado
   * masivo porque el guardado por lote ya es un reemplazo total.
   */
  confirmDelete(item: RecetaResumenTableModel): void {
    this.confirmationService.confirm({
      message: `¿Eliminar la receta de <strong>${item.productoPadreNombre}</strong>?
                Se quitarán sus ${item.totalComponentes} ingredientes.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          const response = await lastValueFrom(
            this.composicionService.guardarReceta(item.productoPadreId, {
              tipo: item.tipo,
              rendimiento: item.rendimiento,
              componentes: [],
            }),
          );
          if (response?.status === 200) {
            this.alertService.showSuccess('Receta eliminada', response.message);
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

  /** Margen contra el costo estimado de la receta, para pintar la columna. */
  margen(item: RecetaResumenTableModel): number | null {
    if (!item.precio || item.precio <= 0 || item.costoEstimado === null) {
      return null;
    }
    return ((item.precio - item.costoEstimado) / item.precio) * 100;
  }
}
