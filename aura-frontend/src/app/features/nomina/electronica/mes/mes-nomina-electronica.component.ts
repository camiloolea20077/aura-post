import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { NominaElectronicaMes } from '../../../../core/models/nomina-electronica.model';
import { NominaElectronicaService } from '../../../../core/services/nomina-electronica.service';
import { PuedeDirective } from '../../../../shared/directives/puede.directive';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { NominaElectronicaComponent } from '../../liquidacion/electronica/nomina-electronica.component';
import { estadoMes, EstadoMesNe } from './estado-mes';

/**
 * Nómina electrónica por MES: la DIAN recibe un solo documento por empleado y mes,
 * con todo lo pagado. Lista los empleados con nóminas confirmadas en el mes, dice
 * cuáles ya completaron el mes (listos), cuáles no (p. ej. falta la 2ª quincena) y
 * cuáles ya se enviaron, y permite enviar uno por uno o todos los listos.
 */
@Component({
  selector: 'app-mes-nomina-electronica',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CalendarModule,
    TableModule,
    TagModule,
    TooltipModule,
    PuedeDirective,
    NominaElectronicaComponent,
  ],
  templateUrl: './mes-nomina-electronica.component.html',
  styleUrls: ['./mes-nomina-electronica.component.scss'],
})
export class MesNominaElectronicaComponent implements OnInit {
  /** Mes consultado: por defecto el anterior (el que se reporta a la DIAN). */
  mes: Date = (() => {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  })();
  readonly maxMes = new Date();

  filas: NominaElectronicaMes[] = [];
  cargando = true;

  /** Búsqueda por empleado, documento de identidad o número del documento electrónico. */
  @Input() filtro = '';

  get filtradas(): NominaElectronicaMes[] {
    const q = this.filtro.trim().toLowerCase();
    if (!q) return this.filas;
    return this.filas.filter(
      (f) =>
        (f.empleadoNombre ?? '').toLowerCase().includes(q) ||
        (f.empleadoDocumento ?? '').toLowerCase().includes(q) ||
        (f.documentoNumero ?? '').toLowerCase().includes(q),
    );
  }

  /** Envío de todos los listos. */
  enviando = false;
  avance = 0;
  rechazos: { nombre: string; motivo: string }[] = [];

  /** Modal de un empleado. */
  mostrarModal = false;
  nominaModal: number | null = null;

  constructor(
    private readonly service: NominaElectronicaService,
    private readonly alert: AlertService,
  ) {}

  /** Mes a abrir (p. ej. desde la nómina: ?anio=2026&mes=9); si no, el anterior. */
  @Input() mesInicial: Date | null = null;

  ngOnInit(): void {
    if (this.mesInicial) this.mes = this.mesInicial;
    void this.cargar();
  }

  estado(f: NominaElectronicaMes): EstadoMesNe {
    return estadoMes(f);
  }

  get listos(): NominaElectronicaMes[] {
    return this.filas.filter((f) => estadoMes(f).clave === 'LISTO');
  }

  contar(clave: EstadoMesNe['clave']): number {
    return this.filas.filter((f) => estadoMes(f).clave === clave).length;
  }

  async cambiarMes(d: Date | null): Promise<void> {
    if (!d) return;
    this.mes = d;
    this.rechazos = [];
    await this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando = true;
    try {
      const res = await lastValueFrom(this.service.listarMes(this.mes.getFullYear(), this.mes.getMonth() + 1));
      this.filas = res?.data ?? [];
    } catch (err: any) {
      this.filas = [];
      this.alert.showError('Nómina electrónica', err?.error?.message ?? 'No se pudo cargar el mes.');
    } finally {
      this.cargando = false;
    }
  }

  abrir(f: NominaElectronicaMes): void {
    if (!f.ultimaNominaId) return;
    this.nominaModal = f.ultimaNominaId;
    this.mostrarModal = true;
  }

  async cerrarModal(): Promise<void> {
    this.mostrarModal = false;
    await this.cargar();
  }

  /** Envía uno por uno los empleados con el mes completo y sin documento vigente. */
  async enviarListos(): Promise<void> {
    const listos = this.listos;
    if (!listos.length) return;
    this.enviando = true;
    this.avance = 0;
    this.rechazos = [];
    let aceptadas = 0;
    for (const f of listos) {
      try {
        const res = await lastValueFrom(this.service.enviar(f.ultimaNominaId!));
        if (res?.data?.exitoso && res.message && res.message !== 'Envío procesado')
          this.rechazos.push({ nombre: f.empleadoNombre ?? '', motivo: res.message });
        else if (res?.data?.exitoso) aceptadas++;
        else this.rechazos.push({ nombre: f.empleadoNombre ?? '', motivo: this.motivo(res?.data?.responseBody) });
      } catch (err: any) {
        this.rechazos.push({ nombre: f.empleadoNombre ?? '', motivo: err?.error?.message ?? 'No se pudo enviar' });
      }
      this.avance++;
    }
    this.enviando = false;
    if (this.rechazos.length)
      this.alert.showWarn('Nómina electrónica', `${aceptadas} aceptada(s), ${this.rechazos.length} con problema.`);
    else this.alert.showSuccess('Nómina electrónica', `${aceptadas} aceptada(s) por la DIAN.`);
    await this.cargar();
  }

  /** Mensaje legible de Factus/DIAN a partir del cuerpo de la respuesta. */
  private motivo(body?: string | null): string {
    if (!body) return 'Rechazada';
    try {
      const j = JSON.parse(body);
      const errores = j?.data?.errors ?? j?.errors;
      if (errores && typeof errores === 'object')
        return Object.values(errores).flat().join(' ') || j?.message || 'Rechazada';
      return j?.message ?? 'Rechazada';
    } catch {
      return body.substring(0, 200);
    }
  }
}
