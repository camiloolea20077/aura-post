import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';

import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../../shared/pipes/alert.service';
import { FechaEsPipe } from '../../../../shared/pipes/fecha-es.pipe';
import { aFechaLocal } from '../../../../shared/utils/fecha.util';
import { AnularNotaDialogComponent } from '../anular/anular-nota-dialog.component';
import {
  CLASIFICACIONES,
  ClasificacionNota,
  clasificacionLabel,
  EstadoNota,
  NotaContableTableModel,
} from '../models/nota-contable.model';
import { NotaContableService } from '../services/nota-contable.service';

@Component({
  selector: 'app-index-notas-contables',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CalendarModule,
    ConfirmDialogModule,
    DropdownModule,
    InputTextModule,
    TableModule,
    TagModule,
    ToastModule,
    TooltipModule,
    AnularNotaDialogComponent,
    FechaEsPipe,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-notas-contables.component.html',
  styleUrls: ['./index-notas-contables.component.scss'],
})
export class IndexNotasContablesComponent {
  rows: NotaContableTableModel[] = [];
  totalRows = 0;
  loading = false;
  page = 0;
  pageSize = 10;

  searchQuery = '';
  estado: EstadoNota | null = null;
  clasificacion: ClasificacionNota | null = null;
  readonly clasificacionOpts = [
    { label: 'Todas las clases', value: null },
    ...CLASIFICACIONES,
  ];
  readonly clasificacionLabel = clasificacionLabel;
  fechaDesde: Date | null = null;
  fechaHasta: Date | null = null;
  private searchTimer?: ReturnType<typeof setTimeout>;

  readonly estadoOpts = [
    { label: 'Todos los estados', value: null },
    { label: 'Borradores', value: 'BORRADOR' },
    { label: 'Contabilizadas', value: 'CONTABILIZADO' },
    { label: 'Anuladas', value: 'ANULADO' },
  ];

  // Anulación
  showAnular = false;
  anularId: number | null = null;
  anularNumero: string | null = null;

  constructor(
    private readonly service: NotaContableService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  async load(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.page({
          page: this.page,
          rows: this.pageSize,
          search: this.searchQuery || null,
          params: {
            estado: this.estado,
            clasificacion: this.clasificacion,
            fechaDesde: aFechaLocal(this.fechaDesde),
            fechaHasta: aFechaLocal(this.fechaHasta),
          },
        }),
      );
      this.rows = res?.data?.content ?? [];
      this.totalRows = res?.data?.totalElements ?? 0;
    } catch {
      // Sin registros el backend responde 206 y llega como error.
      this.rows = [];
      this.totalRows = 0;
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  onLazyLoad(e: any): void {
    this.pageSize = e.rows ?? this.pageSize;
    this.page = Math.floor((e.first ?? 0) / this.pageSize);
    this.load();
  }

  onSearch(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.aplicarFiltros(), 300);
  }

  clearSearch(): void {
    if (!this.searchQuery) return;
    this.searchQuery = '';
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    this.page = 0;
    this.load();
  }

  plantillas(): void {
    this.router.navigate(['/contabilidad/notas/plantillas']);
  }

  nueva(): void {
    this.router.navigate(['/contabilidad/notas/nueva']);
  }

  abrir(n: NotaContableTableModel): void {
    this.router.navigate(['/contabilidad/notas', n.id]);
  }

  contabilizar(n: NotaContableTableModel): void {
    this.confirm.confirm({
      header: 'Contabilizar nota',
      message:
        'La nota recibe su consecutivo CD y queda en los libros. Después ya no se podrá editar, solo anular. ¿Continuar?',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sí, contabilizar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        try {
          const res = await lastValueFrom(this.service.contabilizar(n.id));
          this.alert.showSuccess('Nota contabilizada', res?.message ?? '');
          this.load();
        } catch (e: any) {
          this.alert.showError(
            'No se pudo contabilizar',
            e?.error?.message ?? 'Intente de nuevo',
          );
        }
      },
    });
  }

  eliminar(n: NotaContableTableModel): void {
    this.confirm.confirm({
      header: 'Eliminar borrador',
      message: `¿Eliminar el borrador "${n.descripcion}"? No afecta la contabilidad ni la numeración.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await lastValueFrom(this.service.eliminar(n.id));
          this.alert.showSuccess('Borrador eliminado', '');
          this.load();
        } catch (e: any) {
          this.alert.showError(
            'No se pudo eliminar',
            e?.error?.message ?? 'Intente de nuevo',
          );
        }
      },
    });
  }

  abrirAnular(n: NotaContableTableModel): void {
    this.anularId = n.id;
    this.anularNumero = n.numeroComprobante;
    this.showAnular = true;
  }

  descuadrada(n: NotaContableTableModel): boolean {
    return Math.abs((n.totalDebito ?? 0) - (n.totalCredito ?? 0)) >= 0.01;
  }

  estadoLabel(e: EstadoNota): string {
    return e === 'BORRADOR'
      ? 'Borrador'
      : e === 'CONTABILIZADO'
        ? 'Contabilizada'
        : 'Anulada';
  }

  estadoSeverity(e: EstadoNota): 'warn' | 'success' | 'secondary' {
    return e === 'BORRADOR'
      ? 'warn'
      : e === 'CONTABILIZADO'
        ? 'success'
        : 'secondary';
  }

  formatCOP = (v: number): string =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
}
