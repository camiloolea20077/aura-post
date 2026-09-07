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
import { MultiSelectModule } from 'primeng/multiselect';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { KardexService } from '../../../core/services/kardex.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  AgrupacionKardex,
  KardexDetalleLineaModel,
  KardexReporteFiltroDto,
  KardexReporteLineaModel,
  TipoMovimientoOpcion,
} from '../../../core/models/kardex.model';
import { aFechaLocal } from '../../../shared/utils/fecha.util';

/**
 * Reporte de movimiento de inventario.
 *
 * <p>Dos vistas de lo mismo: el <b>resumen</b> agrupa por producto y responde
 * "qué se movió y cuánto"; el <b>detalle</b> es el kardex clásico de un
 * producto, en orden cronológico y con saldo corrido — la vista que pide un
 * contador.
 *
 * <p>Las cantidades vienen de {@code saldo_nuevo − saldo_anterior}, no de la
 * columna {@code cantidad}: el reconteo guarda el valor absoluto y pone el
 * sentido en el nombre del tipo, así que sumar esa columna daría mal en cuanto
 * haya un ajuste de inventario en el rango.
 */
@Component({
  selector: 'app-reporte-kardex',
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
    MultiSelectModule,
    AutoCompleteModule,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './reporte-kardex.component.html',
  styleUrls: ['./reporte-kardex.component.scss'],
})
export class ReporteKardexComponent implements OnInit {
  frm: FormGroup;

  vista: 'RESUMEN' | 'DETALLE' = 'RESUMEN';
  loading = false;
  exportando = false;

  resumen: KardexReporteLineaModel[] = [];
  detalle: KardexDetalleLineaModel[] = [];
  totalRegistros = 0;
  filasPorPagina = 25;
  private ultimoEvento?: TableLazyLoadEvent;

  tiposMovimiento: TipoMovimientoOpcion[] = [];
  sucursales: { label: string; value: number }[] = [];
  categorias: { label: string; value: number }[] = [];
  marcas: { label: string; value: number }[] = [];

  productoSugerencias: any[] = [];
  productoSeleccionado: any = null;

  readonly agrupacionOpts: { label: string; value: AgrupacionKardex }[] = [
    { label: 'Por producto', value: 'PRODUCTO' },
    { label: 'Por producto y sucursal', value: 'PRODUCTO_SUCURSAL' },
    { label: 'Por producto y lote', value: 'PRODUCTO_LOTE' },
  ];

  readonly grupoOpts = [
    { label: 'Entradas', value: 'ENTRADA' },
    { label: 'Salidas', value: 'SALIDA' },
    { label: 'Mixtos', value: 'MIXTO' },
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: KardexService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    const hoy = new Date();
    const primero = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    // p-calendar trabaja con Date; la conversión a texto se hace al armar el
    // filtro, no al guardarlo, para que el datepicker reciba lo que espera.
    this.frm = this.fb.group({
      fechaDesde: [primero],
      fechaHasta: [hoy],
      sucursalId: [null],
      categoriaId: [null],
      marcaId: [null],
      grupoMovimiento: [null],
      tiposMovimiento: [[]],
      search: [null],
      agrupacion: ['PRODUCTO' as AgrupacionKardex],
    });
  }

  ngOnInit(): void {
    this.cargarSelectores();
    this.buscar();
  }

  // ── Selectores ────────────────────────────────────────────────────

  private async cargarSelectores(): Promise<void> {
    const [tipos, sucs, cats, mars] = await Promise.all([
      lastValueFrom(this.service.tiposMovimiento()).catch(() => null),
      lastValueFrom(this.service.getSucursales()).catch(() => null),
      lastValueFrom(this.service.categorias()).catch(() => null),
      lastValueFrom(this.service.marcas()).catch(() => null),
    ]);
    this.tiposMovimiento = tipos?.data ?? [];
    this.sucursales = (sucs?.data ?? []).map((s: any) => ({
      label: s.nombre,
      value: s.id,
    }));
    this.categorias = (cats?.data ?? []).map((c: any) => ({
      label: c.nombre,
      value: c.id,
    }));
    this.marcas = (mars?.data ?? []).map((m: any) => ({
      label: m.nombre,
      value: m.id,
    }));
    this.cdr.markForCheck();
  }

  async buscarProducto(event: { query: string }): Promise<void> {
    try {
      const res = await lastValueFrom(
        this.service.buscarProductos(event.query),
      );
      this.productoSugerencias = res?.data ?? [];
    } catch {
      this.productoSugerencias = [];
    }
    this.cdr.markForCheck();
  }

  limpiarProducto(): void {
    this.productoSeleccionado = null;
    if (this.vista === 'DETALLE') this.vista = 'RESUMEN';
    this.buscar();
  }

  // ── Consulta ──────────────────────────────────────────────────────

  /**
   * El detalle es de un producto: sin producto elegido no hay kardex que
   * mostrar, y devolver el de todos mezclaría saldos de cosas distintas.
   */
  get faltaProductoParaDetalle(): boolean {
    return this.vista === 'DETALLE' && !this.productoSeleccionado?.id;
  }

  cambiarVista(vista: 'RESUMEN' | 'DETALLE'): void {
    this.vista = vista;
    this.totalRegistros = 0;
    this.resumen = [];
    this.detalle = [];
    if (!this.faltaProductoParaDetalle) this.buscar();
    this.cdr.markForCheck();
  }

  private filtro(page = 0, rows = this.filasPorPagina): KardexReporteFiltroDto {
    const v = this.frm.value;
    return {
      page,
      rows,
      // El backend recibe LocalDateTime. Se abre y se cierra el día completo:
      // mandar solo la fecha dejaría fuera los movimientos del propio día
      // 'hasta', que son los que el usuario acaba de hacer y espera ver.
      //
      // aFechaLocal usa los getters locales a propósito: toISOString() pasa a
      // UTC y en Colombia (UTC-5) correría el rango un día.
      fechaDesde: v.fechaDesde ? `${aFechaLocal(v.fechaDesde)}T00:00:00` : null,
      fechaHasta: v.fechaHasta ? `${aFechaLocal(v.fechaHasta)}T23:59:59` : null,
      sucursalId: v.sucursalId ?? null,
      categoriaId: v.categoriaId ?? null,
      marcaId: v.marcaId ?? null,
      grupoMovimiento: v.grupoMovimiento ?? null,
      tiposMovimiento: v.tiposMovimiento?.length ? v.tiposMovimiento : null,
      search: v.search || null,
      productoId: this.productoSeleccionado?.id ?? null,
      agrupacion: v.agrupacion,
    };
  }

  buscar(): void {
    this.cargar({ first: 0, rows: this.filasPorPagina });
  }

  async cargar(event: TableLazyLoadEvent): Promise<void> {
    if (this.faltaProductoParaDetalle) return;
    this.ultimoEvento = event;
    const rows = event.rows ?? this.filasPorPagina;
    const page = Math.floor((event.first ?? 0) / rows);

    this.loading = true;
    this.cdr.markForCheck();
    try {
      const filtro = this.filtro(page, rows);
      const res: any =
        this.vista === 'RESUMEN'
          ? await lastValueFrom(this.service.reporte(filtro))
          : await lastValueFrom(this.service.detalle(filtro));
      const content = res?.data?.content ?? [];
      if (this.vista === 'RESUMEN') this.resumen = content;
      else this.detalle = content;
      this.totalRegistros = res?.data?.totalElements ?? content.length;
    } catch {
      // 206 sin registros incluido: no hay movimientos con esos filtros.
      this.resumen = [];
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
      tiposMovimiento: [],
      agrupacion: 'PRODUCTO',
    });
    this.productoSeleccionado = null;
    this.buscar();
  }

  // ── Exportar ──────────────────────────────────────────────────────

  async exportarExcel(): Promise<void> {
    if (this.faltaProductoParaDetalle) return;
    this.exportando = true;
    this.cdr.markForCheck();
    try {
      // Se manda el mismo filtro de la pantalla: exportar tiene que devolver
      // lo que se está viendo, no un conjunto parecido.
      const filtro = this.filtro(0, this.filasPorPagina);
      const blob =
        this.vista === 'RESUMEN'
          ? await lastValueFrom(this.service.excelReporte(filtro))
          : await lastValueFrom(this.service.excelDetalle(filtro));
      const nombre =
        this.vista === 'RESUMEN'
          ? `movimiento_inventario_${aFechaLocal(this.frm.value.fechaDesde)}_${aFechaLocal(this.frm.value.fechaHasta)}.xlsx`
          : `kardex_${this.productoSeleccionado?.nombre ?? 'producto'}.xlsx`;
      this.descargar(blob, nombre);
    } catch {
      this.alert.showError('Error', 'No se pudo generar el Excel.');
    } finally {
      this.exportando = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Solo el detalle se exporta a PDF. El resumen tiene 23 columnas y en una
   * hoja no se lee: ese se trabaja en Excel, que es donde además se filtra.
   */
  async exportarPdf(): Promise<void> {
    if (this.vista !== 'DETALLE' || this.faltaProductoParaDetalle) return;
    this.exportando = true;
    this.cdr.markForCheck();
    try {
      const blob = await lastValueFrom(
        this.service.pdfDetalle(this.filtro(0, this.filasPorPagina)),
      );
      this.descargar(
        blob,
        `kardex_${this.productoSeleccionado?.nombre ?? 'producto'}.pdf`,
      );
    } catch {
      this.alert.showError('Error', 'No se pudo generar el PDF.');
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

  // ── Totales del pie ───────────────────────────────────────────────

  get totalEntradas(): number {
    return this.resumen.reduce((s, l) => s + (l.entradas ?? 0), 0);
  }
  get totalSalidas(): number {
    return this.resumen.reduce((s, l) => s + (l.salidas ?? 0), 0);
  }
  get totalValorEntradas(): number {
    return this.resumen.reduce((s, l) => s + (l.valorEntradas ?? 0), 0);
  }
  get totalValorSalidas(): number {
    return this.resumen.reduce((s, l) => s + (l.valorSalidas ?? 0), 0);
  }

  get agrupaPorLote(): boolean {
    return this.frm.value.agrupacion === 'PRODUCTO_LOTE';
  }
  get agrupaPorSucursal(): boolean {
    return this.frm.value.agrupacion === 'PRODUCTO_SUCURSAL';
  }

  // ── Helpers visuales ──────────────────────────────────────────────

  /**
   * Un descuadre entre lo que dicen los saldos y lo que suman los movimientos
   * significa que alguna fila se grabó mal. No se corrige al vuelo: se marca,
   * que es de lo que sirve un kardex.
   */
  descuadra(l: KardexReporteLineaModel): boolean {
    if (l.saldoInicial == null || l.saldoFinal == null) return false;
    const esperado = l.saldoFinal - l.saldoInicial;
    return Math.abs(esperado - (l.variacionNeta ?? 0)) > 0.0001;
  }

  claseVariacion(valor: number | null | undefined): string {
    if (valor == null || valor === 0) return '';
    return valor > 0 ? 'delta-pos' : 'delta-neg';
  }

  formatCantidad(v: number | null | undefined): string {
    if (v == null) return '—';
    return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(
      v,
    );
  }

  formatCOP(v: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }
}
