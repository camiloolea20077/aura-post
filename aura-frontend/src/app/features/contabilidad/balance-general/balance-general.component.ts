import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || pdfFonts;

import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  BalanceGeneralDetalladoModel,
  GrupoBalanceModel,
} from '../../../core/models/contabilidad.model';

import { aFechaLocal } from '../../../shared/utils/fecha.util';
const AZUL = '#1d4ed8';
const ROJO = '#b91c1c';
const MORADO = '#7e22ce';
const OSCURO = '#0f172a';
const GRIS = '#64748b';

@Component({
  selector: 'app-balance-general',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CalendarModule,
    ToastModule,
    SkeletonModule,
    TagModule,
  ],
  providers: [MessageService],
  templateUrl: './balance-general.component.html',
  styleUrls: ['./balance-general.component.scss'],
})
export class BalanceGeneralComponent implements OnInit {
  balance: BalanceGeneralDetalladoModel | null = null;
  loading = false;
  fechaCorte: Date = new Date();

  constructor(
    private readonly service: ContabilidadService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.generar();
  }

  async generar(): Promise<void> {
    if (!this.fechaCorte) return;
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.balanceGeneralDetallado(this.toISO(this.fechaCorte)),
      );
      this.balance = res?.data ?? null;
    } catch {
      this.alertService.showError('Error', 'No se pudo generar el balance general');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  /** ¿Hay al menos una cuenta en toda la sección? */
  hayGrupos(...secciones: (GrupoBalanceModel[] | undefined)[]): boolean {
    return secciones.some((s) => (s?.length ?? 0) > 0);
  }

  get sinDatos(): boolean {
    return (
      !!this.balance &&
      !this.hayGrupos(
        this.balance.activoCorriente,
        this.balance.activoNoCorriente,
        this.balance.pasivoCorriente,
        this.balance.pasivoNoCorriente,
        this.balance.patrimonio,
      )
    );
  }

  formatCOP(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }

  toISO(d: Date): string {
    return aFechaLocal(d);
  }

  // ── PDF profesional (pdfmake) ────────────────────────────────────────
  descargarPdf(): void {
    const b = this.balance;
    if (!b) return;

    const fechaLarga = new Date(b.fechaCorte + 'T00:00:00').toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    // Columna ACTIVO
    const activoBody: any[] = [];
    this.pushSeccion(activoBody, 'Activo Corriente', b.activoCorriente, b.totalActivoCorriente);
    this.pushSeccion(activoBody, 'Activo No Corriente', b.activoNoCorriente, b.totalActivoNoCorriente);
    activoBody.push(this.totalMayorRow('TOTAL ACTIVO', b.totalActivo, AZUL));

    // Columna PASIVO + PATRIMONIO
    const pasivoBody: any[] = [];
    this.pushSeccion(pasivoBody, 'Pasivo Corriente', b.pasivoCorriente, b.totalPasivoCorriente);
    this.pushSeccion(pasivoBody, 'Pasivo No Corriente', b.pasivoNoCorriente, b.totalPasivoNoCorriente);
    pasivoBody.push(this.totalMayorRow('TOTAL PASIVO', b.totalPasivo, ROJO));
    this.pushSeccion(pasivoBody, 'Patrimonio', b.patrimonio, null);
    pasivoBody.push(this.totalMayorRow('TOTAL PATRIMONIO', b.totalPatrimonio, MORADO));
    pasivoBody.push(this.totalMayorRow('TOTAL PASIVO + PATRIMONIO', b.totalPasivoPatrimonio, OSCURO));

    const tablaLayout = {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0,
      hLineColor: () => '#e2e8f0',
      paddingTop: () => 2,
      paddingBottom: () => 2,
    };

    const doc: any = {
      pageSize: 'A4',
      pageMargins: [40, 45, 40, 45],
      content: [
        { text: (b.empresaNombre || 'Empresa').toUpperCase(), fontSize: 14, bold: true, color: OSCURO, alignment: 'center' },
        b.nit
          ? { text: `NIT: ${b.nit}`, fontSize: 9, color: GRIS, alignment: 'center', margin: [0, 1, 0, 0] }
          : {},
        { text: 'Estado de Situación Financiera', fontSize: 11, bold: true, color: OSCURO, alignment: 'center', margin: [0, 6, 0, 0] },
        { text: `A la fecha de corte ${fechaLarga}`, fontSize: 9, color: '#334155', alignment: 'center' },
        { text: '(Cifras expresadas en pesos colombianos)', fontSize: 8, italics: true, color: GRIS, alignment: 'center', margin: [0, 1, 0, 0] },
        {
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: OSCURO }],
          margin: [0, 8, 0, 14],
        },
        {
          columns: [
            { width: '*', table: { headerRows: 0, widths: ['*', 'auto'], body: activoBody }, layout: tablaLayout },
            { width: 18, text: '' },
            { width: '*', table: { headerRows: 0, widths: ['*', 'auto'], body: pasivoBody }, layout: tablaLayout },
          ],
        },
        b.cuadra
          ? { text: 'Balance cuadrado: el Activo es igual al Pasivo más el Patrimonio.', fontSize: 8.5, bold: true, color: '#15803d', margin: [0, 16, 0, 0] }
          : { text: `Descuadre de ${this.formatCOP(b.diferencia)} entre Activo y Pasivo + Patrimonio.`, fontSize: 8.5, bold: true, color: '#dc2626', margin: [0, 16, 0, 0] },
      ],
      defaultStyle: { fontSize: 8 },
      footer: (page: number, count: number) => ({
        columns: [
          { text: `Generado el ${new Date().toLocaleDateString('es-CO')}`, fontSize: 7, color: GRIS, margin: [40, 0, 0, 0] },
          { text: `Página ${page} de ${count}`, alignment: 'right', fontSize: 7, color: GRIS, margin: [0, 0, 40, 0] },
        ],
        margin: [0, 10, 0, 0],
      }),
    };

    const nombreArchivo = `Balance-General-${b.fechaCorte}.pdf`;
    pdfMake.createPdf(doc).download(nombreArchivo);
  }

  /** Agrega un encabezado de sección + grupos/cuentas + subtotal (si aplica). */
  private pushSeccion(body: any[], titulo: string, grupos: GrupoBalanceModel[], total: number | null): void {
    if (!grupos || grupos.length === 0) return;

    body.push([
      { text: titulo, colSpan: 2, bold: true, fontSize: 8, color: '#475569', fillColor: '#f1f5f9', margin: [3, 3, 3, 3] },
      {},
    ]);

    for (const g of grupos) {
      body.push([
        { text: `${g.codigo}  ${g.nombre}`, bold: true, fontSize: 8, color: OSCURO },
        { text: this.formatCOP(g.saldo), bold: true, fontSize: 8, alignment: 'right', color: OSCURO },
      ]);
      for (const c of g.cuentas) {
        body.push([
          { text: `${c.codigo}  ${c.nombre}`, fontSize: 7.5, color: GRIS, margin: [12, 0, 0, 0] },
          { text: this.formatCOP(c.saldo), fontSize: 7.5, alignment: 'right', color: '#334155' },
        ]);
      }
    }

    if (total !== null) {
      body.push([
        { text: `Total ${titulo}`, bold: true, fontSize: 8, color: OSCURO },
        { text: this.formatCOP(total), bold: true, fontSize: 8, alignment: 'right', color: OSCURO },
      ]);
    }
  }

  private totalMayorRow(label: string, valor: number, color: string): any[] {
    return [
      { text: label, bold: true, fontSize: 8.5, color: '#fff', fillColor: color, margin: [4, 4, 4, 4] },
      { text: this.formatCOP(valor), bold: true, fontSize: 8.5, color: '#fff', fillColor: color, alignment: 'right', margin: [4, 4, 4, 4] },
    ];
  }
}
