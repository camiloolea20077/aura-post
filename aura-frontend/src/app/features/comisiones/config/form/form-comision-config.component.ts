import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { lastValueFrom } from 'rxjs';

import { ComisionService } from '../../../../core/services/comision.service';
import { ProductoService } from '../../../../core/services/producto.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import {
  ComisionConfigModel,
  TecnicoDto,
  TipoComision,
} from '../../../../core/models/comision.model';

interface ServicioOpcion {
  label: string;
  value: number;
}

@Component({
  selector: 'app-form-comision-config',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    ToggleButtonModule,
  ],
  templateUrl: './form-comision-config.component.html',
  styleUrls: ['./form-comision-config.component.scss'],
})
export class FormComisionConfigComponent implements OnChanges {
  @Input() visible = false;
  @Input() config: ComisionConfigModel | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  frm: FormGroup;
  loading = false;
  loadingTecnicos = false;

  // Servicios: búsqueda server-side igual que compras
  servicioOpts: ServicioOpcion[] = [];

  // En edición precargamos el servicio actual para mostrarlo
  servicioEditLabel = '';

  tecnicos: TecnicoDto[] = [];

  readonly tipoOptions: { label: string; value: TipoComision }[] = [
    { label: 'Porcentaje (%)', value: 'PORCENTAJE' },
    { label: 'Valor fijo ($)', value: 'VALOR_FIJO' },
  ];

  get isEdit(): boolean {
    return !!this.config;
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly comisionService: ComisionService,
    private readonly productoService: ProductoService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.frm = this.fb.group({
      productoId: [null, Validators.required],
      tecnicoId: [null],
      tipo: ['PORCENTAJE', Validators.required],
      porcentajeTecnico: [50, [Validators.required, Validators.min(0.01), Validators.max(99.99)]],
      porcentajeNegocio: [{ value: 50, disabled: true }],
      activo: [true],
    });

    this.frm.get('porcentajeTecnico')!.valueChanges.subscribe((val) => {
      const negocio = val != null ? Math.round((100 - val) * 100) / 100 : 0;
      this.frm.get('porcentajeNegocio')!.setValue(negocio, { emitEvent: false });
      this.cdr.markForCheck();
    });
  }

  async ngOnChanges(): Promise<void> {
    if (!this.visible) return;

    this.servicioOpts = [];
    this.servicioEditLabel = '';
    this.frm.reset({
      productoId: null,
      tecnicoId: null,
      tipo: 'PORCENTAJE',
      porcentajeTecnico: 50,
      porcentajeNegocio: 50,
      activo: true,
    });

    await this.loadTecnicos();

    if (this.config) {
      // En edición: precargar el servicio actual en el dropdown para que se muestre
      this.servicioEditLabel = this.config.productoNombre;
      this.servicioOpts = [{
        label: this.config.productoNombre,
        value: this.config.productoId,
      }];

      this.frm.patchValue({
        productoId: this.config.productoId,
        tecnicoId: this.config.tecnicoId,
        tipo: this.config.tipo,
        porcentajeTecnico: this.config.porcentajeTecnico,
        porcentajeNegocio: this.config.porcentajeNegocio,
        activo: this.config.activo,
      });
    }

    this.cdr.markForCheck();
  }

  // ── Búsqueda server-side de servicios (igual que compras) ──
  async onFiltroServicio(event: { filter: string }): Promise<void> {
    const q = event.filter?.trim();
    if (!q || q.length < 2) {
      // En edición mantenemos el item actual visible
      if (this.isEdit && this.config) {
        this.servicioOpts = [{ label: this.config.productoNombre, value: this.config.productoId }];
      } else {
        this.servicioOpts = [];
      }
      this.cdr.markForCheck();
      return;
    }
    try {
      const res = await lastValueFrom(this.productoService.search(q));
      // Filtrar solo SERVICIO en cliente (el backend devuelve todos)
      this.servicioOpts = (res?.data ?? [])
        .filter((p: any) => p.tipoProducto === 'SERVICIO')
        .map((p: any): ServicioOpcion => ({
          label: p.nombre + (p.sku ? ` [${p.sku}]` : ''),
          value: p.id,
        }));
    } catch {
      this.servicioOpts = [];
    }
    this.cdr.markForCheck();
  }

  // ── Carga técnicos (lista compacta, no es masiva) ──────────
  private async loadTecnicos(): Promise<void> {
    this.loadingTecnicos = true;
    try {
      const res = await lastValueFrom(this.comisionService.listTecnicos());
      this.tecnicos = res?.data ?? [];
    } catch {
      this.alertService.showError('Error', 'No se pudieron cargar los técnicos');
    } finally {
      this.loadingTecnicos = false;
      this.cdr.markForCheck();
    }
  }

  async save(): Promise<void> {
    if (this.frm.invalid) {
      this.frm.markAllAsTouched();
      return;
    }

    const raw = this.frm.getRawValue();
    const dto = {
      productoId: raw.productoId,
      tecnicoId: raw.tecnicoId ?? null,
      tipo: raw.tipo as TipoComision,
      porcentajeTecnico: raw.porcentajeTecnico,
      porcentajeNegocio: raw.porcentajeNegocio,
      ...(this.isEdit ? { activo: raw.activo } : {}),
    };

    this.loading = true;
    try {
      if (this.isEdit) {
        await lastValueFrom(this.comisionService.updateConfig(this.config!.id, dto));
        this.alertService.showSuccess('Actualizado', 'Configuración actualizada');
      } else {
        await lastValueFrom(this.comisionService.createConfig(dto));
        this.alertService.showSuccess('Creado', 'Configuración creada correctamente');
      }
      this.saved.emit();
      this.close();
    } catch (err: any) {
      this.alertService.showError('Error', err?.message ?? 'No se pudo guardar');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  isInvalid(field: string): boolean {
    const c = this.frm.get(field);
    return !!(c?.invalid && c?.touched);
  }
}
