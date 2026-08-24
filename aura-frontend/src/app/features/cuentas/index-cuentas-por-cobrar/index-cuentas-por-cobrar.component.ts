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
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../shared/pipes/alert.service';
import {
  CuentaCobrarTableModel,
  CuentaCobrarFilters,
} from '../models/cuenta-cobrar.model';
import { CuentaCobrarService } from '../services/cuenta-cobrar.service';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';

import { FormCuentaCobrarComponent } from '../form-cuenta-cobrar/form-cuenta-cobrar.component';
import { DetalleCuentaCobrarComponent } from '../detalle-cuenta-cobrar/detalle-cuenta-cobrar.component';

import { aFechaLocal } from '../../../shared/utils/fecha.util';
type TagSeverity =
  | 'success'
  | 'secondary'
  | 'info'
  | 'warn'
  | 'danger'
  | 'contrast'
  | undefined;

@Component({
  selector: 'app-index-cuentas-por-cobrar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DatePickerModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    TableModule,
    TagModule,
    TooltipModule,
    SelectModule,
    ToastModule,
    InputTextModule,
    FormCuentaCobrarComponent,
    DetalleCuentaCobrarComponent,
  ],
  providers: [MessageService],
  templateUrl: './index-cuentas-por-cobrar.component.html',
  styleUrls: ['./index-cuentas-por-cobrar.component.scss'],
})
export class IndexCuentasPorCobrarComponent implements OnInit {
  rows: CuentaCobrarTableModel[] = [];
  totalRows = 0;
  loading = true;
  search = '';
  page = 0;
  pageSize = 10;
  orderBy: string = 'id';
  order: string = 'desc';

  fechaDesde: Date | null = null;
  fechaHasta: Date | null = null;
  estadoFilter: string | null = null;

  showForm = false;
  showDetalle = false;
  cuentaDetalle: any = null;
  loadingDetalle = false;

  estados = [
    { label: 'Todos', value: null },
    { label: 'Activa', value: 'activa' },
    { label: 'Pagada', value: 'pagada' },
    { label: 'Vencida', value: 'vencida' },
  ];

  constructor(
    private readonly service: CuentaCobrarService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    const filters: CuentaCobrarFilters = {};
    if (this.fechaDesde) {
      filters.fechaDesde = aFechaLocal(this.fechaDesde);
    }
    if (this.fechaHasta) {
      filters.fechaHasta = aFechaLocal(this.fechaHasta);
    }
    if (this.estadoFilter) {
      filters.estado = this.estadoFilter as any;
    }

    try {
      const res = await lastValueFrom(
        this.service.page({
          page: this.page,
          rows: this.pageSize,
          search: this.search || undefined,
          order_by: this.orderBy,
          order: this.order,
          ...filters,
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
    const sortField = Array.isArray(e.sortField) ? e.sortField[0] : e.sortField;
    this.page = e.first / e.rows;
    this.pageSize = e.rows;
    this.orderBy = sortField ?? 'id';
    this.order = e.sortOrder === 1 ? 'DESC' : 'ASC';
    this.load();
  }

  onSearch(): void {
    this.page = 0;
    this.load();
  }

  clearFilters(): void {
    this.fechaDesde = null;
    this.fechaHasta = null;
    this.estadoFilter = null;
    this.search = '';
    this.page = 0;
    this.load();
  }

  nueva(): void {
    this.showForm = true;
  }

  onSaved(): void {
    this.load();
  }

  async verDetalle(c: CuentaCobrarTableModel): Promise<void> {
    this.loadingDetalle = true;
    this.showDetalle = true;
    this.cuentaDetalle = null;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.getById(c.id));
      this.cuentaDetalle = res?.data ?? null;
    } finally {
      this.loadingDetalle = false;
      this.cdr.markForCheck();
    }
  }

  formatCOP = (v: number): string =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);

  getSeverity(estado: string): TagSeverity {
    const map: Record<string, Exclude<TagSeverity, undefined>> = {
      pagada: 'success',
      activa: 'info',
      vencida: 'danger',
    };
    return map[estado] ?? 'secondary';
  }

  getEstadoLabel(estado: string): string {
    const map: Record<string, string> = {
      pagada: 'Pagada',
      activa: 'Activa',
      vencida: 'Vencida',
    };
    return map[estado] ?? estado;
  }
}
