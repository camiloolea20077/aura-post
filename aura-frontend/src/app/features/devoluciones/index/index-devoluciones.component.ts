import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { lastValueFrom, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import {
  DevolucionTableModel,
  DevolucionPageableDto,
} from '../../../core/models/devolucion.model';
import { DevolucionService } from '../../../core/services/devolucion.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { CreateDevolucionComponent } from '../create/create-devolucion.component';
import { DetalleDevolucionComponent } from '../detalle/detalle-devolucion.component';

type TagSeverity =
  | 'success'
  | 'secondary'
  | 'info'
  | 'warn'
  | 'danger'
  | 'contrast'
  | undefined;

@Component({
  selector: 'app-index-devoluciones',
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
    CreateDevolucionComponent,
    DetalleDevolucionComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-devoluciones.component.html',
  styleUrls: ['./index-devoluciones.component.scss'],
})
export class IndexDevolucionesComponent implements OnInit {
  public items: DevolucionTableModel[] = [];
  public loadingTable = true;
  public totalRecords = 0;
  public rowSize = 15;
  public searchQuery = '';
  public lastLazyEvent!: TableLazyLoadEvent;

  public showDetalle = false;
  public selectedId: number | null = null;

  public showCreate = false;

  private searchSubject = new Subject<void>();

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly devolucionService: DevolucionService,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.searchSubject.pipe(debounceTime(400)).subscribe(() => {
      if (this.lastLazyEvent) {
        this.loadTable({ ...this.lastLazyEvent, first: 0 });
      }
    });
  }

  async loadTable(event: TableLazyLoadEvent): Promise<void> {
    this.lastLazyEvent = event;
    this.loadingTable = true;
    this.cdr.markForCheck();

    const page =
      event.first != null && event.rows
        ? Math.floor(event.first / event.rows)
        : 0;
    const sortField = Array.isArray(event.sortField)
      ? event.sortField[0]
      : event.sortField;

    const dto: DevolucionPageableDto = {
      page,
      rows: event.rows ?? this.rowSize,
      search: this.searchQuery || undefined,
      order_by: sortField ?? 'd.id',
      order: event.sortOrder === 1 ? 'ASC' : 'DESC',
    };

    try {
      const res = await lastValueFrom(this.devolucionService.page(dto));
      this.items = res?.data?.content ?? [];
      this.totalRecords = res?.data?.totalElements ?? 0;
    } catch (err: any) {
      if (err?.status !== 206) {
        this.alertService.showError(
          'Error',
          'No se pudieron cargar las devoluciones.',
        );
      }
      this.items = [];
      this.totalRecords = 0;
    } finally {
      this.loadingTable = false;
      this.cdr.markForCheck();
    }
  }

  onSearch(): void {
    this.searchSubject.next();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchSubject.next();
  }

  private reloadTable(): void {
    if (this.lastLazyEvent) this.loadTable(this.lastLazyEvent);
  }

  openDetalle(item: DevolucionTableModel): void {
    this.selectedId = item.id;
    this.showDetalle = true;
    this.cdr.markForCheck();
  }

  onDetalleClosed(): void {
    this.showDetalle = false;
    this.cdr.markForCheck();
  }

  onAnulada(): void {
    this.showDetalle = false;
    this.reloadTable();
  }

  openCreate(): void {
    this.showCreate = true;
    this.cdr.markForCheck();
  }

  onCreateClosed(): void {
    this.showCreate = false;
    this.cdr.markForCheck();
  }

  onCreated(): void {
    this.showCreate = false;
    this.reloadTable();
  }

  getEstadoSeverity(estado: string): TagSeverity {
    return estado === 'COMPLETADA' ? 'success' : 'danger';
  }

  getEstadoLabel(estado: string): string {
    return estado === 'COMPLETADA' ? 'Completada' : 'Anulada';
  }

  getTipoSeverity(tipo: string): TagSeverity {
    return tipo === 'TOTAL' ? 'info' : 'warn';
  }

  getTipoLabel(tipo: string): string {
    return tipo === 'TOTAL' ? 'Total' : 'Parcial';
  }

  formatCOP = (v: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v);

  formatFecha(f: string): string {
    return new Date(f).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
