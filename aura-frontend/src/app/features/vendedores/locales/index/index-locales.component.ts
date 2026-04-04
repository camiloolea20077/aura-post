import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../../shared/pipes/alert.service';
import { FormLocalComponent } from '../form/form-local.component';
import { LocalTableModel } from '../../models/vendedor.model';
import { LocalService } from '../services/local.service';
import { VendedorService } from '../../services/vendedor.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-index-locales',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    TagModule,
    TooltipModule,
    DropdownModule,
    ConfirmDialogModule,
    ToastModule,
    DialogModule,
    FormLocalComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './index-locales.component.html',
  styleUrls: ['./index-locales.component.scss'],
})
export class IndexLocalesComponent implements OnInit {
  rows: LocalTableModel[] = [];
  totalRows = 0;
  loading = true;
  search = '';
  page = 0;
  pageSize = 10;

  showForm = false;
  selectedLocal: LocalTableModel | null = null;

  showAsignarVendedor = false;
  localParaAsignar: LocalTableModel | null = null;
  vendedores: { label: string; value: number }[] = [];
  selectedVendedorId: number | null = null;
  savingVendedor = false;

  filtroVendedor: number | null = null;
  filtroActivo: boolean | null = null;
  opcionesActivo = [
    { label: 'Todos', value: null },
    { label: 'Activos', value: true },
    { label: 'Inactivos', value: false },
  ];

  private activatedRoute = inject(ActivatedRoute);

  constructor(
    private readonly service: LocalService,
    private readonly vendedorService: VendedorService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const vendedorId =
      this.activatedRoute.snapshot.queryParamMap.get('vendedorId');

    if (vendedorId) {
      this.filtroVendedor = Number(vendedorId);
    }

    this.load();
    this.loadVendedores();
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      const res = await lastValueFrom(
        this.service.page({
          page: this.page,
          rows: this.pageSize,
          search: this.search || null,
          params: {
            vendedorActualId: this.filtroVendedor,
            activo: this.filtroActivo,
          },
        }),
      );
      this.rows = res?.data?.content ?? [];
      this.totalRows = res?.data?.totalElements ?? 0;
    } catch {
      this.rows = [];
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  onPage(e: any): void {
    this.page = e.first / e.rows;
    this.pageSize = e.rows;
    this.load();
  }

  onSearch(): void {
    this.page = 0;
    this.load();
  }

  nuevo(): void {
    this.selectedLocal = null;
    this.showForm = true;
  }

  onSaved(): void {
    this.showForm = false;
    this.selectedLocal = null;
    this.load();
  }

  editLocal(local: LocalTableModel): void {
    this.selectedLocal = local;
    this.showForm = true;
  }

  onFormClosed(): void {
    this.showForm = false;
    this.selectedLocal = null;
  }

  confirmDelete(local: LocalTableModel): void {
    this.confirm.confirm({
      message: `¿Eliminar el local <b>${local.nombre}</b>?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.delete(local.id),
    });
  }

  async delete(id: number): Promise<void> {
    try {
      await lastValueFrom(this.service.delete(id));
      this.alert.showSuccess('Eliminado', 'Local eliminado correctamente');
      this.load();
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudo eliminar',
      );
    }
  }

  getSeverity(activo: boolean): 'success' | 'danger' {
    return activo ? 'success' : 'danger';
  }

  async abrirAsignarVendedor(local: LocalTableModel): Promise<void> {
    this.localParaAsignar = local;
    this.selectedVendedorId = null;
    this.showAsignarVendedor = true;
  }

  async loadVendedores(): Promise<void> {
    try {
      const res = await lastValueFrom(this.vendedorService.getAllVendedores());
      this.vendedores =
        res?.data?.map((v: any) => ({
          label: `${v.nombres} ${v.apellidos}`,
          value: v.id,
        })) ?? [];
    } catch {
      this.vendedores = [];
    }
  }

  async asignarVendedor(): Promise<void> {
    if (!this.localParaAsignar || this.selectedVendedorId === null) return;

    this.savingVendedor = true;
    try {
      await lastValueFrom(
        this.service.asignarVendedor(
          this.localParaAsignar.id,
          this.selectedVendedorId,
        ),
      );
      this.alert.showSuccess('Asignado', 'Vendedor asignado correctamente');
      this.showAsignarVendedor = false;
      this.localParaAsignar = null;
      this.load();
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudo asignar el vendedor',
      );
    } finally {
      this.savingVendedor = false;
    }
  }
}
