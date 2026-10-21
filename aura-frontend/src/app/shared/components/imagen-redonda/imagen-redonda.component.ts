import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Imagen redonda (foto o firma) con botones para elegir y quitar el archivo.
 * No sube nada: avisa el archivo elegido y quien lo usa decide cuándo subirlo
 * (p. ej. después de crear el registro).
 */
@Component({
  selector: 'app-imagen-redonda',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './imagen-redonda.component.html',
  styleUrls: ['./imagen-redonda.component.scss'],
})
export class ImagenRedondaComponent {
  @Input() titulo = '';
  /** URL a mostrar (guardada o vista previa local). */
  @Input() url: string | null = null;
  /** Ícono cuando no hay imagen. */
  @Input() icono = 'pi pi-user';
  @Input() disabled = false;

  @Output() elegido = new EventEmitter<File>();
  @Output() quitado = new EventEmitter<void>();

  onArchivo(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (archivo) this.elegido.emit(archivo);
  }
}
