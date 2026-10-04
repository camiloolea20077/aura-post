import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';

import { SIDEBAR_MENU } from '../../layout/sidebar/sidebar.config';
import { SidebarMenuItem } from '../../shared/interfaces';
import { AlertService } from '../../shared/pipes/alert.service';
import { PermisosUsuario } from '../models/permisos.model';
import { StateStore } from '../store/state';

/** Ítems del menú con su ruta, para saber qué submódulo protege cada URL. */
const ITEMS: SidebarMenuItem[] = SIDEBAR_MENU.flatMap((g) => [
  ...g.items,
  ...(g.subgroups ?? []).flatMap((sg) => sg.items),
]).filter((i) => !!i.route);

/**
 * El ítem del menú cuya ruta es el prefijo más largo de la URL (por segmentos):
 * `/compras/12/editar` cae en "Compras", `/ventas/notas/credito` en "Notas".
 */
export const itemDeRuta = (url: string): SidebarMenuItem | null => {
  const limpia = url.split('?')[0].split('#')[0];
  let mejor: SidebarMenuItem | null = null;
  for (const i of ITEMS) {
    const r = i.route!;
    if (
      (limpia === r || limpia.startsWith(r + '/')) &&
      (!mejor || r.length > mejor.route!.length)
    )
      mejor = i;
  }
  return mejor;
};

const puedeVer = (
  item: SidebarMenuItem,
  p: PermisosUsuario,
  rol: string | null,
): boolean => {
  if (item.tipos && rol !== 'PLATFORM_ADMIN' && !item.tipos.includes(rol ?? ''))
    return false;
  return !!item.codigo && (p.permisos[item.codigo] ?? []).includes('VER');
};

/**
 * Bloquea en el front las pantallas que el perfil del usuario no permite ver
 * (docs/PLAN_PERMISOS.md, fase P2). Las rutas que no cuelgan de ningún ítem del
 * menú no se revisan aquí (las cuida su propio guard y el back).
 */
export const permisoGuard: CanActivateChildFn = async (_route, state) => {
  const store = inject(StateStore);
  const router = inject(Router);
  const alert = inject(AlertService);

  const item = itemDeRuta(state.url);
  if (!item?.codigo) return true;

  const p = await store.asegurarPermisos();
  if (!p) return true; // sin permisos cargados no se bloquea: el back decide
  if (puedeVer(item, p, p.rol)) return true;

  alert.showError(
    'Sin permiso',
    `Su perfil no tiene acceso a "${item.label}".`,
  );
  const destino = ITEMS.find(
    (i) => i.route !== item.route && puedeVer(i, p, p.rol),
  );
  return destino ? router.parseUrl(destino.route!) : false;
};
