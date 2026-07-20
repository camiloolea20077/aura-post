import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { lastValueFrom } from 'rxjs';

import { ContratoService } from '../../../../core/services/contrato.service';
import { ContratoTableModel } from '../../../../core/models/contrato.model';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { FormContratoComponent } from '../form/form-contrato.component';
import { HistorialSalarioComponent } from '../historial/historial-salario.component';
import { TerminarContratoComponent } from '../terminar/terminar-contrato.component';
import { AfiliacionesComponent } from '../afiliaciones/afiliaciones.component';
import { RetefuenteComponent } from '../retefuente/retefuente.component';
import { EmbargosComponent } from '../embargos/embargos.component';

/**
 * Contratos de un empleado (Fase 2).
 *
 * Se entra desde el listado de empleados. Un empleado puede tener varios
 * contratos: por eso es una pantalla propia y no una sección del form.
 */
@Component({
  selector: 'app-index-contratos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    SkeletonModule,
    ConfirmDialogModule,
    FormContratoComponent,
    HistorialSalarioComponent,
    TerminarContratoComponent,
    AfiliacionesComponent,
    RetefuenteComponent,
    EmbargosComponent,
  ],
  providers: [ConfirmationService],
  templateUrl: './index-contratos.component.html',
  styleUrls: ['./index-contratos.component.scss'],
})
export class IndexContratosComponent implements OnInit {
  /** Modo embebido (dentro del detalle de empleado): sin header de página. */
  @Input() embedded = false;
  /** Empleado por Input cuando es embebido (en vez del param de ruta). */
  @Input() empleadoIdInput: number | null = null;

  empleadoId!: number;
  empleadoNombre = '';

  items: ContratoTableModel[] = [];
  loading = true;

  showForm = false;
  showHistorial = false;
  showTerminar = false;
  showAfiliaciones = false;
  showRetefuente = false;
  showEmbargos = false;
  contratoSeleccionado: ContratoTableModel | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: ContratoService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.empleadoId =
      this.empleadoIdInput ?? +this.route.snapshot.params['empleadoId'];
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading = true;
    try {
      const res = await lastValueFrom(
        this.service.porEmpleado(this.empleadoId),
      );
      this.items = res.data ?? [];
      this.empleadoNombre = this.items[0]?.empleadoNombre ?? '';
    } catch {
      this.alert.showError('Error', 'No se pudieron cargar los contratos.');
    } finally {
      this.loading = false;
    }
  }

  /** Contrato en edición (null = alta). */
  contratoEditId: number | null = null;

  nuevo(): void {
    this.contratoEditId = null;
    this.contratoSeleccionado = null;
    this.showForm = true;
  }

  editar(c: ContratoTableModel): void {
    this.contratoEditId = c.id;
    this.showForm = true;
  }

  /**
   * El salario NO se edita desde la tabla.
   *
   * Cambiarlo preserva el histórico (cierra la vigencia anterior y abre otra),
   * así que pasa por su propia pantalla, que pide desde cuándo rige y por qué.
   */
  verHistorial(c: ContratoTableModel): void {
    this.contratoSeleccionado = c;
    this.showHistorial = true;
  }

  afiliaciones(c: ContratoTableModel): void {
    this.contratoSeleccionado = c;
    this.showAfiliaciones = true;
  }

  retefuente(c: ContratoTableModel): void {
    this.contratoSeleccionado = c;
    this.showRetefuente = true;
  }

  embargos(c: ContratoTableModel): void {
    this.contratoSeleccionado = c;
    this.showEmbargos = true;
  }

  terminar(c: ContratoTableModel): void {
    if (c.estado !== 'ACTIVO') {
      this.alert.showWarn(
        'No aplica',
        `El contrato ya está ${c.estado.toLowerCase()}.`,
      );
      return;
    }
    this.contratoSeleccionado = c;
    this.showTerminar = true;
  }

  onGuardado(): void {
    this.showForm = false;
    this.showHistorial = false;
    this.showTerminar = false;
    this.cargar();
  }

  volver(): void {
    this.router.navigate(['/nomina/empleados']);
  }

  // ── Presentación ────────────────────────────────────────────

  severidadEstado(estado: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (estado) {
      case 'ACTIVO':
        return 'success';
      case 'SUSPENDIDO':
        return 'warn';
      case 'TERMINADO':
        return 'danger';
      default:
        return 'info';
    }
  }

  /**
   * Alerta de vencimiento.
   *
   * Solo aplica a los contratos con fecha fin: un indefinido no vence. Un valor
   * negativo significa que ya venció y nadie lo renovó — eso es lo que más
   * conviene que salte a la vista.
   */
  severidadVencimiento(dias: number | null): 'danger' | 'warn' | 'info' | null {
    if (dias === null) return null;
    if (dias < 0) return 'danger';
    if (dias <= 30) return 'warn';
    return 'info';
  }

  textoVencimiento(dias: number | null): string {
    if (dias === null) return 'Indefinido';
    if (dias < 0) return `Venció hace ${Math.abs(dias)} d`;
    if (dias === 0) return 'Vence hoy';
    return `Vence en ${dias} d`;
  }
}
