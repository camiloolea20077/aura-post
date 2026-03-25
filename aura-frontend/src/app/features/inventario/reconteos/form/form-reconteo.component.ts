import {
  Component,
  OnChanges,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { lastValueFrom } from 'rxjs';
import { ReconteoService } from '../../../../core/services/reconteo.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { CreateReconteoDto } from '../../../../core/models/reconteo.model';
import { IndexDBService } from '../../../../core/services/index-db.service';

@Component({
  selector: 'app-form-reconteo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    DropdownModule,
    DialogModule,
    TextareaModule,
  ],
  templateUrl: './form-reconteo.component.html',
  styleUrls: ['./form-reconteo.component.scss'],
})
export class FormReconteoComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  form: FormGroup;
  loading = false;

  sucursales: { id: number; nombre: string }[] = [];
  private defaultSucursalId: number | null = null;

  tiposReconteo = [
    { label: 'Total (todos los productos)', value: 'TOTAL' },
    { label: 'Parcial (por categoría)', value: 'PARCIAL' },
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: ReconteoService,
    private readonly alert: AlertService,
    private readonly indexDB: IndexDBService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      sucursalId: [null, Validators.required],
      tipo: ['TOTAL', Validators.required],
      observaciones: [null],
    });
  }

  ngOnChanges(): void {
    if (this.visible) {
      this.form.reset({ tipo: 'TOTAL', sucursalId: this.defaultSucursalId });
      this.loadSucursales();
    }
  }

  private async loadSucursales(): Promise<void> {
    const [sucursales, defaultId] = await Promise.all([
      this.indexDB.getSucursales(),
      this.indexDB.getSucursalDefault(),
    ]);
    this.sucursales = sucursales;
    if (defaultId) {
      this.defaultSucursalId = defaultId;
      this.form.patchValue({ sucursalId: defaultId });
    }
    this.cdr.markForCheck();
  }

  async guardar(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.loading = true;
    const dto: CreateReconteoDto = {
      sucursalId: this.form.value.sucursalId,
      tipo: this.form.value.tipo,
      observaciones: this.form.value.observaciones || null,
    };

    try {
      await lastValueFrom(this.service.create(dto));
      this.alert.showSuccess(
        'Reconteo creado',
        'Se generó la lista de productos para contar',
      );
      this.saved.emit();
      this.close();
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudo crear el reconteo',
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
