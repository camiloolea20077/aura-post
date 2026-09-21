import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { ChartModule } from 'primeng/chart';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';

import { CierreContableService } from '../../../core/services/cierre-contable.service';
import {
  CierreContableDto,
  GraficasCierreDto,
  ParteCierreModel,
} from '../../../core/models/cierre-contable.model';

import { aFechaLocal } from '../../../shared/utils/fecha.util';
// Paletas validadas con el script de dataviz (bandas de luminosidad, piso de
// croma, separación para daltonismo y contraste contra la superficie del tema).
const CATEGORICAS_CLARO = ['#2563eb', '#0d9488', '#f59e0b', '#db2777', '#7c3aed', '#65a30d'];
const CATEGORICAS_OSCURO = ['#3b82f6', '#0d9488', '#d97706', '#ec4899', '#8b5cf6', '#65a30d'];
const FUENTE = "'Outfit', sans-serif";
const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

@Component({
  selector: 'app-cierre-contable',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CalendarModule,
    SkeletonModule,
    TagModule,
    ToastModule,
    DividerModule,
    ChartModule,
    TooltipModule,
  ],
  providers: [MessageService],
  templateUrl: './cierre-contable.component.html',
  styleUrls: ['./cierre-contable.component.scss'],
})
export class CierreContableComponent implements OnInit, OnDestroy {
  data: CierreContableDto | null = null;
  graficas: GraficasCierreDto | null = null;
  loading = false;

  // ── Gráficas ──────────────────────────────────────────────────────
  chartEvolucion: any = null;
  opcionesEvolucion: any = {};
  chartCascada: any = null;
  opcionesCascada: any = {};
  chartMedios: any = null;
  opcionesMedios: any = {};
  chartGastos: any = null;
  opcionesGastos: any = {};
  leyendaMedios: { etiqueta: string; valor: number; pct: number; color: string }[] = [];

  private observadorTema?: MutationObserver;

  fechaDesde: Date = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  );
  fechaHasta: Date = new Date();

  constructor(
    private readonly service: CierreContableService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
    // El tema se cambia sin recargar la página: las gráficas se repintan con la
    // paleta del tema nuevo (los colores de serie no son variables CSS).
    this.observadorTema = new MutationObserver(() => {
      if (this.graficas) this.construirGraficas();
      this.cdr.markForCheck();
    });
    this.observadorTema.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  ngOnDestroy(): void {
    this.observadorTema?.disconnect();
  }

  async cargar(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const [res, graf] = await Promise.all([
        lastValueFrom(
          this.service.obtener(this.fmt(this.fechaDesde), this.fmt(this.fechaHasta)),
        ),
        lastValueFrom(
          this.service.graficas(this.fmt(this.fechaDesde), this.fmt(this.fechaHasta)),
        ).catch(() => null),
      ]);
      this.data = res?.data ?? null;
      this.graficas = graf?.data ?? null;
      this.construirGraficas();
    } catch {
      this.data = null;
      this.graficas = null;
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  private get temaOscuro(): boolean {
    return document.documentElement.classList.contains('dark-mode');
  }

  private get paleta(): string[] {
    return this.temaOscuro ? CATEGORICAS_OSCURO : CATEGORICAS_CLARO;
  }

  /** Verde y rojo de estado: reservados para "quedó" y "se fue". */
  private get colorOk(): string {
    return this.temaOscuro ? '#34d399' : '#059669';
  }

  private get colorMal(): string {
    return this.temaOscuro ? '#f87171' : '#dc2626';
  }

  private get tinta(): string {
    return this.temaOscuro ? '#94a3b8' : '#64748b';
  }

  private get rejilla(): string {
    return this.temaOscuro ? 'rgba(148,163,184,0.16)' : 'rgba(100,116,139,0.14)';
  }

  /** Eje de dinero en miles/millones: "$ 1,2 M" se lee, "1200000" no. */
  private corto(v: number): string {
    const abs = Math.abs(v);
    if (abs >= 1_000_000) return '$' + (v / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1) + ' M';
    if (abs >= 1_000) return '$' + (v / 1_000).toFixed(0) + ' k';
    return '$' + v.toFixed(0);
  }

  etiquetaPunto(iso: string): string {
    const partes = iso.split('-');
    if (partes.length === 2) return `${MESES_CORTOS[Number(partes[1]) - 1]} ${partes[0].slice(2)}`;
    return `${partes[2]}/${partes[1]}`;
  }

  private construirGraficas(): void {
    const g = this.graficas;
    const d = this.data;
    if (!g || !d) {
      this.chartEvolucion = this.chartCascada = this.chartMedios = this.chartGastos = null;
      return;
    }
    const tooltipDinero = {
      backgroundColor: this.temaOscuro ? '#111827' : '#0f172a',
      titleFont: { family: FUENTE, size: 12 },
      bodyFont: { family: FUENTE, size: 12 },
      padding: 10,
      displayColors: true,
      callbacks: {
        label: (ctx: any) => {
          const valor = Array.isArray(ctx.raw) ? ctx.raw[1] - ctx.raw[0] : ctx.raw;
          return ` ${ctx.dataset.label ?? ctx.label}: ${this.formatCOP(valor)}`;
        },
      },
    };
    const ejeDinero = {
      ticks: { color: this.tinta, font: { family: FUENTE, size: 11 },
               callback: (v: any) => this.corto(Number(v)) },
      grid: { color: this.rejilla, drawBorder: false },
      border: { display: false },
    };
    const ejeTexto = {
      ticks: { color: this.tinta, font: { family: FUENTE, size: 11 } },
      grid: { display: false },
      border: { display: false },
    };

    // ── Qué pasó día a día: la barra completa es la venta; abajo lo que costó,
    //    arriba lo que quedó de margen.
    const hayVentas = g.serie.some((p) => p.ventas > 0);
    this.chartEvolucion = hayVentas
      ? {
          labels: g.serie.map((p) => this.etiquetaPunto(p.etiqueta)),
          datasets: [
            {
              label: 'Costo de lo vendido',
              data: g.serie.map((p) => p.costo),
              backgroundColor: this.paleta[0],
              borderRadius: 4,
              maxBarThickness: 34,
            },
            {
              label: 'Margen bruto',
              data: g.serie.map((p) => Math.max(p.utilidadBruta, 0)),
              backgroundColor: this.colorOk,
              borderRadius: 4,
              maxBarThickness: 34,
            },
          ],
        }
      : null;
    this.opcionesEvolucion = {
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: { color: this.tinta, font: { family: FUENTE, size: 12 },
                    usePointStyle: true, pointStyle: 'circle', boxWidth: 8 },
        },
        tooltip: tooltipDinero,
      },
      scales: {
        x: { ...ejeTexto, stacked: true },
        y: { ...ejeDinero, stacked: true, beginAtZero: true },
      },
    };

    // ── En qué se convirtió la venta: cascada de ventas a utilidad neta.
    const pasos: { etiqueta: string; delta: number }[] = [
      { etiqueta: 'Ventas', delta: d.totalVentasSinIva ?? 0 },
      { etiqueta: 'Costo', delta: -(d.costoVentas ?? 0) },
      { etiqueta: 'Mermas', delta: -(d.totalMermas ?? 0) },
      { etiqueta: 'Comisiones', delta: -(d.totalComisionesTecnicos ?? 0) },
      { etiqueta: 'Gastos ded.', delta: -(d.totalGastosDeducibles ?? 0) },
      { etiqueta: 'Gastos no ded.', delta: -(d.totalGastosNoDeducibles ?? 0) },
    ].filter((x, i) => i === 0 || x.delta !== 0);
    let acumulado = 0;
    const barras = pasos.map((paso) => {
      const desde = acumulado;
      acumulado += paso.delta;
      return { etiqueta: paso.etiqueta, rango: [Math.min(desde, acumulado), Math.max(desde, acumulado)], baja: paso.delta < 0 };
    });
    const neta = d.utilidadNeta ?? 0;
    this.chartCascada = pasos.length
      ? {
          labels: [...barras.map((b) => b.etiqueta), 'Utilidad neta'],
          datasets: [
            {
              label: 'Valor',
              data: [...barras.map((b) => b.rango), [Math.min(0, neta), Math.max(0, neta)]],
              backgroundColor: [
                ...barras.map((b) => (b.baja ? this.colorMal : this.paleta[0])),
                neta >= 0 ? this.colorOk : this.colorMal,
              ],
              borderRadius: 4,
              maxBarThickness: 30,
            },
          ],
        }
      : null;
    this.opcionesCascada = {
      indexAxis: 'y',
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipDinero,
          callbacks: {
            label: (ctx: any) => ` ${this.formatCOP(Math.abs(ctx.raw[1] - ctx.raw[0]))}`,
          },
        },
      },
      scales: { x: { ...ejeDinero, beginAtZero: true }, y: ejeTexto },
    };

    // ── Con qué pagaron: dona con leyenda propia (los valores van al lado).
    const medios = this.agrupar(g.mediosPago, 5);
    const totalMedios = medios.reduce((acc, m) => acc + m.valor, 0);
    this.chartMedios = medios.length
      ? {
          labels: medios.map((m) => this.titulo(m.etiqueta)),
          datasets: [
            {
              data: medios.map((m) => m.valor),
              backgroundColor: medios.map((_, i) => this.paleta[i % this.paleta.length]),
              borderWidth: 2,
              borderColor: this.temaOscuro ? '#1a1d2e' : '#ffffff',
            },
          ],
        }
      : null;
    this.leyendaMedios = medios.map((m, i) => ({
      etiqueta: this.titulo(m.etiqueta),
      valor: m.valor,
      pct: totalMedios > 0 ? (m.valor / totalMedios) * 100 : 0,
      color: this.paleta[i % this.paleta.length],
    }));
    this.opcionesMedios = {
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: { legend: { display: false }, tooltip: tooltipDinero },
    };

    // ── En qué se fue el gasto: magnitud, un solo color.
    const gastos = this.agrupar(g.gastosCategoria, 6);
    this.chartGastos = gastos.length
      ? {
          labels: gastos.map((x) => this.titulo(x.etiqueta)),
          datasets: [
            {
              label: 'Gasto',
              data: gastos.map((x) => x.valor),
              backgroundColor: this.paleta[0],
              borderRadius: 4,
              maxBarThickness: 26,
            },
          ],
        }
      : null;
    this.opcionesGastos = {
      indexAxis: 'y',
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: tooltipDinero },
      scales: { x: { ...ejeDinero, beginAtZero: true }, y: ejeTexto },
    };
  }

  /** Deja los primeros n y junta la cola en "Otros": nunca se inventa un color más. */
  private agrupar(partes: ParteCierreModel[], n: number): ParteCierreModel[] {
    const limpias = (partes ?? []).filter((p) => p.valor > 0);
    if (limpias.length <= n) return limpias;
    const cabeza = limpias.slice(0, n);
    const cola = limpias.slice(n);
    return [
      ...cabeza,
      {
        etiqueta: 'Otros',
        valor: cola.reduce((acc, x) => acc + x.valor, 0),
        cantidad: cola.reduce((acc, x) => acc + (x.cantidad ?? 0), 0),
      },
    ];
  }

  /** EFECTIVO → Efectivo; SERVICIOS_PUBLICOS → Servicios publicos. */
  private titulo(v: string): string {
    const limpio = (v ?? '').replace(/_/g, ' ').toLowerCase();
    return limpio.charAt(0).toUpperCase() + limpio.slice(1);
  }

  /** El día (o mes) que más margen dejó, para contarlo debajo de la gráfica. */
  get mejorPunto(): { etiqueta: string; utilidadBruta: number } | null {
    const serie = this.graficas?.serie ?? [];
    if (!serie.length) return null;
    const mejor = serie.reduce((a, b) => (b.utilidadBruta > a.utilidadBruta ? b : a));
    return mejor.ventas > 0
      ? { etiqueta: this.etiquetaPunto(mejor.etiqueta), utilidadBruta: mejor.utilidadBruta }
      : null;
  }

  get diasConVenta(): number {
    return (this.graficas?.serie ?? []).filter((p) => p.ventas > 0).length;
  }

  get ticketPromedio(): number {
    const ventas = this.data?.cantidadVentas ?? 0;
    return ventas > 0 ? (this.data?.totalVentasSinIva ?? 0) / ventas : 0;
  }

  private fmt(d: Date): string {
    return aFechaLocal(d);
  }

  formatCOP(v: number | null | undefined): string {
    if (v == null) return '—';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v);
  }

  pct(v: number | null | undefined): string {
    if (v == null) return '—';
    return v.toFixed(1) + '%';
  }

  utilClass(v: number | null | undefined): string {
    if (v == null || v === 0) return 'neutral';
    return v > 0 ? 'positivo' : 'negativo';
  }

  posNeta(v: number | null | undefined): 'success' | 'warn' | 'danger' {
    if (v == null || v === 0) return 'warn';
    return v > 0 ? 'success' : 'danger';
  }

  async exportarExcel(): Promise<void> {
    if (!this.data) return;
    const d = this.data;
    const n = (v: number | null | undefined) => v ?? 0;

    // ── Paleta ────────────────────────────────────────────────
    const C = {
      indigo: '6366F1',
      indigoDark: '4F46E5',
      green: '10B981',
      greenDark: '059669',
      red: 'EF4444',
      blue: '3B82F6',
      dark: '1E293B',
      muted: '64748B',
      border: 'E2E8F0',
      bgLight: 'F8FAFC',
      bgAlt: 'EEF2FF',
      white: 'FFFFFF',
    };

    const copFmt = '#,##0';

    const fill = (argb: string): any => ({
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb },
    });

    const border = (argb: string = C.border): any => ({
      style: 'thin',
      color: { argb },
    });

    const allBorders = (argb: string = C.border) => ({
      top: border(argb),
      left: border(argb),
      bottom: border(argb),
      right: border(argb),
    });

    const styleTitle = (row: any) => {
      row.height = 28;
      row.eachCell((cell: any) => {
        cell.fill = fill(C.indigo);
        cell.font = {
          bold: true,
          size: 16,
          color: { argb: C.white },
          name: 'Calibri',
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
    };

    const styleSubtitle = (row: any) => {
      row.height = 16;
      row.eachCell((cell: any) => {
        cell.fill = fill(C.bgLight);
        cell.font = { size: 9, color: { argb: C.muted }, name: 'Calibri' };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      });
    };

    const styleSectionHeader = (row: any, color = C.indigoDark) => {
      row.height = 20;
      row.eachCell((cell: any) => {
        cell.fill = fill(color);
        cell.font = {
          bold: true,
          size: 10,
          color: { argb: C.white },
          name: 'Calibri',
        };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.border = allBorders(color);
      });
    };

    const styleColHeader = (row: any) => {
      row.height = 16;
      row.eachCell((cell: any) => {
        cell.fill = fill(C.dark);
        cell.font = {
          bold: true,
          size: 9,
          color: { argb: C.white },
          name: 'Calibri',
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = allBorders(C.dark);
      });
    };

    const styleDataRow = (row: any, alt = false) => {
      row.height = 15;
      row.eachCell({ includeEmpty: true }, (cell: any) => {
        cell.fill = fill(alt ? C.bgAlt : C.white);
        cell.font = { size: 9, name: 'Calibri' };
        cell.border = allBorders();
        cell.alignment = { vertical: 'middle' };
      });
    };

    const styleSubtotal = (row: any, color = C.bgLight) => {
      row.height = 16;
      row.eachCell({ includeEmpty: true }, (cell: any) => {
        cell.fill = fill(color);
        cell.font = { bold: true, size: 9, name: 'Calibri' };
        cell.border = allBorders(C.border);
        cell.alignment = { vertical: 'middle' };
      });
    };

    const styleTotal = (row: any, bgColor = C.indigo) => {
      row.height = 18;
      row.eachCell({ includeEmpty: true }, (cell: any) => {
        cell.fill = fill(bgColor);
        cell.font = {
          bold: true,
          size: 10,
          color: { argb: C.white },
          name: 'Calibri',
        };
        cell.border = allBorders(bgColor);
        cell.alignment = { vertical: 'middle' };
      });
    };

    const addEmpty = (sheet: any) => {
      const r = sheet.addRow([]);
      r.height = 8;
    };

    // ── Workbook ──────────────────────────────────────────────
    const wb = new Workbook();
    wb.creator = 'Aura Nube';
    wb.created = new Date();

    const ws = wb.addWorksheet('Cierre Contable', {
      pageSetup: {
        paperSize: 9,
        orientation: 'portrait',
        fitToPage: true,
        fitToWidth: 1,
      },
      properties: { tabColor: { argb: C.indigo } },
    });

    ws.columns = [
      { key: 'A', width: 34 },
      { key: 'B', width: 14 },
      { key: 'C', width: 20 },
      { key: 'D', width: 16 },
      { key: 'E', width: 12 },
    ];

    // ── Título ─────────────────────────────────────────────────
    const rowTitulo = ws.addRow(['CIERRE CONTABLE', '', '', '', '']);
    ws.mergeCells(`A${rowTitulo.number}:E${rowTitulo.number}`);
    styleTitle(rowTitulo);

    const rowSub = ws.addRow([
      `Período: ${d.fechaDesde}  →  ${d.fechaHasta}`,
      '',
      '',
      `Generado: ${new Date().toLocaleDateString('es-CO')}`,
      '',
    ]);
    ws.mergeCells(`A${rowSub.number}:C${rowSub.number}`);
    ws.mergeCells(`D${rowSub.number}:E${rowSub.number}`);
    styleSubtitle(rowSub);
    rowSub.getCell('D').alignment = { horizontal: 'right' };

    addEmpty(ws);

    // ── KPIs rápidos ───────────────────────────────────────────
    const rowKpiH = ws.addRow(['INDICADORES CLAVE', '', '', '', '']);
    ws.mergeCells(`A${rowKpiH.number}:E${rowKpiH.number}`);
    styleSectionHeader(rowKpiH, C.dark);

    const rowKpiCols = ws.addRow([
      'Ventas sin IVA',
      'COGS',
      'Utilidad bruta',
      'Utilidad operativa',
      'Utilidad neta',
    ]);
    styleColHeader(rowKpiCols);

    const rowKpiVals = ws.addRow([
      n(d.totalVentasSinIva),
      n(d.costoVentas),
      n(d.utilidadBruta),
      n(d.utilidadOperativa),
      n(d.utilidadNeta),
    ]);
    rowKpiVals.height = 18;
    rowKpiVals.eachCell({ includeEmpty: true }, (cell, col) => {
      cell.fill = fill(C.bgAlt);
      cell.font = { bold: true, size: 11, name: 'Calibri' };
      cell.border = allBorders();
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.numFmt = `"$"#,##0`;
      if (col === 3)
        cell.font.color = {
          argb: n(d.utilidadBruta) >= 0 ? C.greenDark : C.red,
        };
      if (col === 4)
        cell.font.color = {
          argb: n(d.utilidadOperativa) >= 0 ? C.greenDark : C.red,
        };
      if (col === 5)
        cell.font.color = {
          argb: n(d.utilidadNeta) >= 0 ? C.greenDark : C.red,
        };
    });

    addEmpty(ws);

    // ── Estado de Resultados ───────────────────────────────────
    const rowPlH = ws.addRow(['ESTADO DE RESULTADOS (P&L)', '', '', '', '']);
    ws.mergeCells(`A${rowPlH.number}:E${rowPlH.number}`);
    styleSectionHeader(rowPlH, C.indigo);

    const rowPlCols = ws.addRow(['Concepto', '', 'Valor (COP)', 'Margen', '']);
    ws.mergeCells(`A${rowPlCols.number}:B${rowPlCols.number}`);
    styleColHeader(rowPlCols);

    const addPlRow = (
      label: string,
      value: number,
      margen?: string,
      isSubtotal = false,
      isTotal = false,
      isDebit = false,
      alt = false,
    ) => {
      const r = ws.addRow([label, '', value, margen ?? '', '']);
      ws.mergeCells(`A${r.number}:B${r.number}`);
      ws.mergeCells(`D${r.number}:E${r.number}`);
      if (isTotal) styleTotal(r, value >= 0 ? C.indigoDark : C.red);
      else if (isSubtotal) styleSubtotal(r, C.bgLight);
      else styleDataRow(r, alt);

      const cellA = r.getCell('A');
      const cellC = r.getCell('C');
      const cellD = r.getCell('D');

      cellA.alignment = { horizontal: 'left', vertical: 'middle' };
      cellC.alignment = { horizontal: 'right', vertical: 'middle' };
      cellD.alignment = { horizontal: 'center', vertical: 'middle' };
      cellC.numFmt = isDebit ? `"($"#,##0")"` : `"$"#,##0`;
      if (!isTotal) {
        if (isDebit) cellC.font = { ...cellC.font, color: { argb: C.red } };
        else if (value > 0)
          cellC.font = {
            ...cellC.font,
            color: { argb: isSubtotal || isTotal ? C.dark : C.green },
          };
      }
      if (margen)
        cellD.font = { ...cellD.font, size: 9, color: { argb: C.muted } };
    };

    addPlRow('Ventas brutas (subtotal)', n(d.totalVentasBruto));
    if (n(d.totalDescuentos) > 0)
      addPlRow(
        '(−) Descuentos',
        n(d.totalDescuentos),
        '',
        false,
        false,
        true,
        true,
      );
    addPlRow(
      'IVA cobrado (no utilidad)',
      n(d.totalImpuestos),
      '',
      false,
      false,
      false,
      false,
    );
    addPlRow('= Ventas netas sin IVA', n(d.totalVentasSinIva), '', true);

    addEmpty(ws);
    addPlRow(
      '(−) Costo de lo vendido (COGS)',
      n(d.costoVentas),
      '',
      false,
      false,
      true,
      true,
    );
    if (n(d.totalMermas) > 0) {
      addPlRow(
        '(−) Mermas aprobadas',
        n(d.totalMermas),
        '',
        false,
        false,
        true,
        false,
      );
    }
    addPlRow(
      '= Utilidad bruta',
      n(d.utilidadBruta),
      `${this.pct(d.margenBruto)} sobre ventas`,
      true,
    );

    if (n(d.totalComisionesTecnicos) > 0 || n(d.totalGastosDeducibles) > 0) {
      addEmpty(ws);
      if (n(d.totalComisionesTecnicos) > 0)
        addPlRow(
          '(−) Comisiones técnicos',
          n(d.totalComisionesTecnicos),
          '',
          false,
          false,
          true,
          false,
        );
      if (n(d.totalGastosDeducibles) > 0)
        addPlRow(
          '(−) Gastos deducibles',
          n(d.totalGastosDeducibles),
          '',
          false,
          false,
          true,
          true,
        );
      addPlRow(
        '= Utilidad operativa',
        n(d.utilidadOperativa),
        `${this.pct(d.margenOperativo)} sobre ventas`,
        true,
      );
    }
    if (n(d.totalGastosNoDeducibles) > 0) {
      addEmpty(ws);
      addPlRow(
        '(−) Gastos no deducibles',
        n(d.totalGastosNoDeducibles),
        '',
        false,
        false,
        true,
        false,
      );
    }
    addPlRow(
      '= Utilidad neta final',
      n(d.utilidadNeta),
      `${this.pct(d.margenNeto)} sobre ventas`,
      false,
      true,
    );

    addEmpty(ws);

    // ── Resumen de operaciones ─────────────────────────────────
    const rowOpH = ws.addRow(['RESUMEN DE OPERACIONES', '', '', '', '']);
    ws.mergeCells(`A${rowOpH.number}:E${rowOpH.number}`);
    styleSectionHeader(rowOpH, C.blue);

    const rowOpCols = ws.addRow([
      'Concepto',
      'Cantidad',
      'Total (COP)',
      'Promedio',
      '',
    ]);
    styleColHeader(rowOpCols);

    const addOpRow = (
      label: string,
      qty: number,
      total: number,
      alt = false,
    ) => {
      const avg = qty > 0 ? total / qty : 0;
      const r = ws.addRow([label, qty, total, avg, '']);
      styleDataRow(r, alt);
      r.getCell('A').alignment = { horizontal: 'left', vertical: 'middle' };
      r.getCell('B').alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell('C').numFmt = `"$"#,##0`;
      r.getCell('C').alignment = { horizontal: 'right', vertical: 'middle' };
      r.getCell('D').numFmt = `"$"#,##0`;
      r.getCell('D').alignment = { horizontal: 'right', vertical: 'middle' };
      r.getCell('D').font = {
        size: 9,
        color: { argb: C.muted },
        name: 'Calibri',
      };
    };

    addOpRow('Ventas', n(d.cantidadVentas), n(d.totalVentasNeto));
    addOpRow('Compras', n(d.cantidadCompras), n(d.totalComprasNeto), true);
    addOpRow(
      'Comisiones técnicos',
      n(d.cantidadComisiones),
      n(d.totalComisionesTecnicos),
    );
    addOpRow('Mermas aprobadas', n(d.cantidadMermas), n(d.totalMermas), true);
    addOpRow('Ingresos de caja', n(d.cantidadIngresos), n(d.totalIngresos));
    addOpRow('Egresos de caja', n(d.cantidadEgresos), n(d.totalEgresos), true);

    addEmpty(ws);

    // ── Posición de cartera ────────────────────────────────────
    const rowCarH = ws.addRow(['POSICIÓN DE CARTERA', '', '', '', '']);
    ws.mergeCells(`A${rowCarH.number}:E${rowCarH.number}`);
    styleSectionHeader(rowCarH, '7C3AED'); // purple

    const rowCarCols = ws.addRow([
      'Concepto',
      'Total deuda',
      'Saldo pendiente',
      'Ctas. activas',
      'Vencidas',
    ]);
    styleColHeader(rowCarCols);

    const addCarRow = (
      label: string,
      deuda: number,
      saldo: number,
      activas: number,
      vencidas: number,
      alt = false,
    ) => {
      const r = ws.addRow([label, deuda, saldo, activas, vencidas]);
      styleDataRow(r, alt);
      r.getCell('A').alignment = { horizontal: 'left', vertical: 'middle' };
      r.getCell('B').numFmt = `"$"#,##0`;
      r.getCell('B').alignment = { horizontal: 'right', vertical: 'middle' };
      r.getCell('C').numFmt = `"$"#,##0`;
      r.getCell('C').alignment = { horizontal: 'right', vertical: 'middle' };
      r.getCell('D').alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell('E').alignment = { horizontal: 'center', vertical: 'middle' };
      if (vencidas > 0)
        r.getCell('E').font = {
          bold: true,
          size: 9,
          color: { argb: C.red },
          name: 'Calibri',
        };
    };

    addCarRow(
      'Cuentas por cobrar (CxC)',
      n(d.cxcTotalDeuda),
      n(d.cxcSaldoPendiente),
      n(d.cxcCantidadActivas),
      n(d.cxcCantidadVencidas),
    );
    addCarRow(
      'Cuentas por pagar (CxP)',
      n(d.cxpTotalDeuda),
      n(d.cxpSaldoPendiente),
      n(d.cxpCantidadActivas),
      n(d.cxpCantidadVencidas),
      true,
    );

    // Posición neta
    const posNeta = n(d.posicionNeta);
    const rowPos = ws.addRow([
      'Posición neta (CxC − CxP)',
      '',
      posNeta,
      '',
      '',
    ]);
    ws.mergeCells(`A${rowPos.number}:B${rowPos.number}`);
    ws.mergeCells(`D${rowPos.number}:E${rowPos.number}`);
    styleTotal(rowPos, posNeta >= 0 ? C.greenDark : C.red);
    rowPos.getCell('A').alignment = { horizontal: 'left', vertical: 'middle' };
    rowPos.getCell('C').numFmt = `"$"#,##0`;
    rowPos.getCell('C').alignment = { horizontal: 'right', vertical: 'middle' };

    addEmpty(ws);

    // ── Pie de página ─────────────────────────────────────────
    const rowFoot = ws.addRow([
      `Generado por Aura Nube · ${new Date().toLocaleString('es-CO')}`,
      '',
      '',
      '',
      '',
    ]);
    ws.mergeCells(`A${rowFoot.number}:E${rowFoot.number}`);
    rowFoot.height = 14;
    rowFoot.getCell('A').font = {
      size: 8,
      italic: true,
      color: { argb: C.muted },
      name: 'Calibri',
    };
    rowFoot.getCell('A').alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };

    // ── Descargar ─────────────────────────────────────────────
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `cierre-contable_${d.fechaDesde}_${d.fechaHasta}.xlsx`);
  }
}
