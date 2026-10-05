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
import { UsuarioTableModel } from '../../../core/models/usuario.model';
import { UsuarioService } from '../../../core/services/usuario.service';
import { AlertService } from '../../../shared/pipes/alert.service';

import { PuedeDirective } from '../../../shared/directives/puede.directive';
import { Router } from '@angular/router';

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

    PuedeDirective,
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

  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router,
  ) {}

  /** Perfil y excepciones del usuario (docs/PLAN_PERMISOS.md). */
  permisos(id: number): void {
    this.router.navigate(['/admin/usuarios', id], {
      queryParams: { tab: 'permisos' },
    });
  }

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
  // El usuario se crea y edita en su propia página con pestañas.
  nuevo(): void {
    this.router.navigate(['/admin/usuarios/nuevo']);
  }

  editar(id: number): void {
    this.router.navigate(['/admin/usuarios', id]);
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
