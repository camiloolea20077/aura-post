import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { CalendarModule } from 'primeng/calendar';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { NominaService } from '../../../core/services/nomina.service';
import { StateStore } from '../../../core/store/state';
import { DashboardRrhhModel } from '../../../core/models/nomina.model';
import { GRUPOS_RRHH, GrupoRrhhConfig, MODULOS_RRHH } from './centro-rrhh.config';

const FUENTE = "'Outfit', sans-serif";
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MESES_LARGOS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
/** Misma paleta que el Centro de Contabilidad. */
const COLORES_RUBRO = ['#2563eb', '#60a5fa', '#10b981', '#f59e0b', '#94a3b8', '#a78bfa', '#f472b6'];

type Sentido = 'subirEsBueno' | 'subirEsMalo';

export interface ModuloVisible {
  label: string;
  titulo: string;
  descripcion: string;
  icon: string;
  route: string;
}

export interface GrupoVisible extends GrupoRrhhConfig {
  modulos: ModuloVisible[];
}

/** Minúsculas y sin tildes, para buscar sin importar cómo se escriba. */
const plano = (s: string): string =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/**
 * Centro de Recursos Humanos (/recursos-humanos), con el mismo diseño que el de
 * Contabilidad. Arriba, el resumen de la nómina del mes (GET
 * recursos-humanos/dashboard, una sola llamada); abajo, las pantallas que el
 * usuario tiene permitidas, agrupadas y con buscador. Los módulos salen del menú
 * ya filtrado del StateStore, así que respetan las mismas reglas que el sidebar.
 */
@Component({
  selector: 'app-centro-rrhh',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ChartModule,
    CalendarModule,
    SkeletonModule,
    TooltipModule,
  ],
  templateUrl: './centro-rrhh.component.html',
  // Los estilos son los del Centro de Contabilidad: mismo diseño, una sola fuente.
  styleUrls: ['../../contabilidad/centro/centro-contabilidad.component.scss'],
})
export class CentroRrhhComponent implements OnInit {
  private readonly nominaService = inject(NominaService);
  private readonly stateStore = inject(StateStore);

  // ── Resumen ─────────────────────────────────────────────────────────
  readonly cargando = signal(false);
  readonly error = signal(false);
  readonly resumen = signal<DashboardRrhhModel | null>(null);

  periodo: Date = new Date();
  readonly maxPeriodo = new Date();

  readonly sinDatos = computed(() => {
    const r = this.resumen();
    if (!r) return false;
    return !r.serie.some((m) => m.costoTotal) && r.personal.activos === 0;
  });

  readonly chartCosto = computed(() => this.construirCosto(this.resumen()));
  readonly chartRubros = computed(() => {
    const r = this.resumen();
    if (!r || r.distribucionCosto.length === 0) return null;
    return {
      labels: r.distribucionCosto.map((g) => g.nombre),
      datasets: [
        {
          data: r.distribucionCosto.map((g) => g.valor),
          backgroundColor: r.distribucionCosto.map((_, i) => COLORES_RUBRO[i % COLORES_RUBRO.length]),
          borderWidth: 0,
        },
      ],
    };
  });
  readonly totalCostoMes = computed(() =>
    (this.resumen()?.distribucionCosto ?? []).reduce((s, g) => s + g.valor, 0),
  );

  opcionesCosto: any = {};
  opcionesRubros: any = {};

  // ── Módulos ─────────────────────────────────────────────────────────
  readonly busqueda = signal('');

  /** Pantallas del grupo Recursos Humanos que el usuario puede ver (mismo filtro que el sidebar). */
  readonly modulosPermitidos = computed<ModuloVisible[]>(() => {
    const grupo = this.stateStore.menuGroups().find((g) => g.hubRoute === '/recursos-humanos');
    return (grupo?.items ?? [])
      .filter((i) => !!i.route)
      .map((i) => {
        const cfg = MODULOS_RRHH.find((m) => m.route === i.route);
        return {
          label: i.label,
          titulo: cfg?.titulo ?? i.label,
          descripcion: cfg?.descripcion ?? '',
          icon: i.icon,
          route: i.route!,
        };
      });
  });

  readonly gruposVisibles = computed<GrupoVisible[]>(() => {
    const q = plano(this.busqueda().trim());
    const modulos = this.modulosPermitidos().filter(
      (m) => !q || plano(`${m.titulo} ${m.label} ${m.descripcion}`).includes(q),
    );
    return GRUPOS_RRHH.map((g) => ({
      ...g,
      modulos: modulos.filter((m) => {
        const cfg = MODULOS_RRHH.find((c) => c.route === m.route);
        return (cfg?.grupo ?? 'otros') === g.id;
      }),
    })).filter((g) => g.modulos.length > 0);
  });

  /** Para enlazar los pendientes solo si el usuario puede abrir la pantalla. */
  puedeAbrir(route: string): boolean {
    return this.modulosPermitidos().some((m) => m.route === route);
  }

  ngOnInit(): void {
    this.construirOpciones();
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(false);
    try {
      const res = await lastValueFrom(
        this.nominaService.dashboard(this.periodo.getFullYear(), this.periodo.getMonth() + 1),
      );
      this.resumen.set(res.data);
    } catch {
      this.resumen.set(null);
      this.error.set(true);
    } finally {
      this.cargando.set(false);
    }
  }

  cambiarPeriodo(fecha: Date | null): void {
    if (!fecha) return;
    this.periodo = fecha;
    this.cargar();
  }

  // ── Presentación ────────────────────────────────────────────────────
  get nombrePeriodo(): string {
    return `${MESES_LARGOS[this.periodo.getMonth()]} ${this.periodo.getFullYear()}`;
  }

  nombreMes(anio: number, mes: number): string {
    return `${MESES_LARGOS[mes - 1]} ${anio}`;
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

  etiquetaPeriodo(estado: string): string {
    switch (estado) {
      case 'ABIERTO': return 'Abierto';
      case 'LIQUIDADO': return 'Liquidado';
      case 'PAGADO': return 'Pagado';
      default: return 'Sin crear';
    }
  }

  porcentajeRubro(valor: number): number {
    const total = this.totalCostoMes();
    return total > 0 ? Math.round((valor / total) * 1000) / 10 : 0;
  }

  colorRubro(i: number): string {
    return COLORES_RUBRO[i % COLORES_RUBRO.length];
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
  private construirCosto(r: DashboardRrhhModel | null): any {
    if (!r || !r.serie.some((m) => m.costoTotal)) return null;
    return {
      labels: r.serie.map((m) => MESES[m.mes - 1]),
      datasets: [
        {
          type: 'line',
          label: 'Costo total',
          data: r.serie.map((m) => m.costoTotal),
          borderColor: '#0f172a',
          backgroundColor: '#0f172a',
          pointRadius: 3,
          tension: 0.3,
          order: 0,
        },
        {
          type: 'bar',
          label: 'Devengado',
          data: r.serie.map((m) => m.devengado),
          backgroundColor: '#2563eb',
          borderRadius: 4,
          maxBarThickness: 26,
          order: 1,
        },
        {
          type: 'bar',
          label: 'Aportes y prestaciones',
          data: r.serie.map((m) => m.aportes + m.provisiones),
          backgroundColor: '#93c5fd',
          borderRadius: 4,
          maxBarThickness: 26,
          order: 1,
        },
      ],
    };
  }

  private construirOpciones(): void {
    const leyenda = {
      position: 'bottom',
      labels: { font: { family: FUENTE, size: 11 }, color: '#6B7280', usePointStyle: true, boxWidth: 8, padding: 14 },
    };
    const tooltip = {
      callbacks: { label: (ctx: any) => ` ${ctx.dataset.label ?? ctx.label}: ${this.formatCOP(ctx.parsed.y ?? ctx.parsed)}` },
      bodyFont: { family: FUENTE },
      titleFont: { family: FUENTE },
    };

    this.opcionesCosto = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: leyenda, tooltip },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: FUENTE, size: 11 }, color: '#9CA3AF' } },
        y: {
          grid: { color: 'rgba(148,163,184,0.15)' },
          ticks: { font: { family: FUENTE, size: 11 }, color: '#9CA3AF', callback: (v: number) => this.formatCorto(v) },
        },
      },
    };

    this.opcionesRubros = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (ctx: any) => ` ${ctx.label}: ${this.formatCOP(ctx.parsed)}` },
          bodyFont: { family: FUENTE },
          titleFont: { family: FUENTE },
        },
      },
    };
  }
}
