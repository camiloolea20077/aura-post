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
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import {
  CreateSerialProductoDto,
  ESTADO_SERIAL_OPTIONS,
  SerialProductoModel,
} from '../../../../core/models/serial-producto.model';
import { SerialProductoService } from '../../../../core/services/serial-producto.service';
import { ProductoService } from '../../../../core/services/producto.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { IndexDBService } from '../../../../core/services/index-db.service';

@Component({
  selector: 'app-form-serial',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    DropdownModule,
    ButtonModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './form-serial.component.html',
  styleUrls: ['./form-serial.component.scss'],
})
export class FormSerialComponent implements OnInit, OnChanges {
  @Input() displayModal = false;
  @Output() modalClosed = new EventEmitter<void>();
  @Output() itemSaved = new EventEmitter<SerialProductoModel>();

  public frmSerial!: FormGroup;
  public isSubmitting = false;

  public productosOpts: { label: string; value: number }[] = [];
  public sucursalesOpts: { label: string; value: number }[] = [];
  public readonly estadoOpts = ESTADO_SERIAL_OPTIONS;

  constructor(
    private readonly fb: FormBuilder,
    private readonly serialService: SerialProductoService,
    private readonly productoService: ProductoService,
    private readonly indexDBService: IndexDBService,
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
    this.frmSerial = this.fb.group({
      productoId: [null, Validators.required],
      sucursalId: [null, Validators.required],
      serial: [
        null,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
        ],
      ],
      estado: ['DISPONIBLE', Validators.required],
    });
  }

  private resetForm(): void {
    this.frmSerial?.reset({
      productoId: null,
      sucursalId: null,
      serial: null,
      estado: 'DISPONIBLE',
    });
  }

  isInvalid(f: string): boolean {
    const c = this.frmSerial.get(f);
    return !!(c?.invalid && c?.touched);
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
        if (def) this.frmSerial.patchValue({ sucursalId: def.id });
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
    if (this.frmSerial.invalid) {
      this.frmSerial.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    try {
      const v = this.frmSerial.value;
      const dto: CreateSerialProductoDto = {
        productoId: v.productoId,
        sucursalId: v.sucursalId,
        serial: v.serial.trim().toUpperCase(),
        estado: v.estado,
      };
      const res = await lastValueFrom(this.serialService.create(dto));
      if (res?.status === 201) {
        this.alertService.showSuccess('Serial registrado', res.message);
        this.itemSaved.emit(res.data);
        this.closeModal();
      }
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.message ?? 'No se pudo registrar el serial.',
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
