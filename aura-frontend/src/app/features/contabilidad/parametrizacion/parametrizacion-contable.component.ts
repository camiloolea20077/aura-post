import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';

import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  ConfigLogModel,
  CuentaConfigModel,
  FormaPagoContableModel,
  ImpuestoModel,
} from '../../../core/models/contador.model';

interface GrupoConceptos {
  nombre: string;
  conceptos: CuentaConfigModel[];
}

type Opcion = { label: string; value: number };

/** Orden y agrupación de los conceptos para que el contador los encuentre. */
const GRUPOS: { nombre: string; test: (c: string) => boolean }[] = [
  { nombre: 'Operación comercial', test: (c) => ['CLIENTES', 'PROVEEDORES', 'INVENTARIO', 'INGRESOS_VENTAS', 'COSTO_VENTAS', 'GASTO_GENERAL', 'PERDIDA_MERMA', 'GASTO_OBSEQUIOS', 'IVA_ASUMIDO_RETIRO', 'GASTO_CONSUMO_INTERNO', 'GASTO_DOTACION'].includes(c) },
  { nombre: 'Impuestos y retenciones', test: (c) => c.startsWith('IVA_') || c.startsWith('RETE') },
  { nombre: 'Tesorería y bancos', test: (c) => ['CAJA', 'BANCOS', 'OBLIGACIONES_FINANCIERAS', 'GASTOS_FINANCIEROS', 'SOBREGIROS_BANCARIOS', 'GASTOS_BANCARIOS', 'GMF', 'INGRESOS_FINANCIEROS', 'GASTO_DIFERENCIA_CAJA', 'INGRESO_SOBRANTE_CAJA'].includes(c) },
  { nombre: 'Activos, diferidos y provisiones', test: (c) => ['ACTIVO_FIJO_COMPRA', 'INTANGIBLES', 'DEPRECIACION_GASTO', 'DEPRECIACION_ACUMULADA', 'AMORTIZACION_ACUMULADA', 'PERDIDA_BAJA_ACTIVOS', 'UTILIDAD_VENTA_ACTIVOS', 'GASTOS_PAGADOS_ANTICIPADO', 'ANTICIPOS_CLIENTES', 'ANTICIPOS_PROVEEDORES', 'DETERIORO_CARTERA', 'PROVISION_CARTERA', 'PROVISION_INVENTARIO'].includes(c) },
  { nombre: 'Nómina', test: (c) => c.startsWith('NOMINA_') || ['GASTOS_PERSONAL', 'SALARIOS_POR_PAGAR', 'DEDUCCIONES_NOMINA_POR_PAGAR', 'APORTES_NOMINA_POR_PAGAR', 'PROVISIONES_NOMINA_POR_PAGAR', 'SEGURIDAD_SOCIAL_POR_PAGAR', 'OTRAS_DEDUCCIONES_POR_PAGAR', 'CESANTIAS_POR_PAGAR', 'INT_CESANTIAS_POR_PAGAR', 'PRIMA_POR_PAGAR', 'VACACIONES_POR_PAGAR'].includes(c) },
  { nombre: 'Patrimonio y cierre', test: () => true },
];

/**
 * Parametrización contable (Fase 4): a qué cuenta va cada concepto, cada
 * forma de pago y cada impuesto; modo de contabilización e historial. Antes
 * todo esto solo se podía cambiar por SQL.
 */
@Component({
  selector: 'app-parametrizacion-contable',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    InputNumberModule,
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    TabViewModule,
    DropdownModule,
    MultiSelectModule,
    DialogModule,
    TagModule,
    TooltipModule,
    InputTextModule,
  ],
  templateUrl: './parametrizacion-contable.component.html',
  styleUrls: ['./parametrizacion-contable.component.scss'],
})
export class ParametrizacionContableComponent implements OnInit {
  loading = false;
  activeTab = 0;
  busqueda = '';

  conceptos: CuentaConfigModel[] = [];
  grupos: GrupoConceptos[] = [];
  formasPago: FormaPagoContableModel[] = [];
  impuestos: ImpuestoModel[] = [];
  log: ConfigLogModel[] = [];
  modo = 'AUTOMATICO';

  private auxiliares: { id: number; codigo: string; nombre: string }[] = [];
  private opcionesPorPrefijo = new Map<string, Opcion[]>();
  cuentasAux: Opcion[] = [];
  /** Formas de pago: disponible (11) o cartera con el financiador (13). */
  cuentasFormaPago: Opcion[] = [];

  // Nueva forma de pago
  showNuevaForma = false;
  nuevaForma: FormaPagoContableModel = this.formaVacia();
  guardandoForma = false;
  guardando: string | null = null;

  // Copiar forma de pago
  showCopiar = false;
  copiarOrigen: FormaPagoContableModel | null = null;
  copiarDestinos: number[] = [];

  constructor(
    private readonly router: Router,
    private readonly service: ContabilidadService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const [plan, conceptos, formas, impuestos, log, modo] = await Promise.all([
        lastValueFrom(this.service.listarPlan()),
        lastValueFrom(this.service.listarConfigCuentas()),
        lastValueFrom(this.service.listarFormasPago()).catch(() => null),
        lastValueFrom(this.service.listarImpuestos()).catch(() => null),
        lastValueFrom(this.service.logConfigCuentas()).catch(() => null),
        lastValueFrom(this.service.obtenerModo()).catch(() => null),
      ]);
      this.auxiliares = (plan?.data ?? [])
        .filter((c) => c.auxiliar && c.activa)
        .map((c) => ({ id: c.id, codigo: c.codigo ?? '', nombre: c.nombre }));
      this.cuentasAux = this.auxiliares.map((c) => ({ label: `${c.codigo} - ${c.nombre}`, value: c.id }));
      this.cuentasFormaPago = this.auxiliares
        .filter((c) => c.codigo.startsWith('11') || c.codigo.startsWith('13'))
        .map((c) => ({ label: `${c.codigo} - ${c.nombre}`, value: c.id }));
      this.opcionesPorPrefijo.clear();
      this.conceptos = conceptos?.data ?? [];
      this.formasPago = formas?.data ?? [];
      this.impuestos = impuestos?.data ?? [];
      this.log = log?.data ?? [];
      this.modo = modo?.data ?? 'AUTOMATICO';
      this.agrupar();
    } catch (e: any) {
      this.alert.showError('Error', e?.error?.message ?? 'No se pudo cargar la parametrización');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  agrupar(): void {
    const q = this.busqueda.trim().toLowerCase();
    const visibles = this.conceptos.filter(
      (c) =>
        !q ||
        c.descripcionConcepto.toLowerCase().includes(q) ||
        (c.codigoCuenta ?? '').startsWith(q) ||
        (c.nombreCuenta ?? '').toLowerCase().includes(q),
    );
    const usados = new Set<string>();
    this.grupos = GRUPOS.map((g) => {
      const conceptos = visibles.filter((c) => !usados.has(c.concepto) && g.test(c.concepto));
      conceptos.forEach((c) => usados.add(c.concepto));
      return { nombre: g.nombre, conceptos };
    }).filter((g) => g.conceptos.length);
    this.cdr.markForCheck();
  }

  /** Cuentas auxiliares que acepta el concepto (mismas reglas que el backend). */
  opcionesConcepto(c: CuentaConfigModel): Opcion[] {
    const clave = (c.prefijosPermitidos ?? []).join(',');
    let ops = this.opcionesPorPrefijo.get(clave);
    if (!ops) {
      ops = this.auxiliares
        .filter((a) => !c.prefijosPermitidos?.length || c.prefijosPermitidos.some((p) => a.codigo.startsWith(p)))
        .map((a) => ({ label: `${a.codigo} - ${a.nombre}`, value: a.id }));
      this.opcionesPorPrefijo.set(clave, ops);
    }
    return ops;
  }

  async cambiarConcepto(c: CuentaConfigModel, cuentaId: number): Promise<void> {
    if (!cuentaId || cuentaId === c.cuentaId) return;
    this.guardando = c.concepto;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.actualizarConfigCuenta(c.concepto, cuentaId));
      Object.assign(c, res?.data ?? {});
      this.alert.showSuccess('Guardado', `${c.descripcionConcepto}: ${c.codigoCuenta} - ${c.nombreCuenta}`);
      this.log = (await lastValueFrom(this.service.logConfigCuentas()))?.data ?? this.log;
    } catch (e: any) {
      this.alert.showError('No se guardó', e?.error?.message ?? 'La cuenta no sirve para ese concepto');
    } finally {
      this.guardando = null;
      this.cdr.markForCheck();
    }
  }

  // ── Formas de pago ───────────────────────────────────────────
  async guardarFormaPago(f: FormaPagoContableModel): Promise<void> {
    if (!f.id) return;
    this.guardando = 'FP' + f.id;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.actualizarFormaPago(f.id, f));
      Object.assign(f, res?.data ?? {});
      this.alert.showSuccess('Guardado', `Forma de pago ${f.nombre}`);
    } catch (e: any) {
      this.alert.showError('No se guardó', e?.error?.message ?? 'Revise la cuenta');
    } finally {
      this.guardando = null;
      this.cdr.markForCheck();
    }
  }

  abrirNuevaForma(): void {
    this.nuevaForma = this.formaVacia();
    this.showNuevaForma = true;
    this.cdr.markForCheck();
  }

  /** "Addi Pagos" → "ADDI_PAGOS": el código que viaja en las ventas. */
  sugerirCodigo(): void {
    if (this.nuevaForma.codigo) return;
    this.nuevaForma.codigo = (this.nuevaForma.nombre ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 30);
  }

  async crearForma(): Promise<void> {
    const f = this.nuevaForma;
    if (!f.nombre?.trim() || !f.codigo?.trim() || !f.cuentaContableId) {
      this.alert.showWarn('Datos incompletos', 'Escribe el nombre, el código y la cuenta.');
      return;
    }
    this.guardandoForma = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(
        this.service.crearFormaPago({ ...f, nombre: f.nombre.trim(), codigo: f.codigo.trim().toUpperCase() }),
      );
      this.alert.showSuccess('Forma de pago creada', `${f.nombre} ya aparece en el POS al cobrar.`);
      this.showNuevaForma = false;
      this.formasPago = (await lastValueFrom(this.service.listarFormasPago()))?.data ?? this.formasPago;
    } catch (e: any) {
      this.alert.showError('No se creó', e?.error?.message ?? 'Revise el código y la cuenta');
    } finally {
      this.guardandoForma = false;
      this.cdr.markForCheck();
    }
  }

  private formaVacia(): FormaPagoContableModel {
    return { codigo: '', nombre: '', cuentaContableId: null, requiereCuentaBancaria: false, activo: true };
  }

  abrirCopiar(f: FormaPagoContableModel): void {
    this.copiarOrigen = f;
    this.copiarDestinos = [];
    this.showCopiar = true;
    this.cdr.markForCheck();
  }

  get destinosCopia(): Opcion[] {
    return this.formasPago
      .filter((f) => f.id !== this.copiarOrigen?.id)
      .map((f) => ({ label: `${f.nombre} (${f.codigo})`, value: f.id! }));
  }

  async confirmarCopiar(): Promise<void> {
    if (!this.copiarOrigen?.id || !this.copiarDestinos.length) return;
    try {
      const res = await lastValueFrom(this.service.copiarFormaPago(this.copiarOrigen.id, this.copiarDestinos));
      this.alert.showSuccess('Copiado', res?.message ?? '');
      this.showCopiar = false;
      this.formasPago = (await lastValueFrom(this.service.listarFormasPago()))?.data ?? this.formasPago;
    } catch (e: any) {
      this.alert.showError('Error', e?.error?.message ?? 'No se pudo copiar');
    }
    this.cdr.markForCheck();
  }

  // ── Impuestos ────────────────────────────────────────────────
  async guardarImpuesto(i: ImpuestoModel): Promise<void> {
    if (!i.id) return;
    this.guardando = 'IMP' + i.id;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.actualizarImpuesto(i.id, i));
      Object.assign(i, res?.data ?? {});
      this.alert.showSuccess('Guardado', `Impuesto ${i.nombre}`);
    } catch (e: any) {
      this.alert.showError('No se guardó', e?.error?.message ?? 'Revise las cuentas');
    } finally {
      this.guardando = null;
      this.cdr.markForCheck();
    }
  }

  // ── Modo ─────────────────────────────────────────────────────
  async setModo(modo: string): Promise<void> {
    if (modo === this.modo) return;
    try {
      const res = await lastValueFrom(this.service.actualizarModo(modo));
      this.modo = res?.data ?? modo;
      this.alert.showSuccess(
        'Modo actualizado',
        modo === 'REVISION'
          ? 'Los asientos automáticos quedan en borrador hasta que el contador los apruebe.'
          : 'Los asientos automáticos se contabilizan de inmediato.',
      );
    } catch (e: any) {
      this.alert.showError('Error', e?.error?.message ?? 'No se pudo cambiar el modo');
    }
    this.cdr.markForCheck();
  }

  irCategorias(): void {
    this.router.navigate(['/contabilidad/categorias-contables']);
  }
}
