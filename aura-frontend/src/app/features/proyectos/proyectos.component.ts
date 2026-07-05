import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';

import { ProyectoService } from '../../core/services/proyecto.service';
import { CentroCostoService } from '../../core/services/centro-costo.service';
import { AlertService } from '../../shared/pipes/alert.service';
import { TerceroPickerComponent } from '../../shared/components/tercero-picker/tercero-picker.component';
import {
  CreateProyectoDto,
  EstadoProyecto,
  ProyectoTableModel,
} from '../../core/models/proyecto.model';

type Sev = 'success' | 'info' | 'warn' | 'danger' | 'secondary';

@Component({
  selector: 'app-proyectos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    DropdownModule,
    CheckboxModule,
    TagModule,
    ToastModule,
    TooltipModule,
    TextareaModule,
    TerceroPickerComponent,
  ],
  providers: [MessageService],
  templateUrl: './proyectos.component.html',
  styleUrls: ['./proyectos.component.scss'],
})
export class ProyectosComponent implements OnInit {
  rows: ProyectoTableModel[] = [];
  totalRecords = 0;
  loading = false;
  page = 0;
  pageSize = 10;
  search = '';

  showForm = false;
  saving = false;
  editId: number | null = null;
  clienteNombre: string | null = null;
  form: CreateProyectoDto = this.emptyForm();

  centroCostoOpts: { label: string; value: number | null }[] = [];

  readonly estadoOpts: { label: string; value: EstadoProyecto }[] = [
    { label: 'Activo', value: 'ACTIVO' },
    { label: 'Suspendido', value: 'SUSPENDIDO' },
    { label: 'Finalizado', value: 'FINALIZADO' },
    { label: 'Anulado', value: 'ANULADO' },
  ];

  constructor(
    private readonly service: ProyectoService,
    private readonly ccService: CentroCostoService,
    private readonly alertService: AlertService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.cargarCentros();
  }

  async cargar(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.page({
          page: this.page,
          rows: this.pageSize,
          search: this.search,
        }),
      );
      this.rows = res?.data?.content ?? [];
      this.totalRecords = res?.data?.totalElements ?? 0;
    } catch (e: any) {
      if (e?.status !== 206) {
        this.alertService.showError(
          'Error',
          'No se pudieron cargar los proyectos',
        );
      }
      this.rows = [];
      this.totalRecords = 0;
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async cargarCentros(): Promise<void> {
    try {
      const res = await lastValueFrom(this.ccService.list());
      this.centroCostoOpts = [
        { label: '— Sin centro de costo —', value: null },
        ...(res?.data ?? []).map((c) => ({
          label: `${c.codigo} — ${c.nombre}`,
          value: c.id,
        })),
      ];
      this.cdr.markForCheck();
    } catch {
      /* no bloqueante */
    }
  }

  onSearch(): void {
    this.page = 0;
    this.cargar();
  }

  onPage(event: { first: number; rows: number }): void {
    this.page = event.first / event.rows;
    this.pageSize = event.rows;
    this.cargar();
  }

  nuevo(): void {
    this.editId = null;
    this.clienteNombre = null;
    this.form = this.emptyForm();
    this.showForm = true;
    this.cdr.markForCheck();
  }

  editar(p: ProyectoTableModel): void {
    this.editId = p.id;
    this.clienteNombre = p.clienteNombre;
    this.form = {
      codigo: p.codigo,
      nombre: p.nombre,
      clienteId: p.clienteId,
      descripcion: p.descripcion,
      fechaInicio: p.fechaInicio,
      fechaFin: p.fechaFin,
      estado: p.estado,
      centroCostoId: p.centroCostoId,
      responsableAdministrativoId: p.responsableAdministrativoId,
      requiereControlAsistencia: p.requiereControlAsistencia,
      ciudad: p.ciudad,
      ubicacion: p.ubicacion,
      observacion: p.observacion,
    };
    this.showForm = true;
    this.cdr.markForCheck();
  }

  cancelar(): void {
    this.showForm = false;
    this.cdr.markForCheck();
  }

  onClienteSeleccionado(ev: { id: number; nombre: string } | null): void {
    this.form.clienteId = ev?.id ?? null;
    this.clienteNombre = ev?.nombre ?? null;
  }

  formValido(): boolean {
    return !!this.form.codigo?.trim() && !!this.form.nombre?.trim();
  }

  async guardar(): Promise<void> {
    if (!this.formValido()) return;
    this.saving = true;
    this.cdr.markForCheck();
    try {
      if (this.editId) {
        await lastValueFrom(this.service.update(this.editId, this.form));
        this.alertService.showSuccess(
          'Actualizado',
          'Proyecto actualizado correctamente',
        );
      } else {
        await lastValueFrom(this.service.create(this.form));
        this.alertService.showSuccess('Creado', 'Proyecto creado exitosamente');
      }
      this.showForm = false;
      await this.cargar();
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo guardar el proyecto',
      );
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  async eliminar(p: ProyectoTableModel): Promise<void> {
    if (!confirm(`¿Eliminar el proyecto "${p.codigo} — ${p.nombre}"?`)) return;
    try {
      await lastValueFrom(this.service.delete(p.id));
      this.alertService.showSuccess('Eliminado', 'Proyecto eliminado');
      await this.cargar();
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo eliminar',
      );
    }
  }

  verFrentes(p: ProyectoTableModel): void {
    this.router.navigate(['/proyectos', p.id, 'frentes']);
  }

  estadoSeverity(estado: string): Sev {
    const m: Record<string, Sev> = {
      ACTIVO: 'success',
      SUSPENDIDO: 'warn',
      FINALIZADO: 'info',
      ANULADO: 'danger',
    };
    return m[estado] ?? 'secondary';
  }

  private emptyForm(): CreateProyectoDto {
    return {
      codigo: '',
      nombre: '',
      clienteId: null,
      descripcion: null,
      fechaInicio: null,
      fechaFin: null,
      estado: 'ACTIVO',
      centroCostoId: null,
      responsableAdministrativoId: null,
      requiereControlAsistencia: true,
      ciudad: null,
      ubicacion: null,
      observacion: null,
    };
  }
}
