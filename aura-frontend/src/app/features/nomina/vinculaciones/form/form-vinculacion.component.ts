import { Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { ContratoTableModel } from '../../../../core/models/contrato.model';
import {
  CONTRATOS_CON_FIN,
  NominaCargoModel,
  OPCIONES_FRECUENCIA,
  OPCIONES_REMUNERACION,
  OPCIONES_TIPO_CONTRATO,
  TipoContrato,
  TipoVinculacionModel,
} from '../../../../core/models/nomina-parametros.model';
import {
  OPCIONES_ACTO_ADMINISTRATIVO,
  CreateVinculacionDto,
  TipoSoporteVinculacion,
  VinculacionModel,
} from '../../../../core/models/vinculacion.model';
import { NominaCargoService } from '../../../../core/services/nomina-cargo.service';
import { NominaCatalogoService } from '../../../../core/services/nomina-catalogo.service';
import { NominaService } from '../../../../core/services/nomina.service';
import { NominaTipoVinculacionService } from '../../../../core/services/nomina-tipo-vinculacion.service';
import { SucursalService } from '../../../../core/services/sucursal.service';
import { VinculacionService } from '../../../../core/services/vinculacion.service';
import { TerceroAutocompleteComponent } from '../../../../shared/components/tercero-autocomplete/tercero-autocomplete.component';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { aDate, aFechaLocal } from '../../../../shared/utils/fecha.util';
import { AfiliacionesComponent } from '../../contratos/afiliaciones/afiliaciones.component';
import { EmbargosComponent } from '../../contratos/embargos/embargos.component';
import { RetefuenteComponent } from '../../contratos/retefuente/retefuente.component';
import { LugarSelectComponent } from '../../../../shared/components/lugar-select/lugar-select.component';
import { CentrosCostoVinculacionComponent } from '../tabs/centros-costo-vinculacion.component';
import { ConceptosVinculacionComponent } from '../tabs/conceptos-vinculacion.component';
import { HistorialVinculacionComponent } from '../tabs/historial-vinculacion.component';
import { NovedadesPermitidasVinculacionComponent } from '../tabs/novedades-permitidas-vinculacion.component';
import { HistorialSalarioComponent } from '../../contratos/historial/historial-salario.component';
import { NominaConfigModel } from '../../../../core/models/nomina.model';
import {
  OPCIONES_COTIZANTE,
  apoyoAprendiz,
  textoApoyoAprendiz,
  OPCIONES_FASE,
  OPCIONES_SUBTIPO,
  aContratoTabla,
  finPruebaMaximo,
  severidadEstado,
  textoEstado,
} from '../vinculacion.util';

interface Opcion<T = number> {
  label: string;
  value: T;
}

/**
 * Crear o editar una vinculación, en una página con pestañas: General,
 * Ubicación y jerarquía, Seguridad social y Soporte. El salario solo se pone al
 * crear; después se cambia con historial (diálogo de salario).
 */
@Component({
  selector: 'app-form-vinculacion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CalendarModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TabViewModule,
    TagModule,
    TextareaModule,
    TooltipModule,
    AfiliacionesComponent,
    EmbargosComponent,
    RetefuenteComponent,
    LugarSelectComponent,
    CentrosCostoVinculacionComponent,
    ConceptosVinculacionComponent,
    NovedadesPermitidasVinculacionComponent,
    HistorialVinculacionComponent,
    HistorialSalarioComponent,
    TerceroAutocompleteComponent,
  ],
  templateUrl: './form-vinculacion.component.html',
  styleUrls: ['./form-vinculacion.component.scss'],
})
export class FormVinculacionComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  readonly opcionesContrato = OPCIONES_TIPO_CONTRATO.filter((o) => o.value !== null);
  readonly opcionesRemuneracion = OPCIONES_REMUNERACION;
  readonly opcionesFrecuencia = OPCIONES_FRECUENCIA;
  readonly opcionesFase = OPCIONES_FASE;
  readonly opcionesCotizante = OPCIONES_COTIZANTE;
  readonly opcionesSubtipo = OPCIONES_SUBTIPO;
  readonly opcionesActo = OPCIONES_ACTO_ADMINISTRATIVO;

  /** Pestaña de historial: se recarga al cambiar el salario. */
  @ViewChild(HistorialVinculacionComponent) private historial?: HistorialVinculacionComponent;
  readonly opcionesSiNo = [
    { label: 'Sí', value: true },
    { label: 'No', value: false },
  ];

  form: FormGroup;
  vinculacion: VinculacionModel | null = null;
  cargando = true;
  guardando = false;
  subiendo: TipoSoporteVinculacion | null = null;
  tabActiva = 0;

  /** Nombres de los terceros ya elegidos (el buscador no los busca en una lista). */
  empleadoLabel: string | null = null;
  jefeLabel: string | null = null;
  evaluadorLabel: string | null = null;
  tipos: TipoVinculacionModel[] = [];
  cargos: NominaCargoModel[] = [];
  grupos: Opcion[] = [];
  calendarios: Opcion[] = [];
  riesgos: Opcion[] = [];
  sucursales: Opcion[] = [];

  /** Configuración de nómina: SMMLV y % de apoyo del aprendiz. */
  private config: NominaConfigModel | null = null;

  /** Diálogo de cambio de salario (reutiliza el de contratos). */
  mostrarSalario = false;
  contratoSalario: ContratoTableModel | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: VinculacionService,
    private readonly tiposService: NominaTipoVinculacionService,
    private readonly cargosService: NominaCargoService,
    private readonly catalogos: NominaCatalogoService,
    private readonly nomina: NominaService,
    private readonly sucursalService: SucursalService,
    private readonly alert: AlertService,
  ) {
    this.form = this.fb.group({
      terceroId: [null as number | null, Validators.required],
      tipoVinculacionId: [null as number | null, Validators.required],
      cargoId: [null as number | null, Validators.required],
      grupoNominaId: [null as number | null],
      tipoContrato: ['INDEFINIDO' as TipoContrato, Validators.required],
      temporal: [false],
      tipoRemuneracion: ['MENSUAL', Validators.required],
      salarioBase: [null as number | null, [Validators.required, Validators.min(1)]],
      frecuenciaPago: ['MENSUAL', Validators.required],
      horasSemana: [null as number | null, [Validators.min(1), Validators.max(48)]],
      calendarioId: [null as number | null],
      fechaInicio: [null as Date | null, Validators.required],
      fechaFin: [null as Date | null],
      tienePrueba: [false],
      fechaFinPrueba: [null as Date | null],
      fase: [null as string | null],
      esPrincipal: [true],
      primerEmpleo: [false],
      sucursalId: [null as number | null],
      area: ['', Validators.maxLength(100)],
      // País solo para el select de lugar; se guarda el municipio.
      codigoPaisTrabajo: ['CO'],
      municipioTrabajoId: [null as number | null],
      direccionTrabajo: ['', Validators.maxLength(200)],
      telefonoTrabajo: ['', Validators.maxLength(30)],
      jefeDirectoTerceroId: [null as number | null],
      evaluadorTerceroId: [null as number | null],
      tipoCotizante: ['01' as string | null],
      subtipoCotizante: [null as string | null],
      riesgoArlId: [null as number | null],
      enExtranjero: [false],
      docInternoTipo: [null as string | null],
      docInternoNumero: ['', Validators.maxLength(50)],
      docInternoFecha: [null as Date | null],
      observacion: ['', Validators.maxLength(500)],
    });
  }

  get esEdicion(): boolean {
    return !!this.vinculacion;
  }

  /** Retirada: se consulta pero no se modifica. */
  get retirada(): boolean {
    return this.vinculacion?.estado === 'TERMINADO';
  }

  get esAprendiz(): boolean {
    return this.form.get('tipoContrato')?.value === 'APRENDIZAJE';
  }

  /** El contrato o el tipo de vinculación exigen fecha de terminación. */
  get exigeFechaFin(): boolean {
    const tipo = this.tipos.find((t) => t.id === this.form.get('tipoVinculacionId')?.value);
    return CONTRATOS_CON_FIN.includes(this.form.get('tipoContrato')?.value) || !!tipo?.exigeFechaFin;
  }

  get opcionesTipos(): Opcion[] {
    return this.tipos.map((t) => ({ label: t.nombre, value: t.id }));
  }

  get opcionesCargos(): Opcion[] {
    return this.cargos.map((c) => ({ label: c.nombre, value: c.id }));
  }

  /** De dónde sale el salario del aprendiz (solo en alta). */
  get ayudaApoyoAprendiz(): string | null {
    if (this.esEdicion || !this.esAprendiz) return null;
    return textoApoyoAprendiz(this.config, this.form.get('fase')?.value);
  }

  /** Rango salarial del cargo elegido, como ayuda junto al salario. */
  get rangoCargo(): string | null {
    const c = this.cargos.find((k) => k.id === this.form.get('cargoId')?.value);
    if (!c || (c.salarioMinimo == null && c.salarioMaximo == null)) return null;
    const f = (v: number | null) => (v == null ? '…' : v.toLocaleString('es-CO', { maximumFractionDigits: 0 }));
    return `Rango del cargo: $${f(c.salarioMinimo)} – $${f(c.salarioMaximo)}`;
  }

  textoEstado = textoEstado;
  severidadEstado = severidadEstado;

  async ngOnInit(): Promise<void> {
    this.engancharSugerencias();
    await this.cargarCatalogos();
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) await this.cargarVinculacion(id);
    else await this.preseleccionarEmpleado();
    this.cargando = false;
  }

  /** Al elegir tipo o cargo se proponen sus valores (el usuario puede cambiarlos). */
  private engancharSugerencias(): void {
    this.form
      .get('tipoVinculacionId')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id: number | null) => {
        const t = this.tipos.find((x) => x.id === id);
        if (!t) return;
        this.form.patchValue({
          tipoContrato: t.tipoContrato ?? this.form.get('tipoContrato')?.value,
          tipoRemuneracion: t.tipoRemuneracion,
          frecuenciaPago: t.frecuenciaPago,
        });
      });
    this.form
      .get('cargoId')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id: number | null) => {
        const c = this.cargos.find((x) => x.id === id);
        if (this.esAprendiz) return;   // al aprendiz lo manda el apoyo de su etapa
        if (c?.salarioReferencia != null && !this.esEdicion && !this.form.get('salarioBase')?.value)
          this.form.patchValue({ salarioBase: c.salarioReferencia });
      });
    // Aprendiz: al elegir la etapa (o el contrato de aprendizaje) se carga el apoyo
    // de sostenimiento, para que nadie tenga que sacar la cuenta.
    this.form
      .get('fase')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.aplicarApoyoAprendiz());
    this.form
      .get('tipoContrato')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.aplicarApoyoAprendiz());
  }

  /** Pone el apoyo de la etapa como salario (solo en alta; el usuario puede subirlo). */
  private aplicarApoyoAprendiz(): void {
    if (this.esEdicion || !this.esAprendiz) return;
    const apoyo = apoyoAprendiz(this.config, this.form.get('fase')?.value);
    if (apoyo != null) this.form.patchValue({ salarioBase: apoyo }, { emitEvent: false });
  }

  private async cargarCatalogos(): Promise<void> {
    try {
      const [tipos, cargos, grupos, cal, arl, suc, config] = await Promise.all([
        lastValueFrom(this.tiposService.activos()),
        lastValueFrom(this.cargosService.activos()),
        lastValueFrom(this.catalogos.activos('grupos-nomina')),
        lastValueFrom(this.catalogos.activos('calendarios-laborales')),
        lastValueFrom(this.catalogos.activos('riesgos-arl')),
        lastValueFrom(this.sucursalService.getActivas()),
        lastValueFrom(this.nomina.getConfig()).catch(() => null),
      ]);
      this.config = config?.data ?? null;
      this.tipos = tipos.data ?? [];
      this.cargos = cargos.data ?? [];
      this.grupos = (grupos.data ?? []).map((g) => ({ label: g.nombre, value: g.id }));
      this.calendarios = (cal.data ?? []).map((g) => ({ label: g.nombre, value: g.id }));
      this.riesgos = (arl.data ?? []).map((g) => ({ label: g.nombre, value: g.id }));
      this.sucursales = (suc.data ?? []).map((s) => ({ label: s.nombre, value: s.id }));
    } catch {
      this.alert.showError('Vinculación', 'No se pudieron cargar los catálogos del formulario.');
    }
  }

  private async cargarVinculacion(id: number): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.obtener(id));
      this.aplicar(res.data);
    } catch (err: any) {
      this.alert.showError('Vinculación', err?.error?.message ?? 'No se encontró la vinculación.');
      this.volver();
    }
  }

  /** Pone la vinculación en el formulario sin disparar las sugerencias. */
  private aplicar(v: VinculacionModel): void {
    this.vinculacion = v;
    this.empleadoLabel = `${v.empleadoDocumento} — ${v.empleadoNombre}`;
    this.jefeLabel = v.jefeDirectoNombre;
    this.evaluadorLabel = v.evaluadorNombre;
    this.form.patchValue(
      {
        ...v,
        fechaInicio: aDate(v.fechaInicio),
        fechaFin: aDate(v.fechaFin),
        fechaFinPrueba: aDate(v.fechaFinPrueba),
        tienePrueba: !!v.fechaFinPrueba,
        docInternoFecha: aDate(v.docInternoFecha),
        frecuenciaPago: v.frecuenciaPago ?? 'MENSUAL',
      },
      { emitEvent: false },
    );
    this.form.get('terceroId')?.disable({ emitEvent: false });
    this.form.get('salarioBase')?.disable({ emitEvent: false });
    if (v.estado === 'TERMINADO') this.form.disable({ emitEvent: false });
  }

  /** Desde la ficha del empleado se llega con ?empleadoId=…: se busca su tercero. */
  private async preseleccionarEmpleado(): Promise<void> {
    const empleadoId = Number(this.route.snapshot.queryParamMap.get('empleadoId'));
    if (!empleadoId) return;
    try {
      const res = await lastValueFrom(this.nomina.getEmpleadoById(empleadoId));
      const e = res.data;
      if (!e?.terceroId) return;
      this.empleadoLabel = `${e.numeroDocumento} — ${e.nombres} ${e.apellidos}`;
      this.form.patchValue({ terceroId: e.terceroId });
    } catch {
      // Si no se encuentra, el usuario lo busca a mano.
    }
  }

  /** Propone el máximo legal del período de prueba. */
  sugerirPrueba(): void {
    const v = this.form.getRawValue();
    this.form.patchValue({ fechaFinPrueba: finPruebaMaximo(v.fechaInicio, v.fechaFin) });
  }

  abrirSalario(): void {
    if (!this.vinculacion) return;
    this.contratoSalario = aContratoTabla(this.vinculacion);
    this.mostrarSalario = true;
  }

  async onSalarioCambiado(): Promise<void> {
    if (this.vinculacion) await this.cargarVinculacion(this.vinculacion.id);
    void this.historial?.cargar();
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.alert.showWarn('Vinculación', 'Revise los campos marcados en las pestañas.');
      return;
    }
    if (this.exigeFechaFin && !this.form.get('fechaFin')?.value) {
      this.tabActiva = 0;
      this.alert.showWarn('Vinculación', 'Este contrato exige fecha de terminación.');
      return;
    }

    this.guardando = true;
    try {
      const dto = this.aDto();
      const res = await lastValueFrom(
        this.esEdicion ? this.service.actualizar(this.vinculacion!.id, dto) : this.service.crear(dto),
      );
      this.alert.showSuccess('Vinculación', `${res.data.codigo ?? 'Vinculación'} guardada`);
      if (this.esEdicion) this.aplicar(res.data);
      else void this.router.navigate(['/nomina/vinculaciones', res.data.id], { replaceUrl: true });
    } catch (err: any) {
      this.alert.showError('No se pudo guardar', err?.error?.message ?? 'Revise los datos.');
    } finally {
      this.guardando = false;
    }
  }

  private aDto(): CreateVinculacionDto {
    const v = this.form.getRawValue();
    const texto = (s: string | null) => s?.trim() || null;
    return {
      terceroId: v.terceroId,
      tipoVinculacionId: v.tipoVinculacionId,
      cargoId: v.cargoId,
      grupoNominaId: v.grupoNominaId,
      tipoContrato: v.tipoContrato,
      temporal: !!v.temporal,
      tipoRemuneracion: v.tipoRemuneracion,
      salarioBase: this.esEdicion ? null : v.salarioBase,
      frecuenciaPago: v.frecuenciaPago,
      horasSemana: v.horasSemana,
      calendarioId: v.calendarioId,
      fechaInicio: aFechaLocal(v.fechaInicio)!,
      fechaFin: aFechaLocal(v.fechaFin),
      fechaFinPrueba: v.tienePrueba ? aFechaLocal(v.fechaFinPrueba) : null,
      fase: v.tipoContrato === 'APRENDIZAJE' ? v.fase : null,
      esPrincipal: v.esPrincipal !== false,
      primerEmpleo: !!v.primerEmpleo,
      sucursalId: v.sucursalId,
      area: texto(v.area),
      municipioTrabajoId: v.municipioTrabajoId,
      direccionTrabajo: texto(v.direccionTrabajo),
      telefonoTrabajo: texto(v.telefonoTrabajo),
      jefeDirectoTerceroId: v.jefeDirectoTerceroId,
      evaluadorTerceroId: v.evaluadorTerceroId,
      tipoCotizante: v.tipoCotizante,
      subtipoCotizante: v.subtipoCotizante,
      riesgoArlId: v.riesgoArlId,
      enExtranjero: !!v.enExtranjero,
      docInternoTipo: v.docInternoTipo,
      docInternoNumero: texto(v.docInternoNumero),
      docInternoFecha: aFechaLocal(v.docInternoFecha),
      observacion: texto(v.observacion),
    };
  }

  async subir(tipo: TipoSoporteVinculacion, evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo || !this.vinculacion) return;
    this.subiendo = tipo;
    try {
      const res = await lastValueFrom(this.service.subirSoporte(this.vinculacion.id, tipo, archivo));
      this.vinculacion = res.data;
      this.alert.showSuccess('Soporte', 'Archivo cargado');
    } catch (err: any) {
      this.alert.showError('Soporte', err?.error?.message ?? 'No se pudo cargar el archivo.');
    } finally {
      this.subiendo = null;
    }
  }

  volver(): void {
    void this.router.navigate(['/nomina/vinculaciones']);
  }

  invalido(campo: string): boolean {
    const c = this.form.get(campo);
    return !!(c?.invalid && c?.touched);
  }
}
