import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

import { EmpresaOpcion } from '../../../core/models/auth.model';

/**
 * "¿Dónde vas a trabajar?" — el usuario de una firma contable elige entre su firma
 * y los clientes que atiende (docs/PLAN_FIRMA_CONTABLE.md, F6). Lo usan el login
 * y "Cambiar empresa" de la barra superior.
 */
@Component({
  selector: 'app-selector-empresa',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, InputTextModule],
  templateUrl: './selector-empresa.component.html',
  styleUrls: ['./selector-empresa.component.scss'],
})
export class SelectorEmpresaComponent {
  @Input() visible = false;
  @Input() empresas: EmpresaOpcion[] = [];
  /** Empresa en la que ya está (se marca y no se puede volver a elegir). */
  @Input() actualId: number | null = null;
  /** Id de la empresa que se está abriendo (muestra el giro). */
  @Input() cargandoId: number | null = null;
  /** En el login no se puede cerrar sin elegir: solo "Salir". */
  @Input() cerrable = true;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() elegir = new EventEmitter<EmpresaOpcion>();
  @Output() salir = new EventEmitter<void>();

  filtro = '';

  /** Con más de 8 empresas aparece el buscador. */
  get conBuscador(): boolean {
    return this.empresas.length > 8;
  }

  get propia(): EmpresaOpcion | undefined {
    return this.empresas.find((e) => e.propia);
  }

  get clientes(): EmpresaOpcion[] {
    const t = this.normalizar(this.filtro);
    return this.empresas
      .filter((e) => !e.propia)
      .filter((e) => !t
        || this.normalizar(e.razonSocial).includes(t)
        || this.normalizar(e.nombreComercial ?? '').includes(t)
        || (e.nit ?? '').includes(t));
  }

  iniciales(e: EmpresaOpcion): string {
    const p = (e.nombreComercial || e.razonSocial || '?').trim().split(/\s+/);
    return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase();
  }

  nit(e: EmpresaOpcion): string {
    return e.dv ? `${e.nit}-${e.dv}` : e.nit;
  }

  click(e: EmpresaOpcion): void {
    if (this.cargandoId != null || e.id === this.actualId) return;
    this.elegir.emit(e);
  }

  cerrar(): void {
    this.filtro = '';
    this.visibleChange.emit(false);
  }

  private normalizar(s: string): string {
    return (s || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
  }
}
