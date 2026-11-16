import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { lastValueFrom } from 'rxjs';

import { SolicitudEspacioPlataforma } from '../../../core/models/nube.model';
import { NubeService } from '../../../core/services/nube.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { FechaEsPipe } from '../../../shared/pipes/fecha-es.pipe';
import { formatoBytes, formatoMb } from '../../documentos/nube-utils';

/**
 * Solicitudes de más espacio en la nube de documentos (docs/PLAN_NUBE_DOCUMENTOS.md
 * §10). El espacio adicional tiene costo: se acuerda con la empresa y luego se
 * aprueba aquí. La plataforma ve el uso, nunca los documentos.
 */
@Component({
  selector: 'app-solicitudes-espacio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonModule, InputNumberModule, InputTextModule, FechaEsPipe],
  templateUrl: './solicitudes-espacio.component.html',
  styleUrls: ['./solicitudes-espacio.component.scss'],
})
export class SolicitudesEspacioComponent implements OnInit {
  private readonly nube = inject(NubeService);
  private readonly alert = inject(AlertService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly formatoBytes = formatoBytes;
  readonly formatoMb = formatoMb;

  cargando = true;
  solicitudes: SolicitudEspacioPlataforma[] = [];
  respondiendo: number | null = null;
  /** Cuota a aprobar por solicitud (por defecto, la pedida). */
  cuotas: Record<number, number> = {};
  rechazando: number | null = null;
  motivo = '';

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      this.solicitudes = (await lastValueFrom(this.nube.solicitudesPlataforma())).data ?? [];
      this.cuotas = Object.fromEntries(this.solicitudes.map((s) => [s.id, s.cuotaSolicitadaMb]));
    } catch {
      // El interceptor ya mostró el error.
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  async aprobar(s: SolicitudEspacioPlataforma): Promise<void> {
    this.respondiendo = s.id;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(this.nube.aprobarSolicitud(s.id, this.cuotas[s.id] ?? null, null));
      this.alert.showSuccess('Espacio ampliado', `${s.empresaNombre} ahora tiene ${formatoMb(this.cuotas[s.id])}.`);
      await this.cargar();
    } catch {
      // El interceptor ya mostró el error.
    } finally {
      this.respondiendo = null;
      this.cdr.markForCheck();
    }
  }

  empezarRechazo(s: SolicitudEspacioPlataforma): void {
    this.rechazando = s.id;
    this.motivo = '';
  }

  async confirmarRechazo(s: SolicitudEspacioPlataforma): Promise<void> {
    if (!this.motivo.trim()) {
      this.alert.showError('Falta el motivo', 'Escriba por qué se rechaza: la empresa lo verá.');
      return;
    }
    this.respondiendo = s.id;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(this.nube.rechazarSolicitud(s.id, this.motivo.trim()));
      this.alert.showSuccess('Solicitud rechazada', `Se le avisó a ${s.empresaNombre}.`);
      this.rechazando = null;
      await this.cargar();
    } catch {
      // El interceptor ya mostró el error.
    } finally {
      this.respondiendo = null;
      this.cdr.markForCheck();
    }
  }
}
