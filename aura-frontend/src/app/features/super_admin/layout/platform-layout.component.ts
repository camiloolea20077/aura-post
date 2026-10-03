import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { Subscription, filter } from 'rxjs';
import { IndexDBService } from '../../../core/services/index-db.service';

interface ItemMenu {
  label: string;
  icon: string;
  route: string;
  peligro?: boolean;
}

/**
 * Panel de plataforma. En escritorio el menú queda fijo a la izquierda; en el
 * teléfono se abre como cajón desde la barra superior y se cierra al navegar.
 */
@Component({
  selector: 'app-platform-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ToastModule],
  templateUrl: './platform-layout.component.html',
  styleUrl: './platform-layout.component.scss',
})
export class PlatformLayoutComponent implements OnDestroy {
  readonly principal: ItemMenu[] = [
    { label: 'Dashboard', icon: 'pi pi-th-large', route: '/platform/dashboard' },
    { label: 'Empresas', icon: 'pi pi-building', route: '/platform/empresas' },
    { label: 'Clientes', icon: 'pi pi-users', route: '/platform/clientes' },
    { label: 'Módulos', icon: 'pi pi-sitemap', route: '/platform/modulos' },
  ];
  readonly soporte: ItemMenu[] = [
    { label: 'Monitor de errores', icon: 'pi pi-exclamation-triangle', route: '/platform/errores', peligro: true },
  ];

  menuAbierto = false;
  titulo = 'Plataforma';
  private sub: Subscription;

  constructor(
    private readonly router: Router,
    private readonly indexDB: IndexDBService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.actualizarTitulo(this.router.url);
    this.sub = this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      this.menuAbierto = false;
      this.actualizarTitulo((e as NavigationEnd).urlAfterRedirects);
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
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
