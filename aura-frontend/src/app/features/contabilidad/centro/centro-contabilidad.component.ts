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

import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { StateStore } from '../../../core/store/state';
import {
  DashboardContableModel,
  ResultadoMesModel,
} from '../../../core/models/contabilidad.model';
import {
  GRUPOS_CONTABLES,
  GrupoContableConfig,
  MODULOS_CONTABLES,
} from './centro-contabilidad.config';

const FUENTE = "'Outfit', sans-serif";
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MESES_LARGOS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
/** Paleta de la dona: azul de marca y neutros/acentos suaves. */
const COLORES_GASTO = ['#2563eb', '#60a5fa', '#10b981', '#f59e0b', '#94a3b8', '#a78bfa', '#f472b6'];

/** Si que el valor suba es bueno (ingresos) o malo (gastos). */
type Sentido = 'subirEsBueno' | 'subirEsMalo';

export interface ModuloVisible {
  label: string;
  titulo: string;
  descripcion: string;
  icon: string;
  route: string;
}

export interface GrupoVisible extends GrupoContableConfig {
  modulos: ModuloVisible[];
}

/** Minúsculas y sin tildes, para buscar "concili" o "periodos" sin importar cómo se escriba. */
const plano = (s: string): string =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Centro de Contabilidad (/contabilidad). El sidebar ya no despliega las
 * pantallas contables: abre aquí. Arriba, el resumen del mes desde el mayor
 * (GET contabilidad/dashboard, una sola llamada); abajo, las pantallas que el
 * usuario tiene permitidas, agrupadas y con buscador. Los módulos salen del
 * menú ya filtrado del StateStore, así que respetan las mismas reglas que el
 * sidebar (submódulo activo + rol).
 */
@Component({
  selector: 'app-centro-contabilidad',
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
  templateUrl: './centro-contabilidad.component.html',
  styleUrls: ['./centro-contabilidad.component.scss'],
})
export class CentroContabilidadComponent implements OnInit {
  private readonly contabilidadService = inject(ContabilidadService);
  private readonly stateStore = inject(StateStore);

  // ── Resumen ─────────────────────────────────────────────────────────
  readonly cargando = signal(false);
  readonly error = signal(false);
  readonly resumen = signal<DashboardContableModel | null>(null);

  /** Mes consultado (el calendario trabaja con Date). */
  periodo: Date = new Date();
  readonly maxPeriodo = new Date();

  readonly sinDatos = computed(() => {
    const r = this.resumen();
    if (!r) return false;
    const hayMovimiento = r.serie.some((m) => m.ingresos || m.costos || m.gastos);
    return !hayMovimiento && r.distribucionGastos.length === 0 && r.estado.comprobantesMes === 0;
  });

  readonly chartResultado = computed(() => this.construirResultado(this.resumen()));
  readonly chartGastos = computed(() => {
    const r = this.resumen();
    if (!r || r.distribucionGastos.length === 0) return null;
    return {
      labels: r.distribucionGastos.map((g) => `${g.codigo} · ${g.nombre}`),
      datasets: [
        {
          data: r.distribucionGastos.map((g) => g.valor),
          backgroundColor: r.distribucionGastos.map((_, i) => COLORES_GASTO[i % COLORES_GASTO.length]),
          borderWidth: 0,
        },
      ],
    };
  });
  readonly totalGastosMes = computed(() =>
    (this.resumen()?.distribucionGastos ?? []).reduce((s, g) => s + g.valor, 0),
  );

  opcionesResultado: any = {};
  opcionesGastos: any = {};

  // ── Módulos ─────────────────────────────────────────────────────────
  readonly busqueda = signal('');

  /** Pantallas del grupo Contabilidad que el usuario puede ver (mismo filtro que el sidebar). */
  readonly modulosPermitidos = computed<ModuloVisible[]>(() => {
    const grupo = this.stateStore.menuGroups().find((g) => g.hubRoute === '/contabilidad');
    return (grupo?.items ?? [])
      .filter((i) => !!i.route)
      .map((i) => {
        const cfg = MODULOS_CONTABLES.find((m) => m.route === i.route);
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
    return GRUPOS_CONTABLES.map((g) => ({
      ...g,
      modulos: modulos.filter((m) => {
        const cfg = MODULOS_CONTABLES.find((c) => c.route === m.route);
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
        this.contabilidadService.dashboard(this.periodo.getFullYear(), this.periodo.getMonth() + 1),
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

  costosYGastos(m: ResultadoMesModel | null | undefined): number {
    return m ? m.costos + m.gastos : 0;
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
    return estado === 'ABIERTO' ? 'Abierto' : estado === 'CERRADO' ? 'Cerrado' : 'Sin crear';
  }

  etiquetaCierre(estado: string): string {
    return estado === 'CERRADO' ? 'Cerrado' : estado === 'PROVISIONADO' ? 'Provisionado' : 'No iniciado';
  }

  porcentajeGasto(valor: number): number {
    const total = this.totalGastosMes();
    return total > 0 ? Math.round((valor / total) * 1000) / 10 : 0;
  }

  colorGasto(i: number): string {
    return COLORES_GASTO[i % COLORES_GASTO.length];
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
  private construirResultado(r: DashboardContableModel | null): any {
    if (!r || !r.serie.some((m) => m.ingresos || m.costos || m.gastos)) return null;
    return {
      labels: r.serie.map((m) => MESES[m.mes - 1]),
      datasets: [
        {
          type: 'line',
          label: 'Utilidad',
          data: r.serie.map((m) => m.utilidad),
          borderColor: '#0f172a',
          backgroundColor: '#0f172a',
          pointRadius: 3,
          tension: 0.3,
          order: 0,
        },
        {
          type: 'bar',
          label: 'Ingresos',
          data: r.serie.map((m) => m.ingresos),
          backgroundColor: '#2563eb',
          borderRadius: 4,
          maxBarThickness: 26,
          order: 1,
        },
        {
          type: 'bar',
          label: 'Costos y gastos',
          data: r.serie.map((m) => m.costos + m.gastos),
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

    this.opcionesResultado = {
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

    this.opcionesGastos = {
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
