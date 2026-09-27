import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { lastValueFrom } from 'rxjs';

import { PlanCuentaModel } from '../../../../core/models/contabilidad.model';
import {
  CreateCuentaBancariaDto,
  CuentaBancariaModel,
  TIPOS_CUENTA,
} from '../../../../core/models/cuenta-bancaria.model';
import { ContabilidadService } from '../../../../core/services/contabilidad.service';
import { CuentaBancariaService } from '../../../../core/services/cuenta-bancaria.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { TerceroAutocompleteComponent } from '../../../../shared/components/tercero-autocomplete/tercero-autocomplete.component';

/**
 * Cuenta bancaria, caja o billetera. Formulario plano (antes era un diálogo).
 *
 * El código (CB-001…) se asigna solo si no se digita. El saldo ACTUAL no se
 * muestra ni se edita: lo mueve cada documento. Aquí solo va el saldo INICIAL,
 * que es con el que la cuenta arranca en el sistema.
 */
@Component({
  selector: 'app-form-cuenta-bancaria',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DropdownModule,
    InputNumberModule,
    InputTextModule,
    TagModule,
    ToastModule,
    TerceroAutocompleteComponent,
  ],
  providers: [MessageService],
  templateUrl: './form-cuenta-bancaria.component.html',
  styleUrls: ['./form-cuenta-bancaria.component.scss'],
})
export class FormCuentaBancariaComponent implements OnInit {
  frm: FormGroup;
  cuenta: CuentaBancariaModel | null = null;
  loading = false;
  saving = false;
  siguienteCodigo = '';

  readonly tiposOpts = TIPOS_CUENTA.map((t) => ({ label: t.label, value: t.value }));
  /** Solo del disponible (11xx), auxiliares y activas: es lo que acepta el backend. */
  cuentasContablesOpts: { label: string; value: number }[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: CuentaBancariaService,
    private readonly contabilidadService: ContabilidadService,
    private readonly alert: AlertService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.frm = this.fb.group({
      codigo: ['', [Validators.maxLength(20), Validators.pattern(/^[A-Za-z0-9_-]*$/)]],
      nombre: ['', [Validators.required, Validators.maxLength(200)]],
      tipo: ['BANCO', Validators.required],
      banco: [null],
      numeroCuenta: [null],
      titular: [null],
      terceroId: [null],
      cuentaContableId: [null, Validators.required],
      saldoInicial: [0],
      permiteSobregiro: [false],
      cupoSobregiro: [null],
    });
  }

  async ngOnInit(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    await this.cargarCuentasContables();
    if (id) await this.cargar(id);
    else await this.cargarSiguienteCodigo();
  }

  get esEdicion(): boolean {
    return !!this.cuenta;
  }

  get esBanco(): boolean {
    return this.frm.get('tipo')!.value === 'BANCO';
  }

  get permiteSobregiro(): boolean {
    return !!this.frm.get('permiteSobregiro')!.value;
  }

  invalido(campo: string): boolean {
    const c = this.frm.get(campo);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  setSobregiro(v: boolean): void {
    this.frm.patchValue({ permiteSobregiro: v, ...(v ? {} : { cupoSobregiro: null }) });
    this.frm.markAsDirty();
    this.cdr.markForCheck();
  }

  // ── Cargas ───────────────────────────────────────────────────────
  private async cargarCuentasContables(): Promise<void> {
    try {
      const res = await lastValueFrom(this.contabilidadService.listarPlan());
      this.cuentasContablesOpts = (res?.data ?? [])
        .filter((c: PlanCuentaModel) => c.activa !== false && c.auxiliar && c.codigo?.startsWith('11'))
        .map((c: PlanCuentaModel) => ({ label: `${c.codigo} - ${c.nombre}`, value: c.id }));
    } catch {
      this.cuentasContablesOpts = [];
    }
    this.cdr.markForCheck();
  }

  private async cargarSiguienteCodigo(): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.siguienteCodigo());
      this.siguienteCodigo = res?.data ?? '';
    } catch {
      this.siguienteCodigo = '';
    }
    this.cdr.markForCheck();
  }

  private async cargar(id: number): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.getById(id));
      const c = res.data;
      this.cuenta = c;
      // Una cuenta vieja puede tener una contable que hoy no pasa el filtro:
      // se agrega para que no se vea vacía.
      if (c.cuentaContableId && !this.cuentasContablesOpts.some((o) => o.value === c.cuentaContableId)) {
        this.cuentasContablesOpts = [
          { label: c.cuentaContableNombre ?? `Cuenta #${c.cuentaContableId}`, value: c.cuentaContableId },
          ...this.cuentasContablesOpts,
        ];
      }
      this.frm.reset({
        codigo: c.codigo ?? '',
        nombre: c.nombre,
        tipo: c.tipo,
        banco: c.banco,
        numeroCuenta: c.numeroCuenta,
        titular: c.titular,
        terceroId: c.terceroId,
        cuentaContableId: c.cuentaContableId,
        saldoInicial: c.saldoInicial ?? 0,
        permiteSobregiro: c.permiteSobregiro ?? false,
        cupoSobregiro: c.cupoSobregiro ?? null,
      });
    } catch (e: any) {
      this.alert.showError('No se pudo cargar la cuenta', e?.error?.message ?? '');
      this.volver();
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  // ── Guardar ──────────────────────────────────────────────────────
  async guardar(): Promise<void> {
    if (this.frm.invalid) {
      this.frm.markAllAsTouched();
      this.alert.showWarn('Faltan datos', 'Revise el nombre, el tipo y la cuenta contable.');
      this.cdr.markForCheck();
      return;
    }
    const v = this.frm.getRawValue();
    const dto: CreateCuentaBancariaDto = {
      codigo: v.codigo?.trim() || null,
      nombre: v.nombre.trim(),
      tipo: v.tipo,
      // El banco en texto solo aplica a cuentas bancarias.
      banco: v.tipo === 'BANCO' ? v.banco?.trim() || null : null,
      numeroCuenta: v.numeroCuenta?.trim() || null,
      titular: v.titular?.trim() || null,
      terceroId: v.terceroId ?? null,
      cuentaContableId: v.cuentaContableId,
      saldoInicial: +v.saldoInicial || 0,
      permiteSobregiro: !!v.permiteSobregiro,
      cupoSobregiro: v.permiteSobregiro ? v.cupoSobregiro ?? null : null,
    };
    this.saving = true;
    this.cdr.markForCheck();
    try {
      if (this.cuenta) {
        await lastValueFrom(this.service.update(this.cuenta.id, dto));
        this.alert.showSuccess('Cuenta actualizada', dto.nombre);
      } else {
        const res = await lastValueFrom(this.service.create(dto));
        this.alert.showSuccess('Cuenta creada', `${res?.data?.codigo ?? ''} ${dto.nombre}`.trim());
      }
      this.volver();
    } catch (e: any) {
      this.alert.showError('No se pudo guardar', e?.error?.message ?? 'Intente de nuevo');
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  volver(): void {
    this.router.navigate(['/tesoreria/cuentas-bancarias']);
  }
}
