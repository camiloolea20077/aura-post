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
  AbstractControl,
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
import { DividerModule } from 'primeng/divider';
import { TabViewModule } from 'primeng/tabview';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import {
  CreateTerceroDto,
  esPersonaJuridica,
  RESPONSABILIDAD_FISCAL_OPTIONS,
  TerceroModel,
  TIPO_DOCUMENTO_OPTIONS,
  TipoDocumento,
} from '../../../core/models/tercero.model';
import { TerceroService } from '../../../core/services/tercero.service';
import { AlertService } from '../../../shared/pipes/alert.service';

@Component({
  selector: 'app-form-tercero',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    InputSwitchModule,
    DropdownModule,
    DividerModule,
    TabViewModule,
    ButtonModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './form-tercero.component.html',
  styleUrls: ['./form-tercero.component.scss'],
})
export class FormTerceroComponent implements OnInit, OnChanges {
  @Input() displayModal = false;
  @Input() terceroId: number | null = null;
  @Input() slug = 'create';

  @Output() modalClosed = new EventEmitter<void>();
  @Output() terceroSaved = new EventEmitter<TerceroModel>();

  public frmTercero!: FormGroup;
  public isEditMode = false;
  public isSubmitting = false;
  public isLoading = false;

  public readonly tipoDocOpts = TIPO_DOCUMENTO_OPTIONS;
  public readonly respFiscalOpts = RESPONSABILIDAD_FISCAL_OPTIONS;

  // Persona natural vs jurídica (reactivo)
  public esJuridica = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly terceroService: TerceroService,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayModal'] && this.displayModal) {
      this.isEditMode = this.slug === 'edit' && !!this.terceroId;
      this.isEditMode ? this.loadData(this.terceroId!) : this.resetForm();
    }
  }

  // ─── Init ────────────────────────────────────────────────
  private initForm(): void {
    this.frmTercero = this.fb.group(
      {
        // Identificación
        tipoDocumento: ['CC', Validators.required],
        numeroDocumento: [
          null,
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(20),
          ],
        ],
        dv: [null, Validators.maxLength(2)],
        // Persona jurídica
        razonSocial: [null, Validators.maxLength(200)],
        // Persona natural
        nombres: [null, Validators.maxLength(100)],
        apellidos: [null, Validators.maxLength(100)],
        // Contacto
        telefono: [null, Validators.maxLength(20)],
        email: [null, [Validators.email, Validators.maxLength(100)]],
        emailFe: [null, [Validators.email, Validators.maxLength(100)]],
        direccion: [null, Validators.maxLength(200)],
        responsabilidadFiscal: [null],
        // Roles
        esCliente: [true],
        esProveedor: [false],
        esEmpleado: [false],
        activo: [true],
      },
      { validators: this.validarNombre },
    );

    // Reaccionar al cambio de tipoDocumento
    this.frmTercero
      .get('tipoDocumento')
      ?.valueChanges.subscribe((tipo: TipoDocumento) => {
        this.esJuridica = esPersonaJuridica(tipo);
        // Limpiar campos del tipo opuesto
        if (this.esJuridica) {
          this.frmTercero.patchValue({ nombres: null, apellidos: null });
        } else {
          this.frmTercero.patchValue({ razonSocial: null, dv: null });
        }
      });
  }

  private validarNombre(g: AbstractControl) {
    const razon = g.get('razonSocial')?.value;
    const nombres = g.get('nombres')?.value;
    const tipo = g.get('tipoDocumento')?.value;
    const juridica = esPersonaJuridica(tipo);

    if (juridica && !razon?.trim()) return { razonSocialRequerida: true };
    if (!juridica && !nombres?.trim()) return { nombresRequeridos: true };
    return null;
  }

  private resetForm(): void {
    this.esJuridica = false;
    this.frmTercero?.reset({
      tipoDocumento: 'CC',
      numeroDocumento: null,
      dv: null,
      razonSocial: null,
      nombres: null,
      apellidos: null,
      telefono: null,
      email: null,
      emailFe: null,
      direccion: null,
      responsabilidadFiscal: null,
      esCliente: true,
      esProveedor: false,
      esEmpleado: false,
      activo: true,
    });
  }

  isInvalid(f: string): boolean {
    const c = this.frmTercero.get(f);
    return !!(c?.invalid && c?.touched);
  }

  get tipoActual(): TipoDocumento {
    return this.frmTercero.get('tipoDocumento')?.value ?? 'CC';
  }

  // ─── Carga edición ───────────────────────────────────────
  private async loadData(id: number): Promise<void> {
    this.isLoading = true;
    try {
      const res = await lastValueFrom(this.terceroService.getById(id));
      if (res?.data) {
        const d = res.data;
        this.esJuridica = esPersonaJuridica(d.tipoDocumento);
        setTimeout(() => {
          this.frmTercero.patchValue(
            {
              tipoDocumento: d.tipoDocumento,
              numeroDocumento: d.numeroDocumento,
              dv: d.dv,
              razonSocial: d.razonSocial,
              nombres: d.nombres,
              apellidos: d.apellidos,
              telefono: d.telefono,
              email: d.email,
              emailFe: d.emailFe,
              direccion: d.direccion,
              responsabilidadFiscal: d.responsabilidadFiscal,
              esCliente: d.esCliente,
              esProveedor: d.esProveedor,
              esEmpleado: d.esEmpleado,
              activo: d.activo,
            },
            { emitEvent: false },
          );
        });
      }
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar el tercero.');
      this.closeModal();
    } finally {
      this.isLoading = false;
    }
  }

  // ─── Guardar ─────────────────────────────────────────────
  async saveTercero(): Promise<void> {
    if (this.frmTercero.invalid) {
      this.frmTercero.markAllAsTouched();
      const err = this.frmTercero.errors;
      if (err?.['razonSocialRequerida'])
        return void this.alertService.showWarn(
          'Datos incompletos',
          'Ingresa la razón social.',
        );
      if (err?.['nombresRequeridos'])
        return void this.alertService.showWarn(
          'Datos incompletos',
          'Ingresa el nombre del tercero.',
        );
      this.alertService.showWarn(
        'Formulario incompleto',
        'Revisa los campos requeridos.',
      );
      return;
    }

    const v = this.frmTercero.value;
    const dto: CreateTerceroDto = {
      tipoDocumento: v.tipoDocumento,
      numeroDocumento: v.numeroDocumento.trim(),
      dv: this.esJuridica ? v.dv?.trim() || null : null,
      razonSocial: this.esJuridica ? v.razonSocial?.trim() || null : null,
      nombres: !this.esJuridica ? v.nombres?.trim() || null : null,
      apellidos: !this.esJuridica ? v.apellidos?.trim() || null : null,
      telefono: v.telefono?.trim() || null,
      email: v.email?.trim() || null,
      emailFe: v.emailFe?.trim() || null,
      direccion: v.direccion?.trim() || null,
      responsabilidadFiscal: v.responsabilidadFiscal || null,
      esCliente: v.esCliente,
      esProveedor: v.esProveedor,
      esEmpleado: v.esEmpleado,
      activo: v.activo,
    };

    this.isSubmitting = true;
    try {
      const obs = this.isEditMode
        ? this.terceroService.update(this.terceroId!, {
            ...dto,
            id: this.terceroId!,
          })
        : this.terceroService.create(dto);

      const res = await lastValueFrom(obs);
      if (res?.status === 200 || res?.status === 201) {
        this.alertService.showSuccess(
          this.isEditMode ? 'Tercero actualizado' : 'Tercero creado',
          res.message,
        );
        this.terceroSaved.emit(res.data);
        this.closeModal();
      }
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.message ?? 'No se pudo guardar el tercero.',
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
