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
import { RadioButtonModule } from 'primeng/radiobutton';
import { MessageModule } from 'primeng/message';
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
  CompraAcreditableItemModel,
  CompraAcreditableModel,
  CompraDetalleModel,
  CompraLineaUI,
  CompraModel,
  CreateCompraDetalleDto,
  CreateCompraDto,
  DestinoNotaCredito,
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
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { PlanCuentaModel } from '../../../core/models/contabilidad.model';
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
    RadioButtonModule,
    MessageModule,
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

  /**
   * Cuenta contable de la que sale el pago: caja menor, anticipos a empleados,
   * fondos por legalizar. Es una vía de primera clase, no un recurso de
   * emergencia — se puede elegir aunque haya una caja abierta, porque que la
   * caja esté abierta no significa que la plata haya salido de ella.
   */
  public cuentaContableId: number | null = null;
  public cuentasContables: PlanCuentaModel[] = [];

  /**
   * De dónde sale la plata. Se declara en vez de deducirse: antes, una compra
   * en efectivo caía siempre en la caja abierta del punto, aunque la hubiera
   * pagado el administrador con su caja menor. Con una factura de días atrás
   * eso descuadraba el arqueo de HOY con plata que el cajero no gastó.
   */
  public origenFondos:
    | 'CREDITO'
    | 'CAJA'
    | 'BANCO'
    | 'CUENTA'
    | 'CAJA_OTRO_DIA'
    | null = null;

  /**
   * Por qué esta factura vieja se carga a la caja de hoy. Solo se pide cuando
   * excede la ventana de gracia; el backend decide si es obligatorio.
   */
  public motivoRetroactivo = '';

  /** Se recupera al editar para no reconstruir el origen como caja normal. */
  public salidaCajaOtroDia = false;

  readonly origenOpts = [
    {
      label: 'Credito',
      value: 'CREDITO',
      icon: 'pi-clock',
      hint: 'Queda como cuenta por pagar al proveedor',
    },
    {
      label: 'Caja',
      value: 'CAJA',
      icon: 'pi-wallet',
      hint: 'Sale del cajón del punto de venta y afecta su arqueo',
    },
    {
      label: 'Banco',
      value: 'BANCO',
      icon: 'pi-building-columns',
      hint: 'Sale de una cuenta bancaria de la empresa',
    },
    {
      label: 'Otra cuenta',
      value: 'CUENTA',
      icon: 'pi-briefcase',
      hint: 'Caja menor, anticipos a empleados, fondos por legalizar',
    },
    {
      label: 'Ya salió de la caja',
      value: 'CAJA_OTRO_DIA',
      icon: 'pi-history',
      hint: 'La plata salió otro día y ese arqueo ya se cerró. No toca ninguna caja.',
    },
  ];

  readonly formaPagoOpts: { label: string; value: FormaPago }[] = [
    { label: 'Contado', value: 'CONTADO' },
    { label: 'Crédito', value: 'CREDITO' },
  ];

  /** Solo medios que pasan por un banco: el efectivo es la vía CAJA. */
  readonly metodosPagoOpts = [
    { label: 'Transferencia', value: 'TRANSFERENCIA', icon: 'pi-send' },
    { label: 'Nequi', value: 'NEQUI', icon: 'pi-mobile' },
    { label: 'Tarjeta', value: 'TARJETA', icon: 'pi-credit-card' },
    { label: 'Cheque', value: 'CHEQUE', icon: 'pi-file' },
  ];

  get esCredito(): boolean {
    return this.origenFondos === 'CREDITO';
  }
  get esCaja(): boolean {
    return this.origenFondos === 'CAJA';
  }
  get esBanco(): boolean {
    return this.origenFondos === 'BANCO';
  }
  get esCuenta(): boolean {
    return this.origenFondos === 'CUENTA';
  }

  /** La plata salió otro día: contablemente es caja, pero no mueve ningún arqueo. */
  get esCajaOtroDia(): boolean {
    return this.origenFondos === 'CAJA_OTRO_DIA';
  }

  /**
   * La factura tiene fecha anterior a hoy. No se bloquea — pagar hoy una
   * factura vieja es legítimo — pero se advierte: si la plata salió aquel día,
   * cargarla a la caja de hoy le deja el descuadre a quien no gastó nada.
   */
  get esFechaRetroactiva(): boolean {
    if (this.fechaCompra == null) return false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const f = new Date(this.fechaCompra);
    f.setHours(0, 0, 0, 0);
    return f.getTime() < hoy.getTime();
  }

  /**
   * Reconstruye el origen de una compra guardada o de un borrador.
   *
   * <p>El pago guarda las tres piezas por separado porque son lo que necesita
   * el asiento; la UI las presenta como una sola pregunta. El orden de
   * evaluación es el mismo con el que el backend resuelve el origen.
   */
  private deducirOrigen(
    formaPago: FormaPago,
    cuentaBancariaId: number | null,
    cuentaContableId: number | null,
    salidaCajaOtroDia = false,
  ): 'CREDITO' | 'CAJA' | 'BANCO' | 'CUENTA' | 'CAJA_OTRO_DIA' {
    if (formaPago === 'CREDITO') return 'CREDITO';
    // Va antes que las cuentas: el flag es una afirmacion sobre un hecho, y la
    // cuenta que quedo guardada es CAJA, que se confundiria con un pago normal.
    if (salidaCajaOtroDia) return 'CAJA_OTRO_DIA';
    if (cuentaContableId != null) return 'CUENTA';
    if (cuentaBancariaId != null) return 'BANCO';
    return 'CAJA';
  }

  /** Cambiar de origen limpia los datos del anterior para no mandar basura. */
  onOrigenChange(): void {
    this.formaPago = this.esCredito ? 'CREDITO' : 'CONTADO';
    if (!this.esBanco) {
      this.cuentaBancariaId = null;
      this.banco = '';
    }
    if (!this.esCuenta) this.cuentaContableId = null;
    this.metodoPago = this.esBanco ? this.metodoPago : 'EFECTIVO';
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

  // ─── Nota crédito ─────────────────────────────────────────────────
  //
  // Una nota crédito no compra nada: anula mercancía que no llegó de una
  // factura concreta. Por eso pide la factura que corrige (para no acreditar
  // más de lo que trajo) y qué se hace con la plata.

  /**
   * La factura elegida, no la lista de candidatas: el proveedor puede tener
   * miles y se buscan de a página desde el servidor.
   */
  public facturaOrigen: CompraAcreditableModel | null = null;
  public destinoNotaCredito: DestinoNotaCredito | null = null;
  public cargandoItemsAcreditables = false;

  // Diálogo de búsqueda de la factura a acreditar (lazy, igual que el de
  // productos: paginado y con la búsqueda en el servidor).
  public showFacturaDialog = false;
  public facturaSearch = '';
  public facturaItems: CompraAcreditableModel[] = [];
  public facturaTotal = 0;
  public facturaLoading = false;
  private facturaLastEvent: TableLazyLoadEvent | null = null;
  private facturaSearchTimer: ReturnType<typeof setTimeout> | null = null;
  private facturaReqId = 0;

  get esNotaCredito(): boolean {
    return this.tipoDocumento === 'NOTA_CREDITO';
  }

  get compraOrigenId(): number | null {
    return this.facturaOrigen?.id ?? null;
  }

  /** Lo que aún se le debe por la factura que se está corrigiendo. */
  get saldoFacturaOrigen(): number {
    return Number(this.facturaOrigen?.saldoPendiente ?? 0);
  }

  /** Cómo se ve la factura elegida en el campo del formulario. */
  get facturaOrigenLabel(): string {
    const f = this.facturaOrigen;
    if (!f) return '';
    return (
      `${f.numeroCompra || '#' + f.id} · ` +
      `${new Date(f.fecha).toLocaleDateString('es-CO')} · ` +
      `${this.formatoMoneda(f.total)}` +
      (Number(f.saldoPendiente) > 0
        ? ` · debe ${this.formatoMoneda(Number(f.saldoPendiente))}`
        : ' · pagada')
    );
  }

  /**
   * Cruzar contra la deuda solo tiene sentido si la factura todavía se debe:
   * ofrecerlo sobre una factura pagada solo produce un error del backend.
   *
   * <p>El resultado se memoiza por saldo. Un getter que devuelve un array nuevo
   * en cada ciclo de detección de cambios hace que el `*ngFor` destruya y
   * recree los `p-radioButton` una y otra vez — con `ngModel` dentro, eso
   * dispara más ciclos y termina colgando la pestaña.
   */
  private destinoOptsCache: {
    saldo: number;
    opts: {
      label: string;
      value: DestinoNotaCredito;
      hint: string;
      icon: string;
      disabled: boolean;
    }[];
  } | null = null;

  get destinoNotaCreditoOpts(): {
    label: string;
    value: DestinoNotaCredito;
    hint: string;
    icon: string;
    disabled: boolean;
  }[] {
    const saldo = this.saldoFacturaOrigen;
    if (this.destinoOptsCache?.saldo === saldo) {
      return this.destinoOptsCache.opts;
    }
    const opts: {
      label: string;
      value: DestinoNotaCredito;
      hint: string;
      icon: string;
      disabled: boolean;
    }[] = [
      {
        label: 'Bajar la deuda',
        value: 'CRUCE_CXP',
        icon: 'pi-minus-circle',
        hint:
          saldo > 0
            ? `Descuenta de los ${this.formatoMoneda(saldo)} que aún se deben`
            : 'La factura ya está pagada: no hay deuda que bajar',
        disabled: saldo <= 0,
      },
      {
        label: 'Devuelve la plata',
        value: 'DEVOLUCION_DINERO',
        icon: 'pi-arrow-down-left',
        hint: 'El proveedor reintegra el dinero a la caja o al banco',
        disabled: false,
      },
      {
        label: 'Saldo a favor',
        value: 'SALDO_A_FAVOR',
        icon: 'pi-bookmark',
        hint: 'Queda como crédito con el proveedor para próximas compras',
        disabled: false,
      },
    ];
    this.destinoOptsCache = { saldo, opts };
    return opts;
  }

  trackByOpcion(_: number, o: { value: string }): string {
    return o.value;
  }

  /** La nota crédito solo mueve plata cuando el proveedor la devuelve. */
  get notaCreditoMuevePlata(): boolean {
    return this.destinoNotaCredito === 'DEVOLUCION_DINERO';
  }

  /**
   * Cómo se llama la sección del dinero. "Reintegro" solo cuando de verdad
   * entra plata: titular así una sección que únicamente dice "no mueve caja ni
   * bancos" es contradecirse en el mismo encabezado.
   */
  get tituloSeccionPago(): string {
    if (!this.esNotaCredito) return 'Pago';
    return this.notaCreditoMuevePlata ? 'Reintegro' : 'Nota crédito';
  }

  /**
   * Formateador único. Se usa desde getters que corren en cada ciclo de
   * detección de cambios y construir un `Intl.NumberFormat` por llamada es de
   * lo más caro que puede hacerse ahí.
   */
  private static readonly COP = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });

  private formatoMoneda(v: number): string {
    return FormCompraComponent.COP.format(v || 0);
  }

  /**
   * La mercancía de la nota crédito sale de la sucursal donde entró, así que
   * cambiar de sucursal cambia las facturas que se pueden acreditar.
   */
  onSucursalChange(): void {
    if (!this.esNotaCredito) return;
    this.limpiarNotaCredito();
    this.lineas.set([]);
  }

  /**
   * En una nota crédito la plata entra, no sale: "Crédito" y "Ya salió de la
   * caja" no significan nada aquí y ofrecerlos solo confunde.
   */
  get origenOptsVisibles(): typeof this.origenOpts {
    if (!this.esNotaCredito) return this.origenOpts;
    // Se calcula una sola vez: devolver un array nuevo en cada ciclo de
    // detección de cambios hace que el `*ngFor` recree los radios cada vez.
    this.origenOptsNC ??= this.origenOpts.filter(
      (o) => o.value !== 'CREDITO' && o.value !== 'CAJA_OTRO_DIA',
    );
    return this.origenOptsNC;
  }

  private origenOptsNC: typeof this.origenOpts | null = null;

  /** Cambiar el tipo de documento entra o sale del modo nota crédito. */
  onTipoDocumentoChange(): void {
    if (!this.esNotaCredito) {
      this.limpiarNotaCredito();
      this.guardarDraft();
      return;
    }
    // En una nota crédito la plata nunca sale: el origen de fondos de la
    // compra no aplica y se vuelve a preguntar solo si el proveedor devuelve.
    this.origenFondos = null;
    this.guardarDraft();
  }

  private limpiarNotaCredito(): void {
    this.facturaOrigen = null;
    this.destinoNotaCredito = null;
    this.facturaItems = [];
    this.facturaTotal = 0;
  }

  // ─── Diálogo de búsqueda de la factura a acreditar ────────────────
  //
  // Mismo patrón que el selector de productos: tabla lazy, paginada y con la
  // búsqueda en el servidor. Un proveedor de años tiene miles de facturas —
  // traerlas todas para filtrarlas en el navegador tumba el formulario.

  abrirFacturaDialog(): void {
    if (!this.proveedorSeleccionado) {
      this.alertService.showWarn(
        'Falta el proveedor',
        'Selecciona primero el proveedor de la nota crédito.',
      );
      return;
    }
    this.facturaSearch = '';
    this.facturaItems = [];
    this.facturaTotal = 0;
    this.facturaLoading = false;
    this.showFacturaDialog = true;

    // La página se pide aquí a propósito. `p-table` emite `onLazyLoad` solo
    // cuando se crea, y `p-dialog` no destruye su contenido al cerrarse: de la
    // segunda apertura en adelante el evento no vuelve a dispararse, así que la
    // tabla se quedaba vacía —"este proveedor no tiene compras acreditables"—
    // hasta que el usuario escribiera algo en el buscador.
    this.loadFacturaTable({ first: 0, rows: 10 });
  }

  async loadFacturaTable(event: TableLazyLoadEvent): Promise<void> {
    this.facturaLastEvent = event;
    if (!this.proveedorSeleccionado) {
      this.facturaItems = [];
      this.facturaTotal = 0;
      this.facturaLoading = false;
      this.cdr.markForCheck();
      return;
    }

    // Solo manda la última petición. Al teclear rápido las respuestas pueden
    // llegar desordenadas y una vieja pisaría el resultado que el usuario está
    // viendo; y la que llega tarde tampoco debe apagar el spinner de la nueva.
    const peticion = ++this.facturaReqId;

    this.facturaLoading = true;
    this.cdr.markForCheck();

    const page =
      event.first != null && event.rows
        ? Math.floor(event.first / event.rows)
        : 0;

    try {
      const res = await lastValueFrom(
        this.compraService.acreditablesPage({
          page,
          rows: event.rows ?? 10,
          search: this.facturaSearch || null,
          params: {
            proveedorId: this.proveedorSeleccionado.id,
            sucursalId: this.sucursalId,
          },
        }),
      );
      if (peticion !== this.facturaReqId) return;
      this.facturaItems = res?.data?.content ?? [];
      this.facturaTotal = res?.data?.totalElements ?? 0;
    } catch {
      if (peticion !== this.facturaReqId) return;
      this.facturaItems = [];
      this.facturaTotal = 0;
    } finally {
      if (peticion === this.facturaReqId) {
        this.facturaLoading = false;
        this.cdr.markForCheck();
      }
    }
  }

  /**
   * Teclear no dispara una consulta por letra: el proveedor puede tener miles
   * de facturas y cada pulsación sería un COUNT sobre toda la tabla. Se espera
   * a que el usuario deje de escribir, igual que el buscador de proveedores.
   */
  onFacturaSearch(): void {
    if (this.facturaSearchTimer) clearTimeout(this.facturaSearchTimer);
    this.facturaSearchTimer = setTimeout(() => {
      const base = this.facturaLastEvent ?? { first: 0, rows: 10 };
      this.loadFacturaTable({ ...base, first: 0 });
    }, 350);
  }

  async seleccionarFacturaOrigen(f: CompraAcreditableModel): Promise<void> {
    this.facturaOrigen = f;
    this.showFacturaDialog = false;
    await this.onCompraOrigenChange();
  }

  quitarFacturaOrigen(): void {
    this.limpiarNotaCredito();
    this.lineas.set([]);
    this.origenFondos = null;
    this.guardarDraft();
  }

  /**
   * Al elegir la factura se cargan sus productos con la cantidad que queda por
   * acreditar. Se prellenan las líneas porque lo normal es acreditar todo y
   * quitar lo que sí llegó — más rápido que buscar cada producto otra vez.
   */
  async onCompraOrigenChange(): Promise<void> {
    this.destinoNotaCredito =
      this.saldoFacturaOrigen > 0 ? 'CRUCE_CXP' : 'SALDO_A_FAVOR';
    this.origenFondos = null;

    if (!this.compraOrigenId) {
      this.lineas.set([]);
      return;
    }

    this.cargandoItemsAcreditables = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.compraService.itemsAcreditables(this.compraOrigenId),
      );
      const items: CompraAcreditableItemModel[] = res?.data ?? [];
      this.lineas.set(items.map((it) => this.lineaDesdeAcreditable(it)));
      if (items.length === 0) {
        this.alertService.showWarn(
          'Nada por acreditar',
          'Esta factura ya fue acreditada por completo.',
        );
      }
    } catch {
      this.lineas.set([]);
    } finally {
      this.cargandoItemsAcreditables = false;
      this.guardarDraft();
      this.cdr.markForCheck();
    }
  }

  private lineaDesdeAcreditable(it: CompraAcreditableItemModel): CompraLineaUI {
    const cantidad = Number(it.cantidadDisponible) || 0;
    const costo = Number(it.costoUnitario) || 0;
    const descuentoPct = Number(it.descuentoPct) || 0;
    const ivaPct = Number(it.ivaPct) || 0;

    const bruto = cantidad * costo;
    const descuentoValor = +((bruto * descuentoPct) / 100).toFixed(2);
    const neto = bruto - descuentoValor;
    const impuestoValor = +((neto * ivaPct) / 100).toFixed(2);

    return {
      _id: uuidv4(),
      productoId: it.productoId,
      productoNombre: it.productoNombre,
      cantidad,
      costoUnitario: costo,
      descuentoPct,
      descuentoValor,
      ivaPorcentaje: ivaPct,
      impuestoValor,
      subtotal: neto,
      precioVenta1: null,
      precioVenta2: null,
      precioVenta3: null,
    };
  }

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
    {
      value: 'compras_generales',
      label: 'Compras generales (mercancías) — 2.5%',
      pct: 2.5,
    },
    {
      value: 'compras_no_declarantes',
      label: 'Compras a no declarantes — 3.5%',
      pct: 3.5,
    },
    { value: 'servicios_general', label: 'Servicios en general — 4%', pct: 4 },
    {
      value: 'servicios_declarantes',
      label: 'Servicios a declarantes — 4%',
      pct: 4,
    },
    { value: 'honorarios_11', label: 'Honorarios — 11%', pct: 11 },
    {
      value: 'honorarios_10',
      label: 'Honorarios (no declarante) — 10%',
      pct: 10,
    },
    { value: 'comisiones_11', label: 'Comisiones — 11%', pct: 11 },
    {
      value: 'comisiones_10',
      label: 'Comisiones (no declarante) — 10%',
      pct: 10,
    },
    {
      value: 'arr_inmuebles',
      label: 'Arrendamiento bienes inmuebles — 3.5%',
      pct: 3.5,
    },
    {
      value: 'arr_muebles',
      label: 'Arrendamiento bienes muebles — 4%',
      pct: 4,
    },
    { value: 'transporte_carga', label: 'Transporte de carga — 1%', pct: 1 },
    {
      value: 'transporte_pasajeros',
      label: 'Transporte de pasajeros — 3.5%',
      pct: 3.5,
    },
    {
      value: 'servicios_temporales',
      label: 'Servicios temporales — 2%',
      pct: 2,
    },
    { value: 'hoteles', label: 'Hoteles / hospedaje — 3.5%', pct: 3.5 },
    {
      value: 'construccion',
      label: 'Construcción / obra material — 2%',
      pct: 2,
    },
  ];

  // ReteIVA — 15% del IVA generado
  readonly reteivaOpts: RetencionOpcion[] = [
    {
      value: 'reteiva_general',
      label: 'ReteIVA general — 15% del IVA',
      pct: 15,
    },
  ];

  // ReteICA — Montelíbano (Córdoba). ⚠ Verificar tarifas oficiales del municipio.
  readonly reteicaOpts: RetencionOpcion[] = [
    {
      value: 'ica_comercial',
      label: 'Montelíbano · Comercial — 10‰ (1%)',
      pct: 1,
    },
    {
      value: 'ica_servicios',
      label: 'Montelíbano · Servicios — 10‰ (1%)',
      pct: 1,
    },
    {
      value: 'ica_industrial',
      label: 'Montelíbano · Industrial — 7‰ (0.7%)',
      pct: 0.7,
    },
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
  /**
   * Signal, no propiedad plana: con OnPush, apagarla dentro del `finally`
   * después del `await` no marcaba el componente para revisión y el botón se
   * quedaba girando para siempre cuando el backend respondía un error. En el
   * camino feliz no se notaba porque se navega y el componente se destruye.
   */
  public isSubmitting = signal(false);

  private readonly DRAFT_KEY = 'compra_draft';

  // Helper para el template
  get lineasArray(): CompraLineaUI[] {
    return this.lineas();
  }

  get subtotalValue(): number {
    return this.subtotal();
  }
  get impuestosTotalValue(): number {
    return this.impuestosTotal();
  }
  get descuentoTotalValue(): number {
    return this.descuentoTotal();
  }
  get subtotalBrutoValue(): number {
    return this.subtotalBruto();
  }
  get totalUnidadesValue(): number {
    return this.totalUnidades();
  }

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
      this.retefuenteValorValue +
      this.reteivaValorValue +
      this.reteicaValorValue
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
      this.cuentaContableId = draft.cuentaContableId || null;
      this.salidaCajaOtroDia = draft.salidaCajaOtroDia ?? false;
      this.origenFondos = this.deducirOrigen(
        this.formaPago,
        this.cuentaBancariaId,
        this.cuentaContableId,
        this.salidaCajaOtroDia,
      );
      this.tipoDocumento = draft.tipoDocumento || 'FACTURA_COMPRA';
      this.facturaOrigen = draft.facturaOrigen ?? null;
      this.destinoNotaCredito = draft.destinoNotaCredito ?? null;
      this.fletes = draft.fletes || 0;

      this.retefuentePct = draft.retefuentePct || 0;
      this.reteivaPct = draft.reteivaPct || 0;
      this.reteicaPct = draft.reteicaPct || 0;
      this.retefuenteSel = draft.retefuenteSel ?? null;
      this.reteivaSel = draft.reteivaSel ?? null;
      this.reteicaSel = draft.reteicaSel ?? null;

      this.alertService.showInfo(
        'Borrador recuperado',
        'Se restauraron los datos del formulario.',
      );
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
        salidaCajaOtroDia: this.esCajaOtroDia,
        plazoDias: this.plazoDias,
        metodoPago: this.metodoPago,
        banco: this.banco,
        cuentaBancariaId: this.cuentaBancariaId,
        cuentaContableId: this.cuentaContableId,
        tipoDocumento: this.tipoDocumento,
        facturaOrigen: this.facturaOrigen,
        destinoNotaCredito: this.destinoNotaCredito,
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
    private readonly contabilidadService: ContabilidadService,
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
    this.salidaCajaOtroDia = compra.salidaCajaOtroDia ?? false;
    this.origenFondos = this.deducirOrigen(
      this.formaPago,
      this.cuentaBancariaId,
      this.cuentaContableId,
      this.salidaCajaOtroDia,
    );
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
      const [sucursales, defaultId, cuentasRes, planRes] = await Promise.all([
        this.indexDBService.getSucursales(),
        this.indexDBService.getSucursalDefault(),
        lastValueFrom(this.cuentaBancariaService.list()).catch(() => null),
        lastValueFrom(this.contabilidadService.listarMediosPago()).catch(
          () => null,
        ),
      ]);
      this.cuentasBancarias = (cuentasRes?.data ?? []).filter((c) => c.activa);
      // Solo cuentas habilitadas como medio de pago: aquí está la CAJA MENOR.
      // La lista la decide el contador con el flag del plan de cuentas, no un
      // filtro por tipo — filtrar por ACTIVO dejaba pasar inventarios y cartera
      // como si fueran fondos, y el backend los rechaza.
      this.cuentasContables = planRes?.data ?? [];
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
    // La nota crédito se emite contra una factura de ESTE proveedor: cambiarlo
    // invalida la que estuviera elegida.
    if (this.esNotaCredito) {
      this.limpiarNotaCredito();
      this.lineas.set([]);
    }
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
    this.limpiarNotaCredito();
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

    if (this.esNotaCredito) {
      if (!this.compraOrigenId)
        return 'Elige la factura de compra que corrige la nota crédito.';
      if (!this.destinoNotaCredito)
        return 'Indica qué se hace con el valor de la nota crédito.';
      if (this.destinoNotaCredito === 'CRUCE_CXP' && this.saldoFacturaOrigen <= 0)
        return 'Esa factura ya está pagada: no hay deuda que bajar.';

      // Solo la devolución de dinero mueve plata; las otras dos no tocan caja
      // ni bancos, así que preguntar por el origen sobraría.
      if (!this.notaCreditoMuevePlata) return null;
    }

    // Sin origen no se guarda: es la decisión que define a quién le afecta el
    // arqueo, y adivinarla es justo lo que descuadraba la caja del cajero.
    if (!this.origenFondos) {
      return this.esNotaCredito
        ? 'Indica por dónde entra la plata que devuelve el proveedor.'
        : 'Indica de dónde sale la plata.';
    }
    if (this.esBanco && !this.cuentaBancariaId)
      return 'Elige de qué cuenta bancaria sale el pago.';
    if (this.esCuenta && !this.cuentaContableId)
      return 'Elige de qué cuenta contable sale el pago.';

    return null;
  }

  // ─── Guardar ──────────────────────────────────────────────────────
  async saveCompra(): Promise<void> {
    const err = this.validar();
    if (err) return void this.alertService.showWarn('Compra incompleta', err);

    this.guardarDraft();
    this.isSubmitting.set(true);
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
        formaPago: this.esCredito ? 'CREDITO' : 'CONTADO',
        // El backend resuelve la cuenta de CAJA por su cuenta: aqui solo se
        // afirma el hecho, no se elige contra que cuenta va.
        salidaCajaOtroDia: this.esCajaOtroDia,
        motivoRetroactivo:
          this.esCaja && this.esFechaRetroactiva
            ? this.motivoRetroactivo.trim() || null
            : null,
        tipoDocumento: this.tipoDocumento,
        compraOrigenId: this.esNotaCredito ? this.compraOrigenId : null,
        destinoNotaCredito: this.esNotaCredito ? this.destinoNotaCredito : null,
        fletes: this.fletes || null,
        // Del pago viaja SOLO el identificador de la vía elegida: informar dos
        // haría que el resolutor use el de más prioridad y no el que se quiso.
        //
        // En una nota crédito el "pago" es al revés — la plata entra — y solo
        // existe cuando el proveedor la devuelve: cruzar la deuda o dejarla a
        // favor no mueve caja ni bancos.
        pagos:
          (this.esNotaCredito && !this.notaCreditoMuevePlata) || this.esCredito
            ? null
            : [
                {
                  metodoPago: this.esBanco ? this.metodoPago : 'EFECTIVO',
                  monto:
                    this.totalRetencionesValue > 0
                      ? this.netaAPagarValue
                      : this.totalValue,
                  banco: this.esBanco ? this.banco.trim() || null : null,
                  cuentaBancariaId: this.esBanco ? this.cuentaBancariaId : null,
                  cuentaContableId: this.esCuenta ? this.cuentaContableId : null,
                },
              ],
      };

      let res;
      if (this.modoEdicion && this.editId) {
        res = await lastValueFrom(this.compraService.update(this.editId, dto));
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
            this.esNotaCredito ? 'Nota crédito registrada' : 'Compra registrada',
            this.esNotaCredito
              ? `Nota crédito #${res.data?.id} creada. Stock descontado.`
              : `Compra #${res.data?.id} creada. Stock actualizado.`,
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
      this.isSubmitting.set(false);
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
    this.origenFondos = null;
    this.motivoRetroactivo = '';
    this.salidaCajaOtroDia = false;
    this.plazoDias = 30;
    this.metodoPago = 'EFECTIVO';
    this.banco = '';
    this.cuentaBancariaId = null;
    this.cuentaContableId = null;
    this.tipoDocumento = 'FACTURA_COMPRA';
    this.limpiarNotaCredito();
    this.fletes = 0;
  }

  cancelar(): void {
    this.guardarDraft();
    this.router.navigate(['/compras']);
  }
}
