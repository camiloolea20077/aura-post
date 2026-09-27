import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { Router } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { CurrencyPipe } from '@angular/common';
import { ConfirmationService, MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import {
  diasParaVencer,
  estadoVencimiento,
  LotePageableDto,
  LoteTableModel,
  MermaDesdeLotes,
  VencimientoLoteModel,
} from '../../../../core/models/lote.model';
import { SucursalService } from '../../../../core/services/sucursal.service';
import { IndexDBService } from '../../../../core/services/index-db.service';
import { LoteService } from '../../../../core/services/lote.service';
import { AlertService } from '../../../../shared/pipes/alert.service';

@Component({
  selector: 'app-index-lotes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    SkeletonModule,
    DropdownModule,
    CheckboxModule,
    DialogModule,
    CalendarModule,
    InputNumberModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-lotes.component.html',
  styleUrls: ['./index-lotes.component.scss'],
})
export class IndexLotesComponent implements OnInit {
  // Corrección de código y vencimiento
  public loteEdicion: LoteTableModel | null = null;
  public edicion = {
    codigoLote: '',
    fechaVencimiento: null as Date | null,
    motivo: '',
  };
  public guardandoEdicion = false;

  // Reglas de vencimiento de la empresa
  public reglasVisible = false;
  public reglas = { bloquearVencidos: true, diasAlerta: 30 };
  public guardandoReglas = false;

  public items: LoteTableModel[] = [];
  public loadingTable = true;
  public totalRecords = 0;
  public rowSize = 15;
  public searchQuery = '';
  public lastLazyEvent!: TableLazyLoadEvent;

  // Vencimientos
  public vencVisible = false;
  public vencCargando = false;
  public vencItems: VencimientoLoteModel[] = [];
  public vencDias: number | null = null;
  public vencSucursalId: number | null = null;
  public sucursalesOpts: { label: string; value: number | null }[] = [];
  public vencSeleccion = new Set<number>();

  public readonly diasParaVencer = diasParaVencer;
  public readonly estadoVencimiento = estadoVencimiento;

  constructor(
    private readonly loteService: LoteService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
    private readonly router: Router,
    private readonly sucursalService: SucursalService,
    private readonly indexDB: IndexDBService,
  ) {}

  async ngOnInit(): Promise<void> {
    const estado = history.state;
    if (estado?.abrirVencimientos) {
      history.replaceState({ ...estado, abrirVencimientos: false }, '');
      await this.verVencimientos();
      if (estado.elegirVencidos) this.seleccionarVencidos();
    }
  }

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

    const dto: LotePageableDto = {
      page,
      rows: event.rows ?? this.rowSize,
      search: this.searchQuery || null,
      order_by: sortField ?? 'l.fecha_vencimiento',
      order: 'ASC',
    };

    try {
      const res = await lastValueFrom(this.loteService.page(dto));
      this.items = res?.data?.content ?? [];
      this.totalRecords = res?.data?.totalElements ?? 0;
    } catch (err: any) {
      if (err?.status !== 206)
        this.alertService.showError(
          'Error',
          'No se pudieron cargar los lotes.',
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

  // ─── Reglas de vencimiento ────────────────────────────────
  async abrirReglas(): Promise<void> {
    try {
      const res = await lastValueFrom(this.loteService.reglas());
      if (res?.data) this.reglas = { ...res.data };
    } catch {
      /* se muestran los valores por defecto */
    }
    this.reglasVisible = true;
  }

  async guardarReglas(): Promise<void> {
    this.guardandoReglas = true;
    try {
      await lastValueFrom(
        this.loteService.guardarReglas({
          bloquearVencidos: this.reglas.bloquearVencidos,
          diasAlerta: Math.max(0, Math.min(365, this.reglas.diasAlerta ?? 30)),
        }),
      );
      this.alertService.showSuccess('Reglas guardadas', '');
      this.reglasVisible = false;
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.error?.message ?? 'No se pudieron guardar las reglas.',
      );
    } finally {
      this.guardandoReglas = false;
    }
  }

  // ─── Corregir ─────────────────────────────────────────────
  get edicionVisible(): boolean {
    return this.loteEdicion !== null;
  }
  set edicionVisible(v: boolean) {
    if (!v) this.loteEdicion = null;
  }

  abrirEdicion(item: LoteTableModel): void {
    this.loteEdicion = item;
    this.edicion = {
      codigoLote: item.codigoLote,
      fechaVencimiento: item.fechaVencimiento
        ? new Date(item.fechaVencimiento + 'T00:00:00')
        : null,
      motivo: '',
    };
  }

  async guardarEdicion(): Promise<void> {
    if (!this.loteEdicion) return;
    if (!this.edicion.codigoLote.trim()) {
      this.alertService.showWarn('Validación', 'El código de lote es obligatorio');
      return;
    }
    if (!this.edicion.motivo.trim()) {
      this.alertService.showWarn('Validación', 'Indica por qué corriges el lote');
      return;
    }
    const f = this.edicion.fechaVencimiento;
    const fecha = f
      ? `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`
      : null;
    this.guardandoEdicion = true;
    try {
      await lastValueFrom(
        this.loteService.update(this.loteEdicion.id, {
          codigoLote: this.edicion.codigoLote.trim(),
          fechaVencimiento: fecha,
          motivo: this.edicion.motivo.trim(),
        }),
      );
      this.alertService.showSuccess('Lote corregido', this.edicion.codigoLote);
      this.loteEdicion = null;
      this.reloadTable();
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.error?.message ?? 'No se pudo corregir el lote.',
      );
    } finally {
      this.guardandoEdicion = false;
    }
  }

  private reloadTable(): void {
    if (this.lastLazyEvent) this.loadTable(this.lastLazyEvent);
  }

  // ─── Vencimientos ─────────────────────────────────────────
  async verVencimientos(): Promise<void> {
    this.vencVisible = true;
    if (!this.sucursalesOpts.length) {
      try {
        const res = await lastValueFrom(this.sucursalService.getActivas());
        this.sucursalesOpts = [
          { label: 'Todas las sucursales', value: null },
          ...(res?.data ?? []).map((s) => ({ label: s.nombre, value: s.id })),
        ];
      } catch {
        this.sucursalesOpts = [{ label: 'Todas las sucursales', value: null }];
      }
      this.vencSucursalId = await this.indexDB.getSucursalDefault();
    }
    if (this.vencDias === null) {
      try {
        const reglas = await lastValueFrom(this.loteService.reglas());
        this.vencDias = reglas?.data?.diasAlerta ?? 30;
      } catch {
        this.vencDias = 30;
      }
    }
    await this.cargarVencimientos();
  }

  async cargarVencimientos(): Promise<void> {
    this.vencCargando = true;
    this.vencSeleccion = new Set();
    try {
      const res = await lastValueFrom(
        this.loteService.vencimientos(this.vencSucursalId, this.vencDias),
      );
      this.vencItems = res?.data ?? [];
    } catch (err: any) {
      this.vencItems = [];
      this.alertService.showError('Error', err?.error?.message ?? 'No se pudieron cargar los vencimientos.');
    } finally {
      this.vencCargando = false;
    }
  }

  get vencidos(): VencimientoLoteModel[] {
    return this.vencItems.filter((v) => v.diasParaVencer < 0);
  }

  get porVencer(): VencimientoLoteModel[] {
    return this.vencItems.filter((v) => v.diasParaVencer >= 0);
  }

  sumar(items: VencimientoLoteModel[], campo: 'valorCosto' | 'valorVenta'): number {
    return items.reduce((s, v) => s + Number(v[campo] ?? 0), 0);
  }

  alternarVencimiento(v: VencimientoLoteModel): void {
    const s = new Set(this.vencSeleccion);
    if (s.has(v.loteId)) s.delete(v.loteId);
    else s.add(v.loteId);
    this.vencSeleccion = s;
  }

  seleccionarVencidos(): void {
    this.vencSeleccion = new Set(this.vencidos.map((v) => v.loteId));
  }

  /** Abre la merma ya llena con los lotes elegidos (todos de una misma sucursal). */
  hacerMerma(): void {
    const elegidos = this.vencItems.filter((v) => this.vencSeleccion.has(v.loteId));
    if (!elegidos.length) return;
    const sucursales = new Set(elegidos.map((v) => v.sucursalId));
    if (sucursales.size > 1) {
      this.alertService.showWarn(
        'Varias sucursales',
        'Una merma es de una sola sucursal: filtra por sucursal y elige de nuevo.',
      );
      return;
    }
    const estado: MermaDesdeLotes = {
      sucursalId: elegidos[0].sucursalId,
      lineas: elegidos.map((v) => ({
        productoId: v.productoId,
        loteId: v.loteId,
        cantidad: Number(v.stockActual),
      })),
    };
    this.vencVisible = false;
    this.router.navigate(['/mermas'], { state: { mermaDesdeLotes: estado } });
  }

  etiquetaDias(dias: number): string {
    if (dias < 0) return `Venció hace ${Math.abs(dias)} d`;
    if (dias === 0) return 'Vence hoy';
    return `En ${dias} d`;
  }

  // ─── Eliminar ─────────────────────────────────────────────
  confirmDelete(item: LoteTableModel): void {
    this.confirmationService.confirm({
      message: `¿Desactivar el lote <strong>${item.codigoLote}</strong>?<br>
                <small>Solo se puede con el lote en cero.</small>`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await lastValueFrom(this.loteService.delete(item.id));
          this.alertService.showSuccess('Lote desactivado', '');
          this.reloadTable();
        } catch (err: any) {
          this.alertService.showError(
            'Error',
            err?.error?.message ?? 'No se pudo desactivar el lote.',
          );
        }
      },
    });
  }

  // ─── Helpers UI ───────────────────────────────────────────
  getVencimientoClass(lote: LoteTableModel): string {
    return estadoVencimiento(diasParaVencer(lote.fechaVencimiento));
  }

  getVencimientoLabel(lote: LoteTableModel): string {
    const dias = diasParaVencer(lote.fechaVencimiento);
    if (dias === null) return 'Sin fecha';
    if (dias < 0) return `Vencido (${Math.abs(dias)}d)`;
    if (dias === 0) return 'Vence hoy';
    if (dias <= 30) return `${dias}d`;
    const fecha = lote.fechaVencimiento!;
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
