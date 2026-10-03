import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
  signal,
} from '@angular/core';

import { StateStore } from '../../core/store/state';

/**
 * Muestra el elemento solo si el perfil del usuario permite la acción
 * (docs/PLAN_PERMISOS.md, fase P2).
 *
 *   <button *appPuede="'compras.compras:CREAR'" …>Nueva compra</button>
 *   <button *appPuede="'contabilidad.asientos-contables:ANULAR'" …>Anular</button>
 *
 * Una acción que no es VER/CREAR/EDITAR/ANULAR es especial (V192):
 *   <button *appPuede="'contabilidad.periodos-contables:REABRIR'" …>Reabrir</button>
 *
 * Sin ":ACCION" se exige VER. Mientras los permisos no cargan se muestra (el
 * back es quien bloquea): así el botón no parpadea al abrir la pantalla.
 */
@Directive({
  selector: '[appPuede]',
  standalone: true,
})
export class PuedeDirective {
  private readonly store = inject(StateStore);
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly vcr = inject(ViewContainerRef);
  private readonly requerido = signal('');
  private mostrado = false;

  @Input({ required: true }) set appPuede(valor: string) {
    this.requerido.set(valor ?? '');
  }

  constructor() {
    effect(() => {
      this.store.permisos(); // se recalcula cuando cargan o cambian los permisos
      const [clave, accion] = this.requerido().split(':');
      const ok =
        !clave || this.store.puede(clave, accion || 'VER');
      if (ok && !this.mostrado) {
        this.vcr.createEmbeddedView(this.tpl);
        this.mostrado = true;
      } else if (!ok && this.mostrado) {
        this.vcr.clear();
        this.mostrado = false;
      }
    });
  }
}
