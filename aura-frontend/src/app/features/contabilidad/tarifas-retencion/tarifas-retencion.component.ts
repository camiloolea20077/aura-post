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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

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
import { PuedeDirective } from '../../../shared/directives/puede.directive';
import { CuentaAutocompleteComponent } from '../../../shared/components/cuenta-autocomplete/cuenta-autocomplete.component';
import { TerceroAutocompleteComponent } from '../../../shared/components/tercero-autocomplete/tercero-autocomplete.component';

/** Grupo del PUC donde va la cuenta de cada tipo de retención. */
const GRUPO_CUENTA: Record<TipoRetencion, string> = {
  RETEFUENTE: '2365',
  RETEIVA: '2367',
  RETEICA: '2368',
};
@Component({
  selector: 'app-tarifas-retencion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PuedeDirective,
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
    ConfirmDialogModule,
    CuentaAutocompleteComponent,
    TerceroAutocompleteComponent,
  ],
  providers: [MessageService, ConfirmationService],
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
  /** Nombre del acreedor al editar (el buscador no lo vuelve a consultar). */
  acreedorLabel: string | null = null;

  // Municipio de reteICA
  municipioVisible = false;
  municipioNombre = '';
  municipioAcreedorId: number | null = null;

  abrirMunicipio(): void {
    this.municipioNombre = '';
    this.municipioAcreedorId = null;
    this.municipioVisible = true;
    this.cdr.markForCheck();
  }

  async guardarMunicipio(): Promise<void> {
    if (!this.municipioNombre.trim() || !this.municipioAcreedorId) return;
    this.saving = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.agregarMunicipioReteica({
          terceroAcreedorId: this.municipioAcreedorId,
          municipio: this.municipioNombre.trim(),
        }),
      );
      this.alertService.showSuccess('Municipio agregado', res.message ?? '');
      this.municipioVisible = false;
      this.cargar();
    } catch (e: any) {
      this.alertService.showError('No se pudo agregar', e?.error?.message ?? '');
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  constructor(
    private readonly service: TarifaRetencionService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
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
    this.acreedorLabel = null;
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
      cuentaContableId: t.cuentaContableId,
      terceroAcreedorId: t.terceroAcreedorId,
    };
    this.acreedorLabel = t.terceroAcreedorNombre;
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

  eliminar(t: TarifaRetencionModel): void {
    this.confirmationService.confirm({
      message: `¿Desactivar la tarifa "${t.concepto}"?`,
      header: 'Desactivar tarifa',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
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
      },
    });
  }

  tipoSeverity(tipo: TipoRetencion): 'info' | 'warn' | 'success' {
    const map: Record<TipoRetencion, 'info' | 'warn' | 'success'> = {
      RETEFUENTE: 'info',
      RETEIVA: 'warn',
      RETEICA: 'success',
    };
    return map[tipo] ?? 'info';
  }

  /** Prefijo de cuentas permitido para el tipo elegido (2365 / 2367 / 2368). */
  get prefijoCuenta(): string[] {
    return [GRUPO_CUENTA[this.form.tipo as TipoRetencion] ?? '236'];
  }

  /** Al cambiar el tipo, la cuenta elegida ya no es de su grupo. */
  onTipoChange(): void {
    this.form.cuentaContableId = null;
    this.cdr.markForCheck();
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
      cuentaContableId: null,
      terceroAcreedorId: null,
    };
  }
}
