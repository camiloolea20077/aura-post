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
import { FormMermaComponent } from '../form/form-merma.component';
import { DetalleMermaComponent } from '../detalles/detalle-merma.component';
import { MermaModel, MermaTableModel } from '../../../core/models/merma.model';
import { MermaService } from '../../../core/services/merma.service';

@Component({
  selector: 'app-index-mermas',
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
    DetalleMermaComponent,
    FormMermaComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './index-mermas.component.html',
  styleUrls: ['./index-mermas.component.scss'],
})
export class IndexMermasComponent implements OnInit {
  rows: MermaTableModel[] = [];
  totalRows = 0;
  loading = true;
  search = '';
  page = 0;
  pageSize = 10;

  // Dialogs
  showForm = false;
  showDetalle = false;
  mermaDetalle: MermaModel | null = null;
  loadingDetalle = false;

  constructor(
    private readonly service: MermaService,
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

  nueva(): void {
    this.showForm = true;
  }

  onSaved(): void {
    this.load();
  }

  async verDetalle(m: MermaTableModel): Promise<void> {
    this.loadingDetalle = true;
    this.showDetalle = true;
    this.mermaDetalle = null;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.getById(m.id));
      this.mermaDetalle = res?.data ?? null;
    } finally {
      this.loadingDetalle = false;
      this.cdr.markForCheck();
    }
  }

  confirmAnular(m: MermaTableModel): void {
    this.confirm.confirm({
      message: `¿Anular la merma <b>#${m.id}</b>? Esta acción revertirá el stock descontado.`,
      header: 'Confirmar anulación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, anular',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.anular(m.id),
    });
  }

  async anular(id: number): Promise<void> {
    try {
      await lastValueFrom(this.service.anular(id));
      this.alert.showSuccess(
        'Anulada',
        'La merma fue anulada y el stock restaurado',
      );
      this.showDetalle = false;
      this.load();
    } catch (err: any) {
      this.alert.showError('Error', err?.error?.message ?? 'No se pudo anular');
    }
  }

  getSeverity(estado: string): 'success' | 'danger' {
    return estado === 'APROBADA' ? 'success' : 'danger';
  }
  formatCOP = (v: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
}
