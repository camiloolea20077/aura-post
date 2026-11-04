import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { TabViewModule } from 'primeng/tabview';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { ChartModule } from 'primeng/chart';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { ReporteAvanzadoService } from '../../core/services/reporte-avanzado.service';
import {
  ReporteResumenAvanzadoModel,
  ReporteVentasCategoriaModel,
  ReporteTopProductoModel,
  ReporteVentasVendedorModel,
  ReporteMargenesProductoModel,
  ReporteRotacionInventarioModel,
  ReporteMovimientosCajaModel,
} from '../../core/models/reporte-avanzado.model';

import { aFechaLocal } from '../../shared/utils/fecha.util';
import { UtilidadVentasComponent } from './utilidad/utilidad-ventas.component';

@Component({
  selector: 'app-reportes-avanzados',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DatePickerModule,
    TabViewModule,
    TableModule,
    TooltipModule,
    DropdownModule,
    ToastModule,
    SkeletonModule,
    ChartModule,
    UtilidadVentasComponent,
  ],
  providers: [MessageService],
  templateUrl: './reportes-avanzados.component.html',
  styleUrls: ['./reportes-avanzados.component.scss'],
})
export class ReportesAvanzadosComponent implements OnInit {
  /** Pestaña Utilidad: carga su propio reporte con el período de la página. */
  @ViewChild(UtilidadVentasComponent, { static: true }) utilidad?: UtilidadVentasComponent;

  // Filtros
  public fechaDesde: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  public fechaHasta: Date = new Date();

  // Estado de carga
  public loadingResumen = false;
  public loadingCategoria = false;
  public loadingTopProductos = false;
  public loadingVendedor = false;
  public loadingMargenes = false;
  public loadingRotacion = false;
  public loadingCaja = false;

  // Datos
  public resumen: ReporteResumenAvanzadoModel | null = null;
  public categorias: ReporteVentasCategoriaModel[] = [];
  public topProductos: ReporteTopProductoModel[] = [];
  public vendedores: ReporteVentasVendedorModel[] = [];
  public margenes: ReporteMargenesProductoModel[] = [];
  public rotacion: ReporteRotacionInventarioModel[] = [];
  public movimientosCaja: ReporteMovimientosCajaModel | null = null;

  // Top productos config
  public limiteOpciones = [
    { label: 'Top 5', value: 5 },
    { label: 'Top 10', value: 10 },
    { label: 'Top 20', value: 20 },
    { label: 'Top 50', value: 50 },
  ];
  public limiteSeleccionado = 20;

  // Gráficos y listas derivadas del resumen
  public chartVentasDia: any = null;
  public chartTopProductos: any = null;
  /** Cómo pagaron: método, total y participación (0–100). */
  public metodosPago: { metodo: string; total: number; pct: number }[] = [];

  /** Línea de ventas por día: un solo azul, sin leyenda, rejilla tenue. */
  public readonly opcionesLinea = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8', maxRotation: 0, autoSkipPadding: 16 } },
      y: {
        grid: { color: 'rgba(148,163,184,0.18)' },
        border: { display: false },
        ticks: { color: '#94a3b8', callback: (v: number) => this.copCorto(v) },
      },
    },
  };

  /** Barras horizontales del top de productos. */
  public readonly opcionesBarras = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { color: 'rgba(148,163,184,0.18)' },
        border: { display: false },
        ticks: { color: '#94a3b8', callback: (v: number) => this.copCorto(v) },
      },
      y: { grid: { display: false }, ticks: { color: '#64748b' } },
    },
  };

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly service: ReporteAvanzadoService,
    private readonly msg: MessageService,
  ) {}

  ngOnInit(): void {
    this.cargarTodo();
  }

  async cargarTodo(): Promise<void> {
    const desde = this.toIso(this.fechaDesde);
    const hasta = this.toIso(this.fechaHasta);
    await Promise.allSettled([
      this.cargarResumen(desde, hasta),
      this.cargarCategorias(desde, hasta),
      this.cargarTopProductos(desde, hasta),
      this.cargarVendedores(desde, hasta),
      this.cargarMargenes(desde, hasta),
      this.utilidad?.cargar(desde, hasta) ?? Promise.resolve(),
      this.cargarRotacion(),
      this.cargarMovimientosCaja(desde, hasta),
    ]);
  }

  aplicarFiltros(): void {
    this.cargarTodo();
  }

  limpiarFiltros(): void {
    this.fechaDesde = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    this.fechaHasta = new Date();
    this.cargarTodo();
  }

  private toIso(d: Date): string {
    return aFechaLocal(d);
  }

  private async cargarResumen(desde: string, hasta: string): Promise<void> {
    this.loadingResumen = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.resumen(desde, hasta));
      this.resumen = res?.data ?? null;
      this.buildChartDia();
      this.buildChartMetodo();
    } catch {
      this.resumen = null;
    } finally {
      this.loadingResumen = false;
      this.cdr.markForCheck();
    }
  }

  private async cargarCategorias(desde: string, hasta: string): Promise<void> {
    this.loadingCategoria = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.ventasPorCategoria(desde, hasta));
      this.categorias = res?.data ?? [];
    } catch {
      this.categorias = [];
    } finally {
      this.loadingCategoria = false;
      this.cdr.markForCheck();
    }
  }

  private async cargarTopProductos(desde: string, hasta: string): Promise<void> {
    this.loadingTopProductos = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.topProductos(desde, hasta, this.limiteSeleccionado),
      );
      this.topProductos = res?.data ?? [];
      this.buildChartTopProductos();
    } catch {
      this.topProductos = [];
    } finally {
      this.loadingTopProductos = false;
      this.cdr.markForCheck();
    }
  }

  onLimiteChange(): void {
    const desde = this.toIso(this.fechaDesde);
    const hasta = this.toIso(this.fechaHasta);
    this.cargarTopProductos(desde, hasta);
  }

  private async cargarVendedores(desde: string, hasta: string): Promise<void> {
    this.loadingVendedor = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.ventasPorVendedor(desde, hasta));
      this.vendedores = res?.data ?? [];
    } catch {
      this.vendedores = [];
    } finally {
      this.loadingVendedor = false;
      this.cdr.markForCheck();
    }
  }

  private async cargarMargenes(desde: string, hasta: string): Promise<void> {
    this.loadingMargenes = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.margenes(desde, hasta));
      this.margenes = res?.data ?? [];
    } catch {
      this.margenes = [];
    } finally {
      this.loadingMargenes = false;
      this.cdr.markForCheck();
    }
  }

  private async cargarRotacion(): Promise<void> {
    this.loadingRotacion = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.rotacionInventario());
      this.rotacion = res?.data ?? [];
    } catch {
      this.rotacion = [];
    } finally {
      this.loadingRotacion = false;
      this.cdr.markForCheck();
    }
  }

  private async cargarMovimientosCaja(desde: string, hasta: string): Promise<void> {
    this.loadingCaja = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.movimientosCaja(desde, hasta));
      this.movimientosCaja = res?.data ?? null;
    } catch {
      this.movimientosCaja = null;
    } finally {
      this.loadingCaja = false;
      this.cdr.markForCheck();
    }
  }

  // ── Charts ─────────────────────────────────────────────────────────────────

  private buildChartDia(): void {
    if (!this.resumen?.ventasPorDia?.length) { this.chartVentasDia = null; return; }
    this.chartVentasDia = {
      labels: this.resumen.ventasPorDia.map(d => d.dia.substring(5).replace('-', '/')),
      datasets: [{
        label: 'Ventas',
        data: this.resumen.ventasPorDia.map(d => d.total),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.08)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
        tension: 0.35,
      }],
    };
  }

  private buildChartMetodo(): void {
    const lista = this.resumen?.ventasPorMetodoPago ?? [];
    const total = lista.reduce((a, m) => a + (m.total ?? 0), 0);
    this.metodosPago = lista.map(m => ({
      metodo: this.nombreMetodo(m.metodoPago),
      total: m.total ?? 0,
      pct: total ? ((m.total ?? 0) * 100) / total : 0,
    }));
  }

  private buildChartTopProductos(): void {
    const top10 = this.topProductos.slice(0, 10);
    if (!top10.length) { this.chartTopProductos = null; return; }
    this.chartTopProductos = {
      labels: top10.map(p => p.productoNombre.length > 28 ? p.productoNombre.substring(0, 27) + '…' : p.productoNombre),
      datasets: [{
        label: 'Ingresos',
        data: top10.map(p => p.ingresos),
        backgroundColor: '#2563eb',
        borderRadius: 4,
        barThickness: 14,
      }],
    };
  }

  /** EFECTIVO → Efectivo, TARJETA_CREDITO → Tarjeta credito. */
  private nombreMetodo(m: string): string {
    if (!m) return 'Sin método';
    const t = m.replace(/_/g, ' ').toLowerCase();
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  // ── Helpers UI ─────────────────────────────────────────────────────────────

  /** Estado de stock en palabras: CRITICO → Sin stock. */
  etiquetaEstado(estado: string): string {
    const map: Record<string, string> = {
      CRITICO: 'Sin stock', BAJO: 'Bajo mínimo', NORMAL: 'Normal', ALTO: 'Quieto',
    };
    return map[estado] ?? estado;
  }

  /** Utilidad / venta neta × 100; cero si no hubo venta. */
  margenPct(utilidad: number, ventaNeta: number): number {
    return ventaNeta ? (utilidad * 100) / ventaNeta : 0;
  }

  /** Tono del margen: pérdida, bajo (< 10 %) o sano. */
  claseMargen(pct: number): string {
    if (pct < 0) return 'is-perdida';
    if (pct < 10) return 'is-bajo';
    return 'is-sano';
  }

  /** Ancho de la barra de margen: 0–100 % sobre una escala de 0 a 50 % de margen. */
  barraMargen(pct: number): number {
    return Math.max(0, Math.min(100, (pct ?? 0) * 2));
  }

  getVariacionIcon(v: number): string {
    return v >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down';
  }

  /** Eje de gráficos: $1,2 M · $350 mil. */
  copCorto(v: number): string {
    const a = Math.abs(v);
    if (a >= 1_000_000) return '$' + (v / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' M';
    if (a >= 1_000) return '$' + Math.round(v / 1_000).toLocaleString('es-CO') + ' mil';
    return '$' + v;
  }

  cop = (v: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(v ?? 0);
}
