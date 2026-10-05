import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../shared/pipes/alert.service';
import { PermisoService } from './services/permiso.service';
import { EmpresaPermisos, ModuloPermisoUpdate } from './models/permiso.model';
import { ArbolModulosComponent } from '../shared/arbol-modulos/arbol-modulos.component';

/**
 * Módulos y submódulos que tiene una empresa (lo contratado). Lo que aquí se
 * apaga no lo ve ningún usuario de la empresa, sin importar su perfil.
 */
@Component({
  selector: 'app-index-permisos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ButtonModule, SkeletonModule, ToastModule, ArbolModulosComponent],
  providers: [MessageService],
  templateUrl: './index-permisos.component.html',
  styleUrls: ['./index-permisos.component.scss'],
})
export class IndexPermisosComponent implements OnInit {
  empresaId!: number;
  cargando = true;
  guardando = false;
  permisos: EmpresaPermisos | null = null;
  seleccion: number[] = [];
  private original = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: PermisoService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  get hayCambios(): boolean {
    return JSON.stringify([...this.seleccion].sort((a, b) => a - b)) !== this.original;
  }

  async ngOnInit(): Promise<void> {
    this.empresaId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.empresaId) {
      this.router.navigate(['/platform/empresas']);
      return;
    }
    await this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.getPermisos(this.empresaId));
      this.permisos = res?.data ?? null;
      this.seleccion = (this.permisos?.modulos ?? []).flatMap((m) =>
        m.submodulos.filter((s) => s.activo).map((s) => s.submoduloId),
      );
      this.original = JSON.stringify([...this.seleccion].sort((a, b) => a - b));
    } catch {
      this.permisos = null;
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  onSeleccion(ids: number[]): void {
    this.seleccion = ids;
  }

  async guardar(): Promise<void> {
    if (!this.permisos) return;
    const activos = new Set(this.seleccion);
    // El back activa el módulo si tiene algo y los grupos de las pantallas activas.
    const modulos: ModuloPermisoUpdate[] = this.permisos.modulos.map((m) => {
      const submodulos = m.submodulos.map((s) => ({ submoduloId: s.submoduloId, activo: activos.has(s.submoduloId) }));
      return { moduloId: m.moduloId, activo: submodulos.some((s) => s.activo), submodulos };
    });
    this.guardando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.updatePermisos(this.empresaId, { modulos }));
      this.alert.showSuccess('Módulos guardados', 'Los usuarios de la empresa lo verán al recargar.');
      if (res?.data) {
        this.permisos = res.data;
        this.seleccion = res.data.modulos.flatMap((m: any) =>
          m.submodulos.filter((s: any) => s.activo).map((s: any) => s.submoduloId),
        );
      }
      this.original = JSON.stringify([...this.seleccion].sort((a, b) => a - b));
    } catch {
      /* el interceptor muestra el error */
    } finally {
      this.guardando = false;
      this.cdr.markForCheck();
    }
  }

  volver(): void {
    this.router.navigate(['/platform/empresas']);
  }
}
