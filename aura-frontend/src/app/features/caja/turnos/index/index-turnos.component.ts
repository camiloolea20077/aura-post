import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import { TurnoCajaService } from '../../../../core/services/caja.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import {
  EstadoTurno,
  TurnoCajaModel,
  TurnoCajaTableModel,
  TurnoPageableDto,
} from '../../../../core/models/caja.model';
import { CerrarTurnoComponent } from '../cerdad/cerrar-turno.component';
import { AbrirTurnoComponent } from '../abrir/abrir-turno.component';
import { EstadoCompra } from '../../../../core/models/compra.model';

type TagSeverity =
  | 'success'
  | 'secondary'
  | 'info'
  | 'warn'
  | 'danger'
  | 'contrast'
  | undefined;
@Component({
  selector: 'app-index-turnos',
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
    AbrirTurnoComponent,
    CerrarTurnoComponent,
  ],
  providers: [MessageService],
  templateUrl: './index-turnos.component.html',
  styleUrls: ['./index-turnos.component.scss'],
})
export class IndexTurnosComponent implements OnInit {
  public showAbrir = false;
  public showCerrar = false;
  public turnoActivo: TurnoCajaModel | null = null;

  public items: TurnoCajaTableModel[] = [];
  public loadingTable = true;
  public totalRecords = 0;
  public rowSize = 15;
  public searchQuery = '';
  public lastLazyEvent!: TableLazyLoadEvent;

  constructor(
    private readonly turnoCajaService: TurnoCajaService,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.checkTurnoActivo();
  }

  private async checkTurnoActivo(): Promise<void> {
    try {
      const res = await lastValueFrom(this.turnoCajaService.turnoActivo());
      this.turnoActivo = res?.data ?? null;
    } catch {
      this.turnoActivo = null;
    }
  }

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
    const dto: TurnoPageableDto = {
      page,
      rows: event.rows ?? this.rowSize,
      search: this.searchQuery || null,
      order_by: sortField ?? 't.id',
      order: event.sortOrder === 1 ? 'ASC' : 'DESC',
    };
    try {
      const res = await lastValueFrom(this.turnoCajaService.page(dto));
      this.items = res?.data?.content ?? [];
      this.totalRecords = res?.data?.totalElements ?? 0;
    } catch (err: any) {
      if (err?.status !== 206)
        this.alertService.showError(
          'Error',
          'No se pudieron cargar los turnos.',
        );
      this.items = [];
      this.totalRecords = 0;
    } finally {
      this.loadingTable = false;
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

  // ─── Abrir turno ──────────────────────────────────────────
  openAbrir(): void {
    this.showAbrir = true;
  }
  onAbrirClosed(): void {
    this.showAbrir = false;
  }
  onTurnoAbierto(t: TurnoCajaModel): void {
    this.showAbrir = false;
    this.turnoActivo = t;
    this.reloadTable();
  }

  // ─── Cerrar turno ─────────────────────────────────────────
  openCerrar(): void {
    this.showCerrar = true;
  }
  onCerrarClosed(): void {
    this.showCerrar = false;
  }
  onTurnoCerrado(): void {
    this.showCerrar = false;
    this.turnoActivo = null;
    this.reloadTable();
  }

  // ─── UI helpers ───────────────────────────────────────────
  getEstadoSeverity(e: EstadoCompra): TagSeverity {
    return e === 'RECIBIDA' ? 'success' : 'danger';
  }
  getEstadoLabel(e: EstadoTurno): string {
    return e === 'ABIERTA' ? 'Abierta' : 'Cerrada';
  }

  duracion(item: TurnoCajaTableModel): string {
    const inicio = new Date(item.fechaApertura);
    const fin = item.fechaCierre ? new Date(item.fechaCierre) : new Date();
    const diff = Math.floor((fin.getTime() - inicio.getTime()) / 60000);
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  formatFecha(f: string | null): string {
    if (!f) return '—';
    return new Date(f).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatCOP(v: number | null | undefined): string {
    if (v === null || v === undefined) return '—';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v);
  }

  getDiferenciaClass(d: number | null | undefined): string {
    if (!d) return '';
    return d > 0 ? 'dif-sobrante' : 'dif-faltante';
  }
}
