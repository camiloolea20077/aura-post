import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import {
  EmpresaConfig,
  EmpresaDatosUpdate,
  EmpresaService,
} from '../../core/services/empresa.service';
import { StorageService } from '../../core/services/storage.service';
import { IndexDBService } from '../../core/services/index-db.service';
import { AlertService } from '../../shared/pipes/alert.service';
import { FechaEsPipe } from '../../shared/pipes/fecha-es.pipe';

/** El logo sale en facturas y PDF: imagen liviana. */
const LOGO_MAX_BYTES = 2 * 1024 * 1024;

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    CalendarModule,
    TagModule,
    TooltipModule,
    ToastModule,
    ProgressSpinnerModule,
    FechaEsPipe,
  ],
  providers: [MessageService],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
})
export class PerfilComponent implements OnInit {
  cargando = true;
  guardando = false;
  subiendoLogo = false;
  editando = false;

  // ── Usuario ────────────────────────────────────────────────
  nombreCompleto = '';
  username = '';
  rol = '';
  sucursalNombre = '';
  sucursales: string[] = [];

  // ── Empresa ────────────────────────────────────────────────
  empresa: EmpresaConfig | null = null;
  form: FormGroup;

  /**
   * Ver la empresa lo puede todo el mundo; editarla lo decide el back
   * (SUPER_ADMIN o acción especial "Editar datos de la empresa" del perfil).
   */
  get puedeEditar(): boolean {
    return !!this.empresa?.puedeEditar;
  }

  get iniciales(): string {
    const partes = (this.nombreCompleto || this.username || '?')
      .trim()
      .split(/\s+/);
    return (partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '');
  }

  /** El logo que se ve: el recién subido mientras se edita, o el guardado. */
  get logoVisible(): string | null {
    return (this.editando ? this.form.value.logoUrl : this.empresa?.logoUrl) || null;
  }

  /** Días que le quedan a la resolución; null si no tiene fecha final. */
  get diasResolucion(): number | null {
    const fin = this.aFecha(this.empresa?.resolucionFechaHasta);
    if (!fin) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return Math.round((fin.getTime() - hoy.getTime()) / 86_400_000);
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly empresaService: EmpresaService,
    private readonly storage: StorageService,
    private readonly indexDB: IndexDBService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      nombreComercial: ['', Validators.maxLength(255)],
      logoUrl: [''],
      telefono: ['', Validators.maxLength(30)],
      correo: ['', [Validators.email, Validators.maxLength(150)]],
      direccion: ['', Validators.maxLength(200)],
      municipio: ['', Validators.maxLength(120)],
      resolucionNumero: ['', Validators.maxLength(50)],
      resolucionPrefijo: ['', Validators.maxLength(20)],
      resolucionDesde: [null as number | null, Validators.min(0)],
      resolucionHasta: [null as number | null, Validators.min(0)],
      resolucionFechaDesde: [null as Date | null],
      resolucionFechaHasta: [null as Date | null],
      factusNumberingRangeId: [null as number | null, Validators.min(1)],
      factusNominaNumberingRangeId: ['', Validators.maxLength(40)],
    });
  }

  async ngOnInit(): Promise<void> {
    await Promise.all([this.cargarUsuario(), this.cargarEmpresa()]);
    this.cargando = false;
    this.cdr.markForCheck();
  }

  private async cargarUsuario(): Promise<void> {
    const auth = await this.indexDB.loadDataAuthDB();
    if (!auth) return;
    this.nombreCompleto = auth.nombreCompleto ?? '';
    this.username = (auth as any).username ?? '';
    this.rol = auth.rol ?? '';
    this.sucursales = (auth.sucursales ?? []).map((s: any) => s.nombre);
    const actual =
      (auth.sucursales ?? []).find((s: any) => s.esDefault) ??
      (auth.sucursales ?? [])[0];
    this.sucursalNombre = actual?.nombre ?? '';
  }

  private async cargarEmpresa(): Promise<void> {
    try {
      const res = await lastValueFrom(this.empresaService.getConfig());
      this.empresa = res?.data ?? null;
      this.volcarAlFormulario();
    } catch {
      this.empresa = null;
    }
  }

  private volcarAlFormulario(): void {
    const e = this.empresa;
    this.form.reset({
      nombreComercial: e?.nombreComercial ?? '',
      logoUrl: e?.logoUrl ?? '',
      telefono: e?.telefono ?? '',
      correo: e?.correo ?? '',
      direccion: e?.direccion ?? '',
      municipio: e?.municipio ?? '',
      resolucionNumero: e?.resolucionNumero ?? '',
      resolucionPrefijo: e?.resolucionPrefijo ?? '',
      resolucionDesde: e?.resolucionDesde ?? null,
      resolucionHasta: e?.resolucionHasta ?? null,
      resolucionFechaDesde: this.aFecha(e?.resolucionFechaDesde),
      resolucionFechaHasta: this.aFecha(e?.resolucionFechaHasta),
      factusNumberingRangeId: e?.factusNumberingRangeId ?? null,
      factusNominaNumberingRangeId: e?.factusNominaNumberingRangeId ?? '',
    });
  }

  editar(): void {
    if (!this.puedeEditar) return;
    this.editando = true;
  }

  cancelar(): void {
    this.editando = false;
    this.volcarAlFormulario();
  }

  async elegirLogo(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.alert.showError('Logo', 'El archivo debe ser una imagen (PNG, JPG o SVG)');
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      this.alert.showError('Logo', 'La imagen no puede pesar más de 2 MB');
      return;
    }
    this.subiendoLogo = true;
    try {
      const res = await lastValueFrom(this.storage.uploadImagen(file, 'logos'));
      this.form.patchValue({ logoUrl: res?.url ?? '' });
    } catch (err: any) {
      this.alert.showError('Logo', err?.error?.message ?? 'No se pudo subir la imagen');
    } finally {
      this.subiendoLogo = false;
      this.cdr.markForCheck();
    }
  }

  quitarLogo(): void {
    this.form.patchValue({ logoUrl: '' });
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value;
    if (v.resolucionDesde != null && v.resolucionHasta != null && v.resolucionDesde > v.resolucionHasta) {
      this.alert.showError('Resolución', 'El consecutivo inicial no puede ser mayor que el final');
      return;
    }
    if (v.resolucionFechaDesde && v.resolucionFechaHasta && v.resolucionFechaDesde > v.resolucionFechaHasta) {
      this.alert.showError('Resolución', 'La fecha inicial no puede ser posterior a la final');
      return;
    }

    const dto: EmpresaDatosUpdate = {
      nombreComercial: this.texto(v.nombreComercial),
      logoUrl: this.texto(v.logoUrl),
      telefono: this.texto(v.telefono),
      correo: this.texto(v.correo),
      direccion: this.texto(v.direccion),
      municipio: this.texto(v.municipio),
      resolucionNumero: this.texto(v.resolucionNumero),
      resolucionPrefijo: this.texto(v.resolucionPrefijo)?.toUpperCase() ?? null,
      resolucionDesde: v.resolucionDesde ?? null,
      resolucionHasta: v.resolucionHasta ?? null,
      resolucionFechaDesde: this.aIso(v.resolucionFechaDesde),
      resolucionFechaHasta: this.aIso(v.resolucionFechaHasta),
      factusNumberingRangeId: v.factusNumberingRangeId ?? null,
      factusNominaNumberingRangeId: this.texto(v.factusNominaNumberingRangeId),
    };

    this.guardando = true;
    try {
      const res = await lastValueFrom(this.empresaService.actualizarDatos(dto));
      this.empresa = res?.data ?? this.empresa;
      this.volcarAlFormulario();
      this.editando = false;
      this.alert.showSuccess('Guardado', 'Datos de la empresa actualizados');
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudieron guardar los datos',
      );
    } finally {
      this.guardando = false;
      this.cdr.markForCheck();
    }
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  private texto(v: unknown): string | null {
    const s = typeof v === 'string' ? v.trim() : '';
    return s ? s : null;
  }

  /** "AAAA-MM-DD" → fecha local (sin correrse un día por la zona horaria). */
  private aFecha(v: string | null | undefined): Date | null {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v ?? '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }

  private aIso(d: Date | null | undefined): string | null {
    if (!d) return null;
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }
}
