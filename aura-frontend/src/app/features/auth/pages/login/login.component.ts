import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
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

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    ToastModule,
    PasswordModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  public frmLogin!: FormGroup;
  public isSubmitting = false;
  public currentYear = new Date().getFullYear();

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly indexDBService: IndexDBService,
    private readonly alertService: AlertService,
    private readonly router: Router,
    private readonly messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.initForm();
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

      if (response?.status === 200 && response?.data?.token) {
        await this.indexDBService.saveAuthData(response.data);
        const nombre =
          response.data.nombreCompleto ?? response.data.username ?? '';
        this.alertService.showSuccess(
          '¡Bienvenido!',
          `Hola${nombre ? ', ' + nombre : ''}. Sesión iniciada correctamente.`,
        );
        const rol = response.data.rol;
        setTimeout(() => {
          if (rol === 'PLATFORM_ADMIN') {
            this.router.navigate(['/platform/dashboard']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        }, 1000);
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
}
