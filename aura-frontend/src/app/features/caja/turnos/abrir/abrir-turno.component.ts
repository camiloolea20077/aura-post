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
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import {
  CajaService,
  TurnoCajaService,
} from '../../../../core/services/caja.service';
import {
  AbrirTurnoDto,
  TurnoCajaModel,
} from '../../../../core/models/caja.model';
import { AlertService } from '../../../../shared/pipes/alert.service';

@Component({
  selector: 'app-abrir-turno',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    InputNumberModule,
    DropdownModule,
    ButtonModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './abrir-turno.component.html',
  styleUrls: ['./abrir-turno.component.scss'],
})
export class AbrirTurnoComponent implements OnInit, OnChanges {
  @Input() displayModal = false;
  @Output() modalClosed = new EventEmitter<void>();
  @Output() turnoAbierto = new EventEmitter<TurnoCajaModel>();

  public frmAbrir!: FormGroup;
  public cajasOpts: { label: string; value: number; sucursal: string }[] = [];
  public isSubmitting = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly turnoCajaService: TurnoCajaService,
    private readonly cajaService: CajaService,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCajas();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayModal'] && this.displayModal)
      this.frmAbrir?.reset({ cajaId: null, baseInicial: null });
  }

  private initForm(): void {
    this.frmAbrir = this.fb.group({
      cajaId: [null, Validators.required],
      baseInicial: [null, [Validators.required, Validators.min(0)]],
    });
  }

  private async loadCajas(): Promise<void> {
    try {
      const res = await lastValueFrom(
        this.cajaService.page({ page: 0, rows: 100 }),
      );
      if (res?.data?.content)
        this.cajasOpts = res.data.content
          .filter((c: any) => c.activa)
          .map((c: any) => ({
            label: c.nombre,
            value: c.id,
            sucursal: c.sucursalNombre,
          }));
    } catch {
      /* silencioso */
    }
  }

  isInvalid(f: string): boolean {
    const c = this.frmAbrir.get(f);
    return !!(c?.invalid && c?.touched);
  }

  get cajaSeleccionada() {
    const id = this.frmAbrir.get('cajaId')?.value;
    return this.cajasOpts.find((c) => c.value === id) ?? null;
  }

  async abrirTurno(): Promise<void> {
    if (this.frmAbrir.invalid) {
      this.frmAbrir.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    try {
      const dto: AbrirTurnoDto = this.frmAbrir.value;
      const res = await lastValueFrom(this.turnoCajaService.abrir(dto));
      if (res?.status === 201) {
        this.alertService.showSuccess(
          'Turno abierto',
          `Caja ${res.data?.cajaNombre} — turno #${res.data?.id} activo.`,
        );
        this.turnoAbierto.emit(res.data);
        this.closeModal();
      }
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.message ?? 'No se pudo abrir el turno.',
      );
    } finally {
      this.isSubmitting = false;
    }
  }

  closeModal(): void {
    this.frmAbrir.reset({ cajaId: null, baseInicial: null });
    this.modalClosed.emit();
  }
}
