import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../../shared/pipes/alert.service';
import { DeclaracionesService } from '../../../../core/services/declaraciones.service';
import { CertificadoRetencionPdfService } from '../../../../core/services/certificado-retencion-pdf.service';
import {
  CertificadoRetencion,
  CertificadosRetencionModel,
  TipoCertificadoRetencion,
} from '../../../../core/models/declaraciones.model';
import { TerceroAutocompleteComponent } from '../../../../shared/components/tercero-autocomplete/tercero-autocomplete.component';

/**
 * Certificados de retención que la empresa expide a quienes les retuvo: en la
 * fuente, de IVA y de ICA. El valor sale del mayor por tercero; la base y la
 * tarifa, de la compra o el gasto que originó la retención.
 */
@Component({
  selector: 'app-certificados-retencion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonModule, DropdownModule, CalendarModule, TooltipModule, TerceroAutocompleteComponent],
  templateUrl: './certificados-retencion.component.html',
  styleUrls: ['./certificados-retencion.component.scss'],
})
export class CertificadosRetencionComponent {
  readonly tipos: { label: string; value: TipoCertificadoRetencion }[] = [
    { label: 'Retención en la fuente', value: 'FUENTE' },
    { label: 'Retención de IVA (ReteIVA)', value: 'IVA' },
    { label: 'Retención de ICA (ReteICA)', value: 'ICA' },
  ];

  tipo: TipoCertificadoRetencion = 'FUENTE';
  desde: Date;
  hasta: Date;
  terceroId: number | null = null;
  datos: CertificadosRetencionModel | null = null;
  cargando = false;
  generandoPdf = false;

  constructor(
    private readonly service: DeclaracionesService,
    private readonly pdf: CertificadoRetencionPdfService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    // La retención en la fuente se certifica por año: por defecto el año anterior.
    const anio = new Date().getFullYear() - 1;
    this.desde = new Date(anio, 0, 1);
    this.hasta = new Date(anio, 11, 31);
  }

  async generar(): Promise<void> {
    if (!this.desde || !this.hasta) return;
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.certificados(this.tipo, this.iso(this.desde), this.iso(this.hasta), this.terceroId),
      );
      this.datos = res?.data ?? null;
    } catch (err: any) {
      this.alertService.showError('Error', err?.error?.message ?? 'No se pudieron generar los certificados.');
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  ver = (c: CertificadoRetencion): Promise<void> => this.conPdf(() => this.pdf.ver(this.datos!, [c]));

  descargar = (c: CertificadoRetencion): Promise<void> => this.conPdf(() => this.pdf.descargar(this.datos!, [c]));

  descargarTodos = (): Promise<void> => this.conPdf(() => this.pdf.descargar(this.datos!));

  private async conPdf(accion: () => Promise<void>): Promise<void> {
    if (!this.datos) return;
    this.generandoPdf = true;
    this.cdr.markForCheck();
    try {
      await accion();
    } catch {
      this.alertService.showError('Error', 'No se pudo armar el PDF del certificado.');
    } finally {
      this.generandoPdf = false;
      this.cdr.markForCheck();
    }
  }

  documento(c: CertificadoRetencion): string {
    if (!c.numeroDocumento) return '';
    return `${c.tipoDocumento ?? ''} ${c.numeroDocumento}${c.dv ? '-' + c.dv : ''}`.trim();
  }

  formatCOP(v: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v ?? 0);
  }

  /** Fecha local YYYY-MM-DD. */
  private iso(d: Date): string {
    return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
  }
}
