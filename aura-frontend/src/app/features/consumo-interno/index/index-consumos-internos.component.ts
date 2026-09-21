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
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmationService, MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../shared/pipes/alert.service';
import { FormConsumoInternoComponent } from '../form/form-consumo-interno.component';
import { DetalleConsumoInternoComponent } from '../detalles/detalle-consumo-interno.component';
import {
  ConceptoConsumoInternoModel,
  ConsumoInternoModel,
  ConsumoInternoTableModel,
} from '../../../core/models/consumo-interno.model';
import { ConsumoInternoService } from '../../../core/services/consumo-interno.service';
import { ContabilidadService } from '../../../core/services/contabilidad.service';

/** Fila editable del diálogo de conceptos. */
interface ConceptoEdicion extends ConceptoConsumoInternoModel {
  _nuevo?: boolean;
  _guardando?: boolean;
}

interface CuentaOpcion {
  id: number;
  label: string;
}

@Component({
  selector: 'app-index-consumos-internos',
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
    ConfirmDialogModule,
    ToastModule,
    DialogModule,
    DropdownModule,
    DetalleConsumoInternoComponent,
    FormConsumoInternoComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './index-consumos-internos.component.html',
  styleUrls: ['./index-consumos-internos.component.scss'],
})
export class IndexConsumosInternosComponent implements OnInit {
  rows: ConsumoInternoTableModel[] = [];
  totalRows = 0;
  loading = true;
  search = '';
  page = 0;
  pageSize = 10;

  showForm = false;
  showDetalle = false;
  consumoDetalle: ConsumoInternoModel | null = null;
  loadingDetalle = false;

  // ── Conceptos ──
  showConceptos = false;
  loadingConceptos = false;
  conceptos: ConceptoEdicion[] = [];
  cuentasOpts: CuentaOpcion[] = [];

  constructor(
    private readonly service: ConsumoInternoService,
    private readonly contabilidad: ContabilidadService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      const res = await lastValueFrom(
        this.service.page({
          page: this.page,
          rows: this.pageSize,
          search: this.search || null,
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
    this.showForm = true;
  }

  onSaved(): void {
    this.load();
  }

  async verDetalle(o: ConsumoInternoTableModel): Promise<void> {
    this.loadingDetalle = true;
    this.showDetalle = true;
    this.consumoDetalle = null;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.getById(o.id));
      this.consumoDetalle = res?.data ?? null;
    } finally {
      this.loadingDetalle = false;
      this.cdr.markForCheck();
    }
  }

  confirmAnular(o: ConsumoInternoTableModel): void {
    this.confirm.confirm({
      message: `¿Anular el consumo interno <b>#${o.id}</b>? Se devolverá el stock y se reversará el asiento contable.`,
      header: 'Confirmar anulación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, anular',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.anular(o.id),
    });
  }

  async anular(id: number): Promise<void> {
    try {
      await lastValueFrom(this.service.anular(id));
      this.alert.showSuccess(
        'Anulado',
        'El consumo interno fue anulado y el stock restaurado',
      );
      this.showDetalle = false;
      this.load();
    } catch (err: any) {
      this.alert.showError('Error', err?.error?.message ?? 'No se pudo anular');
    }
  }

  // ── Conceptos ────────────────────────────────────────────────

  async abrirConceptos(): Promise<void> {
    this.showConceptos = true;
    this.loadingConceptos = true;
    this.cdr.markForCheck();
    try {
      const [conceptos, plan] = await Promise.all([
        lastValueFrom(this.service.conceptos()),
        this.cuentasOpts.length
          ? Promise.resolve(null)
          : lastValueFrom(this.contabilidad.listarPlan()),
      ]);
      this.conceptos = (conceptos?.data ?? []).map(
        (c: ConceptoConsumoInternoModel) => ({ ...c }),
      );
      if (plan) {
        // Mismo guardarraíl del back: cuentas de movimiento de gasto (5) o
        // de propiedad, planta y equipo (15).
        this.cuentasOpts = (plan.data ?? [])
          .filter(
            (c) =>
              c.activa &&
              c.auxiliar &&
              (c.codigo.startsWith('5') || c.codigo.startsWith('15')),
          )
          .map((c) => ({ id: c.id, label: `${c.codigo} · ${c.nombre}` }));
      }
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudieron cargar los conceptos',
      );
    } finally {
      this.loadingConceptos = false;
      this.cdr.markForCheck();
    }
  }

  agregarConcepto(): void {
    this.conceptos = [
      ...this.conceptos,
      {
        id: 0,
        nombre: '',
        cuentaId: null,
        cuentaCodigo: null,
        cuentaNombre: null,
        generaIva: true,
        activo: true,
        _nuevo: true,
      },
    ];
    this.cdr.markForCheck();
  }

  async guardarConcepto(c: ConceptoEdicion): Promise<void> {
    if (!c.nombre?.trim()) {
      this.alert.showWarn('Validación', 'El concepto necesita un nombre');
      return;
    }
    c._guardando = true;
    this.cdr.markForCheck();
    const dto = {
      nombre: c.nombre.trim(),
      cuentaId: c.cuentaId ?? null,
      generaIva: c.generaIva,
      activo: c.activo,
    };
    try {
      const res = await lastValueFrom(
        c._nuevo
          ? this.service.crearConcepto(dto)
          : this.service.actualizarConcepto(c.id, dto),
      );
      Object.assign(c, res?.data ?? {}, { _nuevo: false });
      this.alert.showSuccess('Concepto guardado', c.nombre);
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudo guardar el concepto',
      );
    } finally {
      c._guardando = false;
      this.cdr.markForCheck();
    }
  }

  quitarNuevo(c: ConceptoEdicion): void {
    this.conceptos = this.conceptos.filter((x) => x !== c);
    this.cdr.markForCheck();
  }

  getSeverity(estado: string): 'success' | 'danger' {
    return estado === 'APROBADO' ? 'success' : 'danger';
  }

  formatCOP = (v: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
}
