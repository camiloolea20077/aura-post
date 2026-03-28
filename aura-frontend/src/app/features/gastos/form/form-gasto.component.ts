import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { GastoService } from '../../../core/services/gasto.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { IndexDBService } from '../../../core/services/index-db.service';
import {
  CATEGORIAS_GASTO,
  CreateGastoDto,
  GastoTableModel,
} from '../../../core/models/gasto.model';

@Component({
  selector: 'app-form-gasto',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    DropdownModule,
    InputNumberModule,
    TextareaModule,
    CalendarModule,
    ToastModule,
    ToggleButtonModule,
  ],
  providers: [MessageService],
  templateUrl: './form-gasto.component.html',
  styleUrls: ['./form-gasto.component.scss'],
})
export class FormGastoComponent implements OnChanges {
  @Input() visible = false;
  @Input() gastoToEdit: GastoTableModel | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  // Form state
  sucursalId: number | null = null;
  sucursalesOpts: { label: string; value: number }[] = [];
  categoria = '';
  descripcion = '';
  monto: number | null = null;
  fecha: Date = new Date();
  deducible = false;
  saving = false;

  readonly categoriasOpts = CATEGORIAS_GASTO.map((c) => ({
    label: c.label,
    value: c.value,
    deducible: c.deducible,
  }));

  get modoEdicion(): boolean {
    return this.gastoToEdit != null;
  }
  get header(): string {
    return this.modoEdicion ? 'Editar gasto' : 'Registrar gasto';
  }

  constructor(
    private readonly gastoService: GastoService,
    private readonly alertService: AlertService,
    private readonly indexDB: IndexDBService,
    public readonly cdr: ChangeDetectorRef,
  ) {}

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['visible']?.currentValue) {
      await this.loadSucursales();
      if (this.modoEdicion && this.gastoToEdit) {
        this.cargarEdicion(this.gastoToEdit);
      }
      this.cdr.markForCheck();
    }
  }

  private async loadSucursales(): Promise<void> {
    const list = await this.indexDB.getSucursales();
    this.sucursalesOpts = list.map((s) => ({ label: s.nombre, value: s.id }));
    if (!this.sucursalId && list.length > 0) {
      this.sucursalId = list[0].id;
    }
    this.cdr.markForCheck();
  }

  private cargarEdicion(g: GastoTableModel): void {
    this.categoria = g.categoria;
    this.descripcion = g.descripcion ?? '';
    this.monto = g.monto;
    this.fecha = g.fecha ? new Date(g.fecha + 'T00:00:00') : new Date();
    this.deducible = g.deducible;
  }

  onCategoriaChange(val: string): void {
    this.categoria = val;
    const cat = CATEGORIAS_GASTO.find((c) => c.value === val);
    if (cat != null) this.deducible = cat.deducible;
    this.cdr.markForCheck();
  }

  async save(): Promise<void> {
    if (!this.sucursalId || !this.categoria || !this.monto) {
      this.alertService.showWarn(
        'Campos requeridos',
        'Completa sucursal, categoría y monto.',
      );
      return;
    }
    const dto: CreateGastoDto = {
      sucursalId: this.sucursalId,
      categoria: this.categoria,
      descripcion: this.descripcion.trim() || null,
      monto: this.monto,
      fecha: this.fecha ? this.fecha.toISOString().split('T')[0] : null,
      deducible: this.deducible,
    };
    this.saving = true;
    this.cdr.markForCheck();
    try {
      if (this.modoEdicion && this.gastoToEdit) {
        await lastValueFrom(this.gastoService.update(this.gastoToEdit.id, dto));
        this.alertService.showSuccess('Actualizado', 'Gasto actualizado.');
      } else {
        await lastValueFrom(this.gastoService.create(dto));
        this.alertService.showSuccess('Registrado', 'Gasto registrado.');
      }
      this.saved.emit();
      this.close();
    } catch {
      this.alertService.showError('Error', 'No se pudo guardar el gasto.');
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  close(): void {
    this.resetForm();
    this.visible = false;
    this.closed.emit();
  }

  private resetForm(): void {
    this.categoria = '';
    this.descripcion = '';
    this.monto = null;
    this.fecha = new Date();
    this.deducible = false;
  }
}
