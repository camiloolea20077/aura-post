import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { AuditoriaService } from '../../../core/services/auditoria.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  AuditoriaFiltroDto,
  AuditoriaResultadoModel,
  HallazgoModel,
  Severidad,
} from '../../../core/models/auditoria.model';
import { aFechaLocal } from '../../../shared/utils/fecha.util';

/**
 * Reporte gerencial de auditoría.
 *
 * <p>La pantalla es la vista previa del PDF, no un reporte aparte: sale de la
 * misma corrida del motor, así que lo que se ve aquí es lo que se descarga.
 *
 * <p>Los hallazgos vienen con sus causas probables — ordenadas por frecuencia,
 * no por gravedad — y con el cruce que los produjo. Eso último es lo que hace
 * defendible cada cifra cuando alguien la cuestione.
 */
@Component({
  selector: 'app-reporte-gerencial',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CalendarModule,
    InputNumberModule,
    InputSwitchModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './reporte-gerencial.component.html',
  styleUrls: ['./reporte-gerencial.component.scss'],
})
export class ReporteGerencialComponent implements OnInit {
  frm: FormGroup;

  resultado: AuditoriaResultadoModel | null = null;
  analizando = false;
  descargando = false;
  /** Se abre uno a la vez: son tarjetas largas y varias abiertas no se leen. */
  abierto: string | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: AuditoriaService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    const hoy = new Date();
    const primero = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.frm = this.fb.group({
      fechaDesde: [primero],
      fechaHasta: [hoy],
      // Debajo de esto un descuadre de caja o cartera es redondeo de conteo.
      umbralMonto: [1000],
      incluirHeredados: [true],
    });
  }

  ngOnInit(): void {
    this.analizar();
  }

  // ── Consulta ──────────────────────────────────────────────────────

  private filtro(conDetalle: boolean): AuditoriaFiltroDto {
    const v = this.frm.value;
    return {
      // aFechaLocal y no toISOString: este último pasa a UTC y en Colombia
      // correría el rango un día.
      fechaDesde: aFechaLocal(v.fechaDesde),
      fechaHasta: aFechaLocal(v.fechaHasta),
      umbralMonto: v.umbralMonto ?? null,
      incluirHeredados: v.incluirHeredados ?? true,
      incluirDetalle: conDetalle,
      limiteDetalle: 50,
    };
  }

  async analizar(): Promise<void> {
    this.analizando = true;
    this.abierto = null;
    this.cdr.markForCheck();
    try {
      // Con detalle: la pantalla deja abrir cada hallazgo para ver sus filas,
      // y sin ellas la tarjeta expandida quedaría vacía.
      const res = await lastValueFrom(this.service.auditar(this.filtro(true)));
      this.resultado = res?.data ?? null;
    } catch (e: any) {
      this.resultado = null;
      this.alert.showError(
        'Error',
        e?.error?.message ?? 'No se pudo ejecutar la auditoría.',
      );
    } finally {
      this.analizando = false;
      this.cdr.markForCheck();
    }
  }

  async descargarPdf(): Promise<void> {
    this.descargando = true;
    this.cdr.markForCheck();
    try {
      const blob = await lastValueFrom(this.service.pdf(this.filtro(true)));
      const v = this.frm.value;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_gerencial_${aFechaLocal(v.fechaDesde)}_${aFechaLocal(v.fechaHasta)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      this.alert.showError('Error', 'No se pudo generar el reporte.');
    } finally {
      this.descargando = false;
      this.cdr.markForCheck();
    }
  }

  alternar(codigo: string): void {
    this.abierto = this.abierto === codigo ? null : codigo;
    this.cdr.markForCheck();
  }

  // ── Helpers ───────────────────────────────────────────────────────

  get hallazgos(): HallazgoModel[] {
    return this.resultado?.hallazgos ?? [];
  }

  get heredados(): HallazgoModel[] {
    return this.resultado?.heredados ?? [];
  }

  get estaLimpio(): boolean {
    return !!this.resultado && this.resultado.alta === 0;
  }

  get sinResultados(): boolean {
    return (
      !!this.resultado &&
      this.hallazgos.length === 0 &&
      this.heredados.length === 0
    );
  }

  /** El período no puede pasar de un trimestre: lo valida el backend. */
  get rangoLargo(): boolean {
    const v = this.frm.value;
    if (!v.fechaDesde || !v.fechaHasta) return false;
    const dias =
      (new Date(v.fechaHasta).getTime() - new Date(v.fechaDesde).getTime()) /
      86400000;
    return dias > 92;
  }

  etiquetaSeveridad(s: Severidad): string {
    if (s === 'ALTA') return 'GRAVE';
    if (s === 'MEDIA') return 'REVISAR';
    return 'MENOR';
  }

  severidadTag(s: Severidad): 'danger' | 'warn' | 'secondary' {
    if (s === 'ALTA') return 'danger';
    if (s === 'MEDIA') return 'warn';
    return 'secondary';
  }

  etiquetaArea(a: string): string {
    const mapa: Record<string, string> = {
      CAJA: 'Caja',
      CARTERA: 'Cartera',
      INVENTARIO: 'Inventario',
      CONTABILIDAD: 'Contabilidad',
      GASTOS: 'Gastos',
      FACTURACION: 'Facturación',
    };
    return mapa[a] ?? a;
  }

  iconoArea(a: string): string {
    const mapa: Record<string, string> = {
      CAJA: 'pi pi-wallet',
      CARTERA: 'pi pi-users',
      INVENTARIO: 'pi pi-box',
      CONTABILIDAD: 'pi pi-book',
      GASTOS: 'pi pi-shopping-cart',
      FACTURACION: 'pi pi-file-export',
    };
    return mapa[a] ?? 'pi pi-info-circle';
  }

  formatCOP(v: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }
}
