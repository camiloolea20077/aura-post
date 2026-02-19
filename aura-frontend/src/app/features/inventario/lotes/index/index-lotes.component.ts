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
import { SidebarModule } from 'primeng/sidebar';
import { CurrencyPipe } from '@angular/common';
import { ConfirmationService, MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { FormLoteComponent } from '../form/form-lote.component';
import {
  diasParaVencer,
  estadoVencimiento,
  LotePageableDto,
  LoteTableModel,
} from '../../../../core/models/lote.model';
import { LoteService } from '../../../../core/services/lote.service';
import { AlertService } from '../../../../shared/pipes/alert.service';

@Component({
  selector: 'app-index-lotes',
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
    FormLoteComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-lotes.component.html',
  styleUrls: ['./index-lotes.component.scss'],
})
export class IndexLotesComponent implements OnInit {
  public showModal = false;

  public items: LoteTableModel[] = [];
  public loadingTable = true;
  public totalRecords = 0;
  public rowSize = 15;
  public searchQuery = '';
  public lastLazyEvent!: TableLazyLoadEvent;

  // Panel por vencer
  public showVencerSidebar = false;
  public porVencerItems: LoteTableModel[] = [];
  public loadingPorVencer = false;

  public readonly diasParaVencer = diasParaVencer;
  public readonly estadoVencimiento = estadoVencimiento;

  constructor(
    private readonly loteService: LoteService,
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

    const dto: LotePageableDto = {
      page,
      rows: event.rows ?? this.rowSize,
      search: this.searchQuery || null,
      order_by: sortField ?? 'l.fecha_vencimiento',
      order: 'ASC',
    };

    try {
      const res = await lastValueFrom(this.loteService.page(dto));
      this.items = res?.data?.content ?? [];
      this.totalRecords = res?.data?.totalElements ?? 0;
    } catch (err: any) {
      if (err?.status !== 206)
        this.alertService.showError(
          'Error',
          'No se pudieron cargar los lotes.',
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

  // ─── Por vencer ───────────────────────────────────────────
  async verPorVencer(): Promise<void> {
    this.showVencerSidebar = true;
    this.loadingPorVencer = true;
    try {
      const res = await lastValueFrom(this.loteService.porVencer());
      this.porVencerItems = res?.data ?? [];
    } catch {
      this.porVencerItems = [];
    } finally {
      this.loadingPorVencer = false;
    }
  }

  // ─── Eliminar ─────────────────────────────────────────────
  confirmDelete(item: LoteTableModel): void {
    this.confirmationService.confirm({
      message: `¿Desactivar el lote <strong>${item.codigoLote}</strong>?<br>
                <small>El stock de este lote ya no estará disponible para ventas.</small>`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await lastValueFrom(this.loteService.delete(item.id));
          this.alertService.showSuccess('Lote desactivado', '');
          this.reloadTable();
        } catch (err: any) {
          this.alertService.showError(
            'Error',
            err?.message ?? 'No se pudo desactivar el lote.',
          );
        }
      },
    });
  }

  // ─── Helpers UI ───────────────────────────────────────────
  getVencimientoClass(lote: LoteTableModel): string {
    return estadoVencimiento(diasParaVencer(lote.fechaVencimiento));
  }

  getVencimientoLabel(lote: LoteTableModel): string {
    const dias = diasParaVencer(lote.fechaVencimiento);
    if (dias === null) return 'Sin fecha';
    if (dias < 0) return `Vencido (${Math.abs(dias)}d)`;
    if (dias === 0) return 'Vence hoy';
    if (dias <= 30) return `${dias}d`;
    const fecha = lote.fechaVencimiento!;
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
