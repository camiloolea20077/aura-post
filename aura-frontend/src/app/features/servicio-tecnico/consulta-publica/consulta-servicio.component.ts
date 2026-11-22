import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';

import { ConsultaServicioPublica } from '../../../core/models/servicio-tecnico.model';
import { ServicioTecnicoService } from '../../../core/services/servicio-tecnico.service';
import { ESTADOS_SERVICIO, etiquetaEquipo, iconoEquipo, pasoDelRecorrido, tonoEstado } from '../servicio-tecnico.util';

/** Pasos que ve el cliente, en orden (los estados de espera se muestran aparte). */
const PASOS = [
  { estado: 'RECIBIDO', label: 'Recibido' },
  { estado: 'EN_DIAGNOSTICO', label: 'En diagnóstico' },
  { estado: 'EN_REPARACION', label: 'En reparación' },
  { estado: 'LISTO', label: 'Listo para recoger' },
  { estado: 'ENTREGADO', label: 'Entregado' },
];

/**
 * Lo que ve el cliente con el enlace de su orden, sin iniciar sesión: estado, equipo,
 * presupuesto y, si el taller lo pide, aprobar o rechazar el presupuesto.
 */
@Component({
  selector: 'app-consulta-servicio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonModule, TextareaModule],
  templateUrl: './consulta-servicio.component.html',
  styleUrls: ['./consulta-servicio.component.scss'],
})
export class ConsultaServicioComponent implements OnInit {
  readonly estados = ESTADOS_SERVICIO;
  readonly iconoEquipo = iconoEquipo;
  readonly etiquetaEquipo = etiquetaEquipo;
  readonly tono = tonoEstado;

  token = '';
  c: ConsultaServicioPublica | null = null;
  cargando = true;
  error: string | null = null;
  comentario = '';
  respondiendo = false;
  respuesta: string | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly servicio: ServicioTecnicoService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    this.cargar();
  }

  /** Índice del paso alcanzado en la línea de tiempo. */
  get pasoActual(): number {
    return this.c ? pasoDelRecorrido(this.c.estado) : 0;
  }

  get pasos() {
    return PASOS;
  }

  fechaPaso(estado: string): string | null {
    const p = [...(this.c?.pasos ?? [])].reverse().find((x) => x.estado === estado);
    return p?.fecha ?? null;
  }

  get mensajeEstado(): string {
    switch (this.c?.estado) {
      case 'RECIBIDO':
        return 'Recibimos su equipo. Pronto lo revisará un técnico.';
      case 'EN_DIAGNOSTICO':
        return 'Un técnico está revisando su equipo.';
      case 'ESPERANDO_APROBACION':
        return 'Revise el presupuesto y díganos si aprueba la reparación.';
      case 'ESPERANDO_REPUESTO':
        return 'Estamos esperando un repuesto para su equipo.';
      case 'EN_REPARACION':
        return 'Su equipo está en reparación.';
      case 'LISTO':
        return '¡Su equipo está listo! Puede pasar a recogerlo.';
      case 'NO_REPARADO':
        return 'Su equipo no se reparó. Puede pasar a recogerlo.';
      case 'ENTREGADO':
        return 'Su equipo ya fue entregado. ¡Gracias por confiar en nosotros!';
      case 'CANCELADO':
        return 'La orden fue cancelada.';
      default:
        return '';
    }
  }

  responder(aprueba: boolean): void {
    if (!aprueba && !confirm('¿Seguro que no aprueba la reparación? El equipo quedará listo para recoger sin reparar.')) return;
    this.respondiendo = true;
    this.servicio.responderPresupuesto(this.token, aprueba, this.comentario.trim() || null).subscribe({
      next: (r) => {
        this.c = r.data;
        this.respondiendo = false;
        this.respuesta = aprueba ? '¡Gracias! Ya empezamos con la reparación.' : 'Gracias por avisarnos.';
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.respondiendo = false;
        this.respuesta = err?.error?.message ?? 'No se pudo enviar su respuesta. Intente de nuevo.';
        this.cdr.markForCheck();
      },
    });
  }

  private cargar(): void {
    this.cargando = true;
    this.servicio.consultaPublica(this.token).subscribe({
      next: (r) => {
        this.c = r.data;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cargando = false;
        this.error =
          err?.status === 429
            ? 'Demasiadas consultas seguidas. Espere un minuto y vuelva a intentar.'
            : 'No encontramos esta orden. Revise el enlace que le enviaron.';
        this.cdr.markForCheck();
      },
    });
  }
}
