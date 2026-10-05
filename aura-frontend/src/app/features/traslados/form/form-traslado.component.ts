import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { BodegaDto } from '../../../core/models/bodega.model';
import { ProductoTableModel } from '../../../core/models/producto.model';
import {
  CreateTrasladoDto,
  SucursalSelectorModel,
  TrasladoLineaUI,
} from '../../../core/models/traslado.model';
import { BodegaService } from '../../../core/services/bodega.service';
import { TrasladoService } from '../../../core/services/traslado.service';
import { ProductoAutocompleteComponent } from '../../../shared/components/producto-autocomplete/producto-autocomplete.component';
import {
  SerialPickerComponent,
  SerialesElegidos,
} from '../../../shared/components/serial-picker/serial-picker.component';
import { AlertService } from '../../../shared/pipes/alert.service';
import { etiquetaLote } from '../../../shared/utils/lote-etiqueta';
import { environment } from '../../../../environments/environment';

/**
 * Nuevo traslado en página plana (antes era un diálogo). El producto se agrega
 * con el buscador de productos (autocomplete + lupa del buscador avanzado) y el
 * stock que se muestra es el de la BODEGA de origen, no la suma de la sede: con
 * varias bodegas en una sede, lo que se puede sacar es lo de esa bodega.
 */
@Component({
  selector: 'app-form-traslado',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    DropdownModule,
    InputNumberModule,
    TextareaModule,
    TooltipModule,
    ProductoAutocompleteComponent,
    SerialPickerComponent,
  ],
  templateUrl: './form-traslado.component.html',
  styleUrls: ['./form-traslado.component.scss'],
})
export class FormTrasladoComponent implements OnInit {
  form: FormGroup;
  loading = false;
  agregando = false;

  sucursales: SucursalSelectorModel[] = [];
  // El destino puede ser la misma sede: de la bodega de atrás a la vitrina.
  bodegasOrigen: BodegaDto[] = [];
  bodegasDestino: BodegaDto[] = [];
  lineas: TrasladoLineaUI[] = [];
  /** Cambia para limpiar el buscador después de agregar. */
  buscadorKey = 0;

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: TrasladoService,
    private readonly alert: AlertService,
    private readonly bodegaService: BodegaService,
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      sucursalOrigenId: [null, Validators.required],
      bodegaOrigenId: [null, Validators.required],
      sucursalDestinoId: [null, Validators.required],
      bodegaDestinoId: [null, Validators.required],
      observacion: [null],
    });

    // Cambiar el origen anula las líneas: el stock era el de la bodega anterior.
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

  ngOnInit(): void {
    this.loadSucursales();
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
      // Con una sola bodega no hay nada que elegir.
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

  get origenListo(): boolean {
    return !!this.form.get('sucursalOrigenId')!.value && !!this.form.get('bodegaOrigenId')!.value;
  }

  // ── Agregar producto ──────────────────────────────────────
  /** Elegido en el buscador: trae su stock en la bodega de origen y agrega la línea. */
  async onProducto(p: ProductoTableModel | null): Promise<void> {
    if (!p) return;
    if (!this.origenListo) {
      this.alert.showWarn('Atención', 'Elija primero la sucursal y la bodega de origen');
      this.limpiarBuscador();
      return;
    }
    const existente = this.lineas.find((l) => l.productoId === p.id && !l.manejaLotes && !l.manejaSerial);
    if (existente) {
      existente.cantidad += 1;
      this.limpiarBuscador();
      return;
    }
    const sucursalId = this.form.get('sucursalOrigenId')!.value;
    const bodegaId = this.form.get('bodegaOrigenId')!.value;
    this.agregando = true;
    this.cdr.markForCheck();
    try {
      const res: any = await lastValueFrom(
        this.http.get<any>(
          `${environment.apiUrl}productos/inventario/id/${p.id}?sucursalId=${sucursalId}&bodegaId=${bodegaId}`,
        ),
      );
      const d = res?.data;
      if (!d || d.manejaInventario === false) {
        this.alert.showWarn('No se traslada', `"${p.nombre}" no maneja inventario.`);
        return;
      }
      const linea: TrasladoLineaUI = {
        _id: uuid(),
        productoId: d.id,
        productoNombre: d.nombre,
        productoSku: d.sku ?? null,
        stockOrigen: Number(d.stockActual ?? 0),
        stockOrigenProducto: Number(d.stockActual ?? 0),
        manejaLotes: !!d.manejaLotes,
        manejaSerial: !!d.manejaSerial,
        serialIds: [],
        loteId: null,
        codigoLote: null,
        lotesDisponibles: [],
        cantidad: 1,
        costoUnitario: Number(d.costo ?? 0),
      };
      this.lineas = [...this.lineas, linea];
      if (linea.manejaLotes) this.cargarLotes(linea, linea.productoId!);
    } catch (err: any) {
      // Los servicios no aparecen en el inventario: el endpoint responde 404.
      this.alert.showWarn(
        'No se traslada',
        err?.status === 404 ? `"${p.nombre}" no maneja inventario.` : 'No se pudo leer el stock del producto.',
      );
    } finally {
      this.agregando = false;
      this.limpiarBuscador();
    }
  }

  private limpiarBuscador(): void {
    this.buscadorKey++;
    this.cdr.markForCheck();
  }

  private async cargarLotes(linea: TrasladoLineaUI, productoId: number): Promise<void> {
    const origenId = this.form.get('sucursalOrigenId')!.value;
    try {
      const res: any = await lastValueFrom(
        this.http.get<any>(`${environment.apiUrl}lotes/disponibles/${productoId}/${origenId}`),
      );
      linea.lotesDisponibles = (res?.data ?? []).map((l: any) => ({
        ...l,
        etiqueta: etiquetaLote(l),
      }));
    } catch {
      linea.lotesDisponibles = [];
    }
    this.cdr.markForCheck();
  }

  // ── Líneas ────────────────────────────────────────────────
  removeLinea(id: string): void {
    this.lineas = this.lineas.filter((l) => l._id !== id);
    this.cdr.markForCheck();
  }

  updateCantidad(linea: TrasladoLineaUI, val: number | null): void {
    linea.cantidad = Math.max(0.001, val ?? 0.001);
    this.cdr.markForCheck();
  }

  onCostoChange(linea: TrasladoLineaUI, val: number | null): void {
    linea.costoUnitario = val ?? 0;
    this.cdr.markForCheck();
  }

  onLoteChange(linea: TrasladoLineaUI, loteId: number | null): void {
    const lote = linea.lotesDisponibles.find((l) => l.id === loteId);
    linea.loteId = loteId;
    linea.codigoLote = lote?.codigoLote ?? null;
    linea.stockOrigen = lote ? lote.stockActual : (linea.stockOrigenProducto ?? linea.stockOrigen);
    this.cdr.markForCheck();
  }

  // ── Totales ───────────────────────────────────────────────
  get totalProductos(): number {
    return this.lineas.length;
  }

  get totalCosto(): number {
    return this.lineas.reduce((s, l) => s + (l.cantidad || 0) * (l.costoUnitario || 0), 0);
  }

  get hayStockInvalido(): boolean {
    return this.lineas.some((l) => l.productoId !== null && l.cantidad > l.stockOrigen);
  }

  /** Lo que no puede repetirse es la BODEGA, no la sucursal. */
  get mismaBodega(): boolean {
    const o = this.form.get('bodegaOrigenId')!.value;
    const d = this.form.get('bodegaDestinoId')!.value;
    return !!(o && d && o === d);
  }

  // ── Guardar ───────────────────────────────────────────────
  private validar(): string | null {
    if (this.mismaBodega) return 'La bodega de origen y la de destino no pueden ser la misma';
    if (!this.lineas.length) return 'Agregue al menos un producto al traslado';
    for (const l of this.lineas) {
      if (l.cantidad <= 0) return 'La cantidad debe ser mayor a 0';
      if (l.manejaSerial) {
        if (!Number.isInteger(l.cantidad))
          return `"${l.productoNombre}" maneja serial: la cantidad tiene que ser entera`;
        if ((l.serialIds ?? []).length !== l.cantidad)
          return `"${l.productoNombre}": elija ${l.cantidad} seriales (van ${(l.serialIds ?? []).length})`;
      }
      if (l.cantidad > l.stockOrigen)
        return `"${l.productoNombre}" supera el stock de la bodega de origen (${l.stockOrigen})`;
    }
    return null;
  }

  async guardar(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.alert.showWarn('Validación', 'Complete el origen y el destino');
      return;
    }
    const error = this.validar();
    if (error) {
      this.alert.showWarn('Validación', error);
      return;
    }
    this.loading = true;
    this.cdr.markForCheck();
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
      this.alert.showSuccess('Traslado creado', 'El stock fue transferido correctamente');
      this.router.navigate(['/traslados']);
    } catch (err: any) {
      this.alert.showError('Error', err?.error?.message ?? 'No se pudo crear el traslado');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  volver(): void {
    this.router.navigate(['/traslados']);
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  // ── Seriales ──────────────────────────────────────────────
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
}
