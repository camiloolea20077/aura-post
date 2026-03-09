import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { environment } from '../../../../../environments/environment';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('nuevaPassword')?.value;
  const confirm = group.get('confirmarPassword')?.value;
  return pass && confirm && pass !== confirm ? { noCoinciden: true } : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    PasswordModule,
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  loading = false;
  token = '';
  estado: 'form' | 'ok' | 'error' = 'form';
  errorMsg = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly http: HttpClient,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group(
      {
        nuevaPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmarPassword: ['', Validators.required],
      },
      { validators: passwordsMatch },
    );
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.estado = 'error';
      this.errorMsg = 'El enlace es inválido o ya fue utilizado.';
      this.cdr.markForCheck();
    }
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(
        this.http.post(`${environment.apiUrl}auth/reset-password`, {
          token: this.token,
          nuevaPassword: this.form.value.nuevaPassword,
        }),
      );
      this.estado = 'ok';
    } catch (err: any) {
      this.estado = 'error';
      this.errorMsg =
        err?.error?.message ?? 'El enlace es inválido o ya expiró.';
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }
}
