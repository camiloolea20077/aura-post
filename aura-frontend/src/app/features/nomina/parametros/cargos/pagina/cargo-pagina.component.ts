import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { lastValueFrom } from 'rxjs';

import { CreateNominaCargoDto, NominaCargoModel } from '../../../../../core/models/nomina-parametros.model';
import { NominaCargoService } from '../../../../../core/services/nomina-cargo.service';
import { NominaCargoPlantillaService } from '../../../../../core/services/nomina-cargo-plantilla.service';
import { NominaCatalogoService } from '../../../../../core/services/nomina-catalogo.service';
import { AlertService } from '../../../../../shared/pipes/alert.service';
import { rangoSalarialValidator } from '../rango-salarial.validator';
import { ConceptosCargoComponent } from '../tabs/conceptos-cargo.component';
import { NovedadesCargoComponent } from '../tabs/novedades-cargo.component';
import { TopesHorasCargoComponent } from '../tabs/topes-horas-cargo.component';
import { AdjuntosCargoComponent } from '../tabs/adjuntos-cargo.component';

interface Opcion {
  label: string;
  value: number;
  /** Código del elemento del catálogo (DIR, PRO…). */
  codigo?: string;
}

/** Código del nivel directivo en el catálogo de niveles de cargo. */
const NIVEL_DIRECTIVO = 'DIR';

/**
 * Página del cargo con pestañas: General, Conceptos, Novedades permitidas,
 * Misión, Funciones, Perfil, Desempeño, Máximo de horas extra y recargos, y
 * Adjuntos. El cargo es la plantilla de nómina de sus vinculaciones
 * (docs/PLAN_CONCEPTOS_CARGOS_NOMINA.md en el backend, F5). Las pestañas de la
 * plantilla aparecen después de crear el cargo.
 */
@Component({
  selector: 'app-cargo-pagina',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TabViewModule,
    TagModule,
    TextareaModule,
    ConceptosCargoComponent,
    NovedadesCargoComponent,
    TopesHorasCargoComponent,
    AdjuntosCargoComponent,
  ],
  templateUrl: './cargo-pagina.component.html',
  styleUrls: ['../../../conceptos/pagina/concepto-pagina.component.scss'],
})
export class CargoPaginaComponent implements OnInit {
  cargo: NominaCargoModel | null = null;
  cargando = true;
  guardando = false;
  tabActiva = 0;
  form: FormGroup;

  niveles: Opcion[] = [];
  tipos: Opcion[] = [];
  readonly opcionesEstado = [
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false },
  ];

  mostrarCopiar = false;
  copiando = false;
  cargosOrigen: Opcion[] = [];
  origenId: number | null = null;
  /** Cambia para que las pestañas de la plantilla se recarguen después de copiar. */
  version = 0;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: NominaCargoService,
    private readonly plantilla: NominaCargoPlantillaService,
    private readonly catalogos: NominaCatalogoService,
    private readonly alert: AlertService,
  ) {
    this.form = this.fb.group(
      {
        codigo: ['', [Validators.required, Validators.maxLength(20)]],
        nombre: ['', [Validators.required, Validators.maxLength(150)]],
        nivelId: [null as number | null],
        tipoCargoId: [null as number | null],
        plazas: [null as number | null, Validators.min(0)],
        salarioMinimo: [null as number | null, Validators.min(0)],
        salarioReferencia: [null as number | null, Validators.min(0)],
        salarioMaximo: [null as number | null, Validators.min(0)],
        mision: [''],
        funciones: [''],
        perfil: [''],
        desempeno: [''],
        activo: [true],
      },
      { validators: rangoSalarialValidator },
    );
  }

  get esEdicion(): boolean {
    return this.cargo !== null;
  }

  /** Nivel directivo: sin horas extra (art. 162 CST). */
  get esDirectivo(): boolean {
    const nivelId = this.cargo?.nivelId;
    return this.niveles.some((n) => n.value === nivelId && n.codigo?.toUpperCase() === NIVEL_DIRECTIVO);
  }

  /** Mensaje del rango salarial, solo cuando el usuario ya tocó algún salario. */
  get errorRango(): string | null {
    const tocado = ['salarioMinimo', 'salarioReferencia', 'salarioMaximo'].some((c) => this.form.get(c)?.touched);
    return tocado ? (this.form.errors?.['rangoSalarial'] ?? null) : null;
  }

  async ngOnInit(): Promise<void> {
    await this.cargarCatalogos();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.cargarCargo(Number(id));
    } else {
      this.cargando = false;
    }
  }

  private async cargarCatalogos(): Promise<void> {
    try {
      const [niveles, tipos] = await Promise.all([
        lastValueFrom(this.catalogos.activos('niveles-cargo')),
        lastValueFrom(this.catalogos.activos('tipos-cargo')),
      ]);
      this.niveles = (niveles.data ?? []).map((n) => ({ label: n.nombre, value: n.id, codigo: n.codigo }));
      this.tipos = (tipos.data ?? []).map((t) => ({ label: t.nombre, value: t.id }));
    } catch {
      // Nivel y tipo son opcionales: el cargo se puede guardar sin ellos.
    }
  }

  private async cargarCargo(id: number): Promise<void> {
    this.cargando = true;
    try {
      const res = await lastValueFrom(this.service.obtener(id));
      this.cargo = res.data;
      this.llenarForm(res.data);
    } catch {
      this.alert.showError('Cargos', 'No se encontró el cargo.');
      void this.router.navigate(['/nomina/cargos']);
    } finally {
      this.cargando = false;
    }
  }

  private llenarForm(c: NominaCargoModel): void {
    this.form.reset({
      codigo: c.codigo,
      nombre: c.nombre,
      nivelId: c.nivelId,
      tipoCargoId: c.tipoCargoId,
      plazas: c.plazas,
      salarioMinimo: c.salarioMinimo,
      salarioReferencia: c.salarioReferencia,
      salarioMaximo: c.salarioMaximo,
      mision: c.mision ?? '',
      funciones: c.funciones ?? '',
      perfil: c.perfil ?? '',
      desempeno: c.desempeno ?? '',
      activo: c.activo,
    });
  }

  invalido(campo: string): boolean {
    const c = this.form.get(campo);
    return !!(c?.invalid && c?.touched);
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.tabActiva = 0;
      return;
    }
    const v = this.form.getRawValue();
    const dto: CreateNominaCargoDto = {
      codigo: v.codigo.trim(),
      nombre: v.nombre.trim(),
      nivelId: v.nivelId,
      tipoCargoId: v.tipoCargoId,
      plazas: v.plazas,
      salarioMinimo: v.salarioMinimo,
      salarioReferencia: v.salarioReferencia,
      salarioMaximo: v.salarioMaximo,
      mision: v.mision?.trim() || null,
      funciones: v.funciones?.trim() || null,
      perfil: v.perfil?.trim() || null,
      desempeno: v.desempeno?.trim() || null,
      activo: v.activo !== false,
    };

    this.guardando = true;
    try {
      const res = await lastValueFrom(
        this.cargo ? this.service.actualizar(this.cargo.id, dto) : this.service.crear(dto),
      );
      const nuevo = !this.cargo;
      this.cargo = res.data;
      this.llenarForm(res.data);
      this.alert.showSuccess('Cargo guardado', `${res.data.codigo} - ${res.data.nombre}`);
      if (nuevo) {
        void this.router.navigate(['/nomina/cargos', res.data.id], { replaceUrl: true });
      }
    } catch (err: any) {
      this.alert.showError('No se pudo guardar', err?.error?.message ?? 'Revise los datos del cargo.');
    } finally {
      this.guardando = false;
    }
  }

  async abrirCopiar(): Promise<void> {
    this.origenId = null;
    try {
      const res = await lastValueFrom(this.service.activos());
      this.cargosOrigen = (res.data ?? [])
        .filter((c) => c.id !== this.cargo?.id)
        .map((c) => ({ label: `${c.codigo} - ${c.nombre}`, value: c.id }));
      this.mostrarCopiar = true;
    } catch {
      this.alert.showError('Copiar plantilla', 'No se pudieron cargar los cargos.');
    }
  }

  async copiar(): Promise<void> {
    if (!this.cargo || !this.origenId) return;
    this.copiando = true;
    try {
      const res = await lastValueFrom(this.plantilla.copiarDe(this.cargo.id, this.origenId));
      const r = res.data;
      this.alert.showSuccess(
        'Plantilla copiada',
        `${r.conceptos} concepto(s), ${r.novedades} novedad(es) y ${r.topes} tope(s) agregados.`,
      );
      this.mostrarCopiar = false;
      this.version++;
    } catch (err: any) {
      this.alert.showError('Copiar plantilla', err?.error?.message ?? 'No se pudo copiar.');
    } finally {
      this.copiando = false;
    }
  }

  volver(): void {
    void this.router.navigate(['/nomina/cargos']);
  }
}
