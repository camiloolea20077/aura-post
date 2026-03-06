// ─── monitor-errores.component.ts ────────────────────────────
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { SelectButtonModule } from 'primeng/selectbutton';
import { lastValueFrom } from 'rxjs';
import { PlatformService } from '../../../core/services/platform.service';
import {
  ErrorCategoria,
  ErrorLogGrupoModel,
  ErrorLogModel,
  ErrorLogGrupoPageableDto,
  ErrorLogPageableDto,
} from '../../../core/models/platform.model';

type Vista = 'lista' | 'agrupado';

@Component({
  selector: 'app-monitor-errores',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    SkeletonModule,
    TooltipModule,
    InputTextModule,
    DialogModule,
    SelectButtonModule,
  ],
  templateUrl: './monitor-errores.component.html',
  styleUrls: ['./monitor-errores.component.scss'],
})
export class MonitorErroresComponent implements OnInit {
  // ── vista ────────────────────────────────────────────────────
  vista: Vista = 'lista';
  vistaOpciones = [
    { label: 'Lista', value: 'lista', icon: 'pi pi-list' },
    { label: 'Agrupado', value: 'agrupado', icon: 'pi pi-sitemap' },
  ];

  // ── filtros ──────────────────────────────────────────────────
  categoriaActiva: ErrorCategoria | null = null;
  endpointSearch = '';
  statusCodeSearch = '';
  desde = '';
  hasta = '';

  readonly categorias: {
    label: string;
    value: ErrorCategoria | null;
    icon: string;
  }[] = [
    { label: 'Todos', value: null, icon: 'pi pi-globe' },
    { label: 'Info', value: 'info', icon: 'pi pi-info-circle' },
    { label: 'Warn', value: 'warn', icon: 'pi pi-exclamation-triangle' },
    { label: 'Danger', value: 'danger', icon: 'pi pi-times-circle' },
  ];

  // ── lista ────────────────────────────────────────────────────
  rows: ErrorLogModel[] = [];
  totalRows = 0;
  loadingLista = true;
  rowSize = 20;
  lastListaEvent!: TableLazyLoadEvent;

  // ── agrupado ─────────────────────────────────────────────────
  grupos: ErrorLogGrupoModel[] = [];
  totalGrupos = 0;
  loadingGrupos = true;
  lastGrupoEvent!: TableLazyLoadEvent;

  // ── detalle de grupo ─────────────────────────────────────────
  showDetalleDialog = false;
  grupoSeleccionado: ErrorLogGrupoModel | null = null;
  detalleRows: ErrorLogModel[] = [];
  totalDetalle = 0;
  loadingDetalle = false;
  detalleSize = 10;
  lastDetalleEvent!: TableLazyLoadEvent;

  // ── detalle individual ───────────────────────────────────────
  showItemDialog = false;
  itemSeleccionado: ErrorLogModel | null = null;
  loadingItem = false;

  constructor(
    private readonly platformService: PlatformService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {}

  // ── carga lista ──────────────────────────────────────────────
  async loadLista(event: TableLazyLoadEvent): Promise<void> {
    this.lastListaEvent = event;
    this.loadingLista = true;
    const page =
      event.first != null && event.rows
        ? Math.floor(event.first / event.rows)
        : 0;

    const dto: ErrorLogPageableDto = {
      page,
      rows: event.rows ?? this.rowSize,
      categoria: this.categoriaActiva,
      endpoint: this.endpointSearch || null,
      statusCode: this.statusCodeSearch ? +this.statusCodeSearch : null,
      desde: this.desde || null,
      hasta: this.hasta || null,
    };

    try {
      const res = await lastValueFrom(this.platformService.errorLogs(dto));
      this.rows = res?.data?.content ?? [];
      this.totalRows = res?.data?.totalElements ?? 0;
    } catch {
      this.rows = [];
      this.totalRows = 0;
    } finally {
      this.loadingLista = false;
      this.cdr.markForCheck();
    }
  }

  // ── carga agrupado ───────────────────────────────────────────
  async loadGrupos(event: TableLazyLoadEvent): Promise<void> {
    this.lastGrupoEvent = event;
    this.loadingGrupos = true;
    const page =
      event.first != null && event.rows
        ? Math.floor(event.first / event.rows)
        : 0;

    const dto: ErrorLogGrupoPageableDto = {
      page,
      rows: event.rows ?? this.rowSize,
      categoria: this.categoriaActiva,
      desde: this.desde || null,
      hasta: this.hasta || null,
    };

    try {
      const res = await lastValueFrom(this.platformService.errorLogGrupos(dto));
      this.grupos = res?.data?.content ?? [];
      this.totalGrupos = res?.data?.totalElements ?? 0;
    } catch {
      this.grupos = [];
      this.totalGrupos = 0;
    } finally {
      this.loadingGrupos = false;
      this.cdr.markForCheck();
    }
  }

  // ── filtrar ──────────────────────────────────────────────────
  aplicarFiltros(): void {
    if (this.vista === 'lista' && this.lastListaEvent) {
      this.loadLista({ ...this.lastListaEvent, first: 0 });
    } else if (this.vista === 'agrupado' && this.lastGrupoEvent) {
      this.loadGrupos({ ...this.lastGrupoEvent, first: 0 });
    }
  }

  seleccionarCategoria(cat: ErrorCategoria | null): void {
    this.categoriaActiva = cat;
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.endpointSearch = '';
    this.statusCodeSearch = '';
    this.desde = '';
    this.hasta = '';
    this.aplicarFiltros();
  }

  onVistaChange(): void {
    // reset al cambiar vista para forzar el lazyLoad del nuevo p-table
  }

  // ── detalle de grupo (dialog) ────────────────────────────────
  async verGrupo(grupo: ErrorLogGrupoModel): Promise<void> {
    this.grupoSeleccionado = grupo;
    this.showDetalleDialog = true;
    this.detalleRows = [];
    this.totalDetalle = 0;
    this.cdr.markForCheck();
  }

  async loadDetalle(event: TableLazyLoadEvent): Promise<void> {
    if (!this.grupoSeleccionado) return;
    this.lastDetalleEvent = event;
    this.loadingDetalle = true;
    const page =
      event.first != null && event.rows
        ? Math.floor(event.first / event.rows)
        : 0;
    try {
      const res = await lastValueFrom(
        this.platformService.errorLogsPorGrupo(
          this.grupoSeleccionado.grupoHash,
          page,
          event.rows ?? this.detalleSize,
        ),
      );
      this.detalleRows = res?.data?.content ?? [];
      this.totalDetalle = res?.data?.totalElements ?? 0;
    } catch {
      this.detalleRows = [];
      this.totalDetalle = 0;
    } finally {
      this.loadingDetalle = false;
      this.cdr.markForCheck();
    }
  }

  // ── detalle individual ───────────────────────────────────────
  async verItem(id: number): Promise<void> {
    this.loadingItem = true;
    this.showItemDialog = true;
    this.itemSeleccionado = null;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.platformService.errorLogDetalle(id));
      this.itemSeleccionado = res?.data ?? null;
    } catch {
      this.itemSeleccionado = null;
    } finally {
      this.loadingItem = false;
      this.cdr.markForCheck();
    }
  }

  // ── helpers de presentación ───────────────────────────────────
  categoriaSeverity(cat: ErrorCategoria): 'info' | 'warn' | 'danger' {
    return cat === 'danger' ? 'danger' : cat === 'warn' ? 'warn' : 'info';
  }
  categoriaLabel(cat: ErrorCategoria): string {
    return cat === 'danger' ? 'Danger' : cat === 'warn' ? 'Warn' : 'Info';
  }

  metodoClass(metodo: string): string {
    const m = metodo.toUpperCase();
    if (m === 'GET') return 'badge-get';
    if (m === 'POST') return 'badge-post';
    if (m === 'PUT' || m === 'PATCH') return 'badge-put';
    if (m === 'DELETE') return 'badge-delete';
    return 'badge-other';
  }

  statusClass(code: number): string {
    if (code >= 500) return 'status-danger';
    if (code >= 400) return 'status-warn';
    return 'status-ok';
  }

  hashCorto(hash: string): string {
    return hash?.substring(0, 8) ?? '';
  }

  formatFecha(iso: string): string {
    return new Date(iso).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
