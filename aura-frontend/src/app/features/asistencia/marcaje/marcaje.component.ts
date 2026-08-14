import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { lastValueFrom } from 'rxjs';

import { AsistenciaService } from '../../../core/services/asistencia.service';
import { NominaService } from '../../../core/services/nomina.service';
import { EmpleadoTableModel } from '../../../core/models/nomina.model';
import { AlertService } from '../../../shared/pipes/alert.service';

/** Una fila de digitación: un empleado, su entrada y su salida del día. */
interface FilaCaptura {
  empleadoId: number;
  nombre: string;
  entrada: Date | null;
  salida: Date | null;
  estado: string | null;
  guardado: boolean;
}

/**
 * Digitación de asistencia (la captura el administrador, no el trabajador).
 *
 * <p>Se elige el día y se escribe la hora de entrada y salida de cada empleado
 * que requiere control de asistencia. Al guardar, se registran los marcajes con
 * esas horas y se consolida el día. No es un reloj en vivo.
 */
@Component({
  selector: 'app-marcaje',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, CalendarModule,
    TagModule, ToastModule, SkeletonModule,
  ],
  templateUrl: './marcaje.component.html',
  styleUrls: ['./marcaje.component.scss'],
})
export class MarcajeComponent implements OnInit {
  fecha: Date = new Date();
  filas: FilaCaptura[] = [];
  loading = false;
  guardando = false;

  private empleados: EmpleadoTableModel[] = [];

  constructor(
    private readonly asistenciaService: AsistenciaService,
    private readonly nominaService: NominaService,
    private readonly alert: AlertService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.cargarEmpleados();
    await this.cargarDia();
  }

  get fechaStr(): string {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${this.fecha.getFullYear()}-${p(this.fecha.getMonth() + 1)}-${p(this.fecha.getDate())}`;
  }

  private async cargarEmpleados(): Promise<void> {
    try {
      const res = await lastValueFrom(
        this.nominaService.pageEmpleados({ page: 0, rows: 500, search: null }),
      );
      // Solo los que requieren control de asistencia y están activos.
      this.empleados = (res?.data?.content ?? []).filter(
        (e) => e.requiereControlAsistencia && e.activo,
      );
    } catch {
      this.empleados = [];
    }
  }

  /** Arma las filas del día y precarga lo ya capturado. */
  async cargarDia(): Promise<void> {
    if (!this.empleados.length) {
      this.filas = [];
      return;
    }
    this.loading = true;
    try {
      const dias = await Promise.all(
        this.empleados.map((e) =>
          lastValueFrom(this.asistenciaService.listDias(e.id, this.fechaStr, this.fechaStr))
            .then((r) => (r?.data ?? [])[0] ?? null)
            .catch(() => null),
        ),
      );
      this.filas = this.empleados.map((e, i) => {
        const d = dias[i];
        return {
          empleadoId: e.id,
          nombre: e.nombreCompleto,
          entrada: this.aHora(d?.horaEntradaReal),
          salida: this.aHora(d?.horaSalidaReal),
          estado: d?.estadoAsistencia ?? null,
          guardado: !!d,
        };
      });
    } finally {
      this.loading = false;
    }
  }

  /** Guarda la asistencia de todas las filas con horas capturadas. */
  async guardarTodos(): Promise<void> {
    const conDatos = this.filas.filter((f) => f.entrada || f.salida);
    if (!conDatos.length) {
      this.alert.showWarn('Sin datos', 'Escribe al menos la entrada de un empleado.');
      return;
    }
    this.guardando = true;
    let ok = 0;
    let error = 0;
    for (const f of conDatos) {
      try {
        await this.guardarFila(f);
        f.guardado = true;
        ok++;
      } catch {
        error++;
      }
    }
    this.guardando = false;
    if (error === 0) this.alert.showSuccess('Guardado', `Asistencia registrada para ${ok} empleado(s).`);
    else this.alert.showWarn('Parcial', `${ok} guardados, ${error} con error.`);
    await this.cargarDia();
  }

  private async guardarFila(f: FilaCaptura): Promise<void> {
    // Limpiar lo previo del día para no duplicar marcajes al re-guardar.
    const previos = await lastValueFrom(
      this.asistenciaService.listMarcajes(f.empleadoId, this.fechaStr),
    );
    for (const m of previos?.data ?? []) {
      if (m.estado === 'VALIDO') {
        await lastValueFrom(this.asistenciaService.anularMarcaje(m.id));
      }
    }
    if (f.entrada) {
      await lastValueFrom(this.asistenciaService.registrarMarcaje({
        empleadoId: f.empleadoId,
        tipoMarcaje: 'ENTRADA',
        fechaHoraMarcaje: this.fechaHora(f.entrada),
        origenMarcaje: 'ASISTENTE',
      }));
    }
    if (f.salida) {
      await lastValueFrom(this.asistenciaService.registrarMarcaje({
        empleadoId: f.empleadoId,
        tipoMarcaje: 'SALIDA',
        fechaHoraMarcaje: this.fechaHora(f.salida),
        origenMarcaje: 'ASISTENTE',
      }));
    }
    // Consolidar el día para que cuente para la nómina.
    const cons = await lastValueFrom(this.asistenciaService.consolidarDia(f.empleadoId, this.fechaStr));
    f.estado = cons?.data?.estadoAsistencia ?? f.estado;
  }

  // ── Helpers ─────────────────────────────────────────────────

  /** 'HH:mm:ss' → Date (en el día seleccionado). */
  private aHora(hhmmss: string | null | undefined): Date | null {
    if (!hhmmss) return null;
    const [h, m] = hhmmss.split(':').map(Number);
    const d = new Date(this.fecha);
    d.setHours(h ?? 0, m ?? 0, 0, 0);
    return d;
  }

  /** Combina el día seleccionado con la hora del input → ISO local. */
  private fechaHora(hora: Date): string {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${this.fecha.getFullYear()}-${p(this.fecha.getMonth() + 1)}-${p(this.fecha.getDate())}`
      + `T${p(hora.getHours())}:${p(hora.getMinutes())}:00`;
  }

  estadoSeverity(e: string | null): 'success' | 'warn' | 'danger' | 'secondary' | 'info' {
    if (e === 'ASISTIO') return 'success';
    if (e === 'TARDE' || e === 'SALIDA_TEMPRANA') return 'warn';
    if (e === 'AUSENTE') return 'danger';
    if (e === 'SIN_MARCAJE_COMPLETO') return 'info';
    return 'secondary';
  }
}
