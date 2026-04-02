import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { IndexDBService } from '../../core/services/index-db.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastModule, SidebarComponent, TopbarComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
})
export class MainLayoutComponent implements OnInit {
  public sidebarCollapsed = false;
  public isCajero = false;
  public drawerOpen = false;

  constructor(private indexDb: IndexDBService) {}

  async ngOnInit(): Promise<void> {
    const auth = await this.indexDb.loadDataAuthDB();
    this.isCajero = auth?.rol === 'CAJERO';
  }

  toggleSidebar(): void {
    if (this.isCajero) {
      this.drawerOpen = !this.drawerOpen;
    } else {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    }
  }

  closeDrawer(): void {
    this.drawerOpen = false;
  }
}