import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  navGroups: NavGroup[] = [
    {
      items: [
        { label: 'Dashboard', icon: 'pi pi-home', route: '/dashboard' },
        { label: 'Punto de Venta', icon: 'pi pi-shopping-cart', route: '/pos' },
      ]
    },
    {
      title: 'INVENTARIO',
      items: [
        { label: 'Productos', icon: 'pi pi-box', route: '/products' },
        { label: 'Inventario', icon: 'pi pi-warehouse', route: '/inventory' },
      ]
    },
    {
      title: 'GESTIÓN',
      items: [
        { label: 'Clientes', icon: 'pi pi-users', route: '/customers' },
        { label: 'Proveedores', icon: 'pi pi-truck', route: '/suppliers' },
      ]
    },
    {
      title: 'ANÁLISIS',
      items: [
        { label: 'Reportes', icon: 'pi pi-chart-bar', route: '/reports' },
      ]
    }
  ];
}
