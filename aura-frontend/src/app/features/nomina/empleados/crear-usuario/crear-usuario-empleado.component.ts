import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  ValidatorFn,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../../shared/pipes/alert.service';
import { NominaService } from '../../../../core/services/nomina.service';
import { IndexDBService } from '../../../../core/services/index-db.service';
import { EmpleadoTableModel } from '../../../../core/models/nomina.model';
import { PasswordModule } from 'primeng/password';
import { DropdownModule } from 'primeng/dropdown';

@Component({
  selector: 'app-crear-usuario-empleado',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DropdownModule,
    InputTextModule,
    DialogModule,
    PasswordModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './crear-usuario-empleado.component.html',
  styleUrls: ['./crear-usuario-empleado.component.scss'],
})
export class CrearUsuarioEmpleadoComponent {
  @Input() visible = false;
  @Input() empleado: EmpleadoTableModel | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  loading = false;
  empresaId: number | null = null;

  form!: FormGroup;
  sucursalesOpts: { label: string; value: number }[] = [];

  constructor(
    private readonly nominaService: NominaService,
    private readonly indexDBService: IndexDBService,
    private readonly alert: AlertService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadSucursales();
  }

  private initForm(): void {
    this.form = this.fb.group({
      sucursalId: [null, Validators.required],
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(50),
          Validators.email,
        ],
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(50),
        ],
      ],
      confirmarPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(50),
        ],
      ],
    });
  }

  get isEdit(): boolean {
    return !!this.empleado?.usuarioId;
  }

  private async loadSucursales(): Promise<void> {
    const list = await this.indexDBService.getSucursales();
    this.sucursalesOpts = list.map((s) => ({ label: s.nombre, value: s.id }));
    this.cdr.markForCheck();
  }

  async save(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.empleado) {
      this.alert.showError('Error', 'Formulario inválido');
      return;
    }

    if (this.form.value.password !== this.form.value.confirmarPassword) {
      this.alert.showError('Error', 'Las contraseñas no coinciden');
      return;
    }

    this.loading = true;
    try {
      const dto = {
        sucursalId: this.form.value.sucursalId!,
        empleadoId: this.empleado.id,
        username: this.form.value.username!,
        password: this.form.value.password!,
      };

      await lastValueFrom(this.nominaService.createUsuarioFromEmpleado(dto));
      this.alert.showSuccess('Éxito', 'Usuario creado correctamente');
      this.saved.emit();
      this.close();
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudo crear el usuario',
      );
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  close(): void {
    this.form.reset();
    this.visible = false;
    this.visibleChange.emit(false);
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }
}
