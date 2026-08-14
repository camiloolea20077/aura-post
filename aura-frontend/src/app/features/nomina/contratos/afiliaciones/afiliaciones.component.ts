import {
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
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { lastValueFrom } from 'rxjs';

import { AfiliacionService } from '../../../../core/services/afiliacion.service';
import { ContratoService } from '../../../../core/services/contrato.service';
import {
  AfiliacionModel,
  EntidadSeguridadSocial,
  TIPOS_AFILIACION,
  TIPOS_COTIZANTE,
  TipoAfiliacion,
} from '../../../../core/models/afiliacion.model';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { aFechaLocal } from '../../../../shared/utils/fecha.util';

/**
 * Afiliaciones a seguridad social de un contrato (Fase 5.5).
 *
 * Se entra desde el listado de contratos. Muestra la afiliación vigente de cada
 * tipo (EPS/AFP/CCF/ARL) y permite afiliar o trasladar eligiendo del catálogo
 * nacional. La validación de PILA se muestra aquí, antes de liquidar.
 */
@Component({
  selector: 'app-afiliaciones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    DropdownModule,
    CalendarModule,
    TagModule,
    SkeletonModule,
    MessageModule,
  ],
  templateUrl: './afiliaciones.component.html',
  styleUrls: ['./afiliaciones.component.scss'],
})
export class AfiliacionesComponent implements OnChanges {
  @Input() visible = false;
  @Input() contratoId: number | null = null;
  @Input() contratoLabel = '';
  /** Inline: se muestra dentro de un tab (sin diálogo). */
  @Input() inline = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  readonly tipos = TIPOS_AFILIACION;
  readonly tiposCotizante = TIPOS_COTIZANTE;

  afiliaciones: AfiliacionModel[] = [];
  loading = false;

  // Tipo de cotizante (código UGPP), también requerido por PILA
  tipoCotizante: string | null = null;
  guardandoTipoCot = false;

  // Validación PILA
  problemas: string[] | null = null;
  validando = false;

  // Form de afiliar/trasladar (inline, por tipo)
  tipoEnEdicion: TipoAfiliacion | null = null;
  catalogo: EntidadSeguridadSocial[] = [];
  cargandoCatalogo = false;
  entidadId: number | null = null;
  desde: Date | null = null;
  guardando = false;

  constructor(
    private readonly service: AfiliacionService,
    private readonly contratoService: ContratoService,
    private readonly alert: AlertService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Diálogo: carga al hacerse visible. Inline: carga cuando llega el contrato.
    const abrioDialogo = changes['visible']?.currentValue && this.contratoId;
    const cambioContratoInline =
      this.inline && changes['contratoId']?.currentValue;
    if (abrioDialogo || cambioContratoInline) {
      this.cargar();
    }
    if (
      !this.inline &&
      changes['visible'] &&
      !changes['visible'].currentValue
    ) {
      this.reset();
    }
  }

  async cargar(): Promise<void> {
    this.loading = true;
    this.problemas = null;
    try {
      const res = await lastValueFrom(
        this.service.porContrato(this.contratoId!),
      );
      this.afiliaciones = res?.data ?? [];
      // Cargar el tipo de cotizante actual del contrato para mostrarlo.
      const det = await lastValueFrom(
        this.contratoService.obtener(this.contratoId!),
      );
      this.tipoCotizante = det?.data?.contrato?.tipoCotizante ?? null;
    } catch {
      this.alert.showError('Error', 'No se pudieron cargar las afiliaciones.');
    } finally {
      this.loading = false;
    }
  }

  /** La afiliación vigente de un tipo, si existe. */
  vigenteDe(tipo: TipoAfiliacion): AfiliacionModel | undefined {
    return this.afiliaciones.find((a) => a.tipo === tipo && a.vigente);
  }

  async abrirForm(tipo: TipoAfiliacion): Promise<void> {
    this.tipoEnEdicion = tipo;
    this.entidadId = null;
    this.desde = new Date();
    this.cargandoCatalogo = true;
    this.catalogo = [];
    try {
      const res = await lastValueFrom(this.service.catalogo(tipo));
      this.catalogo = res?.data ?? [];
    } catch {
      this.alert.showError(
        'Error',
        `No se pudo cargar el catálogo de ${tipo}.`,
      );
      this.tipoEnEdicion = null;
    } finally {
      this.cargandoCatalogo = false;
    }
  }

  cancelarForm(): void {
    this.tipoEnEdicion = null;
    this.entidadId = null;
    this.desde = null;
  }

  async guardar(): Promise<void> {
    if (!this.entidadId) {
      this.alert.showWarn(
        'Datos incompletos',
        'Elige una entidad del catálogo.',
      );
      return;
    }
    if (!this.desde) {
      this.alert.showWarn('Datos incompletos', 'Indica desde cuándo rige.');
      return;
    }
    this.guardando = true;
    try {
      const res = await lastValueFrom(
        this.service.afiliar(this.contratoId!, {
          entidadId: this.entidadId,
          tipo: this.tipoEnEdicion!,
          desde: aFechaLocal(this.desde)!,
        }),
      );
      this.afiliaciones = res?.data ?? this.afiliaciones;
      this.problemas = null;
      this.alert.showSuccess('Afiliación registrada', '');
      this.cancelarForm();
    } catch (err: any) {
      // 400 si el traslado no es posterior a la afiliación vigente; el mensaje
      // del backend lo explica.
      const msg = err?.error?.message ?? 'No se pudo registrar la afiliación.';
      this.alert.showError('Error', msg);
    } finally {
      this.guardando = false;
    }
  }

  async guardarTipoCotizante(): Promise<void> {
    if (!this.tipoCotizante) {
      this.alert.showWarn('Falta el tipo', 'Elige el tipo de cotizante.');
      return;
    }
    this.guardandoTipoCot = true;
    try {
      await lastValueFrom(
        this.service.cambiarTipoCotizante(this.contratoId!, {
          tipoCotizante: this.tipoCotizante,
        }),
      );
      this.alert.showSuccess('Tipo de cotizante guardado', '');
      this.problemas = null;
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudo guardar.',
      );
    } finally {
      this.guardandoTipoCot = false;
    }
  }

  async validar(): Promise<void> {
    this.validando = true;
    try {
      const res = await lastValueFrom(this.service.validar(this.contratoId!));
      this.problemas = res?.data ?? [];
    } catch {
      this.alert.showError('Error', 'No se pudo validar para PILA.');
    } finally {
      this.validando = false;
    }
  }

  onHide(): void {
    this.reset();
    this.visibleChange.emit(false);
  }

  private reset(): void {
    this.afiliaciones = [];
    this.problemas = null;
    this.cancelarForm();
  }
}
