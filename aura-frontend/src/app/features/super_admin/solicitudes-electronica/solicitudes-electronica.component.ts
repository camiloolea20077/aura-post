import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { lastValueFrom } from 'rxjs';

import {
  SERVICIOS_ELECTRONICOS,
  ServicioElectronico,
  SolicitudActivacion,
} from '../../../core/services/firma-contable.service';
import { PlatformService } from '../../../core/services/platform.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { FechaEsPipe } from '../../../shared/pipes/fecha-es.pipe';

/**
 * Solicitudes de las firmas contables para activar los documentos electrónicos de un
 * cliente gestionado (docs/PLAN_FIRMA_CONTABLE.md §10). Factus le entrega las
 * credenciales a Aura: se cargan en la empresa y, al guardarla con la facturación
 * electrónica activa, la solicitud queda atendida y la firma recibe el aviso.
 */
@Component({
  selector: 'app-solicitudes-electronica',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TagModule, FechaEsPipe],
  templateUrl: './solicitudes-electronica.component.html',
  styleUrls: ['./solicitudes-electronica.component.scss'],
})
export class SolicitudesElectronicaComponent implements OnInit {
  private readonly platform = inject(PlatformService);
  private readonly alert = inject(AlertService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  cargando = true;
  solicitudes: SolicitudActivacion[] = [];
  respondiendo: number | null = null;
  /** Solicitud a la que se le está escribiendo el motivo del rechazo. */
  rechazando: number | null = null;
  motivo = '';

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.platform.solicitudesElectronica());
      this.solicitudes = res?.data ?? [];
    } catch (err: any) {
      this.alert.showError('No se pudieron cargar', err?.error?.message ?? 'Intente de nuevo.');
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  /** Nombres de los documentos pedidos, separados por coma. */
  serviciosTexto(codigos: ServicioElectronico[]): string {
    return codigos.map((c) => SERVICIOS_ELECTRONICOS.find((s) => s.codigo === c)?.nombre ?? c).join(', ');
  }

  /** Abre la empresa para cargar client id, secret, usuario, clave y prefijo de Factus. */
  configurar(s: SolicitudActivacion): void {
    this.router.navigate(['/platform/empresas', s.clienteEmpresaId, 'editar']);
  }

  async atender(s: SolicitudActivacion): Promise<void> {
    this.respondiendo = s.id;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(this.platform.atenderSolicitudElectronica(s.id));
      this.alert.showSuccess('Solicitud atendida', `Se le avisó a ${s.firmaNombre}.`);
      await this.cargar();
    } catch (err: any) {
      this.alert.showError('No se pudo atender', err?.error?.message ?? 'Intente de nuevo.');
    } finally {
      this.respondiendo = null;
      this.cdr.markForCheck();
    }
  }

  empezarRechazo(s: SolicitudActivacion): void {
    this.rechazando = s.id;
    this.motivo = '';
  }

  async confirmarRechazo(s: SolicitudActivacion): Promise<void> {
    if (!this.motivo.trim()) {
      this.alert.showError('Falta el motivo', 'Escriba por qué se rechaza: la firma lo verá en su campana.');
      return;
    }
    this.respondiendo = s.id;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(this.platform.rechazarSolicitudElectronica(s.id, this.motivo.trim()));
      this.alert.showSuccess('Solicitud rechazada', `Se le avisó a ${s.firmaNombre}.`);
      this.rechazando = null;
      await this.cargar();
    } catch (err: any) {
      this.alert.showError('No se pudo rechazar', err?.error?.message ?? 'Intente de nuevo.');
    } finally {
      this.respondiendo = null;
      this.cdr.markForCheck();
    }
  }
}
