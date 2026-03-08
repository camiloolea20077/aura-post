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
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { DropdownModule } from 'primeng/dropdown';
import { TabViewModule } from 'primeng/tabview';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import { StorageService } from '../../../../core/services/storage.service';
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
import { ProductoPresentacionService } from '../../../../core/services/producto-presentacion.service';
import {
  CreateProductoPresentacionDto,
  ProductoPresentacionModel,
  UpdateProductoPresentacionDto,
} from '../../../../core/models/producto-presentacion.model';

// ─── Interfaz local para manejar presentaciones en el form ────────
export interface PresentacionFormItem {
  id?: number;
  nombre: string;
  factorConversion: number;
  codigoBarras: string | null;
  precio: number;
  costo: number;
  esDefaultCompra: boolean;
  esDefaultVenta: boolean;
  activo: boolean;
  _editando: boolean;
  _esNueva: boolean;
}

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
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './form-productos.component.html',
  styleUrls: ['./form-productos.component.scss'],
})
export class FormProductosComponent implements OnInit, OnChanges {
  @Input() displayModal = false;
  @Input() productoId: number | null = null;
  @Input() slug = 'create';

  @Output() modalClosed = new EventEmitter<void>();
  @Output() productoSaved = new EventEmitter<ProductoModel>();

  // ─── Presentaciones ──────────────────────────────────────────────
  public presentaciones: PresentacionFormItem[] = [];
  public presentacionEnEdicion: PresentacionFormItem | null = null;
  public frmPresentacion!: FormGroup;
  public savingPresentacion = false;

  // ─── Producto ────────────────────────────────────────────────────
  public frmProducto!: FormGroup;
  public isEditMode = false;
  public isSubmitting = false;
  public isLoading = false;
  public activeTab = 0;
  public imageError = false;
  public uploadingImage = false;

  // ─── Opciones de dropdowns ───────────────────────────────────────
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
    private readonly presentacionService: ProductoPresentacionService,
    private readonly confirmService: ConfirmationService,
    private readonly productoService: ProductoService,
    private readonly categoriaService: CategoriaService,
    private readonly marcaService: MarcaService,
    private readonly unidadMedidaService: UnidadMedidaService,
    private readonly alertService: AlertService,
    private readonly storageService: StorageService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.initFrmPresentacion();
    this.loadDropdowns();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayModal'] && this.displayModal) {
      this.activeTab = 0;
      this.isEditMode = this.slug === 'edit' && !!this.productoId;
      if (this.isEditMode) {
        this.loadData(this.productoId!);
        this.loadPresentaciones(this.productoId!);
      } else {
        this.resetForm();
        this.presentaciones = [];
        this.presentacionEnEdicion = null;
      }
    }
  }

  // ─── Form producto ───────────────────────────────────────────────
  private initForm(): void {
    this.frmProducto = this.fb.group({
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
      // precio y costo se derivan de la presentación de compra (Tab 4)
      precio: [0, [Validators.min(0)]],
      costo: [0, [Validators.min(0)]],
      ivaPorcentaje: [
        0,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      impoconsumo: [0, [Validators.required, Validators.min(0)]],
      manejaInventario: [true, Validators.required],
      manejaLotes: [false, Validators.required],
      manejaSerial: [false, Validators.required],
      visibleEnPos: [true, Validators.required],
    });

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
      // precio y costo se recalculan desde la presentación de compra
      manejaInventario: true,
      manejaLotes: false,
      manejaSerial: false,
      visibleEnPos: true,
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.frmProducto.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  // ─── Form presentaciones ─────────────────────────────────────────
  private initFrmPresentacion(): void {
    this.frmPresentacion = this.fb.group({
      nombre: [null, [Validators.required, Validators.maxLength(100)]],
      factorConversion: [1, [Validators.required, Validators.min(0.0001)]],
      codigoBarras: [null, [Validators.maxLength(50)]],
      precio: [0, [Validators.required, Validators.min(0)]],
      costo: [0, [Validators.required, Validators.min(0)]],
      esDefaultCompra: [true],
      esDefaultVenta: [false],
    });

    // Cuando cambia el factor → recalcular precio y costo sugeridos
    this.frmPresentacion
      .get('factorConversion')
      ?.valueChanges.subscribe((factor) => {
        if (!factor || factor <= 0) return;
        const precioBase = this.frmProducto.get('precio')?.value ?? 0;
        const costoBase = this.frmProducto.get('costo')?.value ?? 0;
        // Solo sugerir si ya hay un precio base calculado (de una presentación de compra previa)
        if (precioBase > 0 || costoBase > 0) {
          this.frmPresentacion.patchValue(
            {
              precio: Math.round(precioBase * factor),
              costo: Math.round(costoBase * factor),
            },
            { emitEvent: false },
          );
        }
      });
  }

  // ─── Cargar presentaciones existentes ────────────────────────────
  private async loadPresentaciones(productoId: number): Promise<void> {
    try {
      const res = await lastValueFrom(
        this.presentacionService.listByProducto(productoId),
      );
      if (res?.data) {
        this.presentaciones = (res.data as ProductoPresentacionModel[]).map(
          (p) => ({
            id: p.id,
            nombre: p.nombre,
            factorConversion: p.factorConversion,
            codigoBarras: p.codigoBarras,
            precio: p.precio,
            costo: p.costo,
            esDefaultCompra: p.esDefaultCompra ?? false,
            esDefaultVenta: p.esDefaultVenta ?? false,
            activo: p.activo,
            _editando: false,
            _esNueva: false,
          }),
        );
      }
    } catch {
      /* no bloquear */
    }
  }

  // ─── Agregar nueva presentación (fila en edición) ─────────────────
  agregarPresentacion(): void {
    this.presentaciones.forEach((p) => (p._editando = false));

    // Precargar precio/costo base si ya están calculados de una presentación de compra previa
    const precioBase = this.frmProducto.get('precio')?.value ?? 0;
    const costoBase = this.frmProducto.get('costo')?.value ?? 0;

    const nueva: PresentacionFormItem = {
      nombre: '',
      factorConversion: 1,
      codigoBarras: null,
      precio: precioBase,
      costo: costoBase,
      esDefaultCompra: false,
      esDefaultVenta: false,
      activo: true,
      _editando: true,
      _esNueva: true,
    };
    this.presentaciones = [...this.presentaciones, nueva];
    this.presentacionEnEdicion = nueva;
    this.frmPresentacion.reset({
      nombre: null,
      factorConversion: 1,
      codigoBarras: null,
      precio: precioBase,
      costo: costoBase,
      esDefaultCompra: false,
      esDefaultVenta: false,
    });
  }

  // ─── Abrir edición de una presentación existente ──────────────────
  editarPresentacion(item: PresentacionFormItem): void {
    this.presentaciones.forEach((p) => (p._editando = false));
    item._editando = true;
    this.presentacionEnEdicion = item;
    this.frmPresentacion.patchValue({
      nombre: item.nombre,
      factorConversion: item.factorConversion,
      codigoBarras: item.codigoBarras,
      precio: item.precio,
      costo: item.costo,
      esDefaultCompra: item.esDefaultCompra,
      esDefaultVenta: item.esDefaultVenta,
    });
  }

  // ─── Cancelar edición ────────────────────────────────────────────
  cancelarEdicion(item: PresentacionFormItem): void {
    if (item._esNueva) {
      this.presentaciones = this.presentaciones.filter((p) => p !== item);
    } else {
      item._editando = false;
    }
    this.presentacionEnEdicion = null;
  }

  // ─── Guardar presentación (en memoria o en API) ───────────────────
  async guardarPresentacion(item: PresentacionFormItem): Promise<void> {
    if (this.frmPresentacion.invalid) {
      this.frmPresentacion.markAllAsTouched();
      return;
    }

    const v = this.frmPresentacion.value;

    // Validar factor duplicado en memoria
    const factorDuplicado = this.presentaciones.some(
      (p) => p !== item && p.factorConversion === v.factorConversion,
    );
    if (factorDuplicado) {
      this.alertService.showWarn(
        'Factor duplicado',
        'Ya existe una presentación con ese factor de conversión.',
      );
      return;
    }

    // Si se marca como default → desmarcar las demás en memoria
    if (v.esDefaultCompra) {
      this.presentaciones.forEach((p) => {
        if (p !== item) p.esDefaultCompra = false;
      });
    }
    if (v.esDefaultVenta) {
      this.presentaciones.forEach((p) => {
        if (p !== item) p.esDefaultVenta = false;
      });
    }

    // Si es la presentación de compra por defecto → derivar precio y costo unitario base
    // precio base = precio presentación ÷ factor  (ej: $4.500 ÷ 100 = $45)
    if (v.esDefaultCompra && v.factorConversion > 0) {
      const precioBase =
        Math.round((v.precio / v.factorConversion) * 10000) / 10000;
      const costoBase =
        Math.round((v.costo / v.factorConversion) * 10000) / 10000;
      this.frmProducto.patchValue(
        { precio: precioBase, costo: costoBase },
        { emitEvent: false },
      );
    }

    // Modo crear — solo guardar en memoria hasta que se guarde el producto
    if (!this.isEditMode || !this.productoId) {
      item.nombre = v.nombre;
      item.factorConversion = v.factorConversion;
      item.codigoBarras = v.codigoBarras || null;
      item.precio = v.precio;
      item.costo = v.costo;
      item.esDefaultCompra = v.esDefaultCompra;
      item.esDefaultVenta = v.esDefaultVenta;
      item._editando = false;
      item._esNueva = true;
      this.presentacionEnEdicion = null;
      return;
    }

    // Modo edición — persistir en API
    this.savingPresentacion = true;
    try {
      let res: any;

      if (item._esNueva) {
        const dto: CreateProductoPresentacionDto = {
          productoId: this.productoId!,
          nombre: v.nombre,
          factorConversion: v.factorConversion,
          codigoBarras: v.codigoBarras || null,
          precio: v.precio,
          costo: v.costo,
          esDefaultCompra: v.esDefaultCompra,
          esDefaultVenta: v.esDefaultVenta,
          activo: true,
        };
        res = await lastValueFrom(this.presentacionService.create(dto));
        if (res?.data) item.id = res.data.id;
      } else {
        const dto: UpdateProductoPresentacionDto = {
          nombre: v.nombre,
          factorConversion: v.factorConversion,
          codigoBarras: v.codigoBarras || null,
          precio: v.precio,
          costo: v.costo,
          esDefaultCompra: v.esDefaultCompra,
          esDefaultVenta: v.esDefaultVenta,
          activo: item.activo,
        };
        res = await lastValueFrom(
          this.presentacionService.update(item.id!, dto),
        );
      }

      // Sincronizar item local con valores guardados
      item.nombre = v.nombre;
      item.factorConversion = v.factorConversion;
      item.codigoBarras = v.codigoBarras || null;
      item.precio = v.precio;
      item.costo = v.costo;
      item.esDefaultCompra = v.esDefaultCompra;
      item.esDefaultVenta = v.esDefaultVenta;
      item._editando = false;
      item._esNueva = false;
      this.presentacionEnEdicion = null;

      this.alertService.showSuccess(
        'Presentación guardada',
        res?.message ?? 'OK',
      );
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.message ?? 'No se pudo guardar la presentación.',
      );
    } finally {
      this.savingPresentacion = false;
    }
  }

  // ─── Confirmar eliminación ────────────────────────────────────────
  confirmarEliminarPresentacion(item: PresentacionFormItem): void {
    if (item._esNueva) {
      this.presentaciones = this.presentaciones.filter((p) => p !== item);
      return;
    }
    this.confirmService.confirm({
      message: `¿Eliminar la presentación "${item.nombre}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.eliminarPresentacion(item),
    });
  }

  private async eliminarPresentacion(
    item: PresentacionFormItem,
  ): Promise<void> {
    try {
      await lastValueFrom(this.presentacionService.delete(item.id!));
      this.presentaciones = this.presentaciones.filter((p) => p !== item);
      this.alertService.showSuccess(
        'Eliminada',
        'Presentación eliminada correctamente.',
      );
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.message ?? 'No se pudo eliminar.',
      );
    }
  }

  // ─── Guardar presentaciones pendientes al crear el producto ───────
  private async guardarPresentacionesPendientes(
    productoId: number,
  ): Promise<void> {
    const pendientes = this.presentaciones.filter((p) => p._esNueva);
    for (const p of pendientes) {
      try {
        await lastValueFrom(
          this.presentacionService.create({
            productoId,
            nombre: p.nombre,
            factorConversion: p.factorConversion,
            codigoBarras: p.codigoBarras,
            precio: p.precio,
            costo: p.costo,
            esDefaultCompra: p.esDefaultCompra,
            esDefaultVenta: p.esDefaultVenta,
            activo: true,
          }),
        );
      } catch {
        /* no bloquear flujo principal */
      }
    }
  }

  // ─── Cargar dropdowns ────────────────────────────────────────────
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
      /* no bloquear el form */
    }
  }

  // ─── Cargar datos en modo edición ────────────────────────────────
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
          visibleEnPos: d.visibleEnPos,
        },
        { emitEvent: false },
      );
    }, 0);
  }

  // ─── Guardar producto ────────────────────────────────────────────
  async saveProducto(): Promise<void> {
    if (this.frmProducto.invalid) {
      this.frmProducto.markAllAsTouched();
      const tab1Fields = ['nombre', 'unidadMedidaBaseId', 'tipoProducto'];
      const tab2Fields = ['ivaPorcentaje', 'impoconsumo'];
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
        // Si es nuevo y hay presentaciones pendientes, guardarlas ahora
        if (
          !this.isEditMode &&
          response?.data?.id &&
          this.presentaciones.length > 0
        ) {
          await this.guardarPresentacionesPendientes(response.data.id);
        }

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
    this.presentaciones = [];
    this.presentacionEnEdicion = null;
    this.modalClosed.emit();
  }

  // ─── Helpers ─────────────────────────────────────────────────────
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
      visibleEnPos: v.visibleEnPos ?? true,
    };
  }

  get margenUtilidad(): number {
    const precio = this.frmProducto.get('precio')?.value ?? 0;
    const costo = this.frmProducto.get('costo')?.value ?? 0;
    if (!costo || !precio) return 0;
    return Math.round(((precio - costo) / precio) * 100 * 10) / 10;
  }

  get manejaInventarioValue(): boolean {
    return this.frmProducto.get('manejaInventario')?.value ?? true;
  }

  get unidadBaseNombre(): string {
    const id = this.frmProducto.get('unidadMedidaBaseId')?.value;
    return (
      this.unidadesOpts.find((u) => u.value === id)?.label ?? 'unidad base'
    );
  }

  // ─── Preview de imagen ────────────────────────────────────────────
  onImageUrlChange(): void {
    this.imageError = false;
  }
  onImageError(_event: Event): void {
    this.imageError = true;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!input.files) return;
    input.value = ''; // reset para permitir seleccionar el mismo archivo

    if (!file) return;

    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    if (!tiposPermitidos.includes(file.type)) {
      this.alertService.showError('Formato inválido', 'Solo se permiten imágenes JPG, PNG, WebP, GIF o AVIF.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.alertService.showError('Archivo muy grande', 'La imagen no puede superar los 10 MB.');
      return;
    }

    this.uploadingImage = true;
    this.imageError = false;
    this.storageService.uploadImagen(file, 'productos').subscribe({
      next: (res) => {
        this.frmProducto.patchValue({ imagenUrl: res.url });
        this.uploadingImage = false;
      },
      error: () => {
        this.alertService.showError('Error', 'No se pudo subir la imagen. Intenta de nuevo.');
        this.uploadingImage = false;
      },
    });
  }

  quitarImagen(): void {
    this.frmProducto.patchValue({ imagenUrl: null });
    this.imageError = false;
  }
  onImageLoad(_event: Event): void {
    this.imageError = false;
  }
}
