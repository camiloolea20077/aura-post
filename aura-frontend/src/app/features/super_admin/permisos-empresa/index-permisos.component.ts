import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { AccordionModule } from 'primeng/accordion';
import { InputSwitchModule } from 'primeng/inputswitch';
import { CheckboxModule } from 'primeng/checkbox';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import { PermisoService } from './services/permiso.service';
import {
  EmpresaPermisos,
  ModuloPermiso,
  SubmoduloPermiso,
  ModuloPermisoUpdate,
} from './models/permiso.model';
import { AlertService } from '../../../shared/pipes/alert.service';

@Component({
  selector: 'app-index-permisos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    ToastModule,
    AccordionModule,
    InputSwitchModule,
    CheckboxModule,
    SkeletonModule,
  ],
  providers: [MessageService],
  templateUrl: './index-permisos.component.html',
  styleUrls: ['./index-permisos.component.scss'],
})
export class IndexPermisosComponent implements OnInit {
  loading = true;
  loadingSave = false;
  permisos: EmpresaPermisos | null = null;
  modulos: ModuloPermiso[] = [];
  empresaId!: number;
  hasChanges = false;
  originalState: string = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly permisoService: PermisoService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit(): Promise<void> {
    this.empresaId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.empresaId) {
      this.router.navigate(['/platform/empresas']);
      return;
    }
    await this.loadPermisos();
  }

  async loadPermisos(): Promise<void> {
    this.loading = true;
    try {
      const res = await lastValueFrom(this.permisoService.getPermisos(this.empresaId));
      this.permisos = res?.data ?? null;
      this.modulos = this.permisos?.modulos ?? [];
      this.originalState = JSON.stringify(this.getPermisosUpdate());
      this.hasChanges = false;
    } catch {
      this.alertService.showError('Error', 'No se pudieron cargar los permisos');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  onModuloChange(modulo: ModuloPermiso): void {
    if (modulo.activo) {
      modulo.submodulos.forEach((s: SubmoduloPermiso) => (s.activo = true));
    } else {
      modulo.submodulos.forEach((s: SubmoduloPermiso) => (s.activo = false));
    }
    this.checkChanges();
    this.cdr.markForCheck();
  }

  onSubmoduloChange(modulo: ModuloPermiso, submodulo: SubmoduloPermiso): void {
    const anyActivo = modulo.submodulos.some((s: SubmoduloPermiso) => s.activo);
    if (!anyActivo && modulo.activo) {
      modulo.activo = false;
    } else if (anyActivo && !modulo.activo) {
      modulo.activo = true;
    }
    this.checkChanges();
    this.cdr.markForCheck();
  }

  isSubmoduloDisabled(modulo: ModuloPermiso): boolean {
    return !modulo.activo;
  }

  private checkChanges(): void {
    const currentState = JSON.stringify(this.getPermisosUpdate());
    this.hasChanges = currentState !== this.originalState;
  }

  private getPermisosUpdate(): ModuloPermisoUpdate[] {
    return this.modulos.map((m) => ({
      moduloId: m.moduloId,
      activo: m.activo,
      submodulos: m.submodulos.map((s) => ({
        submoduloId: s.submoduloId,
        activo: s.activo,
      })),
    }));
  }

  async guardar(): Promise<void> {
    this.loadingSave = true;
    try {
      const dto = { modulos: this.getPermisosUpdate() };
      await lastValueFrom(this.permisoService.updatePermisos(this.empresaId, dto));
      this.alertService.showSuccess('Guardado', 'Permisos actualizados correctamente');
      this.originalState = JSON.stringify(dto.modulos);
      this.hasChanges = false;
    } catch (err: unknown) {
      const message = (err as any)?.error?.message ?? 'No se pudieron guardar los permisos';
      this.alertService.showError('Error', message);
    } finally {
      this.loadingSave = false;
      this.cdr.markForCheck();
    }
  }

  cancelar(): void {
    this.router.navigate(['/platform/empresas']);
  }
}
