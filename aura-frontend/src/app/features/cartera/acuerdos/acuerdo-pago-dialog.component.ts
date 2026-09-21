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
import { CheckboxModule } from 'primeng/checkbox';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { CarteraService } from '../../../core/services/cartera.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { aFechaLocal } from '../../../shared/utils/fecha.util';
import {
  AcuerdoPagoModel,
  FichaFacturaModel,
  FRECUENCIAS_ACUERDO,
  FrecuenciaAcuerdo,
} from '../../../core/models/cartera.model';

interface CuotaForm {
  fecha: Date;
  valor: number;
}

/**
 * Acuerdo de pago: el cliente se compromete a pagar varias facturas en cuotas.
 * Se eligen las facturas, se arma el plan (número de cuotas, cada cuánto y
 * desde cuándo) y cada cuota se puede corregir a mano antes de guardar.
 */
@Component({
  selector: 'app-acuerdo-pago-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputNumberModule,
    CalendarModule,
    CheckboxModule,
    TextareaModule,
    TooltipModule,
  ],
  templateUrl: './acuerdo-pago-dialog.component.html',
  styleUrls: ['./acuerdo-pago-dialog.component.scss'],
})
export class AcuerdoPagoDialogComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() terceroId: number | null = null;
  @Input() clienteNombre = '';
  @Input() facturas: FichaFacturaModel[] = [];
  @Output() creado = new EventEmitter<AcuerdoPagoModel>();

  readonly frecuencias = FRECUENCIAS_ACUERDO;
  readonly hoy = this.inicioDia(new Date());

  seleccion = new Set<number>();
  numeroCuotas = 3;
  frecuencia: FrecuenciaAcuerdo = 'MENSUAL';
  primeraFecha: Date = this.sumarPeriodo(this.hoy, 'MENSUAL', 1);
  diasGracia = 3;
  observaciones = '';
  cuotas: CuotaForm[] = [];
  /** Se tocó una cuota a mano: el plan ya no es la frecuencia pura. */
  editado = false;

  guardando = false;
  resultado: AcuerdoPagoModel | null = null;

  constructor(
    private readonly carteraService: CarteraService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) this.reiniciar();
  }

  /** Las facturas que ya están en un acuerdo no se pueden volver a refinanciar. */
  get disponibles(): FichaFacturaModel[] {
    return this.facturas.filter((f) => !f.acuerdoId);
  }

  get enAcuerdo(): FichaFacturaModel[] {
    return this.facturas.filter((f) => !!f.acuerdoId);
  }

  get total(): number {
    return this.redondear(
      this.disponibles
        .filter((f) => this.seleccion.has(f.id))
        .reduce((s, f) => s + f.saldoPendiente, 0),
    );
  }

  get sumaCuotas(): number {
    return this.redondear(this.cuotas.reduce((s, c) => s + (c.valor || 0), 0));
  }

  get diferencia(): number {
    return this.redondear(this.total - this.sumaCuotas);
  }

  /** Mensaje del primer problema que impide guardar, o null. */
  get problema(): string | null {
    if (!this.seleccion.size) return 'Elige al menos una factura';
    if (!this.cuotas.length) return 'El plan no tiene cuotas';
    for (let i = 0; i < this.cuotas.length; i++) {
      const c = this.cuotas[i];
      if (!c.fecha) return `La cuota ${i + 1} no tiene fecha`;
      if (this.inicioDia(c.fecha) < this.hoy) return `La cuota ${i + 1} tiene una fecha pasada`;
      if (i > 0 && this.inicioDia(c.fecha) <= this.inicioDia(this.cuotas[i - 1].fecha))
        return `La cuota ${i + 1} debe vencer después de la cuota ${i}`;
      if (!c.valor || c.valor <= 0) return `La cuota ${i + 1} no tiene valor`;
    }
    if (this.diferencia !== 0)
      return this.diferencia > 0
        ? `Faltan ${this.formatCOP(this.diferencia)} por repartir`
        : `Las cuotas pasan la deuda por ${this.formatCOP(-this.diferencia)}`;
    return null;
  }

  private reiniciar(): void {
    this.resultado = null;
    this.guardando = false;
    this.seleccion = new Set(this.disponibles.map((f) => f.id));
    this.numeroCuotas = 3;
    this.frecuencia = 'MENSUAL';
    this.primeraFecha = this.sumarPeriodo(this.hoy, 'MENSUAL', 1);
    this.diasGracia = 3;
    this.observaciones = '';
    this.generar();
  }

  toggleFactura(id: number, marcada: boolean): void {
    if (marcada) this.seleccion.add(id);
    else this.seleccion.delete(id);
    this.seleccion = new Set(this.seleccion);
    this.generar();
  }

  todas(marcar: boolean): void {
    this.seleccion = new Set(marcar ? this.disponibles.map((f) => f.id) : []);
    this.generar();
  }

  setFrecuencia(f: FrecuenciaAcuerdo): void {
    this.frecuencia = f;
    this.generar();
  }

  /**
   * Reparte la deuda en cuotas iguales en pesos enteros; la última se lleva los
   * centavos y el residuo para que el plan cuadre exacto.
   */
  generar(): void {
    const n = Math.max(1, Math.min(60, Math.floor(this.numeroCuotas || 1)));
    this.numeroCuotas = n;
    const total = this.total;
    const base = Math.floor(total / n);
    this.cuotas = Array.from({ length: n }, (_, i) => ({
      fecha: this.sumarPeriodo(this.primeraFecha ?? this.hoy, this.frecuencia, i),
      valor: i === n - 1 ? this.redondear(total - base * (n - 1)) : base,
    }));
    this.editado = false;
    this.cdr.markForCheck();
  }

  onCuotaEditada(): void {
    this.editado = true;
    this.cdr.markForCheck();
  }

  /** Lleva la diferencia a la última cuota. */
  ajustarUltima(): void {
    const ultima = this.cuotas[this.cuotas.length - 1];
    if (!ultima) return;
    ultima.valor = this.redondear(ultima.valor + this.diferencia);
    this.editado = true;
    this.cdr.markForCheck();
  }

  async guardar(): Promise<void> {
    if (this.problema || !this.terceroId) return;
    this.guardando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.carteraService.crearAcuerdo({
          terceroId: this.terceroId,
          cuentaCobrarIds: [...this.seleccion],
          cuotas: this.cuotas.map((c) => ({ fechaVencimiento: aFechaLocal(c.fecha), valor: c.valor })),
          frecuencia: this.editado ? 'PERSONALIZADA' : this.frecuencia,
          diasGracia: this.diasGracia ?? 0,
          observaciones: this.observaciones.trim() || null,
        }),
      );
      this.resultado = res.data;
      this.creado.emit(res.data);
    } catch (err: any) {
      this.alert.showError('No se pudo crear el acuerdo', err?.error?.message ?? '');
    } finally {
      this.guardando = false;
      this.cdr.markForCheck();
    }
  }

  async imprimir(): Promise<void> {
    if (!this.resultado) return;
    try {
      const blob = await lastValueFrom(this.carteraService.acuerdoPdf(this.resultado.id));
      window.open(URL.createObjectURL(blob), '_blank');
    } catch {
      this.alert.showError('Error', 'No se pudo generar el PDF del acuerdo');
    }
  }

  cerrar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  private sumarPeriodo(desde: Date, frecuencia: FrecuenciaAcuerdo, veces: number): Date {
    const d = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());
    if (frecuencia === 'SEMANAL') d.setDate(d.getDate() + 7 * veces);
    else if (frecuencia === 'QUINCENAL') d.setDate(d.getDate() + 15 * veces);
    else {
      // Mismo día cada mes; si el mes es más corto, el último día (31 ene → 28 feb).
      const dia = desde.getDate();
      d.setDate(1);
      d.setMonth(d.getMonth() + veces);
      const ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      d.setDate(Math.min(dia, ultimo));
    }
    return d;
  }

  private inicioDia(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private redondear(v: number): number {
    return Math.round(v * 100) / 100;
  }

  formatCOP(v: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }
}
