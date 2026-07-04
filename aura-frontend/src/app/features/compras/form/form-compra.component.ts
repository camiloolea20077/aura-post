import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
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
import {
  TerceroModel,
  TerceroTableModel,
} from '../../../core/models/tercero.model';
import { CompraService } from '../../../core/services/compra.service';
import { TerceroService } from '../../../core/services/tercero.service';
import { ProductoService } from '../../../core/services/producto.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { IndexDBService } from '../../../core/services/index-db.service';
import { CuentaBancariaService } from '../../../core/services/cuenta-bancaria.service';
import { CuentaBancariaModel } from '../../../core/models/cuenta-bancaria.model';
import { TarifaRetencionService } from '../../../core/services/tarifa-retencion.service';
import { TipoRetencion } from '../../../core/models/tarifa-retencion.model';

interface RetencionOpcion {
  value: string;
  label: string;
  pct: number;
}
import {
  PageableDto,
  ProductoTableModel,
} from '../../../core/models/producto.model';

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
    TableModule,
    SkeletonModule,
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
export class FormCompraComponent implements OnInit {
  private editId: number | null = null;

  get modoEdicion(): boolean {
    return this.editId != null;
  }

  // ─── Cabecera ─────────────────────────────────────────────────────
  public proveedorQuery = '';
  public proveedorSeleccionado: TerceroTableModel | null = null;
  public proveedoresSugerencias: TerceroTableModel[] = [];
  // Datos completos del proveedor (correo, teléfono, dirección, razón social)
  public terceroFull: TerceroModel | null = null;

  get esJuridica(): boolean {
    return (
      this.terceroFull?.tipoPersona === 'JURIDICA' ||
      this.terceroFull?.tipoDocumento === 'NIT' ||
      this.terceroFull?.tipoDocumento === 'RUT'
    );
  }
  public sucursalId: number | null = null;
  public sucursalesOpts: { label: string; value: number }[] = [];
  private defaultSucursalId: number | null = null;
  public numeroCompra = '';
  public fechaCompra: Date = new Date();
  public observaciones = '';
  // ─── Líneas con signals ───────────────────────────────────────────
  lineas = signal<CompraLineaUI[]>([]);

  // Computed totals
  subtotalBruto = computed(() =>
    this.lineas().reduce(
      (a, l) => a + (l.cantidad ?? 0) * (l.costoUnitario ?? 0),
      0,
    ),
  );
  descuentoTotal = computed(() =>
    this.lineas().reduce((a, l) => a + (l.descuentoValor || 0), 0),
  );
  subtotal = computed(() => this.subtotalBruto() - this.descuentoTotal());
  impuestosTotal = computed(() =>
    this.lineas().reduce((a, l) => a + (l.impuestoValor || 0), 0),
  );
  totalUnidades = computed(() =>
    this.lineas().reduce((a, l) => a + (l.cantidad ?? 0), 0),
  );

  // ─── Modal selector de producto ───────────────────────────────────
  public showProductDialog = false;
  public dialogLineIdx = -1;
  public dialogSearch = '';
  public dialogItems: ProductoTableModel[] = [];
  public dialogTotal = 0;
  public dialogLoading = false;
  private dialogLastEvent!: TableLazyLoadEvent;

  // ─── Barcode ──────────────────────────────────────────────────────
  public barcodeQuery = '';
  public barcodeSearching = false;

  // ─── Forma de pago ───────────────────────────────────────────────
  public formaPago: FormaPago = 'CONTADO';
  public plazoDias: number = 30;
  public metodoPago: string = 'EFECTIVO';
  public banco: string = '';
  public cuentaBancariaId: number | null = null;
  public cuentasBancarias: CuentaBancariaModel[] = [];

  readonly formaPagoOpts: { label: string; value: FormaPago }[] = [
    { label: 'Contado', value: 'CONTADO' },
    { label: 'Crédito', value: 'CREDITO' },
  ];

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

  // Opción seleccionada por tipo
  public retefuenteSel: string | null = null;
  public reteivaSel: string | null = null;
  public reteicaSel: string | null = null;

  // ── Catálogo fijo de retenciones (definido por nosotros) ──────────
  // Retefuente — tarifas nacionales aproximadas
  readonly retefuenteOpts: RetencionOpcion[] = [
    { value: 'compras_generales', label: 'Compras generales (mercancías) — 2.5%', pct: 2.5 },
    { value: 'compras_no_declarantes', label: 'Compras a no declarantes — 3.5%', pct: 3.5 },
    { value: 'servicios_general', label: 'Servicios en general — 4%', pct: 4 },
    { value: 'servicios_declarantes', label: 'Servicios a declarantes — 4%', pct: 4 },
    { value: 'honorarios_11', label: 'Honorarios — 11%', pct: 11 },
    { value: 'honorarios_10', label: 'Honorarios (no declarante) — 10%', pct: 10 },
    { value: 'comisiones_11', label: 'Comisiones — 11%', pct: 11 },
    { value: 'comisiones_10', label: 'Comisiones (no declarante) — 10%', pct: 10 },
    { value: 'arr_inmuebles', label: 'Arrendamiento bienes inmuebles — 3.5%', pct: 3.5 },
    { value: 'arr_muebles', label: 'Arrendamiento bienes muebles — 4%', pct: 4 },
    { value: 'transporte_carga', label: 'Transporte de carga — 1%', pct: 1 },
    { value: 'transporte_pasajeros', label: 'Transporte de pasajeros — 3.5%', pct: 3.5 },
    { value: 'servicios_temporales', label: 'Servicios temporales — 2%', pct: 2 },
    { value: 'hoteles', label: 'Hoteles / hospedaje — 3.5%', pct: 3.5 },
    { value: 'construccion', label: 'Construcción / obra material — 2%', pct: 2 },
  ];

  // ReteIVA — 15% del IVA generado
  readonly reteivaOpts: RetencionOpcion[] = [
    { value: 'reteiva_general', label: 'ReteIVA general — 15% del IVA', pct: 15 },
  ];

  // ReteICA — Montelíbano (Córdoba). ⚠ Verificar tarifas oficiales del municipio.
  readonly reteicaOpts: RetencionOpcion[] = [
    { value: 'ica_comercial', label: 'Montelíbano · Comercial — 10‰ (1%)', pct: 1 },
    { value: 'ica_servicios', label: 'Montelíbano · Servicios — 10‰ (1%)', pct: 1 },
    { value: 'ica_industrial', label: 'Montelíbano · Industrial — 7‰ (0.7%)', pct: 0.7 },
  ];

  onTarifaRetencion(tipo: TipoRetencion, value: string | null): void {
    const lista =
      tipo === 'RETEFUENTE'
        ? this.retefuenteOpts
        : tipo === 'RETEIVA'
          ? this.reteivaOpts
          : this.reteicaOpts;
    const pct = lista.find((o) => o.value === value)?.pct ?? 0;
    if (tipo === 'RETEFUENTE') {
      this.retefuenteSel = value;
      this.retefuentePct = pct;
    } else if (tipo === 'RETEIVA') {
      this.reteivaSel = value;
      this.reteivaPct = pct;
    } else {
      this.reteicaSel = value;
      this.reteicaPct = pct;
    }
    this.guardarDraft();
    this.cdr.markForCheck();
  }

  // ─── Estado ───────────────────────────────────────────────────────
  public isSubmitting = false;

  private readonly DRAFT_KEY = 'compra_draft';

  // Helper para el template
  get lineasArray(): CompraLineaUI[] {
    return this.lineas();
  }

  get subtotalValue(): number { return this.subtotal(); }
  get impuestosTotalValue(): number { return this.impuestosTotal(); }
  get descuentoTotalValue(): number { return this.descuentoTotal(); }
  get subtotalBrutoValue(): number { return this.subtotalBruto(); }
  get totalUnidadesValue(): number { return this.totalUnidades(); }

  // Valores que dependen de % retención y fletes (props normales) → getters
  // para que se recalculen en cada ciclo de detección (flete/% reactivos)
  get retefuenteValorValue(): number {
    return Math.round(this.subtotal() * (this.retefuentePct / 100) * 100) / 100;
  }
  get reteivaValorValue(): number {
    return (
      Math.round(this.impuestosTotal() * (this.reteivaPct / 100) * 100) / 100
    );
  }
  get reteicaValorValue(): number {
    return Math.round(this.subtotal() * (this.reteicaPct / 100) * 100) / 100;
  }
  get totalRetencionesValue(): number {
    return (
      this.retefuenteValorValue + this.reteivaValorValue + this.reteicaValorValue
    );
  }
  get totalValue(): number {
    return this.subtotal() + this.impuestosTotal() + (this.fletes || 0);
  }
  get netaAPagarValue(): number {
    return this.totalValue - this.totalRetencionesValue;
  }

  async ngOnInit(): Promise<void> {
    await this.loadDropdowns();
    this.resetForm();
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.editId = +idParam;
      await this.cargarEdicionById(this.editId);
    } else {
      const fromOC = (history.state?.['fromOC'] ??
        null) as PrefilledCompraOC | null;
      if (fromOC) this.cargarDesdeOC(fromOC);
      else this.cargarDraft();
    }
  }

  // ─── Draft / LocalStorage ─────────────────────────────────────────────
  private cargarDraft(): void {
    try {
      const saved = localStorage.getItem(this.DRAFT_KEY);
      if (!saved) return;
      const draft = JSON.parse(saved);
      if (!draft || !draft.lineas?.length) return;
      
      // Restaurar datos
      if (draft.proveedorSeleccionado) {
        this.proveedorSeleccionado = draft.proveedorSeleccionado;
        this.proveedorQuery = draft.proveedorQuery || '';
        // Recuperar correo/teléfono/dirección/razón social tras refrescar (F5)
        this.cargarTerceroFull(draft.proveedorSeleccionado.id);
      }
      this.sucursalId = draft.sucursalId || this.defaultSucursalId;
      this.numeroCompra = draft.numeroCompra || '';
      if (draft.fechaCompra) this.fechaCompra = new Date(draft.fechaCompra);
      this.observaciones = draft.observaciones || '';
      this.lineas.set(draft.lineas || []);
      
      this.formaPago = draft.formaPago || 'CONTADO';
      this.plazoDias = draft.plazoDias || 30;
      this.metodoPago = draft.metodoPago || 'EFECTIVO';
      this.banco = draft.banco || '';
      this.cuentaBancariaId = draft.cuentaBancariaId || null;
      this.tipoDocumento = draft.tipoDocumento || 'FACTURA_COMPRA';
      this.fletes = draft.fletes || 0;
      
      this.retefuentePct = draft.retefuentePct || 0;
      this.reteivaPct = draft.reteivaPct || 0;
      this.reteicaPct = draft.reteicaPct || 0;
      this.retefuenteSel = draft.retefuenteSel ?? null;
      this.reteivaSel = draft.reteivaSel ?? null;
      this.reteicaSel = draft.reteicaSel ?? null;

      this.alertService.showInfo('Borrador recuperado', 'Se restauraron los datos del formulario.');
    } catch {
      // Silencioso
    }
  }

  private guardarDraft(): void {
    try {
      const draft = {
        proveedorSeleccionado: this.proveedorSeleccionado,
        proveedorQuery: this.proveedorQuery,
        sucursalId: this.sucursalId,
        numeroCompra: this.numeroCompra,
        fechaCompra: this.fechaCompra?.toISOString(),
        observaciones: this.observaciones,
        lineas: this.lineas(),
        formaPago: this.formaPago,
        plazoDias: this.plazoDias,
        metodoPago: this.metodoPago,
        banco: this.banco,
        cuentaBancariaId: this.cuentaBancariaId,
        tipoDocumento: this.tipoDocumento,
        fletes: this.fletes,
        retefuentePct: this.retefuentePct,
        reteivaPct: this.reteivaPct,
        reteicaPct: this.reteicaPct,
        retefuenteSel: this.retefuenteSel,
        reteivaSel: this.reteivaSel,
        reteicaSel: this.reteicaSel,
      };
      localStorage.setItem(this.DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Silencioso
    }
  }

  private limpiarDraft(): void {
    localStorage.removeItem(this.DRAFT_KEY);
  }

  constructor(
    private readonly compraService: CompraService,
    private readonly terceroService: TerceroService,
    private readonly productoService: ProductoService,
    private readonly cuentaBancariaService: CuentaBancariaService,
    private readonly tarifaRetencionService: TarifaRetencionService,
    private readonly alertService: AlertService,
    private readonly indexDBService: IndexDBService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  private async cargarEdicionById(id: number): Promise<void> {
    try {
      const res = await lastValueFrom(this.compraService.getById(id));
      if (res?.data) this.cargarEdicion(res.data);
      else {
        this.alertService.showError('Error', 'No se encontró la compra.');
        this.router.navigate(['/compras']);
      }
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar la compra.');
      this.router.navigate(['/compras']);
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
    this.cargarTerceroFull(compra.proveedorId);
    this.sucursalId = compra.sucursalId;
    this.numeroCompra = compra.numeroCompra ?? '';
    this.fechaCompra = new Date(compra.fecha);
    this.observaciones = compra.observaciones ?? '';

    this.lineas.set(
      compra.detalles.map(
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
      ),
    );
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
    this.cargarTerceroFull(oc.proveedorId);
    this.sucursalId = oc.sucursalId;
    this.observaciones = oc.observaciones ?? '';
    this.lineas.set(
      oc.lineas.map(
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
      ),
    );
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

  // ─── Modal selector de producto ───────────────────────────────────
  openProductDialog(lineIdx: number): void {
    this.dialogLineIdx = lineIdx;
    this.dialogSearch = '';
    this.dialogItems = [];
    this.dialogTotal = 0;
    this.showProductDialog = true;
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
    if (this.dialogLastEvent) {
      this.loadDialogTable({ ...this.dialogLastEvent, first: 0 });
    }
  }

  async selectProductFromDialog(item: ProductoTableModel): Promise<void> {
    const opcion: ProductoOpcion = {
      label: item.nombre + (item.sku ? ` [${item.sku}]` : ''),
      value: item.id,
      sku: item.sku ?? null,
      ivaPorcentaje: (item as any).ivaPorcentaje ?? 0,
      costo: item.costo ?? null,
      precio: item.precio ?? null,
      precio2: (item as any).precio2 ?? null,
      precio3: (item as any).precio3 ?? null,
    };
    await this.onProductoChange(this.dialogLineIdx, opcion.value, opcion);
    this.showProductDialog = false;
  }

  // ─── Búsqueda por código de barras (desde el modal) ─────────────
  async buscarPorBarcode(): Promise<void> {
    const q = this.barcodeQuery.trim();
    if (!q) return;
    this.barcodeSearching = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.productoService.search(q));
      const productos = res?.data ?? [];
      if (productos.length === 0) {
        this.alertService.showWarn(
          'Sin resultados',
          `No se encontró producto con código "${q}".`,
        );
        return;
      }
      // Selecciona el producto para la línea actual y cierra el modal
      await this.selectProductFromDialog(productos[0]);
      this.barcodeQuery = '';
    } catch {
      this.alertService.showError('Error', 'No se pudo buscar el producto.');
    } finally {
      this.barcodeSearching = false;
      this.cdr.markForCheck();
    }
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
    this.cargarTerceroFull(t.id);
  }

  // Trae correo, teléfono, dirección y razón social del proveedor
  private async cargarTerceroFull(terceroId: number): Promise<void> {
    this.terceroFull = null;
    try {
      const res = await lastValueFrom(this.terceroService.getById(terceroId));
      this.terceroFull = res?.data ?? null;
      this.cdr.markForCheck();
    } catch {
      this.terceroFull = null;
    }
  }

  private async cargarRetencionesSugeridas(terceroId: number): Promise<void> {
    try {
      const res = await lastValueFrom(
        this.tarifaRetencionService.sugeridas(terceroId),
      );
      const s = res?.data;
      if (!s) return;
      if (s.retefuentePct != null) this.retefuentePct = Number(s.retefuentePct);
      if (s.reteivaPct != null) this.reteivaPct = Number(s.reteivaPct);
      if (s.reteicaPct != null) this.reteicaPct = Number(s.reteicaPct);
      this.cdr.markForCheck();
    } catch {
      // no bloqueante — el usuario puede ingresar los valores manualmente
    }
  }

  limpiarProveedor(): void {
    this.proveedorSeleccionado = null;
    this.proveedorQuery = '';
    this.terceroFull = null;
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
    this.lineas.set([...this.lineas(), nueva]);
    this.guardarDraft();
    this.cdr.markForCheck();
  }

  eliminarLinea(idx: number): void {
    this.lineas.set(this.lineas().filter((_, i) => i !== idx));
    this.guardarDraft();
  }

  // ─── Selección de producto ────────────────────────────────────────
  async onProductoChange(
    idx: number,
    productoId: number,
    preloaded?: ProductoOpcion,
  ): Promise<void> {
    let prod = preloaded;

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
    const cantidad = this.lineas()[idx].cantidad ?? 0;
    const ivaPct = ivaPorcentaje;
    const descuento = this.lineas()[idx].descuentoValor ?? 0;
    const base = cantidad * (costoUnitario ?? 0);
    const descuentoPct = base > 0 ? (descuento / base) * 100 : 0;
    const baseNeta = base - descuento;
    const impuestoValor = Math.round(baseNeta * (ivaPct / 100) * 100) / 100;
    const subtotal = Math.round(baseNeta * 100) / 100;

    this.lineas.set(
      this.lineas().map(
        (l, i): CompraLineaUI =>
          i !== idx
            ? l
            : {
                ...l,
                productoId,
                productoNombre: prod!.label,
                costoUnitario,
                ivaPorcentaje: ivaPct,
                descuentoPct,
                descuentoValor: descuento,
                impuestoValor,
                subtotal,
                precioVenta1: prod!.precio ?? null,
                precioVenta2: prod!.precio2 ?? null,
                precioVenta3: prod!.precio3 ?? null,
              },
      ),
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
    const ivaPct = l.ivaPorcentaje ?? 0;
    const impuestoValor = Math.round(neto * (ivaPct / 100) * 100) / 100;
    return {
      subtotal: Math.round(neto * 100) / 100,
      descuentoValor,
      impuestoValor,
    };
  }

  // ─── Cambios en campos numéricos ─────────────────────────────────
  onCantidadChange(idx: number, val: number | null): void {
    const linea = this.lineas()[idx];
    const calc = this.calcLinea({ ...linea, cantidad: val ?? 0 });
    this.lineas.set(
      this.lineas().map(
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
      ),
    );
    this.guardarDraft();
  }

  onCostoChange(idx: number, val: number | null): void {
    const linea = this.lineas()[idx];
    const calc = this.calcLinea({ ...linea, costoUnitario: val });
    this.lineas.set(
      this.lineas().map(
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
      ),
    );
    this.guardarDraft();
  }

  onDescuentoValorChange(idx: number, val: number | null): void {
    const linea = this.lineas()[idx];
    const bruto = (linea.cantidad ?? 0) * (linea.costoUnitario ?? 0);
    const descVal = Math.min(val ?? 0, bruto);
    const pct = bruto > 0 ? (descVal / bruto) * 100 : 0;
    const neto = bruto - descVal;
    const ivaPct = linea.ivaPorcentaje ?? 0;
    const impuestoValor = Math.round(neto * (ivaPct / 100) * 100) / 100;
    this.lineas.set(
      this.lineas().map(
        (l, i): CompraLineaUI =>
          i !== idx
            ? l
            : {
                ...l,
                descuentoPct: pct,
                descuentoValor: descVal,
                subtotal: Math.round(neto * 100) / 100,
                impuestoValor,
              },
      ),
    );
    this.guardarDraft();
  }

  onImpuestoChange(idx: number, val: number): void {
    this.lineas.set(
      this.lineas().map(
        (l, i): CompraLineaUI =>
          i !== idx ? l : { ...l, impuestoValor: val ?? 0 },
      ),
    );
    this.guardarDraft();
  }

  // Cambio del % de IVA por línea → recalcula el IVA $ automáticamente
  onIvaPctChange(idx: number, val: number | null): void {
    const linea = this.lineas()[idx];
    const calc = this.calcLinea({ ...linea, ivaPorcentaje: val ?? 0 });
    this.lineas.set(
      this.lineas().map(
        (l, i): CompraLineaUI =>
          i !== idx
            ? l
            : {
                ...l,
                ivaPorcentaje: val ?? 0,
                descuentoValor: calc.descuentoValor,
                subtotal: calc.subtotal,
                impuestoValor: calc.impuestoValor,
              },
      ),
    );
    this.guardarDraft();
  }

  onPrecioVenta1Change(idx: number, val: number | null): void {
    this.lineas.set(
      this.lineas().map(
        (l, i): CompraLineaUI => (i !== idx ? l : { ...l, precioVenta1: val }),
      ),
    );
    this.guardarDraft();
  }

  onPrecioVenta2Change(idx: number, val: number | null): void {
    this.lineas.set(
      this.lineas().map(
        (l, i): CompraLineaUI => (i !== idx ? l : { ...l, precioVenta2: val }),
      ),
    );
    this.guardarDraft();
  }

  onPrecioVenta3Change(idx: number, val: number | null): void {
    this.lineas.set(
      this.lineas().map(
        (l, i): CompraLineaUI => (i !== idx ? l : { ...l, precioVenta3: val }),
      ),
    );
    this.guardarDraft();
  }

  duplicarLinea(idx: number): void {
    const l: CompraLineaUI = { ...this.lineas()[idx], _id: uuidv4() };
    const nuevo = [...this.lineas()];
    nuevo.splice(idx + 1, 0, l);
    this.lineas.set(nuevo);
  }

  trackByLinea(_: number, l: CompraLineaUI): string {
    return l._id;
  }

  // ─── Validación ───────────────────────────────────────────────────
  private validar(): string | null {
    if (!this.proveedorSeleccionado) return 'Selecciona un proveedor.';
    if (!this.sucursalId) return 'Selecciona una sucursal.';
    if (this.lineas().length === 0) return 'Agrega al menos un producto.';

    for (const [i, l] of this.lineas().entries()) {
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

    this.guardarDraft();
    this.isSubmitting = true;
    try {
      const detalles: CreateCompraDetalleDto[] = this.lineas().map((l) => ({
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
                    this.totalRetencionesValue > 0
                      ? this.netaAPagarValue
                      : this.totalValue,
                  banco: this.banco.trim() || null,
                  cuentaBancariaId: this.cuentaBancariaId,
                },
              ]
            : null,
      };

      let res;
      if (this.modoEdicion && this.editId) {
        res = await lastValueFrom(
          this.compraService.update(this.editId, dto),
        );
        if (res?.data) {
          this.limpiarDraft();
          this.alertService.showSuccess(
            'Compra actualizada',
            `Compra #${res.data.id} actualizada. Stock recalculado.`,
          );
          this.router.navigate(['/compras'], {
            state: { savedCompra: res.data },
          });
        }
      } else {
        res = await lastValueFrom(this.compraService.create(dto));
        if (res?.status === 201) {
          this.limpiarDraft();
          this.alertService.showSuccess(
            'Compra registrada',
            `Compra #${res.data?.id} creada. Stock actualizado.`,
          );
          this.router.navigate(['/compras'], {
            state: { savedCompra: res.data },
          });
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
    this.terceroFull = null;
    this.proveedoresSugerencias = [];
    this.sucursalId = this.defaultSucursalId;
    this.numeroCompra = '';
    this.fechaCompra = new Date();
    this.observaciones = '';
    this.lineas.set([]);
    this.barcodeQuery = '';
    this.barcodeSearching = false;
    this.showProductDialog = false;
    this.retefuentePct = 0;
    this.reteivaPct = 0;
    this.reteicaPct = 0;
    this.retefuenteSel = null;
    this.reteivaSel = null;
    this.reteicaSel = null;
    this.formaPago = 'CONTADO';
    this.plazoDias = 30;
    this.metodoPago = 'EFECTIVO';
    this.banco = '';
    this.cuentaBancariaId = null;
    this.tipoDocumento = 'FACTURA_COMPRA';
    this.fletes = 0;
  }

  cancelar(): void {
    this.guardarDraft();
    this.router.navigate(['/compras']);
  }
}
