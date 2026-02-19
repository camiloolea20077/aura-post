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
import { SidebarModule } from 'primeng/sidebar';
import { ConfirmationService, MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { FormListaPreciosComponent } from '../form/form-lista-precios.component';
import {
  ListaPreciosPageableDto,
  ListaPreciosTableModel,
} from '../../../../core/models/lista-precios.model';
import { ProductoPrecioTableModel } from '../../../../core/models/producto-precio.model';
import { ListaPreciosService } from '../../../../core/services/lista-precios.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { ProductoPrecioService } from '../../../../core/services/producto-precio.service';
import { FormProductoPrecioComponent } from '../../precios-producto/form/form-producto-precio.component';

@Component({
  selector: 'app-index-lista-precios',
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
    SidebarModule,
    FormListaPreciosComponent,
    FormProductoPrecioComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-lista-precios.component.html',
  styleUrls: ['./index-lista-precios.component.scss'],
})
export class IndexListaPreciosComponent implements OnInit {
  // ─── Modal lista ─────────────────────────────────────────
  public showModal = false;
  public selectedId: number | null = null;
  public modalSlug = 'create';

  // ─── Tabla listas ─────────────────────────────────────────
  public items: ListaPreciosTableModel[] = [];
  public loadingTable = true;
  public totalRecords = 0;
  public rowSize = 10;
  public searchQuery = '';
  public lastLazyEvent!: TableLazyLoadEvent;

  // ─── Panel lateral: precios de la lista seleccionada ─────
  public showSidebar = false;
  public listaSeleccionada: ListaPreciosTableModel | null = null;
  public preciosLista: ProductoPrecioTableModel[] = [];
  public loadingPrecios = false;

  // ─── Modal precio ─────────────────────────────────────────
  public showModalPrecio = false;
  public selectedPrecioId: number | null = null;
  public precioModalSlug = 'create';

  constructor(
    private readonly listaPreciosService: ListaPreciosService,
    private readonly productoPrecioService: ProductoPrecioService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {}

  // ─── Tabla ────────────────────────────────────────────────
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

    const dto: ListaPreciosPageableDto = {
      page,
      rows: event.rows ?? this.rowSize,
      search: this.searchQuery || null,
      order_by: sortField ?? 'lp.id',
      order: event.sortOrder === 1 ? 'ASC' : 'DESC',
    };

    try {
      const res = await lastValueFrom(this.listaPreciosService.page(dto));
      this.items = res?.data?.content ?? [];
      this.totalRecords = res?.data?.totalElements ?? 0;
    } catch (err: any) {
      if (err?.status !== 206)
        this.alertService.showError('Error', 'No se pudo cargar las listas.');
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

  // ─── Modal lista ──────────────────────────────────────────
  openCreate(): void {
    this.selectedId = null;
    this.modalSlug = 'create';
    this.showModal = true;
  }
  openEdit(item: ListaPreciosTableModel): void {
    this.selectedId = item.id;
    this.modalSlug = 'edit';
    this.showModal = true;
  }
  onModalClosed(): void {
    this.showModal = false;
  }
  onListaSaved(): void {
    this.showModal = false;
    this.reloadTable();
  }
  private reloadTable(): void {
    if (this.lastLazyEvent) this.loadTable(this.lastLazyEvent);
  }

  // ─── Panel lateral de precios ─────────────────────────────
  async openPrecios(lista: ListaPreciosTableModel): Promise<void> {
    this.listaSeleccionada = lista;
    this.showSidebar = true;
    this.loadingPrecios = true;
    try {
      const res = await lastValueFrom(
        this.productoPrecioService.listByLista(lista.id),
      );
      this.preciosLista = res?.data ?? [];
    } catch {
      this.preciosLista = [];
    } finally {
      this.loadingPrecios = false;
    }
  }

  closeSidebar(): void {
    this.showSidebar = false;
    this.listaSeleccionada = null;
    this.preciosLista = [];
  }

  // ─── Modal precio ─────────────────────────────────────────
  openCrearPrecio(): void {
    this.selectedPrecioId = null;
    this.precioModalSlug = 'create';
    this.showModalPrecio = true;
  }

  openEditarPrecio(p: ProductoPrecioTableModel): void {
    this.selectedPrecioId = p.id;
    this.precioModalSlug = 'edit';
    this.showModalPrecio = true;
  }

  onPrecioModalClosed(): void {
    this.showModalPrecio = false;
  }

  async onPrecioSaved(): Promise<void> {
    this.showModalPrecio = false;
    if (this.listaSeleccionada) await this.openPrecios(this.listaSeleccionada);
  }

  // ─── Eliminar lista ───────────────────────────────────────
  confirmDelete(item: ListaPreciosTableModel): void {
    this.confirmationService.confirm({
      message: `¿Desactivar la lista <strong>${item.nombre}</strong>?<br>
                <small>Los precios registrados en ella se conservarán.</small>`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          const res = await lastValueFrom(
            this.listaPreciosService.delete(item.id),
          );
          if (res?.status === 200) {
            this.alertService.showSuccess('Lista eliminada', res.message);
            this.reloadTable();
          }
        } catch (err: any) {
          this.alertService.showError(
            'Error',
            err?.message ?? 'No se pudo eliminar.',
          );
        }
      },
    });
  }

  // ─── Eliminar precio desde sidebar ────────────────────────
  confirmDeletePrecio(p: ProductoPrecioTableModel): void {
    this.confirmationService.confirm({
      message: `¿Eliminar el precio de <strong>${p.productoNombre} / ${p.productoPresentacionNombre}</strong>?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await lastValueFrom(this.productoPrecioService.delete(p.id));
          this.alertService.showSuccess('Precio eliminado', '');
          if (this.listaSeleccionada)
            await this.openPrecios(this.listaSeleccionada);
        } catch (err: any) {
          this.alertService.showError(
            'Error',
            err?.message ?? 'No se pudo eliminar.',
          );
        }
      },
    });
  }
}
