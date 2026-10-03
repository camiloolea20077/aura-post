import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
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
  CambioUnidadPreviewModel,
  CategoriaContableProductoModel,
  CLASIFICACION_OPTIONS,
  ClasificacionItem,
  ClasificacionOpcion,
  clasificacionOpcion,
  CreateProductoDto,
  tiposCategoriaDe,
  ProductoModel,
  TIPO_PRODUCTO_OPTIONS,
  TipoProducto,
  USO_PRODUCTO_OPTIONS,
  UpdateProductoDto,
  UsoProducto,
} from '../../../../core/models/producto.model';
import { ProductoService } from '../../../../core/services/producto.service';
import { CategoriaService } from '../../../../core/services/categoria.service';
import { MarcaService } from '../../../../core/services/marca.service';
import { UnidadMedidaService } from '../../../../core/services/unidad-medida.service';
import { ContabilidadService } from '../../../../core/services/contabilidad.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { ProductoPresentacionService } from '../../../../core/services/producto-presentacion.service';
import { ProductoPresentacionModel } from '../../../../core/models/producto-presentacion.model';
import {
  ConversionesProductoComponent,
  FilaConversion,
} from './conversiones/conversiones-producto.component';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

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
  /** false = solo para comprar: el POS no la ofrece. */
  seVende: boolean;
  activo: boolean;
  _editando: boolean;
  _esNueva: boolean;
}

import { CuentaAutocompleteComponent } from '../../../../shared/components/cuenta-autocomplete/cuenta-autocomplete.component';

@Component({
  selector: 'app-form-productos',
  standalone: true,
  imports: [
    CuentaAutocompleteComponent,
    CommonModule,
    ReactiveFormsModule,
    CheckboxModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    TabViewModule,
    TextareaModule,
    ButtonModule,
    DividerModule,
    ToastModule,
    ToggleSwitchModule,
    ConfirmDialogModule,
    ConversionesProductoComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './form-productos.component.html',
  styleUrls: ['./form-productos.component.scss'],
})
export class FormProductosComponent implements OnInit {
  /** Sale de la ruta: /catalogo/productos/editar/:id. Null al crear. */
  public productoId: number | null = null;

  // ─── Unidades y conversiones ─────────────────────────────────────
  /** Presentaciones guardadas (para "Pasar a unidad"). */
  public presentaciones: PresentacionFormItem[] = [];
  /** Lo que se edita en la sección "Unidades y conversiones". */
  public conversiones: FilaConversion[] = [];
  /** Se vende suelto, en la unidad base. */
  public vendeSuelto = true;
  /** Índice de la conversión en que se compra; -1 = en la unidad base. */
  public compraEn = -1;
  /** Al editar: si no se cargaron, guardar la lista vacía desactivaría las existentes. */
  private conversionesCargadas = false;

  // ─── Pasar a unidad ──────────────────────────────────────────────
  public cambioUnidad: CambioUnidadPreviewModel | null = null;
  public cargandoCambioUnidad = false;
  public aplicandoCambioUnidad = false;
  public frmCambioUnidad!: FormGroup;

  // ─── Producto ────────────────────────────────────────────────────
  public frmProducto!: FormGroup;
  public isEditMode = false;
  public isSubmitting = false;
  public isLoading = false;
  public activeTab = 0;
  public imageError = false;
  public uploadingImage = false;
  public ivaValue = 0;
  // ─── Opciones de dropdowns ───────────────────────────────────────
  public tipoOptions = TIPO_PRODUCTO_OPTIONS;
  public usoOptions = USO_PRODUCTO_OPTIONS;
  public clasificacionOptions = CLASIFICACION_OPTIONS;
  /** Auxiliares del plan de cuentas, para filtrar la cuenta de la compra por clasificación. */
  private auxiliares: { id: number; codigo: string; nombre: string }[] = [];
  public categoriasOpts: { label: string; value: number | null }[] = [
    { label: 'Sin categoría', value: null },
  ];
  public marcasOpts: { label: string; value: number | null }[] = [
    { label: 'Sin marca', value: null },
  ];
  public unidadesOpts: { label: string; value: number }[] = [];

  // ─── Contabilidad ────────────────────────────────────────────────
  public categoriasContables: CategoriaContableProductoModel[] = [];
  public categoriasContablesOpts: { label: string; value: number | null }[] = [
    { label: 'General (por defecto)', value: null },
  ];
  public cuentasIngresoOpts: { label: string; value: number }[] = [];
  public cuentasCostoOpts: { label: string; value: number }[] = [];
  public cuentasInventarioOpts: { label: string; value: number }[] = [];
  public mostrarCuentasAvanzadas = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly presentacionService: ProductoPresentacionService,
    private readonly confirmService: ConfirmationService,
    private readonly productoService: ProductoService,
    private readonly categoriaService: CategoriaService,
    private readonly marcaService: MarcaService,
    private readonly unidadMedidaService: UnidadMedidaService,
    private readonly contabilidadService: ContabilidadService,
    private readonly alertService: AlertService,
    private readonly storageService: StorageService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.frmCambioUnidad = this.fb.group({
      unidadMedidaId: [null, Validators.required],
      nombrePresentacion: ['', [Validators.required, Validators.maxLength(100)]],
    });
    this.loadDropdowns();
    this.loadContabilidad();

    const id = Number(this.route.snapshot.params['id']);
    this.productoId = id > 0 ? id : null;
    this.isEditMode = !!this.productoId;
    if (this.isEditMode) {
      this.loadData(this.productoId!);
      this.loadPresentaciones(this.productoId!);
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
      usoProducto: ['VENTA', Validators.required],
      clasificacion: ['PRODUCTO' as ClasificacionItem, Validators.required],
      imagenUrl: [null, [Validators.maxLength(500)]],
      activo: [true, Validators.required],
      // precio y costo se derivan de la presentación de compra (Tab 4)
      precio: [0, [Validators.min(0)]],
      costo: [0, [Validators.min(0)]],
      precio2: [null, [Validators.min(0)]],
      precio3: [null, [Validators.min(0)]],
      ivaPorcentaje: [
        0,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      ivaIncluido: [false],
      impoconsumo: [0, [Validators.required, Validators.min(0)]],
      manejaInventario: [true, Validators.required],
      manejaLotes: [false, Validators.required],
      manejaSerial: [false, Validators.required],
      /** Meses de garantía al cliente; se anotan en el serial al vender. */
      mesesGarantia: [null as number | null, [Validators.min(0), Validators.max(120)]],
      permitirStockNegativo: [false, Validators.required],
      visibleEnPos: [true, Validators.required],
      categoriaContableId: [null],
      cuentaIngresoId: [null],
      cuentaCostoId: [null],
      cuentaInventarioId: [null],
    });

    this.frmProducto.get('manejaInventario')?.valueChanges.subscribe((val) => {
      const subControls = [
        'manejaLotes',
        'manejaSerial',
        'permitirStockNegativo',
      ];
      if (!val) {
        this.frmProducto.patchValue({
          manejaLotes: false,
          manejaSerial: false,
          permitirStockNegativo: false,
        });
        subControls.forEach((c) =>
          this.frmProducto.get(c)?.disable({ emitEvent: false }),
        );
      } else {
        subControls.forEach((c) =>
          this.frmProducto.get(c)?.enable({ emitEvent: false }),
        );
      }
    });
    this.frmProducto.get('ivaPorcentaje')?.valueChanges.subscribe((val) => {
      if (!val || val <= 0) {
        this.frmProducto.patchValue(
          { ivaIncluido: false },
          { emitEvent: false },
        );
      }
    });
    this.frmProducto
      .get('usoProducto')
      ?.valueChanges.subscribe((uso: UsoProducto) =>
        this.sincronizarUso(uso, !this.isEditMode),
      );
  }

  // ─── Clasificación (catálogo unificado) ──────────────────────────
  get clasificacion(): ClasificacionOpcion {
    return clasificacionOpcion(this.frmProducto?.get('clasificacion')?.value);
  }

  get esMercancia(): boolean {
    return this.clasificacion.mueveInventario;
  }

  setClasificacion(valor: ClasificacionItem): void {
    const control = this.frmProducto.get('clasificacion');
    if (control?.value === valor) return;
    control?.setValue(valor);
    this.sincronizarClasificacion(valor, !this.isEditMode);
  }

  /**
   * Solo la mercancía maneja inventario y solo lo que se vende sale en el POS:
   * lo demás se apaga y bloquea, igual que lo hace el backend. Al crear, se
   * propone la categoría contable del mismo tipo si hay una sola.
   */
  private sincronizarClasificacion(valor: ClasificacionItem, proponerCategoria: boolean): void {
    const op = clasificacionOpcion(valor);
    const inventario = this.frmProducto.get('manejaInventario');
    if (!op.mueveInventario) {
      inventario?.setValue(false);
      inventario?.disable({ emitEvent: false });
    } else if (inventario?.disabled) {
      // Vuelve a ser mercancía: por defecto controla stock.
      inventario.enable({ emitEvent: false });
      inventario.setValue(true);
    }
    // El tipo sigue a la clasificación: un servicio es SERVICIO (comisiones,
    // factura electrónica) y la mercancía no puede quedar marcada como servicio.
    const tipo = this.frmProducto.get('tipoProducto');
    if (valor === 'SERVICIO') tipo?.setValue('SERVICIO', { emitEvent: false });
    else if (tipo?.value === 'SERVICIO') tipo?.setValue('ESTANDAR', { emitEvent: false });
    // Lo que no se vende no lleva precio ni forma de venta.
    if (!op.seVende) {
      this.frmProducto.patchValue(
        { precio: 0, precio2: null, precio3: null, impoconsumo: 0, ivaIncluido: false, usoProducto: 'VENTA' },
        { emitEvent: false },
      );
      this.activeTab = Math.min(this.activeTab, 1);
    }

    const visible = this.frmProducto.get('visibleEnPos');
    if (!op.seVende) {
      visible?.setValue(false, { emitEvent: false });
      visible?.disable({ emitEvent: false });
    } else if (!this.esInsumo) {
      visible?.enable({ emitEvent: false });
    }

    // La categoría elegida tiene que ser plantilla de esta clasificación.
    const tipos = tiposCategoriaDe(valor);
    const categoriaId = this.frmProducto.get('categoriaContableId')?.value;
    const actual = this.categoriasContables.find((c) => c.id === categoriaId);
    if (actual && !tipos.includes(actual.tipo)) {
      this.frmProducto.patchValue({ categoriaContableId: null }, { emitEvent: false });
    }
    if (proponerCategoria && valor !== 'PRODUCTO' && !this.frmProducto.get('categoriaContableId')?.value) {
      const candidatas = this.categoriasContables.filter((c) => c.activo && tipos.includes(c.tipo));
      if (candidatas.length === 1)
        this.frmProducto.patchValue({ categoriaContableId: candidatas[0].id }, { emitEvent: false });
    }
    // Un override de la cuenta de la compra de otra clase ya no aplica.
    const cuentaCompra = this.frmProducto.get('cuentaInventarioId')?.value;
    if (cuentaCompra) {
      const cuenta = this.auxiliares.find((c) => c.id === cuentaCompra);
      if (cuenta && !op.prefijosCompra.some((p) => cuenta.codigo.startsWith(p)))
        this.frmProducto.patchValue({ cuentaInventarioId: null }, { emitEvent: false });
    }
    this.actualizarOpcionesContables();
  }

  /** Categorías y cuentas de la compra que aplican a la clasificación elegida. */
  private actualizarOpcionesContables(): void {
    const op = this.clasificacion;
    const tipos = tiposCategoriaDe(op.value);
    this.categoriasContablesOpts = [
      {
        label: op.value === 'PRODUCTO' ? 'General (por defecto)' : 'Cuentas por defecto de la empresa',
        value: null,
      },
      ...this.categoriasContables
        .filter((c) => c.activo && c.nombre !== 'General' && tipos.includes(c.tipo))
        .map((c) => ({ label: c.nombre, value: c.id })),
    ];
    this.cuentasInventarioOpts = this.auxiliares
      .filter((c) => op.prefijosCompra.some((p) => c.codigo?.startsWith(p)))
      .map((c) => ({ label: `${c.codigo} - ${c.nombre}`, value: c.id }));
  }

  /**
   * Un insumo nunca se vende en el POS: se apaga y bloquea "Visible en POS".
   * Al crear, si no hay categoría contable elegida, se propone la de insumos.
   */
  private sincronizarUso(uso: UsoProducto, proponerCategoria: boolean): void {
    const visible = this.frmProducto.get('visibleEnPos');
    if (uso !== 'INSUMO') {
      // Un gasto o un activo no se venden aunque no sean insumo.
      if (this.clasificacion.seVende) visible?.enable({ emitEvent: false });
      return;
    }

    visible?.setValue(false, { emitEvent: false });
    visible?.disable({ emitEvent: false });

    if (
      proponerCategoria &&
      !this.frmProducto.get('categoriaContableId')?.value
    ) {
      const insumos = this.categoriasContables.find(
        (c) => c.tipo === 'INSUMO' && c.activo,
      );
      if (insumos)
        this.frmProducto.patchValue(
          { categoriaContableId: insumos.id },
          { emitEvent: false },
        );
    }
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
      usoProducto: 'VENTA',
      clasificacion: 'PRODUCTO',
      imagenUrl: null,
      activo: true,
      precio: 0,
      costo: 0,
      precio2: null,
      precio3: null,
      ivaPorcentaje: 0,
      ivaIncluido: false,
      impoconsumo: 0,
      // precio y costo se recalculan desde la presentación de compra
      manejaInventario: true,
      manejaLotes: false,
      manejaSerial: false,
      permitirStockNegativo: false,
      visibleEnPos: true,
      categoriaContableId: null,
      cuentaIngresoId: null,
      cuentaCostoId: null,
      cuentaInventarioId: null,
    });
    this.frmProducto?.get('visibleEnPos')?.enable({ emitEvent: false });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.frmProducto.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
  get ivaActivo(): boolean {
    // Del form y no de ivaValue: al editar, el IVA llega por patchValue sin input.
    return (this.frmProducto.get('ivaPorcentaje')?.value ?? 0) > 0;
  }

  /**
   * Tarifas de IVA del selector. Es propiedad y no getter: un arreglo nuevo en
   * cada ciclo de detección de cambios re-renderiza el dropdown sin parar.
   */
  public ivaOptions = this.tarifasIva();

  private tarifasIva(extra?: number): { label: string; value: number }[] {
    const tarifas = [0, 5, 19];
    if (extra != null && !isNaN(extra) && !tarifas.includes(extra))
      tarifas.push(extra);
    return tarifas
      .sort((a, b) => a - b)
      .map((t) => ({ label: `${t} %`, value: t }));
  }

  /** Si el producto guardado tiene una tarifa distinta, se agrega a la lista. */
  private actualizarTarifasIva(): void {
    this.ivaOptions = this.tarifasIva(
      Number(this.frmProducto.get('ivaPorcentaje')?.value ?? 0),
    );
  }

  /** La unidad de inventario también se elige en la frase del empaque. */
  get unidadControl(): FormControl {
    return this.frmProducto.get('unidadMedidaBaseId') as FormControl;
  }
  onIvaInput(event: any): void {
    this.ivaValue = event.value ?? 0;
  }

  get esInsumo(): boolean {
    return this.frmProducto.get('usoProducto')?.value === 'INSUMO';
  }

  get usoDescripcion(): string {
    const uso = this.frmProducto.get('usoProducto')?.value;
    return this.usoOptions.find((o) => o.value === uso)?.desc ?? '';
  }

  /**
   * La categoría que realmente aplica: la elegida o, sin elegir, "General"
   * (solo para mercancía: un activo sin categoría usa las cuentas por
   * defecto de la empresa, no las de la General).
   */
  get categoriaEfectiva(): CategoriaContableProductoModel | null {
    const id = this.frmProducto.get('categoriaContableId')?.value;
    if (!id && !this.esMercancia) return null;
    return (
      this.categoriasContables.find((c) =>
        id ? c.id === id : c.nombre === 'General',
      ) ?? null
    );
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
            seVende: p.seVende ?? true,
            activo: p.activo,
            _editando: false,
            _esNueva: false,
          }),
        );
        const activas = this.presentaciones.filter((p) => p.activo);
        this.conversiones = activas.map((p) => ({
          id: p.id ?? null,
          nombre: p.nombre,
          factor: p.factorConversion,
          codigoBarras: p.codigoBarras,
          precio: p.precio || null,
          costo: p.costo ?? null,
          seVende: p.seVende !== false,
        }));
        this.compraEn = activas.findIndex((p) => p.esDefaultCompra);
        this.conversionesCargadas = true;
      }
    } catch {
      /* no bloquear */
    }
  }

  // ─── Pasar a unidad ──────────────────────────────────────────────
  /**
   * Una conversión que equivale a menos de 1 unidad base es más pequeña que la
   * base (la UNIDAD de una paca): el inventario se puede pasar a contar en ella.
   */
  /** Nombre de la unidad de inventario sin la abreviatura: "PACA (PC)" → "PACA". */
  get unidadBaseNombreSolo(): string {
    return this.unidadBaseNombre.replace(/\s*\([^)]*\)\s*$/, '');
  }

  /**
   * El inventario estaba en un empaque (Caja, Paca) y el usuario vende
   * también suelto: 1 empaque trae N unidades.
   *
   * Producto nuevo: la unidad pasa a ser Unidad, el empaque queda como
   * conversión (se compra y se vende) con el precio y el costo que tenía, y
   * las demás conversiones se multiplican por N. Producto guardado: su
   * inventario ya está en empaques, así que se agrega "Unidad" y se usa
   * "Pasar a unidad", que convierte stock, kardex y precios.
   */
  contarEnUnidades(n: number): void {
    const empaque = this.unidadBaseNombreSolo.toLowerCase().replace(/^./, (c) => c.toUpperCase()) || 'Empaque';
    if (this.isEditMode) {
      if (!this.conversiones.some((f) => f.factor && Math.abs(f.factor * n - 1) < 1e-9)) {
        this.conversiones = [...this.conversiones, {
          id: null, nombre: 'Unidad', factor: Math.round((1 / n) * 1_000_000) / 1_000_000,
          codigoBarras: null, precio: null, costo: null, seVende: true,
        }];
      }
      this.alertService.showWarn(
        'Falta un paso',
        `Guarda el producto y luego toca el botón ⟳ "Pasar a unidad" en la fila Unidad: el inventario que ya tiene en ${empaque.toLowerCase()} se convierte a unidades.`,
      );
      return;
    }

    const und = this.unidadesOpts.find((u) => /\((und|u|un)\)$/i.test(u.label))
      ?? this.unidadesOpts.find((u) => /^unidad/i.test(u.label));
    if (!und) {
      this.alertService.showWarn('Falta la unidad', 'Crea la unidad de medida "Unidad (und)" y vuelve a intentarlo.');
      return;
    }
    const precioEmpaque = Number(this.frmProducto.get('precio')?.value) || 0;
    const costoEmpaque = Number(this.frmProducto.get('costo')?.value) || 0;
    const filaEmpaque: FilaConversion = {
      id: null, nombre: empaque, factor: n, codigoBarras: null,
      precio: precioEmpaque || null, costo: costoEmpaque || null, seVende: true,
    };
    // Lo escrito en empaques pasa a unidades: un six pack de 0,25 caja = 6 und.
    const otras = this.conversiones.map((f) => ({
      ...f,
      factor: f.factor ? Math.round(f.factor * n * 1_000_000) / 1_000_000 : f.factor,
    }));
    this.conversiones = [filaEmpaque, ...otras.filter((f) => f.factor !== 1)];
    this.compraEn = 0;
    this.vendeSuelto = true;
    this.frmProducto.patchValue({
      unidadMedidaBaseId: und.value,
      // Precio suelto de partida: el del empaque repartido; el usuario lo ajusta.
      precio: precioEmpaque ? Math.ceil(precioEmpaque / n) : 0,
      costo: costoEmpaque ? Math.round((costoEmpaque / n) * 1_000_000) / 1_000_000 : 0,
    });
    this.alertService.showSuccess(
      'Listo',
      `El inventario se cuenta en unidades y ${empaque} = ${n} und se compra y se vende. Revisa el precio por unidad.`,
    );
  }

  pasarConversionAUnidad(f: FilaConversion): void {
    const item = this.presentaciones.find((p) => p.id === f.id);
    if (item) this.verCambioUnidad(item);
  }

  get unidadCambioNombre(): string {
    const id = this.frmCambioUnidad?.get('unidadMedidaId')?.value;
    return this.unidadesOpts.find((u) => u.value === id)?.label ?? '';
  }

  async verCambioUnidad(item: PresentacionFormItem): Promise<void> {
    if (!this.productoId || !item.id) return;
    this.cargandoCambioUnidad = true;
    try {
      const res = await lastValueFrom(
        this.productoService.previewCambioUnidad(this.productoId, item.id),
      );
      this.cambioUnidad = res?.data ?? null;
      if (this.cambioUnidad) {
        this.frmCambioUnidad.reset({
          unidadMedidaId: this.cambioUnidad.unidadSugeridaId,
          nombrePresentacion: this.cambioUnidad.nombrePresentacionSugerido,
        });
      }
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? e?.message ?? 'No se pudo preparar el cambio.',
      );
    } finally {
      this.cargandoCambioUnidad = false;
    }
  }

  cancelarCambioUnidad(): void {
    this.cambioUnidad = null;
  }

  confirmarCambioUnidad(): void {
    const preview = this.cambioUnidad;
    if (!preview?.puedeAplicar) return;
    if (this.frmCambioUnidad.invalid) {
      this.frmCambioUnidad.markAllAsTouched();
      return;
    }
    this.confirmService.confirm({
      message:
        `El inventario de "${preview.productoNombre}" pasará a contarse en ` +
        `${this.unidadCambioNombre || preview.presentacionNombre} (1 ${preview.unidadActualNombre} = ${preview.factor}). ` +
        'No se deshace desde la pantalla. ¿Continuar?',
      header: 'Pasar a unidad',
      icon: 'pi pi-sync',
      acceptLabel: 'Pasar a unidad',
      rejectLabel: 'Cancelar',
      accept: () => this.aplicarCambioUnidad(preview),
    });
  }

  private async aplicarCambioUnidad(
    preview: CambioUnidadPreviewModel,
  ): Promise<void> {
    this.aplicandoCambioUnidad = true;
    try {
      const v = this.frmCambioUnidad.value;
      await lastValueFrom(
        this.productoService.aplicarCambioUnidad(preview.productoId, {
          presentacionId: preview.presentacionId,
          unidadMedidaId: v.unidadMedidaId,
          nombrePresentacion: (v.nombrePresentacion ?? '').trim(),
        }),
      );
      this.cambioUnidad = null;
      await Promise.all([
        this.loadData(preview.productoId),
        this.loadPresentaciones(preview.productoId),
      ]);
      this.alertService.showSuccess(
        'Listo',
        'El inventario ahora se cuenta en la unidad nueva.',
      );
    } catch (e: any) {
      this.alertService.showError(
        'No se pudo',
        e?.error?.message ?? e?.message ?? 'No se pudo pasar a unidad.',
      );
    } finally {
      this.aplicandoCambioUnidad = false;
    }
  }

  /** Abreviatura de la unidad de inventario para las frases ("trae 10 und"). */
  get unidadBaseCorta(): string {
    const label = this.unidadBaseNombre;
    const abreviatura = /\(([^)]+)\)\s*$/.exec(label)?.[1];
    return (abreviatura ?? label).toLowerCase();
  }

  /** Lo que impide guardar las conversiones; null si están bien. */
  private get errorConversiones(): string | null {
    const factores = new Set<number>();
    for (const f of this.conversiones) {
      if (!f.nombre?.trim()) return 'Cada conversión necesita un nombre (Paca, Caja, Libra…).';
      if (!f.factor || f.factor <= 0) return `Escribe a cuántas ${this.unidadBaseCorta} equivale 1 ${f.nombre}.`;
      if (f.factor === 1) return `${f.nombre}: equivaler a 1 ${this.unidadBaseCorta} es la misma unidad base.`;
      if (factores.has(f.factor)) return `Dos conversiones equivalen a ${f.factor} ${this.unidadBaseCorta}: deja solo una.`;
      factores.add(f.factor);
    }
    if (this.esMercancia && !this.vendeSuelto && !this.conversiones.some((f) => f.seVende))
      return 'Marca al menos una forma de venta: suelto o en alguna conversión.';
    return null;
  }

  /** Guarda todas las conversiones de una vez; devuelve el error, si hubo. */
  private async guardarConversiones(productoId: number): Promise<string | null> {
    if (this.isEditMode && !this.conversionesCargadas)
      return 'No se pudieron cargar las conversiones del producto; recarga la página antes de cambiarlas.';
    try {
      await lastValueFrom(
        this.presentacionService.guardarConversiones(productoId, {
          vendePorUnidad: this.clasificacion.seVende ? this.vendeSuelto : true,
          conversiones: this.conversiones.map((f, i) => ({
            id: f.id ?? null,
            nombre: f.nombre.trim(),
            factor: f.factor!,
            codigoBarras: f.codigoBarras?.trim() || null,
            // Precio vacío: el de la unidad × lo que equivale.
            precio: f.precio || Math.round((Number(this.frmProducto.get('precio')?.value) || 0) * (f.factor ?? 0)),
            costo: f.costo ?? 0,
            seVende: this.clasificacion.seVende ? f.seVende : false,
            esDefaultCompra: i === this.compraEn,
          })),
        }),
      );
      return null;
    } catch (e: any) {
      return e?.error?.message ?? e?.message ?? 'No se pudieron guardar las conversiones.';
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

  /**
   * Categorías contables y cuentas auxiliares para la pestaña Contabilidad.
   * Va aparte de los demás dropdowns: un usuario sin acceso a contabilidad
   * debe poder seguir creando productos (heredan la categoría General).
   */
  private async loadContabilidad(): Promise<void> {
    try {
      const [categorias, plan] = await Promise.all([
        lastValueFrom(this.contabilidadService.listarCategoriasProducto()),
        lastValueFrom(this.contabilidadService.listarPlan()),
      ]);

      this.categoriasContables = categorias?.data ?? [];

      // Mismas reglas de clase que valida el backend.
      const auxiliares = (plan?.data ?? []).filter(
        (c) => c.auxiliar && c.activa,
      );
      this.auxiliares = auxiliares.map((c) => ({ id: c.id, codigo: c.codigo ?? '', nombre: c.nombre }));
      const opciones = (...prefijos: string[]) =>
        auxiliares
          .filter((c) => prefijos.some((p) => c.codigo?.startsWith(p)))
          .map((c) => ({ label: `${c.codigo} - ${c.nombre}`, value: c.id }));

      this.cuentasIngresoOpts = opciones('4');
      this.cuentasCostoOpts = opciones('5', '6', '7');
      // Categorías y cuenta de la compra dependen de la clasificación.
      this.actualizarOpcionesContables();
    } catch {
      /* sin permisos de contabilidad: el producto hereda la categoría General */
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
      this.volver();
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
          usoProducto: d.usoProducto ?? 'VENTA',
          clasificacion: d.clasificacion ?? 'PRODUCTO',
          imagenUrl: d.imagenUrl,
          activo: d.activo,
          precio: d.precio,
          costo: d.costo,
          precio2: d.precio2 ?? null,
          precio3: d.precio3 ?? null,
          ivaPorcentaje: d.ivaPorcentaje,
          ivaIncluido: d.ivaIncluido,
          impoconsumo: d.impoconsumo,
          manejaInventario: d.manejaInventario,
          manejaLotes: d.manejaLotes,
          manejaSerial: d.manejaSerial,
          mesesGarantia: d.mesesGarantia ?? null,
          permitirStockNegativo: d.permitirStockNegativo,
          visibleEnPos: d.visibleEnPos,
          categoriaContableId: d.categoriaContableId ?? null,
          cuentaIngresoId: d.cuentaIngresoId ?? null,
          cuentaCostoId: d.cuentaCostoId ?? null,
          cuentaInventarioId: d.cuentaInventarioId ?? null,
        },
        { emitEvent: false },
      );
      this.actualizarTarifasIva();
      this.vendeSuelto = d.vendePorUnidad ?? true;
      this.sincronizarUso(d.usoProducto ?? 'VENTA', false);
      this.sincronizarClasificacion(d.clasificacion ?? 'PRODUCTO', false);
      // Si el producto ya tiene cuentas propias, se muestran de una vez.
      this.mostrarCuentasAvanzadas = !!(
        d.cuentaIngresoId ||
        d.cuentaCostoId ||
        d.cuentaInventarioId
      );
      // Sync enable/disable state for inventory sub-controls
      const subControls = [
        'manejaLotes',
        'manejaSerial',
        'permitirStockNegativo',
      ];
      if (!d.manejaInventario) {
        subControls.forEach((c) =>
          this.frmProducto.get(c)?.disable({ emitEvent: false }),
        );
      } else {
        subControls.forEach((c) =>
          this.frmProducto.get(c)?.enable({ emitEvent: false }),
        );
      }
    }, 0.5);
  }

  // ─── Guardar producto ────────────────────────────────────────────
  async saveProducto(): Promise<void> {
    const errorConversion = this.errorConversiones;
    if (this.frmProducto.invalid || errorConversion) {
      this.frmProducto.markAllAsTouched();
      // Llevar a la pestaña donde está el error.
      const basico = ['nombre', 'unidadMedidaBaseId', 'tipoProducto', 'usoProducto'];
      const precios = ['ivaPorcentaje', 'impoconsumo', 'precio', 'costo'];
      if (basico.some((f) => this.frmProducto.get(f)?.invalid)) this.activeTab = 0;
      else if (errorConversion || precios.some((f) => this.frmProducto.get(f)?.invalid))
        this.activeTab = 1;
      this.alertService.showWarn(
        'Formulario incompleto',
        errorConversion ?? 'Revisa los campos marcados en rojo.',
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
        const productoId = this.isEditMode
          ? this.productoId!
          : (response?.data?.id ?? null);

        const errorGuardandoEmpaque = productoId
          ? await this.guardarConversiones(productoId)
          : null;
        if (errorGuardandoEmpaque) {
          this.alertService.showWarn(
            'El producto se guardó, las conversiones no',
            errorGuardandoEmpaque,
          );
          // Queda en la edición del producto para corregir el empaque.
          if (!this.isEditMode && productoId)
            this.router.navigate(['/catalogo/productos/editar', productoId]);
          return;
        }

        this.alertService.showSuccess(
          this.isEditMode ? 'Producto actualizado' : 'Producto creado',
          response.message,
        );
        this.volver();
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

  volver(): void {
    this.router.navigate(['/catalogo/productos']);
  }

  // ─── Helpers ─────────────────────────────────────────────────────
  private buildDto(): CreateProductoDto {
    const v = this.frmProducto.getRawValue();
    const uso = (v.usoProducto ?? 'VENTA') as UsoProducto;
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
      usoProducto: uso,
      clasificacion: (v.clasificacion ?? 'PRODUCTO') as ClasificacionItem,
      activo: v.activo,
      precio: v.precio ?? 0,
      costo: v.costo ?? 0,
      precio2: v.precio2 ?? null,
      precio3: v.precio3 ?? null,
      ivaPorcentaje: v.ivaPorcentaje ?? 0,
      ivaIncluido: v.ivaIncluido ?? false,
      impoconsumo: v.impoconsumo ?? 0,
      manejaInventario: v.manejaInventario,
      manejaLotes: v.manejaLotes,
      manejaSerial: v.manejaSerial,
      // 0 = sin garantía (null lo dejaría como estaba en el back).
      mesesGarantia: v.mesesGarantia ?? 0,
      permitirStockNegativo: v.permitirStockNegativo ?? false,
      visibleEnPos:
        uso === 'INSUMO' || !clasificacionOpcion(v.clasificacion).seVende
          ? false
          : (v.visibleEnPos ?? true),
      // Lo que no se vende queda "por unidad" (no aplica); el resto, lo de la sección de conversiones.
      vendePorUnidad: this.clasificacion.seVende ? this.vendeSuelto : true,
      categoriaContableId: v.categoriaContableId ?? null,
      cuentaIngresoId: v.cuentaIngresoId ?? null,
      cuentaCostoId: v.cuentaCostoId ?? null,
      cuentaInventarioId: v.cuentaInventarioId ?? null,
    };
  }

  get margenUtilidad(): number {
    return this.margenDe(this.frmProducto.get('precio')?.value) ?? 0;
  }

  /**
   * % de utilidad de un precio sobre el costo base, sin IVA (margen). null si
   * falta precio o costo. Mismo cálculo que la columna Utilidad de conversiones.
   * Ojo: 0 % devuelve 0, que en *ngIf se lee como "no mostrar".
   */
  margenDe(precio: number | null | undefined): number | null {
    const p = Number(precio) || 0;
    const c = Number(this.frmProducto.get('costo')?.value) || 0;
    if (p <= 0 || c <= 0) return null;
    const iva = Number(this.frmProducto.get('ivaPorcentaje')?.value) || 0;
    const neto = this.ivaIncluidoValue && iva > 0 ? p / (1 + iva / 100) : p;
    return Math.round(((neto - c) / neto) * 1000) / 10;
  }

  get ivaIncluidoValue(): boolean {
    return this.frmProducto.get('ivaIncluido')?.value ?? false;
  }

  /** Precio base sin IVA: si ivaIncluido=true, extrae la base; si no, es el mismo precio */
  get precioBaseSinIva(): number {
    const precio = this.frmProducto.get('precio')?.value ?? 0;
    const iva = this.frmProducto.get('ivaPorcentaje')?.value ?? 0;
    if (!this.ivaIncluidoValue || !iva) return precio;
    return Math.round(precio / (1 + iva / 100));
  }

  /** Monto del IVA calculado */
  get ivaCalculado(): number {
    const precio = this.frmProducto.get('precio')?.value ?? 0;
    const iva = this.frmProducto.get('ivaPorcentaje')?.value ?? 0;
    if (!iva) return 0;
    if (this.ivaIncluidoValue) {
      return precio - this.precioBaseSinIva;
    }
    return Math.round((precio * iva) / 100);
  }

  /** Precio final que paga el cliente */
  get precioFinalTotal(): number {
    const precio = this.frmProducto.get('precio')?.value ?? 0;
    const impoconsumo = this.frmProducto.get('impoconsumo')?.value ?? 0;
    if (this.ivaIncluidoValue) {
      return precio + impoconsumo;
    }
    return precio + this.ivaCalculado + impoconsumo;
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

    const tiposPermitidos = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/avif',
    ];
    if (!tiposPermitidos.includes(file.type)) {
      this.alertService.showError(
        'Formato inválido',
        'Solo se permiten imágenes JPG, PNG, WebP, GIF o AVIF.',
      );
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.alertService.showError(
        'Archivo muy grande',
        'La imagen no puede superar los 10 MB.',
      );
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
        this.alertService.showError(
          'Error',
          'No se pudo subir la imagen. Intenta de nuevo.',
        );
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
