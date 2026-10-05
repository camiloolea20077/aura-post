import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { BadgeModule } from 'primeng/badge';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { normalize } from '../../shared/utils/commons';
import { IndexDBService } from '../../core/services/index-db.service';
import { StateStore } from '../../core/store/state';
import { MobileMenuComponent } from '../mobile-menu/mobile-menu.component';
import { lastValueFrom } from 'rxjs';
import { NotificacionService } from '../../core/services/notificacion.service';
import { NotificacionModel } from '../../core/models/notificacion.model';
import { AlertService } from '../../shared/pipes/alert.service';
import { AuthService } from '../../core/services/auth.service';

interface BreadcrumbItem {
  label: string;
  route?: string;
}

interface Sucursal {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    OverlayPanelModule,
    TooltipModule,
    DropdownModule,
    BadgeModule,
    MobileMenuComponent,
  ],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent implements OnInit {
  @Input() sidebarCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  public readonly state = inject(StateStore);
  private readonly authService = inject(AuthService);
  public breadcrumbs: BreadcrumbItem[] = [];
  public userName = '';
  public userRole = '';
  public turnoActivo = false;
  public darkMode = false;
  public notifCount = 0;
  public notificaciones: NotificacionModel[] = [];
  private notifTimer: ReturnType<typeof setInterval> | null = null;
  public currentTime = '';
  public currentDate = '';
  public menuGroups: {
    label: string;
    items: { label: string; icon: string; route?: string }[];
  }[] = [];

  // Form solo para el selector de sucursal (evitamos ngModel)
  public frmTopbar!: FormGroup;
  public sucursales: { label: string; value: number }[] = [];

  private routeLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    pos: 'Punto de Venta',
    catalogo: 'Catálogo',
    productos: 'Productos',
    categorias: 'Categorías',
    marcas: 'Marcas',
    unidades: 'Unidades',
    precios: 'Precios',
    listas: 'Listas de Precio',
    descuentos: 'Descuentos',
    inventario: 'Inventario',
    stock: 'Stock',
    lotes: 'Lotes',
    seriales: 'Seriales',
    kardex: 'Kardex',
    compras: 'Compras',
    ventas: 'Ventas',
    mermas: 'Mermas',
    traslados: 'Traslados',
    terceros: 'Clientes y Proveedores',
    caja: 'Caja',
    cajas: 'Cajas',
    turnos: 'Turnos',
    reportes: 'Reportes',
    contabilidad: 'Contabilidad',
    new: 'Nuevo',
  };

  constructor(
    private readonly router: Router,
    private readonly fb: FormBuilder,
    private readonly indexDBService: IndexDBService,
    private readonly notificacionService: NotificacionService,
    private readonly alertService: AlertService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.initForm();
    this.watchRoute();
    this.startClock();
    this.initDarkMode();
    await this.loadUserInfo();
    await this.cargarNotificaciones(true);
    // Cada 5 minutos: lo que vence hoy aparece sin recargar la página.
    // Cada minuto: un cajero puede estar esperando una autorización de crédito.
    this.notifTimer = setInterval(() => this.cargarNotificaciones(false), 60 * 1000);
  }

  private async cargarNotificaciones(alEntrar: boolean): Promise<void> {
    try {
      const res = await lastValueFrom(this.notificacionService.listar());
      this.notificaciones = res?.data ?? [];
    } catch {
      this.notificaciones = [];
    }
    this.notifCount = this.notificaciones.reduce((s, n) => s + (n.cantidad || 0), 0);

    // Vencidos: se avisa al entrar, una vez por sesión, para que se den de baja ya.
    const vencidos = this.notificaciones.find((n) => n.tipo === 'LOTES_VENCIDOS');
    const clave = 'aviso-vencidos-' + new Date().toDateString();
    if (alEntrar && vencidos && !sessionStorage.getItem(clave)) {
      sessionStorage.setItem(clave, '1');
      this.alertService.showError(
        vencidos.titulo,
        `${vencidos.mensaje} Ábrelos desde la campana de notificaciones.`,
      );
    }
  }

  abrirNotificacion(n: NotificacionModel, panel: { hide: () => void }): void {
    panel.hide();
    if (n.tipo === 'LOTES_VENCIDOS') {
      // Abre vencimientos con los vencidos ya elegidos: un clic a la merma.
      this.router.navigate([n.ruta], { state: { abrirVencimientos: true, elegirVencidos: true } });
    } else if (n.tipo === 'LOTES_POR_VENCER') {
      this.router.navigate([n.ruta], { state: { abrirVencimientos: true } });
    } else if (n.tipo === 'PROMESAS_INCUMPLIDAS' || n.tipo === 'PROMESAS_HOY') {
      this.router.navigate([n.ruta], { state: { tab: 'agenda' } });
    } else if (n.tipo === 'FACTURAS_VENCIDAS') {
      this.router.navigate([n.ruta], { state: { tab: 'alertas' } });
    } else if (n.tipo === 'FACTURAS_POR_VENCER') {
      this.router.navigate([n.ruta], { state: { tab: 'agenda' } });
    } else if (n.tipo === 'ACUERDOS_INCUMPLIDOS' || n.tipo === 'CUOTAS_POR_VENCER') {
      this.router.navigate([n.ruta], { state: { tab: 'acuerdos' } });
    } else if (n.tipo === 'SOLICITUDES_CREDITO') {
      this.router.navigate([n.ruta], { state: { tab: 'autorizaciones' } });
    } else {
      this.router.navigate([n.ruta]);
    }
  }

  formatCOP(v: number | null): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }

  private initForm(): void {
    this.frmTopbar = this.fb.group({
      sucursalId: [null],
    });
  }

  private async loadUserInfo(): Promise<void> {
    const auth = await this.indexDBService.loadDataAuthDB();
    if (auth) {
      this.userName = auth.nombreCompleto;
      this.userRole = auth.rol;

      // Cargar sucursales desde el array
      this.sucursales = auth.sucursales.map((s: any) => ({
        label: s.nombre,
        value: s.id,
      }));

      // La sede de la sesión (si ya la cambió), si no la default, si no la primera.
      const actual =
        auth.sucursales.find((s: any) => s.id === auth.sucursalActualId) ??
        auth.sucursales.find((s: any) => s.esDefault) ??
        auth.sucursales[0];

      if (actual) {
        this.frmTopbar.patchValue(
          { sucursalId: actual.id },
          { emitEvent: false },
        );
      }
      this.escucharCambioDeSede(actual?.id ?? null);

      // Cargar menú para mobile
      this.loadMenuForMobile();
    }
  }

  /**
   * Cambiar de sede pide un token nuevo con esa sede (PLAN_PERMISOS P9): antes el
   * selector no hacía nada y todo seguía en la sede del login. Se recarga la
   * aplicación para que cada pantalla tome la sede nueva.
   */
  private escucharCambioDeSede(inicial: number | null): void {
    let actual = inicial;
    this.frmTopbar.get('sucursalId')?.valueChanges.subscribe(async (id) => {
      if (!id || id === actual) return;
      try {
        const res = await lastValueFrom(this.authService.cambiarSede(id));
        const auth = await this.indexDBService.loadDataAuthDB();
        if (res?.data?.token && auth) {
          await this.indexDBService.saveAuthData({
            ...auth,
            token: res.data.token,
            sucursalActualId: id,
          });
          actual = id;
          window.location.reload();
        }
      } catch (err: any) {
        this.alertService.showError(
          'No se pudo cambiar de sede',
          err?.error?.message ?? 'Intente de nuevo.',
        );
        this.frmTopbar.patchValue({ sucursalId: actual }, { emitEvent: false });
      }
    });
  }

  /** El menú ya filtrado por el perfil del usuario (StateStore), aplanado. */
  private loadMenuForMobile(): void {
    this.menuGroups = this.state
      .menuGroups()
      .map((g) => ({
        label: g.label,
        items: [...g.items, ...(g.subgroups ?? []).flatMap((sg) => sg.items)].map((i) => ({
          label: i.label,
          icon: i.icon,
          route: i.route,
        })),
      }))
      .filter((g) => g.items.length > 0);
  }

  onMobileMenuClose(): void {
    // Callback when mobile menu is closed
  }

  private watchRoute(): void {
    this.buildBreadcrumbs(this.router.url);

    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: any) => this.buildBreadcrumbs(e.url));
  }

  private buildBreadcrumbs(url: string): void {
    const segments = url.split('/').filter(Boolean);
    this.breadcrumbs = segments.map((seg, i) => ({
      label: this.routeLabels[seg] ?? this.capitalize(seg),
      route: '/' + segments.slice(0, i + 1).join('/'),
    }));
  }

  private capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  private startClock(): void {
    const update = () => {
      const now = new Date();
      this.currentTime = now.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
      });
      this.currentDate = now.toLocaleDateString('es-CO', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    };
    update();
    setInterval(update, 60000);
  }

  private initDarkMode(): void {
    const saved = localStorage.getItem('darkMode') === 'true';
    this.darkMode = saved;
    document.documentElement.classList.toggle('dark-mode', saved);
  }

  /** Abre el manual en el tema de la pantalla actual. */
  abrirAyuda(): void {
    const actual = this.router.url;
    if (actual.startsWith('/ayuda')) return;
    void this.router.navigate(['/ayuda'], { queryParams: { desde: actual.split(/[?#]/)[0] } });
  }

  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;
    localStorage.setItem('darkMode', String(this.darkMode));
    document.documentElement.classList.toggle('dark-mode', this.darkMode);
  }

  async onLogout(): Promise<void> {
    await this.indexDBService.deleteDataAuthDB();
    this.router.navigate(['/login']);
  }
}
