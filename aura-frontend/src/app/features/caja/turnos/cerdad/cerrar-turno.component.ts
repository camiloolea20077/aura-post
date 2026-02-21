import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import {
  CerrarTurnoDto,
  TurnoCajaModel,
  ResumenTurnoDto,
  VentaCategoriaDto,
  VentaMetodoPagoDto,
} from '../../../../core/models/caja.model';
import { TurnoCajaService } from '../../../../core/services/caja.service';
import { AlertService } from '../../../../shared/pipes/alert.service';

@Component({
  selector: 'app-cerrar-turno',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    InputNumberModule,
    DividerModule,
    ButtonModule,
    ToastModule,
    SkeletonModule,
  ],
  providers: [MessageService],
  templateUrl: './cerrar-turno.component.html',
  styleUrls: ['./cerrar-turno.component.scss'],
})
export class CerrarTurnoComponent implements OnChanges {
  @Input() displayModal = false;
  @Input() turno: TurnoCajaModel | null = null;
  @Output() modalClosed = new EventEmitter<void>();
  @Output() turnoCerrado = new EventEmitter<ResumenTurnoDto>();

  frmCerrar!: FormGroup;
  isSubmitting = false;
  loadingResumen = false;
  resumen: ResumenTurnoDto | null = null;
  readonly Math = Math;

  constructor(
    private readonly fb: FormBuilder,
    private readonly turnoCajaService: TurnoCajaService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.frmCerrar = this.fb.group({
      totalEfectivoReal: [null, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayModal'] && this.displayModal) {
      this.frmCerrar.reset({ totalEfectivoReal: null });
      this.resumen = null;
      if (this.turno) this.cargarResumen();
    }
  }

  // ── Carga el resumen al abrir el dialog ───────────────────
  private async cargarResumen(): Promise<void> {
    if (!this.turno) return;
    this.loadingResumen = true;
    try {
      const res = await lastValueFrom(
        this.turnoCajaService.resumen(this.turno.id),
      );
      this.resumen = res?.data ?? null;
    } catch {
      // Si falla el resumen, no bloqueamos el cierre
    } finally {
      this.loadingResumen = false;
      this.cdr.markForCheck();
    }
  }

  // ── Diferencia calculada en tiempo real ───────────────────
  get diferencia(): number | null {
    const real = this.frmCerrar.get('totalEfectivoReal')?.value;
    const sistema = this.turno?.totalEfectivoSistema ?? 0;
    if (real === null || real === undefined) return null;
    return real - (sistema + (this.turno?.baseInicial ?? 0));
  }

  get diferenciaClass(): string {
    const d = this.diferencia;
    if (d === null) return '';
    if (d > 0) return 'dif-sobrante';
    if (d < 0) return 'dif-faltante';
    return 'dif-exacto';
  }

  get diferenciaLabel(): string {
    const d = this.diferencia;
    if (d === null) return '';
    if (d > 0) return 'Sobrante';
    if (d < 0) return 'Faltante';
    return 'Cuadre exacto ✓';
  }

  // ── Icono por método de pago ──────────────────────────────
  metodoPagoIcon(metodo: string): string {
    const icons: Record<string, string> = {
      EFECTIVO: 'pi pi-money-bill',
      NEQUI: 'pi pi-mobile',
      TARJETA: 'pi pi-credit-card',
    };
    return icons[metodo] ?? 'pi pi-wallet';
  }

  // ── Helpers de formato ────────────────────────────────────
  isInvalid(f: string): boolean {
    const c = this.frmCerrar.get(f);
    return !!(c?.invalid && c?.touched);
  }

  formatCOP(v: number | null | undefined): string {
    if (v === null || v === undefined) return '—';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v);
  }

  formatFecha(f: string | null): string {
    if (!f) return '—';
    return new Date(f).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // ── Cerrar turno ──────────────────────────────────────────
  async cerrarTurno(): Promise<void> {
    if (this.frmCerrar.invalid || !this.turno) {
      this.frmCerrar.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    try {
      const dto: CerrarTurnoDto = {
        totalEfectivoReal: this.frmCerrar.value.totalEfectivoReal,
      };
      const res = await lastValueFrom(
        this.turnoCajaService.cerrar(this.turno.id, dto),
      );
      if (res?.data) {
        this.alertService.showSuccess(
          'Turno cerrado',
          `Caja "${res.data.cajaNombre}" cerrada correctamente.`,
        );
        this.turnoCerrado.emit(res.data as unknown as ResumenTurnoDto);
        this.closeModal();
      }
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.error?.message ?? 'No se pudo cerrar el turno.',
      );
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  closeModal(): void {
    this.frmCerrar.reset({ totalEfectivoReal: null });
    this.resumen = null;
    this.modalClosed.emit();
  }
}
