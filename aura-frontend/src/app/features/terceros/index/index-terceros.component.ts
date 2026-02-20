import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmationService, MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { FormTerceroComponent } from '../form/form-tercero.component';
import {
  TerceroPageableDto,
  TerceroTableModel,
} from '../../../core/models/tercero.model';
import { TerceroService } from '../../../core/services/tercero.service';
import { AlertService } from '../../../shared/pipes/alert.service';

type FiltroRol = 'TODOS' | 'CLIENTES' | 'PROVEEDORES' | 'EMPLEADOS';

@Component({
  selector: 'app-index-terceros',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ChipModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    SkeletonModule,
    DropdownModule,
    FormTerceroComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-terceros.component.html',
  styleUrls: ['./index-terceros.component.scss'],
})
export class IndexTercerosComponent implements OnInit {
  public showModal = false;
  public selectedId: number | null = null;
  public modalSlug = 'create';

  public items: TerceroTableModel[] = [];
  public loadingTable = true;
  public totalRecords = 0;
  public rowSize = 15;
  public searchQuery = '';
  public filtroRol: FiltroRol = 'TODOS';
  public lastLazyEvent!: TableLazyLoadEvent;

  public filtroOpts: { label: string; value: FiltroRol }[] = [
    { label: 'Todos', value: 'TODOS' },
    { label: 'Clientes', value: 'CLIENTES' },
    { label: 'Proveedores', value: 'PROVEEDORES' },
    { label: 'Empleados', value: 'EMPLEADOS' },
  ];
  constructor(
    private readonly terceroService: TerceroService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {}

  async loadTable(event: TableLazyLoadEvent): Promise<void> {
    this.lastLazyEvent = event;
    this.loadingTable = true;
    const page =
      event.first != null && event.rows
        ? Math.floor(event.first / event.rows)
        : 0;
    const sortField = Array.isArray(event.sortField)
      ? event.sortField[0]
      : event.sortField;

    const dto: TerceroPageableDto = {
      page,
      rows: event.rows ?? this.rowSize,
      search: this.searchQuery || null,
      order_by: sortField ?? 't.id',
      order: event.sortOrder === 1 ? 'ASC' : 'DESC',
    };

    try {
      const res = await lastValueFrom(this.terceroService.page(dto));
      let items: TerceroTableModel[] = res?.data?.content ?? [];

      // Filtro rol — se hace en cliente porque la API no tiene ese parámetro
      if (this.filtroRol === 'CLIENTES')
        items = items.filter((i) => i.esCliente);
      if (this.filtroRol === 'PROVEEDORES')
        items = items.filter((i) => i.esProveedor);
      if (this.filtroRol === 'EMPLEADOS')
        items = items.filter((i) => i.esEmpleado);

      this.items = items;
      this.totalRecords = res?.data?.totalElements ?? 0;
    } catch (err: any) {
      if (err?.status !== 206)
        this.alertService.showError(
          'Error',
          'No se pudieron cargar los terceros.',
        );
      this.items = [];
      this.totalRecords = 0;
    } finally {
      this.loadingTable = false;
    }
  }

  onSearch(): void {
    if (this.lastLazyEvent) this.loadTable({ ...this.lastLazyEvent, first: 0 });
  }
  clearSearch(): void {
    this.searchQuery = '';
    this.onSearch();
  }
  onFiltroChange(): void {
    this.onSearch();
  }

  openCreate(): void {
    this.selectedId = null;
    this.modalSlug = 'create';
    this.showModal = true;
  }
  openEdit(item: TerceroTableModel): void {
    this.selectedId = item.id;
    this.modalSlug = 'edit';
    this.showModal = true;
  }
  onModalClosed(): void {
    this.showModal = false;
  }
  onItemSaved(): void {
    this.showModal = false;
    this.reloadTable();
  }
  private reloadTable(): void {
    if (this.lastLazyEvent) this.loadTable(this.lastLazyEvent);
  }

  // ─── UI helpers ───────────────────────────────────────────
  getDocLabel(item: TerceroTableModel): string {
    return `${item.tipoDocumento} ${item.numeroDocumento}`;
  }

  getInitial(nombre: string): string {
    return nombre.charAt(0).toUpperCase();
  }

  getRoles(item: TerceroTableModel): string[] {
    const roles: string[] = [];
    if (item.esCliente) roles.push('Cliente');
    if (item.esProveedor) roles.push('Proveedor');
    if (item.esEmpleado) roles.push('Empleado');
    return roles;
  }

  getRolClass(rol: string): string {
    return (
      {
        Cliente: 'rol-cliente',
        Proveedor: 'rol-proveedor',
        Empleado: 'rol-empleado',
      }[rol] ?? ''
    );
  }

  // ─── Eliminar ─────────────────────────────────────────────
  confirmDelete(item: TerceroTableModel): void {
    this.confirmationService.confirm({
      message: `¿Desactivar a <strong>${item.nombreCompleto}</strong>?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await lastValueFrom(this.terceroService.delete(item.id));
          this.alertService.showSuccess('Tercero eliminado', '');
          this.reloadTable();
        } catch (err: any) {
          this.alertService.showError(
            'Error',
            err?.message ?? 'No se pudo eliminar.',
          );
        }
      },
    });
  }
}
