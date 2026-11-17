import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CalendarModule } from 'primeng/calendar';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { lastValueFrom } from 'rxjs';

import { ConceptoService } from '../../../../core/services/concepto.service';
import { NominaCatalogoService } from '../../../../core/services/nomina-catalogo.service';
import {
  AfectadoPor,
  BASE_CONCEPTO_OPTS,
  CLASE_CONCEPTO_OPTS,
  ClaseConcepto,
  ConceptoFormDto,
  ConceptoModel,
  ConceptoTipoModel,
  ENTRADA_CONCEPTO_OPTS,
  FRECUENCIA_CONCEPTO_OPTS,
  OpcionConcepto,
  REDONDEO_MODO_OPTS,
  REDONDEO_PRECISION_OPTS,
  SI_NO_OPTS,
} from '../../../../core/models/concepto.model';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { aFechaLocal } from '../../../../shared/utils/fecha.util';
import { FechaEsPipe } from '../../../../shared/pipes/fecha-es.pipe';
import { severidadClase, textoCalculo } from '../concepto.util';
import { EditorFormulaComponent } from '../formula/editor-formula.component';
import { ConceptoContableComponent } from '../contable/concepto-contable.component';
import { CentroCostoService } from '../../../../core/services/centro-costo.service';

/**
 * Página de un concepto de nómina, con pestañas: Información general, Fórmula,
 * Afectado por, Hace base, Contable y Centros de costo.
 *
 * Un concepto de ley solo deja cambiar los datos descriptivos; al guardarlo, el
 * backend crea la versión de la empresa (con otro id) y la página se mueve a ella.
 * Las pestañas Afectado por, Contable y Centros de costo se completan en las
 * fases 2 y 7 del plan (docs/PLAN_CONCEPTOS_CARGOS_NOMINA.md en el backend).
 */
@Component({
  selector: 'app-concepto-pagina',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    CalendarModule,
    TabViewModule,
    TagModule,
    TextareaModule,
    FechaEsPipe,
    EditorFormulaComponent,
    ConceptoContableComponent,
  ],
  templateUrl: './concepto-pagina.component.html',
  styleUrls: ['./concepto-pagina.component.scss'],
})
export class ConceptoPaginaComponent implements OnInit {
  concepto: ConceptoModel | null = null;
  cargando = true;
  guardando = false;
  tabActiva = 0;

  form: FormGroup;

  readonly claseOpts = CLASE_CONCEPTO_OPTS;
  readonly entradaOpts = ENTRADA_CONCEPTO_OPTS;
  readonly frecuenciaOpts = FRECUENCIA_CONCEPTO_OPTS;
  readonly precisionOpts = REDONDEO_PRECISION_OPTS;
  readonly modoOpts = REDONDEO_MODO_OPTS;
  readonly baseOpts = BASE_CONCEPTO_OPTS;
  readonly siNoOpts = SI_NO_OPTS;
  readonly estadoOpts: OpcionConcepto<boolean>[] = [
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false },
  ];
  readonly severidadClase = severidadClase;
  readonly textoCalculo = textoCalculo;

  private tipos: ConceptoTipoModel[] = [];
  centroOpts: OpcionConcepto<number>[] = [];
  afectadoPor: AfectadoPor[] = [];
  tipoOpts: OpcionConcepto<number>[] = [];
  grupoOpts: OpcionConcepto<number>[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: ConceptoService,
    private readonly catalogos: NominaCatalogoService,
    private readonly centros: CentroCostoService,
    private readonly alert: AlertService,
  ) {
    this.form = this.fb.group({
      numero: [null as number | null, [Validators.required, Validators.min(1)]],
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      clase: ['DEVENGADO' as ClaseConcepto, Validators.required],
      tipoId: [null as number | null, Validators.required],
      entrada: ['NINGUNA'],
      frecuencia: ['CADA_PAGO'],
      redondeoPrecision: ['ENTERO'],
      redondeoModo: ['AUTOMATICO'],
      grupoId: [null as number | null],
      aplicaArt383: [false],
      activo: [true],
      codigoDian: [null as string | null],
      descripcion: [null as string | null],
      base: ['SALARIO'],
      porcentaje: [null as number | null],
      valorFijo: [null as number | null],
      orden: [100],
      constituyeIbc: [true],
      formula: [null as string | null],
      haceBasePrestacional: [false],
      centroCostoId: [null as number | null],
      vigenteDesde: [new Date() as Date | null],
    });
  }

  get esEdicion(): boolean {
    return this.concepto !== null;
  }

  /** De ley: clase, tipo, cálculo y estado los fija la ley. */
  get esDeLey(): boolean {
    return this.concepto?.deLey === true;
  }

  /** El valor sale de la fórmula del concepto. */
  get esFormula(): boolean {
    return this.form.getRawValue().base === 'FORMULA';
  }

  get esFijo(): boolean {
    return this.form.getRawValue().base === 'FIJO';
  }

  get esPorcentual(): boolean {
    return !['FIJO', 'MANUAL', 'NOVEDAD', 'FORMULA'].includes(this.form.getRawValue().base);
  }

  async ngOnInit(): Promise<void> {
    await this.cargarCatalogos();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.cargarConcepto(Number(id));
    } else {
      await this.proponerNumero();
      this.cargando = false;
    }
    this.form.get('clase')!.valueChanges.subscribe(() => this.filtrarTipos());
  }

  private async cargarCatalogos(): Promise<void> {
    try {
      const [tipos, grupos] = await Promise.all([
        lastValueFrom(this.service.tipos()),
        lastValueFrom(this.catalogos.activos('grupos-concepto')),
      ]);
      this.tipos = tipos.data ?? [];
      this.cargarCentros();
      this.grupoOpts = (grupos.data ?? []).map((g) => ({
        label: g.nombre,
        value: g.id,
      }));
      this.filtrarTipos();
    } catch {
      this.alert.showError(
        'Conceptos',
        'No se pudieron cargar los tipos y grupos.',
      );
    }
  }

  private async cargarConcepto(id: number): Promise<void> {
    this.cargando = true;
    try {
      const res = await lastValueFrom(this.service.obtener(id));
      this.concepto = res.data;
      this.llenarForm(res.data);
      void this.cargarAfectadoPor();
    } catch {
      this.alert.showError('Conceptos', 'No se encontró el concepto.');
      void this.router.navigate(['/nomina/conceptos']);
    } finally {
      this.cargando = false;
    }
  }

  private async proponerNumero(): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.siguienteNumero());
      this.form.patchValue({ numero: res.data });
    } catch {
      // El usuario lo escribe a mano.
    }
  }

  private llenarForm(c: ConceptoModel): void {
    this.form.reset({
      numero: c.numero,
      nombre: c.nombre,
      clase: c.clase,
      tipoId: c.tipoId,
      entrada: c.entrada,
      frecuencia: c.frecuencia,
      redondeoPrecision: c.redondeoPrecision,
      redondeoModo: c.redondeoModo,
      grupoId: c.grupoId,
      aplicaArt383: c.aplicaArt383,
      activo: c.activo,
      codigoDian: c.codigoDian,
      descripcion: c.descripcion,
      base: c.base,
      porcentaje: c.porcentaje,
      valorFijo: c.valorFijo,
      orden: c.orden,
      constituyeIbc: c.constituyeIbc,
      formula: c.formula,
      haceBasePrestacional: c.haceBasePrestacional,
      centroCostoId: c.centroCostoId,
      vigenteDesde: null,
    });
    this.form.get('numero')!.disable();
    // En uno de ley, lo que fija la ley no se toca.
    const bloqueados = [
      'clase',
      'tipoId',
      'activo',
      'codigoDian',
      'base',
      'porcentaje',
      'valorFijo',
      'orden',
      'constituyeIbc',
      'formula',
    ];
    bloqueados.forEach((campo) =>
      c.deLey
        ? this.form.get(campo)!.disable()
        : this.form.get(campo)!.enable(),
    );
    // El cálculo de un concepto propio cambia con "Nueva vigencia", no editando.
    if (!c.deLey) {
      ['base', 'porcentaje', 'valorFijo', 'constituyeIbc'].forEach((campo) =>
        this.form.get(campo)!.disable(),
      );
    }
    this.filtrarTipos();
  }

  /** Solo los tipos de la clase elegida; si el tipo actual no casa, se limpia. */
  private filtrarTipos(): void {
    const clase = this.form.getRawValue().clase;
    this.tipoOpts = this.tipos
      .filter((t) => t.clase === clase)
      .map((t) => ({ label: t.nombre, value: t.id }));
    const tipoId = this.form.getRawValue().tipoId;
    if (tipoId != null && !this.tipoOpts.some((t) => t.value === tipoId)) {
      this.form.patchValue({ tipoId: null }, { emitEvent: false });
    }
  }

  onBaseChange(): void {
    if (!this.esPorcentual) this.form.patchValue({ porcentaje: null });
    if (!this.esFijo) this.form.patchValue({ valorFijo: null });
  }

  invalido(campo: string): boolean {
    const c = this.form.get(campo);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  async guardar(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.tabActiva = 0;
      this.alert.showWarn(
        'Datos incompletos',
        'Revisa código, nombre, clase y tipo.',
      );
      return;
    }
    const v = this.form.getRawValue();
    if (!this.esEdicion && this.esPorcentual && v.porcentaje == null) {
      this.tabActiva = 1;
      this.alert.showWarn(
        'Datos incompletos',
        'Este cálculo exige un porcentaje.',
      );
      return;
    }
    if (!this.esEdicion && this.esFijo && !v.valorFijo) {
      this.tabActiva = 1;
      this.alert.showWarn(
        'Datos incompletos',
        'Un concepto de valor fijo exige un valor.',
      );
      return;
    }

    if (this.esFormula && !v.formula?.trim()) {
      this.tabActiva = 1;
      this.alert.showWarn('Datos incompletos', 'Escriba la fórmula del concepto.');
      return;
    }

    const dto: ConceptoFormDto = {
      numero: v.numero,
      nombre: v.nombre.trim(),
      clase: v.clase,
      tipoId: v.tipoId,
      entrada: v.entrada,
      redondeoPrecision: v.redondeoPrecision,
      redondeoModo: v.redondeoModo,
      frecuencia: v.frecuencia,
      grupoId: v.grupoId,
      aplicaArt383: v.aplicaArt383,
      descripcion: v.descripcion?.trim() || null,
      constituyeIbc: v.constituyeIbc,
      base: v.base,
      porcentaje: this.esPorcentual ? v.porcentaje : null,
      formula: this.esFormula ? v.formula : null,
      haceBasePrestacional: !!v.haceBasePrestacional,
      centroCostoId: v.centroCostoId ?? null,
      valorFijo: this.esFijo ? v.valorFijo : null,
      codigoDian: v.codigoDian?.trim() || null,
      orden: v.orden ?? 100,
    };

    this.guardando = true;
    try {
      if (this.concepto) {
        dto.activo = v.activo;
        const res = await lastValueFrom(
          this.service.actualizar(this.concepto.id, dto),
        );
        this.alert.showSuccess(
          'Concepto guardado',
          `${res.data.numero} - ${res.data.nombre}`,
        );
        // Un concepto de ley se guarda como versión de la empresa: otro id.
        if (res.data.id !== this.concepto.id) {
          void this.router.navigate(['/nomina/conceptos', res.data.id], {
            replaceUrl: true,
          });
        }
        this.concepto = res.data;
        this.llenarForm(res.data);
      } else {
        dto.vigenteDesde = aFechaLocal(v.vigenteDesde) ?? undefined;
        const res = await lastValueFrom(this.service.crear(dto));
        this.alert.showSuccess(
          'Concepto creado',
          `${res.data.numero} - ${res.data.nombre}`,
        );
        this.concepto = res.data;
        this.llenarForm(res.data);
        void this.router.navigate(['/nomina/conceptos', res.data.id], {
          replaceUrl: true,
        });
      }
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudo guardar el concepto.',
      );
    } finally {
      this.guardando = false;
    }
  }

  /** Centros de costo de la empresa para fijarle uno al concepto. */
  private async cargarCentros(): Promise<void> {
    try {
      const res = await lastValueFrom(this.centros.list());
      this.centroOpts = (res.data ?? []).map((c) => ({ label: `${c.codigo} - ${c.nombre}`, value: c.id }));
    } catch {
      // Sin la lista, el concepto sigue repartiéndose por la vinculación.
    }
  }

  /** Qué alimenta la base del concepto (pestaña Afectado por). */
  private async cargarAfectadoPor(): Promise<void> {
    if (!this.concepto) return;
    try {
      const res = await lastValueFrom(this.service.afectadoPor(this.concepto.id));
      this.afectadoPor = res.data ?? [];
    } catch {
      this.afectadoPor = [];
    }
  }

  volver(): void {
    void this.router.navigate(['/nomina/conceptos']);
  }
}
