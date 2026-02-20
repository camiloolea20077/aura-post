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
import { ConfirmationService, MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../shared/pipes/alert.service';
import { FormTrasladoComponent } from '../form/form-traslado.component';
import { DetalleTrasladoComponent } from '../detalle/detalle-traslado.component';
import {
  TrasladoModel,
  TrasladoTableModel,
} from '../../../core/models/traslado.model';
import { TrasladoService } from '../../../core/services/traslado.service';

type TagSeverity =
  | 'success'
  | 'secondary'
  | 'info'
  | 'warn'
  | 'danger'
  | 'contrast'
  | undefined;

@Component({
  selector: 'app-index-traslados',
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
    FormTrasladoComponent,
    DetalleTrasladoComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './index-traslados.component.html',
  styleUrls: ['./index-traslados.component.scss'],
})
export class IndexTrasladosComponent implements OnInit {
  rows: TrasladoTableModel[] = [];
  totalRows = 0;
  loading = true;
  search = '';
  page = 0;
  pageSize = 10;

  showForm = false;
  showDetalle = false;
  trasladoDetalle: TrasladoModel | null = null;
  loadingDetalle = false;

  constructor(
    private readonly service: TrasladoService,
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

  async verDetalle(t: TrasladoTableModel): Promise<void> {
    this.loadingDetalle = true;
    this.showDetalle = true;
    this.trasladoDetalle = null;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.getById(t.id));
      this.trasladoDetalle = res?.data ?? null;
    } finally {
      this.loadingDetalle = false;
      this.cdr.markForCheck();
    }
  }

  confirmAnular(t: TrasladoTableModel): void {
    this.confirm.confirm({
      message: `¿Anular el traslado <b>#${t.id}</b>? El stock volverá a la sucursal de origen.`,
      header: 'Confirmar anulación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, anular',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.anular(t.id),
    });
  }

  async anular(id: number): Promise<void> {
    try {
      await lastValueFrom(this.service.anular(id));
      this.alert.showSuccess(
        'Anulado',
        'El traslado fue anulado y el stock restaurado en origen',
      );
      this.showDetalle = false;
      this.load();
    } catch (err: any) {
      this.alert.showError('Error', err?.error?.message ?? 'No se pudo anular');
    }
  }

  getSeverity(estado: string): TagSeverity {
    const map: Record<string, Exclude<TagSeverity, undefined>> = {
      COMPLETADO: 'success',
      PENDIENTE: 'warn', // 👈 OJO: es 'warn' (no 'warning')
      ANULADO: 'danger',
    };

    return map[estado] ?? 'secondary';
  }
}
