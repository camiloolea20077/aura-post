import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StateStore } from './core/store/state';
import { ProgressSpinner } from 'primeng/progressspinner';
import { IndexDBService } from './core/services/index-db.service';
import { SocketService } from './shared/services/socket.service';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ProgressSpinner, ConfirmDialogModule],
  providers: [ConfirmationService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private readonly stateStore = inject(StateStore);
  private readonly indexDBService = inject(IndexDBService);
  private readonly socketService = inject(SocketService);
  private readonly swUpdate = inject(SwUpdate);
  private readonly confirmationService = inject(ConfirmationService);
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
    this.listenForUpdates();
  }

  // ── Aviso de nueva versión desplegada (Vercel) ────────────
  private listenForUpdates(): void {
    if (!this.swUpdate.isEnabled) return;

    // Revisa periódicamente y al volver el foco si hay un deploy nuevo.
    setInterval(() => this.swUpdate.checkForUpdate(), 60 * 1000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.swUpdate.checkForUpdate();
      }
    });

    this.swUpdate.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => this.promptUpdate());
  }

  private promptUpdate(): void {
    this.confirmationService.confirm({
      header: 'Nueva versión disponible',
      message:
        'Hay una actualización del sistema. Se recargará la página para aplicarla.',
      icon: 'pi pi-info-circle',
      acceptLabel: 'Actualizar ahora',
      rejectLabel: 'Más tarde',
      accept: () => this.applyUpdate(),
    });
  }

  private async applyUpdate(): Promise<void> {
    try {
      await this.swUpdate.activateUpdate();
    } catch {
      /* ignora: igual recargamos con caché limpia */
    }
    // Limpia el Cache Storage para forzar contenido fresco.
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    window.location.reload();
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
      this.stateStore.setRole(auth.rol);
    }
    this.loading.set(false);
  }
}
