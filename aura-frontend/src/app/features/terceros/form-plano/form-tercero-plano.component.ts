import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { lastValueFrom } from 'rxjs';

import {
  CreateTerceroDto,
  RESPONSABILIDAD_FISCAL_OPTIONS,
  TIPO_PERSONA_OPTIONS,
  REGIMEN_OPTIONS,
  TIPO_DOCUMENTO_OPTIONS,
} from '../../../core/models/tercero.model';
import { TerceroService } from '../../../core/services/tercero.service';
import { AlertService } from '../../../shared/pipes/alert.service';

/** Roles del tercero. BANCO es exclusivo (sin rol comercial). */
const ROL_OPTIONS = [
  { label: 'Cliente', value: 'CLIENTE' },
  { label: 'Proveedor', value: 'PROVEEDOR' },
  { label: 'Empleado', value: 'EMPLEADO' },
  { label: 'Banco / Entidad financiera', value: 'BANCO' },
];

@Component({
  selector: 'app-form-tercero-plano',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    MultiSelectModule,
    ToggleSwitchModule,
  ],
  templateUrl: './form-tercero-plano.component.html',
  styleUrls: ['./form-tercero-plano.component.scss'],
})
export class FormTerceroPlanoComponent implements OnInit {
  frm!: FormGroup;
  isEdit = false;
  terceroId: number | null = null;
  saving = false;
  loading = false;

  readonly tipoDocOpts = TIPO_DOCUMENTO_OPTIONS;
  readonly tipoPersonaOpts = TIPO_PERSONA_OPTIONS;
  readonly regimenOpts = REGIMEN_OPTIONS;
  readonly respFiscalOpts = RESPONSABILIDAD_FISCAL_OPTIONS;
  readonly rolOpts = ROL_OPTIONS;

  /** Roles seleccionados (multiselect). */
  roles: string[] = ['CLIENTE'];

  /** Opciones del select de municipio (carga progresiva). */
  municipioOpts: { label: string; value: number }[] = [];
  municipioLoading = false;
  private municipioTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: TerceroService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.cargarMunicipios('');
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit = true;
      this.terceroId = +id;
      this.loadData(this.terceroId);
    }
  }

  get esBanco(): boolean {
    return this.roles.includes('BANCO');
  }

  get esJuridica(): boolean {
    return this.frm?.get('tipoPersona')?.value === 'JURIDICA';
  }

  private initForm(): void {
    this.frm = this.fb.group(
      {
        tipoPersona: ['NATURAL', Validators.required],
        tipoDocumento: ['CC', Validators.required],
        numeroDocumento: [null, [Validators.required, Validators.maxLength(20)]],
        dv: [null, Validators.maxLength(2)],
        razonSocial: [null, Validators.maxLength(200)],
        nombres: [null, Validators.maxLength(100)],
        apellidos: [null, Validators.maxLength(100)],
        telefono: [null, Validators.maxLength(20)],
        email: [null, [Validators.email, Validators.maxLength(100)]],
        emailFe: [null, [Validators.email, Validators.maxLength(100)]],
        direccion: [null, Validators.maxLength(200)],
        pais: ['Colombia', Validators.maxLength(60)],
        municipioId: [null],
        responsabilidadFiscal: [null],
        regimen: ['NO_RESPONSABLE_IVA'],
        granContribuyente: [false],
        autoRetenedor: [false],
        codigoCIIU: [null, Validators.maxLength(10)],
        actividadEconomica: [null, Validators.maxLength(200)],
        activo: [true],
      },
      { validators: this.validarNombre },
    );
  }

  private validarNombre(g: AbstractControl) {
    const juridica = g.get('tipoPersona')?.value === 'JURIDICA';
    const razon = g.get('razonSocial')?.value;
    const nombres = g.get('nombres')?.value;
    if (juridica && !razon?.trim()) return { razonSocialRequerida: true };
    if (!juridica && !nombres?.trim()) return { nombresRequeridos: true };
    return null;
  }

  /** Banco es exclusivo: si se elige, limpia los demás (y viceversa). */
  onRolesChange(): void {
    if (this.roles.includes('BANCO') && this.roles.length > 1) {
      // Si acaban de agregar BANCO junto a otros, dejar solo BANCO.
      // Si BANCO ya estaba y agregan otro, quitar BANCO.
      const otros = this.roles.filter((r) => r !== 'BANCO');
      this.roles = otros.length > 0 && this.rolesPrevHadBanco ? otros : ['BANCO'];
    }
    this.rolesPrevHadBanco = this.roles.includes('BANCO');
    if (this.esBanco) {
      this.frm.patchValue({ tipoPersona: 'JURIDICA' });
    }
    this.cdr.markForCheck();
  }
  private rolesPrevHadBanco = false;

  onTipoPersonaChange(): void {
    if (this.esJuridica) {
      this.frm.patchValue({ nombres: null, apellidos: null });
    } else {
      this.frm.patchValue({ razonSocial: null, dv: null });
    }
  }

  /** Filtro del select: consulta al backend con debounce (carga poco a poco). */
  onMunicipioFilter(event: { filter: string }): void {
    if (this.municipioTimer) clearTimeout(this.municipioTimer);
    this.municipioTimer = setTimeout(() => this.cargarMunicipios(event.filter ?? ''), 250);
  }

  private async cargarMunicipios(query: string): Promise<void> {
    this.municipioLoading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.buscarMunicipios(query));
      const opts = (res?.data ?? []).map((m) => ({ label: m.label || m.nombre, value: m.id }));
      // Conserva la opción seleccionada actual aunque no venga en el filtro.
      const selId = this.frm?.get('municipioId')?.value as number | null;
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

  private async loadData(id: number): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.getById(id));
      const d = res?.data;
      if (d) {
        this.roles = [];
        if (d.esCliente) this.roles.push('CLIENTE');
        if (d.esProveedor) this.roles.push('PROVEEDOR');
        if (d.esEmpleado) this.roles.push('EMPLEADO');
        if (d.esBanco) this.roles = ['BANCO'];
        this.rolesPrevHadBanco = this.esBanco;
        // Sembrar la opción del municipio guardado para que el select lo muestre.
        if (d.municipioId && d.municipio) {
          const opt = { label: d.municipio, value: d.municipioId };
          if (!this.municipioOpts.some((o) => o.value === d.municipioId)) {
            this.municipioOpts = [opt, ...this.municipioOpts];
          }
        }
        this.frm.patchValue({
          tipoPersona: d.tipoPersona ?? 'NATURAL',
          tipoDocumento: d.tipoDocumento,
          numeroDocumento: d.numeroDocumento,
          dv: d.dv,
          razonSocial: d.razonSocial,
          nombres: d.nombres,
          apellidos: d.apellidos,
          telefono: d.telefono,
          email: d.email,
          emailFe: d.emailFe,
          direccion: d.direccion,
          pais: d.pais ?? 'Colombia',
          municipioId: d.municipioId ?? null,
          responsabilidadFiscal: d.responsabilidadFiscal,
          regimen: d.regimen ?? 'NO_RESPONSABLE_IVA',
          granContribuyente: d.granContribuyente ?? false,
          autoRetenedor: d.autoRetenedor ?? false,
          codigoCIIU: d.codigoCIIU,
          actividadEconomica: d.actividadEconomica,
          activo: d.activo,
        });
      }
    } catch {
      this.alert.showError('Error', 'No se pudo cargar el tercero.');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async guardar(): Promise<void> {
    if (this.roles.length === 0) {
      this.alert.showWarn('Falta el tipo', 'Selecciona al menos un tipo de tercero.');
      return;
    }
    if (this.frm.invalid) {
      this.frm.markAllAsTouched();
      const err = this.frm.errors;
      if (err?.['razonSocialRequerida'])
        return void this.alert.showWarn('Datos incompletos', 'Ingresa la razón social.');
      if (err?.['nombresRequeridos'])
        return void this.alert.showWarn('Datos incompletos', 'Ingresa el nombre del tercero.');
      this.alert.showWarn('Formulario incompleto', 'Revisa los campos requeridos.');
      return;
    }

    const v = this.frm.value;
    const juridica = this.esJuridica;
    const dto: CreateTerceroDto & { esBanco: boolean } = {
      tipoDocumento: v.tipoDocumento,
      numeroDocumento: v.numeroDocumento.trim(),
      dv: juridica ? v.dv?.trim() || null : null,
      razonSocial: juridica ? v.razonSocial?.trim() || null : null,
      nombres: !juridica ? v.nombres?.trim() || null : null,
      apellidos: !juridica ? v.apellidos?.trim() || null : null,
      telefono: v.telefono?.trim() || null,
      email: v.email?.trim() || null,
      emailFe: v.emailFe?.trim() || null,
      direccion: v.direccion?.trim() || null,
      municipioId: v.municipioId ?? null,
      municipio: this.municipioOpts.find((o) => o.value === v.municipioId)?.label ?? null,
      responsabilidadFiscal: v.responsabilidadFiscal || null,
      esCliente: this.roles.includes('CLIENTE'),
      esProveedor: this.roles.includes('PROVEEDOR'),
      esEmpleado: this.roles.includes('EMPLEADO'),
      esBanco: this.roles.includes('BANCO'),
      activo: v.activo,
      tipoPersona: v.tipoPersona,
      regimen: v.regimen,
      granContribuyente: v.granContribuyente,
      autoRetenedor: v.autoRetenedor,
      codigoCIIU: v.codigoCIIU?.trim() || null,
      actividadEconomica: v.actividadEconomica?.trim() || null,
      pais: v.pais?.trim() || 'Colombia',
      codigoPais: 'CO',
    };

    this.saving = true;
    this.cdr.markForCheck();
    try {
      const obs = this.isEdit
        ? this.service.update(this.terceroId!, { ...dto, id: this.terceroId! } as any)
        : this.service.create(dto as any);
      const res = await lastValueFrom(obs);
      this.alert.showSuccess(this.isEdit ? 'Tercero actualizado' : 'Tercero creado', '');
      // No navega: se queda en el formulario con los datos. Si era creación,
      // pasa a modo edición para que los siguientes guardados actualicen.
      if (!this.isEdit && res?.data?.id) {
        this.isEdit = true;
        this.terceroId = res.data.id;
      }
    } catch (err: any) {
      this.alert.showError('Error', err?.message ?? 'No se pudo guardar el tercero.');
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  cancelar(): void {
    this.router.navigate(['/terceros']);
  }
}
