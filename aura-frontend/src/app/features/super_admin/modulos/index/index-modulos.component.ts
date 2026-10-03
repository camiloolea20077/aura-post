import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
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

import { ModuloModel, ModuloTableModel } from '../models/modulo.model';
import { ModuloService } from '../services/modulo.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { FormModuloComponent } from '../form/form-modulo.component';

/** Catálogo de módulos del sistema (lo que se le puede dar a una empresa). */
@Component({
  selector: 'app-index-modulos',
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
    FormModuloComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-modulos.component.html',
  styleUrls: ['./index-modulos.component.scss'],
})
export class IndexModulosComponent implements OnInit, OnDestroy {
  rows: ModuloTableModel[] = [];
  total = 0;
  cargando = true;
  search = '';
  first = 0;
  filas = 15;

  showForm = false;
  editTarget: ModuloModel | null = null;

  private buscar$ = new Subject<void>();
  private sub?: Subscription;

  constructor(
    private readonly service: ModuloService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
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
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.pageModulos({
          page: Math.floor(this.first / this.filas),
          rows: this.filas,
          search: this.search.trim() || null,
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

  async editar(m: ModuloTableModel, ev?: Event): Promise<void> {
    ev?.stopPropagation();
    try {
      const res = await lastValueFrom(this.service.getModuloById(m.id));
      this.editTarget = res?.data ?? null;
      this.showForm = true;
      this.cdr.markForCheck();
    } catch {
      /* el interceptor muestra el error */
    }
  }

  submodulos(m: ModuloTableModel): void {
    this.router.navigate(['/platform/modulos', m.id, 'submodulos']);
  }

  async toggleActivo(m: ModuloTableModel, ev: Event): Promise<void> {
    ev.stopPropagation();
    try {
      await lastValueFrom(this.service.updateModulo(m.id, { activo: !m.activo }));
      this.alert.showSuccess(m.activo ? 'Desactivado' : 'Activado', m.nombre);
      this.cargar();
    } catch {
      /* el interceptor muestra el error */
    }
  }

  confirmarEliminar(m: ModuloTableModel, ev: Event): void {
    ev.stopPropagation();
    this.confirm.confirm({
      message: `¿Eliminar <strong>${m.nombre}</strong>? Se eliminan también sus submódulos.`,
      header: 'Eliminar módulo',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await lastValueFrom(this.service.deleteModulo(m.id));
          this.alert.showSuccess('Eliminado', m.nombre);
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
}
