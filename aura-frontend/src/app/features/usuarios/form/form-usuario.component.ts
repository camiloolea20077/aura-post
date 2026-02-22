import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
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
import { PasswordModule } from 'primeng/password';
import { DropdownModule } from 'primeng/dropdown';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import {
  ROLES_OPTIONS,
  SucursalAsignacion,
  TIPO_DOC_OPTIONS,
  UsuarioModel,
} from '../../../core/models/usuario.model';
import {
  SucursalDto,
  SucursalModel,
} from '../../../core/models/sucursal.model';
import { UsuarioService } from '../../../core/services/usuario.service';
import { SucursalService } from '../../../core/services/sucursal.service';
import { AlertService } from '../../../shared/pipes/alert.service';

@Component({
  selector: 'app-form-usuario',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    PasswordModule,
    DropdownModule,
    ToggleButtonModule,
    CheckboxModule,
    DividerModule,
    TooltipModule,
  ],
  templateUrl: './form-usuario.component.html',
  styleUrls: ['./form-usuario.component.scss'],
})
export class FormUsuarioComponent implements OnChanges, OnInit {
  @Input() visible = false;
  @Input() usuario: UsuarioModel | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  frmUsuario: FormGroup;
  loading = false;
  sucursalesOpts: SucursalDto[] = [];

  // Asignaciones de sucursal — manejadas separado por ser dinámicas
  sucursalesSeleccionadas: SucursalAsignacion[] = [];
  sucursalDefaultId: number | null = null;
  errorSucursales = false;

  readonly rolesOpts = ROLES_OPTIONS;
  readonly tipoDocOpts = TIPO_DOC_OPTIONS;

  get isEdit(): boolean {
    return !!this.usuario;
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly usuarioService: UsuarioService,
    private readonly sucursalService: SucursalService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.frmUsuario = this.fb.group({
      // Acceso
      username: ['', [Validators.required, Validators.maxLength(100)]],
      password: ['', [Validators.minLength(6), Validators.maxLength(100)]],
      pinAccesoRapido: [null, [Validators.maxLength(6)]],
      rol: ['CAJERO', Validators.required],
      // Datos personales
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      tipoDocumento: ['CC', Validators.required],
      numeroDocumento: ['', Validators.required],
      telefono: [null],
      email: [null, Validators.email],
      // Solo edición
      activo: [true],
    });
  }

  ngOnInit(): void {
    this.loadSucursales();
  }

  private async loadSucursales(): Promise<void> {
    try {
      const res = await lastValueFrom(this.sucursalService.getActivas());
      this.sucursalesOpts = res?.data ?? [];
      this.cdr.markForCheck();
    } catch {
      /* silencio */
    }
  }

  ngOnChanges(): void {
    if (!this.visible) return;

    // Contraseña requerida solo en creación
    const pwdCtrl = this.frmUsuario.get('password')!;
    if (this.isEdit) {
      pwdCtrl.clearValidators();
      pwdCtrl.setValidators([Validators.minLength(6)]);
    } else {
      pwdCtrl.setValidators([Validators.required, Validators.minLength(6)]);
    }
    pwdCtrl.updateValueAndValidity();

    this.frmUsuario.reset({
      username: '',
      password: '',
      pinAccesoRapido: null,
      rol: 'CAJERO',
      nombres: '',
      apellidos: '',
      tipoDocumento: 'CC',
      numeroDocumento: '',
      telefono: null,
      email: null,
      activo: true,
    });
    this.sucursalesSeleccionadas = [];
    this.sucursalDefaultId = null;
    this.errorSucursales = false;

    if (this.usuario) {
      this.frmUsuario.patchValue({
        username: this.usuario.username,
        rol: this.usuario.rol,
        nombres: this.usuario.nombres,
        apellidos: this.usuario.apellidos,
        tipoDocumento: this.usuario.tipoDocumento,
        numeroDocumento: this.usuario.numeroDocumento,
        telefono: this.usuario.telefono,
        email: this.usuario.email,
        activo: this.usuario.activo,
      });

      this.sucursalesSeleccionadas = (this.usuario.sucursales ?? []).map(
        (s) => ({
          sucursalId: s.sucursalId,
          esDefault: s.esDefault,
        }),
      );
      const def = this.sucursalesSeleccionadas.find((s) => s.esDefault);
      this.sucursalDefaultId = def?.sucursalId ?? null;
    }
  }

  // ── Sucursales dinámicas ──────────────────────────────────
  isSucursalChecked(id: number): boolean {
    return this.sucursalesSeleccionadas.some((s) => s.sucursalId === id);
  }

  toggleSucursal(id: number, checked: boolean): void {
    if (checked) {
      this.sucursalesSeleccionadas = [
        ...this.sucursalesSeleccionadas,
        { sucursalId: id, esDefault: false },
      ];
      // Si es la primera, marcarla como default automáticamente
      if (this.sucursalesSeleccionadas.length === 1) {
        this.sucursalDefaultId = id;
      }
    } else {
      this.sucursalesSeleccionadas = this.sucursalesSeleccionadas.filter(
        (s) => s.sucursalId !== id,
      );
      if (this.sucursalDefaultId === id) {
        this.sucursalDefaultId =
          this.sucursalesSeleccionadas[0]?.sucursalId ?? null;
      }
    }
    this.errorSucursales = false;
    this.cdr.markForCheck();
  }

  setDefault(id: number): void {
    this.sucursalDefaultId = id;
  }

  private buildSucursalesDto(): SucursalAsignacion[] {
    return this.sucursalesSeleccionadas.map((s) => ({
      sucursalId: s.sucursalId,
      esDefault: s.sucursalId === this.sucursalDefaultId,
    }));
  }

  // ── Guardar ───────────────────────────────────────────────
  async save(): Promise<void> {
    if (this.frmUsuario.invalid) {
      this.frmUsuario.markAllAsTouched();
      return;
    }

    if (this.sucursalesSeleccionadas.length === 0) {
      this.errorSucursales = true;
      return;
    }

    this.loading = true;
    const f = this.frmUsuario.value;

    try {
      if (this.isEdit) {
        const dto: any = {
          rol: f.rol,
          nombres: f.nombres,
          apellidos: f.apellidos,
          telefono: f.telefono,
          email: f.email,
          activo: f.activo,
          sucursales: this.buildSucursalesDto(),
        };
        if (f.password) dto.password = f.password;
        if (f.pinAccesoRapido) dto.pinAccesoRapido = f.pinAccesoRapido;
        await lastValueFrom(this.usuarioService.update(this.usuario!.id, dto));
        this.alertService.showSuccess(
          'Actualizado',
          'Usuario actualizado correctamente',
        );
      } else {
        const dto = {
          username: f.username,
          password: f.password,
          pinAccesoRapido: f.pinAccesoRapido || null,
          rol: f.rol,
          nombres: f.nombres,
          apellidos: f.apellidos,
          tipoDocumento: f.tipoDocumento,
          numeroDocumento: f.numeroDocumento,
          telefono: f.telefono || null,
          email: f.email || null,
          sucursales: this.buildSucursalesDto(),
        };
        await lastValueFrom(this.usuarioService.create(dto));
        this.alertService.showSuccess('Creado', 'Usuario creado correctamente');
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
    const c = this.frmUsuario.get(field);
    return !!(c?.invalid && c?.touched);
  }
}
