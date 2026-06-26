import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import { TurnoCajaService } from '../../../../core/services/caja.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import {
  EstadoTurno,
  TurnoCajaModel,
  TurnoCajaTableModel,
  TurnoPageableDto,
  ResumenTurnoDto, // ← NUEVO
  MovimientoCajaDto,
} from '../../../../core/models/caja.model';
import { CerrarTurnoComponent } from '../cerdad/cerrar-turno.component';
import { AbrirTurnoComponent } from '../abrir/abrir-turno.component';
import { DividerModule } from 'primeng/divider';

type TagSeverity =
  | 'success'
  | 'secondary'
  | 'info'
  | 'warn'
  | 'danger'
  | 'contrast'
  | undefined;

@Component({
  selector: 'app-index-turnos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush, // ← NUEVO
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DividerModule,
    InputTextModule,
    TagModule,
    ToastModule,
    TooltipModule,
    SkeletonModule,
    AbrirTurnoComponent,
    CerrarTurnoComponent,
  ],
  providers: [MessageService],
  templateUrl: './index-turnos.component.html',
  styleUrls: ['./index-turnos.component.scss'],
})
export class IndexTurnosComponent implements OnInit, OnDestroy {
  showAbrir = false;
  showCerrar = false;
  turnoActivo: TurnoCajaModel | null = null;
  turnoParaCerrar: TurnoCajaModel | null = null;

  // ── NUEVO: resumen en tiempo real ─────────────────────────
  resumen: ResumenTurnoDto | null = null;
  loadingResumen = false;
  private polling: any;

  // Tabla histórica
  items: TurnoCajaTableModel[] = [];
  loadingTable = true;
  totalRecords = 0;
  rowSize = 15;
  searchQuery = '';
  lastLazyEvent!: TableLazyLoadEvent;

  // ── PDF cierre ────────────────────────────────────────────
  generandoPdfId: number | null = null;

  constructor(
    private readonly turnoCajaService: TurnoCajaService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef, // ← NUEVO
  ) {}

  ngOnInit(): void {
    this.checkTurnoActivo();
  }
  ngOnDestroy(): void {
    this.detenerPolling();
  }

  // ── Verificar turno activo ────────────────────────────────
  private async checkTurnoActivo(): Promise<void> {
    try {
      const res = await lastValueFrom(this.turnoCajaService.turnoActivo());
      this.turnoActivo = res?.data ?? null;
      if (this.turnoActivo) {
        await this.cargarResumen();
        this.iniciarPolling();
      }
    } catch {
      this.turnoActivo = null;
    }
    this.cdr.markForCheck();
  }

  // ── Resumen en tiempo real ────────────────────────────────
  async cargarResumen(): Promise<void> {
    if (!this.turnoActivo) return;
    this.loadingResumen = true;
    try {
      const res = await lastValueFrom(
        this.turnoCajaService.resumen(this.turnoActivo.id),
      );
      this.resumen = res?.data ?? null;
    } catch {
      /* silencioso */
    } finally {
      this.loadingResumen = false;
      this.cdr.markForCheck();
    }
  }

  private iniciarPolling(): void {
    this.polling = setInterval(() => this.cargarResumen(), 30_000);
  }

  private detenerPolling(): void {
    if (this.polling) clearInterval(this.polling);
  }

  // ── Icono por método de pago ──────────────────────────────
  metodoPagoIcon(m: string): string {
    const map: Record<string, string> = {
      EFECTIVO: 'pi pi-money-bill',
      NEQUI: 'pi pi-mobile',
      TARJETA: 'pi pi-credit-card',
    };
    return map[m] ?? 'pi pi-wallet';
  }

  // ── Tabla histórica ───────────────────────────────────────
  async loadTable(event: TableLazyLoadEvent): Promise<void> {
    this.lastLazyEvent = event;
    this.loadingTable = true;
    const page =
      event.first != null && event.rows
        ? Math.floor(event.first / event.rows)
        : 0;
    const sortField = Array.isArray(event.sortField)
      ? event.sortField[0]
      : event.sortField;
    const dto: TurnoPageableDto = {
      page,
      rows: event.rows ?? this.rowSize,
      search: this.searchQuery || null,
      order_by: sortField ?? 't.id',
      order: event.sortOrder === 1 ? 'ASC' : 'DESC',
    };
    try {
      const res = await lastValueFrom(this.turnoCajaService.page(dto));
      this.items = res?.data?.content ?? [];
      this.totalRecords = res?.data?.totalElements ?? 0;
    } catch (err: any) {
      if (err?.status !== 206)
        this.alertService.showError(
          'Error',
          'No se pudieron cargar los turnos.',
        );
      this.items = [];
      this.totalRecords = 0;
    } finally {
      this.loadingTable = false;
      this.cdr.markForCheck();
    }
  }

  onSearch(): void {
    if (this.lastLazyEvent) this.loadTable({ ...this.lastLazyEvent, first: 0 });
  }
  clearSearch(): void {
    this.searchQuery = '';
    this.onSearch();
  }
  private reloadTable(): void {
    if (this.lastLazyEvent) this.loadTable(this.lastLazyEvent);
  }

  // ── Abrir turno ───────────────────────────────────────────
  openAbrir(): void {
    this.showAbrir = true;
  }
  onAbrirClosed(): void {
    this.showAbrir = false;
  }
  onTurnoAbierto(t: TurnoCajaModel): void {
    this.showAbrir = false;
    this.turnoActivo = t;
    this.resumen = null;
    this.cargarResumen();
    this.iniciarPolling();
    this.reloadTable();
    this.cdr.markForCheck();
  }

  // ── Cerrar turno (propio) ─────────────────────────────────
  openCerrar(): void {
    this.turnoParaCerrar = this.turnoActivo;
    this.showCerrar = true;
  }

  // ── Cerrar turno desde la tabla (cualquier cajero) ────────
  openCerrarDesdeTabla(item: TurnoCajaTableModel): void {
    this.turnoParaCerrar = item;
    this.showCerrar = true;
  }

  onCerrarClosed(): void {
    this.showCerrar = false;
    this.turnoParaCerrar = null;
  }

  onTurnoCerrado(): void {
    this.showCerrar = false;
    // Si el que se cerró era el turno activo del admin, limpiar panel
    if (this.turnoParaCerrar?.id === this.turnoActivo?.id) {
      this.turnoActivo = null;
      this.resumen = null;
      this.detenerPolling();
    }
    this.turnoParaCerrar = null;
    this.reloadTable();
    this.cdr.markForCheck();
  }

  // ── UI helpers ────────────────────────────────────────────
  getEstadoSeverity(e: EstadoTurno): TagSeverity {
    return e === 'ABIERTA' ? 'success' : 'secondary';
  }
  getEstadoLabel(e: EstadoTurno): string {
    return e === 'ABIERTA' ? 'Abierta' : 'Cerrada';
  }

  duracion(item: TurnoCajaTableModel): string {
    const inicio = new Date(item.fechaApertura);
    const fin = item.fechaCierre ? new Date(item.fechaCierre) : new Date();
    const diff = Math.floor((fin.getTime() - inicio.getTime()) / 60000);
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  formatFecha(f: string | null): string {
    if (!f) return '—';
    return new Date(f).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatCOP(v: number | null | undefined): string {
    if (v === null || v === undefined) return '—';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v);
  }

  getDiferenciaClass(d: number | null | undefined): string {
    if (!d) return '';
    return d > 0 ? 'dif-sobrante' : 'dif-faltante';
  }

  // ── Descargar PDF de cierre ───────────────────────────────
  async descargarPdf(item: TurnoCajaTableModel): Promise<void> {
    if (this.generandoPdfId) return;
    this.generandoPdfId = item.id;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.turnoCajaService.resumen(item.id));
      const data = res?.data;
      if (!data) {
        this.alertService.showError(
          'Error',
          'No se pudo obtener el resumen del turno',
        );
        return;
      }
      await this.generarPdfCierre(data);
    } catch {
      this.alertService.showError('Error', 'No se pudo generar el PDF');
    } finally {
      this.generandoPdfId = null;
      this.cdr.markForCheck();
    }
  }

  private async generarPdfCierre(d: ResumenTurnoDto): Promise<void> {
    const pdfMake = (await import('pdfmake/build/pdfmake')).default;
    const pdfFonts = (await import('pdfmake/build/vfs_fonts')).default;
    (pdfMake as any).vfs =
      (pdfFonts as any)['vfs'] ?? (pdfFonts as any).pdfMake?.vfs;

    const cerrado = d.estado === 'CERRADA';
    const f = (v: number | null | undefined) => this.formatCOP(v);
    const ventasEfectivo =
      d.ventasPorMetodoPago?.find((m) => m.metodoPago === 'EFECTIVO')
        ?.totalMonto ?? 0;

    // ── Tabla categorías ──────────────────────────────────
    const catBody: any[][] = [
      [
        { text: 'Categoría', style: 'thCell' },
        { text: 'Uds', style: 'thCell', alignment: 'center' },
        { text: 'Bruto', style: 'thCell', alignment: 'right' },
        { text: 'Desc.', style: 'thCell', alignment: 'right' },
        { text: 'Neto', style: 'thCell', alignment: 'right' },
      ],
      ...(d.ventasPorCategoria?.length
        ? d.ventasPorCategoria.map((c) => [
            { text: c.categoriaNombre, style: 'tdCell' },
            {
              text: String(c.totalProductosVendidos),
              style: 'tdCell',
              alignment: 'center',
            },
            { text: f(c.totalBruto), style: 'tdCell', alignment: 'right' },
            { text: f(c.totalDescuentos), style: 'tdCell', alignment: 'right' },
            {
              text: f(c.totalNeto),
              style: 'tdCell',
              alignment: 'right',
              bold: true,
            },
          ])
        : [
            [
              {
                text: 'Sin ventas en este turno',
                colSpan: 5,
                alignment: 'center',
                color: '#94a3b8',
                fontSize: 8,
                margin: [0, 4, 0, 4],
              },
              {},
              {},
              {},
              {},
            ],
          ]),
    ];

    // ── Tabla métodos de pago ─────────────────────────────
    const mpBody: any[][] = [
      [
        { text: 'Método de pago', style: 'thCell' },
        { text: 'Pagos', style: 'thCell', alignment: 'center' },
        { text: 'Monto', style: 'thCell', alignment: 'right' },
      ],
      ...(d.ventasPorMetodoPago?.length
        ? d.ventasPorMetodoPago.map((m) => [
            { text: m.metodoPago, style: 'tdCell' },
            {
              text: String(m.totalPagos),
              style: 'tdCell',
              alignment: 'center',
            },
            {
              text: f(m.totalMonto),
              style: 'tdCell',
              alignment: 'right',
              bold: true,
            },
          ])
        : [
            [
              {
                text: 'Sin pagos registrados',
                colSpan: 3,
                alignment: 'center',
                color: '#94a3b8',
                fontSize: 8,
                margin: [0, 4, 0, 4],
              },
              {},
              {},
            ],
          ]),
    ];

    // ── Movimientos (ingresos / egresos) ──────────────────
    const ingresos = (d.movimientos ?? []).filter((m) => m.tipo === 'INGRESO');
    const egresos = (d.movimientos ?? []).filter((m) => m.tipo === 'EGRESO');
    const movBody = (lista: MovimientoCajaDto[]): any[][] => [
      [
        { text: '#', style: 'thCell', alignment: 'center' },
        { text: 'Fecha', style: 'thCell' },
        { text: 'Concepto', style: 'thCell' },
        { text: 'Método', style: 'thCell' },
        { text: 'Monto', style: 'thCell', alignment: 'right' },
      ],
      ...(lista.length
        ? lista.map((m, i) => [
            {
              text: String(i + 1),
              style: 'tdCell',
              alignment: 'center',
            },
            {
              text: m.fecha
                ? new Date(m.fecha).toLocaleString('es-CO', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—',
              style: 'tdCell',
            },
            { text: m.concepto ?? '—', style: 'tdCell' },
            { text: m.metodoPago ?? '—', style: 'tdCell' },
            {
              text: f(m.monto),
              style: 'tdCell',
              alignment: 'right',
              bold: true,
            },
          ])
        : [
            [
              {
                text: 'Sin movimientos',
                colSpan: 5,
                alignment: 'center',
                color: '#94a3b8',
                fontSize: 8,
                margin: [0, 4, 0, 4],
              },
              {},
              {},
              {},
              {},
            ],
          ]),
    ];

    // ── Comisiones ────────────────────────────────────────
    const comBody: any[][] = [
      [
        { text: 'Técnico', style: 'thCell' },
        { text: 'Servicios', style: 'thCell', alignment: 'center' },
        { text: 'Comisión', style: 'thCell', alignment: 'right' },
        { text: 'Estado', style: 'thCell', alignment: 'center' },
      ],
      ...((d.comisiones ?? []).length
        ? d.comisiones.map((c) => [
            { text: c.tecnicoNombre, style: 'tdCell' },
            {
              text: String(c.totalServicios),
              style: 'tdCell',
              alignment: 'center',
            },
            {
              text: f(c.totalComision),
              style: 'tdCell',
              alignment: 'right',
              bold: true,
            },
            {
              text: c.estadoLiquidacion,
              style: 'tdCell',
              alignment: 'center',
              fontSize: 7.5,
            },
          ])
        : [
            [
              {
                text: 'Sin comisiones generadas',
                colSpan: 4,
                alignment: 'center',
                color: '#94a3b8',
                fontSize: 8,
                margin: [0, 4, 0, 4],
              },
              {},
              {},
              {},
            ],
          ]),
    ];

    const filename = `cierre-turno-${d.turnoId}-${d.cajaNombre.replace(/\s+/g, '-')}`;
    const docDefinition: any = {
      info: { title: filename },
      pageSize: 'A4',
      pageMargins: [40, 50, 40, 50],
      defaultStyle: { font: 'Roboto', fontSize: 9, color: '#1e293b' },
      styles: {
        titulo: { fontSize: 16, bold: true, color: '#1e293b' },
        subtitulo: { fontSize: 10, color: '#64748b' },
        section: {
          fontSize: 10,
          bold: true,
          color: '#4f46e5',
          characterSpacing: 0.5,
        },
        label: {
          fontSize: 7.5,
          color: '#94a3b8',
          bold: true,
          characterSpacing: 0.5,
        },
        value: { fontSize: 9.5, color: '#1e293b', bold: true },
        thCell: {
          fontSize: 8,
          bold: true,
          color: '#475569',
          fillColor: '#f1f5f9',
        },
        tdCell: { fontSize: 8.5, color: '#374151' },
      },
      content: [
        // ── Encabezado ───────────────────────────────────
        {
          columns: [
            {
              stack: [
                { text: 'Cierre de Turno', style: 'titulo' },
                {
                  text: `${d.cajaNombre} — ${d.usuarioNombre}`,
                  style: 'subtitulo',
                  margin: [0, 4, 0, 0],
                },
              ],
            },
            {
              stack: [
                {
                  text: `N° ${d.turnoId}`,
                  style: 'titulo',
                  alignment: 'right',
                  color: '#6366f1',
                },
                {
                  text: cerrado ? 'CERRADO' : 'EN CURSO',
                  alignment: 'right',
                  fontSize: 9,
                  bold: true,
                  color: cerrado ? '#10b981' : '#f59e0b',
                  margin: [0, 4, 0, 0],
                },
              ],
            },
          ],
          margin: [0, 0, 0, 14],
        },
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 0,
              x2: 515,
              y2: 0,
              lineWidth: 1.5,
              lineColor: '#e2e8f0',
            },
          ],
          margin: [0, 0, 0, 14],
        },

        // ── Info turno ───────────────────────────────────
        {
          columns: [
            {
              stack: [
                { text: 'APERTURA', style: 'label', margin: [0, 0, 0, 2] },
                { text: this.formatFecha(d.fechaApertura), style: 'value' },
              ],
            },
            {
              stack: [
                { text: 'BASE INICIAL', style: 'label', margin: [0, 0, 0, 2] },
                { text: f(d.baseInicial), style: 'value' },
              ],
            },
            {
              stack: [
                { text: 'TRANSACCIONES', style: 'label', margin: [0, 0, 0, 2] },
                { text: String(d.totalTransacciones ?? 0), style: 'value' },
              ],
            },
            {
              stack: [
                { text: 'TOTAL NETO', style: 'label', margin: [0, 0, 0, 2] },
                {
                  text: f(d.totalNeto),
                  style: 'value',
                  color: '#10b981',
                  fontSize: 11,
                },
              ],
            },
          ],
          columnGap: 16,
          margin: [0, 0, 0, 18],
        },

        // ── Ventas por categoría ─────────────────────────
        { text: 'VENTAS POR CATEGORÍA', style: 'section', margin: [0, 0, 0, 6] },
        {
          table: {
            headerRows: 1,
            widths: ['*', 35, 70, 70, 75],
            body: catBody,
          },
          layout: this.tableLayout(),
          margin: [0, 0, 0, 14],
        },

        // ── Métodos de pago ──────────────────────────────
        {
          columns: [
            {
              width: '*',
              stack: [
                {
                  text: 'MÉTODOS DE PAGO',
                  style: 'section',
                  margin: [0, 0, 0, 6],
                },
                {
                  table: {
                    headerRows: 1,
                    widths: ['*', 40, 75],
                    body: mpBody,
                  },
                  layout: this.tableLayout(),
                },
              ],
            },
            { width: 12, text: '' },
            {
              width: '*',
              stack: [
                {
                  text: 'RESUMEN VENTAS',
                  style: 'section',
                  margin: [0, 0, 0, 6],
                },
                {
                  table: {
                    widths: ['*', 'auto'],
                    body: [
                      [
                        { text: 'Total bruto', style: 'tdCell' },
                        {
                          text: f(d.totalVentasBruto),
                          style: 'tdCell',
                          alignment: 'right',
                        },
                      ],
                      [
                        { text: 'Descuentos', style: 'tdCell' },
                        {
                          text: f(d.totalDescuentos),
                          style: 'tdCell',
                          alignment: 'right',
                          color: '#ef4444',
                        },
                      ],
                      [
                        { text: 'Impuestos', style: 'tdCell' },
                        {
                          text: f(d.totalImpuestos),
                          style: 'tdCell',
                          alignment: 'right',
                        },
                      ],
                      [
                        {
                          text: 'Ventas en efectivo',
                          style: 'tdCell',
                          bold: true,
                        },
                        {
                          text: f(ventasEfectivo),
                          style: 'tdCell',
                          alignment: 'right',
                          bold: true,
                          color: '#10b981',
                        },
                      ],
                      [
                        {
                          text: `Ventas a crédito (${d.cantidadVentasCredito ?? 0})`,
                          style: 'tdCell',
                          bold: true,
                        },
                        {
                          text: f(d.totalVentasCredito),
                          style: 'tdCell',
                          alignment: 'right',
                          bold: true,
                          color: '#6366f1',
                        },
                      ],
                      [
                        {
                          text: 'TOTAL NETO',
                          style: 'tdCell',
                          bold: true,
                          fillColor: '#f1f5f9',
                        },
                        {
                          text: f(d.totalNeto),
                          style: 'tdCell',
                          alignment: 'right',
                          bold: true,
                          color: '#10b981',
                          fillColor: '#f1f5f9',
                        },
                      ],
                    ],
                  },
                  layout: this.tableLayout(),
                },
              ],
            },
          ],
          margin: [0, 0, 0, 14],
        },

        // ── Ingresos ─────────────────────────────────────
        {
          text: `INGRESOS DE CAJA — ${f(d.totalIngresos)}`,
          style: 'section',
          color: '#10b981',
          margin: [0, 0, 0, 6],
        },
        {
          table: {
            headerRows: 1,
            widths: [25, 75, '*', 60, 70],
            body: movBody(ingresos),
          },
          layout: this.tableLayout(),
          margin: [0, 0, 0, 14],
        },

        // ── Egresos ──────────────────────────────────────
        {
          text: `EGRESOS DE CAJA — ${f(d.totalEgresos)}`,
          style: 'section',
          color: '#ef4444',
          margin: [0, 0, 0, 6],
        },
        {
          table: {
            headerRows: 1,
            widths: [25, 75, '*', 60, 70],
            body: movBody(egresos),
          },
          layout: this.tableLayout(),
          margin: [0, 0, 0, 14],
        },

        // ── Comisiones ───────────────────────────────────
        {
          text: `COMISIONES GENERADAS — ${f(d.totalComisiones)}`,
          style: 'section',
          margin: [0, 0, 0, 6],
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', 50, 75, 65],
            body: comBody,
          },
          layout: this.tableLayout(),
          margin: [0, 0, 0, 14],
        },

        // ── Cuadre efectivo (si está cerrado) ────────────
        ...(cerrado
          ? [
              {
                text: 'CUADRE DE EFECTIVO',
                style: 'section',
                margin: [0, 0, 0, 6],
              },
              {
                table: {
                  widths: ['*', 'auto'],
                  body: [
                    [
                      { text: 'Efectivo esperado', style: 'tdCell' },
                      {
                        text: f(d.totalEsperado),
                        style: 'tdCell',
                        alignment: 'right',
                      },
                    ],
                    [
                      { text: 'Efectivo en sistema', style: 'tdCell' },
                      {
                        text: f(d.totalEfectivoSistema),
                        style: 'tdCell',
                        alignment: 'right',
                      },
                    ],
                    [
                      { text: 'Efectivo declarado', style: 'tdCell' },
                      {
                        text: f(d.totalEfectivoReal),
                        style: 'tdCell',
                        alignment: 'right',
                      },
                    ],
                    [
                      {
                        text: 'DIFERENCIA',
                        style: 'tdCell',
                        bold: true,
                        fillColor: '#f1f5f9',
                      },
                      {
                        text:
                          (d.diferencia ?? 0) >= 0
                            ? `+${f(d.diferencia)}`
                            : f(d.diferencia),
                        style: 'tdCell',
                        alignment: 'right',
                        bold: true,
                        color: (d.diferencia ?? 0) >= 0 ? '#10b981' : '#ef4444',
                        fillColor: '#f1f5f9',
                      },
                    ],
                  ],
                },
                layout: this.tableLayout(),
                margin: [0, 0, 0, 14],
              },
            ]
          : []),

        // ── Firmas ───────────────────────────────────────
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 0,
              x2: 515,
              y2: 0,
              lineWidth: 0.5,
              lineColor: '#e2e8f0',
            },
          ],
          margin: [0, 10, 0, 24],
        },
        {
          columns: [
            {
              stack: [
                {
                  canvas: [
                    {
                      type: 'line',
                      x1: 0,
                      y1: 0,
                      x2: 180,
                      y2: 0,
                      lineWidth: 1,
                      lineColor: '#334155',
                    },
                  ],
                },
                {
                  text: 'CAJERO',
                  style: 'label',
                  margin: [0, 6, 0, 2],
                },
                {
                  text: d.usuarioNombre,
                  fontSize: 8,
                  color: '#64748b',
                },
              ],
            },
            { text: '', width: '*' },
            {
              stack: [
                {
                  canvas: [
                    {
                      type: 'line',
                      x1: 0,
                      y1: 0,
                      x2: 180,
                      y2: 0,
                      lineWidth: 1,
                      lineColor: '#334155',
                    },
                  ],
                },
                {
                  text: 'SUPERVISOR / ADMIN',
                  style: 'label',
                  margin: [0, 6, 0, 2],
                },
                {
                  text: 'Nombre: ____________________________',
                  fontSize: 8,
                  color: '#64748b',
                },
              ],
            },
          ],
        },

        // ── Pie ──────────────────────────────────────────
        {
          text: `Generado el ${new Date().toLocaleString('es-CO')} — Aura POS`,
          fontSize: 7.5,
          color: '#94a3b8',
          alignment: 'center',
          margin: [0, 24, 0, 0],
        },
      ],
    };

    // Abre el PDF en una pestaña nueva (visor del navegador) en vez de descargarlo
    // automáticamente. Así el usuario decide si imprimirlo o guardarlo y dónde.
    pdfMake.createPdf(docDefinition).open();
  }

  private tableLayout() {
    return {
      hLineWidth: (i: number) => (i === 0 || i === 1 ? 1 : 0.5),
      vLineWidth: () => 0,
      hLineColor: () => '#e2e8f0',
      paddingLeft: () => 6,
      paddingRight: () => 6,
      paddingTop: () => 4,
      paddingBottom: () => 4,
    };
  }
}
