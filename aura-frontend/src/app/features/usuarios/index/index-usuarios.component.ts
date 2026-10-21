import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { MessageService, ConfirmationService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import { UsuarioTableModel } from '../../../core/models/usuario.model';
import { UsuarioService } from '../../../core/services/usuario.service';
import { AlertService } from '../../../shared/pipes/alert.service';

import { PuedeDirective } from '../../../shared/directives/puede.directive';
import { Router } from '@angular/router';
import {
  AccesoFirma,
  FirmaContableService,
  FirmaEncontrada,
  SolicitudFirma,
} from '../../../core/services/firma-contable.service';
import { IndexDBService } from '../../../core/services/index-db.service';
import { EmpresaService } from '../../../core/services/empresa.service';

@Component({
  selector: 'app-index-usuarios',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ToastModule,
    TooltipModule,
    SkeletonModule,
    ConfirmDialogModule,

    PuedeDirective,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-usuarios.component.html',
  styleUrls: ['./index-usuarios.component.scss'],
})
export class IndexUsuariosComponent implements OnInit {
  rows: UsuarioTableModel[] = [];
  totalRows = 0;
  loadingTable = true;
  search = '';
  rowSize = 15;
  lastEvent!: TableLazyLoadEvent;

  // ── Firma contable con acceso a esta empresa (PLAN_FIRMA_CONTABLE F5) ──
  accesoFirma: AccesoFirma | null = null;
  quitandoAcceso = false;
  esAdmin = false;
  /** Esta empresa es una firma contable: no pide firma, administra sus clientes. */
  esFirma = false;
  clientesFirma = 0;
  gestionadosFirma = 0;
  cupoFirma = 0;

  // ── Solicitar una firma contable (PLAN_FIRMA_CONTABLE §9) ──
  solicitud: SolicitudFirma | null = null;
  pidiendoFirma = false;
  nitFirma = '';
  firmaEncontrada: FirmaEncontrada | null = null;
  buscandoFirma = false;
  enviandoSolicitud = false;

  get solicitudPendiente(): boolean {
    return this.solicitud?.estado === 'PENDIENTE';
  }

  /** Rechazada hace menos de 7 días: se le muestra el aviso. */
  get rechazoReciente(): boolean {
    const s = this.solicitud;
    if (!s || s.estado !== 'RECHAZADA' || !s.respondidoAt) return false;
    return Date.now() - new Date(s.respondidoAt).getTime() < 7 * 86_400_000;
  }

  constructor(
    private readonly firmaService: FirmaContableService,
    private readonly indexDB: IndexDBService,
    private readonly empresaService: EmpresaService,
    private readonly usuarioService: UsuarioService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router,
  ) {}

  /** Perfil y excepciones del usuario (docs/PLAN_PERMISOS.md). */
  permisos(id: number): void {
    this.router.navigate(['/admin/usuarios', id], {
      queryParams: { tab: 'permisos' },
    });
  }

  ngOnInit(): void {
    void this.cargarAccesoFirma();
  }

  /** Solo el administrador la ve y la puede quitar (el back lo exige igual). */
  private async cargarAccesoFirma(): Promise<void> {
    const auth = await this.indexDB.loadDataAuthDB();
    const r = (auth?.rol || '').toUpperCase();
    if (r !== 'ADMIN' && r !== 'SUPER_ADMIN') return;
    // Usuario de una firma trabajando aquí (cliente gestionado): esto no es para él.
    if (auth?.firmaNombre) return;
    this.esAdmin = true;
    try {
      // Se pregunta al back: la sesión guardada puede ser de antes de existir el dato.
      const cfg = await lastValueFrom(this.empresaService.getConfig());
      if (cfg?.data?.esFirmaContable) {
        this.esFirma = true;
        const r = await lastValueFrom(this.firmaService.resumen());
        this.clientesFirma = r?.data?.clientes?.length ?? 0;
        this.gestionadosFirma = r?.data?.gestionados ?? 0;
        this.cupoFirma = r?.data?.cupo ?? 0;
        this.cdr.markForCheck();
        return;
      }
      const res = await lastValueFrom(this.firmaService.acceso());
      this.accesoFirma = res?.data ?? null;
      if (!this.accesoFirma) {
        const sol = await lastValueFrom(this.firmaService.miSolicitud());
        this.solicitud = sol?.data ?? null;
      }
    } catch {
      this.accesoFirma = null;
    }
    this.cdr.markForCheck();
  }

  irAClientesFirma(): void {
    this.router.navigate(['/firma/clientes']);
  }

  async buscarFirma(): Promise<void> {
    const nit = this.nitFirma.replace(/\D/g, '');
    if (nit.length < 5) {
      this.alertService.showError('NIT', 'Escriba el NIT de la firma contable.');
      return;
    }
    this.buscandoFirma = true;
    this.firmaEncontrada = null;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.firmaService.buscarFirma(nit));
      this.firmaEncontrada = res?.data ?? null;
    } catch (err: any) {
      this.alertService.showError('No encontrada', err?.error?.message ?? 'No hay una firma contable en Aura con ese NIT.');
    } finally {
      this.buscandoFirma = false;
      this.cdr.markForCheck();
    }
  }

  async enviarSolicitud(): Promise<void> {
    if (!this.firmaEncontrada) return;
    this.enviandoSolicitud = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.firmaService.solicitar(this.firmaEncontrada.id));
      this.solicitud = res?.data ?? null;
      this.pidiendoFirma = false;
      this.firmaEncontrada = null;
      this.nitFirma = '';
      this.alertService.showSuccess('Solicitud enviada', 'Le avisaremos cuando la firma responda.');
    } catch (err: any) {
      this.alertService.showError('No se pudo enviar', err?.error?.message ?? 'Intente de nuevo.');
    } finally {
      this.enviandoSolicitud = false;
      this.cdr.markForCheck();
    }
  }

  async cancelarSolicitud(): Promise<void> {
    try {
      await lastValueFrom(this.firmaService.cancelarSolicitud());
      this.solicitud = null;
      this.alertService.showSuccess('Solicitud cancelada', 'Puede solicitar otra firma cuando quiera.');
    } catch (err: any) {
      this.alertService.showError('No se pudo cancelar', err?.error?.message ?? 'Intente de nuevo.');
    }
    this.cdr.markForCheck();
  }

  nombresAcceso(a: AccesoFirma): string {
    return a.usuarios.map((u) => u.nombre || u.username).join(', ');
  }

  confirmarQuitarAcceso(event: Event): void {
    if (!this.accesoFirma) return;
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      header: 'Quitar acceso de la firma contable',
      message: `${this.accesoFirma.firma.firmaNombre} dejará de entrar a esta empresa y sus sesiones abiertas aquí se`
        + ' cerrarán. Para volver a darle acceso, comuníquese con Aura.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Quitar acceso',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => void this.quitarAcceso(),
    });
  }

  private async quitarAcceso(): Promise<void> {
    this.quitandoAcceso = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(this.firmaService.quitarAcceso());
      this.alertService.showSuccess('Acceso quitado', 'La firma contable ya no puede entrar a esta empresa.');
      this.accesoFirma = null;
      this.solicitud = null;
    } catch (err: any) {
      this.alertService.showError('No se pudo quitar el acceso', err?.error?.message ?? 'Intente de nuevo.');
    } finally {
      this.quitandoAcceso = false;
      this.cdr.markForCheck();
    }
  }

  async loadTable(event: TableLazyLoadEvent): Promise<void> {
    this.lastEvent = event;
    this.loadingTable = true;
    const page =
      event.first != null && event.rows
        ? Math.floor(event.first / event.rows)
        : 0;
    const sortField = Array.isArray(event.sortField)
      ? event.sortField[0]
      : event.sortField;

    try {
      const res = await lastValueFrom(
        this.usuarioService.page({
          page,
          rows: event.rows ?? this.rowSize,
          search: this.search || null,
          order_by: sortField ?? 'id',
          order: event.sortOrder === 1 ? 'ASC' : 'DESC',
        }),
      );
      this.rows = res?.data?.content ?? [];
      this.totalRows = res?.data?.totalElements ?? 0;
    } catch (err: any) {
      if (err?.status !== 206)
        this.alertService.showError(
          'Error',
          'No se pudieron cargar los usuarios',
        );
      this.rows = [];
      this.totalRows = 0;
    } finally {
      this.loadingTable = false;
      this.cdr.markForCheck();
    }
  }

  onSearch(): void {
    if (this.lastEvent) this.loadTable({ ...this.lastEvent, first: 0 });
  }
  clearSearch(): void {
    this.search = '';
    this.onSearch();
  }
  private reloadTable(): void {
    if (this.lastEvent) this.loadTable(this.lastEvent);
  }

  // ── CRUD ──────────────────────────────────────────────────
  // El usuario se crea y edita en su propia página con pestañas.
  nuevo(): void {
    this.router.navigate(['/admin/usuarios/nuevo']);
  }

  editar(id: number): void {
    this.router.navigate(['/admin/usuarios', id]);
  }

  confirmarDesactivar(item: UsuarioTableModel, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `¿Desactivar al usuario <strong>${item.username}</strong>?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.desactivar(item.id),
    });
  }

  private async desactivar(id: number): Promise<void> {
    try {
      await lastValueFrom(this.usuarioService.desactivar(id));
      this.alertService.showSuccess('Desactivado', 'Usuario desactivado');
      this.reloadTable();
    } catch {
      this.alertService.showError('Error', 'No se pudo desactivar');
    }
  }


  // ── Helpers UI ────────────────────────────────────────────
  getRolSeverity(rol: string): 'info' | 'warn' | 'success' | 'secondary' {
    switch (rol) {
      case 'SUPER_ADMIN':
        return 'success';
      case 'ADMIN':
        return 'info';
      case 'SUPERVISOR':
        return 'warn';
      default:
        return 'secondary'; // CAJERO
    }
  }

  getActivaSeverity(activo: boolean): 'success' | 'secondary' {
    return activo ? 'success' : 'secondary';
  }
}
