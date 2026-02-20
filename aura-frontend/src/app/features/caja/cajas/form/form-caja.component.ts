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
import { InputSwitchModule } from 'primeng/inputswitch';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import {
  CajaModel,
  CreateCajaDto,
  UpdateCajaDto,
} from '../../../../core/models/caja.model';
import { CajaService } from '../../../../core/services/caja.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { IndexDBService } from '../../../../core/services/index-db.service';

@Component({
  selector: 'app-form-caja',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    InputSwitchModule,
    DropdownModule,
    ButtonModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './form-caja.component.html',
  styleUrls: ['./form-caja.component.scss'],
})
export class FormCajaComponent implements OnInit, OnChanges {
  @Input() displayModal = false;
  @Input() cajaId: number | null = null;
  @Input() slug = 'create';

  @Output() modalClosed = new EventEmitter<void>();
  @Output() cajaSaved = new EventEmitter<CajaModel>();

  public frmCaja!: FormGroup;
  public isEditMode = false;
  public isSubmitting = false;
  public isLoading = false;

  public sucursalesOpts: { label: string; value: number }[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly indexDBService: IndexDBService,
    private readonly cajaService: CajaService,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadSucursales();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayModal'] && this.displayModal) {
      this.isEditMode = this.slug === 'edit' && !!this.cajaId;
      this.isEditMode ? this.loadData(this.cajaId!) : this.resetForm();
    }
  }

  private initForm(): void {
    this.frmCaja = this.fb.group({
      sucursalId: [null, Validators.required],
      nombre: [
        null,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
        ],
      ],
      activa: [true],
    });
  }

  private resetForm(): void {
    this.frmCaja?.reset({ sucursalId: null, nombre: null, activa: true });
    if (this.isEditMode) this.frmCaja.get('sucursalId')?.disable();
  }

  isInvalid(f: string): boolean {
    const c = this.frmCaja.get(f);
    return !!(c?.invalid && c?.touched);
  }

  private async loadSucursales(): Promise<void> {
    try {
      const auth = await this.indexDBService.loadDataAuthDB();
      if (auth?.sucursales) {
        this.sucursalesOpts = auth.sucursales.map((s) => ({
          label: s.nombre,
          value: s.id,
        }));
      }
    } catch {
      /* silencioso */
    }
  }

  private async loadData(id: number): Promise<void> {
    this.isLoading = true;
    try {
      const res = await lastValueFrom(this.cajaService.getById(id));
      if (res?.data) {
        setTimeout(() =>
          this.frmCaja.patchValue(
            {
              sucursalId: res.data.sucursalId,
              nombre: res.data.nombre,
              activa: res.data.activa,
            },
            { emitEvent: false },
          ),
        );
        this.frmCaja.get('sucursalId')?.disable();
      }
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar la caja.');
      this.closeModal();
    } finally {
      this.isLoading = false;
    }
  }

  async saveCaja(): Promise<void> {
    if (this.frmCaja.invalid) {
      this.frmCaja.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    try {
      const v = this.frmCaja.getRawValue();
      const obs = this.isEditMode
        ? this.cajaService.update(this.cajaId!, {
            nombre: v.nombre.trim(),
            activa: v.activa,
          } as UpdateCajaDto)
        : this.cajaService.create({
            sucursalId: v.sucursalId,
            nombre: v.nombre.trim(),
            activa: v.activa,
          } as CreateCajaDto);

      const res = await lastValueFrom(obs);
      if (res?.status === 200 || res?.status === 201) {
        this.alertService.showSuccess(
          this.isEditMode ? 'Caja actualizada' : 'Caja creada',
          res.message,
        );
        this.cajaSaved.emit(res.data);
        this.closeModal();
      }
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.message ?? 'No se pudo guardar la caja.',
      );
    } finally {
      this.isSubmitting = false;
    }
  }

  closeModal(): void {
    this.frmCaja.get('sucursalId')?.enable();
    this.frmCaja.reset({ sucursalId: null, nombre: null, activa: true });
    this.modalClosed.emit();
  }
}
