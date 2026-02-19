import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
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

import { FormProductosComponent } from '../form/form-productos.component';
import {
  PageableDto,
  ProductoTableModel,
  TipoProducto,
} from '../../../../core/models/producto.model';
import { ProductoService } from '../../../../core/services/producto.service';
import { AlertService } from '../../../../shared/pipes/alert.service';

@Component({
  selector: 'app-index-productos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    SkeletonModule,
    DropdownModule,
    FormProductosComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-productos.component.html',
  styleUrls: ['./index-productos.component.scss'],
})
export class IndexProductosComponent implements OnInit {
  // ─── Modal ───────────────────────────────────────────────
  public showModal = false;
  public selectedId: number | null = null;
  public modalSlug = 'create';

  // ─── Tabla ───────────────────────────────────────────────
  public items: ProductoTableModel[] = [];
  public loadingTable = true;
  public totalRecords = 0;
  public rowSize = 10;
  public searchQuery = '';
  public sortField = 'p.id';
  public sortOrder = 'DESC';
  public lastLazyEvent!: TableLazyLoadEvent;

  // ─── Filtros extra ────────────────────────────────────────
  public tipoFiltro: TipoProducto | null = null;
  public tipoFiltroOpts = [
    { label: 'Todos los tipos', value: null },
    { label: 'Estándar', value: 'ESTANDAR' },
    { label: 'Kit', value: 'KIT' },
    { label: 'Receta', value: 'RECETA' },
    { label: 'Servicio', value: 'SERVICIO' },
  ];

  constructor(
    private readonly productoService: ProductoService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {}

  // ─── Cargar tabla ─────────────────────────────────────────
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

    const dto: PageableDto = {
      page,
      rows: event.rows ?? this.rowSize,
      search: this.searchQuery || null,
      order_by: sortField ?? 'p.id',
      order: event.sortOrder === 1 ? 'ASC' : 'DESC',
    };

    try {
      const response = await lastValueFrom(this.productoService.page(dto));
      // Backend retorna 206 cuando vacío (GlobalException PARTIAL_CONTENT)
      this.items = response?.data?.content ?? [];
      this.totalRecords = response?.data?.totalElements ?? 0;
    } catch (err: any) {
      // 206 PARTIAL_CONTENT → simplemente vacío, no es un error real
      if (err?.status === 206) {
        this.items = [];
        this.totalRecords = 0;
      } else {
        this.alertService.showError(
          'Error',
          'No se pudo cargar los productos.',
        );
        this.items = [];
        this.totalRecords = 0;
      }
    } finally {
      this.loadingTable = false;
    }
  }

  // ─── Búsqueda / filtros ───────────────────────────────────
  onSearch(): void {
    if (this.lastLazyEvent) this.loadTable({ ...this.lastLazyEvent, first: 0 });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.onSearch();
  }

  onTipoFiltroChange(): void {
    this.onSearch();
  }

  // ─── Modal ────────────────────────────────────────────────
  openCreate(): void {
    this.selectedId = null;
    this.modalSlug = 'create';
    this.showModal = true;
  }
  openEdit(item: ProductoTableModel): void {
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

  // ─── Eliminar ─────────────────────────────────────────────
  confirmDelete(item: ProductoTableModel): void {
    this.confirmationService.confirm({
      message: `¿Eliminar el producto <strong>${item.nombre}</strong>?<br>
                     <small>El producto se desactivará y dejará de aparecer en el POS.</small>`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          const response = await lastValueFrom(
            this.productoService.delete(item.id),
          );
          if (response?.status === 200) {
            this.alertService.showSuccess(
              'Producto eliminado',
              response.message,
            );
            this.reloadTable();
          }
        } catch (error: any) {
          this.alertService.showError(
            'No se pudo eliminar',
            error?.message ?? 'El producto puede tener movimientos asociados.',
          );
        }
      },
    });
  }

  // ─── Helpers template ─────────────────────────────────────
  getTipoSeverity(tipo: TipoProducto): 'info' | 'success' | 'warn' | 'danger' {
    const map: Record<TipoProducto, any> = {
      ESTANDAR: 'info',
      KIT: 'success',
      RECETA: 'warn',
      SERVICIO: 'danger',
    };
    return map[tipo] ?? 'info';
  }

  getTipoLabel(tipo: TipoProducto): string {
    const map: Record<TipoProducto, string> = {
      ESTANDAR: 'Estándar',
      KIT: 'Kit',
      RECETA: 'Receta',
      SERVICIO: 'Servicio',
    };
    return map[tipo] ?? tipo;
  }
}
