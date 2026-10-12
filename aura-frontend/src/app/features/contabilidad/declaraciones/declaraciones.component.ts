import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { TabViewModule } from 'primeng/tabview';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';

import { AlertService } from '../../../shared/pipes/alert.service';
import { DeclaracionesService } from '../../../core/services/declaraciones.service';
import {
  BorradorDeclaracionModel,
  ParametrosIca,
  PorPagarDeclaracion,
} from '../../../core/models/declaraciones.model';
import { TerceroAutocompleteComponent } from '../../../shared/components/tercero-autocomplete/tercero-autocomplete.component';
import { CuentaBancariaService } from '../../../core/services/cuenta-bancaria.service';
import { ContabilidadService } from '../../../core/services/contabilidad.service';

/** De dónde sale la plata del pago: caja, una cuenta bancaria o un medio de pago. */
interface OrigenPago {
  label: string;
  value: string;
  metodoPago: string;
  cuentaBancariaId: number | null;
  cuentaContableId: number | null;
}

type Periodicidad = 'BIMESTRAL' | 'CUATRIMESTRAL';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/**
 * Borradores de IVA (300) y retención en la fuente (350) leídos del mayor.
 *
 * <p>No reemplaza el formulario de la DIAN: agrupa cada valor por el documento
 * que lo originó, con el detalle por cuenta y las advertencias de lo que el
 * sistema no puede afirmar, para que el contador lo traslade y lo cuadre.
 */
@Component({
  selector: 'app-declaraciones',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DropdownModule,
    InputNumberModule,
    TabViewModule,
    DialogModule,
    InputTextModule,
    CalendarModule,
    TooltipModule,
    TerceroAutocompleteComponent,
  ],
  templateUrl: './declaraciones.component.html',
  styleUrls: ['./declaraciones.component.scss'],
})
export class DeclaracionesComponent {
  readonly anios: { label: string; value: number }[];
  readonly meses = MESES.map((m, i) => ({ label: m, value: i + 1 }));
  readonly periodicidades = [
    { label: 'Bimestral', value: 'BIMESTRAL' as Periodicidad },
    { label: 'Cuatrimestral', value: 'CUATRIMESTRAL' as Periodicidad },
  ];

  // IVA
  periodicidad: Periodicidad = 'BIMESTRAL';
  anioIva: number;
  periodoIva: number;
  iva: BorradorDeclaracionModel | null = null;
  cargandoIva = false;
  verCuentasIva = false;

  // ICA (municipal)
  icaDesde: Date;
  icaHasta: Date;
  icaTarifa: number | null = null;
  icaAvisos = false;
  icaBomberil: number | null = null;
  icaDeducciones: number | null = null;
  icaMunicipio: number | null = null;
  ica: BorradorDeclaracionModel | null = null;
  cargandoIca = false;
  causandoIca = false;
  verCuentasIca = false;
  readonly opcionesAvisos = [
    { label: 'No', value: false },
    { label: 'Sí (15 % del ICA)', value: true },
  ];

  // Retención
  anioRet: number;
  mesRet: number;
  ret: BorradorDeclaracionModel | null = null;
  cargandoRet = false;
  verCuentasRet = false;

  // Pago de la declaración
  pagoVisible = false;
  pagoGrupo: PorPagarDeclaracion | null = null;
  pagoBorrador: BorradorDeclaracionModel | null = null;
  pagoFecha: Date = new Date();
  pagoFormulario = '';
  pagoRedondear = true;
  pagoIntereses: number | null = null;
  pagoSancion: number | null = null;
  readonly opcionesRedondeo = [
    { label: 'Sí, al múltiplo de mil (como el formulario)', value: true },
    { label: 'No, el valor exacto', value: false },
  ];
  pagoOrigen: string | null = 'CAJA';
  origenesPago: OrigenPago[] = [{ label: 'Caja (efectivo)', value: 'CAJA', metodoPago: 'EFECTIVO', cuentaBancariaId: null, cuentaContableId: null }];
  guardandoPago = false;

  // Anulación del pago
  anularVisible = false;
  anularGrupo: PorPagarDeclaracion | null = null;
  anularBorrador: BorradorDeclaracionModel | null = null;
  anularMotivo = '';
  anulando = false;

  constructor(
    private readonly service: DeclaracionesService,
    private readonly alertService: AlertService,
    private readonly cuentaBancariaService: CuentaBancariaService,
    private readonly contabilidadService: ContabilidadService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    this.anios = [anio - 2, anio - 1, anio].map((a) => ({ label: `${a}`, value: a }));
    this.anioIva = anio;
    this.anioRet = anio;
    // Por defecto el período anterior: es el que toca declarar.
    const mesAnterior = hoy.getMonth() === 0 ? 12 : hoy.getMonth();
    this.mesRet = mesAnterior;
    if (hoy.getMonth() === 0) this.anioRet = anio - 1;
    this.periodoIva = Math.max(1, Math.ceil(hoy.getMonth() / 2));
    // ICA: por defecto el año anterior completo (la mayoría declara anual).
    this.icaDesde = new Date(anio - 1, 0, 1);
    this.icaHasta = new Date(anio - 1, 11, 31);
  }

  get periodosIva(): { label: string; value: number }[] {
    const tam = this.periodicidad === 'BIMESTRAL' ? 2 : 4;
    const n = 12 / tam;
    return Array.from({ length: n }, (_, i) => ({
      label: `${i + 1}. ${MESES[i * tam]} – ${MESES[i * tam + tam - 1]}`,
      value: i + 1,
    }));
  }

  onPeriodicidad(): void {
    if (this.periodoIva > this.periodosIva.length) this.periodoIva = this.periodosIva.length;
  }

  private rangoIva(): [string, string] {
    const tam = this.periodicidad === 'BIMESTRAL' ? 2 : 4;
    const mesIni = (this.periodoIva - 1) * tam;
    return [this.iso(this.anioIva, mesIni, 1), this.iso(this.anioIva, mesIni + tam, 0)];
  }

  private rangoRet(): [string, string] {
    return [this.iso(this.anioRet, this.mesRet - 1, 1), this.iso(this.anioRet, this.mesRet, 0)];
  }

  /** Fecha local YYYY-MM-DD (día 0 = último día del mes anterior). */
  private iso(anio: number, mes: number, dia: number): string {
    const d = new Date(anio, mes, dia);
    return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
  }

  async generarIva(): Promise<void> {
    const [d, h] = this.rangoIva();
    this.cargandoIva = true;
    this.cdr.markForCheck();
    try {
      this.iva = (await lastValueFrom(this.service.iva(d, h)))?.data ?? null;
    } catch (err: any) {
      this.alertService.showError('Error', err?.error?.message ?? 'No se pudo generar el borrador de IVA.');
    } finally {
      this.cargandoIva = false;
      this.cdr.markForCheck();
    }
  }

  async generarRet(): Promise<void> {
    const [d, h] = this.rangoRet();
    this.cargandoRet = true;
    this.cdr.markForCheck();
    try {
      this.ret = (await lastValueFrom(this.service.retencion(d, h)))?.data ?? null;
    } catch (err: any) {
      this.alertService.showError('Error', err?.error?.message ?? 'No se pudo generar el borrador de retención.');
    } finally {
      this.cargandoRet = false;
      this.cdr.markForCheck();
    }
  }

  // ── Pago de la declaración ──────────────────────────────────

  tipoPagoLabel(tipo: string): string {
    return tipo === 'IVA' ? 'IVA (300)' : tipo === 'RETEICA' ? 'ReteICA' : tipo === 'ICA' ? 'ICA' : 'Retención (350)';
  }

  /** Abre el registro del pago de un acreedor; las cuentas de pago se cargan una vez. */
  abrirPago = async (b: BorradorDeclaracionModel, g: PorPagarDeclaracion): Promise<void> => {
    this.pagoBorrador = b;
    this.pagoGrupo = g;
    this.pagoFecha = new Date();
    this.pagoFormulario = '';
    this.pagoRedondear = true;
    this.pagoIntereses = null;
    this.pagoSancion = null;
    this.pagoOrigen = 'CAJA';
    this.pagoVisible = true;
    this.cdr.markForCheck();
    if (this.origenesPago.length > 1) return;
    const [bancos, medios] = await Promise.all([
      lastValueFrom(this.cuentaBancariaService.list()).catch(() => null),
      lastValueFrom(this.contabilidadService.listarMediosPago()).catch(() => null),
    ]);
    this.origenesPago = [
      this.origenesPago[0],
      ...(bancos?.data ?? [])
        .filter((c) => c.activa)
        .map((c) => ({
          label: `${c.nombre}${c.numeroCuenta ? ' · ' + c.numeroCuenta : ''}`,
          value: `BANCO:${c.id}`,
          metodoPago: 'TRANSFERENCIA',
          cuentaBancariaId: c.id,
          cuentaContableId: null,
        })),
      ...(medios?.data ?? []).map((c) => ({
        label: `${c.codigo} — ${c.nombre}`,
        value: `CUENTA:${c.id}`,
        metodoPago: 'TRANSFERENCIA',
        cuentaBancariaId: null,
        cuentaContableId: c.id,
      })),
    ];
    this.cdr.markForCheck();
  };

  /** Diferencia por aproximar al múltiplo de mil, igual que el servidor. */
  get pagoAjuste(): number {
    const v = this.pagoGrupo?.valor ?? 0;
    return this.pagoRedondear ? Math.round(v / 1000) * 1000 - v : 0;
  }

  get pagoTotal(): number {
    return (this.pagoGrupo?.valor ?? 0) + this.pagoAjuste + (this.pagoIntereses ?? 0) + (this.pagoSancion ?? 0);
  }

  async registrarPago(): Promise<void> {
    const g = this.pagoGrupo;
    const b = this.pagoBorrador;
    const origen = this.origenesPago.find((o) => o.value === this.pagoOrigen);
    if (!g || !b || g.terceroId == null) return;
    if (!origen) {
      this.alertService.showWarn('Falta la cuenta', 'Elija de dónde sale la plata.');
      return;
    }
    this.guardandoPago = true;
    this.cdr.markForCheck();
    try {
      const f = this.pagoFecha;
      const fecha = `${f.getFullYear()}-${`${f.getMonth() + 1}`.padStart(2, '0')}-${`${f.getDate()}`.padStart(2, '0')}`;
      const res = await lastValueFrom(
        this.service.registrarPago({
          tipo: g.tipo,
          desde: b.desde,
          hasta: b.hasta,
          terceroAcreedorId: g.terceroId,
          fecha,
          numeroFormulario: this.pagoFormulario.trim() || null,
          metodoPago: origen.metodoPago,
          cuentaBancariaId: origen.cuentaBancariaId,
          cuentaContableId: origen.cuentaContableId,
          redondearMiles: this.pagoRedondear,
          intereses: this.pagoIntereses,
          sancion: this.pagoSancion,
        }),
      );
      this.alertService.showSuccess('Pago registrado', `${res?.data?.pagoNumero ?? ''} a ${g.terceroNombre}`);
      this.pagoVisible = false;
      await this.recargar(b);
    } catch (err: any) {
      this.alertService.showError('No se registró el pago', err?.error?.message ?? '');
    } finally {
      this.guardandoPago = false;
      this.cdr.markForCheck();
    }
  }

  abrirAnular = (b: BorradorDeclaracionModel, g: PorPagarDeclaracion): void => {
    this.anularBorrador = b;
    this.anularGrupo = g;
    this.anularMotivo = '';
    this.anularVisible = true;
    this.cdr.markForCheck();
  };

  async anularPago(): Promise<void> {
    const g = this.anularGrupo;
    const b = this.anularBorrador;
    if (!g?.pagoId || !b) return;
    if (!this.anularMotivo.trim()) {
      this.alertService.showWarn('Falta el motivo', 'Escriba por qué se anula el pago.');
      return;
    }
    this.anulando = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(this.service.anularPago(g.pagoId, this.anularMotivo.trim()));
      this.alertService.showSuccess('Pago anulado', 'Se generó el contraasiento con fecha de hoy.');
      this.anularVisible = false;
      await this.recargar(b);
    } catch (err: any) {
      this.alertService.showError('No se anuló el pago', err?.error?.message ?? '');
    } finally {
      this.anulando = false;
      this.cdr.markForCheck();
    }
  }

  private parametrosIca(): ParametrosIca {
    const f = (d: Date) => this.iso(d.getFullYear(), d.getMonth(), d.getDate());
    return {
      desde: f(this.icaDesde),
      hasta: f(this.icaHasta),
      tarifaPorMil: this.icaTarifa ?? 0,
      avisosTableros: this.icaAvisos,
      bomberilPct: this.icaBomberil ?? 0,
      deducciones: this.icaDeducciones ?? 0,
      terceroAcreedorId: this.icaMunicipio,
    };
  }

  async generarIca(): Promise<void> {
    if (!this.icaDesde || !this.icaHasta) return;
    this.cargandoIca = true;
    this.cdr.markForCheck();
    try {
      this.ica = (await lastValueFrom(this.service.ica(this.parametrosIca())))?.data ?? null;
    } catch (err: any) {
      this.alertService.showError('Error', err?.error?.message ?? 'No se pudo generar el borrador de ICA.');
    } finally {
      this.cargandoIca = false;
      this.cdr.markForCheck();
    }
  }

  async causarIca(): Promise<void> {
    this.causandoIca = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.causarIca(this.parametrosIca()));
      this.alertService.showSuccess('ICA causado', res?.message ?? '');
      await this.generarIca();
    } catch (err: any) {
      this.alertService.showError('No se causó el ICA', err?.error?.message ?? '');
    } finally {
      this.causandoIca = false;
      this.cdr.markForCheck();
    }
  }

  toggleCuentasIca = (): void => {
    this.verCuentasIca = !this.verCuentasIca;
    this.cdr.markForCheck();
  };

  /** Vuelve a leer el borrador del período para mostrar el estado del pago. */
  private async recargar(b: BorradorDeclaracionModel): Promise<void> {
    if (b.tipo === 'ICA') {
      await this.generarIca();
      return;
    }
    const res = await lastValueFrom(
      b.tipo === 'IVA' ? this.service.iva(b.desde, b.hasta) : this.service.retencion(b.desde, b.hasta),
    ).catch(() => null);
    if (!res?.data) return;
    if (b.tipo === 'IVA') this.iva = res.data;
    else this.ret = res.data;
    this.cdr.markForCheck();
  }

  // Se pasan a la plantilla compartida: flechas para no perder el this.
  toggleCuentasIva = (): void => {
    this.verCuentasIva = !this.verCuentasIva;
    this.cdr.markForCheck();
  };

  toggleCuentasRet = (): void => {
    this.verCuentasRet = !this.verCuentasRet;
    this.cdr.markForCheck();
  };

  formatCOP = (v: number | null | undefined): string =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);

  async exportar(b: BorradorDeclaracionModel): Promise<void> {
    const wb = new Workbook();
    const ws = wb.addWorksheet(b.tipo === 'IVA' ? 'Borrador IVA' : b.tipo === 'ICA' ? 'Borrador ICA' : 'Borrador retención');
    ws.columns = [{ width: 60 }, { width: 20 }, { width: 18 }, { width: 18 }];
    const titulo = b.tipo === 'IVA'
      ? 'BORRADOR DECLARACIÓN DE IVA (FORMULARIO 300)'
      : b.tipo === 'ICA'
        ? 'BORRADOR DECLARACIÓN DE INDUSTRIA Y COMERCIO'
        : 'BORRADOR RETENCIÓN EN LA FUENTE (FORMULARIO 350)';
    [(b.empresaNombre ?? '').toUpperCase(), b.nit ? `NIT ${b.nit}` : '', titulo,
      `Del ${b.desde} al ${b.hasta}`].forEach((t, i) => {
      const r = ws.addRow([t]);
      ws.mergeCells(r.number, 1, r.number, 4);
      r.getCell(1).alignment = { horizontal: 'center' };
      r.getCell(1).font = { bold: i !== 1 };
    });
    ws.addRow([]);
    for (const s of b.secciones) {
      const rs = ws.addRow([s.titulo + (s.informativa ? ' (informativo)' : ''), s.total]);
      rs.font = { bold: true };
      rs.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      s.renglones.forEach((r) => ws.addRow(['   ' + r.concepto, r.valor]));
    }
    const rr = ws.addRow([b.resultadoEtiqueta.toUpperCase(), Math.abs(b.resultado)]);
    rr.font = { bold: true };
    if (b.basesPorTarifa.length) {
      ws.addRow([]);
      const h = ws.addRow(['Bases por tarifa (documentos)', 'Base', 'Valor', 'Documentos']);
      h.font = { bold: true };
      b.basesPorTarifa.forEach((t) =>
        ws.addRow([`${t.origen} · ${t.tarifa}%`, t.base, t.valor, t.documentos]),
      );
    }
    if (b.advertencias.length) {
      ws.addRow([]);
      ws.addRow(['Advertencias']).font = { bold: true };
      b.advertencias.forEach((a) => ws.addRow([a]));
    }
    ws.getColumn(2).numFmt = '#,##0;[Red]-#,##0';
    ws.getColumn(3).numFmt = '#,##0;[Red]-#,##0';
    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `borrador-${b.tipo.toLowerCase()}_${b.desde}_${b.hasta}.xlsx`);
  }
}
