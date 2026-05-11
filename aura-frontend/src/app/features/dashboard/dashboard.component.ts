import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { DashboardService } from '../../core/services/dashboard.service';
import {
  DashboardDto,
  MetodoPagoDto,
  ProductoStockBajoDto,
  VentasSemanaDto,
} from '../../core/models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ChartModule,
    TagModule,
    SkeletonModule,
    TooltipModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  public dashboard: DashboardDto | null = null;
  public loading = true;

  // Charts
  public chartVentasSemana: any = null;
  public chartMetodoPago: any = null;
  public chartOptions: any = {};
  public doughnutOptions: any = {};

  public today = new Date();
  public userName = '';
  public metodoPagoLider = '';

  constructor(private readonly dashboardService: DashboardService) {}

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadDashboard(), this.loadCharts()]);
  }

  // ─── Carga principal ────────────────────────────────────────
  private async loadDashboard(): Promise<void> {
    this.loading = true;
    try {
      const response = await lastValueFrom(this.dashboardService.obtener());
      if (response?.data) {
        this.dashboard = response.data;
      }
    } catch (error) {
      console.error('[Dashboard] Error cargando datos:', error);
    } finally {
      this.loading = false;
    }
  }

  // ─── Charts ─────────────────────────────────────────────────
  private async loadCharts(): Promise<void> {
    await Promise.all([
      this.loadChartVentasSemana(),
      this.loadChartMetodoPago(),
    ]);
    this.buildChartOptions();
  }

  private async loadChartVentasSemana(): Promise<void> {
    try {
      const response = await lastValueFrom(
        this.dashboardService.ventasSemana(),
      );
      const data: VentasSemanaDto[] = response?.data ?? [];

      // Días de la semana base (lun → dom)
      const diasBase = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      const totales = new Array(7).fill(0);

      data.forEach((item) => {
        const fecha = new Date(item.fecha + 'T00:00:00');
        const dow = (fecha.getDay() + 6) % 7; // 0=lunes
        totales[dow] = item.total;
      });

      this.chartVentasSemana = {
        labels: diasBase,
        datasets: [
          {
            label: 'Ventas ($)',
            data: totales,
            backgroundColor: 'rgba(46, 108, 246, 0.15)',
            borderColor: '#2E6CF6',
            borderWidth: 2,
            borderRadius: 8,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#2E6CF6',
            pointRadius: 5,
            pointHoverRadius: 7,
          },
        ],
      };
    } catch (error) {
      console.error('[Dashboard] Error chart ventas semana:', error);
    }
  }

  private async loadChartMetodoPago(): Promise<void> {
    try {
      const response = await lastValueFrom(
        this.dashboardService.ventasMetodoPago(),
      );
      const data: MetodoPagoDto[] = response?.data ?? [];

      // Obtener el método de pago líder (el primero, que tiene más ventas)
      if (data.length > 0) {
        this.metodoPagoLider = this.formatMetodoPago(data[0].metodo_pago);
      }

      const colores: Record<string, string> = {
        EFECTIVO: '#10B981',
        TARJETA: '#2E6CF6',
        CREDITO: '#F59E0B',
        NEQUI: '#7B4DFF',
      };

      this.chartMetodoPago = {
        labels: data.map((d) => d.metodo_pago),
        datasets: [
          {
            data: data.map((d) => d.total),
            backgroundColor: data.map(
              (d) => colores[d.metodo_pago] ?? '#9CA3AF',
            ),
            borderWidth: 2,
            borderColor: '#FFFFFF',
            hoverOffset: 6,
          },
        ],
      };
    } catch (error) {
      console.error('[Dashboard] Error chart método pago:', error);
    }
  }

  private buildChartOptions(): void {
    const font = "'Outfit', sans-serif";

    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: any) =>
              ` $${ctx.parsed.y?.toLocaleString('es-CO') ?? 0}`,
          },
          bodyFont: { family: font },
          titleFont: { family: font },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: font, size: 12 }, color: '#9CA3AF' },
        },
        y: {
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: {
            font: { family: font, size: 11 },
            color: '#9CA3AF',
            callback: (v: number) => `$${(v / 1000).toFixed(0)}K`,
          },
        },
      },
    };

    this.doughnutOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { family: font, size: 12 },
            color: '#6B7280',
            padding: 16,
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx: any) =>
              ` $${ctx.parsed?.toLocaleString('es-CO') ?? 0}`,
          },
          bodyFont: { family: font },
        },
      },
    };
  }

  // ─── Helpers de display ──────────────────────────────────────
  getStockPorcentaje(item: ProductoStockBajoDto): number {
    if (!item.stockMinimo) return 0;
    return Math.min(100, (item.stockActual / item.stockMinimo) * 100);
  }

  getStockSeverity(item: ProductoStockBajoDto): string {
    const pct = this.getStockPorcentaje(item);
    if (pct <= 25) return 'danger';
    if (pct <= 60) return 'warning';
    return 'success';
  }

  getLoteUrgencia(dias: number): string {
    if (dias <= 5) return 'danger';
    if (dias <= 15) return 'warning';
    return 'info';
  }

  getVentaEstadoSeverity(estado: string): 'success' | 'danger' {
    return estado === 'COMPLETADA' ? 'success' : 'danger';
  }

  getMovimientoIcon(tipo: string): string {
    const map: Record<string, string> = {
      COMPRA: 'pi pi-arrow-down-left',
      ANULACION_COMPRA: 'pi pi-times',
      VENTA: 'pi pi-arrow-up-right',
      ANULACION_VENTA: 'pi pi-times',
      MERMA: 'pi pi-trash',
      ANULACION_MERMA: 'pi pi-times',
      TRASLADO_SALIDA: 'pi pi-arrow-right',
      TRASLADO_ENTRADA: 'pi pi-arrow-left',
      ANULACION_TRASLADO: 'pi pi-times',
    };
    return map[tipo] ?? 'pi pi-circle';
  }

  getMovimientoClass(tipo: string): string {
    if (tipo.startsWith('ANULACION')) return 'mov-anulacion';
    if (tipo === 'COMPRA' || tipo === 'TRASLADO_ENTRADA') return 'mov-entrada';
    return 'mov-salida';
  }

  formatCOP(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value ?? 0);
  }
  private formatMetodoPago(metodo: string): string {
    const map: Record<string, string> = {
      EFECTIVO: 'Efectivo',
      TARJETA: 'Tarjeta',
      NEQUI: 'Nequi',
      TRANSFERENCIA: 'Transferencia',
      CREDITO: 'Crédito',
      CHEQUE: 'Cheque',
    };
    return map[metodo] ?? metodo;
  }
  getRankClass(i: number): string {
    if (i === 0) return 'rank-gold';
    if (i === 1) return 'rank-silver';
    if (i === 2) return 'rank-bronze';
    return 'rank-default';
  }

  get skeletons(): number[] {
    return [1, 2, 3, 4, 5];
  }
}
