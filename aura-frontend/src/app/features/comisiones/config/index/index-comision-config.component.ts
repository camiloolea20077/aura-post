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

import { ComisionService } from '../../../../core/services/comision.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import {
  ComisionConfigModel,
  ComisionConfigTableModel,
} from '../../../../core/models/comision.model';
import { FormComisionConfigComponent } from '../form/form-comision-config.component';

@Component({
  selector: 'app-index-comision-config',
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
    FormComisionConfigComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-comision-config.component.html',
  styleUrls: ['./index-comision-config.component.scss'],
})
export class IndexComisionConfigComponent implements OnInit {
  rows: ComisionConfigTableModel[] = [];
  totalRows = 0;
  loadingTable = true;
  search = '';
  rowSize = 15;
  lastEvent!: TableLazyLoadEvent;

  showForm = false;
  editTarget: ComisionConfigModel | null = null;

  constructor(
    private readonly comisionService: ComisionService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {}

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
        this.comisionService.pageConfig({
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
          'No se pudieron cargar las configuraciones',
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

  nueva(): void {
    this.editTarget = null;
    this.showForm = true;
  }

  async editar(id: number): Promise<void> {
    try {
      const res = await lastValueFrom(this.comisionService.getConfigById(id));
      this.editTarget = res?.data ?? null;
      this.showForm = true;
      this.cdr.markForCheck();
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar la configuración');
    }
  }

  confirmarToggle(item: ComisionConfigTableModel, event: Event): void {
    event.stopPropagation();
    const accion = item.activo ? 'desactivar' : 'activar';
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `¿Deseas ${accion} esta configuración de comisión?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: `Sí, ${accion}`,
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: item.activo ? 'p-button-danger' : 'p-button-success',
      accept: () => this.toggleConfig(item.id),
    });
  }

  private async toggleConfig(id: number): Promise<void> {
    try {
      await lastValueFrom(this.comisionService.toggleConfig(id));
      this.alertService.showSuccess('Actualizado', 'Estado actualizado correctamente');
      this.reloadTable();
    } catch {
      this.alertService.showError('Error', 'No se pudo actualizar el estado');
    }
  }

  onSaved(): void {
    this.showForm = false;
    this.reloadTable();
  }

  getEstadoSeverity(activo: boolean): 'success' | 'secondary' {
    return activo ? 'success' : 'secondary';
  }
}
