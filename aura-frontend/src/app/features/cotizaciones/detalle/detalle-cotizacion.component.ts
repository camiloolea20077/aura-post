import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService, ConfirmationService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import {
  CotizacionModel,
  EstadoCotizacion,
} from '../../../core/models/cotizacion.model';
import { CotizacionService } from '../../../core/services/cotizacion.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { EmpresaService } from '../../../core/services/empresa.service';
import { CotizacionPdfService } from '../../../core/services/cotizacion-pdf.service';
import { ModalTirillaCotizacionComponent } from '../../pos/components/modal-tirilla-cotizacion/modal-tirilla-cotizacion.component';

@Component({
  selector: 'app-detalle-cotizacion',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    TagModule,
    DividerModule,
    ToastModule,
    ConfirmDialogModule,
    SkeletonModule,
    ModalTirillaCotizacionComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './detalle-cotizacion.component.html',
  styleUrls: ['./detalle-cotizacion.component.scss'],
})
export class DetalleCotizacionComponent implements OnChanges {
  @Input() cotizacionId: number | null = null;
  @Input() visible = false;
  @Output() closed = new EventEmitter<void>();
  @Output() anulada = new EventEmitter<void>();

  public cotizacion: CotizacionModel | null = null;
  public isLoading = false;
  public isAnulando = false;
  public isConvirtiendo = false;

  // tirilla
  public showTirilla = false;
  public empresaNombre = '';
  public empresaNit = '';
  public empresaDireccion = '';
  public empresaTelefono = '';
  public empresaEmail = '';
  public municipio = '';
  public logoUrl = '';
  public isDescargandoPdf = false;

  constructor(
    private readonly cotizacionService: CotizacionService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
    private readonly router: Router,
    private readonly empresaService: EmpresaService,
    private readonly cotizacionPdf: CotizacionPdfService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.cotizacionId) {
      this.loadCotizacion(this.cotizacionId);
    }
    if (changes['visible'] && !this.visible) {
      this.cotizacion = null;
    }
  }

  private async loadCotizacion(id: number): Promise<void> {
    this.isLoading = true;
    try {
      const res = await lastValueFrom(this.cotizacionService.getById(id));
      this.cotizacion = res?.data ?? null;
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar la cotización.');
      this.closePanel();
    } finally {
      this.isLoading = false;
    }
  }

  confirmarAnular(): void {
    this.confirmationService.confirm({
      message: `¿Anular la cotización <strong>${this.cotizacion?.numero}</strong>?`,
      header: 'Confirmar anulación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, anular',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.anularCotizacion(),
    });
  }

  private async anularCotizacion(): Promise<void> {
    if (!this.cotizacion) return;
    this.isAnulando = true;
    try {
      await lastValueFrom(this.cotizacionService.anular(this.cotizacion.id));
      this.alertService.showSuccess('Cotización anulada', '');
      this.anulada.emit();
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.error?.message ?? 'No se pudo anular.',
      );
    } finally {
      this.isAnulando = false;
    }
  }

  async convertirAVenta(): Promise<void> {
    if (!this.cotizacion) return;
    this.isConvirtiendo = true;
    try {
      const res = await lastValueFrom(
        this.cotizacionService.convertirAVenta(this.cotizacion.id),
      );
      const cotizacion = res?.data;
      if (!cotizacion) return;
      this.closePanel();
      this.router.navigate(['/pos'], { state: { cotizacion } });
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.error?.message ?? 'No se pudo convertir.',
      );
    } finally {
      this.isConvirtiendo = false;
    }
  }

  async imprimir(): Promise<void> {
    if (!this.cotizacion) return;
    try {
      const res = await lastValueFrom(this.empresaService.getConfig());
      const empresa = res?.data;
      this.empresaNombre = empresa?.razonSocial ?? '';
      this.empresaNit = empresa?.nit ?? '';
      this.empresaDireccion = empresa?.direccion ?? '';
      this.empresaTelefono = empresa?.telefono ?? '';
      this.empresaEmail = empresa?.correo ?? '';
      this.municipio = empresa?.municipio ?? '';
      this.logoUrl = empresa?.logoUrl ?? '';
      this.showTirilla = true;
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar los datos de la empresa.');
    }
  }

  async descargarPdf(): Promise<void> {
    if (!this.cotizacion) return;
    this.isDescargandoPdf = true;
    try {
      const res = await lastValueFrom(this.empresaService.getConfig());
      await this.cotizacionPdf.cotizacion(this.cotizacion, res?.data ?? {});
    } catch {
      this.alertService.showError('Error', 'No se pudo generar el PDF.');
    } finally {
      this.isDescargandoPdf = false;
    }
  }

  closePanel(): void {
    this.closed.emit();
  }

  getEstadoSeverity(
    e: EstadoCotizacion,
  ):
    | 'success'
    | 'secondary'
    | 'info'
    | 'warn'
    | 'danger'
    | 'contrast'
    | undefined {
    const map = {
      PENDIENTE: 'info',
      VENCIDA: 'warn',
      ANULADA: 'danger',
      CONVERTIDA: 'success',
    } as const;
    return map[e] ?? 'secondary';
  }
  getEstadoLabel(e: EstadoCotizacion): string {
    const labels: Record<EstadoCotizacion, string> = {
      PENDIENTE: 'Pendiente',
      VENCIDA: 'Vencida',
      ANULADA: 'Anulada',
      CONVERTIDA: 'Convertida',
    };
    return labels[e] ?? e;
  }

  formatCOP = (v: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);

  formatFecha(f: string): string {
    return new Date(f).toLocaleDateString('es-CO', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
