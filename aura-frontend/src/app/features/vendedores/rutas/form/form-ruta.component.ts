import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ChangeDetectorRef,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../../shared/pipes/alert.service';
import {
  RutaTableModel,
  CreateRutaDto,
  LocalTableModel,
} from '../../models/vendedor.model';
import { RutaService } from '../services/ruta.service';
import { LocalService } from '../../locales/services/local.service';
import { VendedorService } from '../../services/vendedor.service';
import { DIAS_SEMANA_OPTIONS } from '../constants';

@Component({
  selector: 'app-form-ruta',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    DialogModule,
    MultiSelectModule,
  ],
  templateUrl: './form-ruta.component.html',
  styleUrls: ['./form-ruta.component.scss'],
})
export class FormRutaComponent implements OnChanges, OnInit {
  @Input() visible = false;
  @Input() ruta: RutaTableModel | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  form: FormGroup;
  loading = false;
  loadingLocales = false;
  locales: LocalTableModel[] = [];
  vendedores: { label: string; value: number }[] = [];

  get isEdit(): boolean {
    return !!this.ruta;
  }

  diasSemana = DIAS_SEMANA_OPTIONS;

  constructor(
    private readonly fb: FormBuilder,
    private readonly rutaService: RutaService,
    private readonly localService: LocalService,
    private readonly vendedorService: VendedorService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: ['', Validators.maxLength(500)],
      diaSemana: [null],
      vendedorId: [null, Validators.required],
      localIds: [[]],
    });
  }

  ngOnChanges(): void {
    if (this.visible) {
      this.form.reset({
        nombre: '',
        descripcion: null,
        diaSemana: null,
        vendedorId: null,
        localIds: [],
      });
      this.loadLocales();
      if (this.ruta) {
        this.loadRuta();
      }
    }
  }

  ngOnInit(): void {
    this.loadVendedores();
  }

  async loadVendedores(): Promise<void> {
    try {
      const res = await lastValueFrom(this.vendedorService.getAllVendedores());
      const data = res?.data?.content ?? res?.data ?? [];
      this.vendedores = data.map((v: any) => ({
        label: `${v.nombres} ${v.apellidos}`,
        value: v.id,
      }));
    } catch {
      this.vendedores = [];
    }
  }

  async loadLocales(): Promise<void> {
    this.loadingLocales = true;
    try {
      const res = await lastValueFrom(this.localService.getAll());
      this.locales = res?.data?.content ?? res?.data ?? [];
    } catch {
      this.locales = [];
    } finally {
      this.loadingLocales = false;
      this.cdr.markForCheck();
    }
  }

  async loadRuta(): Promise<void> {
    try {
      const res = await lastValueFrom(this.rutaService.getById(this.ruta!.id));
      const data = res?.data;
      if (data) {
        const dia = data.diaSemana;
        this.form.patchValue({
          nombre: data.nombre.replace(/\s*\([^)]+\)\s*$/, '').trim(),
          descripcion: data.descripcion,
          diaSemana: Array.isArray(dia) ? dia : [dia],
          vendedorId: data.vendedorId,
          localIds: data.localIds ?? [],
        });
      }
    } catch {
      this.alert.showError('Error', 'No se pudo cargar la ruta');
    } finally {
      this.cdr.markForCheck();
    }
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    try {
      const { nombre, descripcion, diaSemana, vendedorId, localIds } =
        this.form.value;
      const dias = Array.isArray(diaSemana)
        ? diaSemana
        : diaSemana
          ? [diaSemana]
          : [];

      if (dias.length === 0) {
        this.alert.showError(
          'Error',
          'Seleccione al menos un día de la semana',
        );
        return;
      }

      const payloads: CreateRutaDto[] = dias.map((dia: number) => {
        const diaInfo = this.diasSemana.find((d) => d.value === dia);
        const nombreConDia = diaInfo ? `${nombre} (${diaInfo.abrev})` : nombre;
        return {
          nombre: nombreConDia,
          descripcion,
          diaSemana: dia,
          vendedorId,
          localIds: localIds ?? [],
        };
      });

      if (this.isEdit) {
        await lastValueFrom(
          this.rutaService.update(this.ruta!.id, payloads[0]),
        );
        this.alert.showSuccess('Actualizado', 'Ruta actualizada correctamente');
      } else {
        for (const dto of payloads) {
          await lastValueFrom(this.rutaService.create(dto));
        }
        this.alert.showSuccess(
          'Creado',
          `${payloads.length} ruta(s) creada(s) correctamente`,
        );
      }
      this.saved.emit();
      this.close();
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudo guardar',
      );
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }
}
