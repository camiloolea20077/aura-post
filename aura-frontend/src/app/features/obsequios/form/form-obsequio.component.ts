import {
  Component,
  OnChanges,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { lastValueFrom } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { HttpClient } from '@angular/common/http';

import { AlertService } from '../../../shared/pipes/alert.service';
import { TerceroPickerComponent } from '../../../shared/components/tercero-picker/tercero-picker.component';
import {
  CreateObsequioDto,
  MOTIVOS_OBSEQUIO,
  ObsequioLineaUI,
} from '../../../core/models/obsequio.model';
import { ObsequioService } from '../../../core/services/obsequio.service';
import { environment } from '../../../../environments/environment';
import { IndexDBService } from '../../../core/services/index-db.service';

interface ProductoOpcionObsequio {
  label: string;
  value: number;
  sku: string | null;
  stockActual: number;
  costo: number;
  precio: number;
  ivaPorcentaje: number;
  manejaLotes: boolean;
}

@Component({
  selector: 'app-form-obsequio',
  standalone: true,
  templateUrl: './form-obsequio.component.html',
  styleUrls: ['./form-obsequio.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputNumberModule,
    DropdownModule,
    DialogModule,
    TextareaModule,
    TooltipModule,
    CheckboxModule,
    AutoCompleteModule,
    TerceroPickerComponent,
  ],
})
export class FormObsequioComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  form: FormGroup;
  loading = false;
  motivos = MOTIVOS_OBSEQUIO;

  lineas: ObsequioLineaUI[] = [];
  productosOpts: ProductoOpcionObsequio[] = [];

  terceroId: number | null = null;
  terceroNombre: string | null = null;

  private sucursalId: number | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: ObsequioService,
    private readonly alert: AlertService,
    private readonly http: HttpClient,
    private readonly cdr: ChangeDetectorRef,
    private readonly indexDB: IndexDBService,
  ) {
    this.form = this.fb.group({
      motivo: [null, Validators.required],
      observacion: [null],
      generaIva: [true],
    });
  }

  ngOnChanges(): void {
    if (this.visible) {
      this.form.reset({ motivo: null, observacion: null, generaIva: true });
      this.lineas = [];
      this.productosOpts = [];
      this.terceroId = null;
      this.terceroNombre = null;
      this.indexDB.getSucursalDefault().then((id) => {
        this.sucursalId = id;
      });
    }
  }

  onTerceroSel(t: { id: number; nombre: string } | null): void {
    this.terceroId = t?.id ?? null;
    this.terceroNombre = t?.nombre ?? null;
    this.cdr.markForCheck();
  }

  async onFiltroProducto(event: { filter: string }): Promise<void> {
    const q = event.filter?.trim();
    if (!q || q.length < 2) {
      this.productosOpts = [];
      this.cdr.markForCheck();
      return;
    }
    try {
      const res: any = await lastValueFrom(
        this.http.get<any>(
          `${environment.apiUrl}productos/pos?search=${encodeURIComponent(q)}`,
        ),
      );
      this.productosOpts = (res?.data ?? []).map(
        (p: any): ProductoOpcionObsequio => ({
          label: p.nombre + (p.sku ? ` [${p.sku}]` : ''),
          value: p.id,
          sku: p.sku ?? null,
          stockActual: p.stockActual ?? 0,
          costo: p.costo ?? 0,
          precio: p.precio ?? 0,
          ivaPorcentaje: p.ivaPorcentaje ?? 0,
          manejaLotes: !!p.manejaLotes,
        }),
      );
    } catch {
      this.productosOpts = [];
    }
    this.cdr.markForCheck();
  }

  onProductoChange(linea: ObsequioLineaUI, productoId: number | null): void {
    const p = this.productosOpts.find((o) => o.value === productoId);
    if (!p) return;
    linea.productoId = p.value;
    linea.productoNombre = p.label;
    linea.productoSku = p.sku ?? '';
    linea.stockActual = p.stockActual;
    linea.costoUnitario = p.costo;
    linea.ivaPorcentaje = p.ivaPorcentaje;
    // El precio del producto es al público (IVA incluido): la base gravable
    // del retiro es ese precio sin el impuesto.
    linea.baseComercialUnitaria = p.ivaPorcentaje
      ? p.precio / (1 + p.ivaPorcentaje / 100)
      : p.precio;
    linea.manejaLotes = p.manejaLotes;
    linea.loteId = null;
    linea.codigoLote = null;
    linea.lotesDisponibles = [];
    if (p.manejaLotes) this.cargarLotes(linea, p.value);
    this.calcLinea(linea);
    this.cdr.markForCheck();
  }

  private async cargarLotes(
    linea: ObsequioLineaUI,
    productoId: number,
  ): Promise<void> {
    try {
      const res: any = await lastValueFrom(
        this.http.get<any>(
          `${environment.apiUrl}lotes/disponibles?productoId=${productoId}`,
        ),
      );
      linea.lotesDisponibles = res?.data ?? [];
      this.cdr.markForCheck();
    } catch {
      linea.lotesDisponibles = [];
    }
  }

  addLinea(): void {
    this.lineas = [
      ...this.lineas,
      {
        _id: uuid(),
        productoId: null,
        productoNombre: '',
        productoSku: '',
        stockActual: 0,
        loteId: null,
        codigoLote: null,
        lotesDisponibles: [],
        cantidad: 1,
        costoUnitario: 0,
        baseComercialUnitaria: 0,
        ivaPorcentaje: 0,
        subtotalCosto: 0,
        subtotalIva: 0,
        manejaLotes: false,
      },
    ];
    this.cdr.markForCheck();
  }

  removeLinea(id: string): void {
    this.lineas = this.lineas.filter((l) => l._id !== id);
    this.cdr.markForCheck();
  }

  updateCantidad(linea: ObsequioLineaUI, val: number | null): void {
    linea.cantidad = Math.max(0.001, val ?? 0.001);
    this.calcLinea(linea);
    this.cdr.markForCheck();
  }

  updateBase(linea: ObsequioLineaUI, val: number | null): void {
    linea.baseComercialUnitaria = Math.max(0, val ?? 0);
    this.calcLinea(linea);
    this.cdr.markForCheck();
  }

  onLoteChange(linea: ObsequioLineaUI, loteId: number | null): void {
    const lote = linea.lotesDisponibles.find((l) => l.id === loteId);
    linea.loteId = loteId;
    linea.codigoLote = lote?.codigoLote ?? null;
    linea.stockActual = lote?.stockActual ?? 0;
    this.cdr.markForCheck();
  }

  /** El check de IVA cambia el total: hay que recalcular todas las líneas. */
  onGeneraIvaChange(): void {
    this.lineas.forEach((l) => this.calcLinea(l));
    this.cdr.markForCheck();
  }

  private calcLinea(linea: ObsequioLineaUI): void {
    linea.subtotalCosto = linea.cantidad * linea.costoUnitario;
    linea.subtotalIva = this.form.value.generaIva
      ? (linea.cantidad * linea.baseComercialUnitaria * linea.ivaPorcentaje) /
        100
      : 0;
  }

  get costoTotal(): number {
    return this.lineas.reduce((s, l) => s + l.subtotalCosto, 0);
  }

  get ivaTotal(): number {
    return this.lineas.reduce((s, l) => s + l.subtotalIva, 0);
  }

  get hayStockInvalido(): boolean {
    return this.lineas.some(
      (l) => l.productoId !== null && l.cantidad > l.stockActual,
    );
  }

  private validar(): string | null {
    if (!this.lineas.length) return 'Agrega al menos un producto';
    for (const l of this.lineas) {
      if (!l.productoId) return 'Hay líneas sin producto seleccionado';
      if (l.cantidad <= 0) return 'La cantidad debe ser mayor a 0';
      if (l.cantidad > l.stockActual)
        return `"${l.productoNombre}" supera el stock disponible (${l.stockActual})`;
      if (l.manejaLotes && !l.loteId)
        return `"${l.productoNombre}" requiere seleccionar un lote`;
    }
    return null;
  }

  async guardar(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const error = this.validar();
    if (error) {
      this.alert.showWarn('Validación', error);
      return;
    }

    this.loading = true;
    const dto: CreateObsequioDto = {
      sucursalId: this.sucursalId ?? 0,
      terceroId: this.terceroId ?? null,
      motivo: this.form.value.motivo,
      observacion: this.form.value.observacion || null,
      generaIva: !!this.form.value.generaIva,
      detalles: this.lineas.map((l) => ({
        productoId: l.productoId!,
        loteId: l.loteId ?? undefined,
        cantidad: l.cantidad,
        baseComercialUnitaria: l.baseComercialUnitaria,
      })),
    };

    try {
      await lastValueFrom(this.service.create(dto));
      this.alert.showSuccess(
        'Obsequio registrado',
        'El stock fue descontado y se generó el asiento contable',
      );
      this.saved.emit();
      this.close();
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudo registrar el obsequio',
      );
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  trackById(_: number, l: ObsequioLineaUI): string {
    return l._id;
  }

  formatCOP = (v: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
}
