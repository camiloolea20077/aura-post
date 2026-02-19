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

import { FormPresentacionesComponent } from '../form/form-presentaciones.component';
import {
  PresentacionPageableDto,
  ProductoPresentacionTableModel,
} from '../../../../core/models/producto-presentacion.model';
import { ProductoPresentacionService } from '../../../../core/services/producto-presentacion.service';
import { AlertService } from '../../../../shared/pipes/alert.service';

@Component({
  selector: 'app-index-presentaciones',
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
    FormPresentacionesComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-presentaciones.component.html',
  styleUrls: ['./index-presentaciones.component.scss'],
})
export class IndexPresentacionesComponent implements OnInit {
  public showModal = false;
  public selectedId: number | null = null;
  public modalSlug = 'create';

  public items: ProductoPresentacionTableModel[] = [];
  public loadingTable = true;
  public totalRecords = 0;
  public rowSize = 10;
  public searchQuery = '';
  public lastLazyEvent!: TableLazyLoadEvent;

  constructor(
    private readonly presentacionService: ProductoPresentacionService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {}

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

    const dto: PresentacionPageableDto = {
      page,
      rows: event.rows ?? this.rowSize,
      search: this.searchQuery || null,
      order_by: sortField ?? 'pp.id',
      order: event.sortOrder === 1 ? 'ASC' : 'DESC',
    };

    try {
      const response = await lastValueFrom(this.presentacionService.page(dto));
      this.items = response?.data?.content ?? [];
      this.totalRecords = response?.data?.totalElements ?? 0;
    } catch (err: any) {
      if (err?.status === 206) {
        this.items = [];
        this.totalRecords = 0;
      } else {
        this.alertService.showError(
          'Error',
          'No se pudo cargar las presentaciones.',
        );
        this.items = [];
        this.totalRecords = 0;
      }
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

  openCreate(): void {
    this.selectedId = null;
    this.modalSlug = 'create';
    this.showModal = true;
  }
  openEdit(item: ProductoPresentacionTableModel): void {
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

  confirmDelete(item: ProductoPresentacionTableModel): void {
    this.confirmationService.confirm({
      message: `¿Eliminar la presentación <strong>${item.nombre}</strong> de <strong>${item.productoNombre}</strong>?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          const response = await lastValueFrom(
            this.presentacionService.delete(item.id),
          );
          if (response?.status === 200) {
            this.alertService.showSuccess(
              'Presentación eliminada',
              response.message,
            );
            this.reloadTable();
          }
        } catch (error: any) {
          this.alertService.showError(
            'No se pudo eliminar',
            error?.message ??
              'La presentación puede estar vinculada a precios o ventas.',
          );
        }
      },
    });
  }
}
