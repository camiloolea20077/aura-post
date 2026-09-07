import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TooltipModule } from 'primeng/tooltip';
import { FieldsetModule } from 'primeng/fieldset';
import { RadioButtonModule } from 'primeng/radiobutton';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { GastoService } from '../../../core/services/gasto.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { IndexDBService } from '../../../core/services/index-db.service';
import { TerceroService } from '../../../core/services/tercero.service';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { CuentaBancariaService } from '../../../core/services/cuenta-bancaria.service';
import {
  CATEGORIAS_GASTO,
  CreateGastoDto,
  GastoModel,
  GastoTableModel,
  TIPO_DOC_SOPORTE_OPTIONS,
} from '../../../core/models/gasto.model';
import { TerceroTableModel } from '../../../core/models/tercero.model';
import { PlanCuentaModel } from '../../../core/models/contabilidad.model';

import { aFechaLocal } from '../../../shared/utils/fecha.util';
@Component({
  selector: 'app-form-gasto',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    DropdownModule,
    SelectModule,
    InputNumberModule,
    InputTextModule,
    CalendarModule,
    ToastModule,
    AutoCompleteModule,
    TooltipModule,
    FieldsetModule,
    RadioButtonModule,
    MessageModule,
  ],
  providers: [MessageService],
  templateUrl: './form-gasto.component.html',
  styleUrls: ['./form-gasto.component.scss'],
})
export class FormGastoComponent implements OnInit {
  private gastoToEdit: GastoTableModel | null = null;
  public frm!: FormGroup;

  loadingPage = false;
  isSubmitting = false;

  // Opciones de dropdowns
  sucursalesOpts: { label: string; value: number }[] = [];
  /** Todas las cuentas: el DÉBITO, a qué se imputa el gasto. */
  cuentasOpts: { label: string; value: number }[] = [];
  /** Solo cuentas habilitadas como medio de pago: el CRÉDITO, de dónde sale la plata. */
  cuentasPagoOpts: { label: string; value: number }[] = [];
  cuentasBancariasOpts: { label: string; value: number }[] = [];

  /**
   * De dónde sale la plata. Se pregunta explícitamente en vez de deducirlo:
   * antes, un gasto en efectivo caía siempre en la caja abierta del punto,
   * aunque lo hubiera pagado el administrador de su caja menor. Con una factura
   * de días atrás eso descuadraba el arqueo de HOY con plata que el cajero de
   * hoy nunca gastó.
   */
  readonly origenOpts = [
    {
      label: 'No se ha pagado',
      value: 'CREDITO',
      icon: 'pi pi-clock',
      hint: 'Queda como cuenta por pagar al tercero',
    },
    {
      label: 'Caja',
      value: 'CAJA',
      icon: 'pi pi-wallet',
      hint: 'Sale del cajón del punto de venta y afecta su arqueo',
    },
    {
      label: 'Banco',
      value: 'BANCO',
      icon: 'pi pi-building-columns',
      hint: 'Sale de una cuenta bancaria de la empresa',
    },
    {
      label: 'Otra cuenta',
      value: 'CUENTA',
      icon: 'pi pi-briefcase',
      hint: 'Caja menor, anticipos a empleados, fondos por legalizar',
    },
    {
      label: 'Ya salió de la caja',
      value: 'CAJA_OTRO_DIA',
      icon: 'pi pi-history',
      hint: 'La plata salió otro día y ese arqueo ya se cerró. No toca ninguna caja.',
    },
  ];

  /** Solo medios que pasan por un banco: el efectivo es la vía CAJA. */
  readonly metodosPagoOpts = [
    { label: 'Transferencia', value: 'TRANSFERENCIA' },
    { label: 'Nequi', value: 'NEQUI' },
    { label: 'Tarjeta', value: 'TARJETA' },
    { label: 'Cheque', value: 'CHEQUE' },
  ];

  // Autocomplete tercero (objeto completo, fuera del form)
  terceroSugerencias: TerceroTableModel[] = [];
  terceroSeleccionado: TerceroTableModel | null = null;

  readonly categoriasOpts = CATEGORIAS_GASTO.map((c) => ({
    label: c.label,
    value: c.value,
    deducible: c.deducible,
  }));
  readonly tipoDocOpts = TIPO_DOC_SOPORTE_OPTIONS;

  get modoEdicion(): boolean {
    return this.gastoToEdit != null;
  }

  constructor(
    private readonly gastoService: GastoService,
    private readonly alertService: AlertService,
    private readonly indexDB: IndexDBService,
    private readonly terceroService: TerceroService,
    private readonly contabilidadService: ContabilidadService,
    private readonly cuentaBancariaService: CuentaBancariaService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    public readonly cdr: ChangeDetectorRef,
    private readonly fb: FormBuilder,
  ) {}

  async ngOnInit(): Promise<void> {
    this.initForm();
    const id = this.route.snapshot.params['id'];
    await Promise.all([
      this.loadSucursales(),
      this.loadCuentas(),
      this.loadMediosPago(),
      this.loadCuentasBancarias(),
    ]);
    if (id) {
      await this.cargarParaEditar(+id);
    }
    this.cdr.markForCheck();
  }

  private initForm(): void {
    this.frm = this.fb.group({
      sucursalId: [null, Validators.required],
      categoria: ['', Validators.required],
      monto: [null, Validators.required],
      fecha: [new Date()],
      deducible: [false],
      // Origen de fondos (V142/V146): de dónde sale la plata, declarado. De
      // aquí se derivan formaPago, metodoPago y la cuenta al guardar.
      //
      // Arranca VACÍO a propósito. Con "Caja" preseleccionado, quien no tocaba
      // el bloque terminaba cargando a la caja del punto una factura que había
      // pagado de otro lado — justo lo que este campo existe para evitar.
      origenFondos: [null, Validators.required],
      metodoPago: ['TRANSFERENCIA'],
      cuentaBancariaId: [null],
      cuentaPagoId: [null],
      // Solo se pide cuando el documento excede la ventana de gracia y va por
      // caja; el backend es quien decide si es obligatorio.
      motivoRetroactivo: [''],
      tipoDocSoporte: [null],
      numeroDocSoporte: [''],
      descripcion: [''],
      cuentaContableId: [null],
      baseIva: [0],
      tarifaIva: [0],
      valorIva: [{ value: 0, disabled: true }],
      baseRetefuente: [0],
      tarifaRetefuente: [0],
      valorRetefuente: [{ value: 0, disabled: true }],
      baseReteica: [0],
      tarifaReteica: [0],
      valorReteica: [{ value: 0, disabled: true }],
    });
  }

  private async loadSucursales(): Promise<void> {
    const list = await this.indexDB.getSucursales();
    this.sucursalesOpts = list.map((s) => ({ label: s.nombre, value: s.id }));
    if (list.length > 0) this.frm.patchValue({ sucursalId: list[0].id });
  }

  private async loadCuentas(): Promise<void> {
    try {
      const res = await lastValueFrom(this.contabilidadService.listarPlan());
      const plan = res?.data ?? [];
      this.cuentasOpts = plan.map((c: PlanCuentaModel) => ({
        label: `${c.codigo} - ${c.nombre}`,
        value: c.id,
      }));
    } catch {
      this.cuentasOpts = [];
    }
  }

  /**
   * De dónde puede salir la plata. Lo decide el contador con el flag
   * es_medio_pago, no un filtro por tipo aquí: filtrar por ACTIVO dejaba pasar
   * inventarios y cartera como si fueran medios de pago, y el backend los
   * rechaza. Aquí aparece la CAJA MENOR.
   */
  private async loadMediosPago(): Promise<void> {
    try {
      const res = await lastValueFrom(
        this.contabilidadService.listarMediosPago(),
      );
      this.cuentasPagoOpts = (res?.data ?? []).map((c: PlanCuentaModel) => ({
        label: `${c.codigo} - ${c.nombre}`,
        value: c.id,
      }));
    } catch {
      this.cuentasPagoOpts = [];
    }
  }

  private async loadCuentasBancarias(): Promise<void> {
    try {
      const res = await lastValueFrom(this.cuentaBancariaService.list());
      this.cuentasBancariasOpts = (res?.data ?? [])
        .filter((c) => c.activa)
        .map((c) => ({ label: c.nombre, value: c.id }));
    } catch {
      this.cuentasBancariasOpts = [];
    }
  }

  get origen(): string {
    return this.frm.get('origenFondos')?.value ?? 'CAJA';
  }

  get esCredito(): boolean {
    return this.origen === 'CREDITO';
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

  /** La plata salió otro día: contablemente es caja, pero no mueve ningún arqueo. */
  get esCajaOtroDia(): boolean {
    return this.origen === 'CAJA_OTRO_DIA';
  }

  /**
   * El documento tiene fecha anterior a hoy.
   *
   * <p>No lo bloquea — hay casos legítimos, como pagar hoy una factura vieja —
   * pero sí advierte: si la plata salió aquel día, cargarla a la caja de hoy le
   * deja el descuadre a un cajero que no gastó nada.
   */
  get esFechaRetroactiva(): boolean {
    const fecha = this.frm.get('fecha')?.value as Date | null;
    if (fecha == null) return false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const f = new Date(fecha);
    f.setHours(0, 0, 0, 0);
    return f.getTime() < hoy.getTime();
  }

  /** Cambiar de origen limpia los datos del anterior para no mandar basura. */
  onOrigenChange(): void {
    if (!this.esBanco)
      this.frm.patchValue({ cuentaBancariaId: null }, { emitEvent: false });
    if (!this.esCuenta)
      this.frm.patchValue({ cuentaPagoId: null }, { emitEvent: false });
    this.cdr.markForCheck();
  }

  private async cargarParaEditar(id: number): Promise<void> {
    this.loadingPage = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.gastoService.getById(id));
      const g = res?.data ?? null;
      this.gastoToEdit = g;
      if (g) {
        this.frm.patchValue({
          sucursalId: g.sucursalId ?? null,
          categoria: g.categoria,
          monto: g.monto,
          fecha: g.fecha ? new Date(g.fecha + 'T00:00:00') : new Date(),
          deducible: g.deducible,
          descripcion: g.descripcion ?? '',
          tipoDocSoporte: g.tipoDocSoporte ?? null,
          numeroDocSoporte: g.numeroDocSoporte ?? '',
          cuentaContableId: g.cuentaContableId ?? null,
          origenFondos: this.deducirOrigen(g),
          metodoPago:
            g.metodoPago && g.metodoPago !== 'EFECTIVO'
              ? g.metodoPago
              : 'TRANSFERENCIA',
          cuentaBancariaId: g.cuentaBancariaId ?? null,
          // Solo si la eligió alguien. En los demás orígenes `cuentaPagoId`
          // trae la cuenta que resolvió el sistema (CAJA, o la del banco), y
          // precargarla haría que al pasar a "Otra cuenta" apareciera
          // seleccionada una cuenta que nadie escogió.
          cuentaPagoId:
            this.deducirOrigen(g) === 'CUENTA' ? (g.cuentaPagoId ?? null) : null,
          baseIva: g.baseIva ?? 0,
          tarifaIva: g.tarifaIva ?? 0,
          valorIva: g.valorIva ?? 0,
          baseRetefuente: g.baseRetefuente ?? 0,
          tarifaRetefuente: g.tarifaRetefuente ?? 0,
          valorRetefuente: g.valorRetefuente ?? 0,
          baseReteica: g.baseReteica ?? 0,
          tarifaReteica: g.tarifaReteica ?? 0,
          valorReteica: g.valorReteica ?? 0,
        });
        // Reconstruir el tercero seleccionado para el autocomplete (muestra nombreCompleto)
        this.terceroSeleccionado = g.terceroId
          ? ({
              id: g.terceroId,
              nombreCompleto: g.terceroNombre ?? '',
            } as unknown as TerceroTableModel)
          : null;
      }
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar el gasto.');
    } finally {
      this.loadingPage = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Reconstruye el origen de un gasto ya guardado.
   *
   * <p>El backend guarda las tres piezas por separado (forma de pago, cuenta
   * bancaria, cuenta de pago) porque son lo que necesita el asiento. La UI las
   * presenta como una sola pregunta, así que al editar hay que deshacer el
   * camino. El orden importa: es el mismo con el que el backend resuelve.
   */
  private deducirOrigen(g: GastoModel): string {
    // Lo manda el backend, que es el único que puede distinguir CAJA de
    // CUENTA: las dos guardan `cuentaPagoId` y saber cuál de las dos cuentas
    // es la de efectivo de la empresa es cosa del resolutor.
    if (g.origenFondos) return g.origenFondos;

    // Respaldo para respuestas de un backend anterior. El flag va antes que
    // las cuentas: es una afirmación sobre un hecho pasado, y la cuenta que
    // quedó guardada es la de CAJA, que se confundiría con un pago normal.
    if (g.formaPago === 'CREDITO') return 'CREDITO';
    if (g.salidaCajaOtroDia) return 'CAJA_OTRO_DIA';
    if (g.cuentaBancariaId != null) return 'BANCO';
    if (g.cuentaPagoId != null) return 'CUENTA';
    return 'CAJA';
  }

  onCategoriaChange(val: string): void {
    const cat = CATEGORIAS_GASTO.find((c) => c.value === val);
    if (cat != null) this.frm.patchValue({ deducible: cat.deducible });
    this.cdr.markForCheck();
  }

  recalcularIva(): void {
    const base = this.frm.get('baseIva')?.value ?? 0;
    const tarifa = this.frm.get('tarifaIva')?.value ?? 0;
    this.frm.get('valorIva')?.setValue(+((base * tarifa) / 100).toFixed(2));
    this.cdr.markForCheck();
  }

  recalcularRetefuente(): void {
    const base = this.frm.get('baseRetefuente')?.value ?? 0;
    const tarifa = this.frm.get('tarifaRetefuente')?.value ?? 0;
    this.frm
      .get('valorRetefuente')
      ?.setValue(+((base * tarifa) / 100).toFixed(2));
    this.cdr.markForCheck();
  }

  recalcularReteica(): void {
    const base = this.frm.get('baseReteica')?.value ?? 0;
    const tarifa = this.frm.get('tarifaReteica')?.value ?? 0;
    this.frm.get('valorReteica')?.setValue(+((base * tarifa) / 100).toFixed(2));
    this.cdr.markForCheck();
  }

  async buscarTerceros(event: { query: string }): Promise<void> {
    try {
      const res = await lastValueFrom(
        this.terceroService.proveedores(event.query),
      );
      this.terceroSugerencias = res?.data ?? [];
    } catch {
      this.terceroSugerencias = [];
    }
    this.cdr.markForCheck();
  }

  async save(): Promise<void> {
    if (this.frm.invalid) {
      this.frm.markAllAsTouched();
      const faltaOrigen = !this.frm.get('origenFondos')?.value;
      this.alertService.showWarn(
        'Campos requeridos',
        faltaOrigen
          ? 'Indica de dónde sale la plata.'
          : 'Completa sucursal, categoría y monto.',
      );
      return;
    }
    const v = this.frm.getRawValue();

    // El backend rechaza estos casos igual, pero avisar aquí ahorra el viaje y
    // dice exactamente qué falta.
    if (this.esBanco && !v.cuentaBancariaId) {
      this.alertService.showWarn(
        'Falta la cuenta',
        'Elige de qué cuenta bancaria sale el pago.',
      );
      return;
    }
    if (this.esCuenta && !v.cuentaPagoId) {
      this.alertService.showWarn(
        'Falta la cuenta',
        'Elige de qué cuenta contable sale el pago.',
      );
      return;
    }

    const dto: CreateGastoDto = {
      sucursalId: v.sucursalId,
      categoria: v.categoria,
      descripcion: v.descripcion?.trim() || null,
      monto: v.monto,
      fecha: v.fecha ? aFechaLocal(v.fecha as Date) : null,
      deducible: v.deducible,
      terceroId: this.terceroSeleccionado?.id ?? null,
      cuentaContableId: v.cuentaContableId,
      // El origen elegido se descompone en las tres piezas que espera el
      // backend. Solo viaja el identificador de la vía elegida: mandar dos haría
      // que el resolutor use el de más prioridad y no el que el usuario quiso.
      formaPago: this.esCredito ? 'CREDITO' : 'CONTADO',
      metodoPago: this.esBanco ? v.metodoPago : 'EFECTIVO',
      cuentaBancariaId: this.esBanco ? v.cuentaBancariaId : null,
      cuentaPagoId: this.esCuenta ? v.cuentaPagoId : null,
      // El backend resuelve la cuenta de CAJA por su cuenta: aqui solo se
      // afirma el hecho, no se elige contra que cuenta va.
      salidaCajaOtroDia: this.esCajaOtroDia,
      motivoRetroactivo:
        this.esCaja && this.esFechaRetroactiva
          ? v.motivoRetroactivo?.trim() || null
          : null,
      centroCostoId: null,
      periodoContableId: null,
      tipoDocSoporte: v.tipoDocSoporte,
      numeroDocSoporte: v.numeroDocSoporte?.trim() || null,
      baseIva: v.baseIva,
      tarifaIva: v.tarifaIva,
      valorIva: v.valorIva,
      baseRetefuente: v.baseRetefuente,
      tarifaRetefuente: v.tarifaRetefuente,
      valorRetefuente: v.valorRetefuente,
      baseReteica: v.baseReteica,
      tarifaReteica: v.tarifaReteica,
      valorReteica: v.valorReteica,
    };
    this.isSubmitting = true;
    this.cdr.markForCheck();
    try {
      if (this.modoEdicion && this.gastoToEdit) {
        await lastValueFrom(this.gastoService.update(this.gastoToEdit.id, dto));
        this.alertService.showSuccess(
          'Actualizado',
          'Gasto actualizado correctamente.',
        );
      } else {
        await lastValueFrom(this.gastoService.create(dto));
        this.alertService.showSuccess(
          'Registrado',
          'Gasto registrado correctamente.',
        );
      }
      this.router.navigate(['/gastos']);
    } catch {
      this.alertService.showError('Error', 'No se pudo guardar el gasto.');
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  cancelar(): void {
    this.router.navigate(['/gastos']);
  }
}
