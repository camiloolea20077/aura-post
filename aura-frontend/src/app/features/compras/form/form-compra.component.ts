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
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import {
  CompraLineaUI,
  CompraModel,
  CreateCompraDetalleDto,
  CreateCompraDto,
  ProductoOpcion,
} from '../../../core/models/compra.model';
import { TerceroTableModel } from '../../../core/models/tercero.model';
import { CompraService } from '../../../core/services/compra.service';
import { TerceroService } from '../../../core/services/tercero.service';
import { ProductoService } from '../../../core/services/producto.service';
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
  ],
  providers: [MessageService],
  templateUrl: './form-compra.component.html',
  styleUrls: ['./form-compra.component.scss'],
})
export class FormCompraComponent implements OnInit, OnChanges {
  @Input() displayModal = false;
  @Output() modalClosed = new EventEmitter<void>();
  @Output() compraSaved = new EventEmitter<CompraModel>();

  // ─── Cabecera ─────────────────────────────────────────────
  public proveedorQuery = '';
  public proveedorSeleccionado: TerceroTableModel | null = null;
  public proveedoresSugerencias: TerceroTableModel[] = [];

  public sucursalId: number | null = null;
  public sucursalesOpts: { label: string; value: number }[] = [];

  public numeroCompra = '';
  public fechaCompra: Date = new Date();
  public observaciones = '';

  // ─── Líneas ───────────────────────────────────────────────
  public lineas: CompraLineaUI[] = [];
  public productosOpts: ProductoOpcion[] = [];
  private _productosData: ProductoOpcion[] = [];

  // ─── Estado ───────────────────────────────────────────────
  public isSubmitting = false;

  // ─── Totales ──────────────────────────────────────────────
  get subtotal(): number {
    return this.lineas.reduce((a, l) => a + (l.subtotal || 0), 0);
  }
  get impuestosTotal(): number {
    return this.lineas.reduce((a, l) => a + (l.impuestoValor || 0), 0);
  }
  get total(): number {
    return this.subtotal + this.impuestosTotal;
  }
  get totalUnidades(): number {
    return this.lineas.reduce((a, l) => a + (l.cantidad ?? 0), 0);
  }

  constructor(
    private readonly compraService: CompraService,
    private readonly terceroService: TerceroService,
    private readonly productoService: ProductoService,
    private readonly alertService: AlertService,
    private readonly indexDBService: IndexDBService,
  ) {}

  ngOnInit(): void {
    this.loadDropdowns();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayModal'] && this.displayModal) this.resetForm();
  }

  // ─── Carga datos ──────────────────────────────────────────
  private async loadDropdowns(): Promise<void> {
    try {
      const prods = await lastValueFrom(this.productoService.list());
      if (prods?.data) {
        this._productosData = prods.data.map((p: any) => ({
          label: p.nombre + (p.sku ? ` [${p.sku}]` : ''),
          value: p.id,
          manejaLotes: !!p.manejaLotes,
          sku: p.sku ?? null,
        }));
        this.productosOpts = [...this._productosData];
      }

      // Sucursales desde IndexDB
      const auth = await this.indexDBService.loadDataAuthDB();
      if (auth?.sucursales) {
        this.sucursalesOpts = auth.sucursales.map((s) => ({
          label: s.nombre,
          value: s.id,
        }));
      }
    } catch {
      /* silencioso */
    }
  }

  // ─── Autocomplete proveedor ───────────────────────────────
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

  // ─── Líneas de detalle ────────────────────────────────────
  agregarLinea(): void {
    this.lineas = [
      ...this.lineas,
      {
        _id: uuidv4(),
        productoId: null,
        productoNombre: '',
        manejaLotes: false,
        codigoLote: null,
        fechaVencimiento: null,
        cantidad: null,
        costoUnitario: null,
        impuestoValor: 0,
        subtotal: 0,
      },
    ];
  }

  eliminarLinea(idx: number): void {
    this.lineas = this.lineas.filter((_, i) => i !== idx);
  }

  onProductoChange(idx: number, productoId: number): void {
    const prod = this._productosData.find((p) => p.value === productoId);
    if (!prod) return;
    this.lineas = this.lineas.map((l, i) =>
      i !== idx
        ? l
        : {
            ...l,
            productoId,
            productoNombre: prod.label,
            manejaLotes: prod.manejaLotes,
            codigoLote: null,
            fechaVencimiento: null,
          },
    );
  }

  onCantidadChange(idx: number, val: number | null): void {
    this.lineas = this.lineas.map((l, i) =>
      i !== idx
        ? l
        : {
            ...l,
            cantidad: val,
            subtotal: (val ?? 0) * (l.costoUnitario ?? 0),
          },
    );
  }

  onCostoChange(idx: number, val: number | null): void {
    this.lineas = this.lineas.map((l, i) =>
      i !== idx
        ? l
        : {
            ...l,
            costoUnitario: val,
            subtotal: (l.cantidad ?? 0) * (val ?? 0),
          },
    );
  }

  onImpuestoChange(idx: number, val: number): void {
    this.lineas = this.lineas.map((l, i) =>
      i !== idx ? l : { ...l, impuestoValor: val ?? 0 },
    );
  }

  onCodigoLoteChange(idx: number, val: string): void {
    this.lineas = this.lineas.map((l, i) =>
      i !== idx ? l : { ...l, codigoLote: val?.toUpperCase() || null },
    );
  }

  duplicarLinea(idx: number): void {
    const l = {
      ...this.lineas[idx],
      _id: uuidv4(),
      codigoLote: null,
      fechaVencimiento: null,
    };
    const nuevo = [...this.lineas];
    nuevo.splice(idx + 1, 0, l);
    this.lineas = nuevo;
  }

  trackByLinea(_: number, l: CompraLineaUI): string {
    return l._id;
  }

  // ─── Validación ───────────────────────────────────────────
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
        return `Línea ${n}: el costo unitario debe ser mayor a 0.`;
      if (l.manejaLotes && !l.codigoLote)
        return `Línea ${n}: el producto maneja lotes, ingresa el código de lote.`;
    }
    return null;
  }

  // ─── Guardar ─────────────────────────────────────────────
  async saveCompra(): Promise<void> {
    const err = this.validar();
    if (err) return void this.alertService.showWarn('Compra incompleta', err);

    this.isSubmitting = true;
    try {
      const detalles: CreateCompraDetalleDto[] = this.lineas.map((l) => {
        const fv = l.fechaVencimiento;
        return {
          productoId: l.productoId!,
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
  }

  closeModal(): void {
    this.resetForm();
    this.modalClosed.emit();
  }
}
