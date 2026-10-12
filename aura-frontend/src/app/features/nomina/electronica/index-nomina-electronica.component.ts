import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TabViewModule } from 'primeng/tabview';
import { ConfirmationService } from 'primeng/api';
import { ActivatedRoute } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { NominaElectronicaService } from '../../../core/services/nomina-electronica.service';
import { NominaElectronicaEstado } from '../../../core/models/nomina-electronica.model';
import { AlertService } from '../../../shared/pipes/alert.service';

import { PuedeDirective } from '../../../shared/directives/puede.directive';
import { MesNominaElectronicaComponent } from './mes/mes-nomina-electronica.component';
type TagSeverity =
  | 'success'
  | 'secondary'
  | 'info'
  | 'warn'
  | 'danger'
  | 'contrast'
  | undefined;

/**
 * Listado de nóminas electrónicas emitidas (lo persistido localmente). Desde aquí
 * se descarga el XML, se anula (nota de eliminación DIAN) y —solo en pruebas— se
 * elimina el documento en Factus.
 */
@Component({
  selector: 'app-index-nomina-electronica',
  standalone: true,
  imports: [
    PuedeDirective,
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    TooltipModule,
    SkeletonModule,
    ConfirmDialogModule,
    TabViewModule,
    MesNominaElectronicaComponent,
  ],
  providers: [ConfirmationService],
  templateUrl: './index-nomina-electronica.component.html',
  styleUrls: ['./index-nomina-electronica.component.scss'],
})
export class IndexNominaElectronicaComponent implements OnInit {
  public items: NominaElectronicaEstado[] = [];
  public loading = true;
  public procesando: number | null = null;
  public searchQuery = '';
  /** 0 = Por mes (envío), 1 = Documentos emitidos. */
  public pestana = 0;

  @ViewChild('mesTab') mesTab?: MesNominaElectronicaComponent;

  /** Mes pedido por la URL (?anio=&mes=), p. ej. al venir desde una nómina. */
  public readonly mesInicial: Date | null = (() => {
    const q = this.route.snapshot.queryParamMap;
    const anio = Number(q.get('anio'));
    const mes = Number(q.get('mes'));
    return anio && mes ? new Date(anio, mes - 1, 1) : null;
  })();

  /** Actualiza la pestaña visible. */
  actualizar(): void {
    if (this.pestana === 0) void this.mesTab?.cargar();
    else void this.cargar();
  }

  /** Filtro cliente por empleado / CUNE / documento. */
  get filtrados(): NominaElectronicaEstado[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.items;
    return this.items.filter(
      (n) =>
        (n.empleadoNombre ?? '').toLowerCase().includes(q) ||
        (n.cune ?? '').toLowerCase().includes(q) ||
        this.documento(n).toLowerCase().includes(q),
    );
  }

  private readonly meses = [
    '', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
  ];

  constructor(
    private readonly service: NominaElectronicaService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
    private readonly route: ActivatedRoute,
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
      this.alert.showError('Error', 'No se pudieron cargar las nóminas electrónicas');
      this.items = [];
    } finally {
      this.loading = false;
    }
  }

  onSearch(): void {
    /* el getter `filtrados` reacciona al ngModel; no hace falta lógica extra */
  }

  clearSearch(): void {
    this.searchQuery = '';
  }

  periodo(n: NominaElectronicaEstado): string {
    if (!n.mes || !n.agno) return '—';
    return `${this.meses[n.mes] ?? n.mes} ${n.agno}`;
  }

  documento(n: NominaElectronicaEstado): string {
    return (n.prefijo ?? '') + (n.consecutivo ?? '');
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

  async descargarXml(n: NominaElectronicaEstado): Promise<void> {
    this.procesando = n.id;
    try {
      const blob = await lastValueFrom(this.service.descargarXml(n.nominaId));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nomina-${this.documento(n) || n.nominaId}.xml`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      this.alert.showError('Error', 'No se pudo descargar el XML');
    } finally {
      this.procesando = null;
    }
  }

  async descargarPdf(n: NominaElectronicaEstado): Promise<void> {
    this.procesando = n.id;
    try {
      const blob = await lastValueFrom(this.service.descargarPdf(n.nominaId));
      this.guardar(blob, `nomina-${this.documento(n) || n.nominaId}.pdf`);
    } catch (err: any) {
      this.alert.showError('Error', (await this.mensajeDeBlob(err)) ?? 'No se pudo descargar el PDF');
    } finally {
      this.procesando = null;
    }
  }

  /** XML o PDF de una nota de ajuste, por su número. */
  async descargarAjuste(n: NominaElectronicaEstado, tipo: 'xml' | 'pdf'): Promise<void> {
    if (!n.numero) return;
    this.procesando = n.id;
    try {
      const blob = await lastValueFrom(
        tipo === 'xml' ? this.service.descargarXmlAjuste(n.numero) : this.service.descargarPdfAjuste(n.numero),
      );
      this.guardar(blob, `nota-ajuste-${n.numero}.${tipo}`);
    } catch (err: any) {
      this.alert.showError('Error', (await this.mensajeDeBlob(err)) ?? 'No se pudo descargar el archivo');
    } finally {
      this.procesando = null;
    }
  }

  /** Elimina en Factus una nota de ajuste que la DIAN no validó; la nómina vuelve a aceptada. */
  eliminarAjuste(n: NominaElectronicaEstado): void {
    if (!n.referenceCode) return;
    this.confirm.confirm({
      message: `¿Eliminar en Factus la nota de ajuste ${n.numero ?? n.referenceCode}? Solo se puede si la DIAN no la validó; la nómina vuelve a quedar aceptada.`,
      header: 'Eliminar nota de ajuste',
      icon: 'pi pi-trash',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        this.procesando = n.id;
        try {
          await lastValueFrom(this.service.eliminarAjuste(n.referenceCode!));
          this.alert.showSuccess('Eliminada', 'Nota de ajuste eliminada en Factus');
          await this.cargar();
        } catch (err: any) {
          this.alert.showError('Error', err?.error?.message ?? 'No se pudo eliminar la nota');
        } finally {
          this.procesando = null;
        }
      },
    });
  }

  private guardar(blob: Blob, nombre: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Las descargas piden blob: el error del backend llega como Blob con el JSON adentro. */
  private async mensajeDeBlob(err: any): Promise<string | null> {
    try {
      if (err?.error instanceof Blob) return JSON.parse(await err.error.text())?.message ?? null;
      return err?.error?.message ?? null;
    } catch {
      return null;
    }
  }

  anular(n: NominaElectronicaEstado): void {
    if (!n.referenceCode) return;
    this.confirm.confirm({
      message: `¿Generar la nota de ajuste (eliminación DIAN) de la nómina electrónica de ${n.empleadoNombre ?? ''}? Quedará anulada.`,
      header: 'Nota de ajuste',
      icon: 'pi pi-ban',
      acceptLabel: 'Sí, anular',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        this.procesando = n.id;
        try {
          await lastValueFrom(this.service.notaEliminacion(n.referenceCode!));
          this.alert.showSuccess('Anulada', 'Nota de eliminación enviada');
          await this.cargar();
        } catch (err: any) {
          this.alert.showError('Error', err?.error?.message ?? 'No se pudo anular');
        } finally {
          this.procesando = null;
        }
      },
    });
  }

  eliminarSandbox(n: NominaElectronicaEstado): void {
    if (!n.referenceCode) return;
    this.confirm.confirm({
      message: `SOLO PRUEBAS: borrar el documento en Factus (sandbox) de ${n.empleadoNombre ?? ''}. En producción usa "Anular".`,
      header: 'Eliminar (sandbox)',
      icon: 'pi pi-trash',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        this.procesando = n.id;
        try {
          await lastValueFrom(this.service.eliminarSandbox(n.referenceCode!));
          this.alert.showSuccess('Eliminada', 'Documento eliminado en Factus');
          await this.cargar();
        } catch (err: any) {
          this.alert.showError('Error', err?.error?.message ?? 'No se pudo eliminar');
        } finally {
          this.procesando = null;
        }
      },
    });
  }
}
