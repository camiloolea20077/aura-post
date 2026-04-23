import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import {
  AutoCompleteModule,
  AutoCompleteSelectEvent,
} from 'primeng/autocomplete';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { TextareaModule } from 'primeng/textarea';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import {
  CotizacionModel,
  CotizacionLineaUI,
  UpdateCotizacionDto,
  CreateCotizacionDetalleDto,
  ProductoOpcion,
  EstadoCotizacion,
} from '../../../core/models/cotizacion.model';
import { TerceroTableModel } from '../../../core/models/tercero.model';
import { CotizacionService } from '../../../core/services/cotizacion.service';
import { TerceroService } from '../../../core/services/tercero.service';
import { ProductoService } from '../../../core/services/producto.service';
import { EmpresaService } from '../../../core/services/empresa.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  PageableDto,
  ProductoTableModel,
} from '../../../core/models/producto.model';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-form-cotizacion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    CalendarModule,
    DropdownModule,
    AutoCompleteModule,
    TableModule,
    SkeletonModule,
    TextareaModule,
    DividerModule,
    TooltipModule,
    ToastModule,
    TagModule,
    DialogModule,
    IconFieldModule,
    InputIconModule,
  ],
  providers: [MessageService],
  templateUrl: './form-cotizacion.component.html',
  styleUrls: ['./form-cotizacion.component.scss'],
})
export class FormCotizacionComponent implements OnInit {
  cotizacionId: number | null = null;
  cotizacion: CotizacionModel | null = null;
  isLoading = true;
  isSaving = false;
  generandoPDF = false;

  // Header
  terceroQuery = '';
  terceroSeleccionado: TerceroTableModel | null = null;
  tercerosSugeridos: TerceroTableModel[] = [];
  observaciones = '';
  diasVigencia = 30;
  fechaVencimiento: Date = new Date();

  // Líneas
  lineas: CotizacionLineaUI[] = [];

  // Modal selector producto
  showProductDialog = false;
  dialogLineIdx = -1;
  dialogSearch = '';
  dialogItems: ProductoTableModel[] = [];
  dialogTotal = 0;
  dialogLoading = false;
  private dialogLastEvent!: TableLazyLoadEvent;

  // Modal selector tercero
  showTerceroDialog = false;
  tercerosItems: any[] = [];
  tercerosTotal = 0;
  tercerosLoading = false;
  private tercerosLastEvent!: TableLazyLoadEvent;

  // Estados
  get puedeEditar(): boolean {
    // Si no hay cotización cargada aún, permitir edición (se puede agregar líneas)
    // Solo bloquar si ya se cargó y no está en estado PENDIENTE
    if (!this.cotizacion) return true;
    return this.cotizacion.estado === 'PENDIENTE';
  }

  get esNueva(): boolean {
    return !this.cotizacionId;
  }

  // Totales
  get subtotal(): number {
    return this.lineas.reduce((a, l) => a + l.subtotal, 0);
  }
  get descuento(): number {
    return this.lineas.reduce((a, l) => a + l.descuentoValor, 0);
  }
  get iva(): number {
    return this.lineas.reduce(
      (a, l) => a + (l.precioUnitario * l.cantidad * l.ivaPorcentaje) / 100,
      0,
    );
  }
  get total(): number {
    return this.subtotal - this.descuento + this.iva;
  }

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly route: ActivatedRoute,
    public readonly router: Router,
    private readonly cotizacionService: CotizacionService,
    private readonly terceroService: TerceroService,
    private readonly productoService: ProductoService,
    private readonly empresaService: EmpresaService,
    private readonly alertService: AlertService,
  ) {
    (pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || pdfFonts;
  }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cotizacionId = +id;
      await this.loadCotizacion();
    }
    this.isLoading = false;
    this.cdr.markForCheck();
  }

  private async loadCotizacion(): Promise<void> {
    if (!this.cotizacionId) return;
    try {
      const res = await lastValueFrom(
        this.cotizacionService.getById(this.cotizacionId),
      );
      this.cotizacion = res?.data ?? null;
      if (this.cotizacion) {
        this.cargarDatosDesdeCotizacion();
      }
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.error?.message ?? 'No se pudo cargar la cotización.',
      );
      this.router.navigate(['/cotizaciones']);
    }
  }

  private cargarDatosDesdeCotizacion(): void {
    if (!this.cotizacion) return;
    this.terceroQuery = this.cotizacion.terceroNombre ?? '';
    this.terceroSeleccionado = this.cotizacion.terceroId
      ? {
          id: this.cotizacion.terceroId,
          nombreCompleto: this.cotizacion.terceroNombre ?? '',
          numeroDocumento: this.cotizacion.terceroDocumento ?? '',
          tipoDocumento: 'CC',
          telefono: null,
          email: null,
          esCliente: true,
          esProveedor: false,
          esEmpleado: false,
          activo: true,
        }
      : null;
    this.observaciones = this.cotizacion.observaciones ?? '';
    this.diasVigencia = this.cotizacion.diasVigencia;
    this.fechaVencimiento = new Date(this.cotizacion.fechaVencimiento);
    this.lineas = this.cotizacion.detalles.map((d) => ({
      _id: uuidv4(),
      id: d.id,
      productoId: d.productoId,
      productoNombre: d.productoNombre,
      productoSku: d.productoSku,
      cantidad: d.cantidad,
      precioUnitario: d.precioUnitario,
      ivaPorcentaje: d.ivaPorcentaje,
      descuentoValor: d.descuentoValor,
      subtotal: d.subtotal,
    }));
  }

  // ─── Autocomplete tercero ───────────────────────────────────────
  async buscarTerceros(query: string): Promise<void> {
    try {
      const res = await lastValueFrom(this.terceroService.clientes(query));
      this.tercerosSugeridos = res?.data ?? [];
    } catch {
      this.tercerosSugeridos = [];
    }
  }

  seleccionarTercero(event: AutoCompleteSelectEvent): void {
    const t = event.value as TerceroTableModel;
    this.terceroSeleccionado = t;
    this.terceroQuery = t.nombreCompleto;
    this.cdr.markForCheck();
  }

  limpiarTercero(): void {
    this.terceroSeleccionado = null;
    this.terceroQuery = '';
    this.cdr.markForCheck();
  }

  openTerceroDialog(): void {
    this.tercerosItems = [];
    this.tercerosTotal = 0;
    this.showTerceroDialog = true;
    this.loadTercerosTable({ first: 0, rows: 10 });
  }

  async loadTercerosTable(event: TableLazyLoadEvent): Promise<void> {
    this.tercerosLastEvent = event;
    this.tercerosLoading = true;
    this.cdr.markForCheck();

    const page =
      event.first != null && event.rows
        ? Math.floor(event.first / event.rows)
        : 0;

    const dto = {
      page,
      rows: event.rows ?? 10,
      search: this.dialogSearch || null,
      order_by: 't.nombre_completo',
      order: 'ASC',
    };

    try {
      const res = await lastValueFrom(this.terceroService.page(dto));
      this.tercerosItems = res?.data?.content ?? [];
      this.tercerosTotal = res?.data?.totalElements ?? 0;
    } catch {
      this.tercerosItems = [];
      this.tercerosTotal = 0;
    } finally {
      this.tercerosLoading = false;
      this.cdr.markForCheck();
    }
  }

  onTercerosSearch(): void {
    this.loadTercerosTable({ ...this.tercerosLastEvent, first: 0 });
  }

  selectTerceroFromDialog(item: any): void {
    this.terceroSeleccionado = item;
    this.terceroQuery = item.nombreCompleto;
    this.showTerceroDialog = false;
    this.cdr.markForCheck();
  }

  // ─── Líneas ───────────────────────────────────────────────────
  agregarLinea(): void {
    const nueva: CotizacionLineaUI = {
      _id: uuidv4(),
      id: null,
      productoId: null,
      productoNombre: '',
      productoSku: null,
      cantidad: 1,
      precioUnitario: 0,
      ivaPorcentaje: 0,
      descuentoValor: 0,
      subtotal: 0,
    };
    // Agregar al inicio de la lista
    this.lineas = [nueva, ...this.lineas];
    // Abrir el selector de producto directamente
    this.openProductDialog(0);
  }

  eliminarLinea(idx: number): void {
    this.lineas = this.lineas.filter((_, i) => i !== idx);
    this.cdr.markForCheck();
  }

  // ─── Selector producto ───────────────────────────────────────
  openProductDialog(lineIdx: number): void {
    this.dialogLineIdx = lineIdx;
    this.dialogSearch = '';
    this.dialogItems = [];
    this.dialogTotal = 0;
    this.showProductDialog = true;
    this.loadDialogTable({ first: 0, rows: 10 });
  }

  async loadDialogTable(event: TableLazyLoadEvent): Promise<void> {
    this.dialogLastEvent = event;
    this.dialogLoading = true;
    this.cdr.markForCheck();

    const page =
      event.first != null && event.rows
        ? Math.floor(event.first / event.rows)
        : 0;

    const dto: PageableDto = {
      page,
      rows: event.rows ?? 10,
      search: this.dialogSearch || null,
      order_by: 'p.nombre',
      order: 'ASC',
    };

    try {
      const res = await lastValueFrom(this.productoService.page(dto));
      this.dialogItems = res?.data?.content ?? [];
      this.dialogTotal = res?.data?.totalElements ?? 0;
    } catch {
      this.dialogItems = [];
      this.dialogTotal = 0;
    } finally {
      this.dialogLoading = false;
      this.cdr.markForCheck();
    }
  }

  onDialogSearch(): void {
    this.loadDialogTable({ ...this.dialogLastEvent, first: 0 });
  }

  async selectProductFromDialog(item: any): Promise<void> {
    const linea = this.lineas[this.dialogLineIdx];
    if (!linea) return;

    linea.productoId = item.id;
    linea.productoNombre = item.nombre;
    linea.productoSku = item.sku ?? null;
    linea.ivaPorcentaje = item.ivaPorcentaje ?? 0;
    // Cargar el precio desde el producto
    linea.precioUnitario = item.precio ?? 0;
    this.calcLinea(linea);

    this.showProductDialog = false;
    this.lineas = [...this.lineas];
    this.cdr.markForCheck();
  }

  // ─── Cálculos ─────────────────────────────────────────────
  onCantidadChange(linea: CotizacionLineaUI): void {
    this.calcLinea(linea);
    this.lineas = [...this.lineas];
    this.cdr.markForCheck();
  }

  onPrecioChange(linea: CotizacionLineaUI): void {
    this.calcLinea(linea);
    this.lineas = [...this.lineas];
    this.cdr.markForCheck();
  }

  onDescuentoChange(linea: CotizacionLineaUI): void {
    this.calcLinea(linea);
    this.lineas = [...this.lineas];
    this.cdr.markForCheck();
  }

  private calcLinea(linea: CotizacionLineaUI): void {
    const base = linea.cantidad * linea.precioUnitario;
    const descuento = linea.descuentoValor;
    linea.subtotal = Math.max(0, base - descuento);
  }

  // ─── Guardar ─────────────────────────────────────────────────
  private validar(): string | null {
    if (this.lineas.length === 0) {
      return 'Agrega al menos un producto.';
    }
    for (let i = 0; i < this.lineas.length; i++) {
      const l = this.lineas[i];
      if (!l.productoId) {
        return `Línea ${i + 1}: selecciona un producto.`;
      }
      if (l.cantidad <= 0) {
        return `Línea ${i + 1}: la cantidad debe ser mayor a 0.`;
      }
      if (l.precioUnitario < 0) {
        return `Línea ${i + 1}: el precio no puede ser negativo.`;
      }
    }
    return null;
  }

  async guardar(): Promise<void> {
    if (!this.puedeEditar) {
      this.alertService.showError(
        'No editable',
        'Solo puedes editar cotizaciones en estado PENDIENTE.',
      );
      return;
    }

    const error = this.validar();
    if (error) {
      this.alertService.showError('Error', error);
      return;
    }

    this.isSaving = true;

    const detalles: CreateCotizacionDetalleDto[] = this.lineas
      .filter((l) => l.productoId)
      .map((l) => ({
        productoId: l.productoId!,
        descripcion: null,
        cantidad: l.cantidad,
        precioUnitario: l.precioUnitario,
        ivaPorcentaje: l.ivaPorcentaje,
        descuentoValor: l.descuentoValor,
      }));

    const dto: UpdateCotizacionDto = {
      terceroId: this.terceroSeleccionado?.id ?? null,
      observaciones: this.observaciones || null,
      diasVigencia: this.diasVigencia,
      detalles,
    };

    try {
      await lastValueFrom(
        this.cotizacionService.update(this.cotizacionId!, dto),
      );
      this.alertService.showSuccess('Cotización actualizada', '');
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.error?.message ?? 'No se pudo guardar.',
      );
    } finally {
      this.isSaving = false;
      this.cdr.markForCheck();
    }
  }

  // ─── Utils ─────────────────────────────────────────────────
  formatCOP = (v: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);

  formatFecha(f: Date | string): string {
    const d = f instanceof Date ? f : new Date(f);
    return d.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  getEstadoSeverity(
    e: EstadoCotizacion,
  ):
    | 'success'
    | 'secondary'
    | 'info'
    | 'warn'
    | 'danger'
    | 'contrast'
    | undefined {
    const map: Record<EstadoCotizacion, string> = {
      PENDIENTE: 'info',
      VENCIDA: 'warn',
      ANULADA: 'danger',
      CONVERTIDA: 'success',
    };
    return map[e] as any;
  }

  getEstadoLabel(e: EstadoCotizacion): string {
    const labels: Record<EstadoCotizacion, string> = {
      PENDIENTE: 'Pendiente',
      VENCIDA: 'Vencida',
      ANULADA: 'Anulada',
      CONVERTIDA: 'Convertida',
    };
    return labels[e] ?? e;
  }

  trackById(_: number, item: CotizacionLineaUI): string {
    return item._id;
  }

  getIvaPorcentaje(item: ProductoTableModel): number {
    return (item as any).ivaPorcentaje ?? 0;
  }

  // ─── PDF ─────────────────────────────────────────────────────
  async generarPDF(): Promise<void> {
    if (!this.cotizacion) return;
    this.generandoPDF = true;
    this.cdr.markForCheck();
    try {
      const empRes = await lastValueFrom(this.empresaService.getConfig());
      const emp: any = empRes?.data ?? {};
      if (emp.logoUrl) {
        emp.logoBase64 = await this.urlToBase64(emp.logoUrl);
      }
      const doc = this.buildCotizacionDoc(this.cotizacion, emp);
      const nombreArchivo = this.cotizacion?.numero ?? `COT-${this.cotizacionId}`;
      pdfMake.createPdf(doc).download(`${nombreArchivo}.pdf`);
    } catch {
      this.alertService.showError('Error', 'No se pudo generar el PDF.');
    } finally {
      this.generandoPDF = false;
      this.cdr.markForCheck();
    }
  }

  private async urlToBase64(url: string): Promise<string> {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private buildCotizacionDoc(c: CotizacionModel, emp: any): any {
    const numero = c.numero ?? `COT-${String(c.id).padStart(6, '0')}`;
    const fecha = c.fecha
      ? new Date(c.fecha).toLocaleDateString('es-CO', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '—';
    const vencimiento = c.fechaVencimiento
      ? new Date(c.fechaVencimiento).toLocaleDateString('es-CO', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '—';

    const headerContent = [
      { text: numero, fontSize: 20, bold: true, color: '#1e293b' },
      {
        text: `Fecha: ${fecha}   Vence: ${vencimiento}`,
        fontSize: 10,
        color: '#64748b',
        margin: [0, 2, 0, 0],
      },
      {
        text: 'Estado: COMPLETADA',
        fontSize: 10,
        color: '#10b981',
        margin: [0, 2, 0, 0],
      },
    ];

    const clientContent = c.terceroNombre
      ? [
          {
            text: 'CLIENTE',
            fontSize: 8,
            bold: true,
            color: '#94a3b8',
            margin: [0, 0, 0, 4],
          },
          { text: c.terceroNombre, fontSize: 11, bold: true },
          {
            text: c.terceroDocumento ?? '',
            fontSize: 9,
            color: '#64748b',
            margin: [0, 2, 0, 0],
          },
        ]
      : [
          {
            text: 'CLIENTE',
            fontSize: 8,
            bold: true,
            color: '#94a3b8',
            margin: [0, 0, 0, 4],
          },
          { text: 'Sin cliente', fontSize: 11, color: '#94a3b8' },
        ];

    const detalleRows = c.detalles.map((d, i) => [
      {
        text: String(i + 1),
        fontSize: 9,
        alignment: 'center',
        margin: [0, 4, 0, 4],
      },
      {
        text: d.productoNombre,
        fontSize: 9,
        margin: [0, 4, 0, 4],
        width: '*',
      },
      {
        text:
          d.cantidad % 1 === 0 ? d.cantidad.toFixed(0) : d.cantidad.toFixed(2),
        fontSize: 9,
        alignment: 'right',
        margin: [0, 4, 0, 4],
      },
      {
        text: this.formatCOP(d.precioUnitario),
        fontSize: 9,
        alignment: 'right',
        margin: [0, 4, 0, 4],
      },
      {
        text:
          d.descuentoValor > 0 ? `-${this.formatCOP(d.descuentoValor)}` : '—',
        fontSize: 9,
        alignment: 'right',
        margin: [0, 4, 0, 4],
        color: '#ef4444',
      },
      {
        text: `${d.ivaPorcentaje}%`,
        fontSize: 9,
        alignment: 'center',
        margin: [0, 4, 0, 4],
      },
      {
        text: this.formatCOP(d.subtotal),
        fontSize: 9,
        alignment: 'right',
        margin: [0, 4, 0, 4],
        bold: true,
      },
    ]);

    const tablaBody = [
      [
        {
          text: '#',
          fontSize: 8,
          bold: true,
          color: '#94a3b8',
          margin: [0, 4, 0, 4],
        },
        {
          text: 'Producto',
          fontSize: 8,
          bold: true,
          color: '#94a3b8',
          margin: [0, 4, 0, 4],
        },
        {
          text: 'Cant.',
          fontSize: 8,
          bold: true,
          color: '#94a3b8',
          margin: [0, 4, 0, 4],
          alignment: 'right',
        },
        {
          text: 'Precio',
          fontSize: 8,
          bold: true,
          color: '#94a3b8',
          margin: [0, 4, 0, 4],
          alignment: 'right',
        },
        {
          text: 'Desc.',
          fontSize: 8,
          bold: true,
          color: '#94a3b8',
          margin: [0, 4, 0, 4],
          alignment: 'right',
        },
        {
          text: 'IVA',
          fontSize: 8,
          bold: true,
          color: '#94a3b8',
          margin: [0, 4, 0, 4],
          alignment: 'center',
        },
        {
          text: 'Subtotal',
          fontSize: 8,
          bold: true,
          color: '#94a3b8',
          margin: [0, 4, 0, 4],
          alignment: 'right',
        },
      ],
      ...detalleRows,
    ];

    const doc: any = {
      pageSize: 'A4',
      pageMargins: [20, 20, 20, 60],
      content: [
        {
          columns: [
            {
              width: 70,
              image: emp.logoUrl ? 'LOGO' : undefined,
              fit: [60, 60],
            },
            {
              width: 5,
              text: '',
            },
            {
              width: '*',
              stack: [
                {
                  text: emp.nombreComercial ?? emp.razonSocial ?? 'Mi Empresa',
                  fontSize: 14,
                  bold: true,
                },
                {
                  text: emp.direccion ?? '',
                  fontSize: 9,
                  color: '#64748b',
                  margin: [0, 2, 0, 0],
                },
                { text: emp.telefono ?? '', fontSize: 9, color: '#64748b' },
              ],
            },
            { width: 'auto', stack: headerContent, alignment: 'right' },
          ],
        },
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 5,
              x2: 515,
              y2: 5,
              lineWidth: 0.5,
              lineColor: '#e2e8f0',
            },
          ],
        },
        {
          columns: [
            { width: '*', stack: clientContent },
            { width: '*', stack: [], alignment: 'right' },
          ],
          margin: [0, 15, 0, 0],
        },
        c.observaciones
          ? {
              text: `Notas: ${c.observaciones}`,
              fontSize: 9,
              color: '#64748b',
              margin: [0, 10, 0, 0],
            }
          : {},
        {
          table: {
            headerRows: 1,
            widths: [25, '*', 55, 75, 70, 35, 80],
            body: tablaBody,
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0,
            hLineColor: () => '#e2e8f0',
            paddingTop: () => 0,
            paddingBottom: () => 0,
          },
          margin: [0, 15, 0, 0],
        },
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 180,
              stack: [
                {
                  columns: [
                    { text: 'Subtotal:', fontSize: 10, color: '#64748b' },
                    {
                      text: this.formatCOP(c.subtotal),
                      fontSize: 10,
                      alignment: 'right',
                    },
                  ],
                  margin: [0, 4, 0, 0],
                },
                {
                  columns: [
                    { text: 'Descuento:', fontSize: 10, color: '#64748b' },
                    {
                      text: `-${this.formatCOP(c.descuento)}`,
                      fontSize: 10,
                      alignment: 'right',
                      color: '#ef4444',
                    },
                  ],
                  margin: [0, 2, 0, 0],
                },
                {
                  columns: [
                    { text: 'IVA:', fontSize: 10, color: '#64748b' },
                    {
                      text: this.formatCOP(c.iva),
                      fontSize: 10,
                      alignment: 'right',
                    },
                  ],
                  margin: [0, 2, 0, 0],
                },
                {
                  canvas: [
                    {
                      type: 'line',
                      x1: 0,
                      y1: 2,
                      x2: 180,
                      y2: 2,
                      lineWidth: 0.5,
                      lineColor: '#cbd5e1',
                    },
                  ],
                },
                {
                  columns: [
                    { text: 'TOTAL:', fontSize: 12, bold: true },
                    {
                      text: this.formatCOP(c.total),
                      fontSize: 12,
                      bold: true,
                      alignment: 'right',
                      color: '#1e293b',
                    },
                  ],
                  margin: [0, 4, 0, 0],
                },
              ],
            },
          ],
          margin: [0, 15, 0, 0],
        },
      ],
      footer: (currentPage: number, pageCount: number) => ({
        columns: [
          {
            text: `${emp.nit ? 'NIT: ' + emp.nit : ''}`,
            fontSize: 8,
            color: '#94a3b8',
          },
          {
            text: `Página ${currentPage} de ${pageCount}`,
            fontSize: 8,
            color: '#94a3b8',
            alignment: 'right',
          },
        ],
        margin: [20, 0, 20, 0],
      }),
      images: emp.logoUrl ? { LOGO: emp.logoBase64 } : {},
      styles: {},
    };

    return doc;
  }
}
