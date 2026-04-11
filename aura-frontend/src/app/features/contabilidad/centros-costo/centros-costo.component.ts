import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';

import { CentroCostoService } from '../../../core/services/centro-costo.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  CentroCostoDto,
  CentroCostoTableModel,
  CreateCentroCostoDto,
  UpdateCentroCostoDto,
} from '../../../core/models/centro-costo.model';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-centros-costo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    DropdownModule,
    DialogModule,
    TagModule,
    ToastModule,
    TooltipModule,
    CheckboxModule,
    InputNumberModule,
    IconFieldModule,
    InputIconModule,
  ],
  providers: [MessageService],
  templateUrl: './centros-costo.component.html',
  styleUrls: ['./centros-costo.component.scss'],
})
export class CentrosCostoComponent implements OnInit {
  rows: CentroCostoTableModel[] = [];
  totalRecords = 0;
  loading = false;
  page = 0;
  pageSize = 10;
  search = '';

  showDialog = false;
  saving = false;
  editId: number | null = null;

  padreOpts: { label: string; value: number | null }[] = [];
  centrosList: CentroCostoDto[] = [];

  form: CreateCentroCostoDto = this.emptyForm();

  readonly tipoOpts = [
    { label: 'Operativo', value: 'OPERATIVO' },
    { label: 'Administrativo', value: 'ADMINISTRATIVO' },
    { label: 'Ventas', value: 'VENTAS' },
    { label: 'Producción', value: 'PRODUCCION' },
    { label: 'Financiero', value: 'FINANCIERO' },
  ];

  constructor(
    private readonly service: CentroCostoService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.cargarLista();
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
    } catch {
      this.alertService.showError(
        'Error',
        'No se pudieron cargar los centros de costo',
      );
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async cargarLista(): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.list());
      this.centrosList = res?.data ?? [];
      this.padreOpts = [
        { label: '— Sin padre —', value: null },
        ...this.centrosList.map((c) => ({
          label: `${c.codigo} — ${c.nombre}`,
          value: c.id,
        })),
      ];
      this.cdr.markForCheck();
    } catch {
      // no bloqueante
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

  abrirNuevo(): void {
    this.editId = null;
    this.form = this.emptyForm();
    this.showDialog = true;
    this.cdr.markForCheck();
  }

  abrirEditar(cc: CentroCostoTableModel): void {
    this.editId = cc.id;
    this.form = {
      codigo: cc.codigo,
      nombre: cc.nombre,
      descripcion: cc.descripcion,
      padreCentroCostoId: cc.padreId,
      tipo: cc.tipo,
      permiteMovimientos: cc.permiteMovimientos,
      presupuestoAsignado: cc.presupuestoAsignado,
      sucursalId: null,
      responsableId: null,
    };
    this.showDialog = true;
    this.cdr.markForCheck();
  }

  async guardar(): Promise<void> {
    if (!this.form.codigo || !this.form.nombre) return;
    this.saving = true;
    this.cdr.markForCheck();
    try {
      if (this.editId) {
        const updateDto: UpdateCentroCostoDto = { ...this.form, activo: true };
        await lastValueFrom(this.service.update(this.editId, updateDto));
        this.alertService.showSuccess(
          'Actualizado',
          'Centro de costo actualizado correctamente',
        );
      } else {
        await lastValueFrom(this.service.create(this.form));
        this.alertService.showSuccess(
          'Creado',
          'Centro de costo creado exitosamente',
        );
      }
      this.showDialog = false;
      await this.cargar();
      await this.cargarLista();
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo guardar',
      );
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  async eliminar(cc: CentroCostoTableModel): Promise<void> {
    if (!confirm(`¿Eliminar el centro de costo "${cc.codigo} — ${cc.nombre}"?`))
      return;
    try {
      await lastValueFrom(this.service.delete(cc.id));
      this.alertService.showSuccess('Eliminado', 'Centro de costo eliminado');
      await this.cargar();
      await this.cargarLista();
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo eliminar',
      );
    }
  }

  tipoSeverity(
    tipo: string | null,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<
      string,
      'success' | 'info' | 'warn' | 'danger' | 'secondary'
    > = {
      OPERATIVO: 'info',
      ADMINISTRATIVO: 'secondary',
      VENTAS: 'success',
      PRODUCCION: 'warn',
      FINANCIERO: 'danger',
    };
    return tipo ? (map[tipo] ?? 'secondary') : 'secondary';
  }

  nivelLabel(nivel: number): string {
    return '  '.repeat(nivel) + (nivel > 0 ? '└ ' : '');
  }

  private emptyForm(): CreateCentroCostoDto {
    return {
      codigo: '',
      nombre: '',
      descripcion: null,
      padreCentroCostoId: null,
      tipo: null,
      permiteMovimientos: true,
      presupuestoAsignado: null,
      sucursalId: null,
      responsableId: null,
    };
  }
}
