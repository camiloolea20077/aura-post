import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { TabViewModule } from 'primeng/tabview';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
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

type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined;

@Component({
  selector: 'app-reportes-avanzados',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CalendarModule,
    TabViewModule,
    TableModule,
    TagModule,
    DropdownModule,
    ToastModule,
    SkeletonModule,
    ChartModule,
  ],
  providers: [MessageService],
  templateUrl: './reportes-avanzados.component.html',
  styleUrls: ['./reportes-avanzados.component.scss'],
})
export class ReportesAvanzadosComponent implements OnInit {
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

  // Charts
  public chartVentasDia: any = null;
  public chartMetodoPago: any = null;
  public chartTopProductos: any = null;
  public chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
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
    return d.toISOString().split('T')[0];
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

  getTipoSeverity(tipo: string): 'success' | 'danger' {
    return tipo === 'INGRESO' ? 'success' : 'danger';
  }

  // ── Charts ─────────────────────────────────────────────────────────────────

  private buildChartDia(): void {
    if (!this.resumen?.ventasPorDia?.length) { this.chartVentasDia = null; return; }
    this.chartVentasDia = {
      labels: this.resumen.ventasPorDia.map(d => d.dia),
      datasets: [{
        label: 'Ventas ($)',
        data: this.resumen.ventasPorDia.map(d => d.total),
        backgroundColor: 'rgba(99,102,241,0.4)',
        borderColor: '#6366f1',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
      }],
    };
  }

  private buildChartMetodo(): void {
    if (!this.resumen?.ventasPorMetodoPago?.length) { this.chartMetodoPago = null; return; }
    const COLORS = ['#6366f1','#22c55e','#f59e0b','#3b82f6','#ec4899','#14b8a6'];
    this.chartMetodoPago = {
      labels: this.resumen.ventasPorMetodoPago.map(m => m.metodoPago),
      datasets: [{
        data: this.resumen.ventasPorMetodoPago.map(m => m.total),
        backgroundColor: COLORS,
      }],
    };
  }

  private buildChartTopProductos(): void {
    const top10 = this.topProductos.slice(0, 10);
    if (!top10.length) { this.chartTopProductos = null; return; }
    this.chartTopProductos = {
      labels: top10.map(p => p.productoNombre.substring(0, 20)),
      datasets: [{
        label: 'Ingresos ($)',
        data: top10.map(p => p.ingresos),
        backgroundColor: 'rgba(99,102,241,0.6)',
        borderColor: '#6366f1',
        borderWidth: 1,
      }],
    };
  }

  // ── Helpers UI ─────────────────────────────────────────────────────────────

  getEstadoStockSeverity(estado: string): TagSeverity {
    const map: Record<string, TagSeverity> = {
      CRITICO: 'danger', BAJO: 'warn', NORMAL: 'success', ALTO: 'info',
    };
    return map[estado] ?? 'secondary';
  }

  getMargenClass(pct: number): string {
    if (pct < 10) return 'margen-bajo';
    if (pct < 30) return 'margen-medio';
    return 'margen-alto';
  }

  getVariacionClass(v: number): string {
    return v >= 0 ? 'variacion-positiva' : 'variacion-negativa';
  }

  getVariacionIcon(v: number): string {
    return v >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down';
  }

  cop = (v: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(v ?? 0);
}
