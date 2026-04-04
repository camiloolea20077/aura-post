import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { FormEmpleadoComponent } from '../form/form-empleado.component';
import { FormTipoEmpleadoComponent } from '../../../configuracion/tipos-empleado/form/form-tipo-empleado.component';
import { NominaService } from '../../../../core/services/nomina.service';
import {
  EmpleadoModel,
  EmpleadoTableModel,
  NominaPageableDto,
} from '../../../../core/models/nomina.model';
import { AlertService } from '../../../../shared/pipes/alert.service';

@Component({
  selector: 'app-index-empleados',
  standalone: true,
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
    FormEmpleadoComponent,
    FormTipoEmpleadoComponent,
  ],
  providers: [MessageService],
  templateUrl: './index-empleados.component.html',
  styleUrls: ['./index-empleados.component.scss'],
})
export class IndexEmpleadosComponent implements OnInit {
  public showFormModal = false;
  public selectedEmpleado: EmpleadoModel | null = null;
  public showTipoEmpleadoModal = false;

  public items: EmpleadoTableModel[] = [];
  public loadingTable = true;
  public totalRecords = 0;
  public rowSize = 15;
  public searchQuery = '';
  public lastLazyEvent!: TableLazyLoadEvent;

  constructor(
    private readonly nominaService: NominaService,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit(): void {}

  async loadTable(event: TableLazyLoadEvent): Promise<void> {
    this.lastLazyEvent = event;
    this.loadingTable = true;
    const page =
      event.first != null && event.rows
        ? Math.floor(event.first / event.rows)
        : 0;

    const dto: NominaPageableDto = {
      page,
      rows: event.rows ?? this.rowSize,
      search: this.searchQuery || null,
      order_by: 'e.id',
      order: 'DESC',
    };

    try {
      const res = await lastValueFrom(this.nominaService.pageEmpleados(dto));
      this.items = res?.data?.content ?? [];
      this.totalRecords = res?.data?.totalElements ?? 0;
    } catch (err: any) {
      if (err?.status !== 206)
        this.alertService.showError(
          'Error',
          'No se pudieron cargar los empleados',
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
  private reloadTable(): void {
    if (this.lastLazyEvent) this.loadTable(this.lastLazyEvent);
  }

  openForm(): void {
    this.selectedEmpleado = null;
    this.showFormModal = true;
  }

  editEmpleado(item: EmpleadoTableModel): void {
    this.nominaService.getEmpleadoById(item.id).subscribe({
      next: (res) => {
        this.selectedEmpleado = res?.data ?? null;
        this.showFormModal = true;
      },
      error: () =>
        this.alertService.showError('Error', 'No se pudo cargar el empleado'),
    });
  }

  async retirarEmpleado(item: EmpleadoTableModel): Promise<void> {
    if (!confirm(`¿Retirar a ${item.nombreCompleto}?`)) return;
    try {
      await lastValueFrom(this.nominaService.retirarEmpleado(item.id));
      this.alertService.showSuccess(
        'Retirado',
        'Empleado retirado correctamente',
      );
      this.reloadTable();
    } catch {
      this.alertService.showError('Error', 'No se pudo retirar el empleado');
    }
  }

  onFormClosed(): void {
    this.showFormModal = false;
    this.selectedEmpleado = null;
  }
  onEmpleadoSaved(): void {
    this.showFormModal = false;
    this.selectedEmpleado = null;
    this.reloadTable();
  }

  onTipoEmpleadoSaved(): void {
    this.showTipoEmpleadoModal = false;
  }

  formatFecha(f: string): string {
    return new Date(f).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatSalario(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v);
  }

  contrato(c: string): string {
    const m: Record<string, string> = {
      INDEFINIDO: 'Indefinido',
      FIJO: 'Fijo',
      OBRA_LABOR: 'Obra/Labor',
      PRESTACION_SERVICIOS: 'Prestación',
    };
    return m[c] ?? c;
  }
}
