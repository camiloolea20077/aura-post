import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';

import { SIDEBAR_MENU, SidebarMenuGroup } from './sidebar.config';
import { IndexDBService } from '../../core/services/index-db.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, TooltipModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  @Input() collapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();

  public menuGroups: SidebarMenuGroup[] = [];
  public userName = '';
  public userRole = '';
  public userInitials = '';
  public empresaNombre = '';

  constructor(
    private readonly indexDBService: IndexDBService,
    private readonly router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadUserInfo();
  }

  private async loadUserInfo(): Promise<void> {
    const auth = await this.indexDBService.loadDataAuthDB();
    if (auth) {
      this.userName = auth.nombreCompleto;
      this.userRole = auth.rol;
      this.empresaNombre = auth.username;
      this.userInitials = this.getInitials(auth.nombreCompleto);
      this.menuGroups = this.filtrarMenu(auth.rol);
    }
  }

  // ── Filtra grupos e ítems según el rol ────────────────────
  private filtrarMenu(rol: string): SidebarMenuGroup[] {
    return SIDEBAR_MENU.filter((group) => this.tieneAcceso(group.roles, rol))
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => this.tieneAcceso(item.roles, rol)),
      }))
      .filter((group) => group.items.length > 0); // eliminar grupos vacíos
  }

  // undefined en roles = todos los roles tienen acceso
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

  async logout(): Promise<void> {
    await this.indexDBService.deleteDataAuthDB();
    this.router.navigate(['/login']);
  }
}
