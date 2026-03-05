import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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
  ProductoPOS,
  VentaModel,
} from '../../core/models/venta.model';
import { TurnoCajaModel } from '../../core/models/caja.model';
import { VentaService } from '../../core/services/venta.service';
import { CotizacionService } from '../../core/services/cotizacion.service';
import { TurnoCajaService } from '../../core/services/caja.service';
import { TerceroService } from '../../core/services/tercero.service';
import { AlertService } from '../../shared/pipes/alert.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ModalPagoComponent } from './components/modal-pagos/modal-pago.component';
import { ModalMovimientoCajaComponent } from './components/modal-movimiento-caja/modal-movimiento-caja.component';
import { VentaResponse } from '../../core/models/venta-response.model';
import { ModalTirillaComponent } from './components/modal-tirilla/modal-tirilla.component';
import { ModalTirillaCotizacionComponent } from './components/modal-tirilla-cotizacion/modal-tirilla-cotizacion.component';
import { CotizacionModel } from '../../core/models/cotizacion.model';
import { FilterProductsPipe, SEARCH_RESULT_LIMIT } from '../../shared/pipes/filter-products.pipe';
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
  ],
  providers: [MessageService],
  templateUrl: './pos.component.html',
  styleUrls: ['./pos.component.scss'],
})
export class PosComponent implements OnInit, AfterViewInit, OnDestroy {
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

  // ── Catálogo ───────────────────────────────────────────────
  public productos: ProductoPOS[] = [];
  public productosFiltrados: ProductoPOS[] = [];
  public loadingProductos = true;
  public searchProducto = '';
  public categoriaActiva: number | null = null;
  public categorias: { id: number; nombre: string }[] = [];
  private searchSubject$ = new Subject<string>();
  private destroy$ = new Subject<void>();
  tempCantidad: number = 0;
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
  ) {}

  ngOnInit(): void {
    this.checkTurno();
    this.setupSearch();
    this.loadEmpresaConfig();
    this.cargarCotizacionDesdeNavegacion();
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
        productoNombre: d.productoNombre,
        productoSku: d.productoSku ?? null,
        precio: d.precioUnitario,
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
      // recalcular línea
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
      const res = await lastValueFrom(this.turnoCajaService.turnoActivo());
      this.turnoActivo = res?.data ?? null;
      this.turnoError = !this.turnoActivo;
      if (this.turnoActivo) this.loadProductos();
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

  onSearch(): void {
    const query = this.searchProduct.trim();
    const matchBarcode = this.productos.find(
      (p) =>
        (p.codigoBarras && p.codigoBarras === query) ||
        (p.sku && p.sku === query),
    );

    if (matchBarcode) {
      this.addToCart(matchBarcode);
      this.searchProduct = '';
      this.filtrar();
      this.focusSearch();
      this.cdr.markForCheck();
      return;
    }

    this.searchSubject$.next(query);
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
      if (p.tipoProducto !== 'SERVICIO' && p.manejaInventario && p.stockActual <= 0) return false;
      if (!q) return true;
      return (
        p.nombre.toLowerCase().includes(q) ||
        (p.sku != null && p.sku.toLowerCase().includes(q)) ||
        (p.codigoBarras != null && p.codigoBarras.toLowerCase().includes(q))
      );
    });
  }

  setCategoria(id: number | null): void {
    this.categoriaActiva = id;
    this.filtrar();
    this.cdr.markForCheck();
  }

  // ── Carrito ───────────────────────────────────────────────
  addToCart(p: ProductoPOS): void {
    const tieneInventario = p.tipoProducto !== 'SERVICIO';

    if (tieneInventario && p.stockActual <= 0) {
      this.alertService.showWarn(
        'Sin stock',
        `${p.nombre} no tiene stock disponible.`,
      );
      return;
    }

    const existing = this.cart.find((c) => c.productoId === p.id);
    if (existing) {
      if (tieneInventario && existing.cantidad >= p.stockActual) {
        this.alertService.showWarn(
          'Stock insuficiente',
          `Solo hay ${p.stockActual} unidades.`,
        );
        return;
      }
      existing.cantidad++;
      this.calcLine(existing);
    } else {
      const precioBase = p.precioFinal ?? p.precio;
      const item: CartItem = {
        _id: uuid(),
        productoId: p.id,
        productoNombre: p.nombre,
        productoSku: p.sku,
        precio: precioBase,
        cantidad: 1,
        descuento: 0,
        descuentoAutomatico: p.descuentoNombre ?? null,
        impuesto: p.ivaPorcentaje ?? 0,
        impuestoValor: 0,
        subtotal: 0,
        esPesable: p.tipoProducto === 'PESABLE',
        unidadMedida: p.unidadMedidaNombre ?? 'UND',
        showDescuento: false,
      };
      this.calcLine(item);
      this.cart = [item, ...this.cart];
    }
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
    const base = round2(item.precio * item.cantidad);
    const desc = round2(item.descuento);
    const baseNeta = round2(Math.max(0, base - desc));
    const iva = round2(baseNeta * (item.impuesto / 100));
    item.impuestoValor = iva;
    item.subtotal = round2(baseNeta + iva);
  }

  removeItem(id: string): void {
    this.cart = this.cart.filter((c) => c._id !== id);
    this.cdr.markForCheck();
  }

  clearCart(): void {
    this.cart = [];
    this.clienteId = null;
    this.clienteNombre = null;
    this.cdr.markForCheck();
  }

  // ── Getters de totales ────────────────────────────────────
  get subtotal(): number {
    return round2(
      this.cart.reduce((s, c) => s + round2(c.precio * c.cantidad), 0),
    );
  }
  get descTotal(): number {
    return round2(this.cart.reduce((s, c) => s + c.descuento, 0));
  }
  get impTotal(): number {
    return round2(this.cart.reduce((s, c) => s + c.impuestoValor, 0));
  }
  get total(): number {
    return round2(this.subtotal - this.descTotal + this.impTotal);
  }
  get itemCount(): number {
    return this.cart.reduce((s, c) => s + c.cantidad, 0);
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
    // Guardar para el modal FE
    this.feClienteDocumento = c.numeroDocumento ?? '';
    this.feClienteEmail = c.emailFe ?? c.email ?? '';
    this.clienteSugerencias = [];
    this.cdr.markForCheck();
  }

  clearCliente(): void {
    this.clienteId = null;
    this.clienteNombre = null;
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
  irAlPago(): void {
    if (!this.cart.length) return;
    this.pagosPrev = [
      { metodoPago: 'EFECTIVO', monto: this.total, referencia: null },
    ];
    this.showPago = true;
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
      turnoCajaId: this.turnoActivo!.id,
      clienteId: this.clienteId,
      detalles: this.cart.map((c) => ({
        productoId: c.productoId,
        cantidad: c.cantidad,
        precioUnitario: c.precio,
        descuentoValor: c.descuento,
        impuestoValor: c.impuestoValor,
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
        } as unknown as VentaModel;
        this.showPago = false;
        this.clearCart();
        const clienteIdRespuesta = (res.data as any)?.clienteId;
        const ventaTieneCliente = (res.data as any)?.clienteId != null;

        this.ventaCompletadaId = (res.data as any).id;
        this.feClienteNombre = clienteNombreParaFE;
        this.feClienteDocumento = clienteDocParaFE;
        this.feClienteEmail = clienteEmailParaFE;
        this.qrDataActual = null;
        this.cufeActual = null;

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
  trackByProd(_: number, p: ProductoPOS): number {
    return p.id;
  }

  formatCOP = (v: number): string =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
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
  return Math.round(n * 100) / 100;
}
