import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';

/**
 * Aceptación de uso de la nube (docs/PLAN_NUBE_DOCUMENTOS.md §9): la empresa es la
 * responsable de los datos que sube; Aura los guarda cifrados como encargada.
 * Se acepta una vez por empresa y por versión del texto.
 */
@Component({
  selector: 'app-terminos-nube',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonModule, CheckboxModule],
  template: `
    <div class="terminos">
      <span class="terminos__icono"><i class="pi pi-shield"></i></span>
      <h2 class="terminos__titulo">Antes de usar la nube de documentos</h2>
      <ul class="terminos__lista">
        <li>
          <strong>Los documentos son de tu empresa.</strong> Tu empresa es la
          responsable de lo que sube y de tener autorización para guardar los datos
          personales que contengan (Ley 1581 de 2012). Aura actúa como encargada:
          los guarda, no los usa para nada más.
        </li>
        <li>
          <strong>Se guardan cifrados</strong> en servidores de Cloudflare fuera de
          Colombia. Nadie de Aura los abre; solo los ven los usuarios de tu empresa
          con permiso y tu firma contable.
        </li>
        <li>
          <strong>Tu firma contable</strong> ve las carpetas compartidas y puede
          tener carpetas privadas con sus papeles de trabajo. Si deja de atenderte,
          esas carpetas pasan a ser tuyas.
        </li>
        <li>
          Cada archivo pesa máximo <strong>1 MB</strong>. Se permiten PDF, imágenes,
          Excel, Word, CSV, XML y texto; no se permiten ZIP, ejecutables ni archivos
          con macros.
        </li>
        <li>
          Lo que borras va a la papelera y se elimina para siempre a los
          <strong>30 días</strong>. Toda acción queda registrada con usuario, fecha e IP.
        </li>
        <li>
          No subas contraseñas, números completos de tarjetas ni información que no
          necesites guardar.
        </li>
      </ul>

      <ng-container *ngIf="puedeAceptar; else sinPermiso">
        <label class="terminos__check">
          <p-checkbox [(ngModel)]="leido" [binary]="true" inputId="nube-terminos" />
          <span>Leí y acepto en nombre de mi empresa</span>
        </label>
        <button
          pButton
          type="button"
          icon="pi pi-check"
          label="Aceptar y empezar"
          class="btn-aura"
          [disabled]="!leido || aceptando"
          [loading]="aceptando"
          (click)="aceptar.emit()"
        ></button>
      </ng-container>
      <ng-template #sinPermiso>
        <p class="terminos__nota">
          Un usuario con permiso para subir documentos debe aceptar estas condiciones
          primero.
        </p>
      </ng-template>
    </div>
  `,
  styles: [
    `
      .terminos {
        max-width: 46rem;
        margin: 0 auto;
        padding: 2rem 1.5rem;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
      .terminos__icono {
        width: 3rem;
        height: 3rem;
        border-radius: 12px;
        display: grid;
        place-items: center;
        background: rgba(37, 99, 235, 0.1);
        color: var(--aura-blue);
        font-size: 1.4rem;
      }
      .terminos__titulo {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 700;
      }
      .terminos__lista {
        margin: 0;
        padding-left: 1.1rem;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        color: var(--aura-text-muted);
        line-height: 1.5;
      }
      .terminos__check {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        font-weight: 600;
      }
      .terminos__nota {
        margin: 0;
        color: var(--aura-text-muted);
      }
    `,
  ],
})
export class TerminosNubeComponent {
  @Input() puedeAceptar = false;
  @Input() aceptando = false;
  @Output() aceptar = new EventEmitter<void>();

  leido = false;
}
