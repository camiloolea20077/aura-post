import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { GastoService } from '../../../core/services/gasto.service';
import { GastoTableModel } from '../../../core/models/gasto.model';
import { AlertService } from '../../../shared/pipes/alert.service';
import { FormGastoComponent } from '../form/form-gasto.component';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-index-gastos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    TagModule,
    SkeletonModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    FormGastoComponent,
    IconFieldModule,
    InputIconModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-gastos.component.html',
  styleUrls: ['./index-gastos.component.scss'],
})
export class IndexGastosComponent implements OnInit {
  items: GastoTableModel[] = [];
  totalRecords = 0;
  rowSize = 10;
  loadingTable = false;
  searchQuery = '';
  private searchTimer?: ReturnType<typeof setTimeout>;
  private lastEvent?: TableLazyLoadEvent;

  // Modal form
  showForm = false;
  gastoToEdit: GastoTableModel | null = null;

  // Totales resumen
  totalDeducibles = 0;
  totalNoDeducibles = 0;

  constructor(
    private readonly gastoService: GastoService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {}

  loadTable(event: TableLazyLoadEvent): void {
    this.lastEvent = event;
    const page = Math.floor((event.first ?? 0) / (event.rows ?? this.rowSize));
    this.loadData(page, event.rows ?? this.rowSize);
  }

  onSearch(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.reloadTable(), 400);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.reloadTable();
  }

  reloadTable(): void {
    const page = this.lastEvent
      ? Math.floor(
          (this.lastEvent.first ?? 0) / (this.lastEvent.rows ?? this.rowSize),
        )
      : 0;
    this.loadData(page, this.lastEvent?.rows ?? this.rowSize);
  }

  private async loadData(page: number, rows: number): Promise<void> {
    this.loadingTable = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.gastoService.page({
          page,
          rows: rows as number,
          search: this.searchQuery,
        }),
      );
      this.items = res?.data?.content ?? [];
      this.totalRecords = res?.data?.totalElements ?? 0;
      this.calcularResumen();
    } catch {
      this.alertService.showError('Error', 'No se pudieron cargar los gastos.');
    } finally {
      this.loadingTable = false;
      this.cdr.markForCheck();
    }
  }

  private calcularResumen(): void {
    this.totalDeducibles = this.items
      .filter((g) => g.deducible)
      .reduce((s, g) => s + (g.monto ?? 0), 0);
    this.totalNoDeducibles = this.items
      .filter((g) => !g.deducible)
      .reduce((s, g) => s + (g.monto ?? 0), 0);
  }

  openForm(): void {
    this.gastoToEdit = null;
    this.showForm = true;
  }

  editarGasto(item: GastoTableModel): void {
    this.gastoToEdit = item;
    this.showForm = true;
  }

  eliminarGasto(item: GastoTableModel): void {
    this.confirmationService.confirm({
      message: `¿Eliminar el gasto "${item.categoria}" por ${this.formatCOP(item.monto)}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-trash',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await lastValueFrom(this.gastoService.delete(item.id));
          this.alertService.showSuccess('Eliminado', 'Gasto eliminado.');
          this.reloadTable();
        } catch {
          this.alertService.showError('Error', 'No se pudo eliminar el gasto.');
        }
      },
    });
  }

  onFormClosed(): void {
    this.showForm = false;
  }
  onSaved(): void {
    this.showForm = false;
    this.reloadTable();
  }

  formatCOP(v: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }

  formatFecha(f: string): string {
    if (!f) return '—';
    return new Date(f + 'T00:00:00').toLocaleDateString('es-CO');
  }
}
