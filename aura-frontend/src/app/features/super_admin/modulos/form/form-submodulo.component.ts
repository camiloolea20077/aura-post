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
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { lastValueFrom } from 'rxjs';
import {
  ModuloModel,
  SubmoduloModel,
  CreateSubmoduloDto,
  UpdateSubmoduloDto,
} from '../models/modulo.model';
import { ModuloService } from '../services/modulo.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { normalize } from '../../../../shared/utils/commons';

@Component({
  selector: 'app-form-submodulo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    ToggleButtonModule,
  ],
  templateUrl: './form-submodulo.component.html',
  styleUrls: ['./form-submodulo.component.scss'],
})
export class FormSubmoduloComponent implements OnChanges {
  @Input() submodulo: SubmoduloModel | null = null;
  @Input() moduloId: number | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  frmSubmodulo: FormGroup;
  loading = false;
  modulos: ModuloModel[] = [];
  /** Grupos del módulo elegido (submódulos que no cuelgan de otro). */
  grupos: { id: number; nombre: string }[] = [];

  get isEdit(): boolean {
    return !!this.submodulo;
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: ModuloService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.frmSubmodulo = this.fb.group({
      moduloId: [null, Validators.required],
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      codigo: ['', [Validators.required, Validators.maxLength(50)]],
      descripcion: ['', Validators.maxLength(500)],
      orden: [0],
      activo: [true],
      padreId: [null as number | null],
    });
    // Al cambiar de módulo, los grupos son otros.
    this.frmSubmodulo.get('moduloId')!.valueChanges.subscribe((id) => {
      this.frmSubmodulo.patchValue({ padreId: null }, { emitEvent: false });
      this.cargarGrupos(id);
    });
  }

  /** Grupos posibles: submódulos del módulo sin padre (ni el propio). */
  private async cargarGrupos(moduloId: number | null): Promise<void> {
    this.grupos = [];
    if (!moduloId) return;
    try {
      const res = await lastValueFrom(
        this.service.pageSubmodulos({ page: 0, rows: 500, search: null, params: { moduloId } }),
      );
      const lista: SubmoduloModel[] = res?.data?.content ?? [];
      this.grupos = lista
        .filter((s) => !s.padreId && s.id !== this.submodulo?.id)
        .map((s) => ({ id: s.id, nombre: s.nombre + (s.esGrupo ? ' (grupo)' : '') }));
    } catch {
      this.grupos = [];
    }
    this.cdr.markForCheck();
  }

  async ngOnChanges(): Promise<void> {
    await this.loadModulos();

    if (this.submodulo) {
      this.frmSubmodulo.patchValue({
        moduloId: this.submodulo.moduloId,
        nombre: this.submodulo.nombre,
        codigo: this.submodulo.codigo,
        descripcion: this.submodulo.descripcion,
        orden: this.submodulo.orden,
        activo: this.submodulo.activo,
      }, { emitEvent: false });
      await this.cargarGrupos(this.submodulo.moduloId);
      this.frmSubmodulo.patchValue({ padreId: this.submodulo.padreId ?? null }, { emitEvent: false });
    } else {
      this.frmSubmodulo.patchValue({
        moduloId: this.moduloId,
        nombre: '',
        codigo: '',
        descripcion: '',
        orden: 0,
        activo: true,
        padreId: null,
      }, { emitEvent: false });
      await this.cargarGrupos(this.moduloId);
    }
  }

  private async loadModulos(): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.getAllModulos());
      this.modulos = res?.data ?? [];
    } catch {
      this.modulos = [];
    }
  }

  async save(): Promise<void> {
    if (this.frmSubmodulo.invalid) {
      this.frmSubmodulo.markAllAsTouched();
      return;
    }
    this.loading = true;
    try {
      if (this.isEdit) {
        const v = this.frmSubmodulo.value;
        const dto: UpdateSubmoduloDto = {
          ...v,
          padreId: v.padreId ?? null,
          sinPadre: v.padreId == null,
        };
        await lastValueFrom(
          this.service.updateSubmodulo(this.submodulo!.id, dto),
        );
        this.alert.showSuccess('Actualizado', 'Submódulo actualizado');
      } else {
        const dto: CreateSubmoduloDto = this.frmSubmodulo.value;
        await lastValueFrom(this.service.createSubmodulo(dto));
        this.alert.showSuccess('Creado', 'Submódulo creado');
      }
      this.saved.emit();
    } catch (err: any) {
      this.alert.showError('Error', err?.message || String(err));
      this.loading = false;
      this.cdr.markForCheck();
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }

  isInvalid(f: string): boolean {
    const c = this.frmSubmodulo.get(f);
    return !!(c?.invalid && c?.touched);
  }

  generateCode(): void {
    const nombre = this.frmSubmodulo.get('nombre')?.value;
    if (nombre) {
      this.frmSubmodulo
        .get('codigo')
        ?.setValue(normalize(nombre), { emitEvent: false });
    }
  }
}
