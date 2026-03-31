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
import { RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { ModuloTableModel, ModuloModel } from '../models/modulo.model';
import { ModuloService } from '../services/modulo.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { FormModuloComponent } from '../form/form-modulo.component';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-index-modulos',
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
    FormModuloComponent,
    DialogModule,
    RouterModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-modulos.component.html',
  styleUrls: ['./index-modulos.component.scss'],
})
export class IndexModulosComponent implements OnInit {
  rows: ModuloTableModel[] = [];
  totalRows = 0;
  loadingTable = true;
  search = '';
  rowSize = 15;
  lastEvent!: TableLazyLoadEvent;

  showForm = false;
  editTarget: ModuloModel | null = null;

  constructor(
    private readonly service: ModuloService,
    private readonly alertService: AlertService,
    private readonly confirmService: ConfirmationService,
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

    try {
      const res = await lastValueFrom(
        this.service.pageModulos({
          page,
          rows: event.rows ?? this.rowSize,
          search: this.search || null,
        }),
      );
      this.rows = res?.data?.content ?? [];
      this.totalRows = res?.data?.totalElements ?? 0;
    } catch {
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

  private reload(): void {
    if (this.lastEvent) this.loadTable(this.lastEvent);
  }

  nueva(): void {
    this.editTarget = null;
    this.showForm = true;
  }

  async editar(id: number): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.getModuloById(id));
      this.editTarget = res?.data ?? null;
      this.showForm = true;
      this.cdr.markForCheck();
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar el módulo');
    }
  }

  confirmarEliminar(item: ModuloTableModel, event: Event): void {
    event.stopPropagation();
    this.confirmService.confirm({
      target: event.target as EventTarget,
      message: `¿Eliminar <strong>${item.nombre}</strong>? Se eliminarán todos sus submódulos.`,
      header: 'Eliminar módulo',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.eliminar(item.id),
    });
  }

  private async eliminar(id: number): Promise<void> {
    try {
      await lastValueFrom(this.service.deleteModulo(id));
      this.alertService.showSuccess('Eliminado', 'Módulo eliminado');
      this.reload();
    } catch {
      this.alertService.showError('Error', 'No se pudo eliminar');
    }
  }

  async toggleActivo(item: ModuloTableModel, event: Event): Promise<void> {
    event.stopPropagation();
    try {
      await lastValueFrom(
        this.service.updateModulo(item.id, { activo: !item.activo }),
      );
      this.alertService.showSuccess(
        item.activo ? 'Desactivado' : 'Activado',
        `Módulo ${item.activo ? 'desactivado' : 'activado'}`,
      );
      this.reload();
    } catch {
      this.alertService.showError('Error', 'No se pudo cambiar el estado');
    }
  }

  onSaved(): void {
    this.showForm = false;
    this.editTarget = null;
    this.reload();
  }

  verSubmodulos(item: ModuloTableModel, event: Event): void {
    event.stopPropagation();
  }
}
