import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ChangeDetectorRef,
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
import { RutaTableModel, CreateRutaDto, LocalTableModel } from '../../models/vendedor.model';
import { RutaService } from '../services/ruta.service';
import { LocalService } from '../../locales/services/local.service';

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
export class FormRutaComponent implements OnChanges {
  @Input() visible = false;
  @Input() ruta: RutaTableModel | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  form: FormGroup;
  loading = false;
  loadingLocales = false;
  locales: LocalTableModel[] = [];

  get isEdit(): boolean {
    return !!this.ruta;
  }

  diasSemana = [
    { label: 'Lunes', value: 1 },
    { label: 'Martes', value: 2 },
    { label: 'Miércoles', value: 3 },
    { label: 'Jueves', value: 4 },
    { label: 'Viernes', value: 5 },
    { label: 'Sábado', value: 6 },
    { label: 'Domingo', value: 7 },
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly rutaService: RutaService,
    private readonly localService: LocalService,
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
        this.form.patchValue({
          nombre: data.nombre,
          descripcion: data.descripcion,
          diaSemana: data.diaSemana,
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
      const dto: CreateRutaDto = {
        ...this.form.value,
      };
      if (this.isEdit) {
        await lastValueFrom(this.rutaService.update(this.ruta!.id, dto));
        this.alert.showSuccess('Actualizado', 'Ruta actualizada correctamente');
      } else {
        await lastValueFrom(this.rutaService.create(dto));
        this.alert.showSuccess('Creado', 'Ruta creada correctamente');
      }
      this.saved.emit();
      this.close();
    } catch (err: any) {
      this.alert.showError('Error', err?.error?.message ?? 'No se pudo guardar');
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
