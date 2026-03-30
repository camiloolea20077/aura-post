import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import {
  AutoCompleteModule,
  AutoCompleteSelectEvent,
} from 'primeng/autocomplete';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import {
  CreatePedidoDetalleDto,
  CreatePedidoDto,
  PedidoItemCarrito,
} from '../../../core/models/pedido-vendedor.model';
import { TerceroTableModel } from '../../../core/models/tercero.model';
import { TerceroService } from '../../../core/services/tercero.service';
import { PedidoVendedorService } from '../../../core/services/pedido-vendedor.service';
import { ProductoService } from '../../../core/services/producto.service';
import { AlertService } from '../../../shared/pipes/alert.service';

@Component({
  selector: 'app-form-pedido-vendedor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    AutoCompleteModule,
    TextareaModule,
    TooltipModule,
    ToastModule,
    DividerModule,
  ],
  providers: [MessageService],
  templateUrl: './form-pedido-vendedor.component.html',
  styleUrls: ['./form-pedido-vendedor.component.scss'],
})
export class FormPedidoVendedorComponent implements OnChanges {
  @Input() displayModal = false;
  @Output() modalClosed = new EventEmitter<void>();
  @Output() pedidoCreado = new EventEmitter<void>();

  // ── Cliente ─────────────────────────────────────────────────
  public clienteQuery = '';
  public clienteSeleccionado: TerceroTableModel | null = null;
  public clienteSugerencias: TerceroTableModel[] = [];

  // ── Búsqueda producto ────────────────────────────────────────
  public productoQuery = '';
  public productoSugerencias: any[] = [];

  // ── Carrito ──────────────────────────────────────────────────
  public carrito: PedidoItemCarrito[] = [];

  // ── Observaciones ────────────────────────────────────────────
  public observaciones = '';

  // ── Estado ───────────────────────────────────────────────────
  public isSubmitting = false;

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly terceroService: TerceroService,
    private readonly productoService: ProductoService,
    private readonly pedidoService: PedidoVendedorService,
    private readonly alertService: AlertService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayModal']?.currentValue === true) {
      this.resetForm();
    }
  }

  private resetForm(): void {
    this.clienteQuery = '';
    this.clienteSeleccionado = null;
    this.clienteSugerencias = [];
    this.productoQuery = '';
    this.productoSugerencias = [];
    this.carrito = [];
    this.observaciones = '';
    this.isSubmitting = false;
  }

  // ── Buscar cliente ──────────────────────────────────────────
  async buscarCliente(event: { query: string }): Promise<void> {
    try {
      const res = await lastValueFrom(
        this.terceroService.clientes(event.query),
      );
      this.clienteSugerencias = res?.data ?? [];
      this.cdr.markForCheck();
    } catch {
      this.clienteSugerencias = [];
    }
  }

  onClienteSeleccionado(event: AutoCompleteSelectEvent): void {
    this.clienteSeleccionado = event.value as TerceroTableModel;
    this.cdr.markForCheck();
  }

  limpiarCliente(): void {
    this.clienteSeleccionado = null;
    this.clienteQuery = '';
    this.cdr.markForCheck();
  }

  // ── Buscar producto ─────────────────────────────────────────
  async buscarProducto(event: { query: string }): Promise<void> {
    const q = event.query?.trim();
    if (!q || q.length < 2) {
      this.productoSugerencias = [];
      return;
    }
    try {
      const res = await lastValueFrom(this.productoService.search(q));
      this.productoSugerencias = res?.data ?? [];
      this.cdr.markForCheck();
    } catch {
      this.productoSugerencias = [];
    }
  }

  onProductoSeleccionado(event: AutoCompleteSelectEvent): void {
    const p = event.value;
    const precio = p.precioFinal ?? p.precio ?? 0;
    const impuestoPct = p.ivaPorcentaje ?? 0;
    const cantidad = 1;
    const baseNeta = precio * cantidad;
    const impuestoValor = Math.round(baseNeta * (impuestoPct / 100));
    const subtotal = baseNeta + impuestoValor;

    const item: PedidoItemCarrito = {
      productoId: p.id,
      productoNombre: p.nombre,
      productoSku: p.sku ?? null,
      cantidad,
      precioUnitario: precio,
      descuentoValor: 0,
      impuesto: impuestoPct,
      impuestoValor,
      subtotal,
    };

    this.carrito = [...this.carrito, item];
    this.productoQuery = '';
    this.productoSugerencias = [];
    this.cdr.markForCheck();
  }

  // ── Carrito ─────────────────────────────────────────────────
  recalcularLinea(item: PedidoItemCarrito): void {
    const baseNeta = item.precioUnitario * item.cantidad - item.descuentoValor;
    const base = Math.max(0, baseNeta);
    item.impuestoValor = Math.round(base * (item.impuesto / 100));
    item.subtotal = base + item.impuestoValor;
    this.carrito = [...this.carrito];
    this.cdr.markForCheck();
  }

  eliminarItem(index: number): void {
    this.carrito = this.carrito.filter((_, i) => i !== index);
    this.cdr.markForCheck();
  }

  // ── Totales ─────────────────────────────────────────────────
  get subtotalTotal(): number {
    return this.carrito.reduce(
      (acc, i) => acc + i.precioUnitario * i.cantidad - i.descuentoValor,
      0,
    );
  }

  get ivaTotal(): number {
    return this.carrito.reduce((acc, i) => acc + i.impuestoValor, 0);
  }

  get totalPagar(): number {
    return this.carrito.reduce((acc, i) => acc + i.subtotal, 0);
  }

  // ── Envío ───────────────────────────────────────────────────
  async crearPedido(): Promise<void> {
    if (this.carrito.length === 0) {
      this.alertService.showWarn(
        'Sin productos',
        'Agrega al menos un producto al pedido.',
      );
      return;
    }

    this.isSubmitting = true;
    this.cdr.markForCheck();

    const detalles: CreatePedidoDetalleDto[] = this.carrito.map((i) => ({
      productoId: i.productoId,
      cantidad: i.cantidad,
      precioUnitario: i.precioUnitario,
      descuentoValor: i.descuentoValor,
      impuestoValor: i.impuestoValor,
    }));

    const dto: CreatePedidoDto = {
      clienteId: this.clienteSeleccionado?.id ?? null,
      observaciones: this.observaciones || null,
      detalles,
    };

    try {
      await lastValueFrom(this.pedidoService.create(dto));
      this.pedidoCreado.emit();
    } catch {
      this.alertService.showError('Error', 'No se pudo crear el pedido.');
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  cerrar(): void {
    this.modalClosed.emit();
  }

  // ── Helpers ─────────────────────────────────────────────────
  formatCOP = (v: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v);

  clienteLabel(c: TerceroTableModel): string {
    return c?.nombreCompleto ?? '';
  }

  productoLabel(p: any): string {
    return p?.nombre ?? '';
  }
}
