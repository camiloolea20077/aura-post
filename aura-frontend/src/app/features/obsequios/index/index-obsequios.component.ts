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
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../shared/pipes/alert.service';
import { FormObsequioComponent } from '../form/form-obsequio.component';
import { DetalleObsequioComponent } from '../detalles/detalle-obsequio.component';
import {
  MOTIVOS_OBSEQUIO,
  ObsequioModel,
  ObsequioTableModel,
} from '../../../core/models/obsequio.model';
import { ObsequioService } from '../../../core/services/obsequio.service';

@Component({
  selector: 'app-index-obsequios',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    TagModule,
    TooltipModule,
    ConfirmDialogModule,
    ToastModule,
    DialogModule,
    DetalleObsequioComponent,
    FormObsequioComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './index-obsequios.component.html',
  styleUrls: ['./index-obsequios.component.scss'],
})
export class IndexObsequiosComponent implements OnInit {
  rows: ObsequioTableModel[] = [];
  totalRows = 0;
  loading = true;
  search = '';
  page = 0;
  pageSize = 10;

  showForm = false;
  showDetalle = false;
  obsequioDetalle: ObsequioModel | null = null;
  loadingDetalle = false;

  constructor(
    private readonly service: ObsequioService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      const res = await lastValueFrom(
        this.service.page({
          page: this.page,
          rows: this.pageSize,
          search: this.search || null,
        }),
      );
      this.rows = res?.data?.content ?? [];
      this.totalRows = res?.data?.totalElements ?? 0;
    } catch {
      this.rows = [];
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  onPage(e: any): void {
    this.page = e.first / e.rows;
    this.pageSize = e.rows;
    this.load();
  }

  onSearch(): void {
    this.page = 0;
    this.load();
  }

  nuevo(): void {
    this.showForm = true;
  }

  onSaved(): void {
    this.load();
  }

  async verDetalle(o: ObsequioTableModel): Promise<void> {
    this.loadingDetalle = true;
    this.showDetalle = true;
    this.obsequioDetalle = null;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.getById(o.id));
      this.obsequioDetalle = res?.data ?? null;
    } finally {
      this.loadingDetalle = false;
      this.cdr.markForCheck();
    }
  }

  confirmAnular(o: ObsequioTableModel): void {
    this.confirm.confirm({
      message: `¿Anular el obsequio <b>#${o.id}</b>? Se devolverá el stock entregado y se reversará el asiento contable.`,
      header: 'Confirmar anulación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, anular',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.anular(o.id),
    });
  }

  async anular(id: number): Promise<void> {
    try {
      await lastValueFrom(this.service.anular(id));
      this.alert.showSuccess(
        'Anulado',
        'El obsequio fue anulado y el stock restaurado',
      );
      this.showDetalle = false;
      this.load();
    } catch (err: any) {
      this.alert.showError('Error', err?.error?.message ?? 'No se pudo anular');
    }
  }

  getSeverity(estado: string): 'success' | 'danger' {
    return estado === 'APROBADO' ? 'success' : 'danger';
  }

  motivoLabel(motivo: string): string {
    return MOTIVOS_OBSEQUIO.find((m) => m.value === motivo)?.label ?? motivo;
  }

  formatCOP = (v: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
}
