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
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { lastValueFrom } from 'rxjs';

import {
  BitacoraEvento,
  BitacoraFiltro,
} from '../../core/models/permisos.model';
import { PermisosService } from '../../core/services/permisos.service';

interface Opcion {
  label: string;
  value: string | null;
}

/**
 * Bitácora de auditoría (docs/PLAN_PERMISOS.md, fase P7): quién anuló, editó,
 * autorizó o cambió qué y cuándo, con el antes y el después cuando lo hay.
 */
@Component({
  selector: 'app-bitacora',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CalendarModule,
    DropdownModule,
    InputTextModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './bitacora.component.html',
  styleUrls: ['./bitacora.component.scss'],
})
export class BitacoraComponent implements OnInit {
  eventos: BitacoraEvento[] = [];
  total = 0;
  cargando = false;
  rows = 50;
  private page = 0;

  desde: Date | null = null;
  hasta: Date | null = null;
  accion: string | null = null;
  modulo: string | null = null;
  texto = '';
  expandido: number | null = null;

  readonly acciones: Opcion[] = [
    { label: 'Todas', value: null },
    { label: 'Anular', value: 'ANULAR' },
    { label: 'Editar', value: 'EDITAR' },
    { label: 'Cambio de precio', value: 'CAMBIO_PRECIO' },
    { label: 'Autorización de descuento', value: 'AUTORIZAR' },
    { label: 'Venta con descuento autorizado', value: 'DESCUENTO_AUTORIZADO' },
    { label: 'Reabrir período', value: 'REABRIR' },
    { label: 'Aprobar', value: 'APROBAR' },
    { label: 'Aprobar crédito', value: 'APROBAR_CREDITO' },
    { label: 'Cambio de clave', value: 'CAMBIO_CLAVE' },
    { label: 'Cambio de sedes', value: 'CAMBIO_SEDES' },
    { label: 'Cerrar sesiones', value: 'CERRAR_SESIONES' },
  ];

  readonly modulos: Opcion[] = [
    { label: 'Todos', value: null },
    { label: 'Ventas', value: 'ventas' },
    { label: 'Compras', value: 'compras' },
    { label: 'Inventario', value: 'inventario' },
    { label: 'Catálogo', value: 'catalogo' },
    { label: 'Cartera', value: 'cartera' },
    { label: 'Cuentas', value: 'cuentas' },
    { label: 'Tesorería', value: 'tesoreria' },
    { label: 'Caja y usuarios', value: 'caja' },
    { label: 'Contabilidad', value: 'contabilidad' },
    { label: 'Recursos humanos', value: 'recursos-humanos' },
  ];

  constructor(
    private readonly service: PermisosService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const hoy = new Date();
    this.desde = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 7);
    this.hasta = hoy;
  }

  onLazy(e: TableLazyLoadEvent): void {
    this.rows = e.rows ?? this.rows;
    this.page = Math.floor((e.first ?? 0) / this.rows);
    this.cargar();
  }

  buscar(): void {
    this.page = 0;
    this.cargar();
  }

  private async cargar(): Promise<void> {
    this.cargando = true;
    this.cdr.markForCheck();
    const filtro: BitacoraFiltro = {
      desde: this.iso(this.desde),
      hasta: this.iso(this.hasta),
      usuarioId: null,
      clave: this.modulo,
      accion: this.accion,
      entidad: null,
      entidadId: null,
      texto: this.texto.trim() || null,
      page: this.page,
      rows: this.rows,
    };
    try {
      const res = await lastValueFrom(this.service.bitacora(filtro));
      this.eventos = res?.data?.items ?? [];
      this.total = res?.data?.total ?? 0;
    } catch {
      /* el interceptor muestra el error */
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  alternar(e: BitacoraEvento): void {
    this.expandido = this.expandido === e.id ? null : e.id;
  }

  tieneDetalle(e: BitacoraEvento): boolean {
    return !!(e.antes || e.despues);
  }

  /** JSON con sangría para leerlo; si no es JSON, el texto tal cual. */
  bonito(v: string | null): string {
    if (!v) return '—';
    try {
      return JSON.stringify(JSON.parse(v), null, 2);
    } catch {
      return v;
    }
  }

  nombreAccion(a: string): string {
    return this.acciones.find((x) => x.value === a)?.label ?? a;
  }

  severidad(a: string): 'danger' | 'warn' | 'info' | 'success' | 'secondary' {
    if (a === 'ANULAR' || a === 'CERRAR_SESIONES') return 'danger';
    if (a === 'AUTORIZAR' || a === 'DESCUENTO_AUTORIZADO' || a === 'CAMBIO_PRECIO') return 'warn';
    if (a === 'EDITAR') return 'info';
    if (a.startsWith('APROBAR')) return 'success';
    return 'secondary';
  }

  private iso(d: Date | null): string | null {
    if (!d) return null;
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const dia = `${d.getDate()}`.padStart(2, '0');
    return `${d.getFullYear()}-${m}-${dia}`;
  }
}
