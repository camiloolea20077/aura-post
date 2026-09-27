import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import {
  EmpresaConfig,
  EmpresaService,
} from '../../core/services/empresa.service';
import { IndexDBService } from '../../core/services/index-db.service';
import { AlertService } from '../../shared/pipes/alert.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    TooltipModule,
    ToastModule,
    ProgressSpinnerModule,
  ],
  providers: [MessageService],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
})
export class PerfilComponent implements OnInit {
  cargando = true;
  guardando = false;
  editando = false;

  // ── Usuario ────────────────────────────────────────────────
  nombreCompleto = '';
  username = '';
  rol = '';
  sucursalNombre = '';
  sucursales: string[] = [];

  // ── Empresa ────────────────────────────────────────────────
  empresa: EmpresaConfig | null = null;
  form: FormGroup;

  /** Ver la empresa lo puede todo el mundo; cambiarla, solo el admin. */
  get puedeEditar(): boolean {
    const r = (this.rol || '').toUpperCase();
    return r === 'ADMIN' || r === 'SUPER_ADMIN';
  }

  get iniciales(): string {
    const partes = (this.nombreCompleto || this.username || '?')
      .trim()
      .split(/\s+/);
    return (partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '');
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly empresaService: EmpresaService,
    private readonly indexDB: IndexDBService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      telefono: ['', Validators.maxLength(30)],
      correo: ['', [Validators.email, Validators.maxLength(150)]],
      direccion: ['', Validators.maxLength(200)],
      municipio: ['', Validators.maxLength(120)],
    });
  }

  async ngOnInit(): Promise<void> {
    await Promise.all([this.cargarUsuario(), this.cargarEmpresa()]);
    this.cargando = false;
    this.cdr.markForCheck();
  }

  private async cargarUsuario(): Promise<void> {
    const auth = await this.indexDB.loadDataAuthDB();
    if (!auth) return;
    this.nombreCompleto = auth.nombreCompleto ?? '';
    this.username = (auth as any).username ?? '';
    this.rol = auth.rol ?? '';
    this.sucursales = (auth.sucursales ?? []).map((s: any) => s.nombre);
    const actual =
      (auth.sucursales ?? []).find((s: any) => s.esDefault) ??
      (auth.sucursales ?? [])[0];
    this.sucursalNombre = actual?.nombre ?? '';
  }

  private async cargarEmpresa(): Promise<void> {
    try {
      const res = await lastValueFrom(this.empresaService.getConfig());
      this.empresa = res?.data ?? null;
      this.volcarAlFormulario();
    } catch {
      this.empresa = null;
    }
  }

  private volcarAlFormulario(): void {
    this.form.patchValue({
      telefono: this.empresa?.telefono ?? '',
      correo: this.empresa?.correo ?? '',
      direccion: this.empresa?.direccion ?? '',
      municipio: this.empresa?.municipio ?? '',
    });
  }

  editar(): void {
    if (!this.puedeEditar) return;
    this.editando = true;
  }

  cancelar(): void {
    this.editando = false;
    this.volcarAlFormulario();
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando = true;
    try {
      const res = await lastValueFrom(
        this.empresaService.actualizarContacto(this.form.value),
      );
      this.empresa = res?.data ?? this.empresa;
      this.volcarAlFormulario();
      this.editando = false;
      this.alert.showSuccess('Guardado', 'Datos de la empresa actualizados');
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudieron guardar los datos',
      );
    } finally {
      this.guardando = false;
      this.cdr.markForCheck();
    }
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }
}
