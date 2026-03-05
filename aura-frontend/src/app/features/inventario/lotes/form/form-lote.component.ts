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
import { CreateLoteDto, LoteModel } from '../../../../core/models/lote.model';
import { LoteService } from '../../../../core/services/lote.service';
import { ProductoService } from '../../../../core/services/producto.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { IndexDBService } from '../../../../core/services/index-db.service';

@Component({
  selector: 'app-form-lote',
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
  ],
  providers: [MessageService],
  templateUrl: './form-lote.component.html',
  styleUrls: ['./form-lote.component.scss'],
})
export class FormLoteComponent implements OnInit, OnChanges {
  @Input() displayModal = false;
  @Input() slug = 'create'; // Solo create — lotes no se editan

  @Output() modalClosed = new EventEmitter<void>();
  @Output() itemSaved = new EventEmitter<LoteModel>();

  public frmLote!: FormGroup;
  public isSubmitting = false;

  public productosOpts: { label: string; value: number }[] = [];
  public sucursalesOpts: { label: string; value: number }[] = [];

  // Fechas referencia UI
  public readonly hoy = new Date();
  public diasParaVencer: number | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly loteService: LoteService,
    private readonly indexDBService: IndexDBService,
    private readonly productoService: ProductoService,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadDropdowns();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayModal'] && this.displayModal) this.resetForm();
  }

  private initForm(): void {
    this.frmLote = this.fb.group({
      productoId: [null, Validators.required],
      sucursalId: [null, Validators.required],
      codigoLote: [
        null,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(80),
        ],
      ],
      fechaVencimiento: [null],
      stockActual: [null, [Validators.required, Validators.min(0.0001)]],
      costoUnitario: [null, [Validators.required, Validators.min(0.01)]],
      activo: [true],
    });

    // Calcular días para vencer en tiempo real
    this.frmLote
      .get('fechaVencimiento')
      ?.valueChanges.subscribe((fecha: Date | null) => {
        if (!fecha) {
          this.diasParaVencer = null;
          return;
        }
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        this.diasParaVencer = Math.floor(
          (fecha.getTime() - hoy.getTime()) / 86_400_000,
        );
      });
  }

  private resetForm(): void {
    this.diasParaVencer = null;
    this.frmLote?.reset({
      productoId: null,
      sucursalId: null,
      codigoLote: null,
      fechaVencimiento: null,
      stockActual: null,
      costoUnitario: null,
      activo: true,
    });
  }

  isInvalid(f: string): boolean {
    const c = this.frmLote.get(f);
    return !!(c?.invalid && c?.touched);
  }

  get diasClass(): string {
    const d = this.diasParaVencer;
    if (d === null) return '';
    if (d < 0) return 'dias-vencido';
    if (d <= 7) return 'dias-critico';
    if (d <= 30) return 'dias-proximo';
    return 'dias-ok';
  }

  get diasLabel(): string {
    const d = this.diasParaVencer;
    if (d === null) return '';
    if (d < 0) return `Vencido hace ${Math.abs(d)} días`;
    if (d === 0) return 'Vence hoy';
    return `Vence en ${d} días`;
  }

  private async loadDropdowns(): Promise<void> {
    try {
      const auth = await this.indexDBService.loadDataAuthDB();
      if (auth?.sucursales) {
        this.sucursalesOpts = auth.sucursales.map((s) => ({
          label: s.nombre,
          value: s.id,
        }));
        const def =
          auth.sucursales.find((s) => s.esDefault) ?? auth.sucursales[0];
        if (def) this.frmLote.patchValue({ sucursalId: def.id });
      }
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

  async saveItem(): Promise<void> {
    if (this.frmLote.invalid) {
      this.frmLote.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    try {
      const v = this.frmLote.value;
      const fv: Date | null = v.fechaVencimiento;
      const dto: CreateLoteDto = {
        productoId: v.productoId,
        sucursalId: v.sucursalId,
        codigoLote: v.codigoLote.trim().toUpperCase(),
        fechaVencimiento: fv
          ? `${fv.getFullYear()}-${String(fv.getMonth() + 1).padStart(2, '0')}-${String(fv.getDate()).padStart(2, '0')}`
          : null,
        stockActual: v.stockActual,
        costoUnitario: v.costoUnitario,
        activo: v.activo,
      };
      const res = await lastValueFrom(this.loteService.create(dto));
      if (res?.status === 201) {
        this.alertService.showSuccess('Lote creado', res.message);
        this.itemSaved.emit(res.data);
        this.closeModal();
      }
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.message ?? 'No se pudo guardar el lote.',
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
