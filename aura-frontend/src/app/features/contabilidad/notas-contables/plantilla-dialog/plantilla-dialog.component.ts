import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';

import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../../shared/pipes/alert.service';
import {
  CLASIFICACIONES,
  ClasificacionNota,
  NotaPlantillaModel,
  SaveNotaContableLineaDto,
  SaveNotaPlantillaDto,
} from '../models/nota-contable.model';
import { NotaContableService } from '../services/nota-contable.service';

/**
 * Crear o editar una plantilla.
 *
 * - Desde una nota ({@link lineas} con valor): guarda sus líneas como
 *   plantilla nueva o reemplaza las de una existente.
 * - Desde el listado de plantillas ({@link plantilla} con valor y sin
 *   líneas): edita solo la cabecera y la recurrencia.
 */
@Component({
  selector: 'app-plantilla-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    DropdownModule,
    InputNumberModule,
    InputTextModule,
  ],
  templateUrl: './plantilla-dialog.component.html',
  styleUrls: ['./plantilla-dialog.component.scss'],
})
export class PlantillaDialogComponent implements OnChanges {
  @Input() visible = false;
  /** Editar esta plantilla (solo cabecera). */
  @Input() plantilla: NotaPlantillaModel | null = null;
  /** Líneas de la nota que se quiere guardar como plantilla. */
  @Input() lineas: SaveNotaContableLineaDto[] | null = null;
  @Input() descripcion = '';
  @Input() clasificacion: ClasificacionNota | null = null;
  /** Con líneas: abrir ya en "reemplazar" esta plantilla (editar sus líneas). */
  @Input() reemplazarId: number | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() guardada = new EventEmitter<NotaPlantillaModel>();

  readonly clasificacionOpts = CLASIFICACIONES;
  frm: FormGroup;
  saving = false;
  /** Desde una nota: 'nueva' o reemplazar una existente. */
  modo: 'nueva' | 'reemplazar' = 'nueva';
  existentes: { label: string; value: number }[] = [];
  private plantillas: NotaPlantillaModel[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: NotaContableService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.frm = this.fb.group({
      reemplazarId: [null],
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      descripcion: ['', [Validators.required, Validators.maxLength(500)]],
      clasificacion: [null],
      recurrente: [false],
      diaMes: [1],
      activa: [true],
    });
  }

  get desdeNota(): boolean {
    return this.lineas !== null;
  }

  get titulo(): string {
    if (!this.desdeNota) return 'Editar plantilla';
    return 'Guardar como plantilla';
  }

  get recurrente(): boolean {
    return !!this.frm.get('recurrente')!.value;
  }

  async ngOnChanges(): Promise<void> {
    if (!this.visible) return;
    this.modo = 'nueva';
    if (this.plantilla && !this.desdeNota) {
      this.frm.reset({
        reemplazarId: null,
        nombre: this.plantilla.nombre,
        descripcion: this.plantilla.descripcion,
        clasificacion: this.plantilla.clasificacion,
        recurrente: this.plantilla.recurrente,
        diaMes: this.plantilla.diaMes ?? 1,
        activa: this.plantilla.activa,
      });
    } else {
      this.frm.reset({
        reemplazarId: null,
        nombre: '',
        descripcion: this.descripcion,
        clasificacion: this.clasificacion,
        recurrente: false,
        diaMes: 1,
        activa: true,
      });
      await this.cargarExistentes();
      if (
        this.reemplazarId &&
        this.plantillas.some((p) => p.id === this.reemplazarId)
      ) {
        this.modo = 'reemplazar';
        this.frm.patchValue({ reemplazarId: this.reemplazarId });
        this.onReemplazarElegida(this.reemplazarId);
      }
    }
    this.cdr.markForCheck();
  }

  private async cargarExistentes(): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.plantillas());
      this.plantillas = res.data ?? [];
      this.existentes = this.plantillas.map((p) => ({
        label: p.nombre,
        value: p.id,
      }));
    } catch {
      this.plantillas = [];
      this.existentes = [];
    }
    this.cdr.markForCheck();
  }

  setModo(m: 'nueva' | 'reemplazar'): void {
    this.modo = m;
    this.frm.patchValue({ reemplazarId: null });
    this.cdr.markForCheck();
  }

  /** Al elegir la plantilla a reemplazar, se trae su cabecera para no perderla. */
  onReemplazarElegida(id: number | null): void {
    const p = this.plantillas.find((x) => x.id === id);
    if (p) {
      this.frm.patchValue({
        nombre: p.nombre,
        recurrente: p.recurrente,
        diaMes: p.diaMes ?? 1,
        activa: p.activa,
      });
    }
    this.cdr.markForCheck();
  }

  setRecurrente(v: boolean): void {
    this.frm.patchValue({ recurrente: v });
    this.cdr.markForCheck();
  }

  cerrar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  async guardar(): Promise<void> {
    if (this.frm.invalid) {
      this.frm.markAllAsTouched();
      return;
    }
    const v = this.frm.getRawValue();
    if (v.recurrente && !(v.diaMes >= 1 && v.diaMes <= 28)) {
      this.alert.showWarn(
        'Día no válido',
        'El día del mes debe estar entre 1 y 28.',
      );
      return;
    }
    const idDestino = this.desdeNota
      ? this.modo === 'reemplazar'
        ? v.reemplazarId
        : null
      : (this.plantilla?.id ?? null);
    if (this.desdeNota && this.modo === 'reemplazar' && !idDestino) {
      this.alert.showWarn(
        'Falta la plantilla',
        'Elija cuál plantilla quiere reemplazar.',
      );
      return;
    }
    const dto: SaveNotaPlantillaDto = {
      nombre: v.nombre.trim(),
      descripcion: v.descripcion.trim(),
      clasificacion: v.clasificacion,
      recurrente: !!v.recurrente,
      diaMes: v.recurrente ? v.diaMes : null,
      activa: !!v.activa,
      lineas: this.desdeNota ? this.lineas : null,
    };
    this.saving = true;
    this.cdr.markForCheck();
    try {
      const res = idDestino
        ? await lastValueFrom(this.service.actualizarPlantilla(idDestino, dto))
        : await lastValueFrom(this.service.crearPlantilla(dto));
      this.alert.showSuccess('Plantilla guardada', res?.message ?? '');
      this.guardada.emit(res.data);
      this.cerrar();
    } catch (e: any) {
      this.alert.showError(
        'No se pudo guardar la plantilla',
        e?.error?.message ?? 'Intente de nuevo',
      );
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }
}
