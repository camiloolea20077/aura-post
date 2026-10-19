import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { lastValueFrom } from 'rxjs';

import { ResumenLote } from '../../../../../core/models/correo.model';
import { DocumentoNominaModel, LiquidacionEmpleadoModel } from '../../../../../core/models/nomina-documento.model';
import { CertificadoService } from '../../../../../core/services/certificado.service';
import { CorreoService } from '../../../../../core/services/correo.service';
import { EmpresaService } from '../../../../../core/services/empresa.service';
import { NominaPagoPdfService } from '../../../../../core/services/nomina-pago-pdf.service';
import { AlertService } from '../../../../../shared/pipes/alert.service';

/** Comprobantes por tanda: cada uno es un PDF en base64 (el servidor acepta 50). */
const TANDA = 10;
/** Cada cuánto se revisa el avance de la cola. */
const REVISAR_CADA_MS = 3000;

/**
 * Envía el comprobante de pago a cada empleado de la nómina, a su correo
 * (docs/PLAN_CUENTA_COBRO_CORREO.md). La pantalla arma los PDF (los mismos que se
 * descargan) y los manda por tandas; el servidor los envía en cola respetando el
 * límite de Resend. Muestra el avance, a quién no se le pudo enviar y por qué.
 */
@Component({
  selector: 'app-envio-comprobantes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonModule, DialogModule, InputTextModule, ProgressBarModule, TagModule, TextareaModule],
  templateUrl: './envio-comprobantes.component.html',
  styleUrls: ['./envio-comprobantes.component.scss'],
})
export class EnvioComprobantesComponent implements OnDestroy {
  private readonly correos = inject(CorreoService);
  private readonly certificados = inject(CertificadoService);
  private readonly empresaService = inject(EmpresaService);
  private readonly pagoPdf = inject(NominaPagoPdfService);
  private readonly alert = inject(AlertService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() visible = false;
  @Input({ required: true }) documento!: DocumentoNominaModel;
  /** Empleados a los que se les envía (liquidados y no anulados). */
  @Input() filas: LiquidacionEmpleadoModel[] = [];
  @Output() visibleChange = new EventEmitter<boolean>();

  asunto = '';
  mensaje = '';
  disponible = true;
  cargando = false;

  /** Fase: preparar → armando PDF y encolando → enviando (cola del servidor) → listo. */
  fase: 'preparar' | 'encolando' | 'enviando' | 'listo' = 'preparar';
  armados = 0;
  sinCorreo: string[] = [];
  resumen: ResumenLote | null = null;
  private loteId: string | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  get progreso(): number {
    if (this.fase === 'encolando') return this.filas.length ? Math.round((this.armados / this.filas.length) * 100) : 0;
    const r = this.resumen;
    if (!r || !r.total) return this.fase === 'listo' ? 100 : 0;
    return Math.round(((r.enviados + r.fallidos) / r.total) * 100);
  }

  get fallidos() {
    return (this.resumen?.filas ?? []).filter((f) => f.estado === 'FALLIDO');
  }

  async alAbrir(): Promise<void> {
    this.fase = 'preparar';
    this.armados = 0;
    this.sinCorreo = [];
    this.resumen = null;
    this.loteId = null;
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const s = (await lastValueFrom(this.correos.sugerenciaNomina()))?.data;
      this.asunto = `${s?.asunto ?? 'Comprobante de pago de nómina'} · ${this.documento.numeroCompleto}`;
      this.mensaje = s?.mensaje ?? '';
      this.disponible = s?.disponible ?? false;
    } catch (err: any) {
      this.alert.showError('No se pudo preparar el envío', err?.error?.message ?? 'Intente de nuevo.');
      this.cerrar();
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  /** Arma el comprobante de cada empleado y los encola por tandas. */
  async enviar(): Promise<void> {
    if (!this.filas.length || !this.asunto.trim()) return;
    this.fase = 'encolando';
    this.armados = 0;
    this.cdr.markForCheck();
    try {
      const empresa = (await lastValueFrom(this.empresaService.getConfig()))?.data ?? {};
      for (let i = 0; i < this.filas.length; i += TANDA) {
        const tanda = this.filas.slice(i, i + TANDA);
        const items = await Promise.all(
          tanda.map(async (f) => {
            const d = (await lastValueFrom(this.certificados.desprendible(f.nominaId))).data;
            const nombre = `${this.documento.numeroCompleto}-${f.empleadoNombre}`.replace(/\s+/g, '-');
            return { nominaId: f.nominaId, adjunto: await this.pagoPdf.comprobanteAdjunto(d, this.documento, empresa, nombre) };
          }),
        );
        const r = (
          await lastValueFrom(
            this.correos.encolarNomina({
              loteId: this.loteId,
              asunto: this.asunto.trim(),
              mensaje: this.mensaje.trim() || null,
              items,
            }),
          )
        )?.data;
        if (r) {
          this.loteId = r.loteId;
          this.sinCorreo.push(...r.sinCorreo);
        }
        this.armados += tanda.length;
        this.cdr.markForCheck();
      }
      this.fase = 'enviando';
      await this.revisar();
    } catch (err: any) {
      this.alert.showError('No se pudo completar el envío', err?.error?.message ?? 'Intente de nuevo.');
      // Lo ya encolado se sigue enviando: se muestra su avance.
      this.fase = this.loteId ? 'enviando' : 'preparar';
      if (this.loteId) await this.revisar();
    } finally {
      this.cdr.markForCheck();
    }
  }

  /** Lee el avance de la cola hasta que no quede nada pendiente. */
  private async revisar(): Promise<void> {
    if (!this.loteId) {
      this.fase = 'listo';
      this.cdr.markForCheck();
      return;
    }
    try {
      this.resumen = (await lastValueFrom(this.correos.resumenLote(this.loteId)))?.data ?? null;
    } catch {
      // Un fallo al consultar no detiene el envío: se vuelve a intentar.
    }
    if (this.resumen && this.resumen.pendientes === 0) {
      this.fase = 'listo';
    } else if (this.visible) {
      this.timer = setTimeout(() => this.revisar(), REVISAR_CADA_MS);
    }
    this.cdr.markForCheck();
  }

  cerrar(): void {
    if (this.timer) clearTimeout(this.timer);
    this.visible = false;
    this.visibleChange.emit(false);
  }

  ngOnDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }
}
