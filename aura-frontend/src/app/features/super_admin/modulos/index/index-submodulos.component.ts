import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, Subscription, debounceTime, lastValueFrom } from 'rxjs';

import { SubmoduloModel, SubmoduloTableModel } from '../models/modulo.model';
import { ModuloService } from '../services/modulo.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { FormSubmoduloComponent } from '../form/form-submodulo.component';

/**
 * Submódulos de un módulo, con su grupo (tercer nivel). Búsqueda y paginación
 * en el servidor: antes se traía la lista completa y el paginador repetía filas.
 */
@Component({
  selector: 'app-index-submodulos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ToastModule,
    TooltipModule,
    SkeletonModule,
    DialogModule,
    PaginatorModule,
    ConfirmDialogModule,
    FormSubmoduloComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-submodulos.component.html',
  styleUrls: ['./index-submodulos.component.scss'],
})
export class IndexSubmodulosComponent implements OnInit, OnDestroy {
  moduloId: number | null = null;
  moduloNombre = '';
  rows: SubmoduloTableModel[] = [];
  total = 0;
  cargando = true;
  search = '';
  first = 0;
  filas = 30;

  showForm = false;
  editTarget: SubmoduloModel | null = null;

  private buscar$ = new Subject<void>();
  private sub?: Subscription;

  constructor(
    private readonly service: ModuloService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/platform/modulos']);
      return;
    }
    this.moduloId = id;
    lastValueFrom(this.service.getModuloById(id))
      .then((r) => {
        this.moduloNombre = r?.data?.nombre ?? '';
        this.cdr.markForCheck();
      })
      .catch(() => undefined);
    this.sub = this.buscar$.pipe(debounceTime(350)).subscribe(() => {
      this.first = 0;
      this.cargar();
    });
    this.cargar();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onSearch(): void {
    this.buscar$.next();
  }

  limpiar(): void {
    this.search = '';
    this.first = 0;
    this.cargar();
  }

  onPagina(e: PaginatorState): void {
    this.first = e.first ?? 0;
    this.filas = e.rows ?? this.filas;
    this.cargar();
  }

  async cargar(): Promise<void> {
    if (!this.moduloId) return;
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.pageSubmodulos({
          page: Math.floor(this.first / this.filas),
          rows: this.filas,
          search: this.search.trim() || null,
          params: { moduloId: this.moduloId },
        }),
      );
      this.rows = res?.data?.content ?? [];
      this.total = res?.data?.totalElements ?? 0;
    } catch {
      this.rows = [];
      this.total = 0;
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  nuevo(): void {
    this.editTarget = null;
    this.showForm = true;
  }

  async editar(s: SubmoduloTableModel, ev?: Event): Promise<void> {
    ev?.stopPropagation();
    try {
      const res = await lastValueFrom(this.service.getSubmoduloById(s.id));
      this.editTarget = res?.data ?? null;
      this.showForm = true;
      this.cdr.markForCheck();
    } catch {
      /* el interceptor muestra el error */
    }
  }

  async toggleActivo(s: SubmoduloTableModel, ev: Event): Promise<void> {
    ev.stopPropagation();
    try {
      await lastValueFrom(this.service.updateSubmodulo(s.id, { activo: !s.activo }));
      this.alert.showSuccess(s.activo ? 'Desactivado' : 'Activado', s.nombre);
      this.cargar();
    } catch {
      /* el interceptor muestra el error */
    }
  }

  confirmarEliminar(s: SubmoduloTableModel, ev: Event): void {
    ev.stopPropagation();
    this.confirm.confirm({
      message: `¿Eliminar <strong>${s.nombre}</strong>? Las empresas que lo tengan dejarán de verlo.`,
      header: 'Eliminar submódulo',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await lastValueFrom(this.service.deleteSubmodulo(s.id));
          this.alert.showSuccess('Eliminado', s.nombre);
          this.cargar();
        } catch {
          /* el interceptor muestra el error */
        }
      },
    });
  }

  onSaved(): void {
    this.showForm = false;
    this.editTarget = null;
    this.cargar();
  }

  volver(): void {
    this.router.navigate(['/platform/modulos']);
  }
}
