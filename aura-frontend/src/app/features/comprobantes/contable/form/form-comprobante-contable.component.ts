import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { lastValueFrom } from 'rxjs';

import { ContabilidadService } from '../../../../core/services/contabilidad.service';
import { TerceroService } from '../../../../core/services/tercero.service';
import { CentroCostoService } from '../../../../core/services/centro-costo.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import {
  CreateComprobanteDto,
  PlanCuentaModel,
} from '../../../../core/models/contabilidad.model';
import { TerceroTableModel } from '../../../../core/models/tercero.model';
import { CentroCostoDto } from '../../../../core/models/centro-costo.model';

@Component({
  selector: 'app-form-comprobante-contable',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    TableModule,
    DropdownModule,
    InputTextModule,
    InputNumberModule,
  ],
  templateUrl: './form-comprobante-contable.component.html',
  styleUrls: ['./form-comprobante-contable.component.scss'],
})
export class FormComprobanteContableComponent implements OnInit {
  frm: FormGroup;
  saving = false;
  consecutivoPreview = '';

  cuentas: PlanCuentaModel[] = [];
  terceros: TerceroTableModel[] = [];
  cuentasAuxOpts: { label: string; value: number }[] = [];
  terceroOpts: { label: string; value: number }[] = [];
  centroCostoOpts: { label: string; value: number }[] = [];

  readonly tipoComprobanteOpts = [
    { label: 'Comprobante de Egreso (CE)', value: 'CE' },
    { label: 'Recibo de Caja / Ingreso (RC)', value: 'RC' },
    { label: 'Nota de Diario (CD)', value: 'CD' },
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: ContabilidadService,
    private readonly terceroService: TerceroService,
    private readonly ccService: CentroCostoService,
    private readonly alert: AlertService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.frm = this.fb.group({
      tipoComprobante: ['CE', Validators.required],
      fecha: [this.hoyISO(), Validators.required],
      fechaVencimiento: [null],
      beneficiarioTerceroId: [null],
      beneficiarioNombre: [null],
      beneficiarioDireccion: [null],
      beneficiarioTelefono: [null],
      ciudad: [null],
      concepto: ['', Validators.required],
      lineas: this.fb.array([this.nuevaLinea(), this.nuevaLinea()]),
    });
  }

  ngOnInit(): void {
    this.cargarCuentas();
    this.cargarSelectores();
    this.cargarConsecutivo();
  }

  // ── FormArray de líneas ──────────────────────────────────────────
  get lineas(): FormArray {
    return this.frm.get('lineas') as FormArray;
  }

  private nuevaLinea(): FormGroup {
    return this.fb.group({
      cuentaId: [null, Validators.required],
      descripcion: [null],
      debito: [0],
      credito: [0],
      terceroId: [null],
      centroCostoId: [null],
    });
  }

  agregarLinea(): void {
    this.lineas.push(this.nuevaLinea());
    this.cdr.markForCheck();
  }

  quitarLinea(i: number): void {
    if (this.lineas.length <= 2) return;
    this.lineas.removeAt(i);
    this.cdr.markForCheck();
  }

  // ── Cuadre ───────────────────────────────────────────────────────
  get totalDebito(): number {
    return this.lineas.controls.reduce(
      (s, c) => s + (+c.get('debito')!.value || 0),
      0,
    );
  }

  get totalCredito(): number {
    return this.lineas.controls.reduce(
      (s, c) => s + (+c.get('credito')!.value || 0),
      0,
    );
  }

  get diferencia(): number {
    return this.totalDebito - this.totalCredito;
  }

  get cuadrado(): boolean {
    return Math.abs(this.diferencia) < 0.01 && this.totalDebito > 0;
  }

  // ── Cargas ───────────────────────────────────────────────────────
  private async cargarCuentas(): Promise<void> {
    const res = await lastValueFrom(this.service.listarPlan()).catch(
      () => null,
    );
    this.cuentas = res?.data ?? [];
    this.cuentasAuxOpts = this.cuentas
      .filter((c) => c.auxiliar && c.activa)
      .map((c) => ({ label: `${c.codigo} - ${c.nombre}`, value: c.id }));
    this.cdr.markForCheck();
  }

  private async cargarSelectores(): Promise<void> {
    const [tercRes, ccRes] = await Promise.all([
      lastValueFrom(this.terceroService.tercerosSelector()).catch(() => null),
      lastValueFrom(this.ccService.list()).catch(() => null),
    ]);
    this.terceros = tercRes?.data ?? [];
    this.terceroOpts = this.terceros.map((t: TerceroTableModel) => ({
      label: `${t.numeroDocumento} — ${t.nombreCompleto}`,
      value: t.id,
    }));
    this.centroCostoOpts = (ccRes?.data ?? []).map((cc: CentroCostoDto) => ({
      label: `${cc.codigo} — ${cc.nombre}`,
      value: cc.id,
    }));
    this.cdr.markForCheck();
  }

  async cargarConsecutivo(): Promise<void> {
    const tipo = this.frm.get('tipoComprobante')!.value;
    try {
      const res = await lastValueFrom(this.service.siguienteConsecutivo(tipo));
      this.consecutivoPreview = res?.data ?? '';
    } catch {
      this.consecutivoPreview = '';
    }
    this.cdr.markForCheck();
  }

  /** Al elegir el beneficiario, autollena nombre y teléfono; la dirección la completa el backend. */
  onBeneficiarioChange(): void {
    const id = this.frm.get('beneficiarioTerceroId')!.value;
    const t = this.terceros.find((x) => x.id === id);
    if (t) {
      this.frm.patchValue({
        beneficiarioNombre: t.nombreCompleto,
        beneficiarioTelefono: t.telefono ?? null,
      });
    }
    this.cdr.markForCheck();
  }

  // ── Guardar ──────────────────────────────────────────────────────
  async guardar(): Promise<void> {
    if (this.frm.invalid) {
      this.frm.markAllAsTouched();
      this.alert.showError(
        'Validación',
        'Completa el tipo, la fecha y el concepto.',
      );
      return;
    }
    if (this.lineas.controls.some((c) => !c.get('cuentaId')!.value)) {
      this.alert.showError('Validación', 'Cada línea debe tener una cuenta.');
      return;
    }
    if (!this.cuadrado) {
      this.alert.showError(
        'No cuadra',
        'El total débito debe ser igual al total crédito.',
      );
      return;
    }

    const v = this.frm.value;
    const dto: CreateComprobanteDto = {
      tipoComprobante: v.tipoComprobante,
      fecha: v.fecha,
      concepto: v.concepto,
      beneficiarioTerceroId: v.beneficiarioTerceroId ?? null,
      beneficiarioNombre: v.beneficiarioNombre ?? null,
      beneficiarioDireccion: v.beneficiarioDireccion ?? null,
      beneficiarioTelefono: v.beneficiarioTelefono ?? null,
      ciudad: v.ciudad ?? null,
      fechaVencimiento: v.fechaVencimiento || null,
      detalles: v.lineas.map((l: any) => ({
        cuentaId: l.cuentaId,
        descripcion: l.descripcion || null,
        debito: l.debito || 0,
        credito: l.credito || 0,
        terceroId: l.terceroId ?? null,
        centroCostoId: l.centroCostoId ?? null,
      })),
    };

    this.saving = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(this.service.crearComprobante(dto));
      this.alert.showSuccess('Comprobante creado', 'Quedó contabilizado.');
      this.router.navigate(['/comprobantes']);
    } catch (e: any) {
      this.alert.showError(
        'Error',
        e?.error?.message ?? 'No se pudo crear el comprobante',
      );
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  cancelar(): void {
    this.router.navigate(['/comprobantes']);
  }

  // ── Helpers ──────────────────────────────────────────────────────
  formatCOP(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }

  private hoyISO(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
