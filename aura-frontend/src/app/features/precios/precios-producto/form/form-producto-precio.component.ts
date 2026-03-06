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
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import {
  CreateProductoPrecioDto,
  ProductoPrecioModel,
  UpdateProductoPrecioDto,
} from '../../../../core/models/producto-precio.model';
import { ProductoPrecioService } from '../../../../core/services/producto-precio.service';
import { ListaPreciosService } from '../../../../core/services/lista-precios.service';
import { ProductoService } from '../../../../core/services/producto.service';
import { ProductoPresentacionService } from '../../../../core/services/producto-presentacion.service';
import { AlertService } from '../../../../shared/pipes/alert.service';

@Component({
  selector: 'app-form-producto-precio',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    InputNumberModule,
    DropdownModule,
    DividerModule,
    ButtonModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './form-producto-precio.component.html',
  styleUrls: ['./form-producto-precio.component.scss'],
})
export class FormProductoPrecioComponent implements OnInit, OnChanges {
  @Input() displayModal = false;
  @Input() precioId: number | null = null;
  @Input() preselListaId: number | null = null;
  @Input() slug = 'create';

  @Output() modalClosed = new EventEmitter<void>();
  @Output() precioSaved = new EventEmitter<ProductoPrecioModel>();

  public frmPrecio!: FormGroup;
  public isEditMode = false;
  public isSubmitting = false;
  public isLoading = false;

  // Dropdowns
  public listasOpts: { label: string; value: number }[] = [];
  public productosOpts: { label: string; value: number }[] = [];
  public presentacionesOpts: {
    label: string;
    value: number;
    costo?: number;
  }[] = [];
  public loadingPresentaciones = false;

  // Costo referencia del producto seleccionado (para calcular margen)
  public costoReferencia: number | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly productoPrecioService: ProductoPrecioService,
    private readonly listaPreciosService: ListaPreciosService,
    private readonly productoService: ProductoService,
    private readonly presentacionService: ProductoPresentacionService,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadDropdowns();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayModal'] && this.displayModal) {
      this.isEditMode = this.slug === 'edit' && !!this.precioId;
      if (this.isEditMode) {
        this.loadData(this.precioId!);
      } else {
        this.resetForm();
        if (this.preselListaId) {
          this.frmPrecio.patchValue({ listaPrecioId: this.preselListaId });
        }
      }
    }
  }

  private initForm(): void {
    this.frmPrecio = this.fb.group({
      listaPrecioId: [null, Validators.required],
      productoId: [null, Validators.required], // helper — no va al DTO
      productoPresentacionId: [null, Validators.required],
      precio: [0, [Validators.required, Validators.min(0.01)]],
      utilidadEsperada: [null],
    });

    // Cuando cambia el producto → cargar sus presentaciones
    this.frmPrecio.get('productoId')?.valueChanges.subscribe((id) => {
      this.frmPrecio.patchValue({ productoPresentacionId: null });
      this.presentacionesOpts = [];
      this.costoReferencia = null;
      if (id) this.loadPresentaciones(id);
    });
  }

  private resetForm(): void {
    this.presentacionesOpts = [];
    this.costoReferencia = null;
    this.frmPrecio?.reset({
      listaPrecioId: null,
      productoId: null,
      productoPresentacionId: null,
      precio: 0,
      utilidadEsperada: null,
    });
  }

  isInvalid(f: string): boolean {
    const c = this.frmPrecio.get(f);
    return !!(c?.invalid && c?.touched);
  }

  // ─── Indicadores calculados ───────────────────────────────
  get margenActual(): number | null {
    const precio = this.frmPrecio.get('precio')?.value ?? 0;
    if (!precio || !this.costoReferencia) return null;
    return (
      Math.round(((precio - this.costoReferencia) / precio) * 100 * 10) / 10
    );
  }

  get margenClass(): string {
    const m = this.margenActual;
    if (m === null) return '';
    if (m >= 20) return 'margen-ok';
    if (m > 0) return 'margen-warn';
    return 'margen-neg';
  }

  // ─── Dropdowns ────────────────────────────────────────────
  private async loadDropdowns(): Promise<void> {
    try {
      const listas = await lastValueFrom(this.listaPreciosService.list());
      if (listas?.data)
        this.listasOpts = listas.data.map((l) => ({
          label: l.nombre,
          value: l.id,
        }));
    } catch {
      /* no bloquear */
    }
  }

  async onFiltroProducto(event: { filter: string }): Promise<void> {
    const q = event.filter?.trim();
    if (!q || q.length < 2) {
      this.productosOpts = [];
      return;
    }
    try {
      const res = await lastValueFrom(this.productoService.search(q));
      this.productosOpts = (res?.data ?? []).map((p: any) => ({
        label: p.nombre + (p.sku ? ` [${p.sku}]` : ''),
        value: p.id,
      }));
    } catch {
      /* no bloquear */
    }
  }

  private async loadPresentaciones(productoId: number): Promise<void> {
    this.loadingPresentaciones = true;
    try {
      const res = await lastValueFrom(
        this.presentacionService.listByProducto(productoId),
      );
      if (res?.data) {
        this.presentacionesOpts = res.data.map((p) => ({
          label: `${p.nombre} (×${p.factorConversion})`,
          value: p.id,
        }));
      }
      // Obtener costo del producto para calcular margen
      const prod = await lastValueFrom(
        this.productoService.getById(productoId),
      );
      this.costoReferencia = prod?.data?.costo ?? null;
    } catch {
      this.presentacionesOpts = [];
    } finally {
      this.loadingPresentaciones = false;
    }
  }

  // ─── Cargar datos edición ─────────────────────────────────
  private async loadData(id: number): Promise<void> {
    this.isLoading = true;
    try {
      const res = await lastValueFrom(this.productoPrecioService.getById(id));
      if (res?.data) {
        const d = res.data;
        // Buscar el producto por nombre para obtener su ID y pre-poblar el dropdown
        const searchRes = await lastValueFrom(
          this.productoService.search(d.productoNombre),
        );
        const match = searchRes?.data?.find(
          (p: any) => p.nombre === d.productoNombre,
        );
        let productoId = 0;
        if (match) {
          productoId = match.id;
          this.productosOpts = [{ label: match.nombre, value: match.id }];
        }
        await this.loadPresentaciones(productoId);
        this.frmPrecio.patchValue({
          listaPrecioId: d.listaPrecioId,
          productoId,
          productoPresentacionId: d.productoPresentacionId,
          precio: d.precio,
          utilidadEsperada: d.utilidadEsperada,
        });
        // Bloquear lista y presentación en edición
        this.frmPrecio.get('listaPrecioId')?.disable();
        this.frmPrecio.get('productoId')?.disable();
        this.frmPrecio.get('productoPresentacionId')?.disable();
      }
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar el precio.');
      this.closeModal();
    } finally {
      this.isLoading = false;
    }
  }

  // ─── Guardar ──────────────────────────────────────────────
  async savePrecio(): Promise<void> {
    if (this.frmPrecio.invalid) {
      this.frmPrecio.markAllAsTouched();
      this.alertService.showWarn(
        'Formulario incompleto',
        'Completa los campos requeridos.',
      );
      return;
    }

    this.isSubmitting = true;
    try {
      const v = this.frmPrecio.getRawValue();
      let obs;

      if (this.isEditMode) {
        const dto: UpdateProductoPrecioDto = {
          precio: v.precio,
          utilidadEsperada: v.utilidadEsperada ?? null,
        };
        obs = this.productoPrecioService.update(this.precioId!, dto);
      } else {
        const dto: CreateProductoPrecioDto = {
          listaPrecioId: v.listaPrecioId,
          productoPresentacionId: v.productoPresentacionId,
          precio: v.precio,
          utilidadEsperada: v.utilidadEsperada ?? null,
        };
        obs = this.productoPrecioService.create(dto);
      }

      const res = await lastValueFrom(obs);
      if (res?.status === 200 || res?.status === 201) {
        this.alertService.showSuccess(
          this.isEditMode ? 'Precio actualizado' : 'Precio creado',
          res.message,
        );
        this.precioSaved.emit(res.data);
        this.closeModal();
      }
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.message ?? 'No se pudo guardar el precio.',
      );
    } finally {
      this.isSubmitting = false;
    }
  }

  closeModal(): void {
    ['listaPrecioId', 'productoId', 'productoPresentacionId'].forEach((f) =>
      this.frmPrecio.get(f)?.enable(),
    );
    this.resetForm();
    this.modalClosed.emit();
  }
}
