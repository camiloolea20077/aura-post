// ─── form-empresa.component.ts (página plana) ────────────────
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DropdownModule } from 'primeng/dropdown';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';
import {
  CodigoLineaUso,
  ConfiguracionEmpresaModel,
  CreateEmpresaResponseDto,
  EmpresaPlataformaModel,
  LineaUsoModel,
} from '../../../core/models/platform.model';
import {
  TIPO_DOCUMENTO_OPTIONS,
  TIPO_PERSONA_OPTIONS,
  REGIMEN_OPTIONS,
} from '../../../core/models/tercero.model';
import { PlatformService } from '../../../core/services/platform.service';
import { TerceroService } from '../../../core/services/tercero.service';
import { StorageService } from '../../../core/services/storage.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { ModuloService } from '../modulos/services/modulo.service';
import { ModuloPermiso } from '../permisos-empresa/models/permiso.model';
import { ArbolModulosComponent } from '../shared/arbol-modulos/arbol-modulos.component';

@Component({
  selector: 'app-form-empresa',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    ToggleSwitchModule,
    DropdownModule,
    SkeletonModule,
    TooltipModule,
    ArbolModulosComponent,
  ],
  templateUrl: './form-empresa.component.html',
  styleUrls: ['./form-empresa.component.scss'],
})
export class FormEmpresaComponent implements OnInit {
  frmEmpresa: FormGroup;
  loading = false;
  loadingEmpresa = false;
  uploadingLogo = false;
  logoPreview: string | null = null;

  empresaId: number | null = null;
  credenciales: CreateEmpresaResponseDto | null = null;

  municipioOpts: { label: string; value: number }[] = [];
  municipioLoading = false;
  private municipioTimer: any;

  readonly tipoDocOpts = TIPO_DOCUMENTO_OPTIONS;
  readonly tipoPersonaOpts = TIPO_PERSONA_OPTIONS;
  readonly regimenOpts = REGIMEN_OPTIONS;

  readonly modoOpts = [
    {
      value: 'AUTOMATICO',
      titulo: 'Automático',
      icon: 'pi pi-bolt',
      desc: 'Cada venta, compra o nómina genera su asiento ya CONTABILIZADO. Ideal si confías en el motor.',
    },
    {
      value: 'REVISION',
      titulo: 'Revisión del contador',
      icon: 'pi pi-check-square',
      desc: 'Los asientos nacen en BORRADOR y el contador los aprueba en la bandeja de revisión antes de impactar los reportes.',
    },
  ];

  // ── Líneas de uso (para qué usará Aura) ─────────────────
  lineasCatalogo: LineaUsoModel[] = [];
  lineasElegidas: CodigoLineaUso[] = [];
  /** Tablero de inicio preferido; null = el de la primera línea. */
  inicio: CodigoLineaUso | null = null;
  configuracion: ConfiguracionEmpresaModel | null = null;
  reintentando = false;
  private lineasOriginales = '';

  readonly iconoLinea: Record<CodigoLineaUso, string> = {
    POS: 'pi-shopping-cart',
    COMERCIAL: 'pi-briefcase',
    CONTABILIDAD: 'pi-calculator',
    NOMINA: 'pi-users',
  };

  get inicioOpts(): { label: string; value: CodigoLineaUso | null }[] {
    return [
      { label: 'Automático (primera línea)', value: null },
      ...this.lineasCatalogo
        .filter((l) => this.lineasElegidas.includes(l.codigo))
        .map((l) => ({ label: l.nombre, value: l.codigo })),
    ];
  }

  get isEdit(): boolean {
    return this.empresaId != null;
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: PlatformService,
    private readonly terceroService: TerceroService,
    private readonly storageService: StorageService,
    private readonly alert: AlertService,
    private readonly moduloService: ModuloService,
    private readonly cdr: ChangeDetectorRef,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    this.frmEmpresa = this.fb.group({
      // Empresa
      razonSocial: ['', [Validators.required, Validators.maxLength(200)]],
      nombreComercial: [null],
      nit: ['', [Validators.required, Validators.maxLength(20)]],
      dv: [null, Validators.maxLength(2)],
      logoUrl: [null],
      telefono: [null],
      municipio: [null],
      municipioId: [null],
      activa: [true],
      // Contabilidad
      modoContabilizacion: ['AUTOMATICO'],
      // Admin — solo en creación
      emailAdmin: ['', [Validators.email]],
      passwordAdmin: ['', [Validators.minLength(6)]],
      nombresAdmin: [''],
      apellidosAdmin: [''],
      documentoAdmin: [''],
      tipoDocumentoAdmin: ['CC'],
      tipoPersonaAdmin: ['NATURAL'],
      regimenAdmin: ['NO_RESPONSABLE_IVA'],
      granContribuyenteAdmin: [false],
      autoRetenedorAdmin: [false],
      paisAdmin: ['Colombia'],
      codigoPaisAdmin: ['CO'],
      // Sucursal — solo en creación
      nombreSucursal: [''],
      // Factus — Facturación electrónica
      facturaElectronica: [false],
      factusClientId: [''],
      factusClientSecret: [''],
      factusUsername: [''],
      factusPassword: [''],
      factusNumberingRangeId: [null],
      factusPrefijo: [''],
    });

    // Validadores condicionales de Factus
    this.frmEmpresa.get('facturaElectronica')?.valueChanges.subscribe((val) => {
      const factusFields = [
        'factusClientId', 'factusClientSecret', 'factusUsername',
        'factusPassword', 'factusNumberingRangeId', 'factusPrefijo',
      ];
      factusFields.forEach((f) => {
        const control = this.frmEmpresa.get(f);
        if (val) control?.setValidators([Validators.required]);
        else control?.clearValidators();
        control?.updateValueAndValidity();
      });
    });
  }

  ngOnInit(): void {
    this.cargarMunicipios('');
    this.cargarLineas();
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.empresaId = +idParam;
      this.cargarEmpresa(this.empresaId);
      this.cargarConfiguracion(this.empresaId);
    } else {
      this.aplicarValidadoresCreacion();
      this.cargarCatalogoModulos();
    }
  }

  // ── Módulos que tendrá la empresa (solo al crear) ─────────
  catalogoModulos: ModuloPermiso[] = [];
  submodulosElegidos: number[] = [];

  /** Todo marcado por defecto: una empresa nueva no debe nacer sin nada que ver. */
  private async cargarCatalogoModulos(): Promise<void> {
    try {
      const res = await lastValueFrom(this.moduloService.arbol());
      const lista: ModuloPermiso[] = res?.data ?? [];
      this.catalogoModulos = lista.map((m) => ({
        ...m,
        activo: true,
        submodulos: m.submodulos.map((s) => ({ ...s, activo: true })),
      }));
      this.submodulosElegidos = this.catalogoModulos.flatMap((m) => m.submodulos.map((s) => s.submoduloId));
    } catch {
      this.catalogoModulos = [];
    }
    this.cdr.markForCheck();
  }

  private async cargarLineas(): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.lineasUso());
      this.lineasCatalogo = res?.data ?? [];
    } catch {
      this.lineasCatalogo = [];
    }
    this.cdr.markForCheck();
  }

  private async cargarConfiguracion(id: number): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.configuracion(id));
      this.aplicarConfiguracion(res?.data ?? null);
    } catch {
      this.configuracion = null;
    }
    this.cdr.markForCheck();
  }

  private aplicarConfiguracion(cfg: ConfiguracionEmpresaModel | null): void {
    this.configuracion = cfg;
    // Si nunca declaró, no se pre-marca nada: así guardar sin tocar no la declara POS.
    this.lineasElegidas = cfg?.declarada ? [...cfg.lineas] : [];
    this.inicio = cfg?.inicio ?? null;
    this.lineasOriginales = this.firmaLineas();
  }

  private firmaLineas(): string {
    return [...this.lineasElegidas].sort().join(',') + '|' + (this.inicio ?? '');
  }

  lineaElegida(codigo: CodigoLineaUso): boolean {
    return this.lineasElegidas.includes(codigo);
  }

  toggleLinea(codigo: CodigoLineaUso): void {
    this.lineasElegidas = this.lineaElegida(codigo)
      ? this.lineasElegidas.filter((c) => c !== codigo)
      : [...this.lineasElegidas, codigo];
    if (this.inicio && !this.lineasElegidas.includes(this.inicio)) this.inicio = null;
    if (!this.isEdit) this.aplicarPlantilla();
    this.cdr.markForCheck();
  }

  onInicio(value: CodigoLineaUso | null): void {
    this.inicio = value;
  }

  /** Marca en el árbol lo que traen las líneas elegidas; sin líneas, todo (como antes). */
  private aplicarPlantilla(): void {
    const ids = new Set<number>();
    for (const l of this.lineasCatalogo) {
      if (this.lineasElegidas.includes(l.codigo)) l.submodulos.forEach((id) => ids.add(id));
    }
    const todo = this.lineasElegidas.length === 0;
    this.catalogoModulos = this.catalogoModulos.map((m) => {
      const submodulos = m.submodulos.map((s) => ({ ...s, activo: todo || ids.has(s.submoduloId) }));
      return { ...m, activo: submodulos.some((s) => s.activo), submodulos };
    });
    this.submodulosElegidos = this.catalogoModulos.flatMap((m) =>
      m.submodulos.filter((s) => s.activo).map((s) => s.submoduloId),
    );
  }

  async reintentarArranque(): Promise<void> {
    if (!this.empresaId) return;
    this.reintentando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.reintentarArranque(this.empresaId));
      this.aplicarConfiguracion(res?.data ?? null);
      if (this.configuracion?.arranquePendiente)
        this.alert.showError('Arranque', 'Sigue con errores. Revise el detalle.');
      else this.alert.showSuccess('Arranque', 'Plan de cuentas y configuración contable listos');
    } catch (err: any) {
      this.alert.showError('Error', err?.error?.message ?? 'No se pudo ejecutar el arranque');
    } finally {
      this.reintentando = false;
      this.cdr.markForCheck();
    }
  }

  onModulos(ids: number[]): void {
    this.submodulosElegidos = ids;
  }

  verModulos(): void {
    if (this.empresaId) this.router.navigate(['/platform/permisos', this.empresaId]);
  }

  private aplicarValidadoresCreacion(): void {
    this.frmEmpresa.get('emailAdmin')?.setValidators([Validators.required, Validators.email]);
    this.frmEmpresa.get('passwordAdmin')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.frmEmpresa.get('nombresAdmin')?.setValidators([Validators.required]);
    this.frmEmpresa.get('apellidosAdmin')?.setValidators([Validators.required]);
    this.frmEmpresa.get('documentoAdmin')?.setValidators([Validators.required]);
    this.frmEmpresa.get('nombreSucursal')?.setValidators([Validators.required]);
    ['emailAdmin', 'passwordAdmin', 'nombresAdmin', 'apellidosAdmin', 'documentoAdmin', 'nombreSucursal']
      .forEach((f) => this.frmEmpresa.get(f)?.updateValueAndValidity());
    this.frmEmpresa.patchValue({ nombreSucursal: 'Sede Principal' });
  }

  private async cargarEmpresa(id: number): Promise<void> {
    this.loadingEmpresa = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.getById(id));
      const empresa: EmpresaPlataformaModel | null = res?.data ?? null;
      if (!empresa) throw new Error('no data');
      // En edición los campos de admin/sucursal no aplican.
      ['emailAdmin', 'passwordAdmin', 'nombresAdmin', 'apellidosAdmin', 'documentoAdmin', 'nombreSucursal']
        .forEach((f) => {
          this.frmEmpresa.get(f)?.clearValidators();
          this.frmEmpresa.get(f)?.updateValueAndValidity();
        });
      // Siembra la opción del municipio guardado para que el select lo muestre.
      if (empresa.municipioId && empresa.municipio
          && !this.municipioOpts.some((o) => o.value === empresa.municipioId)) {
        this.municipioOpts = [
          { label: empresa.municipio, value: empresa.municipioId },
          ...this.municipioOpts,
        ];
      }
      this.logoPreview = empresa.logoUrl ?? null;
      this.frmEmpresa.patchValue({
        razonSocial: empresa.razonSocial,
        nombreComercial: empresa.nombreComercial,
        nit: empresa.nit,
        dv: empresa.dv,
        logoUrl: empresa.logoUrl,
        telefono: empresa.telefono,
        municipio: empresa.municipio,
        municipioId: empresa.municipioId,
        activa: empresa.activa,
        modoContabilizacion: empresa.modoContabilizacion || 'AUTOMATICO',
        facturaElectronica: empresa.facturaElectronica,
        factusClientId: empresa.factusClientId,
        factusClientSecret: empresa.factusClientSecret,
        factusUsername: empresa.factusUsername,
        factusPassword: empresa.factusPassword,
        factusNumberingRangeId: empresa.factusNumberingRangeId,
        factusPrefijo: empresa.factusPrefijo,
      });
    } catch {
      this.alert.showError('Error', 'No se pudo cargar la empresa');
      this.volver();
    } finally {
      this.loadingEmpresa = false;
      this.cdr.markForCheck();
    }
  }

  seleccionarModo(value: string): void {
    this.frmEmpresa.patchValue({ modoContabilizacion: value });
  }

  async save(): Promise<void> {
    if (this.frmEmpresa.invalid) {
      this.frmEmpresa.markAllAsTouched();
      this.alert.showError('Revisa el formulario', 'Hay campos obligatorios sin completar.');
      return;
    }
    if (this.isEdit && this.configuracion?.declarada && this.lineasElegidas.length === 0) {
      this.alert.showError('Líneas de uso', 'Elija al menos una: para qué usa Aura esta empresa.');
      return;
    }
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const v = this.frmEmpresa.value;
      const municipioLabel =
        this.municipioOpts.find((o) => o.value === v.municipioId)?.label ?? null;
      if (this.isEdit) {
        await lastValueFrom(
          this.service.actualizar(this.empresaId!, {
            razonSocial: v.razonSocial,
            nombreComercial: v.nombreComercial,
            dv: v.dv,
            logoUrl: v.logoUrl,
            telefono: v.telefono,
            municipio: municipioLabel,
            municipioId: v.municipioId,
            activa: v.activa,
            modoContabilizacion: v.modoContabilizacion,
            facturaElectronica: v.facturaElectronica,
            factusClientId: v.factusClientId,
            factusClientSecret: v.factusClientSecret,
            factusUsername: v.factusUsername,
            factusPassword: v.factusPassword,
            factusNumberingRangeId: v.factusNumberingRangeId,
            factusPrefijo: v.factusPrefijo,
          }),
        );
        // Líneas: solo si cambiaron. Se completan los módulos que pidan (no se apaga nada).
        if (this.lineasElegidas.length && this.firmaLineas() !== this.lineasOriginales) {
          await lastValueFrom(
            this.service.actualizarConfiguracion(this.empresaId!, {
              lineas: this.lineasElegidas,
              inicio: this.inicio,
              completarModulos: true,
            }),
          );
        }
        this.alert.showSuccess('Actualizada', 'Empresa actualizada correctamente');
        this.volver();
      } else {
        const response = await lastValueFrom(
          this.service.crear({
            razonSocial: v.razonSocial,
            nombreComercial: v.nombreComercial,
            nit: v.nit,
            dv: v.dv,
            logoUrl: v.logoUrl,
            telefono: v.telefono,
            municipio: municipioLabel,
            municipioId: v.municipioId,
            modoContabilizacion: v.modoContabilizacion,
            emailAdmin: v.emailAdmin,
            passwordAdmin: v.passwordAdmin,
            nombresAdmin: v.nombresAdmin,
            apellidosAdmin: v.apellidosAdmin,
            documentoAdmin: v.documentoAdmin,
            tipoDocumentoAdmin: v.tipoDocumentoAdmin,
            tipoPersonaAdmin: v.tipoPersonaAdmin,
            regimenAdmin: v.regimenAdmin,
            granContribuyenteAdmin: v.granContribuyenteAdmin,
            autoRetenedorAdmin: v.autoRetenedorAdmin,
            paisAdmin: v.paisAdmin,
            codigoPaisAdmin: v.codigoPaisAdmin,
            nombreSucursal: v.nombreSucursal,
            submodulos: this.submodulosElegidos,
            lineas: this.lineasElegidas,
            facturaElectronica: v.facturaElectronica,
            factusClientId: v.factusClientId,
            factusClientSecret: v.factusClientSecret,
            factusUsername: v.factusUsername,
            factusPassword: v.factusPassword,
            factusNumberingRangeId: v.factusNumberingRangeId,
            factusPrefijo: v.factusPrefijo,
          }),
        );
        // Muestra las credenciales del admin creado (pantalla de éxito).
        this.credenciales = response?.data ?? null;
      }
    } catch (err: any) {
      this.alert.showError('Error', err?.error?.message ?? err?.message ?? 'No se pudo guardar');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  volver(): void {
    this.router.navigate(['/platform/empresas']);
  }

  copiar(texto: string): void {
    navigator.clipboard.writeText(texto);
    this.alert.showSuccess('Copiado', 'Copiado al portapapeles');
  }

  async onLogoSelect(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingLogo = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.storageService.uploadImagen(file, 'empresas'));
      this.logoPreview = res.url;
      this.frmEmpresa.patchValue({ logoUrl: res.url });
    } catch {
      this.alert.showError('Error', 'No se pudo subir el logo');
    } finally {
      this.uploadingLogo = false;
      this.cdr.markForCheck();
    }
  }

  removeLogo(): void {
    this.logoPreview = null;
    this.frmEmpresa.patchValue({ logoUrl: null });
  }

  onMunicipioFilter(event: { filter: string }): void {
    if (this.municipioTimer) clearTimeout(this.municipioTimer);
    this.municipioTimer = setTimeout(() => this.cargarMunicipios(event.filter ?? ''), 250);
  }

  private async cargarMunicipios(query: string): Promise<void> {
    this.municipioLoading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.terceroService.buscarMunicipios(query));
      const opts = (res?.data ?? []).map((m) => ({ label: m.label || m.nombre, value: m.id }));
      // Conserva la opción seleccionada aunque no venga en el filtro.
      const selId = this.frmEmpresa.get('municipioId')?.value as number | null;
      if (selId && !opts.some((o) => o.value === selId)) {
        const actual = this.municipioOpts.find((o) => o.value === selId);
        if (actual) opts.unshift(actual);
      }
      this.municipioOpts = opts;
    } catch {
      this.municipioOpts = [];
    } finally {
      this.municipioLoading = false;
      this.cdr.markForCheck();
    }
  }

  isInvalid(f: string): boolean {
    const c = this.frmEmpresa.get(f);
    return !!(c?.invalid && c?.touched);
  }
}
