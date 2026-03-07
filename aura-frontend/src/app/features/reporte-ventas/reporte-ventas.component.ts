import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { lastValueFrom } from 'rxjs';
import { ReporteService } from '../../core/services/reporte.service';
import { VentaService } from '../../core/services/venta.service';
interface StatCard {
  label: string;
  value: string;
  sub: string;
  icon: string;
  color: string;
}

interface VentaResumen {
  numero: string;
  fecha: string;
  caja: string;
  total: number;
  estado: string;
}

@Component({
  selector: 'app-reporte-ventas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CalendarModule,
    TagModule,
    SkeletonModule,
    TooltipModule,
    TableModule,
  ],
  templateUrl: './reporte-ventas.component.html',
  styleUrls: ['./reporte-ventas.component.scss'],
})
export class ReporteVentasComponent implements OnInit {
  desde: Date | null = null;
  hasta: Date | null = null;

  loadingStats = true;
  loadingTabla = true;
  loadingExcel = false;
  loadingPdf = false;

  stats: StatCard[] = [];
  ventas: VentaResumen[] = [];

  // Barras del mini-gráfico (últimos 7 días)
  barras: { dia: string; pct: number; valor: number }[] = [];

  constructor(
    private reporteService: ReporteService,
    private ventaService: VentaService,
  ) {}

  ngOnInit(): void {
    // Rango por defecto: mes actual
    const hoy = new Date();
    this.hasta = hoy;
    this.desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.loadingStats = true;
    this.loadingTabla = true;
    try {
      const res = await lastValueFrom(
        this.ventaService.page({
          page: 0,
          rows: 200,
          search: null,
          order_by: 'v.fecha',
          order: 'DESC',
        }),
      );
      const items = res?.data?.content ?? [];
      this.calcularStats(items);
      this.ventas = items.slice(0, 50).map((v: any) => ({
        numero: v.numeroVenta ?? `#${v.id}`,
        fecha: this.fmt(v.fechaEmision),
        caja: v.cajaNombre ?? '—',
        total: v.totalPagar ?? 0,
        estado: v.estadoVenta,
      }));
    } catch {
      /* silencioso */
    } finally {
      this.loadingStats = false;
      this.loadingTabla = false;
    }
  }

  private calcularStats(items: any[]): void {
    const completadas = items.filter((v) => v.estadoVenta === 'COMPLETADA');
    const anuladas = items.filter((v) => v.estadoVenta === 'ANULADA');
    const totalVentas = completadas.reduce(
      (s, v) => s + (v.totalPagar ?? 0),
      0,
    );
    const promedio = completadas.length ? totalVentas / completadas.length : 0;

    this.stats = [
      {
        label: 'Total Ingresos',
        value: this.cop(totalVentas),
        sub: `${completadas.length} ventas completadas`,
        icon: 'pi-dollar',
        color: 'green',
      },
      {
        label: 'Ticket Promedio',
        value: this.cop(promedio),
        sub: 'Por venta completada',
        icon: 'pi-chart-line',
        color: 'blue',
      },
      {
        label: 'Ventas Totales',
        value: String(items.length),
        sub: `${anuladas.length} anuladas`,
        icon: 'pi-receipt',
        color: 'purple',
      },
      {
        label: 'Tasa Conversión',
        value: items.length
          ? ((completadas.length / items.length) * 100).toFixed(1) + '%'
          : '0%',
        sub: 'Completadas vs totales',
        icon: 'pi-percentage',
        color: 'amber',
      },
    ];

    // Mini gráfico — últimos 7 días
    const dias: Record<string, number> = {};
    const hoy = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(hoy);
      d.setDate(hoy.getDate() - i);
      const key = d.toLocaleDateString('es-CO', { weekday: 'short' });
      dias[key] = 0;
    }
    completadas.forEach((v) => {
      if (!v.fechaEmision) return;
      const d = new Date(v.fechaEmision);
      const diff = Math.floor((hoy.getTime() - d.getTime()) / 86400000);
      if (diff >= 0 && diff < 7) {
        const key = d.toLocaleDateString('es-CO', { weekday: 'short' });
        dias[key] = (dias[key] ?? 0) + (v.totalPagar ?? 0);
      }
    });
    const max = Math.max(...Object.values(dias), 1);
    this.barras = Object.entries(dias).map(([dia, valor]) => ({
      dia,
      valor,
      pct: Math.round((valor / max) * 100),
    }));
  }

  filtrar(): void {
    this.cargar();
  }

  descargarExcel(): void {
    this.loadingExcel = true;
    this.reporteService
      .ventasExcel(this.fmtDate(this.desde), this.fmtDate(this.hasta))
      .subscribe({
        next: (b) => this.reporteService.descargar(b, 'reporte_ventas.xlsx'),
        complete: () => (this.loadingExcel = false),
        error: () => (this.loadingExcel = false),
      });
  }

  descargarPdf(): void {
    this.loadingPdf = true;
    this.reporteService
      .ventasPdf(this.fmtDate(this.desde), this.fmtDate(this.hasta))
      .subscribe({
        next: (b) => this.reporteService.visualizarPdf(b),
        complete: () => (this.loadingPdf = false),
        error: () => (this.loadingPdf = false),
      });
  }

  getSeverity(e: string): 'success' | 'danger' {
    return e === 'COMPLETADA' ? 'success' : 'danger';
  }

  cop(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v);
  }

  fmt(f: string): string {
    if (!f) return '—';
    return new Date(f).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private fmtDate(d: Date | null): string | undefined {
    if (!d) return undefined;
    return d.toISOString().split('T')[0];
  }
}
