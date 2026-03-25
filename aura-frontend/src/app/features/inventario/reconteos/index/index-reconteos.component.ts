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

import { FormReconteoComponent } from '../form/form-reconteo.component';
import {
  EstadoReconteo,
  ReconteoModel,
  ReconteoTableModel,
} from '../../../../core/models/reconteo.model';
import { ReconteoService } from '../../../../core/services/reconteo.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { DetalleReconteoComponent } from '../detalle/detalle-reconteo.component';
type TagSeverity =
  | 'success'
  | 'secondary'
  | 'info'
  | 'warn'
  | 'danger'
  | 'contrast'
  | undefined;

@Component({
  selector: 'app-index-reconteos',
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
    FormReconteoComponent,
    DetalleReconteoComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './index-reconteos.component.html',
  styleUrls: ['./index-reconteos.component.scss'],
})
export class IndexReconeosComponent implements OnInit {
  rows: ReconteoTableModel[] = [];
  totalRows = 0;
  loading = true;
  search = '';
  page = 0;
  pageSize = 10;

  showForm = false;
  showDetalle = false;
  reconteoDetalle: ReconteoModel | null = null;
  loadingDetalle = false;

  constructor(
    private readonly service: ReconteoService,
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

  async verDetalle(r: ReconteoTableModel): Promise<void> {
    this.loadingDetalle = true;
    this.showDetalle = true;
    this.reconteoDetalle = null;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.getById(r.id));
      this.reconteoDetalle = res?.data ?? null;
    } finally {
      this.loadingDetalle = false;
      this.cdr.markForCheck();
    }
  }

  onAprobado(): void {
    this.showDetalle = false;
    this.load();
  }

  onAnulado(): void {
    this.showDetalle = false;
    this.load();
  }

  confirmAnular(r: ReconteoTableModel): void {
    this.confirm.confirm({
      message: `¿Anular el reconteo <b>#${r.id}</b>? No se aplicarán ajustes al inventario.`,
      header: 'Confirmar anulación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, anular',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.anular(r.id),
    });
  }

  async anular(id: number): Promise<void> {
    try {
      await lastValueFrom(this.service.anular(id));
      this.alert.showSuccess(
        'Anulado',
        'El reconteo fue anulado correctamente',
      );
      this.load();
    } catch (err: any) {
      this.alert.showError('Error', err?.error?.message ?? 'No se pudo anular');
    }
  }

  getSeverity(estado: EstadoReconteo): TagSeverity {
    const map: Record<EstadoReconteo, Exclude<TagSeverity, undefined>> = {
      BORRADOR: 'secondary',
      EN_CONTEO: 'warn',
      APROBADO: 'success',
      ANULADO: 'danger',
    };
    return map[estado] ?? 'secondary';
  }

  canAnular(estado: EstadoReconteo): boolean {
    return estado !== 'APROBADO' && estado !== 'ANULADO';
  }
}
