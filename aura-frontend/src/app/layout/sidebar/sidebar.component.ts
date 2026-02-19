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
  @Input()  collapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();

  public menuGroups: SidebarMenuGroup[] = SIDEBAR_MENU;
  public userName    = '';
  public userRole    = '';
  public userInitials = '';
  public empresaNombre = '';

  constructor(
    private readonly indexDBService: IndexDBService,
    private readonly router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadUserInfo();
  }

  private async loadUserInfo(): Promise<void> {
    const auth = await this.indexDBService.loadDataAuthDB();
    if (auth?.user) {
      this.userName      = auth.user.nombre;
      this.userRole      = auth.user.rol;
      this.empresaNombre = auth.user.empresaNombre;
      this.userInitials  = this.getInitials(auth.user.nombre);
    }
  }

  private getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  async logout(): Promise<void> {
    await this.indexDBService.deleteDataAuthDB();
    this.router.navigate(['/login']);
  }
}