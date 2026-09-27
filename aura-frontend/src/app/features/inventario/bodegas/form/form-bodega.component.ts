import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { lastValueFrom } from 'rxjs';
import { BodegaTableModel } from '../../../../core/models/bodega.model';
import { BodegaService } from '../../../../core/services/bodega.service';
import { SucursalService } from '../../../../core/services/sucursal.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { AlertService } from '../../../../shared/pipes/alert.service';

@Component({
  selector: 'app-form-bodega',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    SelectButtonModule,
    DialogModule,
    MessageModule,
  ],
  templateUrl: './form-bodega.component.html',
  styleUrls: ['./form-bodega.component.scss'],
})
export class FormBodegaComponent implements OnChanges {
  @Input() visible = false;
  @Input() bodega: BodegaTableModel | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<BodegaTableModel>();

  form: FormGroup;
  loading = false;

  sucursales: { label: string; value: number }[] = [];
  usuarios: { label: string; value: number }[] = [];

  /** Botones de opción, no switches: apagados se leen mal. */
  readonly opcionesSiNo = [
    { label: 'Sí', value: true },
    { label: 'No', value: false },
  ];

  get isEdit(): boolean {
    return !!this.bodega;
  }

  /** La principal no se puede desmarcar desde aquí: se marca otra. */
  get esPrincipalActual(): boolean {
    return !!this.bodega?.esPrincipal;
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: BodegaService,
    private readonly sucursalService: SucursalService,
    private readonly usuarioService: UsuarioService,
    private readonly alert: AlertService,
  ) {
    this.form = this.fb.group({
      sucursalId: [null as number | null, Validators.required],
      codigo: ['', Validators.maxLength(20)],
      nombre: ['', [Validators.required, Validators.maxLength(80)]],
      responsableUsuarioId: [null as number | null],
      esPrincipal: [false],
      permiteVenta: [true],
      ubicacion: ['', Validators.maxLength(120)],
      observacion: ['', Validators.maxLength(300)],
      activa: [true],
    });
  }

  ngOnChanges(): void {
    if (!this.visible) return;

    this.form.reset({
      sucursalId: null,
      codigo: '',
      nombre: '',
      responsableUsuarioId: null,
      esPrincipal: false,
      permiteVenta: true,
      ubicacion: '',
      observacion: '',
      activa: true,
    });

    this.cargarCombos();

    if (this.bodega) {
      this.form.patchValue({
        sucursalId: this.bodega.sucursalId,
        codigo: this.bodega.codigo ?? '',
        nombre: this.bodega.nombre,
        responsableUsuarioId: this.bodega.responsableUsuarioId,
        esPrincipal: this.bodega.esPrincipal,
        permiteVenta: this.bodega.permiteVenta,
        ubicacion: this.bodega.ubicacion ?? '',
        observacion: this.bodega.observacion ?? '',
        activa: this.bodega.activa,
      });
      // Mover una bodega de sucursal movería su stock: no se permite.
      this.form.get('sucursalId')?.disable();
    } else {
      this.form.get('sucursalId')?.enable();
    }
  }

  private async cargarCombos(): Promise<void> {
    try {
      const [suc, usr] = await Promise.all([
        lastValueFrom(this.sucursalService.getActivas()),
        lastValueFrom(
          this.usuarioService.page({ page: 0, rows: 200, search: null } as any),
        ),
      ]);
      this.sucursales = (suc?.data ?? []).map((s: any) => ({
        label: s.nombre,
        value: s.id,
      }));
      this.usuarios = (usr?.data?.content ?? [])
        .filter((u: any) => u.activo)
        .map((u: any) => ({
          label: u.nombreCompleto || u.username,
          value: u.id,
        }));
    } catch {
      // Los combos vacíos no impiden ver el formulario; el guardado avisa.
    }
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const v = this.form.getRawValue();
    const payload = {
      codigo: v.codigo?.trim() || null,
      nombre: v.nombre.trim(),
      responsableUsuarioId: v.responsableUsuarioId ?? null,
      esPrincipal: !!v.esPrincipal,
      permiteVenta: !!v.permiteVenta,
      ubicacion: v.ubicacion?.trim() || null,
      observacion: v.observacion?.trim() || null,
    };

    try {
      if (this.isEdit) {
        const res = await lastValueFrom(
          this.service.update(this.bodega!.id, { ...payload, activa: v.activa }),
        );
        this.alert.showSuccess('Actualizada', 'Bodega actualizada');
        this.saved.emit(res?.data);
      } else {
        const res = await lastValueFrom(
          this.service.create({ ...payload, sucursalId: v.sucursalId }),
        );
        this.alert.showSuccess('Creada', 'Bodega creada');
        this.saved.emit(res?.data);
      }
      this.close();
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudo guardar la bodega',
      );
    } finally {
      this.loading = false;
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }
}
