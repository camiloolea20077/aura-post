import { SIDEBAR_MENU } from '../../layout/sidebar/sidebar.config';
import { SidebarMenuGroup, SidebarMenuItem } from '../interfaces';
import { PermisosUsuario } from '../../core/models/permisos.model';
import { normalize } from './commons';

/**
 * Filtra el menú con los permisos del perfil del usuario (docs/PLAN_PERMISOS.md).
 *
 * Un ítem se ve si su `codigo` ("modulo.submodulo") tiene VER en los permisos
 * del usuario. El back ya recorta esos permisos a lo que la empresa tiene
 * activo, así que no hace falta cruzar con los módulos. `tipos` limita además
 * por tipo de usuario (pantallas personales del vendedor).
 *
 * Si los permisos no cargaron (back viejo o error de red), se usa la regla de
 * antes: módulos activos de la empresa por label. Así nadie se queda sin menú.
 *
 * No modifica SIDEBAR_MENU: devuelve copias.
 */
export const filtrarMenuPorPermisos = (
  modulos: any[],
  userRole: string,
  permisos: PermisosUsuario | null = null,
): SidebarMenuGroup[] => {
  const gruposDefaultOpenCajero = ['Operaciones', 'Administración'];
  const visible = permisos
    ? (item: SidebarMenuItem) => puedeVer(item, permisos, userRole)
    : visiblePorEmpresa(modulos);

  return SIDEBAR_MENU.map((group) => {
    const items = group.items.filter(visible);
    const subgroups = group.subgroups
      ?.map((sg) => ({ ...sg, items: sg.items.filter(visible) }))
      .filter((sg) => sg.items.length > 0);
    return {
      ...group,
      items,
      subgroups,
      defaultOpen:
        group.defaultOpen ||
        (userRole === 'CAJERO' && gruposDefaultOpenCajero.includes(group.label)),
    };
  }).filter(
    (group) => group.items.length > 0 || (group.subgroups?.length ?? 0) > 0,
  );
};

const puedeVer = (item: SidebarMenuItem, p: PermisosUsuario, rol: string): boolean => {
  if (item.tipos && rol !== 'PLATFORM_ADMIN' && !item.tipos.includes(rol)) return false;
  if (!item.codigo) return false;
  return (p.permisos[item.codigo] ?? []).includes('VER');
};

/** Regla anterior a los perfiles, solo como respaldo si los permisos no cargan. */
const visiblePorEmpresa = (modulos: any[]) => {
  const submodulosActivos = new Set(
    (modulos ?? [])
      .filter((m: any) => m.activo)
      .flatMap((m: any) => m.submodulos ?? [])
      .filter((s: any) => s.activo)
      .map((s: any) => normalize(s.submoduloCodigo)),
  );
  return (item: SidebarMenuItem) =>
    !!item.codigo && submodulosActivos.has(item.codigo.split('.')[1]);
};
