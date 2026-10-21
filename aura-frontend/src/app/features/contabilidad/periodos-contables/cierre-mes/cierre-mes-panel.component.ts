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
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { CierreMesService } from '../../../../core/services/cierre-mes.service';
import { ActaCierrePdfService } from '../../../../core/services/acta-cierre-pdf.service';
import {
  ChequeoCierreModel,
  ChequeoModel,
  ComparativoModel,
  LineaComparativoModel,
} from '../../../../core/models/cierre-mes.model';
import { MESES, PeriodoContableModel } from '../../../../core/models/periodo-contable.model';
import { AlertService } from '../../../../shared/pipes/alert.service';

interface GrupoChequeo {
  nombre: string;
  chequeos: ChequeoModel[];
}

interface SeccionComparativo {
  titulo: string;
  lineas: LineaComparativoModel[];
  total: { actual: number; mesAnterior: number; anioAnterior: number };
}

/**
 * Cierre del mes (fases 2 a 5): lista de chequeo con semáforos y acción a un
 * clic, el acta en PDF y el comparativo de resultados contra el mes anterior y
 * el mismo mes del año anterior. Cerrar sigue siendo el diálogo de la pantalla
 * de períodos: este panel solo lo pide.
 */
@Component({
  selector: 'app-cierre-mes-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonModule, DropdownModule, TooltipModule],
  templateUrl: './cierre-mes-panel.component.html',
  styleUrls: ['./cierre-mes-panel.component.scss'],
})
export class CierreMesPanelComponent implements OnChanges {
  @Input() periodos: PeriodoContableModel[] = [];
  /** El mes abierto más antiguo: el único que se puede cerrar. */
  @Input() siguienteACerrar: PeriodoContableModel | null = null;
  @Output() cerrar = new EventEmitter<PeriodoContableModel>();

  periodoId: number | null = null;
  chequeo: ChequeoCierreModel | null = null;
  grupos: GrupoChequeo[] = [];
  comparativo: ComparativoModel | null = null;
  secciones: SeccionComparativo[] = [];
  utilidad = { actual: 0, mesAnterior: 0, anioAnterior: 0 };

  cargando = false;
  ajustando: string | null = null;
  generandoActa = false;
  abiertos = new Set<string>();

  constructor(
    private readonly service: CierreMesService,
    private readonly actaPdf: ActaCierrePdfService,
    private readonly alert: AlertService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['periodos'] || changes['siguienteACerrar']) {
      const sigue = this.periodoId && this.periodos.some((p) => p.id === this.periodoId);
      if (!sigue) {
        this.periodoId = this.siguienteACerrar?.id ?? this.ultimoCerrado()?.id ?? null;
      }
      if (this.periodoId) this.cargar();
    }
  }

  get opciones(): { label: string; value: number }[] {
    return [...this.periodos]
      .sort((a, b) => b.anio - a.anio || b.mes - a.mes)
      .map((p) => ({
        label: `${this.mesLabel(p.mes)} ${p.anio} · ${p.estado === 'ABIERTO' ? 'abierto' : 'cerrado'}`,
        value: p.id,
      }));
  }

  get periodo(): PeriodoContableModel | null {
    return this.periodos.find((p) => p.id === this.periodoId) ?? null;
  }

  get esSiguiente(): boolean {
    return !!this.siguienteACerrar && this.siguienteACerrar.id === this.periodoId;
  }

  get oks(): number {
    return this.chequeo?.chequeos.filter((c) => c.estado === 'OK').length ?? 0;
  }

  async cargar(): Promise<void> {
    if (!this.periodoId) return;
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const [ch, comp] = await Promise.all([
        lastValueFrom(this.service.chequeo(this.periodoId)),
        lastValueFrom(this.service.comparativo(this.periodoId)),
      ]);
      this.chequeo = ch.data;
      this.agrupar();
      this.comparativo = comp.data;
      this.armarComparativo();
    } catch (e: any) {
      this.alert.showError('Error', e?.error?.message ?? 'No se pudo revisar el cierre del mes');
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  private agrupar(): void {
    const out: GrupoChequeo[] = [];
    for (const c of this.chequeo?.chequeos ?? []) {
      let g = out.find((x) => x.nombre === c.grupo);
      if (!g) {
        g = { nombre: c.grupo, chequeos: [] };
        out.push(g);
      }
      g.chequeos.push(c);
    }
    this.grupos = out;
  }

  private armarComparativo(): void {
    const lineas = this.comparativo?.lineas ?? [];
    const seccion = (titulo: string, tipo: string): SeccionComparativo => {
      const ls = lineas.filter((l) => l.seccion === tipo);
      return {
        titulo,
        lineas: ls,
        total: {
          actual: ls.reduce((a, l) => a + l.actual, 0),
          mesAnterior: ls.reduce((a, l) => a + l.mesAnterior, 0),
          anioAnterior: ls.reduce((a, l) => a + l.anioAnterior, 0),
        },
      };
    };
    const ing = seccion('Ingresos', 'INGRESO');
    const cos = seccion('Costos', 'COSTO');
    const gas = seccion('Gastos', 'GASTO');
    this.secciones = [ing, cos, gas].filter((s) => s.lineas.length);
    this.utilidad = {
      actual: ing.total.actual - cos.total.actual - gas.total.actual,
      mesAnterior: ing.total.mesAnterior - cos.total.mesAnterior - gas.total.mesAnterior,
      anioAnterior: ing.total.anioAnterior - cos.total.anioAnterior - gas.total.anioAnterior,
    };
  }

  async accion(c: ChequeoModel): Promise<void> {
    if (!c.accionValor) return;
    if (c.accionTipo === 'RUTA') {
      this.router.navigateByUrl(c.accionValor);
      return;
    }
    if (!this.periodoId) return;
    this.ajustando = c.codigo;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.ajustar(this.periodoId, c.accionValor));
      this.alert.showSuccess('Listo', res.data?.mensaje ?? res.message ?? '');
      await this.cargar();
    } catch (e: any) {
      this.alert.showError('No se pudo ajustar', e?.error?.message ?? '');
    } finally {
      this.ajustando = null;
      this.cdr.markForCheck();
    }
  }

  async acta(): Promise<void> {
    if (!this.periodoId) return;
    this.generandoActa = true;
    this.cdr.markForCheck();
    try {
      await this.actaPdf.ver(this.periodoId);
    } catch (e: any) {
      this.alert.showError('Error', e?.error?.message ?? 'No se pudo generar el acta');
    } finally {
      this.generandoActa = false;
      this.cdr.markForCheck();
    }
  }

  pedirCierre(): void {
    if (this.periodo) this.cerrar.emit(this.periodo);
  }

  toggle(codigo: string): void {
    const s = new Set(this.abiertos);
    s.has(codigo) ? s.delete(codigo) : s.add(codigo);
    this.abiertos = s;
  }

  variacion(actual: number, base: number): string {
    if (!base) return actual ? 'nuevo' : '—';
    const v = ((actual - base) / Math.abs(base)) * 100;
    return (v > 0 ? '+' : '') + v.toFixed(1) + ' %';
  }

  estadoTexto(e: string): string {
    return e === 'OK' ? 'OK' : e === 'BLOQUEA' ? 'Bloquea' : e === 'ADVERTENCIA' ? 'Revisar' : 'No aplica';
  }

  mesLabel(mes: number): string {
    return MESES.find((m) => m.value === mes)?.label ?? String(mes);
  }

  cop(v: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
      v ?? 0,
    );
  }

  private ultimoCerrado(): PeriodoContableModel | null {
    return (
      [...this.periodos]
        .filter((p) => p.estado === 'CERRADO')
        .sort((a, b) => b.anio - a.anio || b.mes - a.mes)[0] ?? null
    );
  }
}
