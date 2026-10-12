import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { TIPO_TELEFONO_OPTS, TipoTelefono } from '../../../core/models/tercero.model';

/** Teléfono tal como lo edita este control (sin la marca de contacto). */
export interface TelefonoItem {
  tipo: TipoTelefono;
  numero: string;
  extension: string | null;
}

/**
 * Varios teléfonos con tipo (celular, casa…) y extensión. Se escribe el número
 * y se presiona Enter (o +) para agregarlo; cada uno queda como etiqueta con su
 * botón para quitarlo. Funciona con `formControlName`: el valor es la lista.
 */
@Component({
  selector: 'app-telefonos-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, InputTextModule, SelectModule],
  templateUrl: './telefonos-input.component.html',
  styleUrls: ['../lista-chips.scss'],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TelefonosInputComponent), multi: true }],
})
export class TelefonosInputComponent implements ControlValueAccessor {
  @Input() placeholder = 'Número y Enter';

  readonly tipos = TIPO_TELEFONO_OPTS;
  telefonos: TelefonoItem[] = [];
  tipo: TipoTelefono = 'CELULAR';
  numero = '';
  extension = '';
  disabled = false;

  private onChange: (v: TelefonoItem[]) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private readonly cdr: ChangeDetectorRef) {}

  writeValue(v: TelefonoItem[] | null): void {
    this.telefonos = v ? [...v] : [];
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (v: TelefonoItem[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(d: boolean): void {
    this.disabled = d;
    this.cdr.markForCheck();
  }

  /** Agrega el número escrito (sin repetir el mismo número y extensión). */
  agregar(evento?: Event): void {
    evento?.preventDefault();
    const numero = this.numero.replace(/\s+/g, ' ').trim();
    if (!numero) return;
    const extension = this.extension.trim() || null;
    if (!this.telefonos.some((t) => t.numero === numero && t.extension === extension)) {
      this.telefonos = [...this.telefonos, { tipo: this.tipo, numero, extension }];
      this.onChange(this.telefonos);
    }
    this.numero = '';
    this.extension = '';
    this.onTouched();
  }

  quitar(i: number): void {
    this.telefonos = this.telefonos.filter((_, j) => j !== i);
    this.onChange(this.telefonos);
    this.onTouched();
  }

  etiquetaTipo(t: TipoTelefono): string {
    return this.tipos.find((o) => o.value === t)?.label ?? t;
  }
}
