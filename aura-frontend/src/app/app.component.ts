import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StateStore } from './core/store/state';
import { ProgressSpinner } from 'primeng/progressspinner';
import { IndexDBService } from './core/services/index-db.service';
import { SocketService } from './shared/services/socket.service';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { CambioVersion, novedadesNuevas } from './core/models/novedades-version.model';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ProgressSpinner, ConfirmDialogModule, DialogModule, ButtonModule],
  providers: [ConfirmationService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private readonly stateStore = inject(StateStore);
  private readonly indexDBService = inject(IndexDBService);
  private readonly socketService = inject(SocketService);
  private readonly swUpdate = inject(SwUpdate);
  title = 'aura-frontend';

  public loading = signal(false);

  /** Aviso de versión nueva con lo que cambia (appData de ngsw-config.json). */
  public mostrarActualizacion = signal(false);
  public cambiosVersion = signal<CambioVersion[]>([]);

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
      .subscribe((e) => this.promptUpdate(e));
  }

  /**
   * Muestra el aviso con las novedades del envío. Solo lista cambios si el envío
   * trae una `version` de novedades distinta a la actual (si nadie las actualizó, no
   * se repiten las viejas).
   */
  private promptUpdate(e: VersionReadyEvent): void {
    this.cambiosVersion.set(novedadesNuevas(e.currentVersion.appData, e.latestVersion.appData));
    this.mostrarActualizacion.set(true);
  }

  public async applyUpdate(): Promise<void> {
    this.mostrarActualizacion.set(false);
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
