import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { CarteraService } from '../../../core/services/cartera.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  CampoCondicion,
  CONDICIONES_REGLA,
  CondicionesReglaModel,
  ESTADOS_CREDITO,
  EVENTOS_REGLA,
  ReglaCreditoModel,
  SimulacionReglaModel,
  TIPOS_REGLA,
} from '../../../core/models/cartera.model';

interface FilaCondicion {
  campo: CampoCondicion | null;
  valor: any;
}

/** Plantillas para no arrancar de cero: los tres casos que casi todo negocio quiere. */
const PLANTILLAS: { titulo: string; texto: string; icon: string; regla: Partial<ReglaCreditoModel> }[] = [
  {
    titulo: 'Premiar al buen pagador',
    texto: 'Sube 10 % el cupo a quien paga a tiempo y tiene buen score.',
    icon: 'pi-star',
    regla: {
      nombre: 'Premiar al buen pagador',
      tipo: 'AUMENTO_CUPO',
      evento: 'AL_PAGAR',
      diasEntreAplicaciones: 90,
      condiciones: vacias({ scoreMinimo: 750, moraMaximaDias: 0, pagosConsecutivosATiempo: 3 }),
      accion: { aumentarPct: 10, cupoMaximo: null, reducirPct: null, cupoMinimo: null, mensaje: null },
    },
  },
  {
    titulo: 'Suspender por mora',
    texto: 'Suspende el crédito de quien pasa 60 días de mora.',
    icon: 'pi-pause-circle',
    regla: {
      nombre: 'Suspender por mora de 60 días',
      tipo: 'SUSPENSION',
      evento: 'PERIODICO',
      diasEntreAplicaciones: 30,
      condiciones: vacias({ moraMayorDias: 60 }),
      accion: { aumentarPct: null, cupoMaximo: null, reducirPct: null, cupoMinimo: null, mensaje: null },
    },
  },
  {
    titulo: 'Castigar promesas incumplidas',
    texto: 'Baja 20 % el cupo a quien incumple 2 promesas de pago.',
    icon: 'pi-calendar-times',
    regla: {
      nombre: 'Promesas incumplidas',
      tipo: 'REDUCCION_CUPO',
      evento: 'PERIODICO',
      diasEntreAplicaciones: 60,
      condiciones: vacias({ promesasIncumplidasMinimo: 2 }),
      accion: { aumentarPct: null, cupoMaximo: null, reducirPct: 20, cupoMinimo: null, mensaje: null },
    },
  },
];

function vacias(valores: Partial<CondicionesReglaModel> = {}): CondicionesReglaModel {
  return {
    scoreMinimo: null,
    scoreMaximo: null,
    moraMaximaDias: null,
    moraMayorDias: null,
    pagosConsecutivosATiempo: null,
    estadoCredito: null,
    promesasIncumplidasMinimo: null,
    usoCupoMinimoPct: null,
    ...valores,
  };
}

/** Reglas automáticas de crédito: se arman con frases, no con JSON. */
@Component({
  selector: 'app-reglas-credito',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    DropdownModule,
    InputNumberModule,
    InputTextModule,
    TextareaModule,
    TooltipModule,
    SkeletonModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './reglas-credito.component.html',
  styleUrls: ['./reglas-credito.component.scss'],
})
export class ReglasCreditoComponent implements OnInit {
  reglas: ReglaCreditoModel[] = [];
  cargando = false;

  readonly plantillas = PLANTILLAS;
  readonly tipos = TIPOS_REGLA;
  readonly eventos = EVENTOS_REGLA;
  readonly catalogo = CONDICIONES_REGLA;
  readonly estadosCredito = ESTADOS_CREDITO.map((e) => ({ label: e.label, value: e.value }));

  // Formulario
  formVisible = false;
  guardando = false;
  regla: ReglaCreditoModel = this.nueva();
  filas: FilaCondicion[] = [];

  // Simulación
  simulando = false;
  simulacion: SimulacionReglaModel[] | null = null;

  constructor(
    private readonly carteraService: CarteraService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.carteraService.reglas());
      this.reglas = res.data ?? [];
    } catch {
      this.alert.showError('Error', 'No se pudieron cargar las reglas');
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  volver(): void {
    this.router.navigate(['/cartera']);
  }

  // ── Formulario ──────────────────────────────────────────────────────
  private nueva(): ReglaCreditoModel {
    return {
      id: null,
      nombre: '',
      descripcion: null,
      tipo: 'AUMENTO_CUPO',
      evento: 'AL_PAGAR',
      activo: true,
      orden: 1,
      diasEntreAplicaciones: 30,
      condiciones: vacias(),
      accion: { aumentarPct: null, cupoMaximo: null, reducirPct: null, cupoMinimo: null, mensaje: null },
    };
  }

  abrirNueva(plantilla?: Partial<ReglaCreditoModel>): void {
    const base = this.nueva();
    this.regla = {
      ...base,
      ...(plantilla ?? {}),
      condiciones: { ...(plantilla?.condiciones ?? base.condiciones) },
      accion: { ...(plantilla?.accion ?? base.accion) },
    };
    this.filas = this.aFilas(this.regla.condiciones);
    if (!this.filas.length) this.filas = [{ campo: null, valor: null }];
    this.simulacion = null;
    this.formVisible = true;
    this.cdr.markForCheck();
  }

  editar(r: ReglaCreditoModel): void {
    this.regla = { ...r, condiciones: { ...r.condiciones }, accion: { ...r.accion } };
    this.filas = this.aFilas(r.condiciones);
    this.simulacion = null;
    this.formVisible = true;
    this.cdr.markForCheck();
  }

  private aFilas(c: CondicionesReglaModel): FilaCondicion[] {
    return this.catalogo
      .filter((d) => c[d.campo] != null && c[d.campo] !== '')
      .map((d) => ({ campo: d.campo, valor: c[d.campo] }));
  }

  opcionesCondicion(fila: FilaCondicion): { label: string; value: CampoCondicion }[] {
    const usados = new Set(this.filas.filter((f) => f !== fila && f.campo).map((f) => f.campo));
    return this.catalogo.filter((d) => !usados.has(d.campo)).map((d) => ({ label: d.label, value: d.campo }));
  }

  definicion(campo: CampoCondicion | null) {
    return this.catalogo.find((d) => d.campo === campo) ?? null;
  }

  agregarCondicion(): void {
    this.filas.push({ campo: null, valor: null });
    this.simulacion = null;
  }

  quitarCondicion(i: number): void {
    this.filas.splice(i, 1);
    this.simulacion = null;
  }

  onCampo(fila: FilaCondicion): void {
    fila.valor = this.definicion(fila.campo)?.tipo === 'estado' ? 'ACTIVO' : null;
    this.simulacion = null;
  }

  /** Arma la regla que viaja al backend desde las filas del formulario. */
  private armada(): ReglaCreditoModel {
    const condiciones = vacias();
    for (const f of this.filas) {
      if (f.campo && f.valor != null && f.valor !== '') (condiciones as any)[f.campo] = f.valor;
    }
    return { ...this.regla, condiciones };
  }

  get frase(): string {
    return this.describir(this.armada());
  }

  describir(r: ReglaCreditoModel): string {
    const cuando = this.eventos.find((e) => e.value === r.evento)?.frase ?? '';
    const condiciones = this.catalogo
      .filter((d) => r.condiciones[d.campo] != null && r.condiciones[d.campo] !== '')
      .map((d) => d.frase(r.condiciones[d.campo]));
    const si = condiciones.length ? `, si tiene ${condiciones.join(' y ')}` : '';
    return `${cuando}${si}: ${this.accionTexto(r)}.`;
  }

  accionTexto(r: ReglaCreditoModel): string {
    switch (r.tipo) {
      case 'AUMENTO_CUPO':
        return `sube el cupo ${r.accion.aumentarPct ?? '?'} %` +
          (r.accion.cupoMaximo ? ` sin pasar de ${this.formatCOP(r.accion.cupoMaximo)}` : '');
      case 'REDUCCION_CUPO':
        return `baja el cupo ${r.accion.reducirPct ?? '?'} %` +
          (r.accion.cupoMinimo ? ` sin bajar de ${this.formatCOP(r.accion.cupoMinimo)}` : '');
      case 'SUSPENSION':
        return 'suspende el crédito';
      case 'BLOQUEO':
        return 'bloquea el crédito';
      default:
        return 'deja una alerta en el historial del cliente';
    }
  }

  tipoInfo(t: string) {
    return this.tipos.find((x) => x.value === t) ?? this.tipos[0];
  }

  setTipo(t: ReglaCreditoModel['tipo']): void {
    this.regla.tipo = t;
    this.simulacion = null;
  }

  async simular(): Promise<void> {
    this.simulando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.carteraService.simularRegla(this.armada()));
      this.simulacion = res.data ?? [];
    } catch (err: any) {
      this.alert.showError('No se pudo probar', err?.error?.message ?? '');
    } finally {
      this.simulando = false;
      this.cdr.markForCheck();
    }
  }

  async guardar(): Promise<void> {
    this.guardando = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(this.carteraService.guardarRegla(this.armada()));
      this.alert.showSuccess(this.regla.id ? 'Regla actualizada' : 'Regla creada', '');
      this.formVisible = false;
      this.cargar();
    } catch (err: any) {
      this.alert.showError('No se pudo guardar', err?.error?.message ?? '');
    } finally {
      this.guardando = false;
      this.cdr.markForCheck();
    }
  }

  // ── Lista ───────────────────────────────────────────────────────────
  async cambiarActivo(r: ReglaCreditoModel, activo: boolean): Promise<void> {
    if (r.activo === activo || !r.id) return;
    try {
      await lastValueFrom(this.carteraService.activarRegla(r.id, activo));
      r.activo = activo;
      this.cdr.markForCheck();
    } catch (err: any) {
      this.alert.showError('Error', err?.error?.message ?? 'No se pudo cambiar el estado');
    }
  }

  eliminar(r: ReglaCreditoModel): void {
    this.confirm.confirm({
      header: 'Eliminar regla',
      message: `¿Eliminar <b>${r.nombre}</b>? Lo que ya hizo queda en el historial de cada cliente.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await lastValueFrom(this.carteraService.eliminarRegla(r.id!));
          this.alert.showSuccess('Regla eliminada', '');
          this.cargar();
        } catch (err: any) {
          this.alert.showError('Error', err?.error?.message ?? 'No se pudo eliminar');
        }
      },
    });
  }

  formatCOP(v: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }
}
