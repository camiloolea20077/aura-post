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
import { TurnoCajaService } from '../../core/services/caja.service';
import { TerceroService } from '../../core/services/tercero.service';
import { AlertService } from '../../shared/pipes/alert.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ModalPagoComponent } from './components/modal-pagos/modal-pago.component';
import { VentaResponse } from '../../core/models/venta-response.model';
import { ModalTirillaComponent } from './components/modal-tirilla/modal-tirilla.component';

@Component({
  selector: 'app-pos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    BadgeModule,
    TagModule,
    ToastModule,
    TooltipModule,
    SkeletonModule,
    ModalPagoComponent,
    ModalTirillaComponent,
  ],
  providers: [MessageService],
  templateUrl: './pos.component.html',
  styleUrls: ['./pos.component.scss'],
})
export class PosComponent implements OnInit, AfterViewInit, OnDestroy {
  // ─── NUEVO: referencia al input de búsqueda ───────────────
  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;
  public showTirilla = false;
  public ventaActual: VentaModel | null = null;

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

  // ── Carrito ───────────────────────────────────────────────
  public cart: CartItem[] = [];
  public clienteId: number | null = null;
  public clienteNombre: string | null = null;
  public clienteSugerencias: any[] = [];

  // ── Modal pago ────────────────────────────────────────────
  public showPago = false;
  public pagosPrev: PagoUI[] = [];

  constructor(
    private readonly ventaService: VentaService,
    private readonly turnoCajaService: TurnoCajaService,
    private readonly terceroService: TerceroService,
    private readonly alertService: AlertService,
    private readonly router: Router,
    private readonly http: HttpClient,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.checkTurno();
    this.setupSearch();
  }

  // ─── NUEVO: autofocus al renderizar ──────────────────────
  ngAfterViewInit(): void {
    this.focusSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── NUEVO: helper para enfocar el input ─────────────────
  focusSearch(): void {
    setTimeout(() => this.searchInputRef?.nativeElement?.focus(), 50);
  }

  // ── Turno ──────────────────────────────────────────────────
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

  // ── Catálogo ───────────────────────────────────────────────
  private async loadProductos(): Promise<void> {
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

  // ─── MODIFICADO: onSearch ahora detecta código de barras ─
  onSearch(): void {
    const query = this.searchProducto.trim();

    // La pistola envía el código completo de golpe (sin debounce).
    // Buscamos coincidencia EXACTA por codigoBarras o SKU.
    const matchBarcode = this.productos.find(
      (p) =>
        (p.codigoBarras && p.codigoBarras === query) ||
        (p.sku && p.sku === query),
    );

    if (matchBarcode) {
      this.addToCart(matchBarcode);
      // Limpiar input y devolver foco para el siguiente escaneo
      this.searchProducto = '';
      this.filtrar();
      this.focusSearch();
      this.cdr.markForCheck();
      return;
    }

    // Búsqueda normal por texto con debounce
    this.searchSubject$.next(query);
  }

  // ─── NUEVO: limpiar búsqueda y devolver foco ─────────────
  clearSearch(): void {
    this.searchProducto = '';
    this.filtrar();
    this.focusSearch();
    this.cdr.markForCheck();
  }

  filtrar(): void {
    let list = this.productos;
    if (this.categoriaActiva)
      list = list.filter((p) => p.categoriaId === this.categoriaActiva);
    const q = this.searchProducto.trim().toLowerCase();
    if (q)
      list = list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          (p.sku?.toLowerCase().includes(q) ?? false) ||
          (p.codigoBarras?.toLowerCase().includes(q) ?? false), // ← incluir barcode en filtro texto
      );
    this.productosFiltrados = list;
  }

  setCategoria(id: number | null): void {
    this.categoriaActiva = id;
    this.filtrar();
    this.cdr.markForCheck();
  }

  // ── Carrito ───────────────────────────────────────────────
  addToCart(p: ProductoPOS): void {
    // Servicios no tienen stock — los dejamos pasar sin validación
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
      this.cart = [...this.cart, item];
    }
    this.cdr.markForCheck();
  }

  updateCantidad(item: CartItem, val: number | null): void {
    if (item.esPesable) {
      item.cantidad = val && val > 0 ? val : 0.001;
    } else {
      item.cantidad = Math.max(1, Math.floor(val ?? 1));
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
    const base = item.precio * item.cantidad;
    const baseNeta = Math.max(0, base - item.descuento);
    const iva = baseNeta * (item.impuesto / 100);
    item.impuestoValor = iva;
    item.subtotal = baseNeta + iva;
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
    return this.cart.reduce((s, c) => s + c.precio * c.cantidad, 0);
  }
  get descTotal(): number {
    return this.cart.reduce((s, c) => s + c.descuento, 0);
  }
  get impTotal(): number {
    return this.cart.reduce((s, c) => s + c.impuestoValor, 0);
  }
  get total(): number {
    return this.subtotal - this.descTotal + this.impTotal;
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
    this.clienteSugerencias = [];
    this.cdr.markForCheck();
  }

  clearCliente(): void {
    this.clienteId = null;
    this.clienteNombre = null;
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

  async onVentaConfirmada(pagos: any[]): Promise<void> {
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
    };
    try {
      const res = await lastValueFrom(this.ventaService.create(dto));
      if (res?.status === 201) {
        this.ventaActual = res.data as unknown as VentaModel;
        this.showPago = false;
        this.showTirilla = true;
        this.clearCart();
        this.cdr.markForCheck();
      }
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.message ?? 'No se pudo registrar la venta.',
      );
    }
  }
  onTirillaClose(): void {
    this.showTirilla = false;
    this.ventaActual = null;
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
}
