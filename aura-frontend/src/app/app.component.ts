import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StateStore } from './core/store/state';
import { ProgressSpinner } from 'primeng/progressspinner';
import { IndexDBService } from './core/services/index-db.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ProgressSpinner],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private readonly stateStore = inject(StateStore);
  private readonly indexDBService = inject(IndexDBService);
  title = 'aura-frontend';

  public loading = signal(false);

  constructor() {
    this.stateStore.setWindowWidth(window.innerWidth);
    window.addEventListener('resize', () => {
      this.stateStore.setWindowWidth(window.innerWidth);
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    const auth = await this.indexDBService.loadDataAuthDB();
    if (auth) {
      this.stateStore.setEmpleadoAndUsuarioId(
        auth.usuarioId,
        auth.rol,
        auth.empleadoId ?? null,
      );
      this.stateStore.updateMenuGroups(auth.rol);
    }
    this.loading.set(false);
  }
}
