import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { NominaElectronicaService } from '../../../../core/services/nomina-electronica.service';
import { lineasDeduccion, lineasDevengado, totalLineas } from './nomina-electronica-lineas';
import {
  NominaElectronicaEstado,
  NominaElectronicaLinea,
  NominaElectronicaPayload,
  NominaElectronicaRespuesta,
  NominaElectronicaMes,
} from '../../../../core/models/nomina-electronica.model';
import { TerceroService } from '../../../../core/services/tercero.service';
import { AlertService } from '../../../../shared/pipes/alert.service';

@Component({
  selector: 'app-nomina-electronica',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    TagModule,
    SkeletonModule,
    ProgressSpinnerModule,
    TooltipModule,
  ],
  templateUrl: './nomina-electronica.component.html',
  styleUrls: ['./nomina-electronica.component.scss'],
})
export class NominaElectronicaComponent implements OnChanges {
  @Input() visible = false;
  @Input() nominaId: number | null = null;
  /**
   * Solo consulta (desde la nómina): muestra el documento del mes, su estado y las
   * descargas, sin enviar ni anular. Eso se hace en Nómina electrónica → Por mes.
   */
  @Input() soloConsulta = false;
  @Output() closed = new EventEmitter<void>();

  public payload: NominaElectronicaPayload | null = null;
  public municipioNombre: string | null = null;
  public loading = false;
  public enviando = false;
  public anulando = false;
  public anulada = false;
  public descargando = false;

  /**
   * El mes de la nómina: la DIAN recibe un documento por empleado y mes, así que se
   * envía cuando el mes está completo (con quincenas, al confirmar la 2ª).
   */
  public mesInfo: NominaElectronicaMes | null = null;

  /** Estado local persistido: si ya se envió, se muestra el CUNE y se oculta "Enviar". */
  public estadoLocal: NominaElectronicaEstado | null = null;

  // Confirmación
  public showConfirm = false;
  public showAnular = false;

  // Resultado del envío
  public respuesta: NominaElectronicaRespuesta | null = null;
  public errorFactus: string | null = null;

  // ─── Catálogos código → nombre (tablas Factus) ───────────────
  private readonly periodoMap: Record<string, string> = {
    '1': 'Semanal',
    '2': 'Decadal',
    '3': 'Catorcenal',
    '4': 'Quincenal',
    '5': 'Mensual',
  };
  private readonly contratoMap: Record<string, string> = {
    '1': 'Término fijo',
    '2': 'Término indefinido',
    '3': 'Obra o labor',
    '4': 'Aprendizaje',
    '5': 'Prácticas o pasantías',
  };
  private readonly cuentaMap: Record<string, string> = {
    '1': 'Nómina',
    '2': 'Ahorros',
    '3': 'Corriente',
  };
  private readonly documentoMap: Record<string, string> = {
    '11': 'Registro civil',
    '12': 'Tarjeta de identidad',
    '13': 'Cédula de ciudadanía',
    '21': 'Tarjeta de extranjería',
    '22': 'Cédula de extranjería',
    '31': 'NIT',
    '41': 'Pasaporte',
    '42': 'Doc. extranjero',
    '47': 'PEP',
    '50': 'NIT otro país',
    '91': 'NUIP',
  };
  private readonly trabajadorMap: Record<string, string> = {
    '01': 'Dependiente',
    '02': 'Servicio doméstico',
    '51': 'Tiempo parcial',
  };
  private readonly medioPagoMap: Record<string, string> = {
    '10': 'Efectivo',
    '42': 'Consignación bancaria',
  };
  private readonly horaMap: Record<string, string> = {
    '1': 'Extra diurna',
    '2': 'Extra nocturna',
    '3': 'Recargo nocturno',
    '4': 'Extra diurna dom/fest',
    '5': 'Recargo diurno dom/fest',
    '6': 'Extra nocturna dom/fest',
    '7': 'Recargo nocturno dom/fest',
  };

  constructor(
    private readonly service: NominaElectronicaService,
    private readonly terceroService: TerceroService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue && this.nominaId) {
      this.reset();
      this.cargar();
    }
    if (!changes['visible']?.currentValue) {
      this.reset();
    }
  }

  private reset(): void {
    this.payload = null;
    this.municipioNombre = null;
    this.respuesta = null;
    this.errorFactus = null;
    this.showConfirm = false;
    this.showAnular = false;
    this.enviando = false;
    this.anulando = false;
    this.anulada = false;
    this.descargando = false;
    this.estadoLocal = null;
  }

  /** ¿Ya fue aceptada por la DIAN? Entonces no se reenvía; se puede ver/descargar/anular. */
  get yaEnviada(): boolean {
    return this.estadoLocal?.estado === 'ACEPTADO';
  }

  /** El mes aún no se puede enviar (falta confirmar alguna nómina del mes). */
  get mesIncompleto(): boolean {
    return !!this.mesInfo && !this.mesInfo.completo && !this.yaEnviada;
  }

  /** "septiembre de 2026". */
  get mesLabel(): string {
    if (!this.mesInfo) return '';
    const f = new Date(this.mesInfo.agno, this.mesInfo.mes - 1, 1);
    return f.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  }

  /** "1–15 sep." para listar las nóminas que junta el documento. */
  rangoNomina(inicio: string, fin: string): string {
    const d = (x: string) => Number(x.substring(8, 10));
    const mes = new Date(fin.substring(0, 10) + 'T00:00:00').toLocaleDateString('es-CO', { month: 'short' });
    return `${d(inicio)}–${d(fin)} ${mes}`;
  }

  async cargar(): Promise<void> {
    this.loading = true;
    try {
      const [res, mes] = await Promise.all([
        lastValueFrom(this.service.preview(this.nominaId!)),
        lastValueFrom(this.service.mes(this.nominaId!)),
      ]);
      this.payload = res?.data ?? null;
      this.mesInfo = mes?.data ?? null;
      await this.resolverMunicipio();
      // Estado local: si ya está ACEPTADA, la vista muestra el CUNE en vez de "Enviar".
      const est = await lastValueFrom(this.service.estado(this.nominaId!));
      this.estadoLocal = est?.data ?? null;
      if (this.estadoLocal?.estado === 'ANULADO') this.anulada = true;
    } catch {
      this.alertService.showError(
        'Error',
        'No se pudo generar la nómina electrónica',
      );
    } finally {
      // El diálogo vive dentro de pantallas OnPush: hay que avisar que cambió.
      this.cdr.markForCheck();
      this.loading = false;
    }
  }

  /** Resuelve el código DANE del municipio a su nombre para mostrarlo legible. */
  private async resolverMunicipio(): Promise<void> {
    this.municipioNombre = null;
    const code = this.payload?.worker?.municipality_code;
    if (!code) return;
    try {
      const res = await lastValueFrom(
        this.terceroService.getMunicipioByCodigo(code),
      );
      this.municipioNombre = res?.data?.nombre ?? null;
    } catch {
      this.municipioNombre = null; // deja el código si no se puede resolver
    }
  }

  pedirConfirmacion(): void {
    this.showConfirm = true;
  }

  async enviar(): Promise<void> {
    if (!this.nominaId) return;
    this.showConfirm = false;
    this.enviando = true;
    this.respuesta = null;
    this.errorFactus = null;
    try {
      const res = await lastValueFrom(this.service.enviar(this.nominaId));
      this.respuesta = res?.data ?? null;
      if (this.respuesta?.exitoso) {
        this.anulada = false;
        this.estadoLocal = null;
        // Factus devuelve el documento que ya tenía si la referencia existe: el back
        // avisa cuando sus valores no son los de la nómina.
        if (res?.message && res.message !== 'Envío procesado')
          this.alertService.showWarn('Factus conservó otros valores', res.message);
        else
          this.alertService.showSuccess('Enviada', 'Nómina electrónica aceptada por la DIAN');
      } else {
        this.errorFactus = this.extraerMensaje(this.respuesta?.responseBody);
        this.alertService.showWarn(
          'Rechazada',
          'Factus/DIAN rechazó la nómina. Revisa el detalle.',
        );
      }
    } catch {
      this.alertService.showError(
        'Error',
        'No se pudo enviar la nómina electrónica',
      );
    } finally {
      // El diálogo vive dentro de pantallas OnPush: hay que avisar que cambió.
      this.cdr.markForCheck();
      this.enviando = false;
    }
  }

  pedirAnular(): void {
    this.showAnular = true;
  }

  async anular(): Promise<void> {
    if (!this.nominaId) return;
    this.showAnular = false;
    const referencia =
      this.estadoLocal?.referenceCode ??
      this.respuesta?.referenceCode ??
      `NOM-${this.nominaId}`;
    this.anulando = true;
    try {
      // Nota de eliminación (forma DIAN), no el borrado directo de sandbox.
      await lastValueFrom(this.service.notaEliminacion(referencia));
      this.anulada = true;
      // Queda lista para enviar la corregida (con una referencia nueva).
      this.respuesta = null;
      if (this.estadoLocal) this.estadoLocal.estado = 'ANULADO';
      this.alertService.showSuccess('Anulada', 'Nómina electrónica anulada (nota de eliminación)');
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.error?.message ?? 'No se pudo anular la nómina electrónica',
      );
    } finally {
      // El diálogo vive dentro de pantallas OnPush: hay que avisar que cambió.
      this.cdr.markForCheck();
      this.anulando = false;
    }
  }

  /** Descarga el XML firmado y dispara la descarga en el navegador. */
  async descargarXml(): Promise<void> {
    if (!this.nominaId) return;
    this.descargando = true;
    try {
      const blob = await lastValueFrom(this.service.descargarXml(this.nominaId));
      const numero =
        (this.estadoLocal?.prefijo ?? '') + (this.estadoLocal?.consecutivo ?? '');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nomina-${numero || this.nominaId}.xml`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      this.alertService.showError('Error', 'No se pudo descargar el XML');
    } finally {
      // El diálogo vive dentro de pantallas OnPush: hay que avisar que cambió.
      this.cdr.markForCheck();
      this.descargando = false;
    }
  }

  /** Descarga el PDF de la nómina electrónica (Factus lo genera). */
  async descargarPdf(): Promise<void> {
    if (!this.nominaId) return;
    this.descargando = true;
    try {
      const blob = await lastValueFrom(this.service.descargarPdf(this.nominaId));
      const numero = (this.estadoLocal?.prefijo ?? '') + (this.estadoLocal?.consecutivo ?? '');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nomina-${numero || this.nominaId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      this.alertService.showError('Error', 'No se pudo descargar el PDF');
    } finally {
      // El diálogo vive dentro de pantallas OnPush: hay que avisar que cambió.
      this.cdr.markForCheck();
      this.descargando = false;
    }
  }

  private extraerMensaje(body: string | undefined): string {
    if (!body) return 'Sin detalle';
    try {
      const json = JSON.parse(body);
      return json.message ?? json.status ?? body;
    } catch {
      return body;
    }
  }

  close(): void {
    this.closed.emit();
  }

  // ─── Helpers de presentación ─────────────────────────────────
  get w() {
    return this.payload?.worker;
  }
  get p() {
    return this.payload?.settlement_period;
  }
  get pay() {
    return this.payload?.payment;
  }
  get acc() {
    return this.payload?.accruals;
  }
  get ded() {
    return this.payload?.deductions;
  }
  /** Todos los devengados del documento (bonos, prima, vacaciones…), no solo el sueldo. */
  get devengados(): NominaElectronicaLinea[] {
    return lineasDevengado(this.acc);
  }
  get deducciones(): NominaElectronicaLinea[] {
    return lineasDeduccion(this.ded);
  }
  get totalDevengado(): number {
    return totalLineas(this.devengados);
  }
  get totalDeducido(): number {
    return totalLineas(this.deducciones);
  }

  get nombreCompleto(): string {
    const w = this.w;
    if (!w) return '';
    return [w.first_name, w.other_names, w.first_surname, w.second_surname]
      .filter(Boolean)
      .join(' ');
  }

  get faltaMunicipio(): boolean {
    return !this.w?.municipality_code;
  }
  get faltaDireccion(): boolean {
    return !this.w?.address;
  }
  get hayAdvertencias(): boolean {
    return this.faltaMunicipio || this.faltaDireccion;
  }

  periodoLabel(c?: string): string {
    return c ? (this.periodoMap[c] ?? c) : '';
  }
  contratoLabel(c?: string): string {
    return c ? (this.contratoMap[c] ?? c) : '';
  }
  cuentaLabel(c?: string): string {
    return c ? (this.cuentaMap[c] ?? c) : '';
  }
  documentoLabel(c?: string): string {
    return c ? (this.documentoMap[c] ?? c) : '';
  }
  trabajadorLabel(c?: string): string {
    return c ? (this.trabajadorMap[c] ?? `Cotizante ${c}`) : '';
  }
  medioPagoLabel(c?: string): string {
    return c ? (this.medioPagoMap[c] ?? c) : '';
  }
  horaLabel(c?: string): string {
    return c ? (this.horaMap[c] ?? c) : '';
  }

  money(v?: string | number): string {
    const n = Number(v ?? 0);
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(n);
  }
}
