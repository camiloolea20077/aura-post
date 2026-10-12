import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import {
  ConciliacionAjuste,
  ConciliacionCuenta,
  ConciliacionRenglon,
  ConciliacionResumen,
  ConciliacionSugerencia,
  DiferenciaFiscal,
  NOMBRE_FORMATO,
  RenglonCatalogo,
  SeccionFiscal,
  TipoAjusteFiscal,
  Formulario110,
  Manuales110,
} from '../../../../core/models/conciliacion-fiscal.model';
import { ConciliacionFiscalService } from '../../../../core/services/conciliacion-fiscal.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { PuedeDirective } from '../../../../shared/directives/puede.directive';
import { ExcelReporteService } from '../../../../shared/services/excel-reporte.service';
import { ImportarExcelComponent } from '../../../../shared/components/importar-excel/importar-excel.component';
import {
  PLANTILLA_BALANCE_FISCAL,
  PlantillaImportar,
} from '../../../../shared/components/importar-excel/plantillas-catalogo';

interface Grupo {
  label: string;
  items: { label: string; value: string }[];
}

/**
 * Una conciliación fiscal: cargar el balance, revisar el análisis, aplicar
 * ajustes y ver el ESF, el ERI y el impuesto diferido. Exporta a Excel.
 */
@Component({
  selector: 'app-detalle-conciliacion-fiscal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DropdownModule,
    InputNumberModule,
    InputTextModule,
    TabViewModule,
    TagModule,
    TooltipModule,
    PuedeDirective,
    ImportarExcelComponent,
  ],
  templateUrl: './detalle-conciliacion-fiscal.component.html',
  styleUrls: ['./detalle-conciliacion-fiscal.component.scss'],
})
export class DetalleConciliacionFiscalComponent implements OnInit {
  private readonly service = inject(ConciliacionFiscalService);
  private readonly alert = inject(AlertService);
  private readonly excel = inject(ExcelReporteService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly nombreFormato = NOMBRE_FORMATO;

  id = 0;

  // Formulario 110
  manuales110: Manuales110 = {
    ingresosNoConstitutivos: 0,
    compensaciones: 0,
    descuentosTributarios: 0,
    anticipoSiguiente: 0,
    saldoFavorAnterior: 0,
  };
  f110: Formulario110 | null = null;
  cargando110 = false;

  async calcular110(): Promise<void> {
    this.cargando110 = true;
    this.cdr.markForCheck();
    try {
      this.f110 = (await lastValueFrom(this.service.formulario110(this.id, this.manuales110))).data;
    } catch (e: any) {
      this.alert.showError('Error', e?.error?.message ?? 'No se pudo calcular el formulario 110');
    } finally {
      this.cargando110 = false;
      this.cdr.markForCheck();
    }
  }
  r: ConciliacionResumen | null = null;
  cuentas: ConciliacionCuenta[] = [];
  cargando = true;
  ocupado = false;
  tab = 0;

  // Balance
  mostrarImportar = false;
  plantilla: PlantillaImportar = PLANTILLA_BALANCE_FISCAL;
  filtroCuentas: 'TODAS' | 'SIN' = 'TODAS';
  readonly filtroOpts = [
    { label: 'Todas las cuentas', value: 'TODAS' },
    { label: 'Sin clasificar', value: 'SIN' },
  ];

  // Catálogo de renglones (para clasificar y para ajustes)
  renglonesGrupos: Grupo[] = [];
  renglonesClasificar: Grupo[] = [];

  // Ajuste nuevo
  nuevo: ConciliacionAjuste = this.ajusteVacio();
  readonly tipoOpts: { label: string; value: TipoAjusteFiscal }[] = [
    { label: 'Menor valor fiscal', value: 'MENOR' },
    { label: 'Mayor valor fiscal', value: 'MAYOR' },
  ];
  readonly diferenciaOpts: { label: string; value: DiferenciaFiscal }[] = [
    { label: 'Permanente', value: 'PERMANENTE' },
    { label: 'Temporaria (impuesto diferido)', value: 'TEMPORARIA' },
  ];

  // Tarifa
  tarifa = 35;

  async ngOnInit(): Promise<void> {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.plantilla = { ...PLANTILLA_BALANCE_FISCAL, base: `conciliacion-fiscal/${this.id}` };
    const cat = await lastValueFrom(this.service.renglones()).catch(() => null);
    this.armarGrupos(cat?.data ?? []);
    await this.recargar();
  }

  private armarGrupos(cat: RenglonCatalogo[]): void {
    const grupos = new Map<string, Grupo>();
    for (const r of cat) {
      const g = grupos.get(r.seccion) ?? { label: r.seccionTitulo, items: [] };
      g.items.push({ label: `${r.codigo} · ${r.nombre}`, value: r.codigo });
      grupos.set(r.seccion, g);
    }
    this.renglonesGrupos = [...grupos.values()];
    this.renglonesClasificar = [
      ...this.renglonesGrupos,
      { label: 'Fuera del formato', items: [{ label: 'No va en el formato', value: 'NA' }] },
    ];
  }

  async recargar(): Promise<void> {
    try {
      const [res, cts] = await Promise.all([
        lastValueFrom(this.service.obtener(this.id)),
        lastValueFrom(this.service.cuentas(this.id)),
      ]);
      this.r = res?.data ?? null;
      this.cuentas = cts?.data ?? [];
      this.tarifa = Number(this.r?.cabecera.tarifaRenta ?? 35);
    } catch {
      this.alert.showError('Error', 'No se encontró la conciliación.');
      this.router.navigate(['/contabilidad/conciliacion-fiscal']);
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  get cerrada(): boolean {
    return this.r?.cabecera.estado === 'CERRADA';
  }

  get errores(): number {
    return this.r?.validaciones.filter((v) => v.nivel === 'ERROR').length ?? 0;
  }

  renglonesDe(...secciones: SeccionFiscal[]): ConciliacionRenglon[] {
    return (this.r?.renglones ?? []).filter((x) => secciones.includes(x.seccion));
  }

  get cuentasVisibles(): ConciliacionCuenta[] {
    return this.filtroCuentas === 'SIN' ? this.cuentas.filter((c) => !c.renglon && Number(c.saldo) !== 0) : this.cuentas;
  }

  // ── Balance ────────────────────────────────────────────────────────────
  async traerDelSistema(): Promise<void> {
    this.ocupado = true;
    try {
      await lastValueFrom(this.service.balanceSistema(this.id));
      this.alert.showSuccess('Balance cargado', 'Se trajo el balance del año desde la contabilidad.');
      await this.recargar();
    } catch (err: any) {
      this.alert.showError('No se pudo traer el balance', err?.error?.message ?? 'Intente de nuevo.');
    } finally {
      this.ocupado = false;
      this.cdr.markForCheck();
    }
  }

  async reclasificar(c: ConciliacionCuenta, renglon: string | null): Promise<void> {
    try {
      await lastValueFrom(this.service.reclasificar(this.id, c.id, renglon));
      await this.recargar();
    } catch (err: any) {
      this.alert.showError('No se pudo clasificar', err?.error?.message ?? 'Intente de nuevo.');
    }
  }

  // ── Ajustes ────────────────────────────────────────────────────────────
  private ajusteVacio(): ConciliacionAjuste {
    return { renglon: '', tipo: 'MENOR', diferencia: 'PERMANENTE', valor: 0, concepto: '' };
  }

  async agregarAjuste(a: ConciliacionAjuste = this.nuevo): Promise<boolean> {
    this.ocupado = true;
    try {
      await lastValueFrom(this.service.agregarAjuste(this.id, a));
      if (a === this.nuevo) this.nuevo = this.ajusteVacio();
      await this.recargar();
      return true;
    } catch (err: any) {
      this.alert.showError('No se pudo registrar el ajuste', err?.error?.message ?? 'Intente de nuevo.');
      return false;
    } finally {
      this.ocupado = false;
      this.cdr.markForCheck();
    }
  }

  async aplicarSugerencia(s: ConciliacionSugerencia): Promise<void> {
    await this.agregarAjuste({
      renglon: s.renglon,
      tipo: s.tipo,
      diferencia: s.diferencia,
      valor: s.valor,
      concepto: s.concepto,
      cuentaCodigo: s.cuentaCodigo,
      sugerencia: s.clave,
    });
  }

  async aplicarTodas(): Promise<void> {
    const seguras = (this.r?.sugerencias ?? []).filter((s) => !s.revisar);
    for (const s of seguras) {
      const ok = await this.agregarAjuste({
        renglon: s.renglon,
        tipo: s.tipo,
        diferencia: s.diferencia,
        valor: s.valor,
        concepto: s.concepto,
        cuentaCodigo: s.cuentaCodigo,
        sugerencia: s.clave,
      });
      if (!ok) break;
    }
  }

  get sugerenciasSeguras(): number {
    return (this.r?.sugerencias ?? []).filter((s) => !s.revisar).length;
  }

  async eliminarAjuste(a: ConciliacionAjuste): Promise<void> {
    if (!a.id) return;
    try {
      await lastValueFrom(this.service.eliminarAjuste(this.id, a.id));
      await this.recargar();
    } catch (err: any) {
      this.alert.showError('No se pudo eliminar', err?.error?.message ?? 'Intente de nuevo.');
    }
  }

  // ── Cabecera ───────────────────────────────────────────────────────────
  async guardarTarifa(): Promise<void> {
    try {
      await lastValueFrom(this.service.tarifa(this.id, this.tarifa));
      await this.recargar();
    } catch (err: any) {
      this.alert.showError('No se pudo cambiar la tarifa', err?.error?.message ?? 'Intente de nuevo.');
    }
  }

  async cerrarOReabrir(): Promise<void> {
    try {
      await lastValueFrom(this.cerrada ? this.service.reabrir(this.id) : this.service.cerrar(this.id));
      await this.recargar();
    } catch (err: any) {
      this.alert.showError('No se pudo cambiar el estado', err?.error?.message ?? 'Intente de nuevo.');
    }
  }

  confirmandoBorrar = false;

  async eliminar(): Promise<void> {
    try {
      await lastValueFrom(this.service.eliminar(this.id));
      this.alert.showSuccess('Conciliación eliminada', '');
      this.volver();
    } catch (err: any) {
      this.alert.showError('No se pudo eliminar', err?.error?.message ?? 'Intente de nuevo.');
    }
  }

  volver(): void {
    this.router.navigate(['/contabilidad/conciliacion-fiscal']);
  }

  // ── Excel ──────────────────────────────────────────────────────────────
  async exportar(): Promise<void> {
    const r = this.r;
    if (!r) return;
    const filasRenglon = (secciones: SeccionFiscal[]) =>
      this.renglonesDe(...secciones).map((x) => [
        x.seccionTitulo,
        x.codigo,
        x.nombre,
        Number(x.contable),
        Number(x.menorValor),
        Number(x.mayorValor),
        Number(x.fiscal),
      ]);
    const colsRenglon = [
      { titulo: 'Sección', tipo: 'texto' as const, ancho: 14 },
      { titulo: 'Renglón', tipo: 'texto' as const, ancho: 9 },
      { titulo: 'Concepto', tipo: 'texto' as const, ancho: 52 },
      { titulo: 'Valor contable', tipo: 'pesos' as const },
      { titulo: 'Menor valor fiscal', tipo: 'pesos' as const },
      { titulo: 'Mayor valor fiscal', tipo: 'pesos' as const },
      { titulo: 'Valor fiscal', tipo: 'pesos' as const },
    ];
    await this.excel.descargar({
      titulo: `Conciliación fiscal ${r.cabecera.anio} — ${NOMBRE_FORMATO[r.cabecera.formato]}`,
      subtitulo: `Tarifa de renta ${r.cabecera.tarifaRenta} %`,
      archivo: `conciliacion-fiscal-${r.cabecera.formato}-${r.cabecera.anio}`,
      hojas: [
        {
          nombre: 'ESF Patrimonio',
          columnas: colsRenglon,
          filas: [
            ...filasRenglon(['ESF_ACTIVO', 'ESF_PASIVO', 'ESF_PATRIMONIO']),
            { estilo: 'total', valores: ['', '', 'Total activos', r.activosContable, null, null, r.activosFiscal] },
            { estilo: 'total', valores: ['', '', 'Total pasivos', r.pasivosContable, null, null, r.pasivosFiscal] },
            { estilo: 'total', valores: ['', '', 'Patrimonio (fiscal = activos − pasivos)', r.patrimonioContable, null, null, r.patrimonioFiscal] },
          ],
        },
        {
          nombre: 'ERI Renta liquida',
          columnas: colsRenglon,
          filas: [
            ...filasRenglon(['ERI_INGRESO', 'ERI_COSTO', 'ERI_GASTO']),
            { estilo: 'total', valores: ['', '', 'Ingresos', r.ingresosContable, null, null, r.ingresosFiscal] },
            { estilo: 'total', valores: ['', '', 'Costos', r.costosContable, null, null, r.costosFiscal] },
            { estilo: 'total', valores: ['', '', 'Gastos', r.gastosContable, null, null, r.gastosFiscal] },
            { estilo: 'total', valores: ['', '', 'Resultado contable / renta líquida', r.resultadoContable, null, null, r.rentaLiquida] },
            { estilo: 'total', valores: ['', '', `Impuesto de renta (${r.cabecera.tarifaRenta} %)`, null, null, null, r.impuestoRenta] },
          ],
        },
        {
          nombre: 'Impuesto diferido',
          columnas: [
            { titulo: 'Renglón', tipo: 'texto', ancho: 9 },
            { titulo: 'Concepto', tipo: 'texto', ancho: 48 },
            { titulo: 'Contable', tipo: 'pesos' },
            { titulo: 'Fiscal', tipo: 'pesos' },
            { titulo: 'Diferencia', tipo: 'pesos' },
            { titulo: 'Tipo', tipo: 'texto', ancho: 12 },
            { titulo: 'Activo ID', tipo: 'pesos' },
            { titulo: 'Pasivo ID', tipo: 'pesos' },
          ],
          filas: [
            ...r.impuestoDiferido.map((d) => [d.renglon, d.nombre, d.contable, d.fiscal, d.diferencia, d.tipo === 'DEDUCIBLE' ? 'Deducible' : 'Imponible', d.activo, d.pasivo]),
            { estilo: 'total', valores: ['', 'Total', null, null, null, '', r.impuestoDiferidoActivo, r.impuestoDiferidoPasivo] },
          ],
        },
        {
          nombre: 'Ajustes',
          columnas: [
            { titulo: 'Renglón', tipo: 'texto', ancho: 9 },
            { titulo: 'Concepto del renglón', tipo: 'texto', ancho: 40 },
            { titulo: 'Ajuste', tipo: 'texto', ancho: 40 },
            { titulo: 'Cuenta', tipo: 'texto', ancho: 12 },
            { titulo: 'Tipo', tipo: 'texto', ancho: 14 },
            { titulo: 'Diferencia', tipo: 'texto', ancho: 12 },
            { titulo: 'Valor', tipo: 'pesos' },
          ],
          filas: r.ajustes.map((a) => [
            a.renglon,
            a.renglonNombre ?? '',
            a.concepto,
            a.cuentaCodigo ?? '',
            a.tipo === 'MENOR' ? 'Menor valor' : 'Mayor valor',
            a.diferencia === 'PERMANENTE' ? 'Permanente' : 'Temporaria',
            Number(a.valor),
          ]),
        },
        {
          nombre: 'Balance',
          columnas: [
            { titulo: 'Cuenta', tipo: 'texto', ancho: 12 },
            { titulo: 'Nombre', tipo: 'texto', ancho: 40 },
            { titulo: 'Saldo', tipo: 'pesos' },
            { titulo: 'Renglón', tipo: 'texto', ancho: 9 },
            { titulo: 'Concepto', tipo: 'texto', ancho: 48 },
          ],
          filas: this.cuentas.map((c) => [c.codigo, c.nombre ?? '', Number(c.saldo), c.renglon ?? 'Sin clasificar', c.renglonNombre ?? '']),
        },
      ],
    });
  }
}
