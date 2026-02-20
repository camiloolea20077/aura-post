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

import { FormCajaComponent } from '../form/form-caja.component';
import { CajaService } from '../../../../core/services/caja.service';
import {
  CajaPageableDto,
  CajaTableModel,
} from '../../../../core/models/caja.model';
import { AlertService } from '../../../../shared/pipes/alert.service';

@Component({
  selector: 'app-index-cajas',
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
    FormCajaComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-cajas.component.html',
  styleUrls: ['./index-cajas.component.scss'],
})
export class IndexCajasComponent implements OnInit {
  public showModal = false;
  public selectedId: number | null = null;
  public modalSlug = 'create';

  public items: CajaTableModel[] = [];
  public loadingTable = true;
  public totalRecords = 0;
  public rowSize = 15;
  public searchQuery = '';
  public lastLazyEvent!: TableLazyLoadEvent;

  constructor(
    private readonly cajaService: CajaService,
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
    const dto: CajaPageableDto = {
      page,
      rows: event.rows ?? this.rowSize,
      search: this.searchQuery || null,
      order_by: sortField ?? 'c.id',
      order: event.sortOrder === 1 ? 'ASC' : 'DESC',
    };
    try {
      const res = await lastValueFrom(this.cajaService.page(dto));
      this.items = res?.data?.content ?? [];
      this.totalRecords = res?.data?.totalElements ?? 0;
    } catch (err: any) {
      if (err?.status !== 206)
        this.alertService.showError(
          'Error',
          'No se pudieron cargar las cajas.',
        );
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
  private reloadTable(): void {
    if (this.lastLazyEvent) this.loadTable(this.lastLazyEvent);
  }

  openCreate(): void {
    this.selectedId = null;
    this.modalSlug = 'create';
    this.showModal = true;
  }
  openEdit(item: CajaTableModel): void {
    this.selectedId = item.id;
    this.modalSlug = 'edit';
    this.showModal = true;
  }
  onModalClosed(): void {
    this.showModal = false;
  }
  onCajaSaved(): void {
    this.showModal = false;
    this.reloadTable();
  }

  confirmDelete(item: CajaTableModel): void {
    this.confirmationService.confirm({
      message: `¿Desactivar la caja <strong>${item.nombre}</strong>?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await lastValueFrom(this.cajaService.delete(item.id));
          this.alertService.showSuccess('Caja desactivada', '');
          this.reloadTable();
        } catch (err: any) {
          this.alertService.showError(
            'Error',
            err?.message ?? 'No se pudo desactivar.',
          );
        }
      },
    });
  }
}
