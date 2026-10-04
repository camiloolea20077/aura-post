import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import {
  AccionEspecial,
  EspecialValor,
  NodoArbol,
  PerfilFila,
  Permiso,
} from '../../../core/models/permisos.model';
import { PermisosService } from '../../../core/services/permisos.service';
import { StateStore } from '../../../core/store/state';
import { AlertService } from '../../../shared/pipes/alert.service';
import { MatrizPermisosComponent } from '../../../shared/components/matriz-permisos/matriz-permisos.component';
import { AccionesEspecialesComponent } from '../../../shared/components/acciones-especiales/acciones-especiales.component';

/** Crear o editar un perfil de permisos (docs/PLAN_PERMISOS.md, fase P1). */
@Component({
  selector: 'app-form-perfil',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SkeletonModule,
    TagModule,
    ToastModule,
    MatrizPermisosComponent,
    AccionesEspecialesComponent,
  ],
  providers: [MessageService],
  templateUrl: './form-perfil.component.html',
  styleUrls: ['./form-perfil.component.scss'],
})
export class FormPerfilComponent implements OnInit {
  id: number | null = null;
  cargando = true;
  guardando = false;

  arbol: NodoArbol[] = [];
  perfil: PerfilFila | null = null;
  nombre = '';
  descripcion = '';
  accesoTotal = false;
  activo = true;
  permisos: Permiso[] = [];
  // Segunda etapa (V192): acciones especiales, límites y sedes.
  catalogo: AccionEspecial[] = [];
  especiales: EspecialValor[] = [];
  descuentoMaxPct: number | null = null;
  rebajaPrecioMaxPct: number | null = null;
  todasSedes = true;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: PermisosService,
    readonly store: StateStore,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  /** El Administrador da todo y no se edita; tampoco sin permiso de editar. */
  get soloLectura(): boolean {
    if (this.perfil?.codigo === 'ADMINISTRADOR') return true;
    return !this.store.puede('caja.perfiles', this.id ? 'EDITAR' : 'CREAR');
  }

  get esAdministrador(): boolean {
    return this.perfil?.codigo === 'ADMINISTRADOR';
  }

  /** Solo quien tiene acceso total puede marcar o quitar el acceso total. */
  get puedeAccesoTotal(): boolean {
    return !!this.store.permisos()?.accesoTotal;
  }

  ngOnInit(): void {
    // Al duplicar o crear se navega a otro id con el mismo componente: se recarga por la ruta.
    this.route.paramMap.subscribe((pm) => {
      const param = pm.get('id');
      this.cargar(param && param !== 'nuevo' ? Number(param) : null);
    });
  }

  private async cargar(id: number | null): Promise<void> {
    this.id = id;
    this.cargando = true;
    this.perfil = null;
    this.nombre = '';
    this.descripcion = '';
    this.accesoTotal = false;
    this.activo = true;
    this.permisos = [];
    this.especiales = [];
    this.descuentoMaxPct = null;
    this.rebajaPrecioMaxPct = null;
    this.todasSedes = true;
    this.cdr.markForCheck();
    try {
      if (!this.arbol.length) {
        this.arbol = (await lastValueFrom(this.service.arbol()))?.data ?? [];
      }
      if (!this.catalogo.length) {
        this.catalogo =
          (await lastValueFrom(this.service.especiales()))?.data ?? [];
      }
      if (this.id) {
        const d = (await lastValueFrom(this.service.detalle(this.id)))?.data;
        if (d) {
          this.perfil = d.perfil;
          this.nombre = d.perfil.nombre;
          this.descripcion = d.perfil.descripcion ?? '';
          this.accesoTotal = d.perfil.accesoTotal;
          this.activo = d.perfil.activo;
          this.permisos = d.permisos;
          this.especiales = d.especiales ?? [];
          this.descuentoMaxPct = d.perfil.descuentoMaxPct;
          this.rebajaPrecioMaxPct = d.perfil.rebajaPrecioMaxPct;
          this.todasSedes = d.perfil.todasSedes ?? true;
        }
      }
    } catch {
      /* el interceptor muestra el error */
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  setAccesoTotal(v: boolean): void {
    if (this.soloLectura || !this.puedeAccesoTotal) return;
    this.accesoTotal = v;
  }

  setActivo(v: boolean): void {
    if (this.soloLectura || this.perfil?.esSistema) return;
    this.activo = v;
  }

  onPermisos(p: Permiso[]): void {
    this.permisos = p;
  }

  onEspeciales(v: EspecialValor[]): void {
    this.especiales = v;
  }

  setTodasSedes(v: boolean): void {
    if (this.soloLectura) return;
    this.todasSedes = v;
  }

  /** Submódulos que el perfil ve: sin ver la pantalla no hay acción especial. */
  get visibles(): Set<number> {
    return new Set(
      this.permisos.filter((p) => p.ver).map((p) => p.submoduloId),
    );
  }

  /** Lo que daría cada acción especial sin valor explícito: su acción base. */
  get baseEspeciales(): Record<number, boolean> {
    const r: Record<number, boolean> = {};
    for (const a of this.catalogo) {
      const p = this.permisos.find((x) => x.submoduloId === a.submoduloId);
      const accion = a.heredaDe?.toLowerCase() as keyof Permiso | undefined;
      r[a.id] = !!p && !!accion && p[accion] === true;
    }
    return r;
  }

  get contadorPantallas(): number {
    return this.permisos.filter(
      (p) =>
        p.ver &&
        !this.arbol.find((n) => n.submoduloId === p.submoduloId)?.esGrupo,
    ).length;
  }

  async guardar(): Promise<void> {
    if (this.soloLectura) return;
    if (!this.nombre.trim()) {
      this.alert.showError(
        'Falta el nombre',
        'Escriba un nombre para el perfil.',
      );
      return;
    }
    this.guardando = true;
    this.cdr.markForCheck();
    const dto = {
      nombre: this.nombre.trim(),
      descripcion: this.descripcion.trim() || null,
      accesoTotal: this.accesoTotal,
      activo: this.activo,
      permisos: this.accesoTotal ? [] : this.permisos,
      especiales: this.accesoTotal ? [] : this.especiales,
      descuentoMaxPct: this.accesoTotal ? null : this.descuentoMaxPct,
      rebajaPrecioMaxPct: this.accesoTotal ? null : this.rebajaPrecioMaxPct,
      todasSedes: this.accesoTotal ? true : this.todasSedes,
    };
    try {
      const res = this.id
        ? await lastValueFrom(this.service.actualizar(this.id, dto))
        : await lastValueFrom(this.service.crear(dto));
      this.alert.showSuccess(
        'Perfil guardado',
        'Los usuarios con este perfil lo verán al recargar.',
      );
      // Si el perfil es el del propio usuario, su menú cambia.
      this.store.updateMenuGroups();
      if (!this.id && res?.data?.perfil?.id) {
        this.router.navigate(['/admin/perfiles', res.data.perfil.id], {
          replaceUrl: true,
        });
        return;
      }
      if (res?.data) {
        this.perfil = res.data.perfil;
        this.permisos = res.data.permisos;
        this.especiales = res.data.especiales ?? [];
      }
    } catch {
      /* el interceptor muestra el error */
    } finally {
      this.guardando = false;
      this.cdr.markForCheck();
    }
  }

  async duplicar(): Promise<void> {
    if (!this.id) return;
    try {
      const res = await lastValueFrom(this.service.duplicar(this.id));
      this.alert.showSuccess('Perfil duplicado', 'Ajuste la copia y guárdela.');
      this.router.navigate(['/admin/perfiles', res.data.perfil.id]);
    } catch {
      /* el interceptor muestra el error */
    }
  }

  volver(): void {
    this.router.navigate(['/admin/perfiles']);
  }
}
