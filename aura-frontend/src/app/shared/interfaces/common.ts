export interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  roles?: string[];
}

export interface MenuGroups {
  label: string;
  icon: string;
  items: MenuItem[];
}

export interface SidebarMenuItem {
  label: string;
  icon: string;
  route?: string;
  badge?: string;
  highlight?: boolean;
  roles?: string[];
}

export interface SidebarSubgroup {
  label: string;
  icon?: string;
  items: SidebarMenuItem[];
}

export interface SidebarMenuGroup {
  label: string;
  icon: string;
  items: SidebarMenuItem[];
  /** Submódulos colapsables dentro del grupo (tercer nivel). */
  subgroups?: SidebarSubgroup[];
  roles?: string[];
  defaultOpen?: boolean;
  alwaysOpen?: boolean;
}
