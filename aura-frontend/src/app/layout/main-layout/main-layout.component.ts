import { Component, effect, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastModule } from 'primeng/toast';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { HubBackComponent } from '../hub-back/hub-back.component';
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
    HubBackComponent,
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
    // Tablet: elegir una pantalla del menú lo cierra (va encima del contenido).
    inject(Router).events
      .pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => {
        if (this.state.isTablet() && !this.isCajero) this.sidebarCollapsed = true;
      });

    effect(() => {
      if (this.state.isMobile()) {
        this.drawerOpen = false;
        this.sidebarCollapsed = true;
      } else if (this.state.isTablet()) {
        // En tablet el contenido deja solo 72px para el menú: si el menú
        // quedaba abierto (260px) tapaba el contenido y no había cómo cerrarlo.
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

  /** Tablet con el menú abierto: va encima del contenido, con fondo para cerrarlo. */
  get menuTabletAbierto(): boolean {
    return !this.isCajero && this.state.isTablet() && !this.sidebarCollapsed;
  }
}
