import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { lastValueFrom } from 'rxjs';

import { NubeArchivo } from '../../../core/models/nube.model';
import { NubeService } from '../../../core/services/nube.service';
import { TipoVista, tipoVista } from '../nube-utils';

/** Más que esto de texto no se pinta (el archivo completo se descarga). */
const MAX_TEXTO = 200_000;

/**
 * Vista previa de un archivo de la nube. El archivo se baja autenticado como blob
 * y se muestra desde memoria: nunca se abre una URL pública. Al cerrar se libera.
 * El texto se pinta como texto (nunca como HTML).
 */
@Component({
  selector: 'app-vista-previa-nube',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonModule, DialogModule, ProgressSpinnerModule],
  template: `
    <p-dialog
      [header]="archivo?.nombre ?? ''"
      [(visible)]="visible"
      (visibleChange)="alCambiarVisible($event)"
      [modal]="true"
      [maximizable]="true"
      [style]="{ width: '60rem' }"
      [breakpoints]="{ '960px': '95vw' }"
      [draggable]="false"
    >
      <div class="vp">
        <p-progressSpinner *ngIf="cargando" strokeWidth="4" styleClass="vp__spinner" />
        <ng-container *ngIf="!cargando && url">
          <iframe *ngIf="tipo === 'pdf'" class="vp__pdf" [src]="url" title="Vista previa"></iframe>
          <img *ngIf="tipo === 'imagen'" class="vp__img" [src]="url" [alt]="archivo?.nombre" />
        </ng-container>
        <pre *ngIf="!cargando && tipo === 'texto'" class="vp__texto">{{ texto }}</pre>
      </div>
      <ng-template pTemplate="footer">
        <button
          pButton
          type="button"
          icon="pi pi-download"
          label="Descargar"
          class="btn-aura"
          (click)="descargar.emit(archivo!)"
          [disabled]="!archivo"
        ></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [
    `
      .vp {
        min-height: 20rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .vp__pdf {
        width: 100%;
        height: 70vh;
        border: none;
      }
      .vp__img {
        max-width: 100%;
        max-height: 70vh;
        object-fit: contain;
      }
      .vp__texto {
        width: 100%;
        max-height: 70vh;
        overflow: auto;
        margin: 0;
        padding: 1rem;
        background: #f8fafc;
        border: 1px solid var(--aura-border);
        border-radius: 8px;
        font-size: 0.8rem;
        white-space: pre-wrap;
        word-break: break-word;
      }
    `,
  ],
})
export class VistaPreviaNubeComponent implements OnChanges, OnDestroy {
  private readonly service = inject(NubeService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() visible = false;
  @Input() archivo: NubeArchivo | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() descargar = new EventEmitter<NubeArchivo>();

  tipo: TipoVista = null;
  url: SafeResourceUrl | null = null;
  texto = '';
  cargando = false;
  private blobUrl: string | null = null;

  async ngOnChanges(): Promise<void> {
    if (!this.visible || !this.archivo) return;
    this.liberar();
    this.tipo = tipoVista(this.archivo);
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const blob = await lastValueFrom(this.service.descargar(this.archivo.id, true));
      if (this.tipo === 'texto') {
        const t = await blob.text();
        this.texto = t.length > MAX_TEXTO ? t.slice(0, MAX_TEXTO) + '\n…(descárgalo para verlo completo)' : t;
      } else {
        // El tipo lo fija el front según la extensión validada, no lo que diga el blob.
        const tipado = new Blob([blob], { type: this.tipo === 'pdf' ? 'application/pdf' : this.archivo.mime });
        this.blobUrl = URL.createObjectURL(tipado);
        this.url = this.sanitizer.bypassSecurityTrustResourceUrl(this.blobUrl);
      }
    } catch {
      this.alCambiarVisible(false);
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  alCambiarVisible(v: boolean): void {
    this.visible = v;
    if (!v) this.liberar();
    this.visibleChange.emit(v);
  }

  ngOnDestroy(): void {
    this.liberar();
  }

  private liberar(): void {
    if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
    this.blobUrl = null;
    this.url = null;
    this.texto = '';
  }
}
