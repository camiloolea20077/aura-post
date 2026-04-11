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
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';

import { TarifaRetencionService } from '../../../core/services/tarifa-retencion.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  TarifaRetencionModel,
  CreateTarifaRetencionDto,
  TIPO_RETENCION_OPTIONS,
  TipoRetencion,
} from '../../../core/models/tarifa-retencion.model';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
@Component({
  selector: 'app-tarifas-retencion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    DialogModule,
    TagModule,
    ToastModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    CheckboxModule,
  ],
  providers: [MessageService],
  templateUrl: './tarifas-retencion.component.html',
  styleUrls: ['./tarifas-retencion.component.scss'],
})
export class TarifasRetencionComponent implements OnInit {
  rows: TarifaRetencionModel[] = [];
  totalRecords = 0;
  loading = false;
  page = 0;
  pageSize = 15;
  search = '';

  showDialog = false;
  saving = false;
  editId: number | null = null;

  readonly tipoOpts = TIPO_RETENCION_OPTIONS;

  form: CreateTarifaRetencionDto = this.emptyForm();

  constructor(
    private readonly service: TarifaRetencionService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
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
      this.alertService.showError('Error', 'No se pudieron cargar las tarifas');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
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

  abrirEditar(t: TarifaRetencionModel): void {
    this.editId = t.id;
    this.form = {
      tipo: t.tipo,
      concepto: t.concepto,
      codigoConcepto: t.codigoConcepto,
      tarifaNatural: t.tarifaNatural,
      tarifaJuridica: t.tarifaJuridica,
      baseMinima: t.baseMinima,
      activo: t.activo,
    };
    this.showDialog = true;
    this.cdr.markForCheck();
  }

  async guardar(): Promise<void> {
    if (!this.form.tipo || !this.form.concepto) return;
    this.saving = true;
    this.cdr.markForCheck();
    try {
      if (this.editId) {
        await lastValueFrom(this.service.update(this.editId, this.form));
        this.alertService.showSuccess(
          'Actualizado',
          'Tarifa actualizada correctamente',
        );
      } else {
        await lastValueFrom(this.service.create(this.form));
        this.alertService.showSuccess('Creada', 'Tarifa creada exitosamente');
      }
      this.showDialog = false;
      await this.cargar();
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

  async eliminar(t: TarifaRetencionModel): Promise<void> {
    if (!confirm(`¿Desactivar la tarifa "${t.concepto}"?`)) return;
    try {
      await lastValueFrom(this.service.delete(t.id));
      this.alertService.showSuccess('Eliminada', 'Tarifa desactivada');
      await this.cargar();
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo eliminar',
      );
    }
  }

  tipoSeverity(tipo: TipoRetencion): 'info' | 'warn' | 'success' {
    const map: Record<TipoRetencion, 'info' | 'warn' | 'success'> = {
      RETEFUENTE: 'info',
      RETEIVA: 'warn',
      RETEICA: 'success',
    };
    return map[tipo] ?? 'info';
  }

  tipoLabel(tipo: TipoRetencion): string {
    return this.tipoOpts.find((o) => o.value === tipo)?.label ?? tipo;
  }

  private emptyForm(): CreateTarifaRetencionDto {
    return {
      tipo: 'RETEFUENTE',
      concepto: '',
      codigoConcepto: null,
      tarifaNatural: 0,
      tarifaJuridica: 0,
      baseMinima: 0,
      activo: true,
    };
  }
}
