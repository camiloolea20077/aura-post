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
import { InputTextModule } from 'primeng/inputtext';

import { ModuloPermiso, SubmoduloPermiso } from '../../permisos-empresa/models/permiso.model';

interface Fila {
  sub: SubmoduloPermiso;
  nivel: 0 | 1;
  /** Pantallas que cubre: la propia, o las hijas si es un grupo. */
  hijos: number[];
}

interface Bloque {
  modulo: ModuloPermiso;
  filas: Fila[];
  /** Todos los submódulos del módulo (grupos incluidos). */
  todos: number[];
  /** Solo pantallas (para contar). */
  pantallas: number[];
}

type Estado = 'todo' | 'parcial' | 'nada';

/**
 * Árbol de módulos que tiene una empresa: módulo → submódulos → (grupo →
 * pantallas). Emite los ids de submódulo activos.
 *
 * Reglas: activar una pantalla de un grupo activa el grupo; apagar un grupo
 * apaga sus pantallas; un módulo se marca si tiene algo activo (lo resuelve
 * también el back al guardar).
 */
@Component({
  selector: 'app-arbol-modulos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, InputTextModule],
  templateUrl: './arbol-modulos.component.html',
  styleUrls: ['./arbol-modulos.component.scss'],
})
export class ArbolModulosComponent implements OnChanges {
  @Input() modulos: ModuloPermiso[] = [];
  @Input() soloLectura = false;
  @Output() seleccionChange = new EventEmitter<number[]>();

  bloques: Bloque[] = [];
  activos = new Set<number>();
  abiertos = new Set<number>();
  filtro = '';

  private padreDe = new Map<number, number>();
  private hijosDe = new Map<number, number[]>();

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngOnChanges(): void {
    this.padreDe.clear();
    this.hijosDe.clear();
    this.activos = new Set();
    for (const m of this.modulos ?? []) {
      for (const s of m.submodulos ?? []) {
        if (s.activo) this.activos.add(s.submoduloId);
        if (s.padreId != null) {
          this.padreDe.set(s.submoduloId, s.padreId);
          this.hijosDe.set(s.padreId, [...(this.hijosDe.get(s.padreId) ?? []), s.submoduloId]);
        }
      }
    }
    this.bloques = (this.modulos ?? []).map((m) => this.armarBloque(m));
  }

  private armarBloque(m: ModuloPermiso): Bloque {
    const subs = m.submodulos ?? [];
    const filas: Fila[] = [];
    for (const s of subs) {
      if (s.padreId != null) continue;
      const hijos = this.hijosDe.get(s.submoduloId) ?? [];
      filas.push({ sub: s, nivel: 0, hijos: hijos.length ? hijos : [s.submoduloId] });
      for (const h of subs.filter((x) => x.padreId === s.submoduloId)) {
        filas.push({ sub: h, nivel: 1, hijos: [h.submoduloId] });
      }
    }
    return {
      modulo: m,
      filas,
      todos: subs.map((s) => s.submoduloId),
      pantallas: subs.filter((s) => !(this.hijosDe.get(s.submoduloId)?.length)).map((s) => s.submoduloId),
    };
  }

  // ── Vista ───────────────────────────────────────────────
  get bloquesVisibles(): Bloque[] {
    const q = this.filtro.trim().toLowerCase();
    if (!q) return this.bloques;
    return this.bloques
      .map((b) =>
        b.modulo.moduloNombre.toLowerCase().includes(q)
          ? b
          : { ...b, filas: b.filas.filter((f) => f.sub.submoduloNombre.toLowerCase().includes(q)) },
      )
      .filter((b) => b.filas.length > 0);
  }

  abierto(b: Bloque): boolean {
    return !!this.filtro.trim() || this.abiertos.has(b.modulo.moduloId);
  }

  toggleAbierto(b: Bloque): void {
    const id = b.modulo.moduloId;
    if (this.abiertos.has(id)) this.abiertos.delete(id);
    else this.abiertos.add(id);
  }

  estado(ids: number[]): Estado {
    if (!ids.length) return 'nada';
    const n = ids.filter((id) => this.activos.has(id)).length;
    return n === 0 ? 'nada' : n === ids.length ? 'todo' : 'parcial';
  }

  estadoFila(f: Fila): Estado {
    return f.sub.esGrupo || f.hijos.length > 1 ? this.estado(f.hijos) : this.activos.has(f.sub.submoduloId) ? 'todo' : 'nada';
  }

  contar(b: Bloque): number {
    return b.pantallas.filter((id) => this.activos.has(id)).length;
  }

  get totalPantallas(): number {
    return this.bloques.reduce((a, b) => a + b.pantallas.length, 0);
  }

  get totalActivas(): number {
    return this.bloques.reduce((a, b) => a + this.contar(b), 0);
  }

  // ── Cambios ─────────────────────────────────────────────
  toggleModulo(b: Bloque, ev?: Event): void {
    ev?.stopPropagation();
    if (this.soloLectura) return;
    const encender = this.estado(b.pantallas.length ? b.pantallas : b.todos) !== 'todo';
    for (const id of b.todos) this.poner(id, encender);
    this.emitir();
  }

  toggleFila(f: Fila): void {
    if (this.soloLectura) return;
    const id = f.sub.submoduloId;
    if (f.sub.esGrupo || f.hijos.length > 1) {
      const encender = this.estado(f.hijos) !== 'todo';
      this.poner(id, encender);
      for (const h of f.hijos) this.poner(h, encender);
    } else {
      const encender = !this.activos.has(id);
      this.poner(id, encender);
      const padre = this.padreDe.get(id);
      if (padre != null) {
        // Una pantalla activa enciende su grupo; el grupo sin pantallas activas se apaga.
        if (encender) this.poner(padre, true);
        else if (!(this.hijosDe.get(padre) ?? []).some((h) => this.activos.has(h))) this.poner(padre, false);
      }
    }
    this.emitir();
  }

  todo(encender: boolean): void {
    if (this.soloLectura) return;
    for (const b of this.bloques) for (const id of b.todos) this.poner(id, encender);
    this.emitir();
  }

  private poner(id: number, v: boolean): void {
    if (v) this.activos.add(id);
    else this.activos.delete(id);
  }

  private emitir(): void {
    this.seleccionChange.emit([...this.activos]);
    this.cdr.markForCheck();
  }

  icono(e: Estado): string {
    return e === 'todo' ? 'pi pi-check' : e === 'parcial' ? 'pi pi-minus' : '';
  }

  trackBloque = (_: number, b: Bloque) => b.modulo.moduloId;
  trackFila = (_: number, f: Fila) => f.sub.submoduloId;
}
