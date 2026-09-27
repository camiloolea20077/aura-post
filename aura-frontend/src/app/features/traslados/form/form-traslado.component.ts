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
import { AutoCompleteModule } from 'primeng/autocomplete';
import { lastValueFrom } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { HttpClient } from '@angular/common/http';

import {
  SerialPickerComponent,
  SerialesElegidos,
} from '../../../shared/components/serial-picker/serial-picker.component';
import { AlertService } from '../../../shared/pipes/alert.service';
import { BodegaService } from '../../../core/services/bodega.service';
import { BodegaDto } from '../../../core/models/bodega.model';
import {
  CreateTrasladoDto,
  SucursalSelectorModel,
  TrasladoLineaUI,
} from '../../../core/models/traslado.model';
import { TrasladoService } from '../../../core/services/traslado.service';
import { etiquetaLote } from '../../../shared/utils/lote-etiqueta';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-form-traslado',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputNumberModule,
    DropdownModule,
    DialogModule,
    TextareaModule,
    TooltipModule,
    AutoCompleteModule,
    SerialPickerComponent,
  ],
  templateUrl: './form-traslado.component.html',
  styleUrls: ['./form-traslado.component.scss'],
})
export class FormTrasladoComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  form: FormGroup;
  loading = false;

  sucursales: SucursalSelectorModel[] = [];
  // Con bodegas el destino ya NO excluye la sucursal origen: pasar de la
  // bodega de atras a la vitrina es un traslado dentro de la misma sede.
  bodegasOrigen: BodegaDto[] = [];
  bodegasDestino: BodegaDto[] = [];
  lineas: TrasladoLineaUI[] = [];
  productoSugerencias: any[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: TrasladoService,
    private readonly alert: AlertService,
    private readonly bodegaService: BodegaService,
    private readonly http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      sucursalOrigenId: [null, Validators.required],
      bodegaOrigenId: [null, Validators.required],
      sucursalDestinoId: [null, Validators.required],
      bodegaDestinoId: [null, Validators.required],
      observacion: [null],
    });

    // Cambiar de sucursal cambia las bodegas y anula las lineas: el stock
    // que se estaba trasladando era el de la bodega anterior.
    this.form.get('sucursalOrigenId')!.valueChanges.subscribe((id) => {
      this.form.get('bodegaOrigenId')!.setValue(null);
      this.lineas = [];
      this.cargarBodegas(id, 'origen');
      this.cdr.markForCheck();
    });

    this.form.get('sucursalDestinoId')!.valueChanges.subscribe((id) => {
      this.form.get('bodegaDestinoId')!.setValue(null);
      this.cargarBodegas(id, 'destino');
      this.cdr.markForCheck();
    });

    this.form.get('bodegaOrigenId')!.valueChanges.subscribe(() => {
      this.lineas = [];
      this.cdr.markForCheck();
    });
  }

  ngOnChanges(): void {
    if (this.visible) {
      this.form.reset();
      this.lineas = [];
      this.loadSucursales();
    }
  }

  private async loadSucursales(): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.getSucursales());
      this.sucursales = res?.data ?? [];
    } catch {
      this.sucursales = [];
    }
    this.cdr.markForCheck();
  }

  private async cargarBodegas(
    sucursalId: number | null,
    lado: 'origen' | 'destino',
  ): Promise<void> {
    if (!sucursalId) {
      if (lado === 'origen') this.bodegasOrigen = [];
      else this.bodegasDestino = [];
      return;
    }
    try {
      const res = await lastValueFrom(this.bodegaService.list({ sucursalId }));
      const bodegas = res?.data ?? [];
      if (lado === 'origen') this.bodegasOrigen = bodegas;
      else this.bodegasDestino = bodegas;

      // Con una sola bodega no hay nada que elegir: se preselecciona.
      if (bodegas.length === 1) {
        this.form
          .get(lado === 'origen' ? 'bodegaOrigenId' : 'bodegaDestinoId')!
          .setValue(bodegas[0].id);
      }
    } catch {
      if (lado === 'origen') this.bodegasOrigen = [];
      else this.bodegasDestino = [];
    }
    this.cdr.markForCheck();
  }

  // ── Búsqueda de productos ─────────────────────────────────
  async buscarProductos(event: any): Promise<void> {
    const q = event.query?.trim();
    const origenId = this.form.get('sucursalOrigenId')!.value;
    if (!q || q.length < 2 || !origenId) {
      this.productoSugerencias = [];
      return;
    }

    try {
      // /productos/inventario con la sucursal origen: el endpoint anterior
      // (inventario/disponible) no existía y la búsqueda nunca traía nada.
      const res: any = await lastValueFrom(
        this.http.get<any>(
          `${environment.apiUrl}productos/inventario?search=${encodeURIComponent(q)}&sucursalId=${origenId}`,
        ),
      );
      this.productoSugerencias = (res?.data ?? []).map((p: any) => ({
        ...p,
        label: `${p.nombre}${p.sku ? ' — ' + p.sku : ''}`,
      }));
    } catch {
      this.productoSugerencias = [];
    }
    this.cdr.markForCheck();
  }

  seleccionarProducto(event: any, linea: TrasladoLineaUI): void {
    const p = event.value ?? event;
    linea.productoId = p.id;
    linea.productoNombre = p.nombre;
    linea.productoSku = p.sku ?? null;
    linea.stockOrigen = p.stockActual ?? 0;
    linea.stockOrigenProducto = linea.stockOrigen;
    linea.costoUnitario = p.costo ?? 0;
    linea.manejaLotes = p.manejaLotes ?? false;
    linea.manejaSerial = !!p.manejaSerial;
    linea.serialIds = [];
    linea.loteId = null;
    linea.codigoLote = null;
    linea.lotesDisponibles = [];
    if (p.manejaLotes) this.cargarLotes(linea, p.id);
    this.cdr.markForCheck();
  }

  private async cargarLotes(
    linea: TrasladoLineaUI,
    productoId: number,
  ): Promise<void> {
    const origenId = this.form.get('sucursalOrigenId')!.value;
    try {
      const res: any = await lastValueFrom(
        this.http.get<any>(
          `${environment.apiUrl}lotes/disponibles/${productoId}/${origenId}`,
        ),
      );
      linea.lotesDisponibles = (res?.data ?? []).map((l: any) => ({
        ...l,
        etiqueta: etiquetaLote(l),
      }));
      this.cdr.markForCheck();
    } catch {
      linea.lotesDisponibles = [];
    }
  }

  // ── CRUD líneas ───────────────────────────────────────────
  addLinea(): void {
    if (!this.form.get('sucursalOrigenId')!.value) {
      this.alert.showWarn(
        'Atención',
        'Selecciona la sucursal de origen primero',
      );
      return;
    }
    this.lineas = [
      ...this.lineas,
      {
        _id: uuid(),
        productoId: null,
        productoNombre: '',
        productoSku: null,
        stockOrigen: 0,
        manejaLotes: false,
        loteId: null,
        codigoLote: null,
        lotesDisponibles: [],
        cantidad: 1,
        costoUnitario: 0,
      },
    ];
    this.cdr.markForCheck();
  }

  removeLinea(id: string): void {
    this.lineas = this.lineas.filter((l) => l._id !== id);
    this.cdr.markForCheck();
  }

  updateCantidad(linea: TrasladoLineaUI, val: number | null): void {
    linea.cantidad = Math.max(0.001, val ?? 0.001);
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }

  onLoteChange(linea: TrasladoLineaUI, loteId: number | null): void {
    const lote = linea.lotesDisponibles.find((l) => l.id === loteId);
    linea.loteId = loteId;
    linea.codigoLote = lote?.codigoLote ?? null;
    linea.stockOrigen = lote
      ? lote.stockActual
      : (linea.stockOrigenProducto ?? linea.stockOrigen);
    this.cdr.markForCheck();
  }

  // ── Totales / estado ──────────────────────────────────────
  get totalProductos(): number {
    return this.lineas.length;
  }

  get hayStockInvalido(): boolean {
    return this.lineas.some(
      (l) => l.productoId !== null && l.cantidad > l.stockOrigen,
    );
  }

  /** Lo que no puede repetirse es la BODEGA, no la sucursal. */
  get mismaBodega(): boolean {
    const o = this.form.get('bodegaOrigenId')!.value;
    const d = this.form.get('bodegaDestinoId')!.value;
    return !!(o && d && o === d);
  }

  // ── Validar y guardar ─────────────────────────────────────
  private validar(): string | null {
    if (this.mismaBodega)
      return 'La bodega de origen y la de destino no pueden ser la misma';
    if (!this.lineas.length) return 'Agrega al menos un producto al traslado';
    for (const l of this.lineas) {
      if (!l.productoId) return 'Hay líneas sin producto seleccionado';
      if (l.cantidad <= 0) return 'La cantidad debe ser mayor a 0';
      if (l.manejaSerial) {
        if (!Number.isInteger(l.cantidad))
          return `"${l.productoNombre}" maneja serial: la cantidad tiene que ser entera`;
        if ((l.serialIds ?? []).length !== l.cantidad)
          return `"${l.productoNombre}": elige ${l.cantidad} seriales (van ${(l.serialIds ?? []).length})`;
      }
      if (l.cantidad > l.stockOrigen)
        return `"${l.productoNombre}" supera el stock disponible en origen (${l.stockOrigen})`;
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
    const dto: CreateTrasladoDto = {
      sucursalOrigenId: this.form.value.sucursalOrigenId,
      sucursalDestinoId: this.form.value.sucursalDestinoId,
      bodegaOrigenId: this.form.value.bodegaOrigenId,
      bodegaDestinoId: this.form.value.bodegaDestinoId,
      observacion: this.form.value.observacion || null,
      detalles: this.lineas.map((l) => ({
        productoId: l.productoId!,
        loteId: l.loteId ?? undefined,
        serialIds: l.manejaSerial ? (l.serialIds ?? []) : undefined,
        cantidad: l.cantidad,
        costoUnitario: l.costoUnitario,
      })),
    };

    try {
      await lastValueFrom(this.service.create(dto));
      this.alert.showSuccess(
        'Traslado creado',
        'El stock fue transferido correctamente',
      );
      this.saved.emit();
      this.close();
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudo crear el traslado',
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


  // ── Seriales de la línea ─────────────────────────────────────
  serialLinea: TrasladoLineaUI | null = null;

  get serialPickerVisible(): boolean {
    return this.serialLinea !== null;
  }
  set serialPickerVisible(v: boolean) {
    if (!v) this.serialLinea = null;
  }

  get sucursalSeriales(): number | null {
    return this.form.get('sucursalOrigenId')?.value ?? null;
  }

  unidadesSerial(l: TrasladoLineaUI): number {
    return Math.round((l.cantidad || 0) * 10000) / 10000;
  }

  abrirSeriales(l: TrasladoLineaUI): void {
    this.serialLinea = l;
    this.cdr.markForCheck();
  }

  onSerialesElegidos(e: SerialesElegidos): void {
    if (this.serialLinea) this.serialLinea.serialIds = e.ids;
    this.cdr.markForCheck();
  }

  trackById(_: number, l: TrasladoLineaUI): string {
    return l._id;
  }
  onCostoChange(linea: TrasladoLineaUI, val: number | null): void {
    linea.costoUnitario = val ?? 0;
    this.cdr.markForCheck();
  }
}
