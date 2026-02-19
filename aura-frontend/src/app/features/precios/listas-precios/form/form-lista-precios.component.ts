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
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import {
  CreateListaPreciosDto,
  ListaPreciosModel,
  UpdateListaPreciosDto,
} from '../../../../core/models/lista-precios.model';
import { ListaPreciosService } from '../../../../core/services/lista-precios.service';
import { AlertService } from '../../../../shared/pipes/alert.service';

@Component({
  selector: 'app-form-lista-precios',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    InputSwitchModule,
    ButtonModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './form-lista-precios.component.html',
  styleUrls: ['./form-lista-precios.component.scss'],
})
export class FormListaPreciosComponent implements OnInit, OnChanges {
  @Input() displayModal = false;
  @Input() listaId: number | null = null;
  @Input() slug = 'create';

  @Output() modalClosed = new EventEmitter<void>();
  @Output() listaSaved = new EventEmitter<ListaPreciosModel>();

  public frmLista!: FormGroup;
  public isEditMode = false;
  public isSubmitting = false;
  public isLoading = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly listaPreciosService: ListaPreciosService,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayModal'] && this.displayModal) {
      this.isEditMode = this.slug === 'edit' && !!this.listaId;
      this.isEditMode ? this.loadData(this.listaId!) : this.resetForm();
    }
  }

  private initForm(): void {
    this.frmLista = this.fb.group({
      nombre: [
        null,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
        ],
      ],
      activa: [true, Validators.required],
    });
  }

  private resetForm(): void {
    this.frmLista?.reset({ nombre: null, activa: true });
  }

  isInvalid(f: string): boolean {
    const c = this.frmLista.get(f);
    return !!(c?.invalid && c?.touched);
  }

  private async loadData(id: number): Promise<void> {
    this.isLoading = true;
    try {
      const res = await lastValueFrom(this.listaPreciosService.getById(id));
      if (res?.data)
        this.frmLista.patchValue({
          nombre: res.data.nombre,
          activa: res.data.activa,
        });
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar la lista.');
      this.closeModal();
    } finally {
      this.isLoading = false;
    }
  }

  async saveLista(): Promise<void> {
    if (this.frmLista.invalid) {
      this.frmLista.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    try {
      const v = this.frmLista.value;
      const dto = { nombre: v.nombre.trim(), activa: v.activa };
      const obs = this.isEditMode
        ? this.listaPreciosService.update(
            this.listaId!,
            dto as UpdateListaPreciosDto,
          )
        : this.listaPreciosService.create(dto as CreateListaPreciosDto);

      const res = await lastValueFrom(obs);
      if (res?.status === 200 || res?.status === 201) {
        this.alertService.showSuccess(
          this.isEditMode ? 'Lista actualizada' : 'Lista creada',
          res.message,
        );
        this.listaSaved.emit(res.data);
        this.closeModal();
      }
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.message ?? 'No se pudo guardar.',
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
