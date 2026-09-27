import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';

import { lastValueFrom } from 'rxjs';

import { ContabilidadService } from '../../../../core/services/contabilidad.service';
import { CentroCostoService } from '../../../../core/services/centro-costo.service';
import { CentroCostoDto } from '../../../../core/models/centro-costo.model';
import { TerceroTableModel } from '../../../../core/models/tercero.model';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { TerceroAutocompleteComponent } from '../../../../shared/components/tercero-autocomplete/tercero-autocomplete.component';
import { FechaEsPipe } from '../../../../shared/pipes/fecha-es.pipe';
import { aDate, aFechaLocal } from '../../../../shared/utils/fecha.util';
import { AnularNotaDialogComponent } from '../anular/anular-nota-dialog.component';
import { ElegirPlantillaDialogComponent } from '../elegir-plantilla/elegir-plantilla-dialog.component';
import {
  ImportarLineasDialogComponent,
  LineasImportadas,
} from '../importar/importar-lineas-dialog.component';
import { PlantillaDialogComponent } from '../plantilla-dialog/plantilla-dialog.component';
import { ReversarNotaDialogComponent } from '../reversar/reversar-nota-dialog.component';
import {
  CLASIFICACIONES,
  clasificacionLabel,
  EstadoNota,
  NotaContableLineaModel,
  NotaContableModel,
  NotaContableSoporteModel,
  SaveNotaContableDto,
  SaveNotaContableLineaDto,
} from '../models/nota-contable.model';
import { NotaContableService } from '../services/nota-contable.service';

type Opcion = { label: string; value: number };

/**
 * "código - nombre" sin repetir el código: las líneas importadas ya lo traen
 * dentro del nombre y las de una plantilla lo traen aparte.
 */
function conCodigo(
  codigo: string | null,
  nombre: string | null,
  sep: string,
): string {
  const c = codigo ?? '';
  const n = nombre ?? '';
  if (!c) return n;
  return n.startsWith(c) ? n : `${c}${sep}${n}`;
}

/**
 * Nota contable (comprobante de diario CD). Un borrador se edita libremente
 * y se guarda aunque esté descuadrado; al contabilizar recibe su consecutivo
 * y queda de solo lectura. Las cuentas son solo auxiliares activas: una
 * cuenta de mayor no admite movimiento.
 */
@Component({
  selector: 'app-form-nota-contable',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CalendarModule,
    ConfirmDialogModule,
    DropdownModule,
    InputNumberModule,
    InputTextModule,
    TagModule,
    ToastModule,
    TooltipModule,
    RouterLink,
    AnularNotaDialogComponent,
    TerceroAutocompleteComponent,
    ElegirPlantillaDialogComponent,
    ImportarLineasDialogComponent,
    PlantillaDialogComponent,
    ReversarNotaDialogComponent,
    FechaEsPipe,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './form-nota-contable.component.html',
  styleUrls: ['./form-nota-contable.component.scss'],
})
export class FormNotaContableComponent implements OnInit {
  frm: FormGroup;
  nota: NotaContableModel | null = null;
  loading = false;
  saving = false;
  showAnular = false;
  showReversar = false;
  showImportar = false;
  showElegirPlantilla = false;
  showPlantilla = false;
  subiendoSoporte = false;

  readonly clasificacionOpts = CLASIFICACIONES;
  readonly clasificacionLabel = clasificacionLabel;
  /** Plantilla con la que se llenó una nota nueva (queda enlazada al guardar). */
  private plantillaOrigenId: number | null = null;
  /** Foto de las líneas al abrir "Guardar como plantilla". */
  lineasParaPlantilla: SaveNotaContableLineaDto[] | null = null;
  /**
   * La grilla se usa para armar una plantilla, no una nota: sin fecha, sin
   * contabilizar ni soportes; guardar crea (o reemplaza) la plantilla.
   */
  modoPlantilla = false;
  /** En modo plantilla: la plantilla cuyas líneas se están editando. */
  plantillaEditId: number | null = null;
  private readonly destroyRef = inject(DestroyRef);

  cuentaOpts: Opcion[] = [];

  centroCostoOpts: Opcion[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: NotaContableService,
    private readonly contabilidadService: ContabilidadService,
    private readonly ccService: CentroCostoService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.frm = this.fb.group({
      // Date en pantalla (p-calendar); al backend viaja como 'YYYY-MM-DD'.
      fecha: [new Date() as Date | null, Validators.required],
      descripcion: ['', [Validators.required, Validators.maxLength(500)]],
      clasificacion: [null],
      reversionAutomatica: [false],
      lineas: this.fb.array([this.nuevaLinea(), this.nuevaLinea()]),
    });
  }

  async ngOnInit(): Promise<void> {
    await this.cargarSelectores();
    // De una nota a su reversión la ruta es la misma (:id): Angular reutiliza
    // el componente y ngOnInit no vuelve a correr. Por eso se escucha el id.
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((pm) => {
        const id = Number(pm.get('id'));
        if (id) {
          this.cargar(id);
        } else {
          const qp = this.route.snapshot.queryParamMap;
          const plantilla = Number(qp.get('plantilla'));
          this.modoPlantilla = qp.get('modo') === 'plantilla';
          if (this.modoPlantilla) {
            // La plantilla no tiene fecha: la pone cada nota que sale de ella.
            this.frm.get('fecha')!.clearValidators();
            this.frm.get('fecha')!.updateValueAndValidity();
            this.plantillaEditId = plantilla || null;
          }
          if (plantilla) this.onPlantillaElegida(plantilla);
          this.cdr.markForCheck();
        }
      });
  }

  // ── Estado ───────────────────────────────────────────────────────
  get estado(): EstadoNota | null {
    return this.nota?.estado ?? null;
  }

  get editable(): boolean {
    return !this.nota || this.nota.estado === 'BORRADOR';
  }

  get puedeReversar(): boolean {
    return (
      this.nota?.estado === 'CONTABILIZADO' &&
      !this.nota.revertidoPorId &&
      !this.nota.reversaDeId
    );
  }

  get reversionAutomatica(): boolean {
    return !!this.frm.get('reversionAutomatica')!.value;
  }

  setReversionAutomatica(v: boolean): void {
    if (!this.editable) return;
    this.frm.patchValue({ reversionAutomatica: v });
    this.frm.markAsDirty();
    this.cdr.markForCheck();
  }

  get titulo(): string {
    if (this.modoPlantilla) return this.plantillaEditId ? 'Líneas de la plantilla' : 'Nueva plantilla';
    if (!this.nota) return 'Nueva nota contable';
    if (this.nota.estado === 'BORRADOR') return 'Borrador de nota contable';
    return 'Nota ' + this.nota.numeroComprobante;
  }

  estadoLabel(e: EstadoNota): string {
    return e === 'BORRADOR'
      ? 'Borrador'
      : e === 'CONTABILIZADO'
        ? 'Contabilizada'
        : 'Anulada';
  }

  estadoSeverity(e: EstadoNota): 'warn' | 'success' | 'secondary' {
    return e === 'BORRADOR'
      ? 'warn'
      : e === 'CONTABILIZADO'
        ? 'success'
        : 'secondary';
  }

  // ── Líneas ───────────────────────────────────────────────────────
  get lineas(): FormArray {
    return this.frm.get('lineas') as FormArray;
  }

  private nuevaLinea(
    v: Partial<SaveNotaContableLineaDto> & { terceroLabel?: string } = {},
  ): FormGroup {
    return this.fb.group({
      cuentaId: [v.cuentaId ?? null],
      descripcion: [v.descripcion ?? null],
      debito: [v.debito ?? 0],
      credito: [v.credito ?? 0],
      terceroId: [v.terceroId ?? null],
      // Solo pantalla: el tercero sale del buscador paginado, no de una lista
      // precargada, así que su texto se guarda aparte y no viaja al backend.
      terceroLabel: [v.terceroLabel ?? ''],
      centroCostoId: [v.centroCostoId ?? null],
      // Sin columna en pantalla, pero se conservan si la nota ya los traía.
      proyectoId: [v.proyectoId ?? null],
      frenteId: [v.frenteId ?? null],
    });
  }

  /**
   * La línea nueva llega con la diferencia al lado contrario: casi siempre
   * es la contrapartida que falta, y el contador solo elige la cuenta.
   */
  agregarLinea(): void {
    const dif = this.diferencia;
    this.lineas.push(
      this.nuevaLinea({
        debito: dif < 0 ? Math.abs(dif) : 0,
        credito: dif > 0 ? dif : 0,
      }),
    );
    this.cdr.markForCheck();
  }

  duplicarLinea(i: number): void {
    const v = this.lineas.at(i).value;
    this.lineas.insert(i + 1, this.nuevaLinea({ ...v }));
    this.cdr.markForCheck();
  }

  quitarLinea(i: number): void {
    if (this.lineas.length <= 1) return;
    this.lineas.removeAt(i);
    this.cdr.markForCheck();
  }

  /** Una línea va al débito o al crédito, no a los dos. */
  onMonto(
    i: number,
    lado: 'debito' | 'credito',
    valor: number | string | null,
  ): void {
    if ((+(valor ?? 0) || 0) > 0) {
      const otro = lado === 'debito' ? 'credito' : 'debito';
      this.lineas.at(i).get(otro)!.setValue(0, { emitEvent: false });
    }
    this.cdr.markForCheck();
  }

  // ── Tercero por línea ────────────────────────────────────────────
  /** El id lo pone el propio control; aquí solo se guarda el texto a mostrar. */
  onTerceroLinea(i: number, t: TerceroTableModel | null): void {
    this.lineas.at(i).patchValue({
      terceroLabel: t ? `${t.numeroDocumento} — ${t.nombreCompleto}` : '',
    });
    this.lineas.at(i).markAsDirty();
    this.cdr.markForCheck();
  }

  // ── Cuadre ───────────────────────────────────────────────────────
  get totalDebito(): number {
    return this.lineas.controls.reduce(
      (s, c) => s + (+c.get('debito')!.value || 0),
      0,
    );
  }

  get totalCredito(): number {
    return this.lineas.controls.reduce(
      (s, c) => s + (+c.get('credito')!.value || 0),
      0,
    );
  }

  get diferencia(): number {
    return Math.round((this.totalDebito - this.totalCredito) * 100) / 100;
  }

  get cuadrado(): boolean {
    return Math.abs(this.diferencia) < 0.01 && this.totalDebito > 0;
  }

  // ── Cargas ───────────────────────────────────────────────────────
  private async cargarSelectores(): Promise<void> {
    const [planRes, ccRes] = await Promise.all([
      lastValueFrom(this.contabilidadService.listarPlan()).catch(() => null),
      lastValueFrom(this.ccService.list()).catch(() => null),
    ]);
    this.cuentaOpts = (planRes?.data ?? [])
      .filter((c) => c.auxiliar && c.activa)
      .map((c) => ({ label: `${c.codigo} - ${c.nombre}`, value: c.id }));
    this.centroCostoOpts = (ccRes?.data ?? []).map((cc: CentroCostoDto) => ({
      label: `${cc.codigo} — ${cc.nombre}`,
      value: cc.id,
    }));
    this.cdr.markForCheck();
  }

  private async cargar(id: number): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.getById(id));
      this.aplicarNota(res.data);
    } catch (e: any) {
      this.alert.showError(
        'No se pudo cargar la nota',
        e?.error?.message ?? '',
      );
      this.router.navigate(['/contabilidad/notas']);
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  private aplicarNota(n: NotaContableModel): void {
    this.nota = n;
    // Una nota vieja puede usar una cuenta hoy inactiva: se agrega para que la
    // línea no se vea vacía.
    for (const l of n.lineas) {
      this.asegurarOpcion(
        this.cuentaOpts,
        l.cuentaId,
        `${l.cuentaCodigo} - ${l.cuentaNombre}`,
      );
      if (l.centroCostoId) {
        this.asegurarOpcion(
          this.centroCostoOpts,
          l.centroCostoId,
          l.centroCostoNombre ?? '',
        );
      }
    }
    this.lineas.clear();
    n.lineas.forEach((l) =>
      this.lineas.push(
        this.nuevaLinea({
          ...l,
          terceroLabel: l.terceroId
            ? `${l.terceroDocumento ?? ''} — ${l.terceroNombre ?? ''}`
            : '',
        }),
      ),
    );
    if (this.lineas.length === 0) this.lineas.push(this.nuevaLinea());
    this.frm.patchValue({
      fecha: aDate(n.fecha),
      descripcion: n.descripcion,
      clasificacion: n.clasificacion,
      reversionAutomatica: !!n.reversionAutomatica,
    });
    this.frm.markAsPristine();

    if (this.editable) this.frm.enable();
    else this.frm.disable();
    this.cdr.markForCheck();
  }

  private asegurarOpcion(opts: Opcion[], value: number, label: string): void {
    if (!opts.some((o) => o.value === value)) opts.push({ label, value });
  }

  // ── Acciones ─────────────────────────────────────────────────────
  guardarBorrador(): void {
    if (this.modoPlantilla) {
      this.abrirGuardarPlantilla();
      return;
    }
    this.guardar(false);
  }

  onPlantillaGuardada(): void {
    // Armada la plantilla desde su pantalla, se vuelve al listado.
    if (this.modoPlantilla) this.router.navigate(['/contabilidad/notas/plantillas']);
  }

  guardarYContabilizar(): void {
    this.confirm.confirm({
      header: 'Contabilizar nota',
      message:
        'La nota recibe su consecutivo CD y queda en los libros. Después ya no se podrá editar, solo anular. ¿Continuar?',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sí, contabilizar',
      rejectLabel: 'Cancelar',
      accept: () => this.guardar(true),
    });
  }

  private async guardar(contabilizar: boolean): Promise<void> {
    if (this.frm.invalid) {
      this.frm.markAllAsTouched();
      this.alert.showWarn(
        'Faltan datos',
        'La fecha y el concepto son obligatorios.',
      );
      return;
    }
    const dto = this.construirDto(contabilizar);
    if (!dto) return;

    this.saving = true;
    this.cdr.markForCheck();
    try {
      const res = this.nota
        ? await lastValueFrom(this.service.update(this.nota.id, dto))
        : await lastValueFrom(this.service.create(dto));
      this.alert.showSuccess(
        contabilizar ? 'Nota contabilizada' : 'Borrador guardado',
        res?.message ?? '',
      );
      const nueva = !this.nota;
      this.aplicarNota(res.data);
      // La URL pasa a la de la nota: guardar otra vez edita en vez de duplicar.
      if (nueva) {
        this.router.navigate(['/contabilidad/notas', res.data.id], {
          replaceUrl: true,
        });
      }
    } catch (e: any) {
      this.alert.showError(
        contabilizar ? 'No se pudo contabilizar' : 'No se pudo guardar',
        e?.error?.message ?? 'Intente de nuevo',
      );
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Las líneas en blanco (sin cuenta y sin valor) se descartan; una línea con
   * valor pero sin cuenta es un error de digitación y se avisa.
   */
  private construirDto(contabilizar: boolean): SaveNotaContableDto | null {
    const v = this.frm.getRawValue();
    const lineas: SaveNotaContableLineaDto[] = [];
    for (let i = 0; i < v.lineas.length; i++) {
      const l = v.lineas[i];
      const debito = +l.debito || 0;
      const credito = +l.credito || 0;
      if (!l.cuentaId && debito === 0 && credito === 0) continue;
      if (!l.cuentaId) {
        this.alert.showWarn(
          'Línea sin cuenta',
          `La línea ${i + 1} tiene valor pero no tiene cuenta.`,
        );
        return null;
      }
      lineas.push({
        cuentaId: l.cuentaId,
        descripcion: l.descripcion?.trim() || null,
        debito,
        credito,
        terceroId: l.terceroId ?? null,
        centroCostoId: l.centroCostoId ?? null,
        proyectoId: l.proyectoId ?? null,
        frenteId: l.frenteId ?? null,
      });
    }
    if (lineas.length === 0) {
      this.alert.showWarn(
        'Sin movimientos',
        'Agregue al menos una línea con cuenta.',
      );
      return null;
    }
    return {
      fecha: aFechaLocal(v.fecha),
      descripcion: v.descripcion.trim(),
      lineas,
      contabilizar,
      clasificacion: v.clasificacion ?? null,
      reversionAutomatica: !!v.reversionAutomatica,
      plantillaId: this.nota ? null : this.plantillaOrigenId,
    };
  }

  /** Líneas con cuenta, listas para guardar como plantilla (sin avisos). */
  private lineasValidas(): SaveNotaContableLineaDto[] {
    return this.frm
      .getRawValue()
      .lineas.filter((l: any) => l.cuentaId)
      .map((l: any) => ({
        cuentaId: l.cuentaId,
        descripcion: l.descripcion?.trim() || null,
        debito: +l.debito || 0,
        credito: +l.credito || 0,
        terceroId: l.terceroId ?? null,
        centroCostoId: l.centroCostoId ?? null,
        proyectoId: l.proyectoId ?? null,
        frenteId: l.frenteId ?? null,
      }));
  }

  /** Hay algo digitado en las líneas (para no pisarlo sin preguntar). */
  private get hayLineasConDatos(): boolean {
    return this.lineas.controls.some((c) => {
      const v = c.value;
      return v.cuentaId || +v.debito > 0 || +v.credito > 0;
    });
  }

  get hayLineas(): boolean {
    return this.hayLineasConDatos;
  }

  private cargarLineas(
    lineas: NotaContableLineaModel[],
    reemplazar: boolean,
  ): void {
    for (const l of lineas) {
      this.asegurarOpcion(
        this.cuentaOpts,
        l.cuentaId,
        conCodigo(l.cuentaCodigo, l.cuentaNombre, ' - '),
      );
      if (l.centroCostoId) {
        this.asegurarOpcion(
          this.centroCostoOpts,
          l.centroCostoId,
          l.centroCostoNombre ?? '',
        );
      }
    }
    if (reemplazar) this.lineas.clear();
    else {
      // Las líneas vacías del final sobran si llegan líneas nuevas.
      for (let i = this.lineas.length - 1; i >= 0; i--) {
        const v = this.lineas.at(i).value;
        if (!v.cuentaId && !(+v.debito > 0) && !(+v.credito > 0))
          this.lineas.removeAt(i);
      }
    }
    lineas.forEach((l) =>
      this.lineas.push(
        this.nuevaLinea({
          ...l,
          terceroLabel: l.terceroId
            ? conCodigo(l.terceroDocumento, l.terceroNombre, ' — ')
            : '',
        }),
      ),
    );
    if (this.lineas.length === 0) this.lineas.push(this.nuevaLinea());
    this.frm.markAsDirty();
    this.cdr.markForCheck();
  }

  // ── Pegar desde Excel ────────────────────────────────────────────
  onLineasImportadas(ev: LineasImportadas): void {
    this.cargarLineas(ev.lineas, ev.reemplazar);
    this.alert.showSuccess(
      'Líneas agregadas',
      `${ev.lineas.length} ${ev.lineas.length === 1 ? 'línea' : 'líneas'} desde Excel. Revise y guarde la nota.`,
    );
  }

  // ── Plantillas ───────────────────────────────────────────────────
  async onPlantillaElegida(id: number): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.plantilla(id));
      const p = res.data;
      const aplicar = () => {
        this.plantillaOrigenId = p.id;
        this.frm.patchValue({
          descripcion: p.descripcion,
          clasificacion: p.clasificacion,
        });
        this.cargarLineas(p.lineas ?? [], true);
      };
      if (this.hayLineasConDatos) {
        this.confirm.confirm({
          header: 'Usar plantilla',
          message: `La nota ya tiene líneas. ¿Reemplazarlas por las de "${p.nombre}"?`,
          icon: 'pi pi-copy',
          acceptLabel: 'Sí, reemplazar',
          rejectLabel: 'Cancelar',
          accept: aplicar,
        });
      } else {
        aplicar();
      }
    } catch (e: any) {
      this.alert.showError(
        'No se pudo cargar la plantilla',
        e?.error?.message ?? '',
      );
    }
  }

  abrirGuardarPlantilla(): void {
    if (this.modoPlantilla && !this.frm.get('descripcion')!.value?.trim()) {
      this.frm.get('descripcion')!.markAsTouched();
      this.alert.showWarn('Falta el concepto', 'Escriba el concepto con el que nacen las notas de la plantilla.');
      return;
    }
    const lineas = this.lineasValidas();
    if (lineas.length === 0) {
      this.alert.showWarn(
        'Sin líneas',
        'La plantilla necesita al menos una línea con cuenta.',
      );
      return;
    }
    this.lineasParaPlantilla = lineas;
    this.showPlantilla = true;
    this.cdr.markForCheck();
  }

  // ── Reversión ────────────────────────────────────────────────────
  onReversada(rev: NotaContableModel): void {
    this.router.navigate(['/contabilidad/notas', rev.id]);
  }

  // ── PDF ──────────────────────────────────────────────────────────
  async verPdf(): Promise<void> {
    if (!this.nota) return;
    try {
      const blob = await lastValueFrom(this.service.pdf(this.nota.id));
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      this.alert.showError('No se pudo generar el PDF', 'Intente de nuevo');
    }
  }

  // ── Soportes ─────────────────────────────────────────────────────
  async onSoporteSeleccionado(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.nota) return;
    if (file.size > 10 * 1024 * 1024) {
      this.alert.showWarn(
        'Archivo muy grande',
        'El soporte no puede superar 10 MB.',
      );
      return;
    }
    this.subiendoSoporte = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.subirSoporte(this.nota.id, file),
      );
      this.nota = {
        ...this.nota,
        soportes: [...(this.nota.soportes ?? []), res.data],
      };
      this.alert.showSuccess('Soporte adjuntado', file.name);
    } catch (e: any) {
      this.alert.showError(
        'No se pudo adjuntar',
        e?.error?.message ?? 'Intente de nuevo',
      );
    } finally {
      this.subiendoSoporte = false;
      this.cdr.markForCheck();
    }
  }

  eliminarSoporte(s: NotaContableSoporteModel): void {
    if (!this.nota) return;
    const id = this.nota.id;
    this.confirm.confirm({
      header: 'Quitar soporte',
      message: `¿Quitar "${s.nombreArchivo}" de la nota?`,
      icon: 'pi pi-paperclip',
      acceptLabel: 'Sí, quitar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await lastValueFrom(this.service.eliminarSoporte(id, s.id));
          if (this.nota) {
            this.nota = {
              ...this.nota,
              soportes: this.nota.soportes.filter((x) => x.id !== s.id),
            };
          }
          this.cdr.markForCheck();
        } catch (e: any) {
          this.alert.showError(
            'No se pudo quitar',
            e?.error?.message ?? 'Intente de nuevo',
          );
        }
      },
    });
  }

  iconoSoporte(s: NotaContableSoporteModel): string {
    const t = s.contentType ?? '';
    if (t === 'application/pdf') return 'pi pi-file-pdf';
    if (t.startsWith('image/')) return 'pi pi-image';
    if (t.includes('sheet') || t.includes('excel') || t === 'text/csv')
      return 'pi pi-file-excel';
    if (t.includes('word')) return 'pi pi-file-word';
    return 'pi pi-file';
  }

  tamano(bytes: number | null): string {
    if (!bytes) return '';
    return bytes < 1024 * 1024
      ? `${Math.max(1, Math.round(bytes / 1024))} KB`
      : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  contabilizarExistente(): void {
    if (!this.nota) return;
    if (this.frm.dirty) {
      // Lo que está en pantalla es lo que se aprueba: se guarda junto.
      this.guardarYContabilizar();
      return;
    }
    const id = this.nota.id;
    this.confirm.confirm({
      header: 'Contabilizar nota',
      message:
        'La nota recibe su consecutivo CD y queda en los libros. Después ya no se podrá editar, solo anular. ¿Continuar?',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sí, contabilizar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        try {
          const res = await lastValueFrom(this.service.contabilizar(id));
          this.alert.showSuccess('Nota contabilizada', res?.message ?? '');
          this.aplicarNota(res.data);
        } catch (e: any) {
          this.alert.showError(
            'No se pudo contabilizar',
            e?.error?.message ?? 'Intente de nuevo',
          );
        }
      },
    });
  }

  eliminar(): void {
    if (!this.nota) return;
    const id = this.nota.id;
    this.confirm.confirm({
      header: 'Eliminar borrador',
      message:
        '¿Eliminar este borrador? No afecta la contabilidad ni la numeración.',
      icon: 'pi pi-trash',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await lastValueFrom(this.service.eliminar(id));
          this.alert.showSuccess('Borrador eliminado', '');
          this.router.navigate(['/contabilidad/notas']);
        } catch (e: any) {
          this.alert.showError(
            'No se pudo eliminar',
            e?.error?.message ?? 'Intente de nuevo',
          );
        }
      },
    });
  }

  async onAnulada(): Promise<void> {
    if (this.nota) await this.cargar(this.nota.id);
  }

  volver(): void {
    this.router.navigate([this.modoPlantilla ? '/contabilidad/notas/plantillas' : '/contabilidad/notas']);
  }

  formatCOP = (v: number): string =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
}
