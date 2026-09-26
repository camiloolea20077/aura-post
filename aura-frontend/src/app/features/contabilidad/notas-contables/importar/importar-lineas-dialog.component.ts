import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';

import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../../shared/pipes/alert.service';
import {
  ImportarLineasResultado,
  NotaContableLineaModel,
} from '../models/nota-contable.model';
import { NotaContableService } from '../services/nota-contable.service';

export interface LineasImportadas {
  lineas: NotaContableLineaModel[];
  /** true = reemplazar las líneas de la nota; false = agregarlas al final. */
  reemplazar: boolean;
}

/**
 * Pegar líneas desde Excel. El backend interpreta el texto (cuentas por
 * código, terceros por documento, centros de costo por código) y explica cada
 * fila que no pudo usar; nada se guarda hasta que el contador guarda la nota.
 */
@Component({
  selector: 'app-importar-lineas-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonModule, DialogModule, TextareaModule],
  templateUrl: './importar-lineas-dialog.component.html',
  styleUrls: ['./importar-lineas-dialog.component.scss'],
})
export class ImportarLineasDialogComponent implements OnChanges {
  @Input() visible = false;
  /** La nota ya tiene líneas: se pregunta si reemplazarlas o agregar. */
  @Input() hayLineas = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() importadas = new EventEmitter<LineasImportadas>();

  texto = '';
  reemplazar = true;
  procesando = false;
  resultado: ImportarLineasResultado | null = null;

  constructor(
    private readonly service: NotaContableService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(): void {
    if (this.visible) {
      this.texto = '';
      this.resultado = null;
      this.reemplazar = !this.hayLineas;
    }
  }

  cerrar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onTextoCambia(): void {
    // Lo interpretado deja de corresponder a lo que hay en la caja.
    this.resultado = null;
    this.cdr.markForCheck();
  }

  async interpretar(): Promise<void> {
    if (!this.texto.trim()) return;
    this.procesando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.importarLineas(this.texto));
      this.resultado = res.data;
    } catch (e: any) {
      this.alert.showError('No se pudo leer lo pegado', e?.error?.message ?? 'Intente de nuevo');
    } finally {
      this.procesando = false;
      this.cdr.markForCheck();
    }
  }

  get totalDebito(): number {
    return (this.resultado?.lineas ?? []).reduce((s, l) => s + (+l.debito || 0), 0);
  }

  get totalCredito(): number {
    return (this.resultado?.lineas ?? []).reduce((s, l) => s + (+l.credito || 0), 0);
  }

  agregar(): void {
    if (!this.resultado?.lineas.length) return;
    this.importadas.emit({ lineas: this.resultado.lineas, reemplazar: this.reemplazar });
    this.cerrar();
  }

  formatCOP = (v: number): string =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
}
