import { Component, ElementRef, forwardRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { ConceptoService } from '../../../../core/services/concepto.service';
import {
  ConceptoModel,
  FUNCIONES_FORMULA,
  PruebaFormula,
  ValidacionFormula,
  VariableFormula,
} from '../../../../core/models/concepto.model';
import { ConceptoBuscadorComponent } from '../../../../shared/components/concepto-buscador/concepto-buscador.component';

/**
 * Editor de la fórmula de un concepto (F3 de docs/PLAN_CONCEPTOS_CARGOS_NOMINA.md
 * en el backend). Es un campo de formulario (`formControlName="formula"`).
 *
 * - Atajos para insertar variables, funciones y conceptos ([32]) donde está el cursor.
 * - Valida mientras se escribe (sintaxis, variables, funciones y conceptos que existan).
 * - "Probar": evalúa con valores de ejemplo editables y muestra el paso a paso.
 *
 * La fórmula la analiza y evalúa el backend con su propio intérprete; aquí no se
 * ejecuta nada.
 */
@Component({
  selector: 'app-editor-formula',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputNumberModule, TooltipModule, ConceptoBuscadorComponent],
  templateUrl: './editor-formula.component.html',
  styleUrls: ['./editor-formula.component.scss'],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => EditorFormulaComponent), multi: true }],
})
export class EditorFormulaComponent implements ControlValueAccessor, OnInit, OnDestroy {
  /** Número del concepto que se edita: la fórmula no puede usarse a sí misma. */
  @Input() numero: number | null = null;

  @ViewChild('area') area?: ElementRef<HTMLTextAreaElement>;

  texto = '';
  deshabilitado = false;
  variables: VariableFormula[] = [];
  readonly funciones = FUNCIONES_FORMULA;
  readonly operadores = ['+', '-', '*', '/', '%', '(', ')', ';', '<=', '>='];

  validacion: ValidacionFormula | null = null;
  validando = false;
  mostrarBuscador = false;

  mostrarPrueba = false;
  valoresVariables: Record<string, number | null> = {};
  valoresConceptos: Record<number, number | null> = {};
  prueba: PruebaFormula | null = null;
  probando = false;

  private pausa: ReturnType<typeof setTimeout> | null = null;
  private onChange: (v: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private readonly service: ConceptoService) {}

  async ngOnInit(): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.variablesFormula());
      this.variables = res.data ?? [];
    } catch {
      // Sin la lista de variables igual se puede escribir la fórmula.
    }
  }

  ngOnDestroy(): void {
    if (this.pausa) clearTimeout(this.pausa);
  }

  // ── ControlValueAccessor ───────────────────────────────────

  writeValue(v: string | null): void {
    this.texto = v ?? '';
    this.validarConPausa();
  }

  registerOnChange(fn: (v: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(d: boolean): void {
    this.deshabilitado = d;
  }

  // ── Edición ────────────────────────────────────────────────

  onInput(valor: string): void {
    this.texto = valor;
    this.onChange(valor || null);
    this.validarConPausa();
  }

  onBlur(): void {
    this.onTouched();
  }

  /** Inserta un texto donde está el cursor (o al final). */
  insertar(fragmento: string): void {
    if (this.deshabilitado) return;
    const el = this.area?.nativeElement;
    const inicio = el?.selectionStart ?? this.texto.length;
    const fin = el?.selectionEnd ?? this.texto.length;
    const antes = this.texto.slice(0, inicio);
    const separador = antes && !/[\s(;]$/.test(antes) ? ' ' : '';
    const nuevo = antes + separador + fragmento + this.texto.slice(fin);
    this.onInput(nuevo);
    const cursor = (antes + separador + fragmento).length;
    setTimeout(() => {
      el?.focus();
      el?.setSelectionRange(cursor, cursor);
    });
  }

  insertarConceptos(conceptos: ConceptoModel[]): void {
    this.insertar(conceptos.map((c) => `[${c.numero}]`).join(' + '));
  }

  // ── Validación ─────────────────────────────────────────────

  private validarConPausa(): void {
    if (this.pausa) clearTimeout(this.pausa);
    this.pausa = setTimeout(() => void this.validar(), 400);
  }

  private async validar(): Promise<void> {
    if (!this.texto.trim()) {
      this.validacion = null;
      return;
    }
    this.validando = true;
    try {
      const res = await lastValueFrom(this.service.validarFormula(this.texto, this.numero));
      this.validacion = res.data;
      this.prepararValoresPrueba();
    } catch {
      this.validacion = null;
    } finally {
      this.validando = false;
    }
  }

  /** Nombre de un concepto referenciado (según la última validación). */
  nombreConcepto(numero: number): string {
    return this.validacion?.conceptos.find((c) => c.numero === numero)?.nombre ?? '';
  }

  descripcionVariable(nombre: string): string {
    return this.variables.find((v) => v.nombre === nombre)?.descripcion ?? '';
  }

  // ── Prueba ─────────────────────────────────────────────────

  /** Valores de ejemplo para lo que usa la fórmula; conserva lo que el usuario ya cambió. */
  private prepararValoresPrueba(): void {
    if (!this.validacion) return;
    const vars: Record<string, number | null> = {};
    for (const v of this.validacion.variables) {
      vars[v] = v in this.valoresVariables
        ? this.valoresVariables[v]
        : (this.variables.find((x) => x.nombre === v)?.ejemplo ?? 0);
    }
    this.valoresVariables = vars;
    const conceptos: Record<number, number | null> = {};
    for (const c of this.validacion.conceptos) {
      conceptos[c.numero] = c.numero in this.valoresConceptos ? this.valoresConceptos[c.numero] : 0;
    }
    this.valoresConceptos = conceptos;
  }

  get variablesUsadas(): string[] {
    return this.validacion?.variables ?? [];
  }

  get conceptosUsados(): number[] {
    return this.validacion?.conceptos.map((c) => c.numero) ?? [];
  }

  async probar(): Promise<void> {
    this.probando = true;
    try {
      const res = await lastValueFrom(
        this.service.probarFormula({
          formula: this.texto,
          variables: this.valoresVariables,
          conceptos: this.valoresConceptos,
        }),
      );
      this.prueba = res.data;
    } catch (err: any) {
      this.prueba = { valor: null, error: err?.error?.message ?? 'No se pudo probar.', pasos: [] };
    } finally {
      this.probando = false;
    }
  }
}
