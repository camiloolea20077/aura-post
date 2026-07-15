import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { ConceptoCajaService } from '../../../core/services/concepto-caja.service';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  ConceptoCajaModel,
  CreateConceptoCajaDto,
  TipoConceptoCaja,
} from '../../../core/models/concepto-caja.model';
import { PlanCuentaModel } from '../../../core/models/contabilidad.model';

@Component({
  selector: 'app-conceptos-caja',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    TagModule,
    TooltipModule,
    DialogModule,
    DropdownModule,
    InputTextModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './conceptos-caja.component.html',
  styleUrls: ['./conceptos-caja.component.scss'],
})
export class ConceptosCajaComponent implements OnInit {
  conceptos: ConceptoCajaModel[] = [];
  loading = false;
  searchQuery = '';

  cuentasOpts: { label: string; value: number }[] = [];

  // Diálogo crear/editar
  showForm = false;
  saving = false;
  editId: number | null = null;
  form: CreateConceptoCajaDto = this.emptyForm();

  readonly tipoOpts = [
    { label: 'Egreso', value: 'EGRESO' as TipoConceptoCaja },
    { label: 'Ingreso', value: 'INGRESO' as TipoConceptoCaja },
  ];

  constructor(
    private readonly service: ConceptoCajaService,
    private readonly contaService: ContabilidadService,
    private readonly alert: AlertService,
    private readonly confirmationService: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.cargarCuentas();
  }

  async cargar(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.listar());
      this.conceptos = res?.data ?? [];
    } catch {
      this.conceptos = [];
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  private async cargarCuentas(): Promise<void> {
    const res = await lastValueFrom(this.contaService.listarPlan()).catch(
      () => null,
    );
    this.cuentasOpts = (res?.data ?? [])
      .filter((c: PlanCuentaModel) => c.auxiliar && c.activa)
      .map((c: PlanCuentaModel) => ({
        label: `${c.codigo} - ${c.nombre}`,
        value: c.id,
      }));
    this.cdr.markForCheck();
  }

  get filtrados(): ConceptoCajaModel[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.conceptos;
    return this.conceptos.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        (c.cuentaNombre ?? '').toLowerCase().includes(q),
    );
  }

  onSearch(): void {
    this.cdr.markForCheck();
  }
  clearSearch(): void {
    this.searchQuery = '';
    this.cdr.markForCheck();
  }

  abrirCrear(): void {
    this.editId = null;
    this.form = this.emptyForm();
    this.showForm = true;
    this.cdr.markForCheck();
  }

  abrirEditar(c: ConceptoCajaModel): void {
    this.editId = c.id;
    this.form = {
      nombre: c.nombre,
      tipo: c.tipo,
      cuentaContableId: c.cuentaContableId,
      activo: c.activo,
    };
    this.showForm = true;
    this.cdr.markForCheck();
  }

  async guardar(): Promise<void> {
    if (
      !this.form.nombre?.trim() ||
      !this.form.tipo ||
      !this.form.cuentaContableId
    ) {
      this.alert.showError(
        'Validación',
        'Completa nombre, tipo y cuenta contable.',
      );
      return;
    }
    this.saving = true;
    this.cdr.markForCheck();
    try {
      if (this.editId) {
        await lastValueFrom(this.service.actualizar(this.editId, this.form));
        this.alert.showSuccess('Concepto actualizado', '');
      } else {
        await lastValueFrom(this.service.crear(this.form));
        this.alert.showSuccess('Concepto creado', '');
      }
      this.showForm = false;
      await this.cargar();
    } catch (e: any) {
      this.alert.showError(
        'Error',
        e?.error?.message ?? 'No se pudo guardar el concepto',
      );
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  eliminar(c: ConceptoCajaModel): void {
    this.confirmationService.confirm({
      message: `¿Eliminar el concepto "${c.nombre}"?`,
      header: 'Eliminar concepto',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await lastValueFrom(this.service.eliminar(c.id));
          this.alert.showSuccess('Concepto eliminado', '');
          await this.cargar();
        } catch (e: any) {
          this.alert.showError('Error', e?.error?.message ?? 'No se pudo eliminar');
        }
      },
    });
  }

  tipoSeverity(tipo: string): 'success' | 'danger' {
    return tipo === 'INGRESO' ? 'success' : 'danger';
  }

  tipoLabel(tipo: string): string {
    return tipo === 'INGRESO' ? 'Ingreso' : 'Egreso';
  }

  private emptyForm(): CreateConceptoCajaDto {
    return { nombre: '', tipo: 'EGRESO', cuentaContableId: 0, activo: true };
  }
}
