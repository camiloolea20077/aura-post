import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  AccionEspecial,
  EspecialValor,
  NodoArbol,
} from '../../../core/models/permisos.model';

interface Grupo {
  titulo: string;
  acciones: AccionEspecial[];
}

/**
 * Acciones especiales de un perfil o de un usuario (V192, PLAN_PERMISOS P6).
 * Cada acción tiene tres valores: heredar (lo que dé la acción base del perfil
 * o el perfil del usuario), sí o no. Sin switches: botones de opción.
 */
@Component({
  selector: 'app-acciones-especiales',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './acciones-especiales.component.html',
  styleUrls: ['./acciones-especiales.component.scss'],
})
export class AccionesEspecialesComponent {
  @Input() catalogo: AccionEspecial[] = [];
  @Input() arbol: NodoArbol[] = [];
  @Input() valores: EspecialValor[] = [];
  /** Lo que tendría sin valor explícito, por id de acción. */
  @Input() base: Record<number, boolean> = {};
  /** Submódulos que ve (sin ver la pantalla no hay acción especial). */
  @Input() visibles: Set<number> = new Set();
  /** Texto de la opción heredar: "Hereda" en el perfil, "Lo del perfil" en el usuario. */
  @Input() etiquetaHeredar = 'Hereda';
  @Input() soloLectura = false;
  @Output() valoresChange = new EventEmitter<EspecialValor[]>();

  get grupos(): Grupo[] {
    const nombres = new Map<number, string>();
    for (const n of this.arbol) {
      nombres.set(n.submoduloId, `${n.moduloNombre} › ${n.nombre}`);
    }
    const grupos = new Map<number, Grupo>();
    for (const a of this.catalogo) {
      if (!grupos.has(a.submoduloId)) {
        grupos.set(a.submoduloId, {
          titulo: nombres.get(a.submoduloId) ?? a.clave,
          acciones: [],
        });
      }
      grupos.get(a.submoduloId)!.acciones.push(a);
    }
    return [...grupos.values()];
  }

  valor(a: AccionEspecial): boolean | null {
    return this.valores.find((v) => v.accionId === a.id)?.permitido ?? null;
  }

  /** Lo que queda: el valor explícito o lo heredado. */
  efectivo(a: AccionEspecial): boolean {
    if (!this.visibles.has(a.submoduloId)) return false;
    const v = this.valor(a);
    return v ?? !!this.base[a.id];
  }

  visible(a: AccionEspecial): boolean {
    return this.visibles.has(a.submoduloId);
  }

  textoHeredado(a: AccionEspecial): string {
    const base = this.base[a.id] ? 'sí' : 'no';
    if (this.etiquetaHeredar !== 'Hereda') return `${this.etiquetaHeredar} (${base})`;
    if (!a.heredaDe) return `Hereda (no)`;
    return `Igual que ${this.nombreAccion(a.heredaDe)} (${base})`;
  }

  set(a: AccionEspecial, permitido: boolean | null): void {
    if (this.soloLectura) return;
    const otros = this.valores.filter((v) => v.accionId !== a.id);
    this.valoresChange.emit(
      permitido === null ? otros : [...otros, { accionId: a.id, permitido }],
    );
  }

  private nombreAccion(a: string): string {
    return (
      { VER: 'ver', CREAR: 'crear', EDITAR: 'editar', ANULAR: 'anular' }[a] ??
      a.toLowerCase()
    );
  }
}
