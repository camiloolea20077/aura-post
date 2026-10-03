import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';

import { StateStore } from '../../core/store/state';

/**
 * Botón "Volver al centro" para los grupos del menú que tienen `hubRoute`
 * (p. ej. Contabilidad). Como el sidebar ya no despliega esas pantallas, desde
 * cualquiera de ellas (y sus rutas hijas: /contabilidad/notas/nueva, …) se
 * regresa al centro con un clic. Vive en el layout para no tocar cada pantalla:
 * una pantalla nueva del grupo lo hereda sola.
 */
@Component({
  selector: 'app-hub-back',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule],
  template: `
    @if (hub(); as h) {
      <nav class="hub-back" aria-label="Volver al centro del módulo">
        <a [routerLink]="h.route" class="hub-back__link">
          <i class="pi pi-arrow-left" aria-hidden="true"></i>
          <span>Volver a {{ h.label }}</span>
        </a>
      </nav>
    }
  `,
  styles: [
    `
      .hub-back {
        padding: 0 2rem;
        margin-bottom: -0.5rem;
      }

      .hub-back__link {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.4rem 0.8rem;
        border: 1px solid var(--aura-border, #e5e7eb);
        border-radius: 8px;
        background: var(--aura-surface, #ffffff);
        color: #2563eb;
        font-size: 0.8rem;
        font-weight: 600;
        text-decoration: none;
        transition: background 0.15s;

        i {
          font-size: 0.75rem;
        }

        &:hover,
        &:focus-visible {
          background: #eff6ff;
          outline: none;
        }

        &:focus-visible {
          box-shadow: 0 0 0 2px #2563eb;
        }
      }

      @media (max-width: 768px) {
        .hub-back {
          padding: 0;
          margin-bottom: 0.5rem;
        }
      }
    `,
  ],
})
export class HubBackComponent {
  private readonly router = inject(Router);
  private readonly stateStore = inject(StateStore);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /** Centro al que pertenece la pantalla actual; null en el propio centro o fuera de él. */
  readonly hub = computed<{ route: string; label: string } | null>(() => {
    const url = this.url().split('?')[0].split('#')[0];
    for (const g of this.stateStore.menuGroups()) {
      if (!g.hubRoute || url === g.hubRoute) continue;
      const pertenece = (g.items ?? []).some(
        (i) => !!i.route && (url === i.route || url.startsWith(i.route + '/')),
      );
      if (pertenece) return { route: g.hubRoute, label: g.label };
    }
    return null;
  });
}
