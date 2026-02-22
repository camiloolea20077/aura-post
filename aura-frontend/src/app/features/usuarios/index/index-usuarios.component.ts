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
import {
  UsuarioModel,
  UsuarioTableModel,
} from '../../../core/models/usuario.model';
import { UsuarioService } from '../../../core/services/usuario.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { FormUsuarioComponent } from '../form/form-usuario.component';

@Component({
  selector: 'app-index-usuarios',
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
    FormUsuarioComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-usuarios.component.html',
  styleUrls: ['./index-usuarios.component.scss'],
})
export class IndexUsuariosComponent implements OnInit {
  rows: UsuarioTableModel[] = [];
  totalRows = 0;
  loadingTable = true;
  search = '';
  rowSize = 15;
  lastEvent!: TableLazyLoadEvent;

  // Dialogs
  showForm = false;
  editTarget: UsuarioModel | null = null;

  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    /* lazy */
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
        this.usuarioService.page({
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
          'No se pudieron cargar los usuarios',
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
  nuevo(): void {
    this.editTarget = null;
    this.showForm = true;
  }

  async editar(id: number): Promise<void> {
    try {
      const res = await lastValueFrom(this.usuarioService.getById(id));
      this.editTarget = res?.data ?? null;
      this.showForm = true;
      this.cdr.markForCheck();
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar el usuario');
    }
  }

  confirmarDesactivar(item: UsuarioTableModel, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `¿Desactivar al usuario <strong>${item.username}</strong>?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.desactivar(item.id),
    });
  }

  private async desactivar(id: number): Promise<void> {
    try {
      await lastValueFrom(this.usuarioService.desactivar(id));
      this.alertService.showSuccess('Desactivado', 'Usuario desactivado');
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
  getRolSeverity(rol: string): 'info' | 'warn' | 'success' | 'secondary' {
    switch (rol) {
      case 'SUPER_ADMIN':
        return 'success';
      case 'ADMIN':
        return 'info';
      case 'SUPERVISOR':
        return 'warn';
      default:
        return 'secondary'; // CAJERO
    }
  }

  getActivaSeverity(activo: boolean): 'success' | 'secondary' {
    return activo ? 'success' : 'secondary';
  }
}
