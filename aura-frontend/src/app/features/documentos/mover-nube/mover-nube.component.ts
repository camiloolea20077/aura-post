import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { lastValueFrom } from 'rxjs';

import { NubeCarpeta, NubeTramoRuta } from '../../../core/models/nube.model';
import { NubeService } from '../../../core/services/nube.service';

/** Destino elegido: null = la raíz. */
export interface DestinoNube {
  carpetaId: number | null;
}

/**
 * Diálogo para elegir a qué carpeta mover algo: se navega por las carpetas (solo
 * las que el usuario puede ver) y se confirma "Mover aquí".
 */
@Component({
  selector: 'app-mover-nube',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonModule, DialogModule],
  template: `
    <p-dialog
      [header]="'Mover «' + nombre + '»'"
      [(visible)]="visible"
      (visibleChange)="visibleChange.emit($event)"
      [modal]="true"
      [style]="{ width: '30rem' }"
      [breakpoints]="{ '640px': '95vw' }"
      [draggable]="false"
    >
      <nav class="migas">
        <button type="button" class="miga" (click)="abrir(null)">
          <i class="pi pi-home"></i> Documentos
        </button>
        <ng-container *ngFor="let t of ruta">
          <i class="pi pi-angle-right miga-sep"></i>
          <button type="button" class="miga" (click)="abrir(t.id)">{{ t.nombre }}</button>
        </ng-container>
      </nav>

      <div class="lista">
        <p class="vacio" *ngIf="!cargando && !carpetas.length">No hay subcarpetas aquí.</p>
        <button
          type="button"
          class="fila"
          *ngFor="let c of carpetas"
          [disabled]="c.id === excluirId"
          (click)="abrir(c.id)"
        >
          <i class="pi pi-folder"></i>
          <span class="fila__nombre">{{ c.nombre }}</span>
          <i class="pi pi-lock fila__privada" *ngIf="c.visibilidad === 'SOLO_FIRMA'" title="Solo firma"></i>
          <i class="pi pi-angle-right"></i>
        </button>
      </div>

      <ng-template pTemplate="footer">
        <button pButton type="button" label="Cancelar" class="p-button-text" (click)="cerrar()"></button>
        <button
          pButton
          type="button"
          icon="pi pi-check"
          label="Mover aquí"
          class="btn-aura"
          [disabled]="cargando || actual === origenId"
          (click)="elegir.emit({ carpetaId: actual })"
        ></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [
    `
      .migas {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.25rem;
        margin-bottom: 0.75rem;
      }
      .miga {
        border: none;
        background: none;
        padding: 0.2rem 0.35rem;
        border-radius: 6px;
        color: var(--aura-blue);
        cursor: pointer;
        font: inherit;
      }
      .miga:hover {
        background: rgba(37, 99, 235, 0.08);
      }
      .miga-sep {
        font-size: 0.75rem;
        color: var(--aura-text-muted);
      }
      .lista {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        max-height: 18rem;
        overflow-y: auto;
      }
      .fila {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.6rem 0.75rem;
        border: 1px solid var(--aura-border);
        border-radius: 8px;
        background: none;
        cursor: pointer;
        font: inherit;
        text-align: left;
        min-width: 0;
      }
      .fila:hover:not(:disabled) {
        border-color: var(--aura-blue);
      }
      .fila:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      .fila__nombre {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .fila__privada {
        color: #b45309;
      }
      .vacio {
        margin: 0.5rem 0;
        color: var(--aura-text-muted);
      }
    `,
  ],
})
export class MoverNubeComponent implements OnChanges {
  private readonly service = inject(NubeService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() visible = false;
  @Input() nombre = '';
  /** Carpeta que se mueve (no puede entrar en sí misma). */
  @Input() excluirId: number | null = null;
  /** Dónde está hoy (moverlo ahí mismo no hace nada). */
  @Input() origenId: number | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() elegir = new EventEmitter<DestinoNube>();

  actual: number | null = null;
  ruta: NubeTramoRuta[] = [];
  carpetas: NubeCarpeta[] = [];
  cargando = false;

  ngOnChanges(): void {
    if (this.visible) void this.abrir(null);
  }

  async abrir(carpetaId: number | null): Promise<void> {
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const r = await lastValueFrom(this.service.contenido(carpetaId));
      this.actual = carpetaId;
      this.ruta = r.data.ruta;
      this.carpetas = r.data.carpetas;
    } catch {
      // El interceptor ya mostró el error.
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  cerrar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
