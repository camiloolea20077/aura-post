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
import { lastValueFrom } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { HttpClient } from '@angular/common/http';

import { AlertService } from '../../../shared/pipes/alert.service';
import {
  CreateMermaDto,
  MermaLineaUI,
  MotivoMermaModel,
} from '../../../core/models/merma.model';
import { MermaService } from '../../../core/services/merma.service';
import { FormMotivoComponent } from '../motivos/form/form-motivo.component';
import { environment } from '../../../../environments/environment';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { IndexDBService } from '../../../core/services/index-db.service';

interface ProductoOpcionMerma {
  label: string;
  value: number;
  sku: string | null;
  stockActual: number;
  costo: number;
  manejaLotes: boolean;
}
@Component({
  selector: 'app-form-merma',
  standalone: true,
  templateUrl: './form-merma.component.html',
  styleUrls: ['./form-merma.component.scss'],
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
    AutoCompleteModule,
    FormMotivoComponent,
  ],
})
export class FormMermaComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  form: FormGroup;
  loading = false;
  motivos: MotivoMermaModel[] = [];
  showMotivoDialog = false;

  lineas: MermaLineaUI[] = [];
  productosOpts: ProductoOpcionMerma[] = [];

  private sucursalId: number | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: MermaService,
    private readonly alert: AlertService,
    private readonly http: HttpClient,
    private readonly cdr: ChangeDetectorRef,
    private readonly indexDB: IndexDBService,
  ) {
    this.form = this.fb.group({
      motivoId: [null, Validators.required],
      observacion: [null],
    });
  }

  ngOnChanges(): void {
    if (this.visible) {
      this.form.reset({ motivoId: null, observacion: null });
      this.lineas = [];
      this.productosOpts = [];
      this.loadMotivos();
      this.indexDB.getSucursalDefault().then((id) => {
        this.sucursalId = id;
        console.log('Sucursal ID cargada:', this.sucursalId);
      });
    }
  }

  private async loadMotivos(): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.getAllMotivos());
      this.motivos = res?.data ?? [];
    } catch {
      this.motivos = [];
    }
    this.cdr.markForCheck();
  }

  async onMotivoCreado(motivo: MotivoMermaModel): Promise<void> {
    await this.loadMotivos();
    if (motivo?.id) {
      this.form.patchValue({ motivoId: motivo.id });
    }
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
        (p: any): ProductoOpcionMerma => ({
          label: p.nombre + (p.sku ? ` [${p.sku}]` : ''),
          value: p.id,
          sku: p.sku ?? null,
          stockActual: p.stockActual ?? 0,
          costo: p.costo ?? 0,
          manejaLotes: !!p.manejaLotes,
        }),
      );
    } catch {
      this.productosOpts = [];
    }
    this.cdr.markForCheck();
  }

  onProductoChange(linea: MermaLineaUI, productoId: number | null): void {
    const p = this.productosOpts.find((o) => o.value === productoId);
    if (!p) return;
    linea.productoId = p.value;
    linea.productoNombre = p.label;
    linea.productoSku = p.sku ?? '';
    linea.stockActual = p.stockActual;
    linea.costoUnitario = p.costo;
    linea.manejaLotes = p.manejaLotes;
    linea.loteId = null;
    linea.codigoLote = null;
    linea.lotesDisponibles = [];
    if (p.manejaLotes) this.cargarLotes(linea, p.value);
    this.calcLinea(linea);
    this.cdr.markForCheck();
  }

  private async cargarLotes(
    linea: MermaLineaUI,
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
        subtotalCosto: 0,
        manejaLotes: false,
      },
    ];
    this.cdr.markForCheck();
  }

  removeLinea(id: string): void {
    this.lineas = this.lineas.filter((l) => l._id !== id);
    this.cdr.markForCheck();
  }

  updateCantidad(linea: MermaLineaUI, val: number | null): void {
    linea.cantidad = Math.max(0.001, val ?? 0.001);
    this.calcLinea(linea);
    this.cdr.markForCheck();
  }

  updateCosto(linea: MermaLineaUI, val: number | null): void {
    linea.costoUnitario = Math.max(0, val ?? 0);
    this.calcLinea(linea);
    this.cdr.markForCheck();
  }

  onLoteChange(linea: MermaLineaUI, loteId: number | null): void {
    const lote = linea.lotesDisponibles.find((l) => l.id === loteId);
    linea.loteId = loteId;
    linea.codigoLote = lote?.codigoLote ?? null;
    linea.stockActual = lote?.stockActual ?? 0;
    this.cdr.markForCheck();
  }

  private calcLinea(linea: MermaLineaUI): void {
    linea.subtotalCosto = linea.cantidad * linea.costoUnitario;
  }

  get costoTotal(): number {
    return this.lineas.reduce((s, l) => s + l.subtotalCosto, 0);
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
    const dto: CreateMermaDto = {
      motivoId: this.form.value.motivoId,
      observacion: this.form.value.observacion || null,
      sucursalId: this.sucursalId ?? 0,
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
        'Merma registrada',
        'El stock fue actualizado correctamente',
      );
      this.saved.emit();
      this.close();
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudo registrar la merma',
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

  trackById(_: number, l: MermaLineaUI): string {
    return l._id;
  }

  formatCOP = (v: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
}
