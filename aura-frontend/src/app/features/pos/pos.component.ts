import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { PopoverModule } from 'primeng/popover';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { lastValueFrom } from 'rxjs';
import { v4 as uuid } from 'uuid';
import {
  CartItem,
  CreateVentaDto,
  PagoUI,
  PrecioDisponible,
  ProductoPOS,
  VentaModel,
} from '../../core/models/venta.model';
import { TurnoCajaModel } from '../../core/models/caja.model';
import { VentaService } from '../../core/services/venta.service';
import { CotizacionService } from '../../core/services/cotizacion.service';
import { TurnoCajaService } from '../../core/services/caja.service';
import { TerceroService } from '../../core/services/tercero.service';
import {
  SerialPickerComponent,
  SerialesElegidos,
} from '../../shared/components/serial-picker/serial-picker.component';
import { SerialProductoService } from '../../core/services/serial-producto.service';
import { AlertService } from '../../shared/pipes/alert.service';
import { ListaPreciosService } from '../../core/services/lista-precios.service';
import { ProductoPrecioService } from '../../core/services/producto-precio.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ModalPagoComponent } from './components/modal-pagos/modal-pago.component';
import { ModalMovimientoCajaComponent } from './components/modal-movimiento-caja/modal-movimiento-caja.component';
import { VentaResponse } from '../../core/models/venta-response.model';
import { ModalTirillaComponent } from './components/modal-tirilla/modal-tirilla.component';
import { ModalTirillaCotizacionComponent } from './components/modal-tirilla-cotizacion/modal-tirilla-cotizacion.component';
import { CotizacionModel } from '../../core/models/cotizacion.model';
import {
  FilterProductsPipe,
  SEARCH_RESULT_LIMIT,
} from '../../shared/pipes/filter-products.pipe';
import { FormTerceroComponent } from '../terceros/form/form-tercero.component';
import { TerceroModel } from '../../core/models/tercero.model';
import {
  FacturaElectronicaModalComponent,
  FacturaElectronicaResult,
} from '../factura_eletronica/factura-electronica-modal.component';
import { IndexDBService } from '../../core/services/index-db.service';
import { AuthResponse } from '../../core/models/auth.model';
import {
  EmpresaConfig,
  EmpresaService,
} from '../../core/services/empresa.service';
import { CuentaBancariaService } from '../../core/services/cuenta-bancaria.service';
import { CuentaBancariaModel } from '../../core/models/cuenta-bancaria.model';
import { CarteraService } from '../../core/services/cartera.service';
import { ValidacionCreditoModel } from '../../core/models/cartera.model';
import { TicketComprobanteCajaComponent } from '../comprobantes/ticket/ticket-comprobante-caja.component';
import { ComprobanteCajaModel } from '../../core/models/comprobante-caja.model';
import { MovimientoCajaDto } from '../../core/models/caja.model';
import { StateStore } from '../../core/store/state';

interface CartTab {
  id: string;
  label: string;
  cart: CartItem[];
  clienteId: number | null;
  clienteNombre: string | null;
  listaSeleccionada: { id: number; nombre: string } | null;
  preciosPorLista: Array<[number, number]>;
  exentoIva?: boolean;
}

/** Forma de vender un producto en el POS: la unidad suelta o una presentación. */
interface OpcionVenta {
  presentacionId: number | null;
  nombre: string;
  /** Precio final al cliente (con IVA). */
  precio: number;
  /** Unidades de inventario que salen por cada una. */
  factor: number;
  stock: number;
  esDefault: boolean;
  codigoBarras: string | null;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    PopoverModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    InputNumberModule,
    BadgeModule,
    TagModule,
    ToastModule,
    TooltipModule,
    SkeletonModule,
    ModalPagoComponent,
    ModalMovimientoCajaComponent,
    ModalTirillaComponent,
    ModalTirillaCotizacionComponent,
    FilterProductsPipe,
    FacturaElectronicaModalComponent,
    DialogModule,
    TextareaModule,
    FormTerceroComponent,
    TicketComprobanteCajaComponent,
    SerialPickerComponent,
  ],
  providers: [MessageService],
  templateUrl: './pos.component.html',
  styleUrls: ['./pos.component.scss'],
})
export class PosComponent implements OnInit, AfterViewInit, OnDestroy {
  // ── Responsive: store para saber si estamos en móvil (<768px) ──
  public readonly state = inject(StateStore);

  // ── Móvil: carrito como bottom sheet ──────────────────────
  public mobileCartOpen = false;
  private _sheetStartY = 0;
  private _sheetDeltaY = 0;

  searchProduct = '';
  page = 1;
  length = 12;
  readonly searchResultLimit = SEARCH_RESULT_LIMIT;
  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;
  public showTirilla = false;
  public ventaActual: VentaModel | null = null;
  public qrDataActual: string | null = null;
  public cufeActual: string | null = null;

  // ── Turno ──────────────────────────────────────────────────
  public turnoActivo: TurnoCajaModel | null = null;
  public turnoError = false;
  public loadingTurno = true;
  public esVendedor = false;
  private vendedorSucursalId: number | null = null;

  // ── Catálogo ───────────────────────────────────────────────
  public productos: ProductoPOS[] = [];
  public productosFiltrados: ProductoPOS[] = [];
  public loadingProductos = true;
  public searchProducto = '';
  public categoriaActiva: number | null = null;
  public categorias: { id: number; nombre: string }[] = [];
  private searchSubject$ = new Subject<string>();
  private destroy$ = new Subject<void>();
  private _barcodeTimer: ReturnType<typeof setTimeout> | null = null;
  tempCantidad: number = 0;
  // ── Órdenes múltiples ─────────────────────────────────────
  readonly MAX_TABS = 5;
  tabs: CartTab[] = [];
  tabActivo = 0;
  private _loadingTab = false;

  // ── Carrito ───────────────────────────────────────────────
  public cart: CartItem[] = [];
  public clienteId: number | null = null;
  public clienteNombre: string | null = null;
  public clienteSugerencias: any[] = [];
  public empesaInfo!: AuthResponse;
  // ── Modal pago ────────────────────────────────────────────
  public showPago = false;
  public pagosPrev: PagoUI[] = [];
  public empresaConfig: EmpresaConfig | null = null;
  // ── Factura electrónica ───────────────────────────────────────────
  public mostrarModalFE = false;
  public ventaCompletadaId: number | null = null;
  public empresaFacturaElec = false;
  public cajeroNombre = '';
  public feClienteNombre = '';
  public feClienteDocumento = '';
  public feClienteEmail = '';
  public percent: number | null = null;
  public neto: number | null = null;
  public tempPrecio: number | null = null;

  // ── Nuevo cliente ─────────────────────────────────────────
  public showNuevoCliente = false;

  // ── Movimiento de caja (ingreso / egreso) ─────────────────
  public showMovimiento = false;
  public showTicketMovimiento = false;
  public comprobanteMovimiento: ComprobanteCajaModel | null = null;

  // ── Exento de IVA (ONG / entidades sin ánimo de lucro) ───
  public exentoIva = false;

  // ── Lista de precios ──────────────────────────────────────
  public listaPreciosOpts: { label: string; value: number }[] = [];
  public listaSeleccionada: { id: number; nombre: string } | null = null;
  private preciosPorLista = new Map<number, number>(); // presentacionId → precio
  /** Formas de venta por producto (unidad + presentaciones); arreglo estable para las vistas. */
  private opcionesPorProducto = new Map<number, OpcionVenta[]>();
  // Todas las listas precargadas: listaPrecioId → { nombre, precios: Map<productKey, precio> }
  private todasListasPrecio = new Map<
    number,
    { nombre: string; precios: Map<number, number> }
  >();

  // ── Cotización ────────────────────────────────────────────
  public showCotizacion = false;
  public showTirillaCotizacion = false;
  public cotizacionCreada: CotizacionModel | null = null;
  public cotizacionTerceroId: number | null = null;
  public cotizacionTerceroNombre: string | null = null;
  public cotizacionDiasVigencia = 3;
  public cotizacionObservaciones: string | null = null;
  public cotizacionSugerencias: any[] = [];
  public savingCotizacion = false;

  // ── Tesorería / Crédito ──────────────────────────────────────────
  public cuentasBancarias: CuentaBancariaModel[] = [];
  public creditoInfo: ValidacionCreditoModel | null = null;

  constructor(
    private readonly ventaService: VentaService,
    private readonly cotizacionService: CotizacionService,
    private readonly turnoCajaService: TurnoCajaService,
    private readonly terceroService: TerceroService,
    private readonly alertService: AlertService,
    private readonly router: Router,
    private readonly empresaService: EmpresaService,
    private readonly indexDBService: IndexDBService,
    private readonly http: HttpClient,
    private readonly cdr: ChangeDetectorRef,
    private readonly listaPreciosService: ListaPreciosService,
    private readonly productoPrecioService: ProductoPrecioService,
    private readonly cuentaBancariaService: CuentaBancariaService,
    private readonly carteraService: CarteraService,
    private readonly serialService: SerialProductoService,
  ) {}

  ngOnInit(): void {
    this.indexDBService.getSucursalDefault().then((id) => (this.sucursalPos = id));
    this.checkTurno();
    this.setupSearch();
    this.loadEmpresaConfig();
    this.loadListaPrecios();
    this.cargarCotizacionDesdeNavegacion();
    this.cargarCuentasBancarias();
  }

  private async cargarCuentasBancarias(): Promise<void> {
    try {
      const res = await lastValueFrom(this.cuentaBancariaService.list());
      this.cuentasBancarias = (res?.data ?? []).filter((c) => c.activa);
    } catch {
      /* silencioso */
    }
  }

  private cargarCotizacionDesdeNavegacion(): void {
    const cotizacion =
      this.router.getCurrentNavigation()?.extras?.state?.['cotizacion'] ??
      history.state?.cotizacion;
    if (!cotizacion?.detalles?.length) return;
    // Esperar a que los productos se carguen, luego poblar el carrito
    const interval = setInterval(() => {
      if (!this.loadingProductos) {
        clearInterval(interval);
        this.poblarCarritoDesdeCotizacion(cotizacion);
      }
    }, 100);
  }

  private poblarCarritoDesdeCotizacion(cotizacion: any): void {
    this.clearCart();
    for (const d of cotizacion.detalles) {
      const item: CartItem = {
        _id: uuid(),
        productoId: d.productoId,
        presentacionId: null,
        productoNombre: d.productoNombre,
        productoSku: d.productoSku ?? null,
        precio: d.precioUnitario,
        precioCatalogo: d.precioUnitario,
        cantidad: d.cantidad,
        descuento: d.descuentoValor ?? 0,
        descuentoAutomatico: null,
        impuesto: d.ivaPorcentaje ?? 0,
        impuestoValor: 0,
        subtotal: 0,
        esPesable: false,
        unidadMedida: 'UND',
        showDescuento: false,
      };
      const base = round2(item.precio * item.cantidad);
      const desc = round2(item.descuento);
      const baseNeta = round2(Math.max(0, base - desc));
      const iva = round2(baseNeta * (item.impuesto / 100));
      item.impuestoValor = iva;
      item.subtotal = round2(baseNeta + iva);
      this.cart = [...this.cart, item];
    }
    if (cotizacion.terceroId) {
      this.clienteId = cotizacion.terceroId;
      this.clienteNombre = cotizacion.terceroNombre ?? null;
    }
    this.recalcularTotales();
    this.alertService.showSuccess(
      'Cotización cargada',
      `${cotizacion.numero} lista para procesar`,
    );
    this.cdr.markForCheck();
  }

  private async loadEmpresaConfig(): Promise<void> {
    try {
      const auth = await this.indexDBService.loadDataAuthDB();
      this.empresaFacturaElec = auth?.facturaElectronica ?? false;
      this.cajeroNombre = auth?.nombreCompleto ?? '';
      const res = await lastValueFrom(this.empresaService.getConfig());
      this.empresaConfig = res?.data ?? null;
    } catch {
      this.empresaFacturaElec = false;
    }
  }
  ngAfterViewInit(): void {
    this.focusSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this._barcodeTimer) clearTimeout(this._barcodeTimer);
  }

  aplicarPrecio(item: CartItem): void {
    if (this.tempPrecio === null || this.tempPrecio < 0) return;
    if (item.precioOriginal === undefined) item.precioOriginal = item.precio;
    // El cajero ingresa el precio final con IVA → back-calculamos el base
    const factor = 1 + item.impuesto / 100;
    item.precio =
      factor > 0 ? round2(this.tempPrecio / factor) : this.tempPrecio;
    item.descuento = 0;
    this.tempPrecio = null;
    this.calcLine(item);
    this.cdr.markForCheck();
  }

  aplicarDescuento(item: CartItem) {
    if (this.neto !== null) {
      item.descuento = this.neto * 1;
      this.neto = null;
      this.calcLine(item);
      this.cdr.markForCheck();
    }
  }

  focusSearch(): void {
    setTimeout(() => this.searchInputRef?.nativeElement?.focus(), 50);
  }

  private async checkTurno(): Promise<void> {
    try {
      const rol = await this.indexDBService.getRol();
      if (rol === 'VENDEDOR') {
        this.esVendedor = true;
        this.turnoError = false;
        this.vendedorSucursalId =
          await this.indexDBService.getSucursalDefault();
        this.initTabs();
        this.loadProductos();
        return;
      }
      const res = await lastValueFrom(this.turnoCajaService.turnoActivo());
      this.turnoActivo = res?.data ?? null;
      this.turnoError = !this.turnoActivo;
      if (this.turnoActivo) {
        this.initTabs();
        this.loadProductos();
      }
    } catch {
      this.turnoError = true;
    } finally {
      this.loadingTurno = false;
      this.cdr.markForCheck();
    }
  }

  private async loadProductos(): Promise<void> {
    this.productos = [];
    try {
      const res: any = await lastValueFrom(
        this.http.get<any>(`${environment.apiUrl}productos/pos`),
      );
      this.productos = res?.data ?? [];
      this.construirOpciones();
      this.extraerCategorias();
      this.filtrar();
    } catch {
      this.productos = [];
    } finally {
      this.loadingProductos = false;
      this.cdr.markForCheck();
    }
  }

  private extraerCategorias(): void {
    const map = new Map<number, string>();
    for (const p of this.productos) {
      if (p.categoriaId && p.categoriaNombre)
        map.set(p.categoriaId, p.categoriaNombre);
    }
    this.categorias = Array.from(map, ([id, nombre]) => ({ id, nombre }));
  }

  private setupSearch(): void {
    this.searchSubject$
      .pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.filtrar();
        this.cdr.markForCheck();
      });
  }

  private parsearCodigoBalanza(
    codigo: string,
  ): { skuNumerico: number; pesoKg: number } | null {
    if (!/^\d+$/.test(codigo)) return null;
    let skuRaw: string, pesoRaw: string;
    if (codigo.length === 12) {
      // Formato real balanza: [PPPPPP][WWWWWW]
      skuRaw = codigo.substring(0, 6);
      pesoRaw = codigo.substring(6, 12);
    } else if (codigo.length === 13 && codigo[0] === '0') {
      // Formato alternativo con prefijo: [0][PPPPPP][WWWWWW]
      skuRaw = codigo.substring(1, 7);
      pesoRaw = codigo.substring(7, 13);
    } else {
      return null;
    }
    const skuNumerico = parseInt(skuRaw, 10);
    const pesoKg = Math.floor(parseInt(pesoRaw, 10) / 10) / 1000;
    if (isNaN(skuNumerico) || isNaN(pesoKg) || pesoKg <= 0) return null;
    return { skuNumerico, pesoKg };
  }

  addToCartConPeso(p: ProductoPOS, pesoKg: number): void {
    const existing = this.cart.find((c) => c.productoId === p.id);
    if (existing) {
      existing.cantidad = round2(existing.cantidad + pesoKg);
      this.calcLine(existing);
    } else {
      const precioBase = p.precioFinal ?? p.precio ?? 0;
      const precioValido = isFinite(precioBase) ? precioBase : 0;

      if (precioValido <= 0) {
        this.alertService.showWarn(
          'Precio inválido',
          `${p.nombre} no tiene un precio válido.`,
        );
        return;
      }

      let precioPOS = precioValido;
      let listaNombre: string | undefined;
      if (this.listaSeleccionada) {
        const listaPrice = this.preciosPorLista.get(-p.id);
        if (listaPrice != null && isFinite(listaPrice)) {
          precioPOS = listaPrice;
          listaNombre = this.listaSeleccionada.nombre;
        }
      }
      const ivaOriginalPeso = (p.ivaPorcentaje ?? 0) || 0;
      const item: CartItem = {
        _id: uuid(),
        productoId: p.id,
        presentacionId: null,
        factor: 1,
        productoNombre: p.nombre || 'Producto sin nombre',
        productoSku: p.sku,
        precio: precioPOS,
        precioCatalogo: precioValido,
        listaPrecioNombre: listaNombre,
        listaPrecioId: listaNombre ? this.listaSeleccionada?.id : undefined,
        cantidad: pesoKg,
        descuento: 0,
        descuentoAutomatico: p.descuentoNombre ?? null,
        impuesto: this.exentoIva ? 0 : ivaOriginalPeso,
        impuestoOriginal: this.exentoIva ? ivaOriginalPeso : undefined,
        impuestoValor: 0,
        subtotal: 0,
        esPesable: true,
        unidadMedida: 'kg',
        showDescuento: false,
        precio2: p.precio2 ?? null,
        precio3: p.precio3 ?? null,
        preciosDisponibles: this.buildPreciosDisponibles(p.id, null),
      };
      this.cart = [item, ...this.cart];
      this.calcLine(item);
    }
    this.recalcularTotales();
    this.alertService.showSuccess(
      p.nombre,
      `${pesoKg.toFixed(3)} kg agregados al carrito`,
    );
    this.cdr.markForCheck();
  }

  onSearch(): void {
    const query = this.searchProduct.trim();

    // Filtrado visual inmediato (sin espera)
    this.searchSubject$.next(query);

    // Detección de barcode/balanza con debounce para evitar
    // que los estados intermedios del scanner disparen addToCart
    if (this._barcodeTimer) clearTimeout(this._barcodeTimer);
    if (!query) return;

    this._barcodeTimer = setTimeout(() => {
      this._barcodeTimer = null;
      const q = this.searchProduct.trim();
      if (!q) return;

      // Intento de lectura de código de balanza
      const balanza = this.parsearCodigoBalanza(q);
      if (balanza) {
        const prod = this.productos.find(
          (p) =>
            p.tipoProducto === 'PESABLE' &&
            p.sku != null &&
            parseInt(p.sku, 10) === balanza.skuNumerico,
        );
        if (prod) {
          this.addToCartConPeso(prod, balanza.pesoKg);
          this.searchProduct = '';
          this.filtrar();
          this.focusSearch();
          this.cdr.markForCheck();
          return;
        }
        // Si no se encuentra producto PESABLE, cae al flujo normal de barcode
      }

      // Código del producto o SKU → su forma de venta por defecto;
      // código de una presentación (la paca) → esa presentación.
      let encontrado: { p: ProductoPOS; opcion: OpcionVenta | null } | null =
        null;
      const porProducto = this.productos.find(
        (p) =>
          (p.codigoBarras && p.codigoBarras === q) || (p.sku && p.sku === q),
      );
      if (porProducto) {
        const unidad = this.opcionesDe(porProducto).find(
          (o) => o.presentacionId == null,
        );
        encontrado = { p: porProducto, opcion: unidad ?? null };
      } else {
        for (const p of this.productos) {
          const opcion = this.opcionesDe(p).find(
            (o) => o.presentacionId != null && o.codigoBarras === q,
          );
          if (opcion) {
            encontrado = { p, opcion };
            break;
          }
        }
      }

      if (encontrado) {
        this.addToCart(encontrado.p, encontrado.opcion);
        this.searchProduct = '';
        this.filtrar();
        this.focusSearch();
        this.cdr.markForCheck();
      } else {
        // No es un código de producto: puede ser el serial de una unidad.
        void this.agregarPorSerial(q);
      }
    }, 150);
  }

  clearSearch(): void {
    this.searchProduct = '';
    this.filtrar();
    this.focusSearch();
    this.cdr.markForCheck();
  }

  filtrar(): void {
    const q = this.searchProduct.trim().toLowerCase();
    const cat = this.categoriaActiva;
    this.productosFiltrados = this.productos.filter((p) => {
      if (cat && p.categoriaId !== cat) return false;
      if (
        p.tipoProducto !== 'SERVICIO' &&
        p.manejaInventario &&
        p.stockActual <= 0 &&
        !p.permitirStockNegativo
      )
        return false;
      if (!q) return true;
      return (
        p.nombre.toLowerCase().includes(q) ||
        (p.sku != null && p.sku.toLowerCase().includes(q)) ||
        (p.codigoBarras != null && p.codigoBarras.toLowerCase().includes(q)) ||
        (p.presentaciones ?? []).some(
          (pr) =>
            pr.nombre?.toLowerCase().includes(q) ||
            (pr.codigoBarras != null &&
              pr.codigoBarras.toLowerCase().includes(q)),
        )
      );
    });
  }

  setCategoria(id: number | null): void {
    this.categoriaActiva = id;
    this.filtrar();
    this.cdr.markForCheck();
  }

  // ── Lista de precios ──────────────────────────────────────
  private async loadListaPrecios(): Promise<void> {
    try {
      const res = await lastValueFrom(this.listaPreciosService.list());
      const listas = res?.data ?? [];
      this.listaPreciosOpts = listas.map((l) => ({
        label: l.nombre,
        value: l.id,
      }));
      // Precargar precios de todas las listas en paralelo
      await Promise.all(
        listas.map(async (l) => {
          try {
            const pr = await lastValueFrom(
              this.productoPrecioService.listByLista(l.id),
            );
            const precios = new Map<number, number>();
            for (const p of pr?.data ?? []) {
              if (p.productoPresentacionId != null) {
                precios.set(p.productoPresentacionId, p.precio);
              } else if (p.productoId != null) {
                precios.set(-p.productoId, p.precio);
              }
            }
            this.todasListasPrecio.set(l.id, { nombre: l.nombre, precios });
          } catch {
            /* silent */
          }
        }),
      );
      // Una vez cargadas todas las listas, actualizar los ítems ya en carrito/tabs
      this.refreshPreciosDisponiblesEnTodos();
      this.cdr.markForCheck();
    } catch {
      /* silent */
    }
  }

  /** Actualiza preciosDisponibles en todos los ítems del carrito activo y todos los tabs */
  private refreshPreciosDisponiblesEnTodos(): void {
    // Carrito activo (this.cart es copia independiente del tab)
    for (const item of this.cart) {
      item.preciosDisponibles = this.buildPreciosDisponibles(
        item.productoId,
        item.presentacionId,
      );
    }
    // Resto de tabs guardados
    for (const tab of this.tabs) {
      for (const item of tab.cart) {
        item.preciosDisponibles = this.buildPreciosDisponibles(
          item.productoId,
          item.presentacionId,
        );
      }
    }
  }

  /** Construye los precios disponibles de todas las listas para un producto/presentación */
  private buildPreciosDisponibles(
    productoId: number,
    presentacionId: number | null,
  ): PrecioDisponible[] {
    const result: PrecioDisponible[] = [];
    for (const [listaId, { nombre, precios }] of this.todasListasPrecio) {
      // El precio de lista del producto es por unidad: no aplica a la paca.
      const precio =
        presentacionId != null
          ? precios.get(presentacionId)
          : precios.get(-productoId);
      if (precio != null && isFinite(precio)) {
        result.push({ listaId, listaNombre: nombre, precio });
      }
    }
    return result;
  }

  /** Aplica el precio de una lista específica a una línea del carrito */
  cambiarPrecioPorLinea(item: CartItem, opt: PrecioDisponible): void {
    if (item.precioOriginal === undefined)
      item.precioOriginal = item.precioCatalogo;
    item.precio = opt.precio;
    item.listaPrecioNombre = opt.listaNombre;
    item.listaPrecioId = opt.listaId;
    item.descuento = 0;
    this.calcLine(item);
    this.cdr.markForCheck();
  }

  /** Selecciona P2 o P3 del producto como precio de la línea */
  seleccionarPrecioProducto(
    item: CartItem,
    precio: number,
    label: string,
  ): void {
    if (item.precioOriginal === undefined)
      item.precioOriginal = item.precioCatalogo;
    item.precio = precio;
    item.listaPrecioNombre = label;
    item.listaPrecioId = undefined;
    item.descuento = 0;
    this.calcLine(item);
    this.cdr.markForCheck();
  }

  /** Restaura el precio de catálogo en una línea */
  resetPrecioLinea(item: CartItem): void {
    item.precio = item.precioCatalogo;
    item.listaPrecioNombre = undefined;
    item.listaPrecioId = undefined;
    item.precioOriginal = undefined;
    item.descuento = 0;
    this.calcLine(item);
    this.cdr.markForCheck();
  }

  async seleccionarListaPrecios(opt: {
    label: string;
    value: number;
  }): Promise<void> {
    if (this.listaSeleccionada?.id === opt.value) return;
    this.listaSeleccionada = { id: opt.value, nombre: opt.label };
    try {
      const res = await lastValueFrom(
        this.productoPrecioService.listByLista(opt.value),
      );
      this.preciosPorLista.clear();
      for (const p of res?.data ?? []) {
        // Indexar por presentacionId si tiene, o por productoId si no
        if (p.productoPresentacionId != null) {
          this.preciosPorLista.set(p.productoPresentacionId, p.precio);
        } else if (p.productoId != null) {
          // Usar clave negativa para distinguir de presentacionId
          this.preciosPorLista.set(-p.productoId, p.precio);
        }
      }
      this.aplicarListaAlCarrito();
    } catch {
      /* silent */
    }
  }

  clearListaPrecios(): void {
    this.listaSeleccionada = null;
    this.preciosPorLista.clear();
    for (const item of this.cart) {
      item.precio = item.precioCatalogo;
      item.listaPrecioNombre = undefined;
      this.calcLine(item);
    }
    this.cdr.markForCheck();
  }

  toggleExentoIva(): void {
    this.exentoIva = !this.exentoIva;
    for (const item of this.cart) {
      if (this.exentoIva) {
        item.impuestoOriginal = item.impuesto;
        item.impuesto = 0;
      } else {
        item.impuesto = item.impuestoOriginal ?? item.impuesto;
        item.impuestoOriginal = undefined;
      }
      this.calcLine(item);
    }
    this.cdr.markForCheck();
  }

  private aplicarListaAlCarrito(): void {
    for (const item of this.cart) {
      const listaPrice = this.getPrecioDeListaParaItem(item);
      item.precio = listaPrice ?? item.precioCatalogo;
      item.listaPrecioNombre =
        listaPrice != null ? this.listaSeleccionada?.nombre : undefined;
      this.calcLine(item);
    }
    this.cdr.markForCheck();
  }

  private getPrecioDeListaParaItem(item: CartItem): number | undefined {
    return this.precioListaDeOpcion(item.productoId, item.presentacionId);
  }

  /** Precio de la lista activa para la unidad o para una presentación (sin mezclarlos). */
  private precioListaDeOpcion(
    productoId: number,
    presentacionId: number | null,
  ): number | undefined {
    const precio =
      presentacionId != null
        ? this.preciosPorLista.get(presentacionId)
        : this.preciosPorLista.get(-productoId);
    return precio != null && isFinite(precio) ? precio : undefined;
  }

  // ── Formas de venta (una tarjeta por producto) ────────────
  private construirOpciones(): void {
    this.opcionesPorProducto.clear();
    for (const p of this.productos) {
      const opciones: OpcionVenta[] = [];
      if (p.vendePorUnidad !== false) {
        const base = p.precioFinal || p.precio || 0;
        opciones.push({
          presentacionId: null,
          nombre: this.nombreVentaSuelta(p),
          precio: p.ivaIncluido
            ? base
            : base * (1 + (p.ivaPorcentaje || 0) / 100),
          factor: 1,
          stock: p.stockActual,
          esDefault: false,
          codigoBarras: p.codigoBarras,
        });
      }
      for (const pr of p.presentaciones ?? []) {
        opciones.push({
          presentacionId: pr.id,
          nombre: pr.nombre,
          precio: pr.precio,
          factor: pr.factorConversion || 1,
          stock: pr.stock,
          esDefault: !!pr.esDefaultVenta,
          codigoBarras: pr.codigoBarras,
        });
      }
      this.opcionesPorProducto.set(p.id, opciones);
    }
  }

  opcionesDe(p: ProductoPOS): OpcionVenta[] {
    return this.opcionesPorProducto.get(p.id) ?? [];
  }

  opcionesLinea(item: CartItem): OpcionVenta[] {
    return this.opcionesPorProducto.get(item.productoId) ?? [];
  }

  /** La presentación marcada para venta; si no hay, la unidad; si no se vende suelto, la primera. */
  opcionDefault(p: ProductoPOS): OpcionVenta | null {
    const opciones = this.opcionesDe(p);
    return opciones.find((o) => o.esDefault) ?? opciones[0] ?? null;
  }

  esOpcionActiva(item: CartItem, op: OpcionVenta): boolean {
    return (item.presentacionId ?? null) === op.presentacionId;
  }

  private factorDeItem(item: CartItem): number {
    if (item.factor) return item.factor;
    if (item.presentacionId == null) return 1;
    return (
      this.opcionesLinea(item).find(
        (o) => o.presentacionId === item.presentacionId,
      )?.factor ?? 1
    );
  }

  /** Unidades de inventario del producto que ya van en el carrito. */
  private cantidadBaseEnCarrito(productoId: number, excluirId?: string): number {
    return this.cart
      .filter((c) => c.productoId === productoId && c._id !== excluirId)
      .reduce((s, c) => s + c.cantidad * this.factorDeItem(c), 0);
  }

  /** Unidad de inventario para el stock: "kg", "und"… */
  unidadStock(p: ProductoPOS): string {
    const abreviatura = (p.unidadMedidaAbreviatura ?? '').trim().toLowerCase();
    if (abreviatura) return abreviatura;
    return p.tipoProducto === 'PESABLE'
      ? (p.unidadMedidaNombre ?? '').toLowerCase()
      : 'uds';
  }

  /** Botón de la venta suelta: "kg" para el arroz a granel, "Und" para lo que se cuenta. */
  private nombreVentaSuelta(p: ProductoPOS): string {
    const unidad = this.unidadStock(p);
    return ['und', 'uds', 'un', 'u', 'unidad'].includes(unidad) ? 'Und' : unidad;
  }

  // ── Seriales ─────────────────────────────────────────────
  private sucursalPos: number | null = null;
  serialItem: CartItem | null = null;

  get sucursalSeriales(): number | null {
    return this.esVendedor ? this.vendedorSucursalId : this.sucursalPos;
  }

  get serialPickerVisible(): boolean {
    return this.serialItem !== null;
  }
  set serialPickerVisible(v: boolean) {
    if (!v) this.serialItem = null;
  }

  /** Unidades de inventario de la línea: un serial por cada una. */
  unidadesSerial(item: CartItem): number {
    return Math.round(item.cantidad * this.factorDe(item) * 10000) / 10000;
  }

  private factorDe(item: CartItem): number {
    return item.factor ?? 1;
  }

  abrirSeriales(item: CartItem): void {
    this.serialItem = item;
    this.cdr.markForCheck();
  }

  onSerialesElegidos(e: SerialesElegidos): void {
    if (!this.serialItem) return;
    this.serialItem.serialIds = e.ids;
    this.serialItem.seriales = e.seriales;
    this.saveState();
    this.cdr.markForCheck();
  }

  /** El texto escaneado es un serial disponible: agrega su producto con ese serial. */
  private async agregarPorSerial(codigo: string): Promise<void> {
    try {
      const res = await lastValueFrom(this.serialService.buscar(codigo, this.sucursalSeriales));
      const encontrado = res?.data?.[0];
      if (!encontrado) return;
      const p = this.productos.find((x) => x.id === encontrado.productoId);
      if (!p) {
        this.alertService.showWarn('Serial', `${encontrado.productoNombre} no está a la venta en el POS.`);
        return;
      }
      const yaEsta = this.cart.some((c) => c.serialIds?.includes(encontrado.serialId));
      if (yaEsta) {
        this.alertService.showWarn('Serial', `El serial ${encontrado.serial} ya está en el carrito.`);
        return;
      }
      const unidad = this.opcionesDe(p).find((o) => o.presentacionId == null) ?? null;
      const linea = this.cart.find((c) => c.productoId === p.id && (c.presentacionId ?? null) === null);
      const antes = linea?.cantidad ?? 0;
      // Si la línea ya tenía unidades sin serial, el escaneado ocupa uno de esos huecos.
      if (linea && (linea.serialIds?.length ?? 0) < this.unidadesSerial(linea)) {
        linea.serialIds = [...(linea.serialIds ?? []), encontrado.serialId];
        linea.seriales = [...(linea.seriales ?? []), encontrado.serial];
      } else {
        this.addToCart(p, unidad);
        const nueva = this.cart.find((c) => c.productoId === p.id && (c.presentacionId ?? null) === null);
        if (!nueva || nueva.cantidad === antes) return;   // no se pudo agregar (stock)
        nueva.serialIds = [...(nueva.serialIds ?? []), encontrado.serialId];
        nueva.seriales = [...(nueva.seriales ?? []), encontrado.serial];
      }
      this.searchProduct = '';
      this.filtrar();
      this.focusSearch();
      this.saveState();
      this.cdr.markForCheck();
    } catch {
      /* no era un serial: se queda como búsqueda normal */
    }
  }

  // ── Vencimientos ─────────────────────────────────────────
  private avisadosVencimiento = new Set<number>();

  /** Stock que se puede vender: lo vencido no cuenta si la empresa lo bloquea. */
  stockVendible(p: ProductoPOS): number {
    const vencido = p.bloquearVencidos ? Number(p.stockVencido ?? 0) : 0;
    return (p.stockActual ?? 0) - vencido;
  }

  /** "Vence en 5 d" si el próximo lote entra en la ventana de alerta de la empresa. */
  alertaVencimiento(p: ProductoPOS): string | null {
    const d = p.diasParaVencer;
    if (!p.manejaLotes || d === null || d === undefined) return null;
    if (d > (p.diasAlertaVencimiento ?? 30)) return null;
    return d === 0 ? 'Vence hoy' : `Vence en ${d} d`;
  }

  private avisarVencimiento(p: ProductoPOS): void {
    const alerta = this.alertaVencimiento(p);
    if (!alerta || this.avisadosVencimiento.has(p.id)) return;
    this.avisadosVencimiento.add(p.id);
    this.alertService.showWarn(
      'Producto por vencer',
      `${p.nombre}: el lote que sale ${alerta.toLowerCase().replace(' d', ' días')}.`,
    );
  }

  private mensajeSinStock(p: ProductoPOS): string {
    const vencido = p.bloquearVencidos ? Number(p.stockVencido ?? 0) : 0;
    const base =
      this.stockVendible(p) > 0
        ? `Solo hay ${this.stockLegible(p)} de ${p.nombre}`
        : `${p.nombre} no tiene stock disponible`;
    return vencido > 0
      ? `${base}: ${vencido.toLocaleString('es-CO', { maximumFractionDigits: 4 })} está vencido y no se vende.`
      : `${base}.`;
  }

  /** Stock como se cuenta: "2 Paca + 22 uds" cuando hay una presentación entera. */
  stockLegible(p: ProductoPOS): string {
    const unidad = this.unidadStock(p);
    const stock = p.stockActual ?? 0;
    const grande = [...(p.presentaciones ?? [])]
      .filter(
        (x) =>
          x.factorConversion >= 2 && Number.isInteger(+x.factorConversion),
      )
      .sort((a, b) => b.factorConversion - a.factorConversion)[0];
    const num = (n: number) =>
      n.toLocaleString('es-CO', { maximumFractionDigits: 2 });
    if (!grande || stock < grande.factorConversion)
      return `${num(stock)} ${unidad}`;
    const enteras = Math.floor(stock / grande.factorConversion);
    const resto = round2(stock - enteras * grande.factorConversion);
    return resto > 0
      ? `${enteras} ${grande.nombre} + ${num(resto)} ${unidad}`
      : `${enteras} ${grande.nombre}`;
  }

  /** Precio base (sin IVA) de la forma de venta: el de la presentación o el del producto. */
  private precioBaseDeOpcion(p: ProductoPOS, op: OpcionVenta): number {
    const ivaFactor = 1 + (p.ivaPorcentaje ?? 0) / 100;
    if (op.presentacionId != null) {
      // El precio de la presentación viene con IVA: calcLine se lo vuelve a sumar.
      return ivaFactor > 0 ? round2(op.precio / ivaFactor) : op.precio;
    }
    if (p.ivaIncluido && ivaFactor > 1) {
      return round2((p.precioFinal ?? p.precio ?? 0) / ivaFactor);
    }
    return p.precioFinal ?? p.precio ?? 0;
  }

  /** Cambia Und ↔ Paca en una línea sin borrarla; si ya existe esa forma, las une. */
  cambiarPresentacionLinea(item: CartItem, op: OpcionVenta): void {
    if (this.esOpcionActiva(item, op)) return;
    const p = this.productos.find((x) => x.id === item.productoId);
    if (!p) return;

    const otros = this.cantidadBaseEnCarrito(p.id, item._id);
    if (
      p.tipoProducto !== 'SERVICIO' &&
      !p.permitirStockNegativo &&
      otros + item.cantidad * op.factor > this.stockVendible(p) + 1e-9
    ) {
      this.alertService.showWarn('Stock insuficiente', this.mensajeSinStock(p));
      return;
    }

    const destino = this.cart.find(
      (c) =>
        c._id !== item._id &&
        c.productoId === p.id &&
        (c.presentacionId ?? null) === op.presentacionId,
    );
    if (destino) {
      destino.cantidad += item.cantidad;
      this.cart = this.cart.filter((c) => c._id !== item._id);
      this.calcLine(destino);
    } else {
      const precioCatalogo = this.precioBaseDeOpcion(p, op);
      const precioLista = this.listaSeleccionada
        ? this.precioListaDeOpcion(p.id, op.presentacionId)
        : undefined;
      item.presentacionId = op.presentacionId;
      item.presentacionNombre = op.presentacionId != null ? op.nombre : null;
      item.factor = op.factor;
      item.productoNombre =
        op.presentacionId != null ? `${p.nombre} · ${op.nombre}` : p.nombre;
      item.precioCatalogo = precioCatalogo;
      item.precio = precioLista ?? precioCatalogo;
      item.listaPrecioNombre =
        precioLista != null ? this.listaSeleccionada?.nombre : undefined;
      item.listaPrecioId =
        precioLista != null ? this.listaSeleccionada?.id : undefined;
      item.precioOriginal = undefined;
      item.descuento = 0;
      item.preciosDisponibles = this.buildPreciosDisponibles(
        p.id,
        op.presentacionId,
      );
      this.calcLine(item);
    }
    this.recalcularTotales();
    this.cdr.markForCheck();
  }

  // ── Carrito ───────────────────────────────────────────────
  /**
   * Agrega el producto en la forma de venta indicada (tocar un botón [Paca]);
   * sin forma, la de por defecto (tocar la tarjeta). El stock se valida por
   * producto, en unidades: 1 paca + 3 bolsas consumen 28.
   */
  addToCart(p: ProductoPOS, opcion?: OpcionVenta | null): void {
    const op = opcion ?? this.opcionDefault(p);
    if (!op) {
      this.alertService.showWarn(
        'Sin forma de venta',
        `${p.nombre} no tiene unidad ni presentación a la venta.`,
      );
      return;
    }
    const tieneInventario = p.tipoProducto !== 'SERVICIO';

    if (
      tieneInventario &&
      !p.permitirStockNegativo &&
      this.cantidadBaseEnCarrito(p.id) + op.factor > this.stockVendible(p) + 1e-9
    ) {
      this.alertService.showWarn(
        this.stockVendible(p) > 0 ? 'Stock insuficiente' : 'Sin stock',
        this.mensajeSinStock(p),
      );
      return;
    }
    if (tieneInventario) this.avisarVencimiento(p);

    const existing = this.cart.find(
      (c) =>
        c.productoId === p.id &&
        (c.presentacionId ?? null) === op.presentacionId,
    );
    if (existing) {
      existing.cantidad++;
      this.calcLine(existing);
    } else {
      const precioBase = this.precioBaseDeOpcion(p, op);
      const precioValido = isFinite(precioBase) ? precioBase : 0;

      if (precioValido <= 0) {
        this.alertService.showWarn(
          'Precio inválido',
          `${p.nombre}${op.presentacionId != null ? ' · ' + op.nombre : ''} no tiene un precio válido.`,
        );
        return;
      }

      let precioPOS = precioValido;
      let listaNombre: string | undefined;
      if (this.listaSeleccionada) {
        const listaPrice = this.precioListaDeOpcion(p.id, op.presentacionId);
        if (listaPrice != null) {
          precioPOS = listaPrice;
          listaNombre = this.listaSeleccionada.nombre;
        }
      }
      const nombreEnCarrito =
        op.presentacionId != null
          ? `${p.nombre} · ${op.nombre}`
          : (p.nombre ?? 'Producto sin nombre');
      const ivaOriginal = (p.ivaPorcentaje ?? 0) || 0;
      const item: CartItem = {
        _id: uuid(),
        productoId: p.id,
        presentacionId: op.presentacionId,
        factor: op.factor,
        presentacionNombre: op.presentacionId != null ? op.nombre : null,
        productoNombre: nombreEnCarrito,
        productoSku: p.sku,
        precio: precioPOS,
        precioCatalogo: precioValido,
        listaPrecioNombre: listaNombre,
        listaPrecioId: listaNombre ? this.listaSeleccionada?.id : undefined,
        cantidad: 1,
        descuento: 0,
        descuentoAutomatico: p.descuentoNombre ?? null,
        impuesto: this.exentoIva ? 0 : ivaOriginal,
        impuestoOriginal: this.exentoIva ? ivaOriginal : undefined,
        impuestoValor: 0,
        subtotal: 0,
        esPesable: p.tipoProducto === 'PESABLE',
        manejaSerial: !!p.manejaSerial,
        serialIds: [],
        seriales: [],
        unidadMedida: p.unidadMedidaNombre ?? 'UND',
        showDescuento: false,
        precio2: p.precio2 ?? null,
        precio3: p.precio3 ?? null,
        preciosDisponibles: this.buildPreciosDisponibles(
          p.id,
          op.presentacionId,
        ),
      };
      this.cart = [item, ...this.cart];
      this.calcLine(item);
    }
    this.recalcularTotales();
    this.cdr.markForCheck();
  }

  updateCantidad(item: CartItem, val: number | null): void {
    if (item.esPesable) {
      item.cantidad = val && val > 0 ? val : 0.001;
    } else {
      const parsed = parseFloat((val ?? 1).toString());
      item.cantidad = isNaN(parsed) || parsed <= 0 ? 1 : parsed;
    }
    this.calcLine(item);
    this.cdr.markForCheck();
  }

  updateDescuento(item: CartItem, val: number | null): void {
    item.descuento = val != null && val >= 0 ? val : 0;
    this.calcLine(item);
    this.cdr.markForCheck();
  }

  private calcLine(item: CartItem): void {
    const precio = item.precio ?? 0;
    const cantidad = item.cantidad ?? 0;
    const descuento = item.descuento ?? 0;
    const impuesto = item.impuesto ?? 0;

    if (
      !isFinite(precio) ||
      !isFinite(cantidad) ||
      !isFinite(descuento) ||
      !isFinite(impuesto)
    ) {
      item.impuestoValor = 0;
      item.subtotal = 0;
      this.recalcularTotales();
      return;
    }

    const base = round2(precio * cantidad);
    const desc = round2(descuento);
    const baseNeta = round2(Math.max(0, base - desc));
    const iva = round2(baseNeta * (impuesto / 100));
    item.impuestoValor = iva;
    item.subtotal = round2(baseNeta + iva);
    this.recalcularTotales();
  }

  removeItem(id: string): void {
    this.cart = this.cart.filter((c) => c._id !== id);
    this.recalcularTotales();
    this.cdr.markForCheck();
  }

  clearCart(): void {
    this.cart = [];
    this.clienteId = null;
    this.clienteNombre = null;
    this.listaSeleccionada = null;
    this.preciosPorLista.clear();
    this.exentoIva = false;
    this.recalcularTotales();
    this.cdr.markForCheck();
  }

  // ── Móvil: bottom sheet del carrito ───────────────────────
  openMobileCart(): void {
    this.mobileCartOpen = true;
    this.cdr.markForCheck();
  }

  closeMobileCart(): void {
    this.mobileCartOpen = false;
    this.cdr.markForCheck();
  }

  onSheetTouchStart(e: TouchEvent): void {
    this._sheetStartY = e.touches[0]?.clientY ?? 0;
    this._sheetDeltaY = 0;
  }

  onSheetTouchMove(e: TouchEvent): void {
    this._sheetDeltaY = (e.touches[0]?.clientY ?? 0) - this._sheetStartY;
  }

  onSheetTouchEnd(): void {
    // Deslizar hacia abajo más de 70px cierra el sheet
    if (this._sheetDeltaY > 70) this.closeMobileCart();
    this._sheetDeltaY = 0;
  }

  // ── Pestañas ───────────────────────────────────────────────
  private storageKey(): string {
    return `pos_tabs_${this.turnoActivo?.id ?? 'default'}`;
  }

  private newTab(n: number): CartTab {
    return {
      id: uuid(),
      label: `Orden ${n}`,
      cart: [],
      clienteId: null,
      clienteNombre: null,
      listaSeleccionada: null,
      preciosPorLista: [],
    };
  }

  private initTabs(): void {
    try {
      const saved = localStorage.getItem(this.storageKey());
      if (saved) {
        const parsed: CartTab[] = JSON.parse(saved);
        if (parsed?.length) {
          this.tabs = parsed;
          this.tabActivo = 0;
          this._loadingTab = true;
          this.loadStateFromTab(this.tabs[0]);
          this._loadingTab = false;
          return;
        }
      }
    } catch {
      /* ignore */
    }
    this.tabs = [this.newTab(1)];
    this.tabActivo = 0;
  }

  private saveState(): void {
    if (this._loadingTab || !this.tabs[this.tabActivo]) return;
    this.tabs[this.tabActivo] = {
      ...this.tabs[this.tabActivo],
      cart: [...this.cart],
      clienteId: this.clienteId,
      clienteNombre: this.clienteNombre,
      listaSeleccionada: this.listaSeleccionada,
      preciosPorLista: Array.from(this.preciosPorLista.entries()),
      exentoIva: this.exentoIva,
    };
    try {
      localStorage.setItem(this.storageKey(), JSON.stringify(this.tabs));
    } catch {
      /* ignore */
    }
  }

  private loadStateFromTab(tab: CartTab): void {
    this.cart = tab.cart ? [...tab.cart] : [];
    this.clienteId = tab.clienteId;
    this.clienteNombre = tab.clienteNombre;
    this.listaSeleccionada = tab.listaSeleccionada;
    this.preciosPorLista = new Map(tab.preciosPorLista ?? []);
    this.exentoIva = tab.exentoIva ?? false;
    // Refrescar precios disponibles (pueden venir vacíos desde localStorage)
    if (this.todasListasPrecio.size > 0) {
      for (const item of this.cart) {
        item.preciosDisponibles = this.buildPreciosDisponibles(
          item.productoId,
          item.presentacionId,
        );
      }
    }
    this.recalcularTotales();
  }

  switchTab(i: number): void {
    if (i === this.tabActivo) return;
    this.saveState();
    this.tabActivo = i;
    this._loadingTab = true;
    this.loadStateFromTab(this.tabs[i]);
    this._loadingTab = false;
    this.cdr.markForCheck();
  }

  addTab(): void {
    if (this.tabs.length >= this.MAX_TABS) return;
    this.saveState();
    this.tabs = [...this.tabs, this.newTab(this.tabs.length + 1)];
    this.tabActivo = this.tabs.length - 1;
    this._loadingTab = true;
    this.loadStateFromTab(this.tabs[this.tabActivo]);
    this._loadingTab = false;
    this.cdr.markForCheck();
  }

  closeTab(i: number, event: Event): void {
    event.stopPropagation();
    if (this.tabs.length === 1) {
      this.clearCart();
      return;
    }
    const newTabs = this.tabs.filter((_, idx) => idx !== i);
    newTabs.forEach((t, idx) => (t.label = `Orden ${idx + 1}`));
    this.tabs = newTabs;
    const newIdx = Math.min(i, this.tabs.length - 1);
    this.tabActivo = newIdx;
    this._loadingTab = true;
    this.loadStateFromTab(this.tabs[newIdx]);
    this._loadingTab = false;
    try {
      localStorage.setItem(this.storageKey(), JSON.stringify(this.tabs));
    } catch {
      /* ignore */
    }
    this.cdr.markForCheck();
  }

  private cerrarTabActivo(): void {
    if (this.tabs.length === 1) {
      this.clearCart();
      return;
    }
    this.closeTab(this.tabActivo, new Event(''));
  }

  // ── Totales ───────────────────────────────────────────────
  subtotal = 0;
  descTotal = 0;
  impTotal = 0;
  total = 0;

  private recalcularTotales(): void {
    let sub = 0;
    let desc = 0;
    let imp = 0;

    for (const c of this.cart) {
      const precio = c.precio ?? 0;
      const cantidad = c.cantidad ?? 0;
      const descuento = c.descuento ?? 0;
      const impuestoValor = c.impuestoValor ?? 0;

      if (isFinite(precio) && isFinite(cantidad)) {
        sub += round2(precio * cantidad);
      }
      if (isFinite(descuento)) {
        desc += descuento;
      }
      if (isFinite(impuestoValor)) {
        imp += impuestoValor;
      }
    }

    this.subtotal = round2(sub);
    this.descTotal = round2(desc);
    this.impTotal = round2(imp);
    this.total = round2(this.subtotal - this.descTotal + this.impTotal);
    this.saveState();
  }

  // ── Cliente ───────────────────────────────────────────────
  async buscarCliente(query: string): Promise<void> {
    if (!query || query.length < 2) {
      this.clienteSugerencias = [];
      return;
    }
    try {
      const res: any = await lastValueFrom(
        this.http.get<any>(
          `${environment.apiUrl}terceros/clientes?search=${query}`,
        ),
      );
      this.clienteSugerencias = res?.data ?? [];
      this.cdr.markForCheck();
    } catch {
      this.clienteSugerencias = [];
    }
  }

  selectCliente(c: any): void {
    this.clienteId = c.id;
    this.clienteNombre =
      c.nombreCompleto ?? `${c.nombres ?? ''} ${c.apellidos ?? ''}`.trim();
    this.feClienteDocumento = c.numeroDocumento ?? '';
    this.feClienteEmail = c.emailFe ?? c.email ?? '';
    this.clienteSugerencias = [];
    this.saveState();
    this.cdr.markForCheck();
  }

  clearCliente(): void {
    this.clienteId = null;
    this.clienteNombre = null;
    this.creditoInfo = null;
    this.saveState();
    this.cdr.markForCheck();
  }

  onClienteCreado(tercero: TerceroModel): void {
    this.showNuevoCliente = false;
    this.clienteId = tercero.id;
    this.clienteNombre = tercero.nombres
      ? `${tercero.nombres} ${tercero.apellidos ?? ''}`.trim()
      : (tercero.razonSocial ?? '');
    this.clienteSugerencias = [];
    this.cdr.markForCheck();
  }

  // ── Pago ──────────────────────────────────────────────────
  async irAlPago(): Promise<void> {
    if (!this.cart.length) return;
    const faltaSerial = this.cart.find(
      (c) => c.manejaSerial && (c.serialIds?.length ?? 0) !== this.unidadesSerial(c),
    );
    if (faltaSerial) {
      this.alertService.showWarn(
        'Faltan seriales',
        `${faltaSerial.productoNombre}: elige ${this.unidadesSerial(faltaSerial)} seriales antes de cobrar.`,
      );
      this.abrirSeriales(faltaSerial);
      return;
    }
    this.mobileCartOpen = false;
    this.pagosPrev = [
      {
        metodoPago: 'EFECTIVO',
        monto: this.total,
        referencia: null,
        cuentaBancariaId: null,
      },
    ];
    // Cargar info de crédito si hay cliente seleccionado
    this.creditoInfo = null;
    if (this.clienteId) {
      try {
        const res = await lastValueFrom(
          this.carteraService.validarVenta(this.clienteId, this.total),
        );
        this.creditoInfo = res?.data ?? null;
      } catch {
        /* silencioso */
      }
    }
    this.showPago = true;
    this.cdr.markForCheck();
  }

  async onVentaConfirmada(event: {
    pagos: any[];
    descuentoGeneral: number;
  }): Promise<void> {
    const { pagos, descuentoGeneral } = event;
    const tieneCredito = pagos.some((p) => p.metodoPago === 'CREDITO');

    if (tieneCredito && !this.clienteId) {
      this.alertService.showError(
        'Cliente requerido',
        'Las ventas a crédito requieren un cliente asociado',
      );
      return;
    }
    const clienteIdParaFE = this.clienteId;
    const clienteNombreParaFE = this.feClienteNombre;
    const clienteDocParaFE = this.feClienteDocumento;
    const clienteEmailParaFE = this.feClienteEmail;

    const dto: CreateVentaDto = {
      turnoCajaId: this.turnoActivo?.id ?? null,
      sucursalId: this.esVendedor ? this.vendedorSucursalId : null,
      clienteId: this.clienteId,
      detalles: this.cart.map((c) => ({
        productoId: c.productoId,
        productoPresentacionId: c.presentacionId ?? null,
        cantidad: c.cantidad,
        precioUnitario: c.precio,
        descuentoValor: c.descuento,
        impuestoValor: c.impuestoValor,
        serialIds: c.manejaSerial ? (c.serialIds ?? []) : undefined,
      })),
      pagos,
      descuentoGeneral,
      pagoParcial: tieneCredito,
      saldoPendiente: tieneCredito
        ? round2(this.total - (descuentoGeneral ?? 0))
        : 0,
    };

    try {
      const res = await lastValueFrom(this.ventaService.create(dto));

      if (res?.status === 201) {
        this.ventaActual = {
          ...res.data,
          logoUrl: this.empresaConfig?.logoUrl ?? '',
          razonSocial: this.empresaConfig?.razonSocial ?? '',
          empresaNombre: this.empresaConfig?.razonSocial ?? '',
          empresaNit: this.empresaConfig?.nit ?? '',
          empresaDireccion: this.empresaConfig?.direccion ?? '',
          empresaEmail: this.empresaConfig?.correo ?? '',
          empresaTelefono: this.empresaConfig?.telefono ?? '',
          municipio: this.empresaConfig?.municipio ?? '',
          resolucionNumero: this.empresaConfig?.resolucionNumero ?? null,
          resolucionPrefijo: this.empresaConfig?.resolucionPrefijo ?? null,
          resolucionDesde: this.empresaConfig?.resolucionDesde ?? null,
          resolucionHasta: this.empresaConfig?.resolucionHasta ?? null,
          resolucionFechaDesde:
            this.empresaConfig?.resolucionFechaDesde ?? null,
          resolucionFechaHasta:
            this.empresaConfig?.resolucionFechaHasta ?? null,
        } as unknown as VentaModel;
        this.showPago = false;
        this.cerrarTabActivo();
        const clienteIdRespuesta = (res.data as any)?.clienteId;
        const ventaTieneCliente = (res.data as any)?.clienteId != null;

        this.ventaCompletadaId = (res.data as any).id;
        this.feClienteNombre = clienteNombreParaFE;
        this.feClienteDocumento = clienteDocParaFE;
        this.feClienteEmail = clienteEmailParaFE;
        this.qrDataActual = null;
        this.cufeActual = null;
        this.searchProduct = '';
        this.filtrar();
        this.loadProductos();
        // El numero que ve el cajero es el consecutivo del POS, no el id de la
        // fila: ese es global de la base y arranca en decenas de miles.
        const numeroVenta =
          (res.data as any).numeroVenta ??
          (res.data as any).consecutivo ??
          this.ventaCompletadaId;
        this.alertService.showSuccess(
          'Venta registrada',
          `Venta # ${numeroVenta} completada exitosamente`,
        );

        if (this.empresaFacturaElec && this.ventaCompletadaId) {
          // Preguntar si desea factura electrónica → modal FE primero
          this.mostrarModalFE = true;
        } else {
          // Sin FE: abrir tirilla directo
          this.showTirilla = true;
        }

        this.cdr.markForCheck();
      }
    } catch (err: any) {
      const message =
        err?.error?.message ?? err?.message ?? 'No se pudo registrar la venta.';
      if (
        tieneCredito &&
        (message.includes('crédito') || message.includes('cliente'))
      ) {
        this.alertService.showError(
          'Cliente requerido',
          'Las ventas a crédito requieren un cliente asociado',
        );
      } else {
        this.alertService.showError('Error', message);
      }
    }
  }
  onTirillaCotizacionClose(): void {
    this.showTirillaCotizacion = false;
    this.cotizacionCreada = null;
    this.clearCart();
    this.cdr.markForCheck();
  }

  onTirillaClose(): void {
    this.showTirilla = false;
    this.ventaActual = null;
    this.qrDataActual = null;
    this.cufeActual = null;
    this.focusSearch();
    this.cdr.markForCheck();
  }

  goTurnos(): void {
    this.router.navigate(['/turnos']);
  }

  trackById(_: number, item: CartItem): string {
    return item._id;
  }
  trackByProd(_: number, p: ProductoPOS): string {
    return `${p.id}`;
  }

  formatCOP = (v: number): string =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(v ?? 0);
  onFacturaEmitida(result: FacturaElectronicaResult): void {
    this.mostrarModalFE = false;
    this.qrDataActual = result.qr || null;
    this.cufeActual = result.cufe || null;
    // Abrir tirilla con QR y CUFE embebidos
    this.showTirilla = true;
    this.cdr.markForCheck();
  }

  onFacturaOmitida(): void {
    this.mostrarModalFE = false;
    this.qrDataActual = null;
    this.cufeActual = null;
    // Abrir tirilla sin FE
    this.showTirilla = true;
    this.cdr.markForCheck();
  }

  // ── Movimiento de caja ────────────────────────────────────
  abrirMovimiento(): void {
    this.showMovimiento = true;
    this.cdr.markForCheck();
  }

  onMovimientoRegistrado(mov: MovimientoCajaDto): void {
    this.showMovimiento = false;
    // Construir ComprobanteCajaModel desde el DTO devuelto
    this.comprobanteMovimiento = {
      id: mov.comprobanteId ?? mov.id,
      numeroComprobante:
        mov.numeroComprobante ?? `MOV-${String(mov.id).padStart(6, '0')}`,
      tipo: mov.tipo,
      concepto: mov.concepto ?? '',
      monto: mov.monto,
      metodoPago: mov.metodoPago,
      entregadoA: mov.entregadoA,
      origen: 'MANUAL',
      createdAt: mov.fecha,
    };
    this.showTicketMovimiento = true;
    this.cdr.markForCheck();
  }

  // ── Cotización ────────────────────────────────────────────
  abrirCotizacion(): void {
    this.cotizacionTerceroId = null;
    this.cotizacionTerceroNombre = null;
    this.cotizacionDiasVigencia = 3;
    this.cotizacionObservaciones = null;
    this.cotizacionSugerencias = [];
    this.showCotizacion = true;
    this.cdr.markForCheck();
  }

  async buscarClienteCotizacion(query: string): Promise<void> {
    if (!query || query.length < 2) {
      this.cotizacionSugerencias = [];
      return;
    }
    try {
      const res: any = await lastValueFrom(
        this.http.get<any>(
          `${environment.apiUrl}terceros/clientes?search=${query}`,
        ),
      );
      this.cotizacionSugerencias = res?.data ?? [];
      this.cdr.markForCheck();
    } catch {
      this.cotizacionSugerencias = [];
    }
  }

  selectClienteCotizacion(c: any): void {
    this.cotizacionTerceroId = c.id;
    this.cotizacionTerceroNombre =
      c.nombreCompleto ?? `${c.nombres ?? ''} ${c.apellidos ?? ''}`.trim();
    this.cotizacionSugerencias = [];
    this.cdr.markForCheck();
  }

  clearClienteCotizacion(): void {
    this.cotizacionTerceroId = null;
    this.cotizacionTerceroNombre = null;
    this.cdr.markForCheck();
  }

  async onCotizacionConfirmada(): Promise<void> {
    if (!this.cart.length) return;
    this.savingCotizacion = true;
    try {
      const dto = {
        terceroId: this.cotizacionTerceroId,
        turnoCajaId: this.turnoActivo?.id ?? null,
        observaciones: this.cotizacionObservaciones || null,
        diasVigencia: this.cotizacionDiasVigencia ?? 3,
        detalles: this.cart.map((c) => ({
          productoId: c.productoId,
          descripcion: c.productoNombre,
          cantidad: c.cantidad,
          precioUnitario: c.precio,
          ivaPorcentaje: c.impuesto,
          descuentoValor: c.descuento,
        })),
      };
      const res = await lastValueFrom(this.cotizacionService.create(dto));
      if (res?.status === 201) {
        this.showCotizacion = false;
        this.cotizacionCreada = res.data as CotizacionModel;
        this.showTirillaCotizacion = true;
        this.cdr.markForCheck();
      }
    } catch (err: any) {
      const message =
        err?.error?.message ?? 'No se pudo guardar la cotización.';
      this.alertService.showError('Error', message);
    } finally {
      this.savingCotizacion = false;
      this.cdr.markForCheck();
    }
  }
}
function round2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
