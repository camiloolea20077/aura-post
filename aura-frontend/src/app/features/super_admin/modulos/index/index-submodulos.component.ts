import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
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
import { RouterModule, ActivatedRoute } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { SubmoduloTableModel, SubmoduloModel } from '../models/modulo.model';
import { ModuloService } from '../services/modulo.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { FormSubmoduloComponent } from '../form/form-submodulo.component';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-index-submodulos',
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
    FormSubmoduloComponent,
    DialogModule,
    RouterModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-submodulos.component.html',
  styleUrls: ['./index-submodulos.component.scss'],
})
export class IndexSubmodulosComponent implements OnInit {
  @Input() moduloId: number | null = null;

  rows: SubmoduloTableModel[] = [];
  totalRows = 0;
  loadingTable = true;
  search = '';
  rowSize = 15;
  lastEvent!: TableLazyLoadEvent;

  showForm = false;
  editTarget: SubmoduloModel | null = null;

  constructor(
    private readonly service: ModuloService,
    private readonly alertService: AlertService,
    private readonly confirmService: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.moduloId = +id;
    }
  }

  async loadTable(event: TableLazyLoadEvent): Promise<void> {
    this.lastEvent = event;
    this.loadingTable = true;
    const page =
      event.first != null && event.rows
        ? Math.floor(event.first / event.rows)
        : 0;

    try {
      const params: any = {
        page,
        rows: event.rows ?? this.rowSize,
        search: this.search || null,
      };
      if (this.moduloId) {
        params.filters = { moduloId: this.moduloId };
      }

      const res = await lastValueFrom(this.service.pageSubmodulos(params));
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
      const res = await lastValueFrom(this.service.getSubmoduloById(id));
      this.editTarget = res?.data ?? null;
      this.showForm = true;
      this.cdr.markForCheck();
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar el submódulo');
    }
  }

  confirmarEliminar(item: SubmoduloTableModel, event: Event): void {
    event.stopPropagation();
    this.confirmService.confirm({
      target: event.target as EventTarget,
      message: `¿Eliminar <strong>${item.nombre}</strong>?`,
      header: 'Eliminar submódulo',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.eliminar(item.id),
    });
  }

  private async eliminar(id: number): Promise<void> {
    try {
      await lastValueFrom(this.service.deleteSubmodulo(id));
      this.alertService.showSuccess('Eliminado', 'Submódulo eliminado');
      this.reload();
    } catch {
      this.alertService.showError('Error', 'No se pudo eliminar');
    }
  }

  async toggleActivo(item: SubmoduloTableModel, event: Event): Promise<void> {
    event.stopPropagation();
    try {
      await lastValueFrom(
        this.service.updateSubmodulo(item.id, { activo: !item.activo }),
      );
      this.alertService.showSuccess(
        item.activo ? 'Desactivado' : 'Activado',
        `Submódulo ${item.activo ? 'desactivado' : 'activado'}`,
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
}
