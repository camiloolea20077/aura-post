// ─── form-empresa.component.ts (página plana) ────────────────
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
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
  CreateEmpresaResponseDto,
  EmpresaPlataformaModel,
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

@Component({
  selector: 'app-form-empresa',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    ToggleSwitchModule,
    DropdownModule,
    SkeletonModule,
    TooltipModule,
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

  get isEdit(): boolean {
    return this.empresaId != null;
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: PlatformService,
    private readonly terceroService: TerceroService,
    private readonly storageService: StorageService,
    private readonly alert: AlertService,
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
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.empresaId = +idParam;
      this.cargarEmpresa(this.empresaId);
    } else {
      this.aplicarValidadoresCreacion();
    }
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
