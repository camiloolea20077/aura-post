import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';

/** Formato básico de correo (el back valida con @Email). */
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Varios correos: se escribe el correo y se presiona Enter (o +) para
 * agregarlo; cada uno queda como etiqueta con su botón para quitarlo. Funciona
 * con `formControlName`: el valor es la lista de correos.
 */
@Component({
  selector: 'app-correos-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, InputTextModule],
  templateUrl: './correos-input.component.html',
  styleUrls: ['../lista-chips.scss'],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CorreosInputComponent), multi: true }],
})
export class CorreosInputComponent implements ControlValueAccessor {
  @Input() placeholder = 'Correo y Enter';

  correos: string[] = [];
  texto = '';
  error: string | null = null;
  disabled = false;

  private onChange: (v: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private readonly cdr: ChangeDetectorRef) {}

  writeValue(v: string[] | null): void {
    this.correos = v ? [...v] : [];
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (v: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(d: boolean): void {
    this.disabled = d;
    this.cdr.markForCheck();
  }

  /** Agrega el correo escrito si es válido y no está repetido. */
  agregar(evento?: Event): void {
    evento?.preventDefault();
    const correo = this.texto.trim().toLowerCase();
    if (!correo) return;
    if (!CORREO.test(correo)) {
      this.error = 'Correo no válido';
      return;
    }
    this.error = null;
    if (!this.correos.includes(correo)) {
      this.correos = [...this.correos, correo];
      this.onChange(this.correos);
    }
    this.texto = '';
    this.onTouched();
  }

  quitar(i: number): void {
    this.correos = this.correos.filter((_, j) => j !== i);
    this.onChange(this.correos);
    this.onTouched();
  }
}
