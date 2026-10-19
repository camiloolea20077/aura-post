import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { Subscription, filter, lastValueFrom } from 'rxjs';
import { IndexDBService } from '../../../core/services/index-db.service';
import { PlatformService } from '../../../core/services/platform.service';

interface ItemMenu {
  label: string;
  icon: string;
  route: string;
  peligro?: boolean;
  /** Muestra el contador de solicitudes pendientes. */
  conPendientes?: boolean;
}

/** Cada cuánto se revisa la campana (las firmas piden en cualquier momento). */
const REVISAR_CADA_MS = 60_000;

/**
 * Panel de plataforma. En escritorio el menú queda fijo a la izquierda; en el
 * teléfono se abre como cajón desde la barra superior y se cierra al navegar.
 * La campana cuenta las solicitudes de activación electrónica de las firmas.
 */
@Component({
  selector: 'app-platform-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ToastModule],
  templateUrl: './platform-layout.component.html',
  styleUrl: './platform-layout.component.scss',
})
export class PlatformLayoutComponent implements OnInit, OnDestroy {
  readonly principal: ItemMenu[] = [
    { label: 'Dashboard', icon: 'pi pi-th-large', route: '/platform/dashboard' },
    { label: 'Empresas', icon: 'pi pi-building', route: '/platform/empresas' },
    { label: 'Clientes', icon: 'pi pi-users', route: '/platform/clientes' },
    { label: 'Módulos', icon: 'pi pi-sitemap', route: '/platform/modulos' },
    { label: 'Activación electrónica', icon: 'pi pi-send', route: '/platform/solicitudes-electronica', conPendientes: true },
  ];
  readonly soporte: ItemMenu[] = [
    { label: 'Monitor de errores', icon: 'pi pi-exclamation-triangle', route: '/platform/errores', peligro: true },
  ];

  menuAbierto = false;
  titulo = 'Plataforma';
  /** Solicitudes de activación electrónica que esperan credenciales. */
  pendientes = 0;
  private sub: Subscription;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly router: Router,
    private readonly indexDB: IndexDBService,
    private readonly cdr: ChangeDetectorRef,
    private readonly platform: PlatformService,
  ) {
    this.actualizarTitulo(this.router.url);
    this.sub = this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      this.menuAbierto = false;
      this.actualizarTitulo((e as NavigationEnd).urlAfterRedirects);
      this.revisarPendientes();
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    this.revisarPendientes();
    this.timer = setInterval(() => this.revisarPendientes(), REVISAR_CADA_MS);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    if (this.timer) clearInterval(this.timer);
  }

  irASolicitudes(): void {
    this.router.navigate(['/platform/solicitudes-electronica']);
  }

  /** La campana no tumba el panel: si falla, queda en cero hasta la próxima vuelta. */
  private async revisarPendientes(): Promise<void> {
    try {
      const res = await lastValueFrom(this.platform.pendientesElectronica());
      this.pendientes = res?.data ?? 0;
    } catch {
      this.pendientes = 0;
    }
    this.cdr.markForCheck();
  }

  @HostListener('document:keydown.escape')
  cerrarConEscape(): void {
    if (this.menuAbierto) {
      this.menuAbierto = false;
      this.cdr.markForCheck();
    }
  }

  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  private actualizarTitulo(url: string): void {
    const item = [...this.principal, ...this.soporte].find((i) => url.startsWith(i.route));
    this.titulo = item?.label ?? (url.includes('/permisos/') ? 'Permisos de empresa' : 'Plataforma');
  }

  async logout(): Promise<void> {
    await this.indexDB.deleteDataAuthDB();
    this.router.navigate(['/login']);
  }
}
