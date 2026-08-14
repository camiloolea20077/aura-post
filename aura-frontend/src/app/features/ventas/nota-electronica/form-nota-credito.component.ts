import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { lastValueFrom } from 'rxjs';

import { BuscadorProductoDialogComponent } from '../../../shared/components/buscador-producto-dialog/buscador-producto-dialog.component';
import { ProductoTableModel } from '../../../core/models/producto.model';
import { NotaElectronicaService } from '../../../core/services/nota-electronica.service';
import {
  CONCEPTO_CORRECCION_DEBITO_OPTS,
  CONCEPTO_CORRECCION_OPTS,
  CrearNotaCreditoDto,
  FactusItemPayload,
  METODO_PAGO_OPTS,
  TAX_RATE_OPTS,
  TIPO_OPERACION_DEBITO_OPTS,
  TIPO_OPERACION_OPTS,
} from '../../../core/models/nota-electronica.model';
import { AlertService } from '../../../shared/pipes/alert.service';

/** Factura del buscador (mapeo defensivo del JSON de Factus get-bills). */
interface FacturaBusqueda {
  id: number;
  numero: string;
  cufe: string;
  cliente: string;
  identificacion: string;
  raw: any;
}

@Component({
  selector: 'app-form-nota-credito',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    DropdownModule,
    TableModule,
    TagModule,
    BuscadorProductoDialogComponent,
  ],
  templateUrl: './form-nota-credito.component.html',
  styleUrls: ['./form-nota-credito.component.scss'],
})
export class FormNotaCreditoComponent {
  /** CREDITO | DEBITO, según la ruta (data.tipo). El form es el mismo. */
  tipo: 'CREDITO' | 'DEBITO' = 'CREDITO';

  get esDebito(): boolean {
    return this.tipo === 'DEBITO';
  }
  get tituloDoc(): string {
    return this.esDebito ? 'Nueva nota débito' : 'Nueva nota crédito';
  }
  get tipoOperacionOpts() {
    return this.esDebito ? TIPO_OPERACION_DEBITO_OPTS : TIPO_OPERACION_OPTS;
  }
  get conceptoOpts() {
    return this.esDebito
      ? CONCEPTO_CORRECCION_DEBITO_OPTS
      : CONCEPTO_CORRECCION_OPTS;
  }
  readonly metodoPagoOpts = METODO_PAGO_OPTS;
  readonly taxRateOpts = TAX_RATE_OPTS;

  saving = false;

  form = {
    customizationId: 20 as number,
    correctionConceptCode: 2 as number,
    numberingRangeId: null as number | null,
    referenceCode: '',
    paymentMethodCode: '10',
    observation: '',
  };

  // ── Factura referenciada ──
  facturaSearch = '';
  buscando = false;
  resultados: FacturaBusqueda[] = [];
  facturaSel: FacturaBusqueda | null = null;

  // ── Items ──
  items: FactusItemPayload[] = [];
  itemForm = this.itemVacio();
  /** Índice del item que se está editando; null = alta. */
  editIndex: number | null = null;
  showBuscador = false;

  readonly unidadOpts = [
    { label: 'Unidad', value: 70 },
    { label: 'Kilogramo', value: 71 },
    { label: 'Litro', value: 72 },
    { label: 'Metro', value: 73 },
    { label: 'Servicio', value: 74 },
  ];

  constructor(
    private readonly service: NotaElectronicaService,
    private readonly alert: AlertService,
    private readonly router: Router,
    route: ActivatedRoute,
  ) {
    this.tipo = route.snapshot.data['tipo'] === 'DEBITO' ? 'DEBITO' : 'CREDITO';
    // Defaults por tipo (los códigos de débito se confirman con la tabla Factus).
    if (this.esDebito) {
      this.form.customizationId = 30;
      this.form.correctionConceptCode = 1;
    }
  }

  get requiereFactura(): boolean {
    return this.form.customizationId === 20;
  }

  // ── Buscar factura ──────────────────────────────────────────────────────
  async buscarFactura(): Promise<void> {
    if (!this.facturaSearch.trim()) {
      this.alert.showWarn(
        'Requerido',
        'Escribe N° de factura, documento o nombre del cliente',
      );
      return;
    }
    this.buscando = true;
    try {
      const res = await lastValueFrom(
        this.service.buscarFacturas(this.facturaSearch.trim()),
      );
      this.resultados = this.mapearFacturas(res?.data);
      if (this.resultados.length === 0)
        this.alert.showInfo('Sin resultados', 'No se encontraron facturas');
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudo buscar la factura',
      );
      this.resultados = [];
    } finally {
      this.buscando = false;
    }
  }

  /** Mapeo defensivo: /v1/bills anida el arreglo (data.data[]); se busca el primer array. */
  private mapearFacturas(data: any): FacturaBusqueda[] {
    const candidatos = [
      data,
      data?.data,
      data?.data?.data,
      data?.bills,
      data?.data?.bills,
    ];
    const lista = candidatos.find((c) => Array.isArray(c)) ?? [];
    if (!Array.isArray(lista)) return [];
    return lista.map((b: any) => ({
      id: b.id ?? b.bill_id,
      numero: b.number ?? b.reference_code ?? b.numero ?? '',
      cufe: b.cufe ?? b.cude ?? '',
      cliente:
        b.customer?.names ??
        b.customer?.company ??
        b.names ??
        b.client_name ??
        '',
      identificacion:
        b.customer?.identification ?? b.identification ?? b.nit ?? '',
      raw: b,
    }));
  }

  async seleccionarFactura(f: FacturaBusqueda): Promise<void> {
    this.facturaSel = f;
    this.resultados = [];
    this.facturaSearch = '';
    // Referencia sugerida a partir del número de factura.
    if (!this.form.referenceCode)
      this.form.referenceCode =
        (this.esDebito ? 'ND-' : 'NC-') + (f.numero || Date.now());

    // Prefill: CUFE + ítems con IVA desde el detalle de la factura (Factus o BD local).
    try {
      const res = await lastValueFrom(
        this.service.facturaDetalle(f.id, f.numero),
      );
      const det = res?.data;
      if (det) {
        if (det.cufe) this.facturaSel = { ...this.facturaSel, cufe: det.cufe };
        this.items = det.items ?? [];
      }
    } catch {
      this.alert.showWarn(
        'Sin detalle',
        'No se pudieron traer los productos de la factura; agrégalos manualmente.',
      );
    }
  }

  limpiarFactura(): void {
    this.facturaSel = null;
  }

  // ── Items ───────────────────────────────────────────────────────────────
  private itemVacio() {
    return {
      codeReference: '',
      name: '',
      price: null as number | null,
      unitMeasureId: 70,
      quantity: 1,
      discountRate: 0,
      taxRate: '19.00',
    };
  }

  /** Total de la fila en edición (precio × cantidad − descuento). */
  get totalItemForm(): number {
    const i = this.itemForm;
    if (!i.price || !i.quantity) return 0;
    return i.price * i.quantity * (1 - (i.discountRate ?? 0) / 100);
  }

  abrirBuscador(): void {
    this.showBuscador = true;
  }

  onProductoSel(p: ProductoTableModel): void {
    this.itemForm = {
      ...this.itemForm,
      codeReference: p.sku ?? String(p.id),
      name: p.nombre,
      price: p.precio,
      taxRate: (p.ivaPorcentaje ?? 0).toFixed(2),
    };
    this.showBuscador = false;
  }

  /** Agrega o actualiza el item según el modo. */
  guardarItem(): void {
    const i = this.itemForm;
    if (
      !i.name?.trim() ||
      !i.price ||
      i.price <= 0 ||
      !i.quantity ||
      i.quantity <= 0
    ) {
      this.alert.showWarn(
        'Datos incompletos',
        'Nombre, precio y cantidad son obligatorios',
      );
      return;
    }
    const tieneIva = i.taxRate !== '0.00';
    const nuevo: FactusItemPayload = {
      code_reference: i.codeReference?.trim() || 'SIN-REF',
      name: i.name.trim(),
      quantity: i.quantity,
      discount_rate: i.discountRate ?? 0,
      price: i.price,
      tax_rate: i.taxRate,
      tribute_id: tieneIva ? 1 : 3,
      unit_measure_id: i.unitMeasureId ?? 70,
      standard_code_id: 1,
      is_excluded: tieneIva ? 0 : 1,
      withholding_taxes: [],
    };
    if (this.editIndex !== null) {
      this.items = this.items.map((it, idx) =>
        idx === this.editIndex ? nuevo : it,
      );
    } else {
      this.items = [...this.items, nuevo];
    }
    this.cancelarItem();
  }

  /** Carga un item de la tabla en el editor de arriba. */
  editarItem(it: FactusItemPayload, idx: number): void {
    this.editIndex = idx;
    this.itemForm = {
      codeReference: it.code_reference,
      name: it.name,
      price: it.price,
      unitMeasureId: it.unit_measure_id,
      quantity: it.quantity,
      discountRate: it.discount_rate,
      taxRate: it.tax_rate,
    };
  }

  cancelarItem(): void {
    this.itemForm = this.itemVacio();
    this.editIndex = null;
  }

  eliminarItem(): void {
    if (this.editIndex === null) return;
    this.items = this.items.filter((_, i) => i !== this.editIndex);
    this.cancelarItem();
  }

  // ── Totales (estimación cliente; Factus calcula el definitivo) ───────────
  lineaTotal(it: FactusItemPayload): number {
    return it.price * it.quantity * (1 - (it.discount_rate ?? 0) / 100);
  }
  /** Valor del IVA de la línea (el precio ya incluye IVA). */
  ivaLinea(it: FactusItemPayload): number {
    const linea = this.lineaTotal(it);
    const tasa = parseFloat(it.tax_rate) || 0;
    return tasa > 0 ? linea - linea / (1 + tasa / 100) : 0;
  }
  get totalBruto(): number {
    return this.items.reduce((s, it) => s + it.price * it.quantity, 0);
  }
  get totalDescuentos(): number {
    return this.items.reduce(
      (s, it) => s + it.price * it.quantity * ((it.discount_rate ?? 0) / 100),
      0,
    );
  }
  get total(): number {
    return this.items.reduce((s, it) => s + this.lineaTotal(it), 0);
  }
  get totalIva(): number {
    // price incluye IVA: iva = total - total/(1+tasa).
    return this.items.reduce((s, it) => {
      const linea = this.lineaTotal(it);
      const tasa = parseFloat(it.tax_rate) || 0;
      return s + (tasa > 0 ? linea - linea / (1 + tasa / 100) : 0);
    }, 0);
  }
  get subtotal(): number {
    return this.total - this.totalIva;
  }

  // ── Guardar ──────────────────────────────────────────────────────────────
  async registrar(): Promise<void> {
    if (this.requiereFactura && !this.facturaSel) {
      this.alert.showWarn(
        'Falta la factura',
        'Selecciona la factura que referencia la nota',
      );
      return;
    }
    if (!this.form.referenceCode.trim()) {
      this.alert.showWarn(
        'Falta la referencia',
        'Indica un código de referencia único',
      );
      return;
    }
    if (this.items.length === 0) {
      this.alert.showWarn(
        'Sin productos',
        'Agrega al menos un producto o servicio',
      );
      return;
    }

    const dto: CrearNotaCreditoDto = {
      customization_id: this.form.customizationId,
      correction_concept_code: this.form.correctionConceptCode,
      numbering_range_id: this.form.numberingRangeId,
      bill_id: this.requiereFactura ? (this.facturaSel?.id ?? null) : null,
      reference_code: this.form.referenceCode.trim(),
      payment_method_code: this.form.paymentMethodCode,
      observation: this.form.observation?.trim() || null,
      items: this.items,
    };

    this.saving = true;
    try {
      const res = await lastValueFrom(
        this.esDebito
          ? this.service.crearNotaDebito(dto)
          : this.service.crearNotaCredito(dto),
      );
      const nodo = (res?.data as any)?.data;
      const cude = this.esDebito
        ? nodo?.debit_note?.cude
        : nodo?.credit_note?.cude;
      if (cude) {
        this.alert.showSuccess(
          this.tituloDoc.replace('Nueva', '') + ' emitida',
          'CUDE: ' + cude,
        );
        this.router.navigate(['/ventas/notas']);
      } else {
        const msg =
          (res?.data as any)?.message ?? 'Factus/DIAN no aceptó la nota';
        this.alert.showWarn('Revisar', msg);
      }
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudo emitir la nota',
      );
    } finally {
      this.saving = false;
    }
  }

  cancelar(): void {
    this.router.navigate(['/ventas/notas']);
  }
}
