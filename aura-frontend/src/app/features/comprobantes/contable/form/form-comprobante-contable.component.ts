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
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { lastValueFrom } from 'rxjs';

import { ContabilidadService } from '../../../../core/services/contabilidad.service';
import { TerceroService } from '../../../../core/services/tercero.service';
import { CentroCostoService } from '../../../../core/services/centro-costo.service';
import { CuentaCobrarService } from '../../../cuentas/services/cuenta-cobrar.service';
import { CuentaPagarService } from '../../../cuentas/services/cuenta-pagar.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import {
  CreateComprobanteDto,
  PlanCuentaModel,
} from '../../../../core/models/contabilidad.model';
import { TerceroTableModel } from '../../../../core/models/tercero.model';
import { CentroCostoDto } from '../../../../core/models/centro-costo.model';

import { aFechaLocal } from '../../../../shared/utils/fecha.util';
@Component({
  selector: 'app-form-comprobante-contable',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    TableModule,
    TabViewModule,
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
  cuentasDisponibleOpts: { label: string; value: number }[] = [];
  terceroOpts: { label: string; value: number }[] = [];
  centroCostoOpts: { label: string; value: number }[] = [];

  // ── Estados de cuenta (cartera) ──
  activeTab = 0;
  carteraItems: any[] = [];
  carteraTotal = 0;
  carteraLoading = false;
  carteraRows = 8;
  carteraSearch = '';
  private lastCarteraEvent?: TableLazyLoadEvent;
  cuentaContrapartidaId: number | null = null;
  // id de cuenta seleccionada → valor aplicado (+ datos para la línea)
  sel: Record<
    number,
    {
      aplicado: number;
      saldo: number;
      nombre: string;
      numero: string;
      terceroId: number | null;
    }
  > = {};

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
    private readonly cuentaCobrarService: CuentaCobrarService,
    private readonly cuentaPagarService: CuentaPagarService,
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
      cuentaId: [null],
      descripcion: [null],
      debito: [0],
      credito: [0],
      terceroId: [null],
      centroCostoId: [null],
      origen: ['MANUAL'], // MANUAL | CARTERA | BANCO
    });
  }

  agregarLinea(): void {
    this.lineas.push(this.nuevaLinea());
    this.cdr.markForCheck();
  }

  quitarLinea(i: number): void {
    if (this.lineas.length <= 1) return;
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
    // Cuentas de disponible (caja/bancos, código 11xx) para la contrapartida.
    const disp = this.cuentas.filter(
      (c) => c.auxiliar && c.activa && (c.codigo || '').startsWith('11'),
    );
    this.cuentasDisponibleOpts = (
      disp.length ? disp : this.cuentas.filter((c) => c.auxiliar && c.activa)
    ).map((c) => ({ label: `${c.codigo} - ${c.nombre}`, value: c.id }));
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

  // ── Estados de cuenta (cartera) ──────────────────────────────────
  get esCE(): boolean {
    return this.frm.get('tipoComprobante')!.value === 'CE';
  }
  get esRC(): boolean {
    return this.frm.get('tipoComprobante')!.value === 'RC';
  }
  get esCartera(): boolean {
    return this.esCE || this.esRC;
  }

  private nombreItem(x: any): string {
    return this.esCE ? x.proveedorNombre : x.clienteNombre;
  }
  private terceroIdItem(x: any): number | null {
    return (this.esCE ? x.proveedorId : x.clienteId) ?? null;
  }

  /** Al cambiar el tipo: recalcula consecutivo, limpia selección y recarga cartera. */
  onTipoChange(): void {
    this.cargarConsecutivo();
    this.sel = {};
    this.cuentaContrapartidaId = null;
    this.sincronizarCartera();
    if (this.esCartera) {
      this.cargarCartera({ first: 0, rows: this.carteraRows });
    } else {
      this.carteraItems = [];
      this.carteraTotal = 0;
    }
  }

  async cargarCartera(event: TableLazyLoadEvent): Promise<void> {
    if (!this.esCartera) return;
    this.lastCarteraEvent = event;
    this.carteraLoading = true;
    this.cdr.markForCheck();
    const rows = event.rows ?? this.carteraRows;
    const page = Math.floor((event.first ?? 0) / rows);
    const pageable = { page, rows, search: this.carteraSearch || null };
    try {
      const res: any = this.esCE
        ? await lastValueFrom(this.cuentaPagarService.page(pageable))
        : await lastValueFrom(this.cuentaCobrarService.page(pageable));
      const content: any[] = res?.data?.content ?? [];
      this.carteraItems = content.filter((c) => (c.saldoPendiente ?? 0) > 0);
      this.carteraTotal = res?.data?.totalElements ?? this.carteraItems.length;
    } catch {
      this.carteraItems = [];
      this.carteraTotal = 0;
    } finally {
      this.carteraLoading = false;
      this.cdr.markForCheck();
    }
  }

  buscarCartera(): void {
    this.cargarCartera({
      ...(this.lastCarteraEvent ?? {}),
      first: 0,
      rows: this.carteraRows,
    });
  }

  estaSel(id: number): boolean {
    return this.sel[id] != null;
  }

  toggleSel(item: any, checked: boolean): void {
    if (checked) {
      this.sel[item.id] = {
        aplicado: item.saldoPendiente,
        saldo: item.saldoPendiente,
        nombre: this.nombreItem(item),
        numero: item.numeroCuenta,
        terceroId: this.terceroIdItem(item),
      };
    } else {
      delete this.sel[item.id];
    }
    this.sincronizarCartera();
  }

  onAplicadoChange(id: number): void {
    const s = this.sel[id];
    if (!s) return;
    if (s.aplicado == null || s.aplicado < 0) s.aplicado = 0;
    if (s.aplicado > s.saldo) s.aplicado = s.saldo; // no exceder el saldo pendiente
    this.sincronizarCartera();
  }

  get totalAplicado(): number {
    return Object.values(this.sel).reduce(
      (sum, s) => sum + (s.aplicado || 0),
      0,
    );
  }

  private cuentaIdPorCodigo(codigo: string): number | null {
    return this.cuentas.find((c) => c.codigo === codigo)?.id ?? null;
  }

  /** Reconstruye las líneas de cartera (una por cuenta) + la línea consolidada de banco/caja. */
  private lineaVacia(l: any): boolean {
    return (
      !l.get('cuentaId')!.value &&
      !(+l.get('debito')!.value || 0) &&
      !(+l.get('credito')!.value || 0)
    );
  }

  sincronizarCartera(): void {
    // Quita las líneas generadas anteriormente (cartera + banco).
    for (let i = this.lineas.length - 1; i >= 0; i--) {
      const o = this.lineas.at(i).get('origen')!.value;
      if (o === 'CARTERA' || o === 'BANCO') this.lineas.removeAt(i);
    }

    const seleccionados = Object.entries(this.sel).filter(
      ([, s]) => (s.aplicado || 0) > 0,
    );

    if (seleccionados.length === 0) {
      // Sin selección: deja al menos dos líneas manuales para captura manual.
      if (this.lineas.length === 0) {
        this.lineas.push(this.nuevaLinea());
        this.lineas.push(this.nuevaLinea());
      }
      this.cdr.markForCheck();
      return;
    }

    // Hay cartera: elimina las líneas manuales vacías para no ensuciar el asiento.
    for (let i = this.lineas.length - 1; i >= 0; i--) {
      const l = this.lineas.at(i);
      if (l.get('origen')!.value === 'MANUAL' && this.lineaVacia(l)) {
        this.lineas.removeAt(i);
      }
    }

    const cuentaCartera = this.cuentaIdPorCodigo(this.esCE ? '2205' : '1305');
    let total = 0;
    for (const [, s] of seleccionados) {
      const l = this.nuevaLinea();
      l.patchValue({
        origen: 'CARTERA',
        cuentaId: cuentaCartera,
        terceroId: s.terceroId,
        descripcion: `${this.esCE ? 'Abono CxP' : 'Abono CxC'} ${s.numero} - ${s.nombre}`,
        debito: this.esCE ? s.aplicado : 0,
        credito: this.esCE ? 0 : s.aplicado,
      });
      this.lineas.push(l);
      total += s.aplicado;
    }

    // Línea consolidada de banco/caja (contrapartida).
    const banco = this.nuevaLinea();
    banco.patchValue({
      origen: 'BANCO',
      cuentaId: this.cuentaContrapartidaId,
      descripcion: this.esCE ? 'Pago a proveedores' : 'Recaudo de clientes',
      debito: this.esCE ? 0 : total,
      credito: this.esCE ? total : 0,
    });
    this.lineas.push(banco);
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
    if (
      Object.keys(this.sel).length > 0 &&
      this.cuentaContrapartidaId == null
    ) {
      this.alert.showError(
        'Validación',
        'Selecciona la cuenta de banco/caja para la contrapartida.',
      );
      return;
    }

    const v = this.frm.value;
    // Ignora líneas totalmente vacías (sin cuenta ni valores).
    const lineasValidas = (v.lineas as any[]).filter(
      (l) =>
        l.cuentaId != null || (+l.debito || 0) !== 0 || (+l.credito || 0) !== 0,
    );
    if (lineasValidas.length < 2) {
      this.alert.showError('Validación', 'Agrega al menos dos movimientos.');
      return;
    }
    if (lineasValidas.some((l) => !l.cuentaId)) {
      this.alert.showError(
        'Validación',
        'Cada línea con valor debe tener una cuenta.',
      );
      return;
    }
    if (!this.cuadrado) {
      this.alert.showError(
        'No cuadra',
        'El total débito debe ser igual al total crédito.',
      );
      return;
    }

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
      detalles: lineasValidas.map((l: any) => ({
        cuentaId: l.cuentaId,
        descripcion: l.descripcion || null,
        debito: l.debito || 0,
        credito: l.credito || 0,
        terceroId: l.terceroId ?? null,
        centroCostoId: l.centroCostoId ?? null,
      })),
      // Cruce de cartera: aplica el pago a cada cuenta seleccionada.
      aplicaciones: Object.entries(this.sel)
        .filter(([, s]) => (s.aplicado || 0) > 0)
        .map(([id, s]) => ({
          tipo: (this.esCE ? 'CXP' : 'CXC') as 'CXC' | 'CXP',
          cuentaId: +id,
          monto: s.aplicado,
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
    return aFechaLocal(new Date());
  }
}
