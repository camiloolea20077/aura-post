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

import { AlertService } from '../../../shared/pipes/alert.service';
import {
  CreateTrasladoDto,
  SucursalSelectorModel,
  TrasladoLineaUI,
} from '../../../core/models/traslado.model';
import { TrasladoService } from '../../../core/services/traslado.service';
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
  sucursalesDestino: SucursalSelectorModel[] = []; // excluye origen
  lineas: TrasladoLineaUI[] = [];
  productoSugerencias: any[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: TrasladoService,
    private readonly alert: AlertService,
    private readonly http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      sucursalOrigenId: [null, Validators.required],
      sucursalDestinoId: [null, Validators.required],
      observacion: [null],
    });

    // Cuando cambia origen → recalcular destinos disponibles y limpiar líneas
    this.form.get('sucursalOrigenId')!.valueChanges.subscribe(() => {
      this.form.get('sucursalDestinoId')!.setValue(null);
      this.lineas = [];
      this.filtrarDestinos();
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
      this.filtrarDestinos();
    } catch {
      this.sucursales = [];
    }
    this.cdr.markForCheck();
  }

  private filtrarDestinos(): void {
    const origenId = this.form.get('sucursalOrigenId')!.value;
    this.sucursalesDestino = origenId
      ? this.sucursales.filter((s) => s.id !== origenId)
      : this.sucursales;
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
      const res: any = await lastValueFrom(
        this.http.get<any>(
          `${environment.apiUrl}inventario/disponible?sucursalId=${origenId}&search=${q}`,
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
    linea.costoUnitario = p.costo ?? 0;
    linea.manejaLotes = p.manejaLotes ?? false;
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
          `${environment.apiUrl}lotes/disponibles?productoId=${productoId}&sucursalId=${origenId}`,
        ),
      );
      linea.lotesDisponibles = res?.data ?? [];
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
    linea.stockOrigen = lote?.stockActual ?? 0;
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

  get mismasSucursales(): boolean {
    const o = this.form.get('sucursalOrigenId')!.value;
    const d = this.form.get('sucursalDestinoId')!.value;
    return !!(o && d && o === d);
  }

  // ── Validar y guardar ─────────────────────────────────────
  private validar(): string | null {
    if (this.mismasSucursales)
      return 'La sucursal de origen y destino no pueden ser la misma';
    if (!this.lineas.length) return 'Agrega al menos un producto al traslado';
    for (const l of this.lineas) {
      if (!l.productoId) return 'Hay líneas sin producto seleccionado';
      if (l.cantidad <= 0) return 'La cantidad debe ser mayor a 0';
      if (l.cantidad > l.stockOrigen)
        return `"${l.productoNombre}" supera el stock disponible en origen (${l.stockOrigen})`;
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
    const dto: CreateTrasladoDto = {
      sucursalOrigenId: this.form.value.sucursalOrigenId,
      sucursalDestinoId: this.form.value.sucursalDestinoId,
      observacion: this.form.value.observacion || null,
      detalles: this.lineas.map((l) => ({
        productoId: l.productoId!,
        loteId: l.loteId ?? undefined,
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

  trackById(_: number, l: TrasladoLineaUI): string {
    return l._id;
  }
  onCostoChange(linea: TrasladoLineaUI, val: number | null): void {
    linea.costoUnitario = val ?? 0;
    this.cdr.markForCheck();
  }
}
