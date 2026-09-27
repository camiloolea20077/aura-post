import {
  Component,
  OnChanges,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { HttpClient } from '@angular/common/http';

import { etiquetaLote } from '../../../shared/utils/lote-etiqueta';
import {
  SerialPickerComponent,
  SerialesElegidos,
} from '../../../shared/components/serial-picker/serial-picker.component';
import { AlertService } from '../../../shared/pipes/alert.service';
import { TerceroPickerComponent } from '../../../shared/components/tercero-picker/tercero-picker.component';
import {
  ConceptoConsumoInternoModel,
  ConsumoInternoLineaUI,
  CreateConsumoInternoDto,
} from '../../../core/models/consumo-interno.model';
import {
  ConsumoComponenteModel,
  ProductoInventarioModel,
} from '../../../core/models/producto.model';
import { ConsumoInternoService } from '../../../core/services/consumo-interno.service';
import { ProductoService } from '../../../core/services/producto.service';
import { ProductoPresentacionService } from '../../../core/services/producto-presentacion.service';
import { environment } from '../../../../environments/environment';
import { IndexDBService } from '../../../core/services/index-db.service';

interface ProductoOpcionConsumo {
  label: string;
  value: number;
  producto: ProductoInventarioModel;
}

@Component({
  selector: 'app-form-consumo-interno',
  standalone: true,
  templateUrl: './form-consumo-interno.component.html',
  styleUrls: ['./form-consumo-interno.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    DropdownModule,
    DialogModule,
    TextareaModule,
    TooltipModule,
    TerceroPickerComponent,
    SerialPickerComponent,
  ],
})
export class FormConsumoInternoComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  @ViewChild('scanInput') scanInput?: ElementRef<HTMLInputElement>;

  form: FormGroup;
  loading = false;
  conceptos: ConceptoConsumoInternoModel[] = [];

  lineas: ConsumoInternoLineaUI[] = [];
  productosOpts: ProductoOpcionConsumo[] = [];

  responsableId: number | null = null;
  responsableNombre: string | null = null;

  /** Lo que se escribe o escanea en el campo SKU. */
  codigoEscaneo = '';
  buscandoCodigo = false;

  private sucursalId: number | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: ConsumoInternoService,
    private readonly productoService: ProductoService,
    private readonly alert: AlertService,
    private readonly http: HttpClient,
    private readonly cdr: ChangeDetectorRef,
    private readonly indexDB: IndexDBService,
    private readonly presentacionService: ProductoPresentacionService,
  ) {
    this.form = this.fb.group({
      conceptoId: [null, Validators.required],
      observacion: [null],
      generaIva: [true],
    });
  }

  ngOnChanges(): void {
    if (this.visible) {
      this.form.reset({ conceptoId: null, observacion: null, generaIva: true });
      this.lineas = [];
      this.productosOpts = [];
      this.responsableId = null;
      this.responsableNombre = null;
      this.codigoEscaneo = '';
      this.indexDB.getSucursalDefault().then((id) => {
        this.sucursalId = id;
      });
      this.cargarConceptos();
    }
  }

  private async cargarConceptos(): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.conceptos());
      this.conceptos = ((res?.data ?? []) as ConceptoConsumoInternoModel[]).filter(
        (c) => c.activo,
      );
    } catch {
      this.conceptos = [];
    }
    this.cdr.markForCheck();
  }

  /** El concepto trae si causa IVA; el usuario lo puede cambiar después. */
  onConceptoChange(id: number | null): void {
    const concepto = this.conceptos.find((c) => c.id === id);
    if (concepto) this.setGeneraIva(concepto.generaIva);
  }

  setGeneraIva(valor: boolean): void {
    this.form.patchValue({ generaIva: valor });
    this.onGeneraIvaChange();
  }

  onResponsableSel(t: { id: number; nombre: string } | null): void {
    this.responsableId = t?.id ?? null;
    this.responsableNombre = t?.nombre ?? null;
    this.cdr.markForCheck();
  }

  // ── Búsqueda de productos ────────────────────────────────────

  async onFiltroProducto(event: { filter: string }): Promise<void> {
    const q = event.filter?.trim();
    if (!q || q.length < 2) {
      this.productosOpts = this.opcionesSeleccionadas();
      this.cdr.markForCheck();
      return;
    }
    try {
      // /productos/inventario y no /pos: lo que más se consume son insumos.
      const res = await lastValueFrom(
        this.productoService.buscarInventario(q, this.sucursalId),
      );
      this.productosOpts = this.mezclarOpciones(
        (res?.data ?? []).map((p) => this.toOpcion(p)),
      );
    } catch {
      this.productosOpts = this.opcionesSeleccionadas();
    }
    this.cdr.markForCheck();
  }

  /** Escáner o SKU escrito + Enter: agrega la línea, o suma 1 si ya está. */
  async onCodigoEnter(event: Event): Promise<void> {
    event.preventDefault();
    const codigo = this.codigoEscaneo?.trim();
    if (!codigo || this.buscandoCodigo) return;

    this.buscandoCodigo = true;
    try {
      const res = await lastValueFrom(
        this.productoService.buscarPorCodigo(codigo, this.sucursalId),
      );
      const producto = res?.data;
      if (!producto) throw new Error('sin datos');

      const existente = this.lineas.find(
        (l) => l.productoId === producto.id && !l.presentacionId,
      );
      if (existente) {
        this.updateCantidad(existente, existente.cantidad + 1);
      } else {
        const linea = this.nuevaLinea();
        this.lineas = [...this.lineas, linea];
        await this.aplicarProducto(linea, producto);
      }
      this.codigoEscaneo = '';
    } catch (err: any) {
      this.alert.showWarn(
        'Producto no encontrado',
        err?.error?.message ??
          `No hay un producto activo con el SKU o código "${codigo}"`,
      );
    } finally {
      this.buscandoCodigo = false;
      this.cdr.markForCheck();
      setTimeout(() => this.scanInput?.nativeElement.select());
    }
  }

  async onProductoChange(
    linea: ConsumoInternoLineaUI,
    productoId: number | null,
  ): Promise<void> {
    const opcion = this.productosOpts.find((o) => o.value === productoId);
    if (!opcion) return;
    await this.aplicarProducto(linea, opcion.producto);
  }

  private async aplicarProducto(
    linea: ConsumoInternoLineaUI,
    p: ProductoInventarioModel,
  ): Promise<void> {
    linea.productoId = p.id;
    linea.productoNombre = p.nombre;
    linea.productoSku = p.sku ?? '';
    linea.unidadAbreviatura = p.unidadAbreviatura;
    linea.stockActual = p.stockActual ?? 0;
    linea.stockProducto = linea.stockActual;
    linea.costoUnitario = p.costo ?? 0;
    linea.ivaPorcentaje = p.ivaPorcentaje ?? 0;
    linea.precioProducto = p.precio ?? 0;
    // El precio del producto es al público (IVA incluido): la base gravable
    // del retiro es ese precio sin el impuesto.
    linea.baseComercialUnitaria = p.ivaPorcentaje
      ? (p.precio ?? 0) / (1 + p.ivaPorcentaje / 100)
      : (p.precio ?? 0);
    linea.esCompuesto = !!p.esCompuesto;
    linea.componentesPorUnidad = [];
    // Un producto con receta no tiene lote propio: salen sus componentes.
    linea.manejaLotes = !linea.esCompuesto && !!p.manejaLotes;
    // Un compuesto sale por receta: sus seriales no se eligen aquí.
    linea.manejaSerial = !linea.esCompuesto && !!p.manejaSerial;
    linea.serialIds = [];
    linea.loteId = null;
    linea.codigoLote = null;
    linea.lotesDisponibles = [];
    linea.presentacionId = 0;
    linea.presentaciones = [];

    this.productosOpts = this.mezclarOpciones([this.toOpcion(p)]);

    // Un compuesto sale por receta: no se registra por presentación.
    if (!linea.esCompuesto) await this.cargarPresentaciones(linea, p);

    if (linea.manejaLotes) this.cargarLotes(linea, p.id);
    if (linea.esCompuesto) await this.cargarComponentes(linea);

    this.calcLinea(linea);
    this.cdr.markForCheck();
  }

  /**
   * Trae el consumo de la receta por UNA unidad. La cantidad de la línea solo
   * lo escala, así que no hace falta volver a pedirlo al cambiarla.
   */
  private async cargarComponentes(linea: ConsumoInternoLineaUI): Promise<void> {
    try {
      const res = await lastValueFrom(
        this.productoService.explosion(linea.productoId!, 1, this.sucursalId),
      );
      linea.componentesPorUnidad = res?.data ?? [];
    } catch {
      linea.componentesPorUnidad = [];
    }
    // El costo de un compuesto es lo que valen sus componentes.
    linea.costoUnitario = linea.componentesPorUnidad.reduce(
      (s, c) => s + c.cantidad * c.costoUnitario,
      0,
    );
    linea.stockActual = this.alcanzaPara(linea);
  }

  private async cargarLotes(
    linea: ConsumoInternoLineaUI,
    productoId: number,
  ): Promise<void> {
    try {
      const res: any = await lastValueFrom(
        this.http.get<any>(
          `${environment.apiUrl}lotes/disponibles/${productoId}/${this.sucursalId}`,
        ),
      );
      linea.lotesDisponibles = (res?.data ?? []).map((l: any) => ({
        ...l,
        etiqueta: etiquetaLote(l),
      }));
      this.cdr.markForCheck();
    } catch {
      linea.lotesDisponibles = [];
    }
  }

  // ── Líneas ───────────────────────────────────────────────────

  addLinea(): void {
    this.lineas = [...this.lineas, this.nuevaLinea()];
    this.cdr.markForCheck();
  }

  private nuevaLinea(): ConsumoInternoLineaUI {
    return {
      _id: uuid(),
      productoId: null,
      productoNombre: '',
      productoSku: '',
      unidadAbreviatura: null,
      stockActual: 0,
      loteId: null,
      codigoLote: null,
      lotesDisponibles: [],
      cantidad: 1,
      costoUnitario: 0,
      baseComercialUnitaria: 0,
      ivaPorcentaje: 0,
      subtotalCosto: 0,
      subtotalIva: 0,
      manejaLotes: false,
      esCompuesto: false,
      componentesPorUnidad: [],
      precioProducto: 0,
      presentacionId: 0,
      presentaciones: [],
    };
  }

  removeLinea(id: string): void {
    this.lineas = this.lineas.filter((l) => l._id !== id);
    this.cdr.markForCheck();
  }

  updateCantidad(linea: ConsumoInternoLineaUI, val: number | null): void {
    linea.cantidad = Math.max(0.001, val ?? 0.001);
    this.calcLinea(linea);
    this.cdr.markForCheck();
  }

  updateBase(linea: ConsumoInternoLineaUI, val: number | null): void {
    linea.baseComercialUnitaria = Math.max(0, val ?? 0);
    this.calcLinea(linea);
    this.cdr.markForCheck();
  }

  onLoteChange(linea: ConsumoInternoLineaUI, loteId: number | null): void {
    const lote = linea.lotesDisponibles.find((l) => l.id === loteId);
    linea.loteId = loteId;
    linea.codigoLote = lote?.codigoLote ?? null;
    linea.stockActual = lote
      ? lote.stockActual
      : (linea.stockProducto ?? linea.stockActual);
    this.cdr.markForCheck();
  }

  /** El check de IVA cambia el total: hay que recalcular todas las líneas. */
  onGeneraIvaChange(): void {
    this.lineas.forEach((l) => this.calcLinea(l));
    this.cdr.markForCheck();
  }

  private calcLinea(linea: ConsumoInternoLineaUI): void {
    // Costo por unidad de inventario; la base comercial es por presentación.
    linea.subtotalCosto = this.cantidadBase(linea) * linea.costoUnitario;
    linea.subtotalIva = this.form.value.generaIva
      ? (linea.cantidad * linea.baseComercialUnitaria * linea.ivaPorcentaje) /
        100
      : 0;
  }

  // ── Presentaciones ───────────────────────────────────────────

  /** Opciones de la línea: la unidad y las presentaciones del producto (Paca = 25 und). */
  private async cargarPresentaciones(
    linea: ConsumoInternoLineaUI,
    p: ProductoInventarioModel,
  ): Promise<void> {
    try {
      const res = await lastValueFrom(
        this.presentacionService.listByProducto(p.id),
      );
      const lista = (res?.data ?? []).filter((x) => x.factorConversion > 0);
      linea.presentaciones = lista.length
        ? [
            {
              id: 0,
              nombre: p.unidadAbreviatura || 'Unidad',
              factor: 1,
              precio: null,
              costo: null,
            },
            ...lista.map((x) => ({
              id: x.id,
              nombre: x.nombre,
              factor: x.factorConversion,
              precio: x.precio ?? null,
              costo: x.costo ?? null,
            })),
          ]
        : [];
    } catch {
      linea.presentaciones = [];
    }
  }

  factorDe(l: ConsumoInternoLineaUI): number {
    return l.presentaciones.find((o) => o.id === l.presentacionId)?.factor ?? 1;
  }

  /** Cantidad en unidad de inventario: 1 Paca → 25. */
  cantidadBase(l: ConsumoInternoLineaUI): number {
    return l.cantidad * this.factorDe(l);
  }

  /** Consumir un bulto vale lo que vale el bulto, no 50 veces el precio suelto. */
  onPresentacionChange(l: ConsumoInternoLineaUI, id: number | null): void {
    l.presentacionId = id ?? 0;
    const opcion = l.presentaciones.find((o) => o.id === l.presentacionId);
    // Precio de presentación y de producto se guardan con IVA incluido.
    const precio =
      opcion && opcion.id ? (opcion.precio ?? 0) : l.precioProducto;
    l.baseComercialUnitaria = l.ivaPorcentaje
      ? precio / (1 + l.ivaPorcentaje / 100)
      : precio;
    this.calcLinea(l);
    this.cdr.markForCheck();
  }

  // ── Receta ───────────────────────────────────────────────────

  requerido(linea: ConsumoInternoLineaUI, c: ConsumoComponenteModel): number {
    return c.cantidad * linea.cantidad;
  }

  /** Mismo criterio que el backend: sin fila de inventario falla siempre. */
  faltaComponente(linea: ConsumoInternoLineaUI, c: ConsumoComponenteModel): boolean {
    if (c.stockDisponible === null || c.stockDisponible === undefined)
      return true;
    if (c.permitirStockNegativo) return false;
    return c.stockDisponible < this.requerido(linea, c);
  }

  /** Cuántas unidades del compuesto alcanzan con el stock de sus componentes. */
  private alcanzaPara(linea: ConsumoInternoLineaUI): number {
    const limites = linea.componentesPorUnidad
      .filter((c) => !c.permitirStockNegativo && c.cantidad > 0)
      .map((c) => Math.max(0, c.stockDisponible ?? 0) / c.cantidad);
    return limites.length ? Math.min(...limites) : Infinity;
  }

  esIlimitado(valor: number): boolean {
    return !Number.isFinite(valor);
  }

  private lineaSinStock(l: ConsumoInternoLineaUI): boolean {
    if (l.productoId === null) return false;
    if (l.esCompuesto)
      return (
        !l.componentesPorUnidad.length ||
        l.componentesPorUnidad.some((c) => this.faltaComponente(l, c))
      );
    return this.cantidadBase(l) > l.stockActual;
  }

  get costoTotal(): number {
    return this.lineas.reduce((s, l) => s + l.subtotalCosto, 0);
  }

  get ivaTotal(): number {
    return this.lineas.reduce((s, l) => s + l.subtotalIva, 0);
  }

  get hayStockInvalido(): boolean {
    return this.lineas.some((l) => this.lineaSinStock(l));
  }

  private validar(): string | null {
    if (!this.lineas.length) return 'Agrega al menos un producto';
    for (const l of this.lineas) {
      if (!l.productoId) return 'Hay líneas sin producto seleccionado';
      if (l.cantidad <= 0) return 'La cantidad debe ser mayor a 0';
      if (l.esCompuesto) {
        if (!l.componentesPorUnidad.length)
          return `La receta de "${l.productoNombre}" no tiene componentes con inventario`;
        const falta = l.componentesPorUnidad.find((c) =>
          this.faltaComponente(l, c),
        );
        if (falta)
          return `No alcanza "${falta.productoNombre}" para ${l.cantidad} de "${l.productoNombre}"`;
        continue;
      }
      if (l.manejaSerial) {
        const unidades = this.unidadesSerial(l);
        if (!Number.isInteger(unidades))
          return `"${l.productoNombre}" maneja serial: la cantidad tiene que ser entera`;
        if ((l.serialIds ?? []).length !== unidades)
          return `"${l.productoNombre}": elige ${unidades} seriales (van ${(l.serialIds ?? []).length})`;
      }
      if (this.cantidadBase(l) > l.stockActual)
        return `"${l.productoNombre}" supera el stock disponible (${l.stockActual})`;
    }
    return null;
  }

  async guardar(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const error = this.validar();
    if (error) {
      this.alert.showWarn('Validación', error);
      return;
    }

    this.loading = true;
    const dto: CreateConsumoInternoDto = {
      sucursalId: this.sucursalId ?? 0,
      conceptoId: this.form.value.conceptoId,
      responsableTerceroId: this.responsableId ?? null,
      observacion: this.form.value.observacion || null,
      generaIva: !!this.form.value.generaIva,
      detalles: this.lineas.map((l) => ({
        productoId: l.productoId!,
        productoPresentacionId: l.presentacionId || null,
        loteId: l.loteId ?? undefined,
        serialIds: l.manejaSerial ? (l.serialIds ?? []) : undefined,
        cantidad: l.cantidad,
        baseComercialUnitaria: l.baseComercialUnitaria,
      })),
    };

    try {
      await lastValueFrom(this.service.create(dto));
      this.alert.showSuccess(
        'Consumo interno registrado',
        'El stock fue descontado y se generó el asiento contable',
      );
      this.saved.emit();
      this.close();
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudo registrar el consumo interno',
      );
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }


  // ── Seriales de la línea ─────────────────────────────────────
  serialLinea: ConsumoInternoLineaUI | null = null;

  get serialPickerVisible(): boolean {
    return this.serialLinea !== null;
  }
  set serialPickerVisible(v: boolean) {
    if (!v) this.serialLinea = null;
  }

  get sucursalSeriales(): number | null {
    return this.sucursalId;
  }

  unidadesSerial(l: ConsumoInternoLineaUI): number {
    return Math.round(this.cantidadBase(l) * 10000) / 10000;
  }

  abrirSeriales(l: ConsumoInternoLineaUI): void {
    this.serialLinea = l;
    this.cdr.markForCheck();
  }

  onSerialesElegidos(e: SerialesElegidos): void {
    if (this.serialLinea) this.serialLinea.serialIds = e.ids;
    this.cdr.markForCheck();
  }

  trackById(_: number, l: ConsumoInternoLineaUI): string {
    return l._id;
  }

  formatCOP = (v: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);

  // ── Opciones del dropdown ────────────────────────────────────

  private toOpcion(p: ProductoInventarioModel): ProductoOpcionConsumo {
    return {
      label: p.nombre + (p.sku ? ` [${p.sku}]` : ''),
      value: p.id,
      producto: p,
    };
  }

  /**
   * Las opciones son compartidas por todas las filas: sin conservar las ya
   * elegidas, buscar en una fila dejaba a las demás sin su etiqueta.
   */
  private opcionesSeleccionadas(): ProductoOpcionConsumo[] {
    const ids = new Set(this.lineas.map((l) => l.productoId));
    return this.productosOpts.filter((o) => ids.has(o.value));
  }

  private mezclarOpciones(
    nuevas: ProductoOpcionConsumo[],
  ): ProductoOpcionConsumo[] {
    const porId = new Map<number, ProductoOpcionConsumo>();
    for (const o of [...this.opcionesSeleccionadas(), ...nuevas])
      porId.set(o.value, o);
    return [...porId.values()];
  }
}
