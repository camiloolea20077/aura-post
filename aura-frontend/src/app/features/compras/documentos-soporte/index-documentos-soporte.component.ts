import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../shared/pipes/alert.service';
import { aFechaLocal } from '../../../shared/utils/fecha.util';
import { DocumentoSoporteService } from '../../../core/services/documento-soporte.service';
import { DocumentoSoporteModel } from '../../../core/models/documento-soporte.model';
import { DocumentoSoporteDialogComponent } from '../../../shared/components/documento-soporte-dialog/documento-soporte-dialog.component';

/**
 * Historial de documentos soporte: los aceptados con su PDF y los intentos
 * rechazados con el motivo de la DIAN. Se emiten desde Compras o Gastos.
 */
@Component({
  selector: 'app-index-documentos-soporte',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CalendarModule,
    TableModule,
    TagModule,
    TooltipModule,
    DocumentoSoporteDialogComponent,
  ],
  templateUrl: './index-documentos-soporte.component.html',
  styleUrls: ['./index-documentos-soporte.component.scss'],
})
export class IndexDocumentosSoporteComponent implements OnInit {
  desde: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  hasta: Date = new Date();
  documentos: DocumentoSoporteModel[] = [];
  loading = false;
  descargandoId: number | null = null;

  // Reabrir el origen para reintentar un rechazado
  showDialog = false;
  dialogOrigen: 'COMPRA' | 'GASTO' = 'COMPRA';
  dialogOrigenId: number | null = null;

  constructor(
    private readonly service: DocumentoSoporteService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    void this.buscar();
  }

  async buscar(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.listar(aFechaLocal(this.desde), aFechaLocal(this.hasta)),
      );
      this.documentos = res?.data ?? [];
    } catch {
      this.documentos = [];
      this.alertService.showError('Error', 'No se pudieron cargar los documentos soporte.');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async pdf(d: DocumentoSoporteModel): Promise<void> {
    this.descargandoId = d.id;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.pdf(d.id));
      if (res?.data?.pdfBase64) this.service.abrirPdf(res.data.pdfBase64);
    } catch (err: any) {
      this.alertService.showError('Error', err?.error?.message ?? 'No se pudo obtener el PDF.');
    } finally {
      this.descargandoId = null;
      this.cdr.markForCheck();
    }
  }

  async descartar(d: DocumentoSoporteModel): Promise<void> {
    try {
      await lastValueFrom(this.service.descartar(d.id));
      this.alertService.showSuccess('Descartado', 'El intento quedó descartado.');
      await this.buscar();
    } catch (err: any) {
      this.alertService.showError('Error', err?.error?.message ?? 'No se pudo descartar.');
    }
  }

  reintentar(d: DocumentoSoporteModel): void {
    this.dialogOrigen = d.origenTipo;
    this.dialogOrigenId = d.origenId;
    this.showDialog = true;
    this.cdr.markForCheck();
  }

  severidad(estado: string): 'success' | 'danger' | 'secondary' {
    return estado === 'ACEPTADO' ? 'success' : estado === 'RECHAZADO' ? 'danger' : 'secondary';
  }

  etiqueta(estado: string): string {
    return estado === 'ACEPTADO' ? 'Aceptado' : estado === 'RECHAZADO' ? 'Rechazado' : 'Descartado';
  }

  formatCOP = (v: number | null | undefined): string =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
}
