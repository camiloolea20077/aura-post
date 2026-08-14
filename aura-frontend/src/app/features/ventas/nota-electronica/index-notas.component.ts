import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { NotaElectronicaService } from '../../../core/services/nota-electronica.service';
import { NotaElectronicaEstado } from '../../../core/models/nota-electronica.model';
import { AlertService } from '../../../shared/pipes/alert.service';

type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | undefined;

@Component({
  selector: 'app-index-notas',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    ConfirmDialogModule,
    DialogModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './index-notas.component.html',
  styleUrls: ['./index-notas.component.scss'],
})
export class IndexNotasComponent implements OnInit {
  public items: NotaElectronicaEstado[] = [];
  public loading = true;
  /** id de la nota con una acción en curso (para el spinner por fila). */
  public busyId: number | null = null;
  /** nota mostrada en el diálogo de detalle. */
  public detalle: NotaElectronicaEstado | null = null;
  public showDetalle = false;

  constructor(
    private readonly service: NotaElectronicaService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading = true;
    try {
      const res = await lastValueFrom(this.service.listarLocal());
      this.items = res?.data ?? [];
    } catch {
      this.alert.showError('Error', 'No se pudieron cargar las notas');
      this.items = [];
    } finally {
      this.loading = false;
    }
  }

  nuevaCredito(): void {
    this.router.navigate(['/ventas/notas/credito']);
  }

  nuevaDebito(): void {
    this.router.navigate(['/ventas/notas/debito']);
  }

  ver(n: NotaElectronicaEstado): void {
    this.detalle = n;
    this.showDetalle = true;
  }

  /** Descarga el PDF (Base64) de Factus y lo abre en una pestaña nueva. */
  async verPdf(n: NotaElectronicaEstado): Promise<void> {
    if (this.busyId) return;
    this.busyId = n.id;
    try {
      const res = await lastValueFrom(this.service.descargarPdf(n.id));
      const base64 = res?.data;
      if (!base64) {
        this.alert.showError('PDF', 'La nota no tiene PDF disponible');
        return;
      }
      this.abrirPdfBase64(base64);
    } catch {
      this.alert.showError('PDF', 'No se pudo obtener el PDF de la nota');
    } finally {
      this.busyId = null;
    }
  }

  reenviarCorreo(n: NotaElectronicaEstado): void {
    if (this.busyId) return;
    this.confirm.confirm({
      header: 'Reenviar por correo',
      message: `Se reenviará la nota ${n.numero ?? ''} al correo del cliente. ¿Continuar?`,
      icon: 'pi pi-envelope',
      acceptLabel: 'Enviar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        this.busyId = n.id;
        try {
          await lastValueFrom(this.service.reenviarCorreo(n.id));
          this.alert.showSuccess('Correo', 'Nota reenviada al cliente');
        } catch {
          this.alert.showError('Correo', 'No se pudo enviar el correo');
        } finally {
          this.busyId = null;
        }
      },
    });
  }

  eliminar(n: NotaElectronicaEstado): void {
    if (this.busyId) return;
    this.confirm.confirm({
      header: 'Eliminar nota',
      message:
        'Solo se pueden eliminar notas NO validadas por la DIAN. ¿Eliminar la nota ' +
        (n.numero ?? n.referenceCode) +
        '?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        this.busyId = n.id;
        try {
          await lastValueFrom(this.service.eliminar(n.id));
          this.items = this.items.filter((x) => x.id !== n.id);
          this.alert.showSuccess('Nota', 'Nota eliminada');
        } catch (e: unknown) {
          const msg =
            (e as { error?: { message?: string } })?.error?.message ??
            'No se pudo eliminar (¿ya validada por la DIAN?)';
          this.alert.showError('Nota', msg);
        } finally {
          this.busyId = null;
        }
      },
    });
  }

  private abrirPdfBase64(base64: string): void {
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([arr], { type: 'application/pdf' }));
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  estadoSeverity(e: string): TagSeverity {
    const m: Record<string, TagSeverity> = {
      PENDIENTE: 'warn',
      ENVIADO: 'info',
      ACEPTADO: 'success',
      RECHAZADO: 'danger',
      ANULADO: 'secondary',
    };
    return m[e] ?? 'secondary';
  }

  tipoLabel(t: string): string {
    return t === 'CREDITO' ? 'Crédito' : 'Débito';
  }
}
