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

import { RadioButtonModule } from 'primeng/radiobutton';
import { MessageModule } from 'primeng/message';

import { ContabilidadService } from '../../../../core/services/contabilidad.service';
import { TerceroService } from '../../../../core/services/tercero.service';
import { CentroCostoService } from '../../../../core/services/centro-costo.service';
import { CuentaBancariaService } from '../../../../core/services/cuenta-bancaria.service';
import { IndexDBService } from '../../../../core/services/index-db.service';
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
    RadioButtonModule,
    MessageModule,
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
  sucursalesOpts: { label: string; value: number }[] = [];
  cuentasBancariasOpts: { label: string; value: number }[] = [];

  // ── Estados de cuenta (cartera) ──
  activeTab = 0;
  carteraItems: any[] = [];
  carteraTotal = 0;
  carteraLoading = false;
  carteraRows = 8;
  carteraSearch = '';
  private lastCarteraEvent?: TableLazyLoadEvent;
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

  /**
   * De dónde sale (o entra) la plata del comprobante.
   *
   * Antes se elegía a mano una cuenta 11xx y ahí se acababa: una cuenta
   * contable no distingue el cajón de la sucursal 2 de la cuenta del banco, así
   * que el recaudo no caía en el cierre de ninguna caja y el asiento podía
   * acreditar CAJA por una transferencia. Es el mismo selector que ya usan el
   * gasto y la compra; la cuenta de la contrapartida la deriva el backend.
   */
  readonly origenOpts = [
    {
      label: 'Caja',
      value: 'CAJA',
      icon: 'pi pi-wallet',
      hint: 'Entra o sale del cajón del punto de venta y afecta su arqueo',
    },
    {
      label: 'Banco',
      value: 'BANCO',
      icon: 'pi pi-building-columns',
      hint: 'Se mueve en una cuenta bancaria de la empresa',
    },
    {
      label: 'Otra cuenta',
      value: 'CUENTA',
      icon: 'pi pi-briefcase',
      hint: 'Caja menor, anticipos a empleados, fondos por legalizar',
    },
    {
      label: 'Ya se movió de la caja',
      value: 'CAJA_OTRO_DIA',
      icon: 'pi pi-history',
      hint: 'La plata se movió otro día y ese arqueo ya se cerró. No toca ninguna caja.',
    },
  ];

  /** Solo medios que pasan por un banco: el efectivo es la vía CAJA. */
  readonly metodosPagoOpts = [
    { label: 'Transferencia', value: 'TRANSFERENCIA' },
    { label: 'Nequi', value: 'NEQUI' },
    { label: 'Tarjeta', value: 'TARJETA' },
    { label: 'Cheque', value: 'CHEQUE' },
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: ContabilidadService,
    private readonly terceroService: TerceroService,
    private readonly ccService: CentroCostoService,
    private readonly cuentaCobrarService: CuentaCobrarService,
    private readonly cuentaPagarService: CuentaPagarService,
    private readonly cuentaBancariaService: CuentaBancariaService,
    private readonly indexDB: IndexDBService,
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
      // ── Origen de fondos (solo CE/RC) ──
      origenFondos: ['CAJA'],
      metodoPago: ['TRANSFERENCIA'],
      cuentaBancariaId: [null],
      cuentaContableId: [null],
      sucursalId: [null],
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
    this.cdr.markForCheck();
  }

  private async cargarSelectores(): Promise<void> {
    const [tercRes, ccRes, bancosRes, sucursales] = await Promise.all([
      lastValueFrom(this.terceroService.tercerosSelector()).catch(() => null),
      lastValueFrom(this.ccService.list()).catch(() => null),
      lastValueFrom(this.cuentaBancariaService.list()).catch(() => null),
      this.indexDB.getSucursales().catch(() => []),
    ]);
    this.cuentasBancariasOpts = (bancosRes?.data ?? [])
      .filter((c: any) => c.activa)
      .map((c: any) => ({ label: c.nombre, value: c.id }));
    this.sucursalesOpts = (sucursales ?? []).map((s: any) => ({
      label: s.nombre,
      value: s.id,
    }));
    if (this.sucursalesOpts.length > 0 && !this.frm.get('sucursalId')!.value) {
      this.frm.patchValue({ sucursalId: this.sucursalesOpts[0].value });
    }
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

    // La cartera es la del beneficiario: al cambiarlo, lo que estuviera
    // seleccionado es de otro tercero y no puede cruzarse contra este
    // comprobante. Se descarta antes de recargar.
    if (Object.keys(this.sel).length > 0) {
      this.sel = {};
      this.sincronizarCartera();
      this.alert.showInfo(
        'Cartera reiniciada',
        'Cambiaste el beneficiario: se quitaron las cuentas que habías seleccionado.',
      );
    }
    if (this.esCartera) {
      this.cargarCartera({ first: 0, rows: this.carteraRows });
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

  // ── Origen de fondos ─────────────────────────────────────────────
  /** El CD es una reclasificación entre cuentas: no mueve dinero. */
  get mueveDinero(): boolean {
    return this.esCE || this.esRC;
  }
  get origen(): string {
    return this.frm.get('origenFondos')!.value ?? 'CAJA';
  }
  get esCaja(): boolean {
    return this.origen === 'CAJA';
  }
  get esBanco(): boolean {
    return this.origen === 'BANCO';
  }
  get esCuenta(): boolean {
    return this.origen === 'CUENTA';
  }
  /** La plata se movió otro día: contablemente es caja, pero no toca arqueos. */
  get esCajaOtroDia(): boolean {
    return this.origen === 'CAJA_OTRO_DIA';
  }

  /**
   * El comprobante tiene fecha anterior a hoy. No lo bloquea — hacer hoy el
   * recibo de un pago de ayer es legítimo — pero advierte: si la plata se movió
   * aquel día, cargarla a la caja de hoy le deja el descuadre a un cajero que
   * no recibió ni entregó nada.
   */
  get esFechaRetroactiva(): boolean {
    const fecha = this.frm.get('fecha')!.value as string | null;
    if (!fecha) return false;
    return fecha < this.hoyISO();
  }

  /** Cambiar de origen limpia los datos del anterior para no mandar basura. */
  onOrigenChange(): void {
    if (!this.esBanco) {
      this.frm.patchValue({ cuentaBancariaId: null }, { emitEvent: false });
    }
    if (!this.esCuenta) {
      this.frm.patchValue({ cuentaContableId: null }, { emitEvent: false });
    }
    this.cdr.markForCheck();
  }

  /**
   * Lo que se manda al backend. El efectivo no es una opción del selector de
   * método: es la vía CAJA, y CAJA_OTRO_DIA también es efectivo — la plata pasó
   * por un cajón, solo que otro día.
   */
  private metodoPagoEfectivo(): string {
    return this.esBanco ? this.frm.get('metodoPago')!.value : 'EFECTIVO';
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
    this.sincronizarCartera();
    if (this.esCartera) {
      this.cargarCartera({ first: 0, rows: this.carteraRows });
    } else {
      this.carteraItems = [];
      this.carteraTotal = 0;
    }
  }

  /** Sin beneficiario no hay cartera que mostrar: ver la de todos no sirve. */
  get faltaBeneficiario(): boolean {
    return this.esCartera && !this.frm.get('beneficiarioTerceroId')!.value;
  }

  async cargarCartera(event: TableLazyLoadEvent): Promise<void> {
    if (!this.esCartera) return;
    this.lastCarteraEvent = event;

    // El cruce es contra la cartera del beneficiario del comprobante. Listarla
    // toda invitaba a abonarle a un tercero la factura de otro: el asiento
    // cuadra y la deuda equivocada queda rebajada, sin nada que lo delate.
    const terceroId = this.frm.get('beneficiarioTerceroId')!.value;
    if (!terceroId) {
      this.carteraItems = [];
      this.carteraTotal = 0;
      this.carteraLoading = false;
      this.cdr.markForCheck();
      return;
    }

    this.carteraLoading = true;
    this.cdr.markForCheck();
    const rows = event.rows ?? this.carteraRows;
    const page = Math.floor((event.first ?? 0) / rows);
    // `estado: pendiente` filtra en el SQL. Filtrarlo aquí dejaba páginas
    // enteras vacías: el servidor pagina antes, así que la página 3 podía no
    // traer ninguna con saldo aunque más adelante sí las hubiera.
    const pageable = {
      page,
      rows,
      search: this.carteraSearch || null,
      params: {
        estado: 'pendiente',
        ...(this.esCE ? { proveedorId: terceroId } : { clienteId: terceroId }),
      },
    };
    try {
      const res: any = this.esCE
        ? await lastValueFrom(this.cuentaPagarService.page(pageable as any))
        : await lastValueFrom(this.cuentaCobrarService.page(pageable as any));
      const content: any[] = res?.data?.content ?? [];
      this.carteraItems = content.filter((c) => (c.saldoPendiente ?? 0) > 0);
      this.carteraTotal = res?.data?.totalElements ?? this.carteraItems.length;
    } catch {
      // 206 sin registros incluido: el tercero no tiene cartera pendiente.
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

    // Línea consolidada de la contrapartida. La cuenta va vacía a propósito:
    // la resuelve el backend a partir del origen de fondos declarado, para que
    // no se pueda acreditar la caja un pago que entró por transferencia.
    const banco = this.nuevaLinea();
    banco.patchValue({
      origen: 'BANCO',
      cuentaId: null,
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
    // El origen de fondos es obligatorio en CE/RC: es lo que decide en qué
    // caja o cuenta queda registrado el dinero, y sin él el comprobante vuelve
    // a mover plata sin aparecer en el cierre de nadie.
    if (this.mueveDinero) {
      if (this.esBanco && !this.frm.get('cuentaBancariaId')!.value) {
        this.alert.showError(
          'Validación',
          'Elige la cuenta bancaria por la que se movió la plata.',
        );
        return;
      }
      if (this.esCuenta && !this.frm.get('cuentaContableId')!.value) {
        this.alert.showError(
          'Validación',
          'Elige la cuenta contable de origen (caja menor, fondos por legalizar…).',
        );
        return;
      }
      if (this.esCaja && !this.frm.get('sucursalId')!.value) {
        this.alert.showError(
          'Validación',
          'Indica la sucursal: es donde está la caja que recibe o entrega el dinero.',
        );
        return;
      }
    }

    const v = this.frm.value;
    // Ignora líneas totalmente vacías (sin cuenta ni valores).
    const lineasValidas = (v.lineas as any[]).filter(
      (l) =>
        l.cuentaId != null ||
        l.origen === 'BANCO' ||
        (+l.debito || 0) !== 0 ||
        (+l.credito || 0) !== 0,
    );
    if (lineasValidas.length < 2) {
      this.alert.showError('Validación', 'Agrega al menos dos movimientos.');
      return;
    }
    // La contrapartida es la única línea sin cuenta: la pone el backend a
    // partir del origen. Las demás sí la exigen.
    if (lineasValidas.some((l) => !l.cuentaId && l.origen !== 'BANCO')) {
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
      // Origen de fondos: solo tiene sentido en CE/RC. En el CD se manda todo
      // en null para que el backend no intente resolver una caja que no existe.
      metodoPago: this.mueveDinero ? this.metodoPagoEfectivo() : null,
      cuentaBancariaId: this.esBanco ? v.cuentaBancariaId : null,
      cuentaContableId: this.esCuenta ? v.cuentaContableId : null,
      sucursalId: this.mueveDinero ? v.sucursalId : null,
      turnoCajaId: null,
      cajaOtroDia: this.mueveDinero && this.esCajaOtroDia,
      detalles: lineasValidas.map((l: any) => ({
        cuentaId: l.cuentaId ?? null,
        origen: l.origen ?? 'MANUAL',
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
