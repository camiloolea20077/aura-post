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
    private readonly alertService: AlertService,
  ) {}

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
      this.router.navigate(['/cotizaciones']);
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
}
