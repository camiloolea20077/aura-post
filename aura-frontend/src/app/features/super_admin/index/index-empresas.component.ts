// ─── index-empresas.component.ts ─────────────────────────────
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
import {
  EmpresaTableModel,
} from '../../../core/models/platform.model';
import { PlatformService } from '../../../core/services/platform.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-index-empresas',
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
    RouterModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-empresas.component.html',
  styleUrls: ['./index-empresas.component.scss'],
})
export class IndexEmpresasComponent implements OnInit {
  rows: EmpresaTableModel[] = [];
  totalRows = 0;
  loadingTable = true;
  search = '';
  rowSize = 15;
  lastEvent!: TableLazyLoadEvent;

  constructor(
    private readonly platformService: PlatformService,
    private readonly alertService: AlertService,
    private readonly confirmService: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router,
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
        this.platformService.page({
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
    this.router.navigate(['/platform/empresas/nueva']);
  }

  editar(id: number): void {
    this.router.navigate(['/platform/empresas', id, 'editar']);
  }

  confirmarSuspender(item: EmpresaTableModel, event: Event): void {
    event.stopPropagation();
    this.confirmService.confirm({
      target: event.target as EventTarget,
      message: `¿Suspender <strong>${item.razonSocial}</strong>? Los usuarios no podrán acceder.`,
      header: 'Suspender empresa',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, suspender',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.suspender(item.id),
    });
  }

  private async suspender(id: number): Promise<void> {
    try {
      await lastValueFrom(this.platformService.suspender(id));
      this.alertService.showSuccess('Suspendida', 'Empresa suspendida');
      this.reload();
    } catch {
      this.alertService.showError('Error', 'No se pudo suspender');
    }
  }

  async activar(id: number, event: Event): Promise<void> {
    event.stopPropagation();
    try {
      await lastValueFrom(this.platformService.activar(id));
      this.alertService.showSuccess('Activada', 'Empresa activada');
      this.reload();
    } catch {
      this.alertService.showError('Error', 'No se pudo activar');
    }
  }

  gestionarPermisos(item: EmpresaTableModel, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/platform/permisos', item.id]);
  }

  formatFecha(iso: string): string {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
