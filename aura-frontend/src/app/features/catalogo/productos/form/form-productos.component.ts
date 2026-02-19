import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { DropdownModule } from 'primeng/dropdown';
import { TabViewModule } from 'primeng/tabview';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import {
  CreateProductoDto,
  ProductoModel,
  TIPO_PRODUCTO_OPTIONS,
  TipoProducto,
  UpdateProductoDto,
} from '../../../../core/models/producto.model';
import { ProductoService } from '../../../../core/services/producto.service';
import { CategoriaService } from '../../../../core/services/categoria.service';
import { MarcaService } from '../../../../core/services/marca.service';
import { UnidadMedidaService } from '../../../../core/services/unidad-medida.service';
import { AlertService } from '../../../../shared/pipes/alert.service';

@Component({
  selector: 'app-form-productos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    InputSwitchModule,
    DropdownModule,
    TabViewModule,
    TextareaModule,
    ButtonModule,
    DividerModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './form-productos.component.html',
  styleUrls: ['./form-productos.component.scss'],
})
export class FormProductosComponent implements OnInit, OnChanges {
  @Input() displayModal = false;
  @Input() productoId: number | null = null;
  @Input() slug = 'create';

  @Output() modalClosed = new EventEmitter<void>();
  @Output() productoSaved = new EventEmitter<ProductoModel>();

  public frmProducto!: FormGroup;
  public isEditMode = false;
  public isSubmitting = false;
  public isLoading = false;
  public activeTab = 0;
  public imageError = false;
  // ─── Opciones de dropdowns ───────────────────────────────
  public tipoOptions = TIPO_PRODUCTO_OPTIONS;
  public categoriasOpts: { label: string; value: number | null }[] = [
    { label: 'Sin categoría', value: null },
  ];
  public marcasOpts: { label: string; value: number | null }[] = [
    { label: 'Sin marca', value: null },
  ];
  public unidadesOpts: { label: string; value: number }[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly productoService: ProductoService,
    private readonly categoriaService: CategoriaService,
    private readonly marcaService: MarcaService,
    private readonly unidadMedidaService: UnidadMedidaService,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadDropdowns();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayModal'] && this.displayModal) {
      this.activeTab = 0;
      this.isEditMode = this.slug === 'edit' && !!this.productoId;
      this.isEditMode ? this.loadData(this.productoId!) : this.resetForm();
    }
  }

  // ─── Form ────────────────────────────────────────────────
  private initForm(): void {
    this.frmProducto = this.fb.group({
      // Tab 1 — Info básica
      nombre: [
        null,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(255),
        ],
      ],
      sku: [null, [Validators.maxLength(50)]],
      codigoBarras: [null, [Validators.maxLength(50)]],
      descripcion: [null, [Validators.maxLength(500)]],
      categoriaId: [null],
      marcaId: [null],
      unidadMedidaBaseId: [null, Validators.required],
      tipoProducto: ['ESTANDAR', Validators.required],
      imagenUrl: [null, [Validators.maxLength(500)]],
      activo: [true, Validators.required],

      // Tab 2 — Precios e impuestos
      precio: [0, [Validators.required, Validators.min(0)]],
      costo: [0, [Validators.required, Validators.min(0)]],
      ivaPorcentaje: [
        0,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      impoconsumo: [0, [Validators.required, Validators.min(0)]],

      // Tab 3 — Control inventario
      manejaInventario: [true, Validators.required],
      manejaLotes: [false, Validators.required],
      manejaSerial: [false, Validators.required],
    });

    // Si no maneja inventario → no puede manejar lotes ni seriales
    this.frmProducto.get('manejaInventario')?.valueChanges.subscribe((val) => {
      if (!val) {
        this.frmProducto.patchValue({
          manejaLotes: false,
          manejaSerial: false,
        });
      }
    });
  }

  private resetForm(): void {
    this.frmProducto?.reset({
      nombre: null,
      sku: null,
      codigoBarras: null,
      descripcion: null,
      categoriaId: null,
      marcaId: null,
      unidadMedidaBaseId: null,
      tipoProducto: 'ESTANDAR',
      imagenUrl: null,
      activo: true,
      precio: 0,
      costo: 0,
      ivaPorcentaje: 0,
      impoconsumo: 0,
      manejaInventario: true,
      manejaLotes: false,
      manejaSerial: false,
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.frmProducto.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  // ─── Cargar dropdowns ────────────────────────────────────
  private async loadDropdowns(): Promise<void> {
    try {
      const [cats, marcas, unidades] = await Promise.all([
        lastValueFrom(this.categoriaService.list()),
        lastValueFrom(this.marcaService.list()),
        lastValueFrom(this.unidadMedidaService.list()),
      ]);

      if (cats?.data)
        this.categoriasOpts = [
          { label: 'Sin categoría', value: null },
          ...cats.data.map((c) => ({ label: c.nombre, value: c.id })),
        ];

      if (marcas?.data)
        this.marcasOpts = [
          { label: 'Sin marca', value: null },
          ...marcas.data.map((m) => ({ label: m.nombre, value: m.id })),
        ];

      if (unidades?.data)
        this.unidadesOpts = unidades.data.map((u) => ({
          label: `${u.nombre} (${u.abreviatura})`,
          value: u.id,
        }));
    } catch {
      // No bloquear el form si los dropdowns fallan
    }
  }

  // ─── Cargar datos en modo edición ────────────────────────
  private async loadData(id: number): Promise<void> {
    this.isLoading = true;
    try {
      const response = await lastValueFrom(this.productoService.getById(id));
      if (response?.status === 200 && response?.data) {
        this.patchForm(response.data);
      }
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar el producto.');
      this.closeModal();
    } finally {
      this.isLoading = false;
    }
  }

  private patchForm(d: ProductoModel): void {
    setTimeout(() => {
      this.frmProducto.patchValue(
        {
          nombre: d.nombre,
          sku: d.sku,
          codigoBarras: d.codigoBarras,
          descripcion: d.descripcion,
          categoriaId: d.categoriaId,
          marcaId: d.marcaId,
          unidadMedidaBaseId: d.unidadMedidaBaseId,
          tipoProducto: d.tipoProducto,
          imagenUrl: d.imagenUrl,
          activo: d.activo,
          precio: d.precio,
          costo: d.costo,
          ivaPorcentaje: d.ivaPorcentaje,
          impoconsumo: d.impoconsumo,
          manejaInventario: d.manejaInventario,
          manejaLotes: d.manejaLotes,
          manejaSerial: d.manejaSerial,
        },
        { emitEvent: false },
      ); // ← esto evita que el valueChanges pise los valores
    }, 0);
  }
  // ─── Helpers para el template ─────────────────────────────
  get margenUtilidad(): number {
    const precio = this.frmProducto.get('precio')?.value ?? 0;
    const costo = this.frmProducto.get('costo')?.value ?? 0;
    if (!costo || !precio) return 0;
    return Math.round(((precio - costo) / precio) * 100 * 10) / 10;
  }

  get manejaInventarioValue(): boolean {
    return this.frmProducto.get('manejaInventario')?.value ?? true;
  }

  // ─── DTO ─────────────────────────────────────────────────
  private buildDto(): CreateProductoDto {
    const v = this.frmProducto.value;
    return {
      nombre: v.nombre?.trim(),
      sku: v.sku?.trim() || null,
      codigoBarras: v.codigoBarras?.trim() || null,
      descripcion: v.descripcion?.trim() || null,
      imagenUrl: v.imagenUrl?.trim() || null,
      categoriaId: v.categoriaId ?? null,
      marcaId: v.marcaId ?? null,
      unidadMedidaBaseId: v.unidadMedidaBaseId,
      tipoProducto: v.tipoProducto as TipoProducto,
      activo: v.activo,
      precio: v.precio ?? 0,
      costo: v.costo ?? 0,
      ivaPorcentaje: v.ivaPorcentaje ?? 0,
      impoconsumo: v.impoconsumo ?? 0,
      manejaInventario: v.manejaInventario,
      manejaLotes: v.manejaLotes,
      manejaSerial: v.manejaSerial,
    };
  }

  // ─── Guardar ─────────────────────────────────────────────
  async saveProducto(): Promise<void> {
    if (this.frmProducto.invalid) {
      this.frmProducto.markAllAsTouched();
      // Ir al primer tab con error
      const tab1Fields = ['nombre', 'unidadMedidaBaseId', 'tipoProducto'];
      const tab2Fields = ['precio', 'costo', 'ivaPorcentaje', 'impoconsumo'];
      if (tab1Fields.some((f) => this.frmProducto.get(f)?.invalid))
        this.activeTab = 0;
      else if (tab2Fields.some((f) => this.frmProducto.get(f)?.invalid))
        this.activeTab = 1;
      this.alertService.showWarn(
        'Formulario incompleto',
        'Revisa los campos marcados en rojo.',
      );
      return;
    }

    this.isSubmitting = true;
    try {
      const dto = this.buildDto();
      const obs = this.isEditMode
        ? this.productoService.update(
            this.productoId!,
            dto as UpdateProductoDto,
          )
        : this.productoService.create(dto);

      const response = await lastValueFrom(obs);

      if (response?.status === 200 || response?.status === 201) {
        this.alertService.showSuccess(
          this.isEditMode ? 'Producto actualizado' : 'Producto creado',
          response.message,
        );
        this.productoSaved.emit(response.data);
        this.closeModal();
      }
    } catch (error: any) {
      this.alertService.showError(
        'Error al guardar',
        error?.message ?? 'No se pudo guardar el producto.',
      );
    } finally {
      this.isSubmitting = false;
    }
  }

  closeModal(): void {
    this.resetForm();
    this.activeTab = 0;
    this.modalClosed.emit();
  }

  // ─── Preview de imagen ────────────────────────────────────
  // ─── Preview de imagen ────────────────────────────────────
  onImageUrlChange(): void {
    this.imageError = false; // reset hasta que cargue
  }

  onImageError(_event: Event): void {
    this.imageError = true;
  }
  onImageLoad(_event: Event): void {
    this.imageError = false;
  }
}
