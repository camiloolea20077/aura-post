import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { lastValueFrom } from 'rxjs';
import {
  CotizacionTableModel,
  EstadoCotizacion,
  CotizacionPageableDto,
} from '../../../core/models/cotizacion.model';
import { CotizacionService } from '../../../core/services/cotizacion.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { DetalleCotizacionComponent } from '../detalle/detalle-cotizacion.component';

type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined;

@Component({
  selector: 'app-index-cotizaciones',
  standalone: true,
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
    ConfirmDialog,
    DetalleCotizacionComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-cotizaciones.component.html',
  styleUrls: ['./index-cotizaciones.component.scss'],
})
export class IndexCotizacionesComponent implements OnInit {
  public items: CotizacionTableModel[] = [];
  public loadingTable = true;
  public totalRecords = 0;
  public rowSize = 15;
  public searchQuery = '';
  public lastLazyEvent!: TableLazyLoadEvent;

  public showDetalle = false;
  public selectedId: number | null = null;

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly cotizacionService: CotizacionService,
    private readonly alertService: AlertService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {}

  async loadTable(event: TableLazyLoadEvent): Promise<void> {
    this.lastLazyEvent = event;
    this.loadingTable = true;
    const page =
      event.first != null && event.rows
        ? Math.floor(event.first / event.rows)
        : 0;
    const sortField = Array.isArray(event.sortField)
      ? event.sortField[0]
      : event.sortField;
    const dto: CotizacionPageableDto = {
      page,
      rows: event.rows ?? this.rowSize,
      search: this.searchQuery || null,
      order_by: sortField ?? 'c.id',
      order: event.sortOrder === 1 ? 'ASC' : 'DESC',
    };
    try {
      const res = await lastValueFrom(this.cotizacionService.page(dto));
      this.items = res?.data?.content ?? [];
      this.totalRecords = res?.data?.totalElements ?? 0;
    } catch (err: any) {
      if (err?.status !== 206)
        this.alertService.showError('Error', 'No se pudieron cargar las cotizaciones.');
      this.items = [];
      this.totalRecords = 0;
    } finally {
      this.loadingTable = false;
      this.cdr.markForCheck();
    }
  }

  onSearch(): void {
    if (this.lastLazyEvent) this.loadTable({ ...this.lastLazyEvent, first: 0 });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.onSearch();
  }

  private reloadTable(): void {
    if (this.lastLazyEvent) this.loadTable(this.lastLazyEvent);
  }

  openDetalle(item: CotizacionTableModel): void {
    this.selectedId = item.id;
    this.showDetalle = true;
  }

  editar(item: CotizacionTableModel, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/cotizaciones/editar', item.id]);
  }

  onDetalleClosed(): void {
    this.showDetalle = false;
  }

  onAnulada(): void {
    this.showDetalle = false;
    this.reloadTable();
  }

  async convertirAVenta(item: CotizacionTableModel, event: Event): Promise<void> {
    event.stopPropagation();
    try {
      const res = await lastValueFrom(this.cotizacionService.convertirAVenta(item.id));
      const cotizacion = res?.data;
      if (!cotizacion) return;
      // Navegar al POS pasando la cotización en el estado de navegación
      this.router.navigate(['/pos'], { state: { cotizacion } });
    } catch (err: any) {
      this.alertService.showError('Error', err?.error?.message ?? 'No se pudo convertir la cotización.');
    }
  }

  /**
   * Revive una cotización vencida para poder convertirla. Los precios quedan
   * como estaban: el cliente vuelve por lo que se le cotizó.
   */
  async reactivar(item: CotizacionTableModel, event: Event): Promise<void> {
    event.stopPropagation();
    try {
      await lastValueFrom(this.cotizacionService.reactivar(item.id));
      this.alertService.showSuccess(
        'Cotización reactivada',
        'Vuelve a estar vigente con los mismos precios.',
      );
      if (this.lastLazyEvent) this.loadTable(this.lastLazyEvent);
    } catch (err: any) {
      this.alertService.showError(
        'No se pudo reactivar',
        err?.error?.message ?? err?.message ?? 'Intente de nuevo.',
      );
    }
  }

  getEstadoSeverity(e: EstadoCotizacion): TagSeverity {
    const map: Record<EstadoCotizacion, TagSeverity> = {
      PENDIENTE: 'info',
      VENCIDA: 'warn',
      ANULADA: 'danger',
      CONVERTIDA: 'success',
    };
    return map[e] ?? 'secondary';
  }

  getEstadoLabel(e: EstadoCotizacion): string {
    const labels: Record<EstadoCotizacion, string> = {
      PENDIENTE: 'Pendiente',
      VENCIDA: 'Vencida',
      ANULADA: 'Anulada',
      CONVERTIDA: 'Convertida',
    };
    return labels[e] ?? e;
  }

  formatCOP = (v: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);

  formatFecha(f: string): string {
    return new Date(f).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
