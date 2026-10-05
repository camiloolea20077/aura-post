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
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, Subscription, debounceTime, lastValueFrom } from 'rxjs';

import { EmpresaTableModel } from '../../../core/models/platform.model';
import { PlatformService } from '../../../core/services/platform.service';
import { AlertService } from '../../../shared/pipes/alert.service';

/** Empresas clientes del sistema: búsqueda y paginación en el servidor. */
@Component({
  selector: 'app-index-empresas',
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
    PaginatorModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-empresas.component.html',
  styleUrls: ['./index-empresas.component.scss'],
})
export class IndexEmpresasComponent implements OnInit, OnDestroy {
  rows: EmpresaTableModel[] = [];
  total = 0;
  cargando = true;
  search = '';
  first = 0;
  filas = 15;

  private buscar$ = new Subject<void>();
  private sub?: Subscription;

  constructor(
    private readonly service: PlatformService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Espera a que deje de escribir: no consulta en cada tecla.
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
        this.service.page({
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

  nueva(): void {
    this.router.navigate(['/platform/empresas/nueva']);
  }

  editar(e: EmpresaTableModel): void {
    this.router.navigate(['/platform/empresas', e.id, 'editar']);
  }

  modulos(e: EmpresaTableModel, ev: Event): void {
    ev.stopPropagation();
    this.router.navigate(['/platform/permisos', e.id]);
  }

  confirmarSuspender(e: EmpresaTableModel, ev: Event): void {
    ev.stopPropagation();
    this.confirm.confirm({
      message: `¿Suspender <strong>${e.razonSocial}</strong>? Sus usuarios no podrán entrar.`,
      header: 'Suspender empresa',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, suspender',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await lastValueFrom(this.service.suspender(e.id));
          this.alert.showSuccess('Suspendida', e.razonSocial);
          this.cargar();
        } catch {
          /* el interceptor muestra el error */
        }
      },
    });
  }

  async activar(e: EmpresaTableModel, ev: Event): Promise<void> {
    ev.stopPropagation();
    try {
      await lastValueFrom(this.service.activar(e.id));
      this.alert.showSuccess('Activada', e.razonSocial);
      this.cargar();
    } catch {
      /* el interceptor muestra el error */
    }
  }
}
