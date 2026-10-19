import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { lastValueFrom } from 'rxjs';

import {
  ClienteFirma,
  FirmaContableService,
  IdentidadGestionado,
  TipoPersona,
} from '../../../../core/services/firma-contable.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { TIPO_PERSONA_OPTS, llevaDv, tiposDocumentoPara } from '../../identidad-opciones';

/**
 * Datos de identidad de un cliente gestionado (docs/PLAN_FIRMA_CONTABLE.md §10): la
 * firma decide si es persona natural o jurídica y corrige nombre, documento y DV.
 * El NIT no se cambia. Logo, contacto, resolución y rangos van en "Mi perfil" del cliente.
 */
@Component({
  selector: 'app-identidad-gestionado',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonModule, DialogModule, DropdownModule, InputTextModule],
  templateUrl: './identidad-gestionado.component.html',
  styleUrls: ['../dialogo-firma.scss'],
})
export class IdentidadGestionadoComponent {
  private readonly service = inject(FirmaContableService);
  private readonly alert = inject(AlertService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() visible = false;
  @Input() cliente: ClienteFirma | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  /** Se guardó: la lista de clientes muestra el nombre nuevo. */
  @Output() guardado = new EventEmitter<void>();

  readonly tipoPersonaOpts = TIPO_PERSONA_OPTS;
  datos: IdentidadGestionado | null = null;
  cargando = false;
  guardando = false;
  intento = false;

  get esNatural(): boolean {
    return this.datos?.tipoPersona === 'NATURAL';
  }

  get tipoDocOpts(): { label: string; value: string }[] {
    return tiposDocumentoPara(this.datos?.tipoPersona ?? 'JURIDICA');
  }

  get conDv(): boolean {
    return llevaDv(this.datos?.tipoDocumento);
  }

  /** Lo que falta según el tipo de persona; vacío = se puede guardar. */
  get faltante(): string | null {
    if (!this.datos) return null;
    if (this.esNatural) {
      if (!this.datos.nombres?.trim()) return 'Escriba los nombres';
      if (!this.datos.apellidos?.trim()) return 'Escriba los apellidos';
      return null;
    }
    return this.datos.razonSocial?.trim() ? null : 'Escriba la razón social';
  }

  async alAbrir(): Promise<void> {
    if (!this.cliente) return;
    this.cargando = true;
    this.intento = false;
    this.datos = null;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.identidad(this.cliente.clienteEmpresaId));
      this.datos = res?.data ?? null;
    } catch (err: any) {
      this.alert.showError('No se pudieron leer los datos', err?.error?.message ?? 'Intente de nuevo.');
      this.cerrar();
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  cambiarTipo(tipo: TipoPersona): void {
    if (!this.datos) return;
    this.datos = { ...this.datos, tipoPersona: tipo };
    // La jurídica solo usa NIT; al pasar a natural se deja el documento que tenía.
    if (tipo === 'JURIDICA') this.datos.tipoDocumento = 'NIT';
    if (tipo === 'NATURAL' && !this.datos.nombres && this.datos.razonSocial) {
      this.datos.nombres = this.datos.razonSocial;
    }
  }

  async guardar(): Promise<void> {
    if (!this.cliente || !this.datos) return;
    this.intento = true;
    if (this.faltante) {
      this.cdr.markForCheck();
      return;
    }
    const natural = this.esNatural;
    const dto: IdentidadGestionado = {
      tipoPersona: this.datos.tipoPersona,
      tipoDocumento: this.datos.tipoDocumento,
      razonSocial: natural ? null : this.texto(this.datos.razonSocial),
      nombres: natural ? this.texto(this.datos.nombres) : null,
      apellidos: natural ? this.texto(this.datos.apellidos) : null,
      nombreComercial: this.texto(this.datos.nombreComercial),
      dv: this.conDv ? this.texto(this.datos.dv) : null,
    };
    this.guardando = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(this.service.cambiarIdentidad(this.cliente.clienteEmpresaId, dto));
      this.alert.showSuccess('Datos actualizados', 'El cambio quedó en la bitácora del cliente.');
      this.guardado.emit();
      this.cerrar();
    } catch (err: any) {
      this.alert.showError('No se pudo guardar', err?.error?.message ?? 'Intente de nuevo.');
    } finally {
      this.guardando = false;
      this.cdr.markForCheck();
    }
  }

  cerrar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  private texto(v: string | null | undefined): string | null {
    const s = (v ?? '').trim();
    return s ? s : null;
  }
}
