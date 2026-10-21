import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { ContratoTableModel } from '../../../../core/models/contrato.model';
import { VinculacionTableModel } from '../../../../core/models/vinculacion.model';
import { VinculacionService } from '../../../../core/services/vinculacion.service';
import { PuedeDirective } from '../../../../shared/directives/puede.directive';
import { HistorialSalarioComponent } from '../../contratos/historial/historial-salario.component';
import { TerminarContratoComponent } from '../../contratos/terminar/terminar-contrato.component';
import {
  aContratoTabla,
  diasParaFinPrueba,
  severidadEstado,
  textoEstado,
} from '../vinculacion.util';

/**
 * Vinculaciones de la empresa: el contrato completo de cada empleado, con
 * buscador. Desde aquí se cambia el salario (con histórico) y se retira la
 * vinculación.
 */
@Component({
  selector: 'app-index-vinculaciones',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    TagModule,
    TooltipModule,
    PuedeDirective,
    HistorialSalarioComponent,
    TerminarContratoComponent,
  ],
  templateUrl: './index-vinculaciones.component.html',
  styleUrls: ['./index-vinculaciones.component.scss'],
})
export class IndexVinculacionesComponent implements OnInit {
  filas: VinculacionTableModel[] = [];
  totalFilas = 0;
  cargando = true;
  busqueda = '';
  pagina = 0;
  tamano = 10;

  /** Vinculación sobre la que se abre el historial de salario o el retiro. */
  contratoSel: ContratoTableModel | null = null;
  mostrarSalario = false;
  mostrarRetiro = false;

  constructor(
    private readonly service: VinculacionService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Desde Empleados se llega con ?search=<documento>: se muestran todas sus vinculaciones.
    const search = this.route.snapshot.queryParamMap.get('search');
    if (search) this.busqueda = search;
    void this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.page(this.pagina, this.tamano, this.busqueda || null, {
          estado: null,
          tipoVinculacionId: null,
          cargoId: null,
          grupoNominaId: null,
        }),
      );
      this.filas = res?.data?.content ?? [];
      this.totalFilas = res?.data?.totalElements ?? 0;
    } catch {
      this.filas = [];
      this.totalFilas = 0;
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  onPagina(e: { first: number; rows: number }): void {
    this.pagina = e.first / e.rows;
    this.tamano = e.rows;
    void this.cargar();
  }

  buscar(): void {
    this.pagina = 0;
    void this.cargar();
  }

  limpiarBusqueda(): void {
    if (!this.busqueda) return;
    this.busqueda = '';
    this.buscar();
  }

  nueva(): void {
    void this.router.navigate(['/nomina/vinculaciones/nueva']);
  }

  abrir(v: VinculacionTableModel): void {
    void this.router.navigate(['/nomina/vinculaciones', v.id]);
  }

  cambiarSalario(v: VinculacionTableModel): void {
    this.contratoSel = aContratoTabla(v);
    this.mostrarSalario = true;
  }

  retirar(v: VinculacionTableModel): void {
    this.contratoSel = aContratoTabla(v);
    this.mostrarRetiro = true;
  }

  // ── Presentación ──────────────────────────────────────────────

  textoEstado = textoEstado;
  severidadEstado = severidadEstado;

  /** Aviso cuando el período de prueba vence en 15 días o menos. */
  avisoPrueba(v: VinculacionTableModel): string | null {
    const dias = diasParaFinPrueba(v);
    if (dias == null || dias > 15) return null;
    return dias === 0 ? 'La prueba termina hoy' : `Prueba: ${dias} d`;
  }
}
