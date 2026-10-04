import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import {
  BloqueoLog,
  CambioLog,
  ModoControl,
  PerfilFila,
} from '../../../core/models/permisos.model';
import { PermisosService } from '../../../core/services/permisos.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { PuedeDirective } from '../../../shared/directives/puede.directive';

/** Perfiles de permisos de la empresa, historial de cambios y registro del control. */
@Component({
  selector: 'app-index-perfiles',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ToastModule,
    TooltipModule,
    SkeletonModule,
    TableModule,
    TabViewModule,
    ConfirmDialogModule,
    PuedeDirective,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-perfiles.component.html',
  styleUrls: ['./index-perfiles.component.scss'],
})
export class IndexPerfilesComponent implements OnInit {
  activeTab = 0;
  search = '';
  perfiles: PerfilFila[] = [];
  cargando = true;

  historial: CambioLog[] = [];
  cargandoHistorial = false;
  historialCargado = false;

  bloqueos: BloqueoLog[] = [];
  cargandoBloqueos = false;
  bloqueosCargados = false;
  dias = 7;

  modo: ModoControl | null = null;

  constructor(
    private readonly service: PermisosService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
    lastValueFrom(this.service.modo())
      .then((r) => {
        this.modo = r?.data?.modo ?? null;
        this.cdr.markForCheck();
      })
      .catch(() => undefined);
  }

  get filtrados(): PerfilFila[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.perfiles;
    return this.perfiles.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.descripcion ?? '').toLowerCase().includes(q),
    );
  }

  async cargar(): Promise<void> {
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      this.perfiles = (await lastValueFrom(this.service.listar()))?.data ?? [];
    } catch {
      this.perfiles = [];
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  onTab(i: number): void {
    this.activeTab = i;
    if (i === 1 && !this.historialCargado) this.cargarHistorial();
    if (i === 2 && !this.bloqueosCargados) this.cargarBloqueos();
  }

  async cargarHistorial(): Promise<void> {
    this.cargandoHistorial = true;
    this.cdr.markForCheck();
    try {
      this.historial =
        (await lastValueFrom(this.service.historial()))?.data ?? [];
      this.historialCargado = true;
    } catch {
      this.historial = [];
    } finally {
      this.cargandoHistorial = false;
      this.cdr.markForCheck();
    }
  }

  async cargarBloqueos(): Promise<void> {
    this.cargandoBloqueos = true;
    this.cdr.markForCheck();
    try {
      this.bloqueos =
        (await lastValueFrom(this.service.bloqueos(this.dias)))?.data ?? [];
      this.bloqueosCargados = true;
    } catch {
      this.bloqueos = [];
    } finally {
      this.cargandoBloqueos = false;
      this.cdr.markForCheck();
    }
  }

  nuevo(): void {
    this.router.navigate(['/admin/perfiles/nuevo']);
  }

  abrir(p: PerfilFila): void {
    this.router.navigate(['/admin/perfiles', p.id]);
  }

  async duplicar(p: PerfilFila, ev: Event): Promise<void> {
    ev.stopPropagation();
    try {
      const res = await lastValueFrom(this.service.duplicar(p.id));
      this.alert.showSuccess(
        'Perfil duplicado',
        `Ajuste "${res.data.perfil.nombre}" y guárdelo.`,
      );
      this.router.navigate(['/admin/perfiles', res.data.perfil.id]);
    } catch {
      /* el interceptor muestra el error */
    }
  }

  confirmarEliminar(p: PerfilFila, ev: Event): void {
    ev.stopPropagation();
    this.confirm.confirm({
      message: `¿Eliminar el perfil <strong>${p.nombre}</strong>?`,
      header: 'Eliminar perfil',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await lastValueFrom(this.service.eliminar(p.id));
          this.alert.showSuccess('Perfil eliminado', '');
          this.cargar();
        } catch {
          /* el interceptor muestra el error */
        }
      },
    });
  }

  /** "Sin submódulo" = la ruta del API no está en el mapa del back: hay que completarlo. */
  descripcionBloqueo(b: BloqueoLog): string {
    return b.clave
      ? b.clave.split(',').join(' o ')
      : 'Ruta sin submódulo asignado';
  }

  verbo(a: string | null): string {
    return (
      { VER: 'Ver', CREAR: 'Crear', EDITAR: 'Editar', ANULAR: 'Anular' }[
        a ?? ''
      ] ?? '—'
    );
  }
}
