import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { GastoService } from '../../../core/services/gasto.service';
import { CentroCostoService } from '../../../core/services/centro-costo.service';
import { TerceroService } from '../../../core/services/tercero.service';
import { IndexDBService } from '../../../core/services/index-db.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  AgrupacionGastos,
  ReporteGastosDetalleModel,
  ReporteGastosFiltroDto,
  ReporteGastosLineaModel,
  ReporteGastosResumenModel,
} from '../../../core/models/gasto.model';
import { aFechaLocal } from '../../../shared/utils/fecha.util';

/**
 * Reporte de gastos.
 *
 * <p>Dos vistas: el <b>resumen</b> agrupa (categoría, tercero, centro de costo,
 * cuenta, mes o sucursal) y responde "en qué se fue la plata"; el <b>detalle</b>
 * lista gasto por gasto con su soporte, impuestos y retenciones.
 *
 * <p>Deducible y no deducible van siempre en columnas separadas. Un gasto sin
 * soporte válido baja la utilidad del negocio pero no el impuesto de renta:
 * sumarlos en una sola cifra obliga al contador a rehacer la separación a mano.
 */
@Component({
  selector: 'app-reporte-gastos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CalendarModule,
    DropdownModule,
    InputTextModule,
    AutoCompleteModule,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './reporte-gastos.component.html',
  styleUrls: ['./reporte-gastos.component.scss'],
})
export class ReporteGastosComponent implements OnInit {
  frm: FormGroup;

  vista: 'RESUMEN' | 'DETALLE' = 'RESUMEN';
  loading = false;
  exportando = false;

  resumen: ReporteGastosResumenModel | null = null;
  detalle: ReporteGastosDetalleModel[] = [];
  totalRegistros = 0;
  filasPorPagina = 25;

  categorias: { label: string; value: string }[] = [];
  sucursales: { label: string; value: number }[] = [];
  centrosCosto: { label: string; value: number }[] = [];

  terceroSugerencias: any[] = [];
  terceroSeleccionado: any = null;

  readonly agrupacionOpts: { label: string; value: AgrupacionGastos }[] = [
    { label: 'Por categoría', value: 'CATEGORIA' },
    { label: 'Por tercero', value: 'TERCERO' },
    { label: 'Por centro de costo', value: 'CENTRO_COSTO' },
    { label: 'Por cuenta contable', value: 'CUENTA' },
    { label: 'Por mes', value: 'MES' },
    { label: 'Por sucursal', value: 'SUCURSAL' },
  ];

  readonly deducibleOpts = [
    { label: 'Solo deducibles', value: true },
    { label: 'Solo NO deducibles', value: false },
  ];

  readonly formaPagoOpts = [
    { label: 'Contado', value: 'CONTADO' },
    { label: 'Crédito', value: 'CREDITO' },
  ];

  readonly metodoPagoOpts = [
    { label: 'Efectivo', value: 'EFECTIVO' },
    { label: 'Transferencia', value: 'TRANSFERENCIA' },
    { label: 'Nequi', value: 'NEQUI' },
    { label: 'Tarjeta', value: 'TARJETA' },
    { label: 'Cheque', value: 'CHEQUE' },
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly gastoService: GastoService,
    private readonly centroCostoService: CentroCostoService,
    private readonly terceroService: TerceroService,
    private readonly indexDB: IndexDBService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    const hoy = new Date();
    const primero = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.frm = this.fb.group({
      fechaDesde: [primero],
      fechaHasta: [hoy],
      agrupacion: ['CATEGORIA' as AgrupacionGastos],
      categoria: [null],
      sucursalId: [null],
      centroCostoId: [null],
      deducible: [null],
      formaPago: [null],
      metodoPago: [null],
      search: [null],
    });
  }

  ngOnInit(): void {
    this.cargarSelectores();
    this.buscar();
  }

  private async cargarSelectores(): Promise<void> {
    const [cats, sucs, ccs] = await Promise.all([
      lastValueFrom(this.gastoService.categorias()).catch(() => null),
      this.indexDB.getSucursales().catch(() => []),
      lastValueFrom(this.centroCostoService.list()).catch(() => null),
    ]);
    this.categorias = (cats?.data ?? []).map((c) => ({
      label: c.label,
      value: c.value,
    }));
    this.sucursales = (sucs ?? []).map((s: any) => ({
      label: s.nombre,
      value: s.id,
    }));
    this.centrosCosto = (ccs?.data ?? []).map((cc: any) => ({
      label: `${cc.codigo} — ${cc.nombre}`,
      value: cc.id,
    }));
    this.cdr.markForCheck();
  }

  async buscarTercero(event: { query: string }): Promise<void> {
    try {
      const res: any = await lastValueFrom(
        this.terceroService.tercerosSelector(),
      );
      const q = event.query.toLowerCase();
      this.terceroSugerencias = (res?.data ?? []).filter(
        (t: any) =>
          t.nombreCompleto?.toLowerCase().includes(q) ||
          t.numeroDocumento?.includes(q),
      );
    } catch {
      this.terceroSugerencias = [];
    }
    this.cdr.markForCheck();
  }

  // ── Consulta ──────────────────────────────────────────────────────

  private filtro(page = 0, rows = this.filasPorPagina): ReporteGastosFiltroDto {
    const v = this.frm.value;
    return {
      page,
      rows,
      // El backend recibe LocalDate; aFechaLocal usa los getters locales a
      // propósito, porque toISOString() pasa a UTC y en Colombia correría el
      // rango un día.
      fechaDesde: aFechaLocal(v.fechaDesde),
      fechaHasta: aFechaLocal(v.fechaHasta),
      agrupacion: v.agrupacion,
      categoria: v.categoria ?? null,
      sucursalId: v.sucursalId ?? null,
      centroCostoId: v.centroCostoId ?? null,
      terceroId: this.terceroSeleccionado?.id ?? null,
      deducible: v.deducible ?? null,
      formaPago: v.formaPago ?? null,
      metodoPago: v.metodoPago ?? null,
      search: v.search || null,
    };
  }

  cambiarVista(vista: 'RESUMEN' | 'DETALLE'): void {
    this.vista = vista;
    this.buscar();
  }

  buscar(): void {
    if (this.vista === 'RESUMEN') this.cargarResumen();
    else this.cargarDetalle({ first: 0, rows: this.filasPorPagina });
  }

  private async cargarResumen(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.gastoService.reporteResumen(this.filtro()),
      );
      this.resumen = res?.data ?? null;
    } catch (e: any) {
      this.resumen = null;
      if (e?.status !== 206) {
        this.alert.showError(
          'Error',
          e?.error?.message ?? 'No se pudo generar el reporte.',
        );
      }
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async cargarDetalle(event: TableLazyLoadEvent): Promise<void> {
    if (this.vista !== 'DETALLE') return;
    const rows = event.rows ?? this.filasPorPagina;
    const page = Math.floor((event.first ?? 0) / rows);

    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res: any = await lastValueFrom(
        this.gastoService.reporteDetalle(this.filtro(page, rows)),
      );
      this.detalle = res?.data?.content ?? [];
      this.totalRegistros = res?.data?.totalElements ?? this.detalle.length;
    } catch {
      this.detalle = [];
      this.totalRegistros = 0;
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  limpiarFiltros(): void {
    const hoy = new Date();
    const primero = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.frm.reset({
      fechaDesde: primero,
      fechaHasta: hoy,
      agrupacion: 'CATEGORIA',
    });
    this.terceroSeleccionado = null;
    this.buscar();
  }

  // ── Exportar ──────────────────────────────────────────────────────

  async exportarExcel(): Promise<void> {
    this.exportando = true;
    this.cdr.markForCheck();
    try {
      // El mismo filtro de la pantalla: lo exportado tiene que ser lo que se
      // está viendo, no un conjunto parecido.
      const filtro = this.filtro(0, this.filasPorPagina);
      const blob =
        this.vista === 'RESUMEN'
          ? await lastValueFrom(this.gastoService.reporteExcel(filtro))
          : await lastValueFrom(this.gastoService.reporteDetalleExcel(filtro));
      const sufijo = this.vista === 'RESUMEN' ? 'resumen' : 'detalle';
      this.descargar(
        blob,
        `gastos_${sufijo}_${filtro.fechaDesde}_${filtro.fechaHasta}.xlsx`,
      );
    } catch {
      this.alert.showError('Error', 'No se pudo generar el Excel.');
    } finally {
      this.exportando = false;
      this.cdr.markForCheck();
    }
  }

  private descargar(blob: Blob, nombre: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Helpers ───────────────────────────────────────────────────────

  get lineas(): ReporteGastosLineaModel[] {
    return this.resumen?.lineas ?? [];
  }

  /** El encabezado de la primera columna sigue a la agrupación elegida. */
  get tituloGrupo(): string {
    const actual = this.frm.value.agrupacion;
    const opt = this.agrupacionOpts.find((o) => o.value === actual);
    return opt ? opt.label.replace(/^Por /, '') : 'Grupo';
  }

  get agrupaPorMes(): boolean {
    return this.frm.value.agrupacion === 'MES';
  }

  /** "2026-09" no se lee; "Septiembre 2026" sí. */
  etiquetaGrupo(l: ReporteGastosLineaModel): string {
    if (!this.agrupaPorMes || !/^\d{4}-\d{2}$/.test(l.grupo)) return l.grupo;
    const [anio, mes] = l.grupo.split('-');
    const nombres = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    return `${nombres[Number(mes) - 1] ?? mes} ${anio}`;
  }

  formatCOP(v: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }

  formatPct(v: number | null | undefined): string {
    return `${(v ?? 0).toFixed(1)}%`;
  }
}
