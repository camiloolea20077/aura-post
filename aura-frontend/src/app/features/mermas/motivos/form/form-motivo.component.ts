import {
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
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { DialogModule } from 'primeng/dialog';
import { lastValueFrom } from 'rxjs';
import { MotivoMermaModel } from '../../../../core/models/merma.model';
import { MermaService } from '../../../../core/services/merma.service';
import { AlertService } from '../../../../shared/pipes/alert.service';

@Component({
  selector: 'app-form-motivo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputSwitchModule,
    DialogModule,
  ],
  templateUrl: './form-motivo.component.html',
  styleUrls: ['./form-motivo.component.scss'],
})
export class FormMotivoComponent implements OnChanges {
  @Input() visible = false;
  @Input() motivo: MotivoMermaModel | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<MotivoMermaModel>();

  form: FormGroup;
  loading = false;

  get isEdit(): boolean {
    return !!this.motivo;
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: MermaService,
    private readonly alert: AlertService,
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      afectaContabilidad: [true],
    });
  }

  ngOnChanges(): void {
    if (this.visible) {
      this.form.reset({ nombre: '', afectaContabilidad: true });
      if (this.motivo) {
        this.form.patchValue({
          nombre: this.motivo.nombre,
          afectaContabilidad: this.motivo.afectaContabilidad,
        });
      }
    }
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    try {
      if (this.isEdit) {
        const res = await lastValueFrom(
          this.service.updateMotivo(this.motivo!.id, this.form.value),
        );
        this.alert.showSuccess('Actualizado', 'Motivo actualizado correctamente');
        this.saved.emit(res?.data);
      } else {
        const res = await lastValueFrom(this.service.createMotivo(this.form.value));
        this.alert.showSuccess('Creado', 'Motivo creado correctamente');
        this.saved.emit(res?.data);
      }
      this.close();
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudo guardar',
      );
    } finally {
      this.loading = false;
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
