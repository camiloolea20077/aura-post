import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { DetalleKardexComponent } from '../detalle/detalle-kardex.component';
import {
  KardexFiltroDto,
  MovimientoInventarioModel,
  MovimientoTableModel,
  TipoMovimientoOpcion,
  esEntradaPorSaldo,
} from '../../../../core/models/kardex.model';
import { KardexService } from '../../../../core/services/kardex.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { environment } from '../../../../../environments/environment';
import { aFechaLocal } from '../../../../shared/utils/fecha.util';
type TagSeverity =
  | 'success'
  | 'secondary'
  | 'info'
  | 'warn'
  | 'danger'
  | 'contrast'
  | undefined;
@Component({
  selector: 'app-index-kardex',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    TagModule,
    TooltipModule,
    ToastModule,
    DropdownModule,
    CalendarModule,
    AutoCompleteModule,
    DetalleKardexComponent,
  ],
  providers: [MessageService],
  templateUrl: './index-kardex.component.html',
  styleUrls: ['./index-kardex.component.scss'],
})
export class IndexKardexComponent implements OnInit {
  // ── Tabla ─────────────────────────────────────────────────
  rows: MovimientoTableModel[] = [];
  totalRows = 0;
  loading = true;
  page = 0;
  pageSize = 20;

  // ── Detalle ───────────────────────────────────────────────
  showDetalle = false;
  movimientoDetalle: MovimientoInventarioModel | null = null;
  loadingDetalle = false;

  // ── Filtros ───────────────────────────────────────────────
  frmFiltros: FormGroup;
  filtrosExpandidos = false;

  sucursales: { id: number; nombre: string }[] = [];
  // La lista la sirve el backend desde su enum. Mantenerla aquí fue el bug:
  // el front conocía 9 de los 17 tipos, así que merma, obsequio, devolución y
  // reconteo salían en la tabla pero no se podían filtrar.
  tiposMovimiento: TipoMovimientoOpcion[] = [];
  productoSugerencias: any[] = [];

  // Producto seleccionado para filtro
  productoFiltroNombre = '';
  productoFiltroId: number | null = null;

  constructor(
    private readonly service: KardexService,
    private readonly alert: AlertService,
    private readonly fb: FormBuilder,
    private readonly http: HttpClient,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.frmFiltros = this.fb.group({
      sucursalId: [null],
      tipoMovimiento: [null],
      fechaDesde: [null],
      fechaHasta: [null],
      search: [null],
    });
  }

  ngOnInit(): void {
    this.loadSucursales();
    this.loadTiposMovimiento();
    this.load();
  }

  private async loadTiposMovimiento(): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.tiposMovimiento());
      this.tiposMovimiento = res?.data ?? [];
    } catch {
      this.tiposMovimiento = [];
    }
    this.cdr.markForCheck();
  }

  private async loadSucursales(): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.getSucursales());
      this.sucursales = res?.data ?? [];
    } catch {
      this.sucursales = [];
    }
    this.cdr.markForCheck();
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      const f = this.frmFiltros.value;
      const dto: KardexFiltroDto = {
        page: this.page,
        rows: this.pageSize,
        sucursalId: f.sucursalId ?? null,
        productoId: this.productoFiltroId ?? null,
        tipoMovimiento: f.tipoMovimiento ?? null,
        fechaDesde: f.fechaDesde ? this.toIso(f.fechaDesde) : null,
        fechaHasta: f.fechaHasta ? this.toIso(f.fechaHasta) : null,
        search: f.search || null,
      };
      const res = await lastValueFrom(this.service.page(dto));
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

  aplicarFiltros(): void {
    this.page = 0;
    this.load();
  }

  limpiarFiltros(): void {
    this.frmFiltros.reset();
    this.productoFiltroNombre = '';
    this.productoFiltroId = null;
    this.page = 0;
    this.load();
  }

  // ── Autocomplete de producto para filtro ──────────────────
  async buscarProductosFiltro(event: any): Promise<void> {
    const q = event.query?.trim();
    if (!q || q.length < 2) {
      this.productoSugerencias = [];
      return;
    }
    try {
      const res: any = await lastValueFrom(
        this.http.get<any>(`${environment.apiUrl}productos/list?search=${q}`),
      );
      this.productoSugerencias = (res?.data ?? []).map((p: any) => ({
        ...p,
        label: `${p.nombre}${p.sku ? ' — ' + p.sku : ''}`,
      }));
    } catch {
      this.productoSugerencias = [];
    }
    this.cdr.markForCheck();
  }

  seleccionarProductoFiltro(event: any): void {
    const p = event.value ?? event;
    this.productoFiltroId = p.id;
    this.productoFiltroNombre = p.label ?? p.nombre;
    this.cdr.markForCheck();
  }

  limpiarProductoFiltro(): void {
    this.productoFiltroId = null;
    this.productoFiltroNombre = '';
    this.cdr.markForCheck();
  }

  // ── Detalle ───────────────────────────────────────────────
  async verDetalle(m: MovimientoTableModel): Promise<void> {
    this.loadingDetalle = true;
    this.showDetalle = true;
    this.movimientoDetalle = null;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.getById(m.id));
      this.movimientoDetalle = res?.data ?? null;
    } finally {
      this.loadingDetalle = false;
      this.cdr.markForCheck();
    }
  }

  // ── Helpers visuales ──────────────────────────────────────
  /**
   * El color sale del saldo, no del nombre del tipo. La lista que había aquí
   * pintaba `ANULACION_COMPRA` de verde cuando saca stock.
   */
  getSeverity(m: MovimientoTableModel): TagSeverity {
    return esEntradaPorSaldo(m.saldoAnterior, m.saldoNuevo) ? 'success' : 'danger';
  }

  getLabelTipo(m: MovimientoTableModel): string {
    return m.tipoEtiqueta ?? m.tipoMovimiento;
  }

  getDeltaClass(m: MovimientoTableModel): string {
    return m.saldoNuevo >= m.saldoAnterior ? 'delta-pos' : 'delta-neg';
  }

  getDelta(m: MovimientoTableModel): string {
    const d = m.saldoNuevo - m.saldoAnterior;
    return d >= 0 ? `+${d}` : `${d}`;
  }

  private toIso(date: Date | string): string {
    const d = new Date(date);
    return aFechaLocal(d);
  }

  get filtrosActivos(): number {
    const f = this.frmFiltros.value;
    return [
      f.sucursalId,
      this.productoFiltroId,
      f.tipoMovimiento,
      f.fechaDesde,
      f.fechaHasta,
      f.search,
    ].filter((v) => v !== null && v !== undefined && v !== '').length;
  }

  formatCOP = (v: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
}
