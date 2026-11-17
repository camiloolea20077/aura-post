import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { saveAs } from 'file-saver';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { ProyectoService } from '../../../core/services/proyecto.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  FilaMarcajeDto,
  ResultadoFilaMarcajeModel,
  ResultadoMarcajeModel,
  ResultadoRangoModel,
} from '../../../core/models/asistencia-frente.model';
import { construirPlantillaMarcaje, leerPlantillaMarcaje } from './marcaje-excel.util';
import { CalendarioAsistenciaComponent } from '../calendario-asistencia/calendario-asistencia.component';
import { FilaCalendario, filasDesdeImportacion } from '../calendario-asistencia/calendario-asistencia.util';

type Sev = 'success' | 'info' | 'warn' | 'danger' | 'secondary';

/**
 * Marcaje del mes desde Excel (V242): descargar la plantilla con los
 * trabajadores y los días del mes → llenarla → subirla → revisar lo que el
 * sistema calculó → importar. Después puede enviar el mes a revisión de una vez.
 */
@Component({
  selector: 'app-importar-marcaje',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    DatePickerModule,
    TagModule,
    TooltipModule,
    CalendarioAsistenciaComponent,
  ],
  templateUrl: './importar-marcaje.component.html',
  styleUrls: ['./importar-marcaje.component.scss'],
})
export class ImportarMarcajeComponent {
  @Input() visible = false;
  @Input({ required: true }) frenteId!: number;
  @Input() frenteNombre = '';
  /** false = sin revisión: tras importar no se envía nada; la prenómina lo toma al liquidar (V245). */
  @Input() requiereAprobacion = true;
  @Output() visibleChange = new EventEmitter<boolean>();
  /** Se importó: la pantalla recarga el día que muestra. */
  @Output() importado = new EventEmitter<void>();

  mes: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  archivo: File | null = null;
  filas: FilaMarcajeDto[] = [];
  resultado: ResultadoMarcajeModel | null = null;
  rango: ResultadoRangoModel | null = null;
  soloProblemas = true;

  /** Vista previa en calendario del mes que trae el archivo. */
  previa: { anio: number; mes: number; festivos: string[]; filas: FilaCalendario[] } | null = null;

  descargando = false;
  validando = false;
  importando = false;
  enviando = false;

  constructor(
    private readonly service: ProyectoService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  get puedeImportar(): boolean {
    const r = this.resultado;
    return !!r && !r.confirmado && r.errores === 0 && r.filasValidas > 0;
  }

  get filasVisibles(): ResultadoFilaMarcajeModel[] {
    const f = this.resultado?.filas ?? [];
    const visibles = this.soloProblemas ? f.filter((x) => x.resultado === 'ERROR' || x.resultado === 'ADVERTENCIA') : f;
    return visibles.slice(0, 400);
  }

  /** Primer y último día que trae el archivo importado (para enviar a revisión). */
  private get rangoArchivo(): { desde: string; hasta: string } | null {
    const fechas = this.filas.map((f) => f.fecha).filter((f): f is string => !!f).sort();
    return fechas.length ? { desde: fechas[0], hasta: fechas[fechas.length - 1] } : null;
  }

  cerrar(): void {
    this.visibleChange.emit(false);
    this.previa = null;
    this.archivo = null;
    this.filas = [];
    this.resultado = null;
    this.rango = null;
  }

  async descargarPlantilla(): Promise<void> {
    this.descargando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.trabajadores(this.frenteId));
      const activos = (res?.data ?? []).filter((t) => t.estado === 'ACTIVO');
      if (!activos.length) {
        this.alert.showWarn('Plantilla', 'El frente no tiene trabajadores asignados. Asígnelos en Proyectos y frentes.');
        return;
      }
      const anio = this.mes.getFullYear();
      const mes = this.mes.getMonth() + 1;
      const blob = await construirPlantillaMarcaje(activos, anio, mes, this.frenteNombre);
      saveAs(blob, `marcaje-${this.slug(this.frenteNombre)}-${anio}-${String(mes).padStart(2, '0')}.xlsx`);
    } catch (err: any) {
      this.alert.showError('Plantilla', err?.error?.message ?? 'No se pudo generar la plantilla.');
    } finally {
      this.descargando = false;
      this.cdr.markForCheck();
    }
  }

  async onArchivo(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.resultado = null;
    this.rango = null;
    try {
      this.filas = await leerPlantillaMarcaje(file);
      this.archivo = file;
      if (!this.filas.length) {
        this.alert.showWarn('Archivo vacío', 'No se encontraron filas con datos.');
        return;
      }
      await this.validar();
    } catch (err: any) {
      this.archivo = null;
      this.filas = [];
      this.alert.showError('No se pudo leer el archivo', err?.message ?? 'Use la plantilla en formato .xlsx');
    } finally {
      this.cdr.markForCheck();
    }
  }

  async validar(): Promise<void> {
    this.validando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.validarMarcajeExcel(this.frenteId, this.filas));
      this.resultado = res?.data ?? null;
      await this.armarPrevia();
    } catch (err: any) {
      this.alert.showError('No se pudo validar', err?.error?.message ?? 'Intente de nuevo.');
    } finally {
      this.validando = false;
      this.cdr.markForCheck();
    }
  }

  async importar(): Promise<void> {
    this.importando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.confirmarMarcajeExcel(this.frenteId, this.filas, this.archivo));
      this.resultado = res?.data ?? null;
      if (this.resultado?.confirmado) {
        this.alert.showSuccess('Marcaje importado', `${this.resultado.dias} día(s) guardados como borrador.`);
        this.importado.emit();
      } else {
        this.alert.showWarn('No se importó', 'El archivo tiene errores: corríjalos y vuelva a subirlo.');
      }
    } catch (err: any) {
      this.alert.showError('No se pudo importar', err?.error?.message ?? 'Intente de nuevo.');
    } finally {
      this.importando = false;
      this.cdr.markForCheck();
    }
  }

  /** Envía a revisión los días importados (los que tengan soporte y sin alertas críticas). */
  async enviarARevision(): Promise<void> {
    const r = this.rangoArchivo;
    if (!r) return;
    this.enviando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.enviarRevisionRango(this.frenteId, r.desde, r.hasta));
      this.rango = res?.data ?? null;
      const n = this.rango?.procesados ?? 0;
      if (this.rango?.errores.length) this.alert.showWarn('Revisión', `${n} día(s) enviados; ${this.rango.errores.length} no se pudieron enviar.`);
      else this.alert.showSuccess('Revisión', `${n} día(s) enviados a revisión.`);
      this.importado.emit();
    } catch (err: any) {
      this.alert.showError('No se pudo enviar', err?.error?.message ?? 'Intente de nuevo.');
    } finally {
      this.enviando = false;
      this.cdr.markForCheck();
    }
  }

  /** Calendario del mes del archivo (el de la mayoría de las fechas), con los festivos. */
  private async armarPrevia(): Promise<void> {
    this.previa = null;
    const filas = this.resultado?.filas ?? [];
    const meses = new Map<string, number>();
    filas.forEach((f) => f.fecha && meses.set(f.fecha.slice(0, 7), (meses.get(f.fecha.slice(0, 7)) ?? 0) + 1));
    const mes = [...meses.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!mes) return;
    let festivos: string[] = [];
    try {
      const res = await lastValueFrom(this.service.calendarioAsistencia(this.frenteId, mes));
      festivos = res?.data?.festivos ?? [];
    } catch {
      /* sin festivos: el calendario se ve igual */
    }
    const [anio, m] = mes.split('-').map(Number);
    this.previa = {
      anio,
      mes: m,
      festivos,
      filas: filasDesdeImportacion(filas.filter((f) => f.fecha?.startsWith(mes))),
    };
  }

  severidad(r: string): Sev {
    switch (r) {
      case 'OK':
        return 'success';
      case 'ADVERTENCIA':
        return 'warn';
      case 'ERROR':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  texto(r: string): string {
    return r === 'OK' ? 'Bien' : r === 'ADVERTENCIA' ? 'Revisar' : r === 'ERROR' ? 'Error' : 'Omitida';
  }

  private slug(s: string): string {
    return (s || 'frente')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
