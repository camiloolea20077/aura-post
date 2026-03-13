import {
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
  CompraLineaUI,
  CompraModel,
  CreateCompraDetalleDto,
  CreateCompraDto,
  PresentacionOpcion,
  ProductoOpcion,
} from '../../../core/models/compra.model';
import { TerceroTableModel } from '../../../core/models/tercero.model';
import { CompraService } from '../../../core/services/compra.service';
import { TerceroService } from '../../../core/services/tercero.service';
import { ProductoService } from '../../../core/services/producto.service';
import { ProductoPresentacionService } from '../../../core/services/producto-presentacion.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { IndexDBService } from '../../../core/services/index-db.service';

@Component({
  selector: 'app-form-compra',
  standalone: true,
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
  @Output() modalClosed = new EventEmitter<void>();
  @Output() compraSaved = new EventEmitter<CompraModel>();

  // ─── Cabecera ─────────────────────────────────────────────────────
  public proveedorQuery = '';
  public proveedorSeleccionado: TerceroTableModel | null = null;
  public proveedoresSugerencias: TerceroTableModel[] = [];
  public sucursalId: number | null = null;
  public sucursalesOpts: { label: string; value: number }[] = [];
  public numeroCompra = '';
  public fechaCompra: Date = new Date();
  public observaciones = '';
  public productosOpts: ProductoOpcion[] = [];
  // ─── Líneas ───────────────────────────────────────────────────────
  public lineas: CompraLineaUI[] = [];
  public productoSelAC: (ProductoOpcion | null)[] = [];
  public productoSugerencias: ProductoOpcion[] = [];

  // ─── Estado ───────────────────────────────────────────────────────
  public isSubmitting = false;

  // ─── Totales ──────────────────────────────────────────────────────
  get subtotal(): number {
    return this.lineas.reduce((a, l) => a + (l.subtotal || 0), 0);
  }
  get impuestosTotal(): number {
    return this.lineas.reduce((a, l) => a + (l.impuestoValor || 0), 0);
  }
  get total(): number {
    return this.subtotal + this.impuestosTotal;
  }
  // Total unidades BASE (cantidad × factor) para el resumen
  get totalUnidades(): number {
    return this.lineas.reduce(
      (a, l) => a + (l.cantidad ?? 0) * (l.factorConversion ?? 1),
      0,
    );
  }

  constructor(
    private readonly compraService: CompraService,
    private readonly terceroService: TerceroService,
    private readonly productoService: ProductoService,
    private readonly presentacionService: ProductoPresentacionService,
    private readonly alertService: AlertService,
    private readonly indexDBService: IndexDBService,
  ) {}

  ngOnInit(): void {
    this.loadDropdowns();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayModal'] && this.displayModal) this.resetForm();
  }

  // ─── Carga datos ──────────────────────────────────────────────────
  private async loadDropdowns(): Promise<void> {
    try {
      const auth = await this.indexDBService.loadDataAuthDB();
      if (auth?.sucursales) {
        this.sucursalesOpts = auth.sucursales.map((s) => ({
          label: s.nombre,
          value: s.id,
        }));
        if (this.sucursalesOpts.length === 1) {
          this.sucursalId = this.sucursalesOpts[0].value;
        }
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
          manejaLotes: !!p.manejaLotes,
          sku: p.sku ?? null,
          ivaPorcentaje: p.ivaPorcentaje ?? 0,
        }),
      );
      console.log('[COMPRAS] Productos buscados:', this.productoSugerencias.length, 'Ejemplo:', this.productoSugerencias[0]);
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
      manejaLotes: false,
      codigoLote: null,
      fechaVencimiento: null,
      presentacionId: null,
      presentacionNombre: '',
      factorConversion: 1,
      presentacionesOpts: [],
      cantidad: null,
      costoUnitario: null,
      ivaPorcentaje: 0,
      impuestoValor: 0,
      subtotal: 0,
    };
    this.lineas = [...this.lineas, nueva];
    this.productoSelAC = [...this.productoSelAC, null];
  }

  eliminarLinea(idx: number): void {
    this.lineas = this.lineas.filter((_, i) => i !== idx);
    this.productoSelAC = this.productoSelAC.filter((_, i) => i !== idx);
  }

  // ─── Selección de producto → cargar presentaciones ───────────────
  async onProductoChange(idx: number, productoId: number): Promise<void> {
    console.log('[COMPRAS] onProductoChange - idx:', idx, 'productoId:', productoId);
    
    // Buscar en las opciones disponibles
    let prod = this.productosOpts.find((p) => p.value === productoId);
    
    // Si no está en opciones, intentar buscar en las sugerencias del autocomplete
    if (!prod) {
      prod = this.productoSugerencias.find((p) => p.value === productoId);
    }
    
    if (!prod) {
      console.log('[COMPRAS] PRODUCTO NO ENCONTRADO, intentando obtener del backend...');
      // Hacer llamada adicional para obtener datos completos del producto
      try {
        const res = await lastValueFrom(this.productoService.getById(productoId));
        const p = res?.data;
        if (p) {
          prod = {
            label: p.nombre + (p.sku ? ` [${p.sku}]` : ''),
            value: p.id,
            manejaLotes: !!p.manejaLotes,
            sku: p.sku ?? null,
            ivaPorcentaje: p.ivaPorcentaje ?? 0,
          };
          // También necesitamos el costo del producto
          console.log('[COMPRAS] Datos completos del producto:', prod, 'costo:', p.costo);
        }
      } catch (e) {
        console.error('[COMPRAS] Error al obtener producto:', e);
      }
    }
    
    if (!prod) {
      console.log('[COMPRAS] PRODUCTO NO ENCONTRADO en ningún lado!');
      return;
    }

    console.log('[COMPRAS] Producto encontrado:', prod);
    console.log('[COMPRAS] IVA %:', prod.ivaPorcentaje);

    const ivaPorcentaje = prod.ivaPorcentaje ?? 0;
    let presentacionesOpts: PresentacionOpcion[] = [];
    let presentacionId: number | null = null;
    let factorConversion = 1;
    let costoUnitario: number | null = null;
    
    // Guardar el costo base del producto para usarlo si no hay presentaciones
    let costoBaseProducto: number | null = null;

    try {
      const res = await lastValueFrom(
        this.presentacionService.listByProducto(productoId),
      );
      const data: any[] = res?.data ?? [];
      if (data.length) {
        presentacionesOpts = data.map(
          (p: any): PresentacionOpcion => ({
            label: `${p.nombre} (×${p.factorConversion})`,
            value: Number(p.id),
            factor: Number(p.factorConversion ?? 1),
            costo: Number(p.costo ?? 0),
            esDefaultCompra: !!p.esDefaultCompra,
          }),
        );

        const defaultCompra = data.find((p: any) => !!p.esDefaultCompra);
        if (defaultCompra) {
          presentacionId = Number(defaultCompra.id);
          factorConversion = Number(defaultCompra.factorConversion ?? 1);
          costoUnitario = Number(defaultCompra.costo ?? 0);
        }
        
        // Guardar el costo de la primera presentación como fallback
        if (!costoUnitario && data[0]) {
          costoBaseProducto = Number(data[0].costo ?? 0);
        }
      } else {
        // No hay presentaciones, intentar obtener el costo del producto directamente
        try {
          const prodRes = await lastValueFrom(this.productoService.getById(productoId));
          if (prodRes?.data) {
            costoBaseProducto = Number(prodRes.data.costo ?? 0);
            console.log('[COMPRAS] Costo del producto (sin presentaciones):', costoBaseProducto);
          }
        } catch {
          // silencioso
        }
      }
    } catch {
      /* sin presentaciones → compra en unidad base */
    }
    
    // Si no hay presentaciones con costo, usar el costo base del producto
    if (costoUnitario === null && costoBaseProducto !== null) {
      costoUnitario = costoBaseProducto;
    }

    const cantidad = this.lineas[idx].cantidad ?? 0;
    const subtotal = (cantidad * (costoUnitario ?? 0));
    const impuestoValor = subtotal * (ivaPorcentaje / 100);
    
    console.log('[COMPRAS] Datos para la línea -> costoUnitario:', costoUnitario, 'iva:', ivaPorcentaje);

    this.lineas = this.lineas.map(
      (l, i): CompraLineaUI =>
        i !== idx
          ? l
          : {
              ...l,
              productoId,
              productoNombre: prod.label,
              manejaLotes: prod.manejaLotes,
              codigoLote: null,
              fechaVencimiento: null,
              presentacionId,
              presentacionNombre:
                presentacionesOpts.find((p) => p.value === presentacionId)
                  ?.label ?? '',
              factorConversion,
              presentacionesOpts,
              costoUnitario,
              ivaPorcentaje,
              impuestoValor: Math.round(impuestoValor * 100) / 100,
              subtotal: Math.round(subtotal * 100) / 100,
            },
    );
  }

  private calcLinea(l: CompraLineaUI): { subtotal: number; impuestoValor: number } {
    const cantidad = l.cantidad ?? 0;
    const costo = l.costoUnitario ?? 0;
    const subtotal = cantidad * costo;
    const impuestoValor = subtotal * ((l.ivaPorcentaje ?? 0) / 100);
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      impuestoValor: Math.round(impuestoValor * 100) / 100,
    };
  }

  // ─── Cambio de presentación ───────────────────────────────────────
  onPresentacionChange(idx: number, presentacionId: number | null): void {
    if (!presentacionId) {
      this.lineas = this.lineas.map(
        (l, i): CompraLineaUI =>
          i !== idx
            ? l
            : {
                ...l,
                presentacionId: null,
                presentacionNombre: '',
                factorConversion: 1,
              },
      );
      return;
    }

    const linea = this.lineas[idx];
    const pres = linea.presentacionesOpts.find(
      (p) => p.value === presentacionId,
    );
    if (!pres) return;

    const calc = this.calcLinea({ ...linea, cantidad: linea.cantidad ?? 0, costoUnitario: pres.costo });

    this.lineas = this.lineas.map(
      (l, i): CompraLineaUI =>
        i !== idx
          ? l
          : {
              ...l,
              presentacionId,
              presentacionNombre: pres.label,
              factorConversion: pres.factor,
              costoUnitario: pres.costo,
              subtotal: calc.subtotal,
              impuestoValor: calc.impuestoValor,
            },
    );
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
              subtotal: calc.subtotal,
              impuestoValor: calc.impuestoValor,
            },
    );
  }

  onImpuestoChange(idx: number, val: number): void {
    const linea = this.lineas[idx];
    const calc = this.calcLinea({ ...linea, ivaPorcentaje: val });

    this.lineas = this.lineas.map(
      (l, i): CompraLineaUI =>
        i !== idx ? l : { ...l, ivaPorcentaje: val, impuestoValor: calc.impuestoValor },
    );
  }

  onCodigoLoteChange(idx: number, val: string): void {
    this.lineas = this.lineas.map(
      (l, i): CompraLineaUI =>
        i !== idx ? l : { ...l, codigoLote: val?.toUpperCase() || null },
    );
  }

  duplicarLinea(idx: number): void {
    const l: CompraLineaUI = {
      ...this.lineas[idx],
      _id: uuidv4(),
      codigoLote: null,
      fechaVencimiento: null,
    };
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

  // ─── Helper para el template ──────────────────────────────────────
  unidadesBaseLinea(l: CompraLineaUI): number {
    return (l.cantidad ?? 0) * (l.factorConversion ?? 1);
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
      if (l.manejaLotes && !l.codigoLote)
        return `Línea ${n}: el producto maneja lotes, ingresa el código de lote.`;
    }
    return null;
  }

  // ─── Guardar ──────────────────────────────────────────────────────
  async saveCompra(): Promise<void> {
    const err = this.validar();
    if (err) return void this.alertService.showWarn('Compra incompleta', err);

    this.isSubmitting = true;
    try {
      const detalles: CreateCompraDetalleDto[] = this.lineas.map((l) => {
        const fv = l.fechaVencimiento;
        return {
          productoId: l.productoId!,
          presentacionId: l.presentacionId ?? null,
          factorConversion: l.factorConversion ?? 1,
          codigoLote: l.manejaLotes ? l.codigoLote || null : null,
          fechaVencimiento: fv
            ? `${fv.getFullYear()}-${String(fv.getMonth() + 1).padStart(2, '0')}-${String(fv.getDate()).padStart(2, '0')}`
            : null,
          cantidad: l.cantidad!,
          costoUnitario: l.costoUnitario!,
          impuestoValor: l.impuestoValor || 0,
        };
      });

      const dto: CreateCompraDto = {
        proveedorId: this.proveedorSeleccionado!.id,
        sucursalId: this.sucursalId!,
        numeroCompra: this.numeroCompra.trim() || null,
        fecha: this.fechaCompra
          ? this.fechaCompra.toISOString().split('.')[0]
          : null,
        observaciones: this.observaciones.trim() || null,
        detalles,
      };

      const res = await lastValueFrom(this.compraService.create(dto));
      if (res?.status === 201) {
        this.alertService.showSuccess(
          'Compra registrada',
          `Compra #${res.data?.id} creada. Stock actualizado.`,
        );
        this.compraSaved.emit(res.data);
        this.closeModal();
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
    this.sucursalId = null;
    this.numeroCompra = '';
    this.fechaCompra = new Date();
    this.observaciones = '';
    this.lineas = [];
    this.productoSelAC = [];
    this.productoSugerencias = [];
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
      this.productosOpts = (res?.data ?? []).map((p: any): ProductoOpcion => ({
        label: p.nombre + (p.sku ? ` [${p.sku}]` : ''),
        value: p.id,
        manejaLotes: !!p.manejaLotes,
        sku: p.sku ?? null,
        ivaPorcentaje: p.ivaPorcentaje ?? 0,
      }));
    } catch {
      /* no bloquear */
    }
  }
}
