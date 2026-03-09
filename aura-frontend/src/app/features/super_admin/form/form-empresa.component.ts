// ─── form-empresa.component.ts ───────────────────────────────
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
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
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { DividerModule } from 'primeng/divider';
import { AutoCompleteModule, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { lastValueFrom } from 'rxjs';
import { CreateEmpresaResponseDto, EmpresaPlataformaModel } from '../../../core/models/platform.model';
import { MunicipioDto } from '../../../core/models/tercero.model';
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
    ToggleButtonModule,
    DividerModule,
    AutoCompleteModule,
  ],
  templateUrl: './form-empresa.component.html',
  styleUrls: ['./form-empresa.component.scss'],
})
export class FormEmpresaComponent implements OnChanges {
  @Input() empresa: EmpresaPlataformaModel | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() credencialesCreadas = new EventEmitter<CreateEmpresaResponseDto>();
  @Output() cancelled = new EventEmitter<void>();

  frmEmpresa: FormGroup;
  loading = false;
  uploadingLogo = false;
  logoPreview: string | null = null;
  municipioSugerencias: MunicipioDto[] = [];

  get isEdit(): boolean {
    return !!this.empresa;
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: PlatformService,
    private readonly terceroService: TerceroService,
    private readonly storageService: StorageService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.frmEmpresa = this.fb.group({
      // Empresa
      razonSocial: ['', [Validators.required, Validators.maxLength(200)]],
      nombreComercial: [null],
      nit: ['', [Validators.required, Validators.maxLength(20)]],
      dv: [null, Validators.maxLength(2)],
      logoUrl: [null],
      telefono: [null],
      municipioObj: [null],
      municipio: [null],
      municipioId: [null],
      activa: [true],
      // Admin — solo en creación
      emailAdmin: ['', [Validators.email]],
      passwordAdmin: ['', [Validators.minLength(6)]],
      nombresAdmin: [''],
      apellidosAdmin: [''],
      documentoAdmin: [''],
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
  }

  ngOnChanges(): void {
    // Ajustar validators según modo
    const adminFields = [
      'emailAdmin',
      'passwordAdmin',
      'nombresAdmin',
      'apellidosAdmin',
      'documentoAdmin',
      'nombreSucursal',
    ];

    if (this.isEdit) {
      adminFields.forEach((f) => {
        this.frmEmpresa.get(f)?.clearValidators();
        this.frmEmpresa.get(f)?.updateValueAndValidity();
      });
      this.logoPreview = this.empresa!.logoUrl ?? null;
      this.frmEmpresa.patchValue({
        razonSocial: this.empresa!.razonSocial,
        nombreComercial: this.empresa!.nombreComercial,
        nit: this.empresa!.nit,
        dv: this.empresa!.dv,
        logoUrl: this.empresa!.logoUrl,
        telefono: this.empresa!.telefono,
        municipio: this.empresa!.municipio,
        municipioId: this.empresa!.municipioId,
        municipioObj: this.empresa!.municipio
          ? { id: this.empresa!.municipioId, label: this.empresa!.municipio }
          : null,
        activa: this.empresa!.activa,
        facturaElectronica: this.empresa!.facturaElectronica,
        factusClientId: this.empresa!.factusClientId,
        factusClientSecret: this.empresa!.factusClientSecret,
        factusUsername: this.empresa!.factusUsername,
        factusPassword: this.empresa!.factusPassword,
        factusNumberingRangeId: this.empresa!.factusNumberingRangeId,
        factusPrefijo: this.empresa!.factusPrefijo,
      });
    } else {
      // Crear — campos admin obligatorios
      this.frmEmpresa
        .get('emailAdmin')
        ?.setValidators([Validators.required, Validators.email]);
      this.frmEmpresa
        .get('passwordAdmin')
        ?.setValidators([Validators.required, Validators.minLength(6)]);
      this.frmEmpresa.get('nombresAdmin')?.setValidators([Validators.required]);
      this.frmEmpresa
        .get('apellidosAdmin')
        ?.setValidators([Validators.required]);
      this.frmEmpresa
        .get('documentoAdmin')
        ?.setValidators([Validators.required]);
      this.frmEmpresa
        .get('nombreSucursal')
        ?.setValidators([Validators.required]);
      adminFields.forEach((f) =>
        this.frmEmpresa.get(f)?.updateValueAndValidity(),
      );
      this.logoPreview = null;
      this.frmEmpresa.reset({
        razonSocial: '',
        nombreComercial: null,
        nit: '',
        dv: null,
        logoUrl: null,
        telefono: null,
        municipioObj: null,
        municipio: null,
        municipioId: null,
        activa: true,
        emailAdmin: '',
        passwordAdmin: '',
        nombresAdmin: '',
        apellidosAdmin: '',
        documentoAdmin: '',
        nombreSucursal: 'Sede Principal',
        facturaElectronica: false,
        factusClientId: '',
        factusClientSecret: '',
        factusUsername: '',
        factusPassword: '',
        factusNumberingRangeId: null,
        factusPrefijo: '',
      });
    }

    // Listener para validadores condicionales de Factus
    this.frmEmpresa.get('facturaElectronica')?.valueChanges.subscribe((val) => {
      const factusFields = [
        'factusClientId',
        'factusClientSecret',
        'factusUsername',
        'factusPassword',
        'factusNumberingRangeId',
        'factusPrefijo',
      ];
      factusFields.forEach((f) => {
        const control = this.frmEmpresa.get(f);
        if (val) {
          control?.setValidators([Validators.required]);
        } else {
          control?.clearValidators();
        }
        control?.updateValueAndValidity();
      });
    });
  }

  async save(): Promise<void> {
    if (this.frmEmpresa.invalid) {
      this.frmEmpresa.markAllAsTouched();
      return;
    }
    this.loading = true;
    try {
      if (this.isEdit) {
        const {
          razonSocial,
          nombreComercial,
          dv,
          logoUrl,
          telefono,
          municipio,
          municipioId,
          activa,
          facturaElectronica,
          factusClientId,
          factusClientSecret,
          factusUsername,
          factusPassword,
          factusNumberingRangeId,
          factusPrefijo,
        } = this.frmEmpresa.value;
        await lastValueFrom(
          this.service.actualizar(this.empresa!.id, {
            razonSocial,
            nombreComercial,
            dv,
            logoUrl,
            telefono,
            municipio,
            municipioId,
            activa,
            facturaElectronica,
            factusClientId,
            factusClientSecret,
            factusUsername,
            factusPassword,
            factusNumberingRangeId,
            factusPrefijo,
          }),
        );
        this.alert.showSuccess('Actualizada', 'Empresa actualizada');
      } else {
        const {
          razonSocial,
          nombreComercial,
          nit,
          dv,
          logoUrl,
          telefono,
          municipio,
          municipioId,
          emailAdmin,
          passwordAdmin,
          nombresAdmin,
          apellidosAdmin,
          documentoAdmin,
          nombreSucursal,
          facturaElectronica,
          factusClientId,
          factusClientSecret,
          factusUsername,
          factusPassword,
          factusNumberingRangeId,
          factusPrefijo,
        } = this.frmEmpresa.value;
        const response = await lastValueFrom(
          this.service.crear({
            razonSocial,
            nombreComercial,
            nit,
            dv,
            logoUrl,
            telefono,
            municipio,
            municipioId,
            emailAdmin,
            passwordAdmin,
            nombresAdmin,
            apellidosAdmin,
            documentoAdmin,
            nombreSucursal,
            facturaElectronica,
            factusClientId,
            factusClientSecret,
            factusUsername,
            factusPassword,
            factusNumberingRangeId,
            factusPrefijo,
          }),
        );
        this.credencialesCreadas.emit(response?.data);
      }
      this.saved.emit();
    } catch (err: any) {
      this.alert.showError('Error', err?.message ?? 'No se pudo guardar');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async onLogoSelect(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingLogo = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.storageService.uploadImagen(file, 'empresas'),
      );
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

  async buscarMunicipios(event: { query: string }): Promise<void> {
    try {
      const res = await lastValueFrom(
        this.terceroService.buscarMunicipios(event.query),
      );
      this.municipioSugerencias = res?.data ?? [];
    } catch {
      this.municipioSugerencias = [];
    }
  }

  onMunicipioSelect(event: AutoCompleteSelectEvent): void {
    const municipio = event.value as MunicipioDto;
    this.frmEmpresa.patchValue({
      municipio: municipio.label,
      municipioId: municipio.id,
    });
  }

  onMunicipioClear(): void {
    this.frmEmpresa.patchValue({ municipio: null, municipioId: null });
  }

  isInvalid(f: string): boolean {
    const c = this.frmEmpresa.get(f);
    return !!(c?.invalid && c?.touched);
  }
}
