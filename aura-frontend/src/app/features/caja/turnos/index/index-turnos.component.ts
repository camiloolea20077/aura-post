import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import { TurnoCajaService } from '../../../../core/services/caja.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import {
  EstadoTurno,
  TurnoCajaModel,
  TurnoCajaTableModel,
  TurnoPageableDto,
  ResumenTurnoDto, // ← NUEVO
} from '../../../../core/models/caja.model';
import { CerrarTurnoComponent } from '../cerdad/cerrar-turno.component';
import { AbrirTurnoComponent } from '../abrir/abrir-turno.component';
import { DividerModule } from 'primeng/divider';

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
  changeDetection: ChangeDetectionStrategy.OnPush, // ← NUEVO
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DividerModule,
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
export class IndexTurnosComponent implements OnInit, OnDestroy {
  showAbrir = false;
  showCerrar = false;
  turnoActivo: TurnoCajaModel | null = null;
  turnoParaCerrar: TurnoCajaModel | null = null;

  // ── NUEVO: resumen en tiempo real ─────────────────────────
  resumen: ResumenTurnoDto | null = null;
  loadingResumen = false;
  private polling: any;

  // Tabla histórica
  items: TurnoCajaTableModel[] = [];
  loadingTable = true;
  totalRecords = 0;
  rowSize = 15;
  searchQuery = '';
  lastLazyEvent!: TableLazyLoadEvent;

  constructor(
    private readonly turnoCajaService: TurnoCajaService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef, // ← NUEVO
  ) {}

  ngOnInit(): void {
    this.checkTurnoActivo();
  }
  ngOnDestroy(): void {
    this.detenerPolling();
  }

  // ── Verificar turno activo ────────────────────────────────
  private async checkTurnoActivo(): Promise<void> {
    try {
      const res = await lastValueFrom(this.turnoCajaService.turnoActivo());
      this.turnoActivo = res?.data ?? null;
      if (this.turnoActivo) {
        await this.cargarResumen();
        this.iniciarPolling();
      }
    } catch {
      this.turnoActivo = null;
    }
    this.cdr.markForCheck();
  }

  // ── Resumen en tiempo real ────────────────────────────────
  async cargarResumen(): Promise<void> {
    if (!this.turnoActivo) return;
    this.loadingResumen = true;
    try {
      const res = await lastValueFrom(
        this.turnoCajaService.resumen(this.turnoActivo.id),
      );
      this.resumen = res?.data ?? null;
    } catch {
      /* silencioso */
    } finally {
      this.loadingResumen = false;
      this.cdr.markForCheck();
    }
  }

  private iniciarPolling(): void {
    this.polling = setInterval(() => this.cargarResumen(), 30_000);
  }

  private detenerPolling(): void {
    if (this.polling) clearInterval(this.polling);
  }

  // ── Icono por método de pago ──────────────────────────────
  metodoPagoIcon(m: string): string {
    const map: Record<string, string> = {
      EFECTIVO: 'pi pi-money-bill',
      NEQUI: 'pi pi-mobile',
      TARJETA: 'pi pi-credit-card',
    };
    return map[m] ?? 'pi pi-wallet';
  }

  // ── Tabla histórica ───────────────────────────────────────
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

  // ── Abrir turno ───────────────────────────────────────────
  openAbrir(): void {
    this.showAbrir = true;
  }
  onAbrirClosed(): void {
    this.showAbrir = false;
  }
  onTurnoAbierto(t: TurnoCajaModel): void {
    this.showAbrir = false;
    this.turnoActivo = t;
    this.resumen = null;
    this.cargarResumen();
    this.iniciarPolling();
    this.reloadTable();
    this.cdr.markForCheck();
  }

  // ── Cerrar turno (propio) ─────────────────────────────────
  openCerrar(): void {
    this.turnoParaCerrar = this.turnoActivo;
    this.showCerrar = true;
  }

  // ── Cerrar turno desde la tabla (cualquier cajero) ────────
  openCerrarDesdeTabla(item: TurnoCajaTableModel): void {
    this.turnoParaCerrar = item;
    this.showCerrar = true;
  }

  onCerrarClosed(): void {
    this.showCerrar = false;
    this.turnoParaCerrar = null;
  }

  onTurnoCerrado(): void {
    this.showCerrar = false;
    // Si el que se cerró era el turno activo del admin, limpiar panel
    if (this.turnoParaCerrar?.id === this.turnoActivo?.id) {
      this.turnoActivo = null;
      this.resumen = null;
      this.detenerPolling();
    }
    this.turnoParaCerrar = null;
    this.reloadTable();
    this.cdr.markForCheck();
  }

  // ── UI helpers ────────────────────────────────────────────
  getEstadoSeverity(e: EstadoTurno): TagSeverity {
    return e === 'ABIERTA' ? 'success' : 'secondary';
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
