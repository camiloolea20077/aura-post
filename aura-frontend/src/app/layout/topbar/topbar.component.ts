import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { BadgeModule } from 'primeng/badge';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { IndexDBService } from '../../core/services/index-db.service';


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
  ],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent implements OnInit {
  @Input()  sidebarCollapsed = false;
  @Output() toggleSidebar    = new EventEmitter<void>();

  public breadcrumbs: BreadcrumbItem[]  = [];
  public userName     = '';
  public turnoActivo  = false;
  public darkMode     = false;
  public notifCount   = 0;
  public currentTime  = '';
  public currentDate  = '';

  // Form solo para el selector de sucursal (evitamos ngModel)
  public frmTopbar!: FormGroup;
  public sucursales: { label: string; value: number }[] = [];

  private routeLabels: Record<string, string> = {
    dashboard:    'Dashboard',
    pos:          'Punto de Venta',
    catalogo:     'Catálogo',
    productos:    'Productos',
    categorias:   'Categorías',
    marcas:       'Marcas',
    unidades:     'Unidades',
    precios:      'Precios',
    listas:       'Listas de Precio',
    descuentos:   'Descuentos',
    inventario:   'Inventario',
    stock:        'Stock',
    lotes:        'Lotes',
    seriales:     'Seriales',
    kardex:       'Kardex',
    compras:      'Compras',
    ventas:       'Ventas',
    mermas:       'Mermas',
    traslados:    'Traslados',
    terceros:     'Clientes y Proveedores',
    caja:         'Caja',
    cajas:        'Cajas',
    turnos:       'Turnos',
    reportes:     'Reportes',
    new:          'Nuevo',
  };

  constructor(
    private readonly router: Router,
    private readonly fb: FormBuilder,
    private readonly indexDBService: IndexDBService
  ) {}

  async ngOnInit(): Promise<void> {
    this.initForm();
    this.watchRoute();
    this.startClock();
    await this.loadUserInfo();
  }

  private initForm(): void {
    this.frmTopbar = this.fb.group({
      sucursalId: [null],
    });
  }

  private async loadUserInfo(): Promise<void> {
    const auth = await this.indexDBService.loadDataAuthDB();
    if (auth?.user) {
      this.userName = auth.user.nombre;

      // Cargar la sucursal actual
      this.sucursales = [{ label: auth.user.sucursalNombre, value: auth.user.sucursalId }];
      this.frmTopbar.patchValue({ sucursalId: auth.user.sucursalId });
    }
  }

  private watchRoute(): void {
    this.buildBreadcrumbs(this.router.url);

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
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
      this.currentTime = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
      this.currentDate = now.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
    };
    update();
    setInterval(update, 60000);
  }

  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;
    document.body.classList.toggle('dark-mode', this.darkMode);
  }
}