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
import { lastValueFrom } from 'rxjs';
import { EmpresaPlataformaModel } from '../../../core/models/platform.model';
import { PlatformService } from '../../../core/services/platform.service';
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
  ],
  templateUrl: './form-empresa.component.html',
  styleUrls: ['./form-empresa.component.scss'],
})
export class FormEmpresaComponent implements OnChanges {
  @Input() empresa: EmpresaPlataformaModel | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  frmEmpresa: FormGroup;
  loading = false;

  get isEdit(): boolean {
    return !!this.empresa;
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: PlatformService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.frmEmpresa = this.fb.group({
      // Empresa
      razonSocial: ['', [Validators.required, Validators.maxLength(200)]],
      nombreComercial: [null],
      nit: ['', [Validators.required, Validators.maxLength(20)]],
      dv: [null, Validators.maxLength(2)],
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
      this.frmEmpresa.patchValue({
        razonSocial: this.empresa!.razonSocial,
        nombreComercial: this.empresa!.nombreComercial,
        nit: this.empresa!.nit,
        dv: this.empresa!.dv,
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
      this.frmEmpresa.reset({
        razonSocial: '',
        nombreComercial: null,
        nit: '',
        dv: null,
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
        await lastValueFrom(this.service.crear(this.frmEmpresa.value));
        this.alert.showSuccess(
          'Creada',
          'Empresa y usuario administrador creados',
        );
      }
      this.saved.emit();
    } catch (err: any) {
      this.alert.showError('Error', err?.message ?? 'No se pudo guardar');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  isInvalid(f: string): boolean {
    const c = this.frmEmpresa.get(f);
    return !!(c?.invalid && c?.touched);
  }
}
