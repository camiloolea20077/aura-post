import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { lastValueFrom } from 'rxjs';

import { TerceroService } from '../../../core/services/tercero.service';
import { PAIS_OPTS } from '../../utils/paises';

interface Opcion<T> {
  label: string;
  value: T;
}

/** Departamentos: se piden una vez por sesión. */
let departamentosCache: Promise<string[]> | null = null;

/**
 * País → departamento → municipio, como tres campos que se acomodan en la
 * grilla del formulario que lo contiene (el host usa `display: contents`).
 *
 * Trabaja sobre dos controles del formulario padre: el código del país y el id
 * del municipio. El departamento no se guarda: sale del municipio elegido.
 * Fuera de Colombia solo se pide el país.
 *
 *   <app-lugar-select [grupo]="frm" paisControl="codigoPaisNacimiento"
 *       municipioControl="municipioNacimientoId" titulo="de nacimiento" />
 */
@Component({
  selector: 'app-lugar-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SelectModule],
  templateUrl: './lugar-select.component.html',
  styleUrls: ['./lugar-select.component.scss'],
})
export class LugarSelectComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) grupo!: FormGroup;
  @Input({ required: true }) paisControl!: string;
  @Input({ required: true }) municipioControl!: string;
  /** Complemento de las etiquetas: "de nacimiento", "de expedición"… */
  @Input() titulo = '';
  /** Nombre del municipio elegido ("Medellín - Antioquia"), o null al quitarlo. */
  @Output() municipioNombre = new EventEmitter<string | null>();

  readonly paises = PAIS_OPTS;
  departamentos: Opcion<string>[] = [];
  municipios: Opcion<number>[] = [];
  departamento: string | null = null;
  cargando = false;

  constructor(
    private readonly terceros: TerceroService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  get esColombia(): boolean {
    return (this.grupo.get(this.paisControl)?.value ?? 'CO') === 'CO';
  }

  async ngOnInit(): Promise<void> {
    if (!this.grupo.get(this.paisControl)?.value) this.grupo.get(this.paisControl)?.setValue('CO', { emitEvent: false });
    this.grupo
      .get(this.paisControl)!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (!this.esColombia) this.grupo.get(this.municipioControl)?.setValue(null);
        this.cdr.markForCheck();
      });
    // Al cargar un registro el municipio llega después: se ubica su departamento.
    this.grupo
      .get(this.municipioControl)!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async (id: number | null) => {
        await this.ubicarDepartamento(id);
        this.avisarNombre(id);
      });

    await this.cargarDepartamentos();
    await this.ubicarDepartamento(this.grupo.get(this.municipioControl)?.value ?? null);
  }

  private async cargarDepartamentos(): Promise<void> {
    try {
      departamentosCache ??= lastValueFrom(this.terceros.departamentos()).then((r) => r.data ?? []);
      this.departamentos = (await departamentosCache).map((d) => ({ label: d, value: d }));
    } catch {
      departamentosCache = null;
    }
    this.cdr.markForCheck();
  }

  /** Si el municipio no está en la lista cargada, busca su departamento y lo carga. */
  private async ubicarDepartamento(municipioId: number | null): Promise<void> {
    if (!municipioId || this.municipios.some((m) => m.value === municipioId)) return;
    try {
      const res = await lastValueFrom(this.terceros.getMunicipioById(municipioId));
      const dep = res.data?.departamento ?? null;
      if (dep) {
        this.departamento = dep;
        await this.cargarMunicipios(dep);
      }
    } catch {
      // Sin el departamento el municipio igual queda guardado.
    }
  }

  private avisarNombre(id: number | null): void {
    const m = this.municipios.find((x) => x.value === id);
    this.municipioNombre.emit(m && this.departamento ? `${m.label} - ${this.departamento}` : null);
  }

  async onDepartamento(dep: string | null): Promise<void> {
    this.departamento = dep;
    this.grupo.get(this.municipioControl)?.setValue(null, { emitEvent: false });
    this.municipios = [];
    if (dep) await this.cargarMunicipios(dep);
    this.cdr.markForCheck();
  }

  private async cargarMunicipios(dep: string): Promise<void> {
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.terceros.municipiosDe(dep));
      this.municipios = (res.data ?? []).map((m) => ({ label: m.nombre, value: m.id }));
    } catch {
      this.municipios = [];
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }
}
