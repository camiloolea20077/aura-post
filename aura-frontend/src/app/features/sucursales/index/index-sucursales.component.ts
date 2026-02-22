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
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { MessageService, ConfirmationService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import { FormSucursalComponent } from '../form/form-sucursal.component';
import {
  SucursalModel,
  SucursalTableModel,
} from '../../../core/models/sucursal.model';
import { SucursalService } from '../../../core/services/sucursal.service';
import { AlertService } from '../../../shared/pipes/alert.service';
@Component({
  selector: 'app-index-sucursales',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ToastModule,
    TooltipModule,
    SkeletonModule,
    ConfirmDialogModule,
    FormSucursalComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-sucursales.component.html',
  styleUrls: ['./index-sucursales.component.scss'],
})
export class IndexSucursalesComponent implements OnInit {
  rows: SucursalTableModel[] = [];
  totalRows = 0;
  loadingTable = true;
  search = '';
  rowSize = 15;
  lastEvent!: TableLazyLoadEvent;

  // Dialog
  showForm = false;
  editTarget: SucursalModel | null = null;

  constructor(
    private readonly sucursalService: SucursalService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    /* table carga por lazy */
  }

  async loadTable(event: TableLazyLoadEvent): Promise<void> {
    this.lastEvent = event;
    this.loadingTable = true;
    const page =
      event.first != null && event.rows
        ? Math.floor(event.first / event.rows)
        : 0;
    const sortField = Array.isArray(event.sortField)
      ? event.sortField[0]
      : event.sortField;

    try {
      const res = await lastValueFrom(
        this.sucursalService.page({
          page,
          rows: event.rows ?? this.rowSize,
          search: this.search || null,
          order_by: sortField ?? 'id',
          order: event.sortOrder === 1 ? 'ASC' : 'DESC',
        }),
      );
      this.rows = res?.data?.content ?? [];
      this.totalRows = res?.data?.totalElements ?? 0;
    } catch (err: any) {
      if (err?.status !== 206)
        this.alertService.showError(
          'Error',
          'No se pudieron cargar las sucursales',
        );
      this.rows = [];
      this.totalRows = 0;
    } finally {
      this.loadingTable = false;
      this.cdr.markForCheck();
    }
  }

  onSearch(): void {
    if (this.lastEvent) this.loadTable({ ...this.lastEvent, first: 0 });
  }
  clearSearch(): void {
    this.search = '';
    this.onSearch();
  }
  private reloadTable(): void {
    if (this.lastEvent) this.loadTable(this.lastEvent);
  }

  // ── CRUD ──────────────────────────────────────────────────
  nueva(): void {
    this.editTarget = null;
    this.showForm = true;
  }

  async editar(id: number): Promise<void> {
    try {
      const res = await lastValueFrom(this.sucursalService.getById(id));
      this.editTarget = res?.data ?? null;
      this.showForm = true;
      this.cdr.markForCheck();
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar la sucursal');
    }
  }

  confirmarEliminar(item: SucursalTableModel, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `¿Desactivar la sucursal <strong>${item.nombre}</strong>?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.eliminar(item.id),
    });
  }

  private async eliminar(id: number): Promise<void> {
    try {
      await lastValueFrom(this.sucursalService.delete(id));
      this.alertService.showSuccess('Desactivada', 'Sucursal desactivada');
      this.reloadTable();
    } catch {
      this.alertService.showError('Error', 'No se pudo desactivar');
    }
  }

  onSaved(): void {
    this.showForm = false;
    this.reloadTable();
  }

  // ── Helpers UI ────────────────────────────────────────────
  getActivaSeverity(activa: boolean): 'success' | 'secondary' {
    return activa ? 'success' : 'secondary';
  }
}
