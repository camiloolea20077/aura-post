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
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { CalendarModule } from 'primeng/calendar';
import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../../shared/pipes/alert.service';
import {
  VisitaTableModel,
  CreateVisitaDto,
  LocalTableModel,
  RutaTableModel,
} from '../../models/vendedor.model';
import { VisitaService } from '../services/visita.service';
import { LocalService } from '../../locales/services/local.service';
import { RutaService } from '../../rutas/services/ruta.service';

@Component({
  selector: 'app-form-visita',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DropdownModule,
    DialogModule,
    CalendarModule,
  ],
  templateUrl: './form-visita.component.html',
  styleUrls: ['./form-visita.component.scss'],
})
export class FormVisitaComponent implements OnChanges {
  @Input() visible = false;
  @Input() visita: VisitaTableModel | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  form: FormGroup;
  loading = false;
  loadingData = false;
  locales: LocalTableModel[] = [];
  rutas: RutaTableModel[] = [];
  today: Date = new Date();

  get isEdit(): boolean {
    return !!this.visita;
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly visitaService: VisitaService,
    private readonly localService: LocalService,
    private readonly rutaService: RutaService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      localId: [null, Validators.required],
      rutaId: [null],
      fechaProgramada: [null, Validators.required],
      horaProgramada: [null],
    });
  }

  ngOnChanges(): void {
    if (this.visible) {
      this.form.reset({
        localId: null,
        rutaId: null,
        fechaProgramada: null,
        horaProgramada: null,
      });
      this.loadData();
      if (this.visita) {
        this.loadVisita();
      }
    }
  }

  async loadData(): Promise<void> {
    this.loadingData = true;
    try {
      const [localesRes, rutasRes] = await Promise.all([
        lastValueFrom(this.localService.getAll()),
        lastValueFrom(this.rutaService.getAll()),
      ]);
      this.locales = localesRes?.data?.content ?? localesRes?.data ?? [];
      this.rutas = rutasRes?.data?.content ?? rutasRes?.data ?? [];
    } catch {
      this.locales = [];
      this.rutas = [];
    } finally {
      this.loadingData = false;
      this.cdr.markForCheck();
    }
  }

  async loadVisita(): Promise<void> {
    try {
      const res = await lastValueFrom(
        this.visitaService.getById(this.visita!.id),
      );
      const data = res?.data;
      if (data) {
        this.form.patchValue({
          localId: data.localId,
          rutaId: data.rutaId,
          fechaProgramada: new Date(data.fechaProgramada),
          horaProgramada: data.horaProgramada,
        });
      }
    } catch {
      this.alert.showError('Error', 'No se pudo cargar la visita');
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
      const dto: CreateVisitaDto = {
        localId: this.form.value.localId,
        rutaId: this.form.value.rutaId,
        fechaProgramada: this.form.value.fechaProgramada
          .toISOString()
          .split('T')[0],
        horaProgramada: this.form.value.horaProgramada,
      };
      if (this.isEdit) {
        await lastValueFrom(this.visitaService.delete(this.visita!.id));
        await lastValueFrom(this.visitaService.create(dto));
        this.alert.showSuccess(
          'Actualizado',
          'Visita reprogramada correctamente',
        );
      } else {
        await lastValueFrom(this.visitaService.create(dto));
        this.alert.showSuccess('Creada', 'Visita programada correctamente');
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
