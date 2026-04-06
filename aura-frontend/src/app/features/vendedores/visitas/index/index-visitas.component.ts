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
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../../shared/pipes/alert.service';
import { FormVisitaComponent } from '../form/form-visita.component';
import { DetalleVisitaComponent } from '../detalle/detalle-visita.component';
import { VisitaTableModel, EstadoVisita } from '../../models/vendedor.model';
import { VisitaService } from '../services/visita.service';
import { ConfirmarLlegadaComponent } from '../form/confirmar-llegada/confirmar-llegada.component';

@Component({
  selector: 'app-index-visitas',
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
    CalendarModule,
    DropdownModule,
    ConfirmDialogModule,
    ToastModule,
    DialogModule,
    FormVisitaComponent,
    ConfirmarLlegadaComponent,
    DetalleVisitaComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './index-visitas.component.html',
  styleUrls: ['./index-visitas.component.scss'],
})
export class IndexVisitasComponent implements OnInit {
  rows: VisitaTableModel[] = [];
  totalRows = 0;
  loading = true;
  search = '';
  page = 0;
  pageSize = 10;
  maxDistance = 20;

  showForm = false;
  showConfirmar = false;
  showDetalle = false;
  selectedVisita: VisitaTableModel | null = null;
  selectedDetalleId: number | null = null;

  filtroEstado: EstadoVisita | null = null;
  filtroFechaDesde: Date | null = null;
  filtroFechaHasta: Date | null = null;

  opcionesEstado = [
    { label: 'Todos', value: null },
    { label: 'Programada', value: 'PROGRAMADA' },
    { label: 'Completada', value: 'COMPLETADA' },
    { label: 'Cancelada', value: 'CANCELADA' },
  ];

  constructor(
    private readonly service: VisitaService,
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
          params: {
            estado: this.filtroEstado,
            fechaDesde:
              this.filtroFechaDesde?.toISOString().split('T')[0] ?? null,
            fechaHasta:
              this.filtroFechaHasta?.toISOString().split('T')[0] ?? null,
          },
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
    this.selectedVisita = null;
    this.showForm = true;
  }

  onSaved(): void {
    this.showForm = false;
    this.selectedVisita = null;
    this.load();
  }

  onFormClosed(): void {
    this.showForm = false;
    this.selectedVisita = null;
  }

  openConfirmar(visita: VisitaTableModel): void {
    this.selectedVisita = visita;
    this.showConfirmar = true;
  }

  onConfirmado(): void {
    this.showConfirmar = false;
    this.selectedVisita = null;
    this.load();
  }

  onConfirmarClosed(): void {
    this.showConfirmar = false;
    this.selectedVisita = null;
  }

  openDetalle(visita: VisitaTableModel): void {
    this.selectedDetalleId = visita.id;
    this.showDetalle = true;
  }

  onDetalleClosed(): void {
    this.showDetalle = false;
    this.selectedDetalleId = null;
  }

  confirmCancel(visita: VisitaTableModel): void {
    this.confirm.confirm({
      message: `¿Cancelar la visita a <b>${visita.localNombre}</b>?`,
      header: 'Confirmar cancelación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, cancelar',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.cancel(visita.id),
    });
  }

  async cancel(id: number): Promise<void> {
    try {
      await lastValueFrom(this.service.delete(id));
      this.alert.showSuccess('Cancelada', 'Visita cancelada correctamente');
      this.load();
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudo cancelar',
      );
    }
  }

  getSeverity(estado: string): 'warn' | 'success' | 'danger' {
    switch (estado) {
      case 'PROGRAMADA':
        return 'warn';
      case 'COMPLETADA':
        return 'success';
      case 'CANCELADA':
        return 'danger';
      default:
        return 'warn';
    }
  }
}
