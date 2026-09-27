import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { lastValueFrom } from 'rxjs';

import { CarteraService } from '../../../core/services/cartera.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { TableroCarteraModel, TableroMesModel } from '../../../core/models/cartera.model';

const FUENTE = "'Outfit', sans-serif";
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** Tipo de variación: si subir es bueno (recaudo) o malo (vencido, DSO). */
type Sentido = 'subirEsBueno' | 'subirEsMalo';

/**
 * Tablero gerencial de cartera. Cada mes es una foto al cierre (o a hoy en el
 * mes en curso) reconstruida en el backend desde los pagos, así que la
 * historia no depende de que alguien haya guardado cortes.
 */
@Component({
  selector: 'app-tablero-cartera',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ChartModule, TooltipModule, SkeletonModule],
  templateUrl: './tablero-cartera.component.html',
  styleUrls: ['./tablero-cartera.component.scss'],
})
export class TableroCarteraComponent implements OnInit {
  tablero: TableroCarteraModel | null = null;
  cargando = false;
  meses = 6;
  readonly periodos = [6, 12];

  chartEdades: any = null;
  chartRecaudo: any = null;
  opcionesEdades: any = {};
  opcionesRecaudo: any = {};

  constructor(
    private readonly carteraService: CarteraService,
    private readonly alert: AlertService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.construirOpciones();
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.carteraService.tablero(this.meses));
      this.tablero = res.data;
      this.construirGraficas(res.data.meses);
    } catch {
      this.alert.showError('Error', 'No se pudo cargar el tablero de cartera');
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  setMeses(m: number): void {
    if (this.meses === m) return;
    this.meses = m;
    this.cargar();
  }

  verFicha(terceroId: number): void {
    this.router.navigate(['/cartera/cliente', terceroId]);
  }

  // ── Presentación ────────────────────────────────────────────────────
  etiquetaMes(m: TableroMesModel | string): string {
    const iso = typeof m === 'string' ? m : m.mes;
    const [anio, mes] = iso.split('-');
    return `${MESES[Number(mes) - 1]} ${anio.slice(2)}`;
  }

  get corte(): string | null {
    const meses = this.tablero?.meses ?? [];
    return meses.length ? meses[meses.length - 1].corte : null;
  }

  get mesesDesc(): TableroMesModel[] {
    return [...(this.tablero?.meses ?? [])].reverse();
  }

  /** Variación porcentual contra el mes anterior; null si no hay base. */
  variacion(actual: number | null | undefined, anterior: number | null | undefined): number | null {
    if (actual == null || anterior == null || anterior === 0) return null;
    return Math.round(((actual - anterior) / Math.abs(anterior)) * 1000) / 10;
  }

  claseVariacion(delta: number | null, sentido: Sentido): string {
    if (delta == null || delta === 0) return 'neutro';
    const sube = delta > 0;
    return (sube && sentido === 'subirEsBueno') || (!sube && sentido === 'subirEsMalo') ? 'bien' : 'mal';
  }

  get maxVendedor(): number {
    return Math.max(1, ...(this.tablero?.porVendedor ?? []).map((v) => v.valor));
  }

  get maxMedio(): number {
    return Math.max(1, ...(this.tablero?.recaudoPorMedio ?? []).map((v) => v.valor));
  }

  get totalMedios(): number {
    return (this.tablero?.recaudoPorMedio ?? []).reduce((s, m) => s + m.valor, 0);
  }

  pct(valor: number, max: number): number {
    return max > 0 ? Math.max(2, Math.round((valor / max) * 100)) : 0;
  }

  formatCOP(v: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }

  formatCorto(v: number): string {
    const abs = Math.abs(v);
    if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `$${Math.round(v / 1_000)}K`;
    return `$${Math.round(v)}`;
  }

  // ── Gráficas ────────────────────────────────────────────────────────
  private construirGraficas(meses: TableroMesModel[]): void {
    const labels = meses.map((m) => this.etiquetaMes(m));
    const hayCartera = meses.some((m) => m.saldoTotal > 0);
    this.chartEdades = hayCartera
      ? {
          labels,
          datasets: [
            { label: 'Al día', data: meses.map((m) => m.alDia), backgroundColor: '#10b981' },
            { label: '1–30 días', data: meses.map((m) => m.dias1a30), backgroundColor: '#f59e0b' },
            { label: '31–60 días', data: meses.map((m) => m.dias31a60), backgroundColor: '#f97316' },
            { label: '61–90 días', data: meses.map((m) => m.dias61a90), backgroundColor: '#ef4444' },
            { label: '+90 días', data: meses.map((m) => m.mas90), backgroundColor: '#991b1b' },
          ].map((d) => ({ ...d, borderRadius: 4, maxBarThickness: 38 })),
        }
      : null;

    const hayCobro = meses.some((m) => m.cobrable > 0 || m.recaudado > 0);
    this.chartRecaudo = hayCobro
      ? {
          labels,
          datasets: [
            {
              type: 'line',
              label: 'Efectividad',
              data: meses.map((m) => m.efectividad),
              borderColor: '#2563eb',
              backgroundColor: '#2563eb',
              pointRadius: 3,
              tension: 0.3,
              yAxisID: 'pct',
              order: 0,
            },
            {
              type: 'bar',
              label: 'Por cobrar en el mes',
              data: meses.map((m) => m.cobrable),
              backgroundColor: 'rgba(148, 163, 184, 0.35)',
              borderRadius: 4,
              maxBarThickness: 30,
              yAxisID: 'y',
              order: 1,
            },
            {
              type: 'bar',
              label: 'Cobrado',
              data: meses.map((m) => m.recaudoCobrable),
              backgroundColor: '#10b981',
              borderRadius: 4,
              maxBarThickness: 30,
              yAxisID: 'y',
              order: 1,
            },
          ],
        }
      : null;
  }

  private construirOpciones(): void {
    const leyenda = {
      position: 'bottom',
      labels: { font: { family: FUENTE, size: 11 }, color: '#6B7280', usePointStyle: true, boxWidth: 8, padding: 14 },
    };
    const ejeX = { grid: { display: false }, ticks: { font: { family: FUENTE, size: 11 }, color: '#9CA3AF' } };
    const ejePesos = {
      grid: { color: 'rgba(148,163,184,0.15)' },
      ticks: { font: { family: FUENTE, size: 11 }, color: '#9CA3AF', callback: (v: number) => this.formatCorto(v) },
    };

    this.opcionesEdades = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: leyenda,
        tooltip: {
          callbacks: { label: (ctx: any) => ` ${ctx.dataset.label}: ${this.formatCOP(ctx.parsed.y)}` },
          bodyFont: { family: FUENTE },
          titleFont: { family: FUENTE },
        },
      },
      scales: { x: { ...ejeX, stacked: true }, y: { ...ejePesos, stacked: true } },
    };

    this.opcionesRecaudo = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: leyenda,
        tooltip: {
          callbacks: {
            label: (ctx: any) =>
              ctx.dataset.yAxisID === 'pct'
                ? ` Efectividad: ${ctx.parsed.y ?? '—'}%`
                : ` ${ctx.dataset.label}: ${this.formatCOP(ctx.parsed.y)}`,
          },
          bodyFont: { family: FUENTE },
          titleFont: { family: FUENTE },
        },
      },
      scales: {
        x: ejeX,
        y: ejePesos,
        pct: {
          position: 'right',
          min: 0,
          max: 100,
          grid: { display: false },
          ticks: { font: { family: FUENTE, size: 11 }, color: '#2563eb', callback: (v: number) => `${v}%` },
        },
      },
    };
  }
}
