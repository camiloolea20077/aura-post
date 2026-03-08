import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { filter } from 'rxjs/operators';

import { SIDEBAR_MENU, SidebarMenuGroup, SidebarMenuItem } from './sidebar.config';
import { IndexDBService } from '../../core/services/index-db.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, TooltipModule, ConfirmDialogModule],
  providers: [ConfirmationService],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  @Input() collapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();

  logoSafeUrl: string | null = null;
  public menuGroups: SidebarMenuGroup[] = [];
  public userName = '';
  public userRole = '';
  public userInitials = '';
  public empresaNombre = '';

  /** Grupos abiertos por label */
  public openGroups = new Set<string>();

  constructor(
    private readonly indexDBService: IndexDBService,
    private readonly router: Router,
    private readonly confirmationService: ConfirmationService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadUserInfo();

    // Cuando navega, abrir el grupo de la ruta activa
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.abrirGrupoActivo());

    this.abrirGrupoActivo();
  }

  private async loadUserInfo(): Promise<void> {
    const auth = await this.indexDBService.loadDataAuthDB();
    if (auth) {
      this.logoSafeUrl = auth.logo_url ?? 'assets/icons/icono.jpeg';
      this.userName = auth.nombreCompleto;
      this.userRole = auth.rol;
      this.empresaNombre = auth.username;
      this.userInitials = this.getInitials(auth.nombreCompleto);
      this.menuGroups = this.filtrarMenu(auth.rol);

      // Abrir grupos marcados como defaultOpen
      this.menuGroups
        .filter((g) => g.defaultOpen)
        .forEach((g) => this.openGroups.add(g.label));
    }
  }

  /** Abre el grupo que contiene la ruta activa */
  private abrirGrupoActivo(): void {
    const url = this.router.url;
    for (const group of this.menuGroups) {
      const tieneActivo = group.items.some(
        (item) => item.route && url.startsWith(item.route),
      );
      if (tieneActivo) {
        this.openGroups.add(group.label);
      }
    }
  }

  toggleGroup(group: SidebarMenuGroup): void {
    if (this.collapsed || group.alwaysOpen) return;
    if (this.openGroups.has(group.label)) {
      this.openGroups.delete(group.label);
    } else {
      this.openGroups.add(group.label);
    }
  }

  isOpen(group: SidebarMenuGroup): boolean {
    return this.collapsed || group.alwaysOpen || this.openGroups.has(group.label);
  }

  // ── Filtra grupos e ítems según el rol ────────────────────
  private filtrarMenu(rol: string): SidebarMenuGroup[] {
    return SIDEBAR_MENU.filter((group) => this.tieneAcceso(group.roles, rol))
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => this.tieneAcceso(item.roles, rol)),
      }))
      .filter((group) => group.items.length > 0);
  }

  private tieneAcceso(roles: string[] | undefined, rol: string): boolean {
    if (!roles || roles.length === 0) return true;
    return roles.includes(rol);
  }

  private getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  confirmLogout(): void {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas cerrar sesión?',
      header: 'Cerrar sesión',
      icon: 'pi pi-sign-out',
      acceptLabel: 'Sí, cerrar sesión',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        await this.indexDBService.deleteDataAuthDB();
        this.router.navigate(['/login']);
      },
    });
  }
}
