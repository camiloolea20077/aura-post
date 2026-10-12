import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { PasswordModule } from 'primeng/password';
import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../../shared/pipes/alert.service';
import { AuthService } from '../../../../core/services/auth.service';
import { IndexDBService } from '../../../../core/services/index-db.service';
import { StateStore } from '../../../../core/store/state';
import { AuthResponse, EmpresaOpcion } from '../../../../core/models/auth.model';
import { SelectorEmpresaComponent } from '../../../../shared/components/selector-empresa/selector-empresa.component';

const ROLES_REDIRECT: Record<string, string> = {
  PLATFORM_ADMIN: '/platform/dashboard',
  VENDEDOR: '/vendedores/personal',
  CAJERO: '/pos',
  DEFAULT: '/dashboard',
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    ToastModule,
    PasswordModule,
    SelectorEmpresaComponent,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  public frmLogin!: FormGroup;
  public isSubmitting = false;
  public recordar = false;
  public currentYear = new Date().getFullYear();

  // ── Firma contable: elegir empresa tras el login (PLAN_FIRMA_CONTABLE F6) ──
  public selectorVisible = false;
  public empresas: EmpresaOpcion[] = [];
  public abriendoEmpresaId: number | null = null;
  private tokenPaso: string | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly indexDBService: IndexDBService,
    private readonly alertService: AlertService,
    private readonly router: Router,
    private readonly messageService: MessageService,
    private readonly state: StateStore,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.state.clearState();
  }

  private initForm(): void {
    this.frmLogin = this.fb.group({
      email: [null, [Validators.required, Validators.email]],
      password: [null, [Validators.required, Validators.minLength(6)]],
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.frmLogin.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  olvidePassword(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Recuperación de contraseña',
      detail: 'Contacta al administrador de tu empresa para restablecerla.',
    });
  }

  async login(): Promise<void> {
    if (this.frmLogin.invalid) {
      this.frmLogin.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    try {
      const { email, password } = this.frmLogin.value;
      const response = await lastValueFrom(
        this.authService.login({ username: email, password }),
      );

      if (response?.status === 200 && response?.data?.requiereEmpresa && response.data.token) {
        // Firma contable con clientes: primero elige dónde trabajar (token de paso, 2 min).
        this.tokenPaso = response.data.token;
        this.empresas = response.data.empresas ?? [];
        this.selectorVisible = true;
      } else if (response?.status === 200 && response?.data?.token) {
        await this.completarLogin(response.data);
      } else {
        this.alertService.showError(
          'Error',
          response?.message ?? 'Credenciales inválidas',
        );
      }
    } catch (error: any) {
      this.alertService.showError(
        'Error de autenticación',
        error?.message ?? 'No se pudo iniciar sesión. Intenta de nuevo.',
      );
    } finally {
      this.isSubmitting = false;
    }
  }

  /** Eligió empresa en el modal: pide el token de esa empresa con el de paso. */
  async elegirEmpresa(empresa: EmpresaOpcion): Promise<void> {
    if (!this.tokenPaso) return;
    this.abriendoEmpresaId = empresa.id;
    try {
      const res = await lastValueFrom(this.authService.seleccionarEmpresa(empresa.id, this.tokenPaso));
      if (res?.data?.token) {
        this.selectorVisible = false;
        this.tokenPaso = null;
        await this.completarLogin(res.data);
      }
    } catch (error: any) {
      // El token de paso dura 2 minutos: si venció, se vuelve a ingresar la clave.
      const vencido = error?.status === 401;
      this.alertService.showError(
        vencido ? 'Se acabó el tiempo' : 'No se pudo abrir la empresa',
        vencido
          ? 'Pasaron más de 2 minutos. Vuelva a ingresar su contraseña.'
          : error?.error?.message ?? 'Intente de nuevo.',
      );
      if (vencido) this.cancelarSeleccion();
    } finally {
      this.abriendoEmpresaId = null;
    }
  }

  cancelarSeleccion(): void {
    this.selectorVisible = false;
    this.tokenPaso = null;
    this.empresas = [];
    this.frmLogin.patchValue({ password: null });
  }

  private async completarLogin(data: AuthResponse): Promise<void> {
    await this.indexDBService.saveAuthData(data);
    const nombre = data.nombreCompleto ?? data.username ?? '';
    const donde = data.firmaNombre ? ` Trabajando en ${data.empresaNombre}.` : '';
    this.alertService.showSuccess(
      '¡Bienvenido!',
      `Hola${nombre ? ', ' + nombre : ''}. Sesión iniciada correctamente.${donde}`,
    );
    const rol = data.rol;
    this.state.setEmpleadoAndUsuarioId(data.usuarioId, rol, data.empleadoId ?? null);
    this.state.updateMenuGroups(rol);
    this.state.setRole(rol);

    setTimeout(() => {
      this.router.navigate([ROLES_REDIRECT[rol] ?? ROLES_REDIRECT['DEFAULT']]);
    }, 1000);
  }
}
