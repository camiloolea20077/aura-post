import { SIDEBAR_MENU } from '../../layout/sidebar/sidebar.config';
import { SidebarMenuGroup } from '../interfaces';
import { normalize } from './commons';

const tieneAcceso = (roles: string[] | undefined, rol: string): boolean => {
  if (rol === 'PLATFORM_ADMIN') return true;
  if (!roles || roles.length === 0) return true;
  return roles.includes(rol);
};

/**
 * Filtra el menú por permisos
 * @param modulos Módulos de la empresa
 * @param userRole Rol del usuario
 * @returns Menú filtrado
 */
export const filtrarMenuPorPermisos = (
  modulos: any[],
  userRole: string,
): SidebarMenuGroup[] => {
  const gruposDefaultOpenCajero = ['Operaciones', 'Administración'];

  const modulosActivos = new Set(
    modulos
      .filter((m: any) => m.activo)
      .map((m: any) => normalize(m.moduloCodigo)),
  );

  const submodulosActivos = new Set(
    modulos
      .filter((m: any) => m.activo)
      .flatMap((m: any) => m.submodulos)
      .filter((s: any) => s.activo)
      .map((s: any) => normalize(s.submoduloCodigo)),
  );

  return SIDEBAR_MENU.map((group) => {
    const grupoLabelNormalizado = normalize(group.label);
    const grupoActivo = modulosActivos.has(grupoLabelNormalizado);

    if (!grupoActivo) {
      group.items = [];
      group.subgroups = [];
      return group;
    }

    group.items = group.items.filter((item) => {
      const itemCodigo = normalize(item.label);
      return submodulosActivos.has(itemCodigo);
    });

    if (userRole === 'PLATFORM_ADMIN') {
      group.items = group.items.filter((item) => {
        const itemCodigo = normalize(item.label);
        return submodulosActivos.has(itemCodigo);
      });
    }

    group.items = group.items.filter((item) => {
      return tieneAcceso(item.roles, userRole);
    });

    // Submódulos (tercer nivel): se filtran por rol; el módulo padre ya validó acceso.
    const subgroups = group.subgroups
      ? group.subgroups
          .map((sg) => ({
            ...sg,
            items: sg.items.filter((item) => tieneAcceso(item.roles, userRole)),
          }))
          .filter((sg) => sg.items.length > 0)
      : undefined;

    return {
      ...group,
      subgroups,
      defaultOpen:
        group.defaultOpen ||
        (userRole === 'CAJERO' &&
          gruposDefaultOpenCajero.includes(group.label)),
    };
  })
    .filter(
      (group) =>
        group.items.length > 0 ||
        (group.subgroups !== undefined && group.subgroups.length > 0),
    )
    .filter((group) => tieneAcceso(group.roles, userRole));
};
