import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import {
  AutoCompleteModule,
  AutoCompleteSelectEvent,
} from 'primeng/autocomplete';
import { TextareaModule } from 'primeng/textarea';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import {
  CompraDetalleModel,
  CompraLineaUI,
  CompraModel,
  CreateCompraDetalleDto,
  CreateCompraDto,
  FormaPago,
  PrefilledCompraOC,
  ProductoOpcion,
  TipoDocumentoCompra,
} from '../../../core/models/compra.model';
import { TerceroTableModel } from '../../../core/models/tercero.model';
import { CompraService } from '../../../core/services/compra.service';
import { TerceroService } from '../../../core/services/tercero.service';
import { ProductoService } from '../../../core/services/producto.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { IndexDBService } from '../../../core/services/index-db.service';
import { CuentaBancariaService } from '../../../core/services/cuenta-bancaria.service';
import { CuentaBancariaModel } from '../../../core/models/cuenta-bancaria.model';

@Component({
  selector: 'app-form-compra',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    CalendarModule,
    DropdownModule,
    AutoCompleteModule,
    TextareaModule,
    DividerModule,
    TooltipModule,
    ButtonModule,
    ToastModule,
    TagModule,
  ],
  providers: [MessageService],
  templateUrl: './form-compra.component.html',
  styleUrls: ['./form-compra.component.scss'],
})
export class FormCompraComponent implements OnInit, OnChanges {
  @Input() displayModal = false;
  @Input() compraToEdit: CompraModel | null = null;
  @Input() prefilledFromOC: PrefilledCompraOC | null = null;
  @Output() modalClosed = new EventEmitter<void>();
  @Output() compraSaved = new EventEmitter<CompraModel>();

  get modoEdicion(): boolean {
    return this.compraToEdit != null;
  }

  // ─── Cabecera ─────────────────────────────────────────────────────
  public proveedorQuery = '';
  public proveedorSeleccionado: TerceroTableModel | null = null;
  public proveedoresSugerencias: TerceroTableModel[] = [];
  public sucursalId: number | null = null;
  public sucursalesOpts: { label: string; value: number }[] = [];
  private defaultSucursalId: number | null = null;
  public numeroCompra = '';
  public fechaCompra: Date = new Date();
  public observaciones = '';
  public productosOpts: ProductoOpcion[] = [];
  // ─── Líneas ───────────────────────────────────────────────────────
  public lineas: CompraLineaUI[] = [];
  public productoSelAC: (ProductoOpcion | null)[] = [];
  public productoSugerencias: ProductoOpcion[] = [];

  // ─── Forma de pago ───────────────────────────────────────────────
  public formaPago: FormaPago = 'CONTADO';
  public plazoDias: number = 30;
  public metodoPago: string = 'EFECTIVO';
  public banco: string = '';
  public cuentaBancariaId: number | null = null;
  public cuentasBancarias: CuentaBancariaModel[] = [];

  readonly metodosPagoOpts = [
    { label: 'Efectivo', value: 'EFECTIVO', icon: 'pi-wallet' },
    { label: 'Transferencia', value: 'TRANSFERENCIA', icon: 'pi-send' },
    { label: 'Nequi', value: 'NEQUI', icon: 'pi-mobile' },
    { label: 'Tarjeta', value: 'TARJETA', icon: 'pi-credit-card' },
    { label: 'Cheque', value: 'CHEQUE', icon: 'pi-file' },
  ];

  get requiereBanco(): boolean {
    return ['TRANSFERENCIA', 'NEQUI', 'TARJETA', 'CHEQUE'].includes(
      this.metodoPago,
    );
  }

  // ─── Tipo de documento ────────────────────────────────────────────
  public tipoDocumento: TipoDocumentoCompra = 'FACTURA_COMPRA';
  public readonly tipoDocumentoOpts: {
    label: string;
    value: TipoDocumentoCompra;
  }[] = [
    { label: 'Factura de Compra', value: 'FACTURA_COMPRA' },
    { label: 'Nota Débito', value: 'NOTA_DEBITO' },
    { label: 'Nota Crédito', value: 'NOTA_CREDITO' },
    { label: 'Recibo', value: 'RECIBO' },
  ];

  // ─── Fletes ───────────────────────────────────────────────────────
  public fletes: number = 0;

  // ─── Retenciones ─────────────────────────────────────────────────
  public retefuentePct: number = 0;
  public reteivaPct: number = 0;
  public reteicaPct: number = 0;

  get retefuenteValor(): number {
    return Math.round(this.subtotal * (this.retefuentePct / 100) * 100) / 100;
  }
  get reteivaValor(): number {
    return (
      Math.round(this.impuestosTotal * (this.reteivaPct / 100) * 100) / 100
    );
  }
  get reteicaValor(): number {
    return Math.round(this.subtotal * (this.reteicaPct / 100) * 100) / 100;
  }
  get totalRetenciones(): number {
    return this.retefuenteValor + this.reteivaValor + this.reteicaValor;
  }
  get netaAPagar(): number {
    return this.total - this.totalRetenciones;
  }

  // ─── Estado ───────────────────────────────────────────────────────
  public isSubmitting = false;

  // ─── Totales ──────────────────────────────────────────────────────
  get subtotalBruto(): number {
    return this.lineas.reduce(
      (a, l) => a + (l.cantidad ?? 0) * (l.costoUnitario ?? 0),
      0,
    );
  }
  get descuentoTotal(): number {
    return this.lineas.reduce((a, l) => a + (l.descuentoValor || 0), 0);
  }
  get subtotal(): number {
    return this.subtotalBruto - this.descuentoTotal;
  }
  get impuestosTotal(): number {
    return this.lineas.reduce((a, l) => a + (l.impuestoValor || 0), 0);
  }
  get total(): number {
    return this.subtotal + this.impuestosTotal + (this.fletes || 0);
  }
  get totalUnidades(): number {
    return this.lineas.reduce((a, l) => a + (l.cantidad ?? 0), 0);
  }

  constructor(
    private readonly compraService: CompraService,
    private readonly terceroService: TerceroService,
    private readonly productoService: ProductoService,
    private readonly cuentaBancariaService: CuentaBancariaService,
    private readonly alertService: AlertService,
    private readonly indexDBService: IndexDBService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadDropdowns();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayModal'] && this.displayModal) {
      this.resetForm();
      if (this.compraToEdit) this.cargarEdicion(this.compraToEdit);
      else if (this.prefilledFromOC) this.cargarDesdeOC(this.prefilledFromOC);
    }
  }

  private cargarEdicion(compra: CompraModel): void {
    this.proveedorSeleccionado = {
      id: compra.proveedorId,
      nombreCompleto: compra.proveedorNombre,
      tipoDocumento: '',
      numeroDocumento: '',
      tipoTercero: '',
    } as any;
    this.proveedorQuery = compra.proveedorNombre;
    this.sucursalId = compra.sucursalId;
    this.numeroCompra = compra.numeroCompra ?? '';
    this.fechaCompra = new Date(compra.fecha);
    this.observaciones = compra.observaciones ?? '';

    this.lineas = compra.detalles.map(
      (d: CompraDetalleModel): CompraLineaUI => ({
        _id: uuidv4(),
        productoId: d.productoId,
        productoNombre: d.productoNombre,
        cantidad: d.cantidad,
        costoUnitario: d.costoUnitario,
        descuentoPct: d.descuentoPct ?? 0,
        descuentoValor: d.descuentoValor ?? 0,
        ivaPorcentaje: 0,
        impuestoValor: d.impuestoValor,
        subtotal: d.subtotalLinea,
        precioVenta1: d.precioVenta1 ?? null,
        precioVenta2: d.precioVenta2 ?? null,
        precioVenta3: d.precioVenta3 ?? null,
      }),
    );
    this.productoSelAC = this.lineas.map(() => null);
    this.formaPago = compra.formaPago ?? 'CONTADO';
    this.tipoDocumento = compra.tipoDocumento ?? 'FACTURA_COMPRA';
    this.fletes = compra.fletes ?? 0;
    this.cdr.markForCheck();
  }

  private cargarDesdeOC(oc: PrefilledCompraOC): void {
    this.proveedorSeleccionado = {
      id: oc.proveedorId,
      nombreCompleto: oc.proveedorNombre,
      tipoDocumento: '',
      numeroDocumento: '',
      tipoTercero: '',
    } as any;
    this.proveedorQuery = oc.proveedorNombre;
    this.sucursalId = oc.sucursalId;
    this.observaciones = oc.observaciones ?? '';
    // Populate options so the dropdowns can display the product names
    this.productosOpts = oc.lineas.map(
      (l): ProductoOpcion => ({
        label: l.productoNombre,
        value: l.productoId,
        sku: null,
        ivaPorcentaje: 0,
        costo: l.costoUnitario,
        precio: null,
        precio2: null,
        precio3: null,
      }),
    );
    this.lineas = oc.lineas.map(
      (l): CompraLineaUI => ({
        _id: uuidv4(),
        productoId: l.productoId,
        productoNombre: l.productoNombre,
        cantidad: l.cantidad,
        costoUnitario: l.costoUnitario,
        descuentoPct: 0,
        descuentoValor: 0,
        ivaPorcentaje: 0,
        impuestoValor: 0,
        subtotal: l.cantidad * l.costoUnitario,
        precioVenta1: null,
        precioVenta2: null,
        precioVenta3: null,
      }),
    );
    this.productoSelAC = this.lineas.map(() => null);
    this.cdr.markForCheck();
  }

  // ─── Carga datos ──────────────────────────────────────────────────
  private async loadDropdowns(): Promise<void> {
    try {
      const [sucursales, defaultId, cuentasRes] = await Promise.all([
        this.indexDBService.getSucursales(),
        this.indexDBService.getSucursalDefault(),
        lastValueFrom(this.cuentaBancariaService.list()).catch(() => null),
      ]);
      this.cuentasBancarias = (cuentasRes?.data ?? []).filter((c) => c.activa);
      this.sucursalesOpts = sucursales.map((s) => ({
        label: s.nombre,
        value: s.id,
      }));
      if (defaultId) {
        this.defaultSucursalId = defaultId;
        this.sucursalId = defaultId;
      }
    } catch {
      /* silencioso */
    }
  }

  // ─── Búsqueda servidor para autoComplete de producto ─────────────
  async buscarProductoEnLinea(event: { query: string }): Promise<void> {
    const q = event.query?.trim();
    if (!q || q.length < 2) {
      this.productoSugerencias = [];
      return;
    }
    try {
      const res = await lastValueFrom(this.productoService.search(q));
      this.productoSugerencias = (res?.data ?? []).map(
        (p: any): ProductoOpcion => ({
          label: p.nombre + (p.sku ? ` [${p.sku}]` : ''),
          value: p.id,
          sku: p.sku ?? null,
          ivaPorcentaje: p.ivaPorcentaje ?? 0,
          costo: p.costo ?? null,
          precio: p.precio ?? null,
          precio2: p.precio2 ?? null,
          precio3: p.precio3 ?? null,
        }),
      );
    } catch {
      this.productoSugerencias = [];
    }
  }

  onProductoACSelect(idx: number, item: ProductoOpcion): void {
    this.onProductoChange(idx, item.value);
  }

  // ─── Autocomplete proveedor ───────────────────────────────────────
  async buscarProveedores(query: string): Promise<void> {
    try {
      const res = await lastValueFrom(this.terceroService.proveedores(query));
      this.proveedoresSugerencias = res?.data ?? [];
    } catch {
      this.proveedoresSugerencias = [];
    }
  }

  seleccionarProveedor(event: AutoCompleteSelectEvent): void {
    const t = event.value as TerceroTableModel;
    this.proveedorSeleccionado = t;
    this.proveedorQuery = t.nombreCompleto;
  }

  limpiarProveedor(): void {
    this.proveedorSeleccionado = null;
    this.proveedorQuery = '';
  }

  // ─── Agregar línea vacía ──────────────────────────────────────────
  agregarLinea(): void {
    const nueva: CompraLineaUI = {
      _id: uuidv4(),
      productoId: null,
      productoNombre: '',
      cantidad: null,
      costoUnitario: null,
      descuentoPct: 0,
      descuentoValor: 0,
      ivaPorcentaje: 0,
      impuestoValor: 0,
      subtotal: 0,
      precioVenta1: null,
      precioVenta2: null,
      precioVenta3: null,
    };
    this.lineas = [...this.lineas, nueva];
    this.productoSelAC = [...this.productoSelAC, null];
  }

  eliminarLinea(idx: number): void {
    this.lineas = this.lineas.filter((_, i) => i !== idx);
    this.productoSelAC = this.productoSelAC.filter((_, i) => i !== idx);
  }

  // ─── Selección de producto ────────────────────────────────────────
  async onProductoChange(idx: number, productoId: number): Promise<void> {
    let prod =
      this.productosOpts.find((p) => p.value === productoId) ??
      this.productoSugerencias.find((p) => p.value === productoId);

    if (!prod) {
      try {
        const res = await lastValueFrom(
          this.productoService.getById(productoId),
        );
        const p = res?.data;
        if (p) {
          prod = {
            label: p.nombre + (p.sku ? ` [${p.sku}]` : ''),
            value: p.id,
            sku: p.sku ?? null,
            ivaPorcentaje: p.ivaPorcentaje ?? 0,
            costo: p.costo ?? null,
            precio: p.precio ?? null,
            precio2: p.precio2 ?? null,
            precio3: p.precio3 ?? null,
          };
        }
      } catch {
        /* silencioso */
      }
    }

    if (!prod) return;

    const ivaPorcentaje = prod.ivaPorcentaje ?? 0;
    // Cargar el costo ya con IVA incluido
    const costoBase = prod.costo ?? null;
    const costoUnitario: number | null =
      costoBase != null
        ? Math.round(costoBase * (1 + ivaPorcentaje / 100) * 100) / 100
        : null;
    const cantidad = this.lineas[idx].cantidad ?? 0;
    const subtotal = cantidad * (costoUnitario ?? 0);

    this.lineas = this.lineas.map(
      (l, i): CompraLineaUI =>
        i !== idx
          ? l
          : {
              ...l,
              productoId,
              productoNombre: prod!.label,
              costoUnitario,
              ivaPorcentaje: 0, // IVA ya incluido en el costo
              impuestoValor: 0,
              subtotal: Math.round(subtotal * 100) / 100,
              precioVenta1: prod!.precio ?? null,
              precioVenta2: prod!.precio2 ?? null,
              precioVenta3: prod!.precio3 ?? null,
            },
    );
    this.cdr.markForCheck();
  }

  private calcLinea(l: CompraLineaUI): {
    subtotal: number;
    descuentoValor: number;
    impuestoValor: number;
  } {
    const cantidad = l.cantidad ?? 0;
    const costo = l.costoUnitario ?? 0;
    const bruto = cantidad * costo;
    const descuentoValor =
      Math.round(bruto * ((l.descuentoPct ?? 0) / 100) * 100) / 100;
    const neto = bruto - descuentoValor;
    return {
      subtotal: Math.round(neto * 100) / 100,
      descuentoValor,
      impuestoValor: l.impuestoValor ?? 0,
    };
  }

  // ─── Cambios en campos numéricos ─────────────────────────────────
  onCantidadChange(idx: number, val: number | null): void {
    const linea = this.lineas[idx];
    const calc = this.calcLinea({ ...linea, cantidad: val ?? 0 });
    this.lineas = this.lineas.map(
      (l, i): CompraLineaUI =>
        i !== idx
          ? l
          : {
              ...l,
              cantidad: val,
              descuentoValor: calc.descuentoValor,
              subtotal: calc.subtotal,
              impuestoValor: calc.impuestoValor,
            },
    );
  }

  onCostoChange(idx: number, val: number | null): void {
    const linea = this.lineas[idx];
    const calc = this.calcLinea({ ...linea, costoUnitario: val });
    this.lineas = this.lineas.map(
      (l, i): CompraLineaUI =>
        i !== idx
          ? l
          : {
              ...l,
              costoUnitario: val,
              descuentoValor: calc.descuentoValor,
              subtotal: calc.subtotal,
              impuestoValor: calc.impuestoValor,
            },
    );
  }

  onDescuentoValorChange(idx: number, val: number | null): void {
    const linea = this.lineas[idx];
    const bruto = (linea.cantidad ?? 0) * (linea.costoUnitario ?? 0);
    const descVal = Math.min(val ?? 0, bruto);
    const pct = bruto > 0 ? (descVal / bruto) * 100 : 0;
    const neto = bruto - descVal;
    this.lineas = this.lineas.map(
      (l, i): CompraLineaUI =>
        i !== idx
          ? l
          : {
              ...l,
              descuentoPct: pct,
              descuentoValor: descVal,
              subtotal: Math.round(neto * 100) / 100,
            },
    );
  }

  onImpuestoChange(idx: number, val: number): void {
    this.lineas = this.lineas.map(
      (l, i): CompraLineaUI =>
        i !== idx ? l : { ...l, impuestoValor: val ?? 0 },
    );
  }

  onPrecioVenta1Change(idx: number, val: number | null): void {
    this.lineas = this.lineas.map(
      (l, i): CompraLineaUI => (i !== idx ? l : { ...l, precioVenta1: val }),
    );
  }

  onPrecioVenta2Change(idx: number, val: number | null): void {
    this.lineas = this.lineas.map(
      (l, i): CompraLineaUI => (i !== idx ? l : { ...l, precioVenta2: val }),
    );
  }

  onPrecioVenta3Change(idx: number, val: number | null): void {
    this.lineas = this.lineas.map(
      (l, i): CompraLineaUI => (i !== idx ? l : { ...l, precioVenta3: val }),
    );
  }

  duplicarLinea(idx: number): void {
    const l: CompraLineaUI = { ...this.lineas[idx], _id: uuidv4() };
    const nuevo = [...this.lineas];
    nuevo.splice(idx + 1, 0, l);
    this.lineas = nuevo;
    const nuevoAC = [...this.productoSelAC];
    nuevoAC.splice(idx + 1, 0, this.productoSelAC[idx] ?? null);
    this.productoSelAC = nuevoAC;
  }

  trackByLinea(_: number, l: CompraLineaUI): string {
    return l._id;
  }

  // ─── Validación ───────────────────────────────────────────────────
  private validar(): string | null {
    if (!this.proveedorSeleccionado) return 'Selecciona un proveedor.';
    if (!this.sucursalId) return 'Selecciona una sucursal.';
    if (this.lineas.length === 0) return 'Agrega al menos un producto.';

    for (const [i, l] of this.lineas.entries()) {
      const n = i + 1;
      if (!l.productoId) return `Línea ${n}: selecciona un producto.`;
      if (!l.cantidad || l.cantidad <= 0)
        return `Línea ${n}: la cantidad debe ser mayor a 0.`;
      if (!l.costoUnitario || l.costoUnitario <= 0)
        return `Línea ${n}: el costo debe ser mayor a 0.`;
    }
    return null;
  }

  // ─── Guardar ──────────────────────────────────────────────────────
  async saveCompra(): Promise<void> {
    const err = this.validar();
    if (err) return void this.alertService.showWarn('Compra incompleta', err);

    this.isSubmitting = true;
    try {
      const detalles: CreateCompraDetalleDto[] = this.lineas.map((l) => ({
        productoId: l.productoId!,
        cantidad: l.cantidad!,
        costoUnitario: l.costoUnitario!,
        descuentoPct: l.descuentoPct ?? 0,
        impuestoValor: l.impuestoValor || 0,
        precioVenta1: l.precioVenta1 ?? null,
        precioVenta2: l.precioVenta2 ?? null,
        precioVenta3: l.precioVenta3 ?? null,
      }));

      let fechaVencimientoStr: string | null = null;
      if (this.formaPago === 'CREDITO' && this.plazoDias > 0) {
        const fv = new Date(this.fechaCompra);
        fv.setDate(fv.getDate() + this.plazoDias);
        fechaVencimientoStr = fv.toISOString().slice(0, 19);
      }

      const dto: CreateCompraDto = {
        proveedorId: this.proveedorSeleccionado!.id,
        sucursalId: this.sucursalId!,
        numeroCompra: this.numeroCompra.trim() || null,
        fecha: this.fechaCompra
          ? this.fechaCompra.toISOString().split('.')[0]
          : null,
        fechaVencimiento: fechaVencimientoStr,
        observaciones: this.observaciones.trim() || null,
        detalles,
        retefuentePct: this.retefuentePct || null,
        reteivaPct: this.reteivaPct || null,
        reteicaPct: this.reteicaPct || null,
        formaPago: this.formaPago,
        tipoDocumento: this.tipoDocumento,
        fletes: this.fletes || null,
        pagos:
          this.formaPago === 'CONTADO'
            ? [
                {
                  metodoPago: this.metodoPago,
                  monto:
                    this.totalRetenciones > 0 ? this.netaAPagar : this.total,
                  banco: this.banco.trim() || null,
                  cuentaBancariaId: this.cuentaBancariaId,
                },
              ]
            : null,
      };

      let res;
      if (this.modoEdicion && this.compraToEdit) {
        res = await lastValueFrom(
          this.compraService.update(this.compraToEdit.id, dto),
        );
        if (res?.data) {
          this.alertService.showSuccess(
            'Compra actualizada',
            `Compra #${res.data.id} actualizada. Stock recalculado.`,
          );
          this.compraSaved.emit(res.data);
          this.closeModal();
        }
      } else {
        res = await lastValueFrom(this.compraService.create(dto));
        if (res?.status === 201) {
          this.alertService.showSuccess(
            'Compra registrada',
            `Compra #${res.data?.id} creada. Stock actualizado.`,
          );
          this.compraSaved.emit(res.data);
          this.closeModal();
        }
      }
    } catch (err: any) {
      this.alertService.showError(
        'Error al guardar',
        err?.message ?? 'No se pudo registrar la compra.',
      );
    } finally {
      this.isSubmitting = false;
    }
  }

  private resetForm(): void {
    this.proveedorQuery = '';
    this.proveedorSeleccionado = null;
    this.proveedoresSugerencias = [];
    this.sucursalId = this.defaultSucursalId;
    this.numeroCompra = '';
    this.fechaCompra = new Date();
    this.observaciones = '';
    this.lineas = [];
    this.productoSelAC = [];
    this.productoSugerencias = [];
    this.retefuentePct = 0;
    this.reteivaPct = 0;
    this.reteicaPct = 0;
    this.formaPago = 'CONTADO';
    this.plazoDias = 30;
    this.metodoPago = 'EFECTIVO';
    this.banco = '';
    this.cuentaBancariaId = null;
    this.tipoDocumento = 'FACTURA_COMPRA';
    this.fletes = 0;
  }

  closeModal(): void {
    this.resetForm();
    this.modalClosed.emit();
  }
  async onFiltroProducto(event: { filter: string }): Promise<void> {
    const q = event.filter?.trim();
    if (!q || q.length < 2) {
      this.productosOpts = [];
      return;
    }
    try {
      const res = await lastValueFrom(this.productoService.search(q));
      this.productosOpts = (res?.data ?? []).map(
        (p: any): ProductoOpcion => ({
          label: p.nombre + (p.sku ? ` [${p.sku}]` : ''),
          value: p.id,
          sku: p.sku ?? null,
          ivaPorcentaje: p.ivaPorcentaje ?? 0,
          costo: p.costo ?? null,
          precio: p.precio ?? null,
          precio2: p.precio2 ?? null,
          precio3: p.precio3 ?? null,
        }),
      );
    } catch {
      /* no bloquear */
    }
  }
}
