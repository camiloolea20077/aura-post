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
import { InputNumberModule } from 'primeng/inputnumber';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { ReporteCarteraService } from '../../../core/services/reporte-cartera.service';
import { TerceroService } from '../../../core/services/tercero.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  EstadoCartera,
  ReporteCarteraDocumentoModel,
  ReporteCarteraFiltroDto,
  ReporteCarteraResumenModel,
  ReporteCarteraTerceroModel,
  TipoCartera,
} from '../../../core/models/reporte-cartera.model';
import { aFechaLocal } from '../../../shared/utils/fecha.util';

/**
 * Estado de cuenta de cartera: clientes y proveedores en la misma pantalla.
 *
 * <p>Dos vistas: el <b>resumen</b> reparte el saldo de cada tercero por edades
 * — "me deben 10 millones" y "8 de esos llevan más de 90 días" son frases
 * distintas, y la segunda es la que hace que alguien llame — y el
 * <b>detalle</b> lista los documentos con sus abonos desplegables.
 *
 * <p>Cada abono muestra en qué caja entró la plata. Ese dato no existía hasta
 * que los abonos de comprobante quedaron atados a su turno.
 */
@Component({
  selector: 'app-reporte-cartera',
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
    InputNumberModule,
    AutoCompleteModule,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './reporte-cartera.component.html',
  styleUrls: ['./reporte-cartera.component.scss'],
})
export class ReporteCarteraComponent implements OnInit {
  frm: FormGroup;

  vista: 'RESUMEN' | 'DETALLE' = 'RESUMEN';
  loading = false;
  exportando = false;

  resumen: ReporteCarteraResumenModel | null = null;
  documentos: ReporteCarteraDocumentoModel[] = [];
  totalRegistros = 0;
  filasPorPagina = 25;
  expandidas: Record<number, boolean> = {};

  terceroSugerencias: any[] = [];
  terceroSeleccionado: any = null;

  readonly tipoOpts: { label: string; value: TipoCartera }[] = [
    { label: 'Por cobrar (clientes)', value: 'CXC' },
    { label: 'Por pagar (proveedores)', value: 'CXP' },
  ];

  readonly estadoOpts: { label: string; value: EstadoCartera }[] = [
    { label: 'Pendientes', value: 'PENDIENTE' },
    { label: 'Solo vencidas', value: 'VENCIDA' },
    { label: 'Solo pagadas', value: 'PAGADA' },
    { label: 'Todas', value: 'TODAS' },
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: ReporteCarteraService,
    private readonly terceroService: TerceroService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.frm = this.fb.group({
      tipo: ['CXC' as TipoCartera],
      // Sin rango por defecto: la cartera se mira completa, no por mes. Un
      // filtro de fechas que arranque puesto esconde la deuda vieja, que es
      // justamente la que hay que ver.
      fechaDesde: [null],
      fechaHasta: [null],
      estado: ['PENDIENTE' as EstadoCartera],
      diasMoraMin: [null],
      search: [null],
    });
  }

  ngOnInit(): void {
    this.buscar();
  }

  get esCxC(): boolean {
    return this.frm.value.tipo === 'CXC';
  }

  get etiquetaTercero(): string {
    return this.esCxC ? 'Cliente' : 'Proveedor';
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

  private filtro(page = 0, rows = this.filasPorPagina): ReporteCarteraFiltroDto {
    const v = this.frm.value;
    return {
      tipo: v.tipo,
      page,
      rows,
      // aFechaLocal usa los getters locales: toISOString() pasa a UTC y en
      // Colombia correría el rango un día.
      fechaDesde: aFechaLocal(v.fechaDesde),
      fechaHasta: aFechaLocal(v.fechaHasta),
      estado: v.estado,
      diasMoraMin: v.diasMoraMin ?? null,
      terceroId: this.terceroSeleccionado?.id ?? null,
      search: v.search || null,
      incluirAbonos: this.vista === 'DETALLE',
    };
  }

  cambiarTipo(): void {
    // La cartera del otro lado son terceros distintos: lo seleccionado deja de
    // aplicar y dejarlo puesto devolvería una lista vacía sin explicación.
    this.terceroSeleccionado = null;
    this.expandidas = {};
    this.buscar();
  }

  cambiarVista(vista: 'RESUMEN' | 'DETALLE'): void {
    this.vista = vista;
    this.buscar();
  }

  buscar(): void {
    if (this.vista === 'RESUMEN') this.cargarResumen();
    else this.cargarDocumentos({ first: 0, rows: this.filasPorPagina });
  }

  private async cargarResumen(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.resumen(this.filtro()));
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

  async cargarDocumentos(event: TableLazyLoadEvent): Promise<void> {
    if (this.vista !== 'DETALLE') return;
    const rows = event.rows ?? this.filasPorPagina;
    const page = Math.floor((event.first ?? 0) / rows);

    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res: any = await lastValueFrom(
        this.service.documentos(this.filtro(page, rows)),
      );
      this.documentos = res?.data?.content ?? [];
      this.totalRegistros = res?.data?.totalElements ?? this.documentos.length;
    } catch {
      this.documentos = [];
      this.totalRegistros = 0;
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  limpiarFiltros(): void {
    this.frm.reset({ tipo: this.frm.value.tipo, estado: 'PENDIENTE' });
    this.terceroSeleccionado = null;
    this.expandidas = {};
    this.buscar();
  }

  /** Abre el detalle de un tercero desde el resumen. */
  verTercero(t: ReporteCarteraTerceroModel): void {
    this.terceroSeleccionado = {
      id: t.terceroId,
      nombreCompleto: t.terceroNombre,
    };
    this.cambiarVista('DETALLE');
  }

  alternarAbonos(d: ReporteCarteraDocumentoModel): void {
    this.expandidas[d.id] = !this.expandidas[d.id];
    this.cdr.markForCheck();
  }

  // ── Exportar ──────────────────────────────────────────────────────

  async exportarExcel(): Promise<void> {
    this.exportando = true;
    this.cdr.markForCheck();
    try {
      const filtro = this.filtro(0, this.filasPorPagina);
      const blob =
        this.vista === 'RESUMEN'
          ? await lastValueFrom(this.service.excelResumen(filtro))
          : await lastValueFrom(this.service.excelDetalle(filtro));
      const cara = this.esCxC ? 'por_cobrar' : 'por_pagar';
      const tipo = this.vista === 'RESUMEN' ? 'cartera' : 'estado_cuenta';
      this.descargar(blob, `${tipo}_${cara}.xlsx`);
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

  get terceros(): ReporteCarteraTerceroModel[] {
    return this.resumen?.terceros ?? [];
  }

  /** "Vence en 5 días" y "30 días de mora" salen de la misma columna. */
  textoMora(dias: number): string {
    if (dias == null) return '—';
    if (dias > 0) return `${dias} d. de mora`;
    if (dias === 0) return 'Vence hoy';
    return `Vence en ${Math.abs(dias)} d.`;
  }

  severidadMora(dias: number): 'success' | 'warn' | 'danger' | 'info' {
    if (dias == null || dias < 0) return 'info';
    if (dias === 0) return 'warn';
    if (dias <= 30) return 'warn';
    return 'danger';
  }

  severidadEstado(estado: string): 'success' | 'warn' | 'danger' {
    if (estado === 'PAGADA') return 'success';
    if (estado === 'VENCIDA') return 'danger';
    return 'warn';
  }

  /** Un abono sin caja no se deja en blanco: se explica por qué. */
  origenAbono(a: { cajaNombre: string | null; cajaOtroDia: boolean }): string {
    if (a.cajaNombre) return a.cajaNombre;
    if (a.cajaOtroDia) return 'Se movió de la caja otro día';
    return 'Sin caja';
  }

  formatCOP(v: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }
}
