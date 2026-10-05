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
import { TooltipModule } from 'primeng/tooltip';

import {
  NodoArbol,
  Permiso,
  PermisoExcepcion,
} from '../../../core/models/permisos.model';

type Accion = 'ver' | 'crear' | 'editar' | 'anular';
const ACC: Accion[] = ['ver', 'crear', 'editar', 'anular'];

interface Fila {
  nodo: NodoArbol;
  nivel: 0 | 1;
  /** Ids de las pantallas que cubre (la propia o las hijas de un grupo). */
  ids: number[];
}

interface Modulo {
  codigo: string;
  nombre: string;
  filas: Fila[];
  ids: number[];
}

/**
 * Matriz de permisos: módulos → submódulos (y grupos del tercer nivel) por
 * Ver / Crear / Editar / Anular.
 *
 *   modo="perfil":       cada celda es sí/no (`valores`).
 *   modo="excepciones":  cada celda pasa por hereda → sí → no sobre lo que da el
 *                        perfil (`heredado`), y emite solo las diferencias.
 *
 * Reglas al marcar: crear, editar o anular encienden ver; apagar ver apaga todo.
 */
@Component({
  selector: 'app-matriz-permisos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, InputTextModule, TooltipModule],
  templateUrl: './matriz-permisos.component.html',
  styleUrls: ['./matriz-permisos.component.scss'],
})
export class MatrizPermisosComponent implements OnChanges {
  @Input() arbol: NodoArbol[] = [];
  @Input() modo: 'perfil' | 'excepciones' = 'perfil';
  @Input() soloLectura = false;

  /** Modo perfil: lo marcado. */
  @Input() valores: Permiso[] = [];
  /** Modo excepciones: lo que da el perfil (si `heredaTodo`, da todo). */
  @Input() heredado: Permiso[] = [];
  @Input() heredaTodo = false;
  /** Modo excepciones: los ajustes del usuario. */
  @Input() excepciones: PermisoExcepcion[] = [];

  @Output() valoresChange = new EventEmitter<Permiso[]>();
  @Output() excepcionesChange = new EventEmitter<PermisoExcepcion[]>();

  readonly acciones = ACC;
  readonly titulos: Record<Accion, string> = {
    ver: 'Ver',
    crear: 'Crear',
    editar: 'Editar',
    anular: 'Anular',
  };

  modulos: Modulo[] = [];
  cerrados = new Set<string>();
  filtro = '';

  private val = new Map<number, Permiso>();
  private her = new Map<number, Permiso>();
  private exc = new Map<number, PermisoExcepcion>();

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngOnChanges(): void {
    this.armarModulos();
    this.val = new Map(
      (this.valores ?? []).map((p) => [p.submoduloId, { ...p }]),
    );
    this.her = new Map(
      (this.heredado ?? []).map((p) => [p.submoduloId, { ...p }]),
    );
    this.exc = new Map(
      (this.excepciones ?? []).map((p) => [p.submoduloId, { ...p }]),
    );
  }

  // ── Estructura ────────────────────────────────────────────
  private armarModulos(): void {
    const porModulo = new Map<string, Modulo>();
    const hijosDe = new Map<number, NodoArbol[]>();
    for (const n of this.arbol) {
      if (n.padreId != null) {
        const l = hijosDe.get(n.padreId) ?? [];
        l.push(n);
        hijosDe.set(n.padreId, l);
      }
    }
    for (const n of this.arbol) {
      if (n.padreId != null) continue; // se agregan debajo de su grupo
      let m = porModulo.get(n.moduloCodigo);
      if (!m) {
        m = {
          codigo: n.moduloCodigo,
          nombre: n.moduloNombre,
          filas: [],
          ids: [],
        };
        porModulo.set(n.moduloCodigo, m);
      }
      const hijos = hijosDe.get(n.submoduloId) ?? [];
      if (n.esGrupo && hijos.length) {
        m.filas.push({
          nodo: n,
          nivel: 0,
          ids: hijos.map((h) => h.submoduloId),
        });
        for (const h of hijos)
          m.filas.push({ nodo: h, nivel: 1, ids: [h.submoduloId] });
        m.ids.push(...hijos.map((h) => h.submoduloId));
      } else {
        m.filas.push({ nodo: n, nivel: 0, ids: [n.submoduloId] });
        m.ids.push(n.submoduloId);
      }
    }
    this.modulos = [...porModulo.values()];
  }

  get modulosVisibles(): Modulo[] {
    const q = this.filtro.trim().toLowerCase();
    if (!q) return this.modulos;
    return this.modulos
      .map((m) =>
        m.nombre.toLowerCase().includes(q)
          ? m
          : {
              ...m,
              filas: m.filas.filter((f) =>
                f.nodo.nombre.toLowerCase().includes(q),
              ),
            },
      )
      .filter((m) => m.filas.length > 0);
  }

  toggleModulo(m: Modulo): void {
    if (this.cerrados.has(m.codigo)) this.cerrados.delete(m.codigo);
    else this.cerrados.add(m.codigo);
  }

  expandirTodo(abrir: boolean): void {
    this.cerrados = abrir
      ? new Set()
      : new Set(this.modulos.map((m) => m.codigo));
  }

  // ── Valores efectivos ─────────────────────────────────────
  /** Lo que queda vigente en una pantalla para la acción. */
  efectivo(id: number, a: Accion): boolean {
    if (this.modo === 'perfil') return !!this.val.get(id)?.[a];
    const e = this.exc.get(id)?.[a];
    return e != null ? e : this.heredadoDe(id, a);
  }

  heredadoDe(id: number, a: Accion): boolean {
    return this.heredaTodo || !!this.her.get(id)?.[a];
  }

  /** Excepción de la celda: null hereda, true da, false quita. */
  ajuste(id: number, a: Accion): boolean | null {
    const v = this.exc.get(id)?.[a];
    return v === undefined ? null : v;
  }

  /** Estado de un grupo de pantallas: todas, ninguna o algunas. */
  estadoGrupo(ids: number[], a: Accion): 'todo' | 'nada' | 'parcial' {
    const n = ids.filter((id) => this.efectivo(id, a)).length;
    return n === 0 ? 'nada' : n === ids.length ? 'todo' : 'parcial';
  }

  contarModulo(m: Modulo): number {
    return m.ids.filter((id) => this.efectivo(id, 'ver')).length;
  }

  // ── Cambios ───────────────────────────────────────────────
  clicCelda(fila: Fila, a: Accion): void {
    if (this.soloLectura) return;
    if (fila.ids.length > 1 || fila.nodo.esGrupo) {
      this.aplicarGrupo(fila.ids, a);
    } else if (this.modo === 'perfil') {
      this.marcarPerfil(
        fila.nodo.submoduloId,
        a,
        !this.efectivo(fila.nodo.submoduloId, a),
      );
    } else {
      this.ciclarExcepcion(fila.nodo.submoduloId, a);
    }
    this.emitir();
  }

  clicModulo(m: Modulo, a: Accion, ev: Event): void {
    ev.stopPropagation();
    if (this.soloLectura) return;
    this.aplicarGrupo(m.ids, a);
    this.emitir();
  }

  /** En un grupo: si alguna está apagada, enciende todas; si todas están, las apaga. */
  private aplicarGrupo(ids: number[], a: Accion): void {
    const encender = this.estadoGrupo(ids, a) !== 'todo';
    for (const id of ids) {
      if (this.modo === 'perfil') {
        this.marcarPerfil(id, a, encender);
      } else {
        this.forzarExcepcion(id, a, encender);
      }
    }
  }

  private marcarPerfil(id: number, a: Accion, valor: boolean): void {
    const p = this.val.get(id) ?? {
      submoduloId: id,
      ver: false,
      crear: false,
      editar: false,
      anular: false,
    };
    p[a] = valor;
    if (valor && a !== 'ver') p.ver = true;
    if (!valor && a === 'ver') p.crear = p.editar = p.anular = false;
    this.val.set(id, p);
  }

  /**
   * Alterna entre heredar del perfil y lo contrario del perfil: si el perfil lo
   * da, se le quita a este usuario; si no lo da, se le da. Forzar el mismo valor
   * que ya da el perfil no tiene sentido.
   */
  private ciclarExcepcion(id: number, a: Accion): void {
    const siguiente = this.ajuste(id, a) === null ? !this.heredadoDe(id, a) : null;
    this.ponerExcepcion(id, a, siguiente);
  }

  /** Deja la celda en el valor pedido: si el perfil ya lo da, hereda. */
  private forzarExcepcion(id: number, a: Accion, valor: boolean): void {
    this.ponerExcepcion(id, a, this.heredadoDe(id, a) === valor ? null : valor);
  }

  private ponerExcepcion(id: number, a: Accion, v: boolean | null): void {
    const e = this.exc.get(id) ?? {
      submoduloId: id,
      ver: null,
      crear: null,
      editar: null,
      anular: null,
    };
    e[a] = v;
    // Dar crear/editar/anular sin ver: se da ver. Quitar ver: se quita todo.
    if (v === true && a !== 'ver' && !this.efectivoCon(e, id, 'ver'))
      e.ver = true;
    if (v === false && a === 'ver') {
      for (const x of ['crear', 'editar', 'anular'] as Accion[])
        e[x] = this.heredadoDe(id, x) ? false : null;
    }
    if (ACC.every((x) => e[x] === null)) this.exc.delete(id);
    else this.exc.set(id, e);
  }

  private efectivoCon(e: PermisoExcepcion, id: number, a: Accion): boolean {
    return e[a] != null ? !!e[a] : this.heredadoDe(id, a);
  }

  private emitir(): void {
    if (this.modo === 'perfil') {
      this.valoresChange.emit([...this.val.values()].filter((p) => p.ver));
    } else {
      this.excepcionesChange.emit([...this.exc.values()]);
    }
    this.cdr.markForCheck();
  }

  // ── Presentación ──────────────────────────────────────────
  claseCelda(fila: Fila, a: Accion): string {
    if (fila.ids.length > 1 || fila.nodo.esGrupo) {
      return 'celda celda--grupo celda--' + this.estadoGrupo(fila.ids, a);
    }
    const id = fila.nodo.submoduloId;
    if (this.modo === 'perfil')
      return this.efectivo(id, a) ? 'celda celda--on' : 'celda';
    const aj = this.ajuste(id, a);
    if (aj === true) return 'celda celda--da';
    if (aj === false) return 'celda celda--quita';
    return this.heredadoDe(id, a) ? 'celda celda--hereda-on' : 'celda';
  }

  iconoCelda(fila: Fila, a: Accion): string {
    if (fila.ids.length > 1 || fila.nodo.esGrupo) {
      const e = this.estadoGrupo(fila.ids, a);
      return e === 'todo'
        ? 'pi pi-check'
        : e === 'parcial'
          ? 'pi pi-minus'
          : '';
    }
    if (
      this.modo === 'excepciones' &&
      this.ajuste(fila.nodo.submoduloId, a) === false
    )
      return 'pi pi-times';
    return this.efectivo(fila.nodo.submoduloId, a) ? 'pi pi-check' : '';
  }

  tooltipCelda(fila: Fila, a: Accion): string {
    if (this.modo !== 'excepciones' || fila.ids.length > 1 || fila.nodo.esGrupo)
      return '';
    const aj = this.ajuste(fila.nodo.submoduloId, a);
    const her = this.heredadoDe(fila.nodo.submoduloId, a);
    if (aj === true) return 'Se lo da este usuario (el perfil no lo tiene)';
    if (aj === false)
      return 'Se le quita a este usuario (el perfil sí lo tiene)';
    return her ? 'Lo tiene por su perfil' : 'Su perfil no lo tiene';
  }

  trackModulo = (_: number, m: Modulo) => m.codigo;
  trackFila = (_: number, f: Fila) => f.nodo.submoduloId;
}
