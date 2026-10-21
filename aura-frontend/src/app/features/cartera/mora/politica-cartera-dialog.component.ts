import {
  ChangeDetectionStrategy,
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
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { CarteraMoraService } from '../../../core/services/cartera-mora.service';
import { PoliticaCarteraModel } from '../../../core/models/cartera-mora.model';
import { AlertService } from '../../../shared/pipes/alert.service';
import { aDate, aFechaLocal } from '../../../shared/utils/fecha.util';

interface TramoForm {
  dias: number | null;
  porcentaje: number | null;
}

/**
 * Política de cartera de la empresa: interés de mora (opcional, con tope en la
 * usura que registra el usuario), tramos de deterioro y desde cuántos días se
 * sugiere castigar.
 */
@Component({
  selector: 'app-politica-cartera-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputNumberModule,
    CalendarModule,
    DropdownModule,
    TooltipModule,
  ],
  templateUrl: './politica-cartera-dialog.component.html',
  styleUrls: ['./mora.scss'],
})
export class PoliticaCarteraDialogComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() guardada = new EventEmitter<PoliticaCarteraModel>();

  readonly opcionesInteres = [
    { label: 'No, no cobro intereses', value: false },
    { label: 'Sí, cobrar intereses de mora', value: true },
  ];

  cargando = false;
  guardando = false;
  politica: PoliticaCarteraModel | null = null;

  interesActivo = false;
  tasaMora: number | null = 0;
  tasaUsura: number | null = 0;
  usuraHasta: Date | null = null;
  diasGracia: number | null = 0;
  diasCastigo: number | null = 360;
  tramos: TramoForm[] = [];

  constructor(
    private readonly service: CarteraMoraService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.politica());
      const p = res.data;
      this.politica = p;
      this.interesActivo = !!p.interesActivo;
      this.tasaMora = p.tasaMoraMensual ?? 0;
      this.tasaUsura = p.tasaUsuraMensual ?? 0;
      this.usuraHasta = aDate(p.usuraVigenteHasta);
      this.diasGracia = p.diasGracia ?? 0;
      this.diasCastigo = p.diasSugerirCastigo ?? 360;
      this.tramos = Object.entries(p.deterioroTramos ?? {})
        .map(([d, pct]) => ({ dias: Number(d), porcentaje: Number(pct) }))
        .sort((a, b) => (a.dias ?? 0) - (b.dias ?? 0));
    } catch {
      this.alert.showError('Error', 'No se pudo cargar la política de cartera');
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  agregarTramo(): void {
    const ultimo = this.tramos[this.tramos.length - 1];
    this.tramos = [...this.tramos, { dias: (ultimo?.dias ?? 0) + 90, porcentaje: null }];
  }

  quitarTramo(i: number): void {
    this.tramos = this.tramos.filter((_, idx) => idx !== i);
  }

  /** La tasa que de verdad se cobra: la pactada, sin pasar la usura. */
  get tasaAplicable(): number {
    const mora = this.tasaMora ?? 0;
    const usura = this.tasaUsura ?? 0;
    return usura > 0 && mora > usura ? usura : mora;
  }

  get problema(): string | null {
    if (this.interesActivo) {
      if (!this.tasaMora || this.tasaMora <= 0) return 'Escriba la tasa de mora mensual.';
      if (!this.tasaUsura || this.tasaUsura <= 0) return 'Registre la tasa de usura vigente: es el tope legal del interés.';
      if (!this.usuraHasta) return 'Indique hasta qué fecha rige la tasa de usura.';
    }
    if ((this.diasCastigo ?? 0) < 30) return 'Los días para sugerir castigo deben ser al menos 30.';
    const dias = this.tramos.map((t) => t.dias);
    if (this.tramos.some((t) => t.dias == null || t.porcentaje == null))
      return 'Complete los días y el porcentaje de cada tramo de deterioro.';
    if (this.tramos.some((t) => (t.porcentaje ?? 0) < 0 || (t.porcentaje ?? 0) > 100))
      return 'El porcentaje de deterioro va de 0 a 100.';
    if (new Set(dias).size !== dias.length) return 'Hay dos tramos con los mismos días.';
    return null;
  }

  async guardar(): Promise<void> {
    if (this.problema) return;
    this.guardando = true;
    this.cdr.markForCheck();
    const tramos: Record<string, number> = {};
    for (const t of this.tramos) tramos[String(t.dias)] = t.porcentaje ?? 0;
    try {
      const res = await lastValueFrom(
        this.service.guardarPolitica({
          interesActivo: this.interesActivo,
          tasaMoraMensual: this.tasaMora ?? 0,
          tasaUsuraMensual: this.tasaUsura ?? 0,
          usuraVigenteHasta: aFechaLocal(this.usuraHasta),
          diasGracia: this.diasGracia ?? 0,
          deterioroTramos: tramos,
          diasSugerirCastigo: this.diasCastigo ?? 360,
        }),
      );
      this.alert.showSuccess('Listo', res.message ?? 'Política guardada');
      this.guardada.emit(res.data);
      this.cerrar();
    } catch (err: any) {
      this.alert.showError('No se pudo guardar', err?.error?.message ?? '');
    } finally {
      this.guardando = false;
      this.cdr.markForCheck();
    }
  }

  cerrar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
