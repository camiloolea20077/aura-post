import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  Output,
  EventEmitter,
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
import { CalendarModule } from 'primeng/calendar';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { lastValueFrom } from 'rxjs';

import {
  CreateTerceroDto,
  RESPONSABILIDAD_FISCAL_OPTIONS,
  SEXO_OPTS,
  TIPO_PERSONA_OPTIONS,
  REGIMEN_OPTIONS,
  TIPO_DOCUMENTO_OPTIONS,
} from '../../../core/models/tercero.model';
import { TerceroService } from '../../../core/services/tercero.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { TerceroPickerComponent } from '../../../shared/components/tercero-picker/tercero-picker.component';

/** Roles del tercero. BANCO es exclusivo (sin rol comercial). */
const ROL_OPTIONS = [
  { label: 'Cliente', value: 'CLIENTE' },
  { label: 'Proveedor', value: 'PROVEEDOR' },
  { label: 'Empleado', value: 'EMPLEADO' },
  { label: 'Banco / Entidad financiera', value: 'BANCO' },
  // Entidades de seguridad social (V120): son terceros a los que se les paga.
  { label: 'EPS (salud)', value: 'EPS' },
  { label: 'AFP (pensión)', value: 'AFP' },
  { label: 'CCF (caja de compensación)', value: 'CCF' },
  { label: 'ARL (riesgos laborales)', value: 'ARL' },
  { label: 'Cesantías (fondo)', value: 'CESANTIAS' },
];

/** Roles de seguridad social: los que exigen código UGPP. */
const ROLES_SS = ['EPS', 'AFP', 'CCF', 'ARL', 'CESANTIAS'];

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
    CalendarModule,
    TerceroPickerComponent,
  ],
  templateUrl: './form-tercero-plano.component.html',
  styleUrls: ['./form-tercero-plano.component.scss'],
})
export class FormTerceroPlanoComponent implements OnInit {
  /** Modo embebido: se usa dentro de otra página (p. ej. detalle de empleado).
   *  Oculta el header/footer de página y avisa por `guardado` en vez de navegar. */
  @Input() embedded = false;
  /** Id del tercero a cargar cuando se usa embebido (en vez del param de ruta). */
  @Input() terceroIdInput: number | null = null;
  /** Roles fijos (p. ej. ['EMPLEADO']) cuando el contexto ya define el tipo. */
  @Input() rolesFijos: string[] | null = null;
  /** Emite el id del tercero guardado (útil para el alta de empleado). */
  @Output() guardado = new EventEmitter<number>();

  frm!: FormGroup;
  isEdit = false;
  terceroId: number | null = null;
  saving = false;
  loading = false;

  readonly tipoDocOpts = TIPO_DOCUMENTO_OPTIONS;
  readonly tipoPersonaOpts = TIPO_PERSONA_OPTIONS;
  readonly sexoOpts = SEXO_OPTS;

  /** Tope de los datepicker: no se nace ni se expide un documento en el futuro. */
  readonly hoy = new Date();
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
    if (this.rolesFijos?.length) this.roles = [...this.rolesFijos];
    // Embebido: el id viene por Input; página normal: por la ruta.
    const id = this.terceroIdInput ?? this.route.snapshot.params['id'];
    if (id) {
      this.isEdit = true;
      this.terceroId = +id;
      this.loadData(this.terceroId);
    }
  }

  get esBanco(): boolean {
    return this.roles.includes('BANCO');
  }

  /** Empleado: se le paga la nómina, así que se piden datos bancarios. */
  get esEmpleado(): boolean {
    return this.roles.includes('EMPLEADO');
  }

  readonly tipoCuentaOpts = [
    { label: 'Ahorros', value: 'AHORROS' },
    { label: 'Corriente', value: 'CORRIENTE' },
  ];

  bancoNombre: string | null = null;

  onBancoSeleccionado(e: { id: number; nombre: string } | null): void {
    this.frm.patchValue({ bancoTerceroId: e?.id ?? null });
    this.bancoNombre = e?.nombre ?? null;
  }

  /** ¿Tiene algún rol de seguridad social? Ahí se pide el código UGPP. */
  get esEntidadSeguridadSocial(): boolean {
    return this.roles.some((r) => ROLES_SS.includes(r));
  }

  /**
   * Entidad "simple": banco o entidad de seguridad social. Es una persona
   * jurídica a la que solo se le paga; no necesita datos personales ni el
   * bloque fiscal (régimen, responsabilidad fiscal, autorretenciones…).
   */
  get esEntidadSimple(): boolean {
    return this.esBanco || this.esEntidadSeguridadSocial;
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

        // ── Identificación desagregada (Fase 1 / backend V97) ──────────
        // La DIAN y la UGPP exigen los cuatro componentes POR SEPARADO.
        // Se piden al usuario; NO se parten de `nombres` con split(' '):
        // eso falla con "DE LA ROSA" o nombres de una sola palabra.
        nombre1: [null, Validators.maxLength(40)],
        nombre2: [null, Validators.maxLength(40)],
        apellido1: [null, Validators.maxLength(40)],
        apellido2: [null, Validators.maxLength(40)],

        // ── Persona natural — requeridos por PILA ──────────────────────
        fechaNacimiento: [null],
        sexo: [null],
        fechaExpedicionDocumento: [null],
        municipioExpedicionId: [null],

        // ── Persona jurídica ──────────────────────────────────────────
        nombreComercial: [null, Validators.maxLength(150)],
        // Obligatorio en el encabezado de PILA cuando la empresa es aportante.
        representanteLegalNombre: [null, Validators.maxLength(150)],
        representanteLegalDocumento: [null, Validators.maxLength(30)],

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

        // ── Autorretención (Fase 1 / backend V97) ─────────────────────
        // `autoRetenedor` era uno solo, pero son autorretenciones DISTINTAS:
        // se puede ser de renta y no de ICA. Afecta las retenciones sugeridas.
        esAutoretenedorIca: [false],
        esAutoretenedorFuente: [false],
        declarante: [false],

        // ── Bancario (Fase 1 / backend V97) ───────────────────────────
        bancoTerceroId: [null],
        tipoCuenta: [null],
        numeroCuenta: [null, Validators.maxLength(50)],

        codigoCIIU: [null, Validators.maxLength(10)],
        actividadEconomica: [null, Validators.maxLength(200)],
        activo: [true],

        // ── Seguridad social (V120) — código UGPP si es EPS/AFP/CCF/ARL ──
        codigoSeguridadSocial: [null, Validators.maxLength(20)],
      },
      { validators: this.validarNombre },
    );
  }

  private validarNombre(g: AbstractControl) {
    const juridica = g.get('tipoPersona')?.value === 'JURIDICA';
    const razon = g.get('razonSocial')?.value;
    const nombres = g.get('nombres')?.value;
    const nombre1 = g.get('nombre1')?.value;
    if (juridica && !razon?.trim()) return { razonSocialRequerida: true };
    // Persona natural: vale el nombre desagregado O el legacy. No se exige
    // nombre1 todavía para no romper el alta de terceros existentes; se pide
    // en el formulario pero no se bloquea.
    if (!juridica && !nombres?.trim() && !nombre1?.trim()) return { nombresRequeridos: true };
    return null;
  }

  /**
   * Normaliza a 'YYYY-MM-DD'.
   *
   * El p-datepicker entrega un `Date`; el backend espera un `LocalDate`.
   * Mandar el ISO completo con hora hace que Jackson rechace el payload.
   */
  private aFecha(v: unknown): string | null {
    if (!v) return null;
    if (typeof v === 'string') return v.split('T')[0];
    if (v instanceof Date) {
      // No usar toISOString(): convierte a UTC y puede correr el día.
      const y = v.getFullYear();
      const m = String(v.getMonth() + 1).padStart(2, '0');
      const d = String(v.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
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
    // Una EPS/AFP/CCF/ARL es siempre persona jurídica con NIT: se setea solo
    // para que el usuario no tenga que hacerlo ni pueda equivocarse.
    if (this.esEntidadSeguridadSocial) {
      this.frm.patchValue({ tipoPersona: 'JURIDICA', tipoDocumento: 'NIT' });
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
        // Roles de seguridad social (V120): vienen en `roles`, no en booleanos.
        for (const r of ROLES_SS) {
          if (d.roles?.includes(r)) this.roles.push(r);
        }
        if (d.esBanco) this.roles = ['BANCO'];
        this.rolesPrevHadBanco = this.esBanco;
        // Sembrar la opción del municipio guardado para que el select lo muestre.
        // El nombre puede no venir en el tercero (no se persiste); si falta, se
        // resuelve por id para poder mostrar la etiqueta seleccionada.
        if (d.municipioId) {
          let nombre: string | null = d.municipio ?? null;
          if (!nombre) {
            try {
              const mRes = await lastValueFrom(this.service.getMunicipioById(d.municipioId));
              nombre = mRes?.data?.label ?? mRes?.data?.nombre ?? null;
            } catch {
              nombre = null;
            }
          }
          if (nombre && !this.municipioOpts.some((o) => o.value === d.municipioId)) {
            this.municipioOpts = [{ label: nombre, value: d.municipioId }, ...this.municipioOpts];
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

          // ── Fase 1 ────────────────────────────────────────────────
          nombre1: d.nombre1 ?? null,
          nombre2: d.nombre2 ?? null,
          apellido1: d.apellido1 ?? null,
          apellido2: d.apellido2 ?? null,
          fechaNacimiento: d.fechaNacimiento ?? null,
          sexo: d.sexo ?? null,
          fechaExpedicionDocumento: d.fechaExpedicionDocumento ?? null,
          municipioExpedicionId: d.municipioExpedicionId ?? null,
          nombreComercial: d.nombreComercial ?? null,
          representanteLegalNombre: d.representanteLegalNombre ?? null,
          representanteLegalDocumento: d.representanteLegalDocumento ?? null,
          esAutoretenedorIca: d.esAutoretenedorIca ?? false,
          // Compatibilidad: los terceros viejos solo tienen `autoRetenedor`.
          // El backend semilló `esAutoretenedorFuente` desde ese boolean (V97);
          // aquí se replica el fallback por si el registro es anterior.
          esAutoretenedorFuente: d.esAutoretenedorFuente ?? d.autoRetenedor ?? false,
          declarante: d.declarante ?? false,
          bancoTerceroId: d.bancoTerceroId ?? null,
          tipoCuenta: d.tipoCuenta ?? null,
          numeroCuenta: d.numeroCuenta ?? null,
          codigoSeguridadSocial: d.codigoSeguridadSocial ?? null,
        });
        // El selector de banco necesita el nombre para mostrarlo.
        this.bancoNombre = d.bancoTerceroNombre ?? null;
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
    if (this.esEntidadSeguridadSocial && !this.frm.get('codigoSeguridadSocial')?.value?.trim()) {
      this.alert.showWarn('Falta el código UGPP', 'Una EPS/AFP/CCF/ARL necesita su código oficial para PILA.');
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

    // El backend exige `nombres` (campo legacy, usado para mostrar el nombre).
    // Si el usuario solo llenó los campos desagregados de PILA (nombre1/apellido1),
    // se componen desde ahí para no mandar `nombres` en null y que no falle con
    // "Debe ingresar razón social o nombres".
    const unir = (...partes: (string | null | undefined)[]) =>
      partes.map((p) => p?.trim()).filter(Boolean).join(' ') || null;
    const nombresFinal = juridica
      ? null
      : v.nombres?.trim() || unir(v.nombre1, v.nombre2);
    const apellidosFinal = juridica
      ? null
      : v.apellidos?.trim() || unir(v.apellido1, v.apellido2);

    const dto: CreateTerceroDto & { esBanco: boolean } = {
      tipoDocumento: v.tipoDocumento,
      numeroDocumento: v.numeroDocumento.trim(),
      dv: juridica ? v.dv?.trim() || null : null,
      razonSocial: juridica ? v.razonSocial?.trim() || null : null,
      nombres: nombresFinal,
      apellidos: apellidosFinal,
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
      // Roles de seguridad social (V120): van por lista, no por booleano.
      roles: this.roles.filter((r) => ROLES_SS.includes(r)),
      codigoSeguridadSocial: this.esEntidadSeguridadSocial
        ? v.codigoSeguridadSocial?.trim() || null
        : null,
      activo: v.activo,
      tipoPersona: v.tipoPersona,
      regimen: v.regimen,
      granContribuyente: v.granContribuyente,
      autoRetenedor: v.autoRetenedor,
      codigoCIIU: v.codigoCIIU?.trim() || null,
      actividadEconomica: v.actividadEconomica?.trim() || null,
      pais: v.pais?.trim() || 'Colombia',
      codigoPais: 'CO',

      // ── Fase 1: identificación desagregada ────────────────────────
      // Solo para persona natural: una jurídica usa razón social.
      nombre1: !juridica ? v.nombre1?.trim() || null : null,
      nombre2: !juridica ? v.nombre2?.trim() || null : null,
      apellido1: !juridica ? v.apellido1?.trim() || null : null,
      apellido2: !juridica ? v.apellido2?.trim() || null : null,

      // ── Persona natural ───────────────────────────────────────────
      fechaNacimiento: !juridica ? this.aFecha(v.fechaNacimiento) : null,
      sexo: !juridica ? v.sexo || null : null,
      fechaExpedicionDocumento: !juridica ? this.aFecha(v.fechaExpedicionDocumento) : null,
      municipioExpedicionId: !juridica ? (v.municipioExpedicionId ?? null) : null,

      // ── Persona jurídica ──────────────────────────────────────────
      nombreComercial: v.nombreComercial?.trim() || null,
      representanteLegalNombre: juridica ? v.representanteLegalNombre?.trim() || null : null,
      representanteLegalDocumento: juridica ? v.representanteLegalDocumento?.trim() || null : null,

      // ── Fiscal ────────────────────────────────────────────────────
      esAutoretenedorIca: v.esAutoretenedorIca ?? false,
      esAutoretenedorFuente: v.esAutoretenedorFuente ?? false,
      declarante: v.declarante ?? false,

      // ── Bancario ──────────────────────────────────────────────────
      bancoTerceroId: v.bancoTerceroId ?? null,
      tipoCuenta: v.tipoCuenta || null,
      numeroCuenta: v.numeroCuenta?.trim() || null,
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
      this.guardado.emit(this.terceroId ?? undefined);
    } catch (err: any) {
      this.alert.showError('Error', err?.message ?? 'No se pudo guardar el tercero.');
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  cancelar(): void {
    if (this.embedded) return; // en embebido no hay a dónde volver
    this.router.navigate(['/terceros']);
  }
}
