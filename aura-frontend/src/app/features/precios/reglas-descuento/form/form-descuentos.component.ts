import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import {
  AplicaA,
  CreateReglaDescuentoDto,
  DIAS_SEMANA,
  ReglaDescuentoModel,
  TipoDescuento,
} from '../../../../core/models/regla-descuento.model';
import { ReglaDescuentoService } from '../../../../core/services/regla-descuento.service';
import { CategoriaService } from '../../../../core/services/categoria.service';
import { ProductoService } from '../../../../core/services/producto.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { FilterByIdPipe } from '../../../../shared/pipes/filter-by-id.pipe';

@Component({
  selector: 'app-form-descuentos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    InputSwitchModule,
    CalendarModule,
    DropdownModule,
    DividerModule,
    ButtonModule,
    ToastModule,
    FilterByIdPipe,
  ],
  providers: [MessageService],
  templateUrl: './form-descuentos.component.html',
  styleUrls: ['./form-descuentos.component.scss'],
})
export class FormDescuentosComponent implements OnInit, OnChanges {
  @Input() displayModal = false;
  @Input() reglaId: number | null = null;
  @Input() slug = 'create';

  @Output() modalClosed = new EventEmitter<void>();
  @Output() reglaSaved = new EventEmitter<ReglaDescuentoModel>();

  public frmRegla!: FormGroup;
  public isEditMode = false;
  public isSubmitting = false;
  public isLoading = false;

  // Selector "aplica a" — helper de UI, no va al DTO
  public aplicaA: AplicaA = 'TODO';

  public readonly diasSemana = DIAS_SEMANA;
  public diasSeleccionados: number[] = [];

  // Dropdowns
  public categoriasOpts: { label: string; value: number }[] = [];
  public productosOpts: { label: string; value: number }[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly reglaService: ReglaDescuentoService,
    private readonly categoriaService: CategoriaService,
    private readonly productoService: ProductoService,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadDropdowns();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayModal'] && this.displayModal) {
      this.isEditMode = this.slug === 'edit' && !!this.reglaId;
      if (this.isEditMode) {
        this.loadData(this.reglaId!);
      } else {
        this.resetForm();
      }
    }
  }

  // ─── Inicialización ───────────────────────────────────────
  private initForm(): void {
    this.frmRegla = this.fb.group(
      {
        nombre: [
          null,
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(100),
          ],
        ],
        tipoDescuento: ['PORCENTAJE', Validators.required],
        valor: [null, [Validators.required, Validators.min(0.01)]],
        categoriaId: [null],
        productoId: [null],
        fechaInicio: [null],
        fechaFin: [null],
        horaInicio: [null],
        horaFin: [null],
        activo: [true],
      },
      { validators: this.validarRangos },
    );
  }

  private validarRangos(g: FormGroup): Record<string, true> | null {
    const errors: Record<string, true> = {};
    const fi = g.get('fechaInicio')?.value;
    const ff = g.get('fechaFin')?.value;
    const hi = g.get('horaInicio')?.value;
    const hf = g.get('horaFin')?.value;

    if (fi && ff && new Date(fi) > new Date(ff)) errors['fechaInvalida'] = true;
    if (hi && hf) {
      // horaInicio y horaFin pueden ser Date (Calendar) o string
      const toMin = (t: any) => {
        if (t instanceof Date) return t.getHours() * 60 + t.getMinutes();
        const [h, m] = String(t).split(':').map(Number);
        return h * 60 + (m || 0);
      };
      if (toMin(hi) >= toMin(hf)) errors['horaInvalida'] = true;
    }
    return Object.keys(errors).length ? errors : null;
  }

  private resetForm(): void {
    this.aplicaA = 'TODO';
    this.diasSeleccionados = [];
    this.frmRegla?.reset({
      nombre: null,
      tipoDescuento: 'PORCENTAJE',
      valor: null,
      categoriaId: null,
      productoId: null,
      fechaInicio: null,
      fechaFin: null,
      horaInicio: null,
      horaFin: null,
      activo: true,
    });
  }

  isInvalid(f: string): boolean {
    const c = this.frmRegla.get(f);
    return !!(c?.invalid && c?.touched);
  }

  // ─── UI helpers ───────────────────────────────────────────
  setTipo(tipo: TipoDescuento): void {
    this.frmRegla.patchValue({ tipoDescuento: tipo });
  }

  setAplicaA(tipo: AplicaA): void {
    this.aplicaA = tipo;
    this.frmRegla.patchValue({ categoriaId: null, productoId: null });
  }

  toggleDia(val: number): void {
    const idx = this.diasSeleccionados.indexOf(val);
    if (idx === -1)
      this.diasSeleccionados = [...this.diasSeleccionados, val].sort(
        (a, b) => a - b,
      );
    else
      this.diasSeleccionados = this.diasSeleccionados.filter((d) => d !== val);
  }

  isDiaSeleccionado(val: number): boolean {
    return this.diasSeleccionados.includes(val);
  }

  seleccionarSemanaCompleta(): void {
    this.diasSeleccionados = [1, 2, 3, 4, 5, 6, 7];
  }

  get porcentajeMaxValidator(): number {
    return this.frmRegla.get('tipoDescuento')?.value === 'PORCENTAJE'
      ? 100
      : 9999999;
  }

  // ─── Dropdowns ────────────────────────────────────────────
  private async loadDropdowns(): Promise<void> {
    try {
      const cats = await lastValueFrom(this.categoriaService.list());
      if (cats?.data)
        this.categoriasOpts = cats.data.map((c) => ({
          label: c.nombre,
          value: c.id,
        }));
    } catch {
      /* no bloquear */
    }
  }

  async onFiltroProducto(event: { filter: string }): Promise<void> {
    const q = event.filter?.trim();
    if (!q || q.length < 2) { this.productosOpts = []; return; }
    try {
      const res = await lastValueFrom(this.productoService.search(q));
      this.productosOpts = (res?.data ?? []).map((p: any) => ({
        label: p.nombre + (p.sku ? ` [${p.sku}]` : ''),
        value: p.id,
      }));
    } catch { /* no bloquear */ }
  }

  private async precargarProducto(id: number): Promise<void> {
    try {
      const res = await lastValueFrom(this.productoService.getById(id));
      if (res?.data)
        this.productosOpts = [{ label: res.data.nombre, value: res.data.id }];
    } catch { /* silencioso */ }
  }

  // ─── Carga para edición ───────────────────────────────────
  private async loadData(id: number): Promise<void> {
    this.isLoading = true;
    try {
      const res = await lastValueFrom(this.reglaService.getById(id));
      if (res?.data) {
        const d = res.data;

        // Detectar aplicaA
        if (d.categoriaId) this.aplicaA = 'CATEGORIA';
        else if (d.productoId) { this.aplicaA = 'PRODUCTO'; await this.precargarProducto(d.productoId); }
        else this.aplicaA = 'TODO';

        // Días de semana
        this.diasSeleccionados = d.diasSemana ?? [];

        // Parsear horas como Date para Calendar
        const toDate = (t: string | null): Date | null => {
          if (!t) return null;
          const [h, m] = t.split(':').map(Number);
          const d = new Date();
          d.setHours(h, m, 0, 0);
          return d;
        };
        setTimeout(() => {
          this.frmRegla.patchValue(
            {
              nombre: d.nombre,
              tipoDescuento: d.tipoDescuento,
              valor: d.valor,
              categoriaId: d.categoriaId,
              productoId: d.productoId,
              fechaInicio: d.fechaInicio ? new Date(d.fechaInicio) : null,
              fechaFin: d.fechaFin ? new Date(d.fechaFin) : null,
              horaInicio: toDate(d.horaInicio),
              horaFin: toDate(d.horaFin),
              activo: d.activo,
            },
            { emitEvent: false },
          );
        });
      }
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar la regla.');
      this.closeModal();
    } finally {
      this.isLoading = false;
    }
  }

  // ─── Guardar ──────────────────────────────────────────────
  async saveRegla(): Promise<void> {
    if (this.frmRegla.invalid) {
      this.frmRegla.markAllAsTouched();

      if (this.frmRegla.hasError('fechaInvalida'))
        return void this.alertService.showWarn(
          'Fechas inválidas',
          'La fecha de inicio debe ser anterior a la fecha fin.',
        );
      if (this.frmRegla.hasError('horaInvalida'))
        return void this.alertService.showWarn(
          'Horario inválido',
          'La hora de inicio debe ser anterior a la hora fin.',
        );

      this.alertService.showWarn(
        'Formulario incompleto',
        'Completa los campos requeridos.',
      );
      return;
    }

    const v = this.frmRegla.value;

    // Validar categoría/producto según aplicaA
    if (this.aplicaA === 'CATEGORIA' && !v.categoriaId)
      return void this.alertService.showWarn(
        'Selecciona una categoría',
        'La regla está configurada para aplicar a una categoría específica.',
      );
    if (this.aplicaA === 'PRODUCTO' && !v.productoId)
      return void this.alertService.showWarn(
        'Selecciona un producto',
        'La regla está configurada para aplicar a un producto específico.',
      );

    this.isSubmitting = true;
    try {
      const formatDate = (d: Date | null): string | null =>
        d ? d.toISOString().split('.')[0] : null;

      const formatHora = (d: Date | string | null): string | null => {
        if (!d) return null;
        if (d instanceof Date) {
          const h = String(d.getHours()).padStart(2, '0');
          const m = String(d.getMinutes()).padStart(2, '0');
          return `${h}:${m}:00`;
        }
        return String(d);
      };

      const dto: CreateReglaDescuentoDto = {
        nombre: v.nombre.trim(),
        tipoDescuento: v.tipoDescuento,
        valor: v.valor,
        categoriaId: this.aplicaA === 'CATEGORIA' ? v.categoriaId : null,
        productoId: this.aplicaA === 'PRODUCTO' ? v.productoId : null,
        fechaInicio: formatDate(v.fechaInicio),
        fechaFin: formatDate(v.fechaFin),
        diasSemana: this.diasSeleccionados.length
          ? this.diasSeleccionados
          : null,
        horaInicio: formatHora(v.horaInicio),
        horaFin: formatHora(v.horaFin),
        activo: v.activo,
      };

      const obs = this.isEditMode
        ? this.reglaService.update(this.reglaId!, dto)
        : this.reglaService.create(dto);

      const res = await lastValueFrom(obs);
      if (res?.status === 200 || res?.status === 201) {
        this.alertService.showSuccess(
          this.isEditMode ? 'Regla actualizada' : 'Regla creada',
          res.message,
        );
        this.reglaSaved.emit(res.data);
        this.closeModal();
      }
    } catch (err: any) {
      this.alertService.showError(
        'Error al guardar',
        err?.message ?? 'No se pudo guardar la regla.',
      );
    } finally {
      this.isSubmitting = false;
    }
  }

  closeModal(): void {
    this.resetForm();
    this.modalClosed.emit();
  }
}
