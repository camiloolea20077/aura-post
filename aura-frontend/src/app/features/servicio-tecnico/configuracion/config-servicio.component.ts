import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutoCompleteCompleteEvent, AutoCompleteModule, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

import { ProductoTableModel } from '../../../core/models/producto.model';
import { ConfigServicioTecnico } from '../../../core/models/servicio-tecnico.model';
import { ProductoService } from '../../../core/services/producto.service';
import { ServicioTecnicoService } from '../../../core/services/servicio-tecnico.service';
import { AlertService } from '../../../shared/pipes/alert.service';

/** Consecutivo, garantía por defecto y condiciones de la orden de servicio. */
@Component({
  selector: 'app-config-servicio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, AutoCompleteModule, ButtonModule, InputTextModule, TextareaModule],
  template: `
    <div class="page">
      <div class="card">
        <div class="card-head">
          <div class="card-head__title">
            <span class="header-icon"><i class="pi pi-cog"></i></span>
            <div>
              <h1 class="title">Configuración del servicio técnico</h1>
              <p class="subtitle">Numeración, garantía y condiciones que salen en la orden</p>
            </div>
          </div>
        </div>

        <div class="cuerpo" *ngIf="config; else cargando">
          <div class="grid">
            <div class="campo">
              <label>Prefijo de las órdenes</label>
              <input pInputText [(ngModel)]="config.prefijo" maxlength="10" placeholder="OS" />
              <small class="ayuda">
                La próxima orden será <strong>{{ (config.prefijo || 'OS').toUpperCase() }}-{{ numero }}</strong>.
              </small>
            </div>
            <div class="campo">
              <label>Garantía por defecto (días)</label>
              <input pInputText type="number" min="0" max="730" [(ngModel)]="config.garantiaDias" />
              <small class="ayuda">Se puede cambiar en cada orden.</small>
            </div>
          </div>
          <div class="campo">
            <label>Servicio con el que se factura la mano de obra <span class="req">*</span></label>
            <div class="servicio-sel" *ngIf="config.productoServicioId && !cambiandoServicio">
              <i class="pi pi-wrench"></i> {{ config.productoServicioNombre }}
              <button type="button" class="link" (click)="cambiandoServicio = true">cambiar</button>
            </div>
            <p-autoComplete
              *ngIf="!config.productoServicioId || cambiandoServicio"
              [(ngModel)]="servicioSel"
              [suggestions]="sugerencias"
              (completeMethod)="buscar($event)"
              (onSelect)="elegir($event)"
              optionLabel="nombre"
              [minLength]="2"
              [delay]="300"
              placeholder="Buscar un servicio del catálogo (p. ej. «Servicio técnico»)…"
              styleClass="w-full"
              inputStyleClass="w-full"
            />
            <small class="ayuda">
              Créelo en Catálogo › Productos como tipo <strong>Servicio</strong> (sin inventario), con el IVA que cobre.
              Se usa para la mano de obra y los repuestos que no están en el inventario.
            </small>
          </div>
          <div class="campo">
            <label>Condiciones del servicio</label>
            <textarea
              pTextarea
              rows="7"
              [(ngModel)]="config.condiciones"
              maxlength="4000"
              placeholder="Ej.: Los equipos no reclamados en 90 días se consideran abandonados. La garantía no cubre humedad ni golpes. El taller no responde por la información del equipo…"
            ></textarea>
            <small class="ayuda">Saldrán en la orden impresa y en el correo al cliente.</small>
          </div>
        </div>
        <ng-template #cargando><div class="cuerpo ayuda">Cargando…</div></ng-template>

        <div class="card-footer">
          <button pButton type="button" label="Guardar" icon="pi pi-check" class="btn-aura" [loading]="guardando" [disabled]="!config" (click)="guardar()"></button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: block; container-type: inline-size; }
      .cuerpo { padding: 1.25rem 1.5rem; max-width: 820px; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 1rem; }
      @container (max-width: 560px) { .grid { grid-template-columns: minmax(0, 1fr); } }
      .campo { display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 1rem; min-width: 0; }
      .campo label { font-size: 0.8rem; font-weight: 600; }
      .campo input, .campo textarea { width: 100%; }
      .ayuda { color: var(--aura-text-muted); font-size: 0.78rem; }
      .req { color: #b91c1c; }
      .servicio-sel { font-size: 0.9rem; color: #15803d; }
      .link { border: 0; background: transparent; color: #2563eb; cursor: pointer; text-decoration: underline; }
      ::ng-deep .p-autocomplete { width: 100%; }
    `,
  ],
})
export class ConfigServicioComponent implements OnInit {
  config: ConfigServicioTecnico | null = null;
  guardando = false;
  cambiandoServicio = false;
  servicioSel: ProductoTableModel | null = null;
  sugerencias: ProductoTableModel[] = [];

  constructor(
    private readonly servicio: ServicioTecnicoService,
    private readonly alert: AlertService,
    private readonly productos: ProductoService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  buscar(e: AutoCompleteCompleteEvent): void {
    this.productos.search(e.query).subscribe({
      next: (r) => {
        this.sugerencias = r.data ?? [];
        this.cdr.markForCheck();
      },
      error: () => (this.sugerencias = []),
    });
  }

  elegir(e: AutoCompleteSelectEvent): void {
    if (!this.config) return;
    const p = e.value as ProductoTableModel;
    this.config.productoServicioId = p.id;
    this.config.productoServicioNombre = p.nombre;
    this.cambiandoServicio = false;
    this.servicioSel = null;
    this.cdr.markForCheck();
  }

  get numero(): string {
    return String(this.config?.siguienteNumero ?? 1).padStart(4, '0');
  }

  ngOnInit(): void {
    this.servicio.config().subscribe({
      next: (r) => {
        this.config = r.data;
        this.cdr.markForCheck();
      },
      error: (err) => this.alert.showError('Configuración', err?.error?.message ?? 'No se pudo cargar.'),
    });
  }

  guardar(): void {
    if (!this.config) return;
    const c = this.config;
    if (!c.prefijo?.trim() || !/^[A-Za-z0-9]{1,10}$/.test(c.prefijo.trim())) {
      this.alert.showWarn('Configuración', 'El prefijo solo admite letras y números, sin espacios.');
      return;
    }
    this.guardando = true;
    this.servicio
      .guardarConfig({
        prefijo: c.prefijo.trim(),
        garantiaDias: Number(c.garantiaDias) || 0,
        condiciones: c.condiciones,
        productoServicioId: c.productoServicioId,
      })
      .subscribe({
        next: (r) => {
          this.config = r.data;
          this.guardando = false;
          this.alert.showSuccess('Configuración', 'Guardada.');
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.guardando = false;
          this.alert.showError('Configuración', err?.error?.message ?? 'No se pudo guardar.');
          this.cdr.markForCheck();
        },
      });
  }
}
