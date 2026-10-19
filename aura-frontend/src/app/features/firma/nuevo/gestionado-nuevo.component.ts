import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { lastValueFrom } from 'rxjs';

import { TIPO_DOCUMENTO_OPTIONS } from '../../../core/models/tercero.model';
import {
  CrearGestionado,
  FirmaContableService,
  PaqueteGestionado,
  TipoPersona,
} from '../../../core/services/firma-contable.service';
import { TerceroService } from '../../../core/services/tercero.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { TIPO_PERSONA_OPTS, llevaDv, tiposDocumentoPara } from '../identidad-opciones';

/**
 * Nuevo cliente gestionado (docs/PLAN_FIRMA_CONTABLE.md §9): la firma crea la empresa
 * de un cliente que no usa Aura, elige sus módulos (sin POS, caja ni inventario) y,
 * si quiere, un usuario de consulta para que el cliente vea el estado de su empresa.
 */
@Component({
  selector: 'app-gestionado-nuevo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CheckboxModule,
    DropdownModule,
    InputTextModule,
    PasswordModule,
  ],
  templateUrl: './gestionado-nuevo.component.html',
  styleUrls: ['./gestionado-nuevo.component.scss'],
})
export class GestionadoNuevoComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(FirmaContableService);
  private readonly terceroService = inject(TerceroService);
  private readonly alert = inject(AlertService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly tipoDocOpts = TIPO_DOCUMENTO_OPTIONS;
  readonly tipoPersonaOpts = TIPO_PERSONA_OPTS;
  readonly consultaOpts = [
    { label: 'No, solo la firma entra', value: false },
    { label: 'Sí, crear un usuario de consulta', value: true },
  ];

  form: FormGroup;
  catalogo: PaqueteGestionado[] = [];
  paquetes: string[] = ['CONTABILIDAD'];
  guardando = false;
  intento = false;

  municipioOpts: { label: string; value: number }[] = [];
  municipioLoading = false;
  private municipioTimer: any;

  constructor() {
    this.form = this.fb.group({
      tipoPersona: ['JURIDICA' as TipoPersona],
      tipoDocumento: ['NIT'],
      razonSocial: ['', [Validators.required, Validators.maxLength(200)]],
      nombres: ['', Validators.maxLength(120)],
      apellidos: ['', Validators.maxLength(120)],
      nombreComercial: [''],
      nit: ['', [Validators.required, Validators.maxLength(20)]],
      dv: ['', Validators.maxLength(2)],
      telefono: ['', Validators.maxLength(30)],
      correo: ['', [Validators.email, Validators.maxLength(150)]],
      direccion: ['', Validators.maxLength(200)],
      municipioId: [null as number | null],
      crearConsulta: [false],
      cNombres: [''],
      cApellidos: [''],
      cTipoDocumento: ['CC'],
      cDocumento: [''],
      cEmail: ['', Validators.email],
      cPassword: [''],
    });
    this.form.get('crearConsulta')?.valueChanges.subscribe((v) => this.validadoresConsulta(!!v));
    this.form.get('tipoPersona')?.valueChanges.subscribe((v) => this.validadoresPersona(v));
  }

  get esNatural(): boolean {
    return this.form.value.tipoPersona === 'NATURAL';
  }

  get tipoDocEmpresaOpts(): { label: string; value: string }[] {
    return tiposDocumentoPara(this.form.value.tipoPersona);
  }

  get conDv(): boolean {
    return llevaDv(this.form.value.tipoDocumento);
  }

  /** Jurídica: razón social y NIT. Natural: nombres y apellidos, con NIT o cédula. */
  private validadoresPersona(tipo: TipoPersona): void {
    const natural = tipo === 'NATURAL';
    this.form.get('razonSocial')?.setValidators(natural ? [Validators.maxLength(200)] : [Validators.required, Validators.maxLength(200)]);
    this.form.get('nombres')?.setValidators(natural ? [Validators.required, Validators.maxLength(120)] : [Validators.maxLength(120)]);
    this.form.get('apellidos')?.setValidators(natural ? [Validators.required, Validators.maxLength(120)] : [Validators.maxLength(120)]);
    if (!natural) this.form.get('tipoDocumento')?.setValue('NIT');
    ['razonSocial', 'nombres', 'apellidos'].forEach((c) => this.form.get(c)?.updateValueAndValidity());
  }

  get crearConsulta(): boolean {
    return !!this.form.value.crearConsulta;
  }

  async ngOnInit(): Promise<void> {
    this.cargarMunicipios('');
    try {
      const res = await lastValueFrom(this.service.paquetes());
      this.catalogo = res?.data ?? [];
    } catch {
      this.catalogo = [];
    }
    this.cdr.markForCheck();
  }

  private validadoresConsulta(si: boolean): void {
    const req = si ? [Validators.required] : [];
    this.form.get('cNombres')?.setValidators(req);
    this.form.get('cDocumento')?.setValidators(req);
    this.form.get('cEmail')?.setValidators(si ? [Validators.required, Validators.email] : [Validators.email]);
    this.form.get('cPassword')?.setValidators(si ? [Validators.required, Validators.minLength(6)] : []);
    ['cNombres', 'cDocumento', 'cEmail', 'cPassword'].forEach((c) => this.form.get(c)?.updateValueAndValidity());
  }

  elegido(codigo: string): boolean {
    return this.paquetes.includes(codigo);
  }

  toggle(codigo: string, marcado: boolean): void {
    if (codigo === 'CONTABILIDAD') return;
    this.paquetes = marcado ? [...this.paquetes, codigo] : this.paquetes.filter((x) => x !== codigo);
  }

  invalido(c: string): boolean {
    const ctrl = this.form.get(c);
    return !!(ctrl?.invalid && (ctrl.touched || this.intento));
  }

  async guardar(): Promise<void> {
    this.intento = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.alert.showError('Revise el formulario', 'Hay campos obligatorios sin completar.');
      this.cdr.markForCheck();
      return;
    }
    const v = this.form.value;
    const municipio = this.municipioOpts.find((o) => o.value === v.municipioId)?.label ?? null;
    const natural = v.tipoPersona === 'NATURAL';
    const dto: CrearGestionado = {
      tipoPersona: v.tipoPersona,
      tipoDocumento: v.tipoDocumento,
      razonSocial: natural ? null : this.texto(v.razonSocial),
      nombres: natural ? this.texto(v.nombres) : null,
      apellidos: natural ? this.texto(v.apellidos) : null,
      nombreComercial: this.texto(v.nombreComercial),
      nit: v.nit.trim(),
      dv: llevaDv(v.tipoDocumento) ? this.texto(v.dv) : null,
      telefono: this.texto(v.telefono),
      correo: this.texto(v.correo),
      direccion: this.texto(v.direccion),
      municipio,
      municipioId: v.municipioId ?? null,
      paquetes: this.paquetes,
      usuarioConsulta: v.crearConsulta
        ? {
            nombres: v.cNombres.trim(),
            apellidos: this.texto(v.cApellidos),
            tipoDocumento: v.cTipoDocumento,
            documento: v.cDocumento.trim(),
            email: v.cEmail.trim(),
            password: v.cPassword,
          }
        : null,
    };
    this.guardando = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(this.service.crearGestionado(dto));
      this.alert.showSuccess(
        'Cliente creado',
        `${natural ? `${dto.nombres} ${dto.apellidos}` : dto.razonSocial} ya aparece en "Cambiar empresa". Se cargó su plan de cuentas.`,
      );
      this.router.navigate(['/firma/clientes']);
    } catch (err: any) {
      this.alert.showError('No se pudo crear', err?.error?.message ?? 'Intente de nuevo.');
    } finally {
      this.guardando = false;
      this.cdr.markForCheck();
    }
  }

  volver(): void {
    this.router.navigate(['/firma/clientes']);
  }

  onMunicipioFilter(event: { filter: string }): void {
    if (this.municipioTimer) clearTimeout(this.municipioTimer);
    this.municipioTimer = setTimeout(() => this.cargarMunicipios(event.filter ?? ''), 250);
  }

  private async cargarMunicipios(q: string): Promise<void> {
    this.municipioLoading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.terceroService.buscarMunicipios(q));
      const opts = (res?.data ?? []).map((m: any) => ({ label: m.label || m.nombre, value: m.id }));
      const sel = this.form.get('municipioId')?.value as number | null;
      const actual = this.municipioOpts.find((o) => o.value === sel);
      if (actual && !opts.some((o: any) => o.value === sel)) opts.unshift(actual);
      this.municipioOpts = opts;
    } catch {
      this.municipioOpts = [];
    } finally {
      this.municipioLoading = false;
      this.cdr.markForCheck();
    }
  }

  private texto(v: unknown): string | null {
    const s = typeof v === 'string' ? v.trim() : '';
    return s ? s : null;
  }
}
