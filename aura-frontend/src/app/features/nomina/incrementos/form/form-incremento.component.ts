import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { OPCIONES_TIPO_LISTA, TipoListaNomina } from '../../../../core/models/nomina-documento.model';
import {
  IncrementoDetalleModel,
  IncrementoModel,
  OPCIONES_REDONDEO,
  OPCIONES_TIPO_INCREMENTO,
  RedondeoIncremento,
  TEXTO_ESTADO_INCREMENTO,
  TipoIncremento,
  severidadEstadoIncremento,
} from '../../../../core/models/nomina-incremento.model';
import { NominaCatalogoService } from '../../../../core/services/nomina-catalogo.service';
import { NominaIncrementoService } from '../../../../core/services/nomina-incremento.service';
import { NominaTipoVinculacionService } from '../../../../core/services/nomina-tipo-vinculacion.service';
import { VinculacionService } from '../../../../core/services/vinculacion.service';
import { TerceroAutocompleteComponent } from '../../../../shared/components/tercero-autocomplete/tercero-autocomplete.component';
import { PuedeDirective } from '../../../../shared/directives/puede.directive';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { FechaEsPipe } from '../../../../shared/pipes/fecha-es.pipe';
import { aDate, aFechaLocal } from '../../../../shared/utils/fecha.util';

type Opcion = { label: string; value: number };

/** Encabezado del incremento (fecha como Date para el p-calendar). */
interface FormIncremento {
  tipoLista: TipoListaNomina;
  terceroId: number | null;
  ids: number[];
  tipoIncremento: TipoIncremento;
  valor: number | null;
  redondeo: RedondeoIncremento;
  fechaAplicacion: Date | null;
  descripcion: string;
}

const FORM_VACIO = (): FormIncremento => ({
  tipoLista: 'TODOS',
  terceroId: null,
  ids: [],
  tipoIncremento: 'PORCENTAJE',
  valor: null,
  redondeo: 'CENTENA',
  fechaAplicacion: new Date(new Date().getFullYear(), 0, 1),
  descripcion: '',
});

/**
 * Incremento salarial: a quién (tipo de lista), cómo (porcentaje, valor, nuevo valor
 * o SMMLV) y desde cuándo. Calcular arma la vista previa (actual → nuevo); Aplicar
 * crea el historial salarial. Es una negociación: rige desde la fecha pactada hacia
 * adelante y no genera retroactivo de nóminas ya liquidadas.
 */
@Component({
  selector: 'app-form-incremento',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CalendarModule,
    ConfirmDialogModule,
    InputNumberModule,
    InputTextModule,
    MultiSelectModule,
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule,
    TerceroAutocompleteComponent,
    PuedeDirective,
    FechaEsPipe,
  ],
  providers: [ConfirmationService],
  templateUrl: './form-incremento.component.html',
  styleUrls: ['./form-incremento.component.scss'],
})
export class FormIncrementoComponent implements OnInit {
  incremento: IncrementoModel | null = null;
  detalle: IncrementoDetalleModel[] = [];
  form: FormIncremento = FORM_VACIO();
  cargando = true;
  /** Acción en curso (deshabilita los botones). */
  trabajando: string | null = null;

  vinculaciones: Opcion[] = [];
  grupos: Opcion[] = [];
  tiposVinculacion: Opcion[] = [];

  readonly opcionesTipoLista = OPCIONES_TIPO_LISTA;
  readonly opcionesTipo = OPCIONES_TIPO_INCREMENTO;
  readonly opcionesRedondeo = OPCIONES_REDONDEO;
  readonly severidad = severidadEstadoIncremento;

  constructor(
    private readonly service: NominaIncrementoService,
    private readonly vinculacionService: VinculacionService,
    private readonly catalogos: NominaCatalogoService,
    private readonly tipos: NominaTipoVinculacionService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    void this.cargarOpciones();
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) void this.cargar(id);
    else {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  get editable(): boolean {
    return !this.incremento || this.incremento.estado === 'PENDIENTE';
  }

  get opcionesIds(): Opcion[] {
    if (this.form.tipoLista === 'VINCULACION') return this.vinculaciones;
    if (this.form.tipoLista === 'GRUPO') return this.grupos;
    if (this.form.tipoLista === 'TIPO_VINCULACION') return this.tiposVinculacion;
    return [];
  }

  get conValor(): boolean {
    return this.form.tipoIncremento !== 'SMMLV';
  }

  get etiquetaValor(): string {
    if (this.form.tipoIncremento === 'PORCENTAJE') return 'Porcentaje (%)';
    if (this.form.tipoIncremento === 'VALOR_ADICIONAL') return 'Valor adicional';
    return 'Nuevo salario';
  }

  get totalDiferencia(): number {
    return this.detalle.reduce((s, d) => s + d.diferencia, 0);
  }

  textoEstado(): string {
    return this.incremento ? TEXTO_ESTADO_INCREMENTO[this.incremento.estado] : '';
  }

  onTipoLista(): void {
    this.form.ids = [];
    this.form.terceroId = null;
  }

  volver(): void {
    void this.router.navigate(['/nomina/incrementos']);
  }

  // ── Calcular (crear o recalcular la vista previa) ─────────────────────

  async calcular(): Promise<void> {
    const f = this.form;
    const ids = f.tipoLista === 'EMPLEADO' ? (f.terceroId ? [f.terceroId] : []) : f.tipoLista === 'TODOS' ? [] : f.ids;
    if (f.tipoLista !== 'TODOS' && !ids.length) {
      this.alert.showWarn('Incremento', 'Elija a quién aplica el incremento.');
      return;
    }
    if (this.conValor && !f.valor) {
      this.alert.showWarn('Incremento', 'Indique el valor del incremento.');
      return;
    }
    if (!f.fechaAplicacion) {
      this.alert.showWarn('Incremento', 'Indique desde cuándo rige.');
      return;
    }
    const dto = {
      tipoLista: f.tipoLista,
      ids,
      tipoIncremento: f.tipoIncremento,
      valor: this.conValor ? f.valor : null,
      redondeo: f.redondeo,
      fechaAplicacion: aFechaLocal(f.fechaAplicacion),
      descripcion: f.descripcion.trim() || null,
    };
    await this.ejecutar('calcular', async () => {
      const res = await lastValueFrom(
        this.incremento ? this.service.actualizar(this.incremento.id, dto) : this.service.crear(dto),
      );
      const nuevo = !this.incremento;
      this.incremento = res.data;
      await this.cargarDetalle();
      const sinCambio = res.data.sinCambio
        ? ` ${res.data.sinCambio} vinculación(es) no cambian de salario y quedaron fuera.`
        : '';
      this.alert.showSuccess('Incremento', `${res.data.empleados} empleado(s) en la vista previa.${sinCambio}`);
      if (nuevo) void this.router.navigate(['/nomina/incrementos', res.data.id], { replaceUrl: true });
    });
  }

  async quitar(d: IncrementoDetalleModel): Promise<void> {
    if (!this.incremento) return;
    await this.ejecutar('quitar', async () => {
      const res = await lastValueFrom(this.service.quitar(this.incremento!.id, d.id));
      this.incremento = res.data;
      await this.cargarDetalle();
    });
  }

  // ── Aplicar, reversar y anular ───────────────────────────────────────

  confirmarAplicar(): void {
    const i = this.incremento!;
    this.confirm.confirm({
      message: `Se cambiará el salario de <b>${i.empleados}</b> empleado(s) desde el <b>${i.fechaAplicacion}</b>. ¿Aplicar?`,
      header: 'Aplicar incremento',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sí, aplicar',
      rejectLabel: 'Cancelar',
      accept: () =>
        void this.ejecutar('aplicar', async () => {
          const res = await lastValueFrom(this.service.aplicar(i.id));
          this.incremento = res.data;
          await this.cargarDetalle();
          this.alert.showSuccess('Incremento', 'Aplicado. El nuevo salario rige desde la fecha pactada.');
        }),
    });
  }

  confirmarReversar(): void {
    this.confirm.confirm({
      message: 'Los salarios vuelven al valor anterior y se borra el cambio del historial. ¿Reversar?',
      header: 'Reversar incremento',
      icon: 'pi pi-undo',
      acceptLabel: 'Sí, reversar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () =>
        void this.ejecutar('reversar', async () => {
          const res = await lastValueFrom(this.service.reversar(this.incremento!.id));
          this.incremento = res.data;
          await this.cargarDetalle();
          this.alert.showSuccess('Incremento', 'Reversado; los salarios volvieron al valor anterior.');
        }),
    });
  }

  confirmarAnular(): void {
    this.confirm.confirm({
      message: '¿Anular el incremento? No se aplicó, así que ningún salario cambia.',
      header: 'Anular incremento',
      icon: 'pi pi-ban',
      acceptLabel: 'Sí, anular',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () =>
        void this.ejecutar('anular', async () => {
          const res = await lastValueFrom(this.service.anular(this.incremento!.id));
          this.incremento = res.data;
        }),
    });
  }


  // ── Apoyo ─────────────────────────────────────────────────────────────

  private async cargar(id: number): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.obtener(id));
      this.incremento = res.data;
      this.llenarForm(res.data);
      await this.cargarDetalle();
    } catch (err: any) {
      this.alert.showError('Incremento', err?.error?.message ?? 'No se pudo cargar.');
      this.volver();
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  private llenarForm(i: IncrementoModel): void {
    this.form = {
      tipoLista: i.tipoLista,
      terceroId: i.tipoLista === 'EMPLEADO' ? (i.ids[0] ?? null) : null,
      ids: i.tipoLista === 'EMPLEADO' ? [] : [...i.ids],
      tipoIncremento: i.tipoIncremento,
      valor: i.valor,
      redondeo: i.redondeo,
      fechaAplicacion: aDate(i.fechaAplicacion),
      descripcion: i.descripcion ?? '',
    };
  }

  private async cargarDetalle(): Promise<void> {
    if (!this.incremento) return;
    try {
      const res = await lastValueFrom(this.service.detalle(this.incremento.id));
      this.detalle = res?.data ?? [];
    } catch {
      this.detalle = [];
    }
    this.cdr.markForCheck();
  }

  /** Vinculaciones activas, grupos y tipos para el selector de la lista. */
  private async cargarOpciones(): Promise<void> {
    const [vinc, grupos, tipos] = await Promise.allSettled([
      lastValueFrom(
        this.vinculacionService.page(0, 1000, null, {
          estado: 'ACTIVO',
          tipoVinculacionId: null,
          cargoId: null,
          grupoNominaId: null,
        }),
      ),
      lastValueFrom(this.catalogos.activos('grupos-nomina')),
      lastValueFrom(this.tipos.activos()),
    ]);
    if (vinc.status === 'fulfilled')
      this.vinculaciones = (vinc.value?.data?.content ?? []).map((v) => ({
        label: `${v.empleadoDocumento} - ${v.empleadoNombre} (${v.codigo ?? 'sin código'})`,
        value: v.id,
      }));
    if (grupos.status === 'fulfilled')
      this.grupos = (grupos.value?.data ?? []).map((g) => ({ label: g.nombre, value: g.id }));
    if (tipos.status === 'fulfilled')
      this.tiposVinculacion = (tipos.value?.data ?? []).map((t) => ({ label: t.nombre, value: t.id }));
    this.cdr.markForCheck();
  }

  /** Corre una acción con su indicador y muestra el error del backend si falla. */
  private async ejecutar(accion: string, fn: () => Promise<void>): Promise<void> {
    this.trabajando = accion;
    this.cdr.markForCheck();
    try {
      await fn();
    } catch (err: any) {
      this.alert.showError('Incremento', err?.error?.message ?? 'No se pudo completar la acción.');
    } finally {
      this.trabajando = null;
      this.cdr.markForCheck();
    }
  }
}
