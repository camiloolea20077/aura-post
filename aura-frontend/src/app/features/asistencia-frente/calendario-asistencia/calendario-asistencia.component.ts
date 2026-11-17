import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';

import { DiaColumna, FilaCalendario, diasDelMes } from './calendario-asistencia.util';

/**
 * Calendario del mes: una fila por trabajador y una columna por día, con las
 * horas de cada día, las faltas y las ausencias justificadas. Domingos y
 * festivos resaltados. Solo muestra; el cálculo de las filas va en el util.
 */
@Component({
  selector: 'app-calendario-asistencia',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TooltipModule],
  templateUrl: './calendario-asistencia.component.html',
  styleUrls: ['./calendario-asistencia.component.scss'],
})
export class CalendarioAsistenciaComponent implements OnChanges {
  @Input({ required: true }) anio!: number;
  /** 1 a 12. */
  @Input({ required: true }) mes!: number;
  @Input() festivos: string[] = [];
  @Input() filas: FilaCalendario[] = [];
  /** Si es true, al hacer clic en un día se emite `dia` (para abrirlo en la digitación). */
  @Input() clicable = false;
  @Output() dia = new EventEmitter<string>();

  dias: DiaColumna[] = [];

  ngOnChanges(): void {
    this.dias = this.anio && this.mes ? diasDelMes(this.anio, this.mes, this.festivos) : [];
  }

  abrir(fecha: string): void {
    if (this.clicable) this.dia.emit(fecha);
  }

  trackFila(_: number, f: FilaCalendario): string {
    return f.clave;
  }
}
