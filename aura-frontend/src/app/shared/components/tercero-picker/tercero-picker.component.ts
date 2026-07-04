import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { lastValueFrom } from 'rxjs';

import { TerceroService } from '../../../core/services/tercero.service';
import { TerceroTableModel } from '../../../core/models/tercero.model';

/**
 * Selector de tercero reutilizable: input con lupa que abre una modal con
 * tabla y búsqueda avanzada para elegir un tercero.
 * Uso: <app-tercero-picker [terceroId]="x" [terceroNombre]="y"
 *        (seleccionado)="onSel($event)" />
 */
@Component({
  selector: 'app-tercero-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './tercero-picker.component.html',
})
export class TerceroPickerComponent {
  @Input() terceroId: number | null = null;
  @Input() terceroNombre: string | null = null;
  @Input() placeholder = 'Buscar tercero...';
  @Input() filtro: 'TODOS' | 'CLIENTE' | 'PROVEEDOR' | 'BANCO' = 'TODOS';

  @Output() seleccionado = new EventEmitter<{
    id: number;
    nombre: string;
  } | null>();

  showModal = false;
  loading = false;
  items: TerceroTableModel[] = [];
  totalRecords = 0;
  rows = 8;
  search = '';
  private searchTimer?: ReturnType<typeof setTimeout>;
  private lastEvent?: TableLazyLoadEvent;

  constructor(
    private readonly service: TerceroService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  abrir(): void {
    this.showModal = true;
    this.search = '';
    this.cdr.markForCheck();
  }

  async cargar(event: TableLazyLoadEvent): Promise<void> {
    this.lastEvent = event;
    this.loading = true;
    this.cdr.markForCheck();
    try {
      if (this.filtro === 'BANCO') {
        const res = await lastValueFrom(this.service.bancos(this.search || ''));
        this.items = res?.data ?? [];
        this.totalRecords = this.items.length;
      } else {
        const page = Math.floor((event.first ?? 0) / (event.rows ?? this.rows));
        const res = await lastValueFrom(
          this.service.page({
            page,
            rows: event.rows ?? this.rows,
            search: this.search || null,
          }),
        );
        this.items = res?.data?.content ?? [];
        this.totalRecords = res?.data?.totalElements ?? 0;
      }
    } catch {
      this.items = [];
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  onSearch(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.cargar({ ...(this.lastEvent ?? {}), first: 0, rows: this.rows });
    }, 300);
  }

  elegir(t: TerceroTableModel): void {
    this.terceroId = t.id;
    this.terceroNombre = t.nombreCompleto;
    this.seleccionado.emit({ id: t.id, nombre: t.nombreCompleto });
    this.showModal = false;
    this.cdr.markForCheck();
  }

  limpiar(ev: Event): void {
    ev.stopPropagation();
    this.terceroId = null;
    this.terceroNombre = null;
    this.seleccionado.emit(null);
    this.cdr.markForCheck();
  }

  roles(t: TerceroTableModel): string[] {
    const r: string[] = [];
    if (t.esCliente) r.push('Cliente');
    if (t.esProveedor) r.push('Proveedor');
    if (t.esEmpleado) r.push('Empleado');
    if (t.esBanco) r.push('Banco');
    return r;
  }
}
