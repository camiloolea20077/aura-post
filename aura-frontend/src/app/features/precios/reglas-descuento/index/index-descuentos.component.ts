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

import { FormDescuentosComponent } from '../form/form-descuentos.component';
import {
  DescuentoPageableDto,
  DIAS_LABELS,
  ReglaDescuentoTableModel,
} from '../../../../core/models/regla-descuento.model';
import { ReglaDescuentoService } from '../../../../core/services/regla-descuento.service';
import { AlertService } from '../../../../shared/pipes/alert.service';

@Component({
  selector: 'app-index-descuentos',
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
    FormDescuentosComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-descuentos.component.html',
  styleUrls: ['./index-descuentos.component.scss'],
})
export class IndexDescuentosComponent implements OnInit {
  public showModal = false;
  public selectedId: number | null = null;
  public modalSlug = 'create';

  public items: ReglaDescuentoTableModel[] = [];
  public loadingTable = true;
  public totalRecords = 0;
  public rowSize = 10;
  public searchQuery = '';
  public lastLazyEvent!: TableLazyLoadEvent;

  public readonly DIAS_LABELS = DIAS_LABELS;

  constructor(
    private readonly reglaService: ReglaDescuentoService,
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

    const dto: DescuentoPageableDto = {
      page,
      rows: event.rows ?? this.rowSize,
      search: this.searchQuery || null,
      order_by: sortField ?? 'r.id',
      order: event.sortOrder === 1 ? 'ASC' : 'DESC',
    };

    try {
      const res = await lastValueFrom(this.reglaService.page(dto));
      this.items = res?.data?.content ?? [];
      this.totalRecords = res?.data?.totalElements ?? 0;
    } catch (err: any) {
      if (err?.status !== 206)
        this.alertService.showError(
          'Error',
          'No se pudieron cargar las reglas.',
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

  openCreate(): void {
    this.selectedId = null;
    this.modalSlug = 'create';
    this.showModal = true;
  }
  openEdit(item: ReglaDescuentoTableModel): void {
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

  // ─── Helpers de UI ────────────────────────────────────────
  getAlcance(item: ReglaDescuentoTableModel): string {
    if (item.productoNombre) return item.productoNombre;
    if (item.categoriaNombre) return item.categoriaNombre;
    return 'Todo el catálogo';
  }

  getAlcanceIcon(item: ReglaDescuentoTableModel): string {
    if (item.productoNombre) return 'pi-box';
    if (item.categoriaNombre) return 'pi-folder';
    return 'pi-globe';
  }

  formatFecha(f: string | null): string {
    if (!f) return '—';
    return new Date(f).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  getVigencia(item: ReglaDescuentoTableModel): string {
    if (!item.fechaInicio && !item.fechaFin) return 'Sin límite';
    if (item.fechaInicio && !item.fechaFin)
      return `Desde ${this.formatFecha(item.fechaInicio)}`;
    if (!item.fechaInicio && item.fechaFin)
      return `Hasta ${this.formatFecha(item.fechaFin)}`;
    return `${this.formatFecha(item.fechaInicio)} → ${this.formatFecha(item.fechaFin)}`;
  }

  isVigente(item: ReglaDescuentoTableModel): boolean {
    if (!item.activo) return false;
    const now = new Date();
    if (item.fechaInicio && new Date(item.fechaInicio) > now) return false;
    if (item.fechaFin && new Date(item.fechaFin) < now) return false;
    return true;
  }

  // ─── Eliminar ─────────────────────────────────────────────
  confirmDelete(item: ReglaDescuentoTableModel): void {
    this.confirmationService.confirm({
      message: `¿Desactivar la regla <strong>${item.nombre}</strong>?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          const res = await lastValueFrom(this.reglaService.delete(item.id));
          if (res?.status === 200) {
            this.alertService.showSuccess('Regla eliminada', res.message ?? '');
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
}
