import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { OrdenCompraService } from '../../../core/services/orden-compra.service';
import { TerceroService } from '../../../core/services/tercero.service';
import { SucursalService } from '../../../core/services/sucursal.service';
import { ProductoService } from '../../../core/services/producto.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  OrdenCompraTableModel,
  OrdenCompraModel,
  CreateOrdenCompraDto,
  RecepcionOrdenDto,
  LineaFormOC,
  ESTADO_OC_CONFIG,
  EstadoOrdenCompra,
} from '../../../core/models/orden-compra.model';
import { ProductoOpcion } from '../../../core/models/compra.model';

import { aFechaLocal } from '../../../shared/utils/fecha.util';
type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined;

@Component({
  selector: 'app-index-ordenes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, InputTextModule, InputNumberModule,
    DropdownModule, CalendarModule, TableModule, TagModule,
    ToastModule, TooltipModule, DialogModule, DividerModule, TextareaModule,
  ],
  providers: [MessageService],
  templateUrl: './index-ordenes.component.html',
  styleUrls: ['./index-ordenes.component.scss'],
})
export class IndexOrdenesComponent implements OnInit {
  ordenes: OrdenCompraTableModel[] = [];
  loading = false;

  // ── Dropdowns cabecera ────────────────────────────────────────
  proveedores: { label: string; value: number }[] = [];
  sucursales: { label: string; value: number }[] = [];

  // ── Búsqueda de productos server-side (igual que form-compra) ─
  productosOpts: ProductoOpcion[] = [];

  // ── Filtro búsqueda tabla ─────────────────────────────────────
  searchText = '';

  // ── Modal Crear / Editar ──────────────────────────────────────
  showFormModal = false;
  editingId: number | null = null;
  saving = false;

  formOC: CreateOrdenCompraDto = this.emptyForm();
  lineas: LineaFormOC[] = [];
  fechaForm: Date | null = null;
  fechaEntregaForm: Date | null = null;

  // ── Modal Detalle (ver + recibir) ─────────────────────────────
  showDetalleModal = false;
  ordenDetalle: OrdenCompraModel | null = null;
  loadingDetalle = false;

  // ── Modal Recepción ───────────────────────────────────────────
  showRecepcionModal = false;
  recepcionForm: RecepcionOrdenDto = { lineas: [] };
  cantidadesRecepcion: number[] = [];
  savingRecepcion = false;

  readonly estadoConfig = ESTADO_OC_CONFIG;

  get ordenesFiltradas(): OrdenCompraTableModel[] {
    if (!this.searchText.trim()) return this.ordenes;
    const q = this.searchText.toLowerCase();
    return this.ordenes.filter(
      (o) =>
        o.numeroOrden.toLowerCase().includes(q) ||
        o.proveedorNombre.toLowerCase().includes(q) ||
        o.sucursalNombre.toLowerCase().includes(q),
    );
  }

  get totalLineas(): number {
    return this.lineas.reduce((s, l) => s + (l.subtotal ?? 0), 0);
  }

  constructor(
    private readonly service: OrdenCompraService,
    private readonly terceroService: TerceroService,
    private readonly sucursalService: SucursalService,
    private readonly productoService: ProductoService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    Promise.all([
      this.cargarProveedores(),
      this.cargarSucursales(),
    ]).then(() => this.cargar());
  }

  async cargar(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.listar());
      this.ordenes = res?.data ?? [];
    } catch {
      this.alertService.showError('Error', 'No se pudieron cargar las órdenes');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  private async cargarProveedores(): Promise<void> {
    const res = await lastValueFrom(this.terceroService.proveedores()).catch(() => null);
    this.proveedores = (res?.data ?? []).map((t) => ({ label: t.nombreCompleto, value: t.id }));
  }

  private async cargarSucursales(): Promise<void> {
    const res = await lastValueFrom(this.sucursalService.getActivas()).catch(() => null);
    this.sucursales = (res?.data ?? []).map((s) => ({ label: s.nombre, value: s.id }));
  }

  // ── Búsqueda server-side de productos (mismo patrón form-compra) ─

  async onFiltroProducto(event: { filter: string }): Promise<void> {
    const q = event.filter?.trim();
    if (!q || q.length < 2) {
      this.productosOpts = [];
      this.cdr.markForCheck();
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
      this.productosOpts = [];
    }
    this.cdr.markForCheck();
  }

  // ── CRUD form ─────────────────────────────────────────────────

  abrirNueva(): void {
    this.editingId = null;
    this.formOC = this.emptyForm();
    this.lineas = [this.emptyLinea()];
    this.productosOpts = [];
    this.fechaForm = new Date();
    this.fechaEntregaForm = null;
    this.showFormModal = true;
    this.cdr.markForCheck();
  }

  async abrirEditar(id: number): Promise<void> {
    this.loadingDetalle = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.obtener(id));
      const orden = res?.data;
      if (!orden) return;
      this.editingId = id;
      this.formOC = {
        proveedorId: orden.proveedorId,
        sucursalId: orden.sucursalId,
        observaciones: orden.observaciones,
        detalles: [],
      };
      this.fechaForm = new Date(orden.fecha);
      this.fechaEntregaForm = orden.fechaEntregaEsperada ? new Date(orden.fechaEntregaEsperada) : null;
      // Pre-populate productosOpts with the existing lines so the dropdown shows names
      this.productosOpts = orden.detalles.map((d) => ({
        label: d.productoNombre,
        value: d.productoId,
        sku: null,
        ivaPorcentaje: 0,
        costo: d.costoUnitario,
        precio: null,
        precio2: null,
        precio3: null,
      }));
      this.lineas = orden.detalles.map((d) => ({
        productoId: d.productoId,
        productoNombre: d.productoNombre,
        cantidad: d.cantidad,
        costoUnitario: d.costoUnitario,
        subtotal: d.subtotalLinea,
      }));
      this.showFormModal = true;
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar la orden');
    } finally {
      this.loadingDetalle = false;
      this.cdr.markForCheck();
    }
  }

  async guardar(): Promise<void> {
    if (!this.formOC.proveedorId || !this.formOC.sucursalId) {
      this.alertService.showError('Validación', 'Selecciona proveedor y sucursal');
      return;
    }
    const lineasValidas = this.lineas.filter(
      (l) => l.productoId && (l.cantidad ?? 0) > 0 && (l.costoUnitario ?? 0) > 0,
    );
    if (!lineasValidas.length) {
      this.alertService.showError('Validación', 'Agrega al menos una línea válida');
      return;
    }

    this.saving = true;
    this.cdr.markForCheck();
    try {
      const dto: CreateOrdenCompraDto = {
        ...this.formOC,
        fecha: this.fechaForm ? this.toISO(this.fechaForm) : undefined,
        fechaEntregaEsperada: this.fechaEntregaForm ? this.toISO(this.fechaEntregaForm) : null,
        detalles: lineasValidas.map((l) => ({
          productoId: l.productoId!,
          cantidad: l.cantidad,
          costoUnitario: l.costoUnitario,
        })),
      };

      if (this.editingId) {
        await lastValueFrom(this.service.actualizar(this.editingId, dto));
        this.alertService.showSuccess('Orden actualizada', '');
      } else {
        await lastValueFrom(this.service.crear(dto));
        this.alertService.showSuccess('Orden creada', '');
      }
      this.showFormModal = false;
      this.cargar();
    } catch (err: any) {
      this.alertService.showError('Error', err?.error?.message ?? 'No se pudo guardar');
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  // ── Detalle ───────────────────────────────────────────────────

  async verDetalle(id: number): Promise<void> {
    this.loadingDetalle = true;
    this.ordenDetalle = null;
    this.showDetalleModal = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.obtener(id));
      this.ordenDetalle = res?.data ?? null;
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar el detalle');
      this.showDetalleModal = false;
    } finally {
      this.loadingDetalle = false;
      this.cdr.markForCheck();
    }
  }

  // ── Transiciones estado ───────────────────────────────────────

  async enviar(id: number): Promise<void> {
    try {
      await lastValueFrom(this.service.enviar(id));
      this.alertService.showSuccess('Orden enviada', 'El proveedor ha sido notificado');
      this.cargar();
    } catch (err: any) {
      this.alertService.showError('Error', err?.error?.message ?? 'No se pudo enviar');
    }
  }

  async confirmar(id: number): Promise<void> {
    try {
      await lastValueFrom(this.service.confirmar(id));
      this.alertService.showSuccess('Orden confirmada', '');
      this.cargar();
    } catch (err: any) {
      this.alertService.showError('Error', err?.error?.message ?? 'No se pudo confirmar');
    }
  }

  async anular(id: number): Promise<void> {
    try {
      await lastValueFrom(this.service.anular(id));
      this.alertService.showSuccess('Orden anulada', '');
      this.cargar();
      if (this.showDetalleModal && this.ordenDetalle?.id === id) this.showDetalleModal = false;
    } catch (err: any) {
      this.alertService.showError('Error', err?.error?.message ?? 'No se pudo anular');
    }
  }

  // ── Recepción ─────────────────────────────────────────────────

  abrirRecepcion(): void {
    if (!this.ordenDetalle) return;
    this.recepcionForm = { numeroFactura: '', observaciones: '', lineas: [] };
    this.cantidadesRecepcion = this.ordenDetalle.detalles.map(() => 0);
    this.showRecepcionModal = true;
    this.cdr.markForCheck();
  }

  async guardarRecepcion(): Promise<void> {
    if (!this.ordenDetalle) return;
    const lineas = this.ordenDetalle.detalles.map((d, i) => ({
      detalleId: d.id,
      cantidadRecibida: this.cantidadesRecepcion[i] ?? 0,
    }));

    this.savingRecepcion = true;
    this.cdr.markForCheck();
    try {
      const dto: RecepcionOrdenDto = { ...this.recepcionForm, lineas };
      const res = await lastValueFrom(this.service.recibir(this.ordenDetalle.id, dto));
      const orden = res?.data;

      // Build pre-fill data from received lines (only those with qty > 0)
      const lineasRecibidas = this.ordenDetalle.detalles
        .map((d, i) => ({ d, cantRecibida: this.cantidadesRecepcion[i] ?? 0 }))
        .filter(({ cantRecibida }) => cantRecibida > 0)
        .map(({ d, cantRecibida }) => ({
          productoId: d.productoId,
          productoNombre: d.productoNombre,
          cantidad: cantRecibida,
          costoUnitario: d.costoUnitario,
        }));

      this.showRecepcionModal = false;
      this.showDetalleModal = false;

      this.router.navigate(['/compras/nueva'], {
        state: {
          fromOC: {
            proveedorId: this.ordenDetalle.proveedorId,
            proveedorNombre: this.ordenDetalle.proveedorNombre,
            sucursalId: this.ordenDetalle.sucursalId,
            observaciones: this.ordenDetalle.observaciones ?? null,
            lineas: lineasRecibidas,
          },
        },
      });
    } catch (err: any) {
      this.alertService.showError('Error', err?.error?.message ?? 'No se pudo registrar la recepción');
    } finally {
      this.savingRecepcion = false;
      this.cdr.markForCheck();
    }
  }

  // ── Líneas del formulario ─────────────────────────────────────

  agregarLinea(): void {
    this.lineas = [...this.lineas, this.emptyLinea()];
    this.cdr.markForCheck();
  }

  eliminarLinea(i: number): void {
    this.lineas = this.lineas.filter((_, idx) => idx !== i);
    this.cdr.markForCheck();
  }

  onProductoChange(i: number, productoId: number): void {
    const prod = this.productosOpts.find((p) => p.value === productoId);
    const lineas = [...this.lineas];
    lineas[i] = {
      ...lineas[i],
      productoId,
      productoNombre: prod?.label ?? '',
      costoUnitario: prod?.costo ?? lineas[i].costoUnitario,
    };
    lineas[i].subtotal = (lineas[i].cantidad ?? 0) * (lineas[i].costoUnitario ?? 0);
    this.lineas = lineas;
    this.cdr.markForCheck();
  }

  onCantidadChange(i: number, val: number | null): void {
    const lineas = [...this.lineas];
    lineas[i] = { ...lineas[i], cantidad: val ?? 0 };
    lineas[i].subtotal = (lineas[i].cantidad) * (lineas[i].costoUnitario ?? 0);
    this.lineas = lineas;
  }

  onCostoChange(i: number, val: number | null): void {
    const lineas = [...this.lineas];
    lineas[i] = { ...lineas[i], costoUnitario: val ?? 0 };
    lineas[i].subtotal = (lineas[i].cantidad ?? 0) * lineas[i].costoUnitario;
    this.lineas = lineas;
  }

  // ── Helpers ───────────────────────────────────────────────────

  estadoSeverity(estado: EstadoOrdenCompra): TagSeverity {
    return this.estadoConfig[estado]?.severity as TagSeverity;
  }

  estadoLabel(estado: EstadoOrdenCompra): string {
    return this.estadoConfig[estado]?.label ?? estado;
  }

  puedeEditar(estado: EstadoOrdenCompra): boolean { return estado === 'BORRADOR'; }
  puedeEnviar(estado: EstadoOrdenCompra): boolean { return estado === 'BORRADOR'; }
  puedeConfirmar(estado: EstadoOrdenCompra): boolean { return estado === 'ENVIADA'; }
  puedeRecibir(estado: EstadoOrdenCompra): boolean {
    return estado === 'CONFIRMADA' || estado === 'RECIBIDA_PARCIAL';
  }
  puedeAnular(estado: EstadoOrdenCompra): boolean {
    return estado !== 'CERRADA' && estado !== 'ANULADA';
  }

  formatCOP(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(v);
  }

  toISO(d: Date): string { return aFechaLocal(d); }

  trackByIdx(_: number, i: number): number { return i; }

  private emptyForm(): CreateOrdenCompraDto {
    return { proveedorId: null!, sucursalId: null!, detalles: [] };
  }

  private emptyLinea(): LineaFormOC {
    return { productoId: null, productoNombre: '', cantidad: 1, costoUnitario: 0, subtotal: 0 };
  }
}
