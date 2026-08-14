import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TooltipModule } from 'primeng/tooltip';
import { ReporteService } from '../../../core/services/reporte.service';
import { AlertService } from '../../../shared/pipes/alert.service';

type TipoNota = 'CREDITO' | 'DEBITO' | 'AMBAS';

@Component({
  selector: 'app-reporte-facturacion-electronica',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CalendarModule,
    SelectButtonModule,
    TooltipModule,
  ],
  templateUrl: './reporte-facturacion-electronica.component.html',
  styleUrls: ['./reporte-facturacion-electronica.component.scss'],
})
export class ReporteFacturacionElectronicaComponent implements OnInit {
  desde: Date | null = null;
  hasta: Date | null = null;

  tipoNota: TipoNota = 'AMBAS';
  readonly tipoNotaOptions = [
    { label: 'Ambas', value: 'AMBAS' },
    { label: 'Crédito', value: 'CREDITO' },
    { label: 'Débito', value: 'DEBITO' },
  ];

  loadingFacturas = false;
  loadingNotas = false;

  constructor(
    private reporteService: ReporteService,
    private alert: AlertService,
  ) {}

  ngOnInit(): void {
    // Rango por defecto: mes actual
    const hoy = new Date();
    this.hasta = hoy;
    this.desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  }

  exportarFacturas(): void {
    const rango = this.rangoValido();
    if (!rango) return;

    this.loadingFacturas = true;
    this.reporteService
      .facturasElectronicasExcel(rango.desde, rango.hasta)
      .subscribe({
        next: (blob) => {
          this.reporteService.descargar(
            blob,
            `facturas_${rango.desde}_${rango.hasta}.xlsx`,
          );
          this.alert.showSuccess(
            'Exportación lista',
            'Se descargó el Excel de facturas electrónicas.',
          );
        },
        error: (e) => {
          this.loadingFacturas = false;
          this.fallo(e, 'facturas');
        },
        complete: () => (this.loadingFacturas = false),
      });
  }

  exportarNotas(): void {
    const rango = this.rangoValido();
    if (!rango) return;

    const tipo = this.tipoNota === 'AMBAS' ? undefined : this.tipoNota;
    const sufijo = tipo ? tipo.toLowerCase() : 'credito_debito';

    this.loadingNotas = true;
    this.reporteService
      .notasElectronicasExcel(rango.desde, rango.hasta, tipo)
      .subscribe({
        next: (blob) => {
          this.reporteService.descargar(
            blob,
            `notas_${sufijo}_${rango.desde}_${rango.hasta}.xlsx`,
          );
          this.alert.showSuccess(
            'Exportación lista',
            'Se descargó el Excel de notas.',
          );
        },
        error: (e) => {
          this.loadingNotas = false;
          this.fallo(e, 'notas');
        },
        complete: () => (this.loadingNotas = false),
      });
  }

  /** Valida el rango y lo devuelve en formato ISO (yyyy-MM-dd). */
  private rangoValido(): { desde: string; hasta: string } | null {
    if (!this.desde || !this.hasta) {
      this.alert.showWarn(
        'Rango incompleto',
        'Seleccione la fecha inicial y la final.',
      );
      return null;
    }
    if (this.hasta < this.desde) {
      this.alert.showWarn(
        'Rango inválido',
        'La fecha final no puede ser anterior a la inicial.',
      );
      return null;
    }
    return { desde: this.iso(this.desde), hasta: this.iso(this.hasta) };
  }

  /**
   * Fecha local en yyyy-MM-dd. No se usa toISOString() porque convierte a UTC
   * y puede correr el día según la zona horaria.
   */
  private iso(d: Date): string {
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mes}-${dia}`;
  }

  /**
   * El backend responde `blob` incluso en error, así que el mensaje del server
   * viene como Blob y hay que leerlo para poder mostrarlo.
   */
  private async fallo(e: unknown, que: string): Promise<void> {
    const err = e as { error?: unknown };
    let detalle = `No se pudo generar el Excel de ${que}.`;
    if (err?.error instanceof Blob) {
      try {
        const txt = await err.error.text();
        const json = JSON.parse(txt);
        if (json?.message) detalle = json.message;
      } catch {
        /* se queda el mensaje genérico */
      }
    }
    this.alert.showError('Error al exportar', detalle);
  }
}
