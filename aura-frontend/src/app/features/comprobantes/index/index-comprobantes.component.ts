import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import {
  ComprobanteCajaModel,
  ComprobanteCajaPageableDto,
} from '../../../core/models/comprobante-caja.model';
import {
  ComprobanteCajaService,
} from '../../../core/services/comprobante-caja.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { TicketComprobanteCajaComponent } from '../ticket/ticket-comprobante-caja.component';

type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined;

@Component({
  selector: 'app-index-comprobantes',
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
    DropdownModule,
    CalendarModule,
    TicketComprobanteCajaComponent,
  ],
  providers: [MessageService],
  templateUrl: './index-comprobantes.component.html',
  styleUrls: ['./index-comprobantes.component.scss'],
})
export class IndexComprobantesComponent implements OnInit {
  public items: ComprobanteCajaModel[] = [];
  public loadingTable = true;
  public totalRecords = 0;
  public rowSize = 20;
  public currentPage = 0;

  // Filtros
  public filtroTipo: string = '';
  public filtroDesdeFecha: Date | null = null;
  public filtroHastaFecha: Date | null = null;

  public tipoOpciones = [
    { label: 'Todos', value: '' },
    { label: 'Ingresos', value: 'INGRESO' },
    { label: 'Egresos', value: 'EGRESO' },
  ];

  // Ticket
  public showTicket = false;
  public selectedComprobante: ComprobanteCajaModel | null = null;

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly comprobanteService: ComprobanteCajaService,
    private readonly alertService: AlertService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  /** Abre el formulario plano para crear un comprobante contable. */
  nuevo(): void {
    this.router.navigate(['/comprobantes/contable/nuevo']);
  }

  async cargar(page = 0): Promise<void> {
    this.currentPage = page;
    this.loadingTable = true;
    this.cdr.markForCheck();

    const dto: ComprobanteCajaPageableDto = {
      page,
      rows: this.rowSize,
      tipo: this.filtroTipo || undefined,
      desde: this.filtroDesdeFecha ? this.formatDate(this.filtroDesdeFecha) : undefined,
      hasta: this.filtroHastaFecha ? this.formatDate(this.filtroHastaFecha) : undefined,
    };

    try {
      const res = await lastValueFrom(this.comprobanteService.listar(dto));
      const data = res?.data ?? [];
      this.items = data;
      this.totalRecords = data.length > 0 ? Number(data[0].totalRows ?? data.length) : 0;
    } catch (err: any) {
      this.alertService.showError('Error', 'No se pudieron cargar los comprobantes.');
      this.items = [];
      this.totalRecords = 0;
    } finally {
      this.loadingTable = false;
      this.cdr.markForCheck();
    }
  }

  onFiltroChange(): void {
    this.cargar(0);
  }

  limpiarFiltros(): void {
    this.filtroTipo = '';
    this.filtroDesdeFecha = null;
    this.filtroHastaFecha = null;
    this.cargar(0);
  }

  onPageChange(event: any): void {
    const page = event.first != null && event.rows ? Math.floor(event.first / event.rows) : 0;
    this.rowSize = event.rows ?? this.rowSize;
    this.cargar(page);
  }

  verComprobante(item: ComprobanteCajaModel): void {
    this.selectedComprobante = item;
    this.showTicket = true;
    this.cdr.markForCheck();
  }

  onTicketClosed(): void {
    this.showTicket = false;
    this.cdr.markForCheck();
  }

  getTipoSeverity(tipo: string): TagSeverity {
    return tipo === 'INGRESO' ? 'success' : 'danger';
  }

  getTipoLabel(tipo: string): string {
    return tipo === 'INGRESO' ? 'Ingreso' : 'Egreso';
  }

  getOrigenLabel(origen: string): string {
    const map: Record<string, string> = {
      MANUAL: 'Manual',
      DEVOLUCION: 'Devolución',
      ABONO_CXC: 'Abono CxC',
      ABONO_CXP: 'Abono CxP',
    };
    return map[origen] ?? origen;
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

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
