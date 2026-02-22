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
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { lastValueFrom } from 'rxjs';
import { SucursalService } from '../../../core/services/sucursal.service';
import { SucursalModel } from '../../../core/models/sucursal.model';
import { AlertService } from '../../../shared/pipes/alert.service';

@Component({
  selector: 'app-form-sucursal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ToggleButtonModule,
  ],
  templateUrl: './form-sucursal.component.html',
  styleUrls: ['./form-sucursal.component.scss'],
})
export class FormSucursalComponent implements OnChanges {
  @Input() visible = false;
  @Input() sucursal: SucursalModel | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  frmSucursal: FormGroup;
  loading = false;

  get isEdit(): boolean {
    return !!this.sucursal;
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly sucursalService: SucursalService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.frmSucursal = this.fb.group({
      codigo: [null, [Validators.maxLength(20)]],
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      direccion: [null],
      ciudad: [null, [Validators.maxLength(100)]],
      telefono: [null, [Validators.maxLength(50)]],
      prefijoFacturacion: [null, [Validators.maxLength(10)]],
      activa: [true],
    });
  }

  ngOnChanges(): void {
    if (!this.visible) return;

    this.frmSucursal.reset({
      codigo: null,
      nombre: '',
      direccion: null,
      ciudad: null,
      telefono: null,
      prefijoFacturacion: null,
      activa: true,
    });

    if (this.sucursal) {
      this.frmSucursal.patchValue({
        codigo: this.sucursal.codigo,
        nombre: this.sucursal.nombre,
        direccion: this.sucursal.direccion,
        ciudad: this.sucursal.ciudad,
        telefono: this.sucursal.telefono,
        prefijoFacturacion: this.sucursal.prefijoFacturacion,
        activa: this.sucursal.activa,
      });
    }
  }

  async save(): Promise<void> {
    if (this.frmSucursal.invalid) {
      this.frmSucursal.markAllAsTouched();
      return;
    }

    this.loading = true;
    const dto = this.frmSucursal.value;

    try {
      if (this.isEdit) {
        await lastValueFrom(
          this.sucursalService.update(this.sucursal!.id, dto),
        );
        this.alertService.showSuccess(
          'Actualizado',
          'Sucursal actualizada correctamente',
        );
      } else {
        await lastValueFrom(this.sucursalService.create(dto));
        this.alertService.showSuccess(
          'Creado',
          'Sucursal creada correctamente',
        );
      }
      this.saved.emit();
      this.close();
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.message ?? 'No se pudo guardar',
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
    const c = this.frmSucursal.get(field);
    return !!(c?.invalid && c?.touched);
  }
}
