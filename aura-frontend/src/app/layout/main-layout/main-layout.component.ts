import { Component, effect, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { IndexDBService } from '../../core/services/index-db.service';
import { StateStore } from '../../core/store/state';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ToastModule,
    SidebarComponent,
    TopbarComponent,
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
})
export class MainLayoutComponent implements OnInit {
  public sidebarCollapsed = false;
  public isCajero = false;
  public drawerOpen = false;

  public readonly state = inject(StateStore);

  constructor(private indexDb: IndexDBService) {
    effect(() => {
      if (this.state.isMobile()) {
        this.drawerOpen = false;
        this.sidebarCollapsed = true;
      }
    });
  }

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
