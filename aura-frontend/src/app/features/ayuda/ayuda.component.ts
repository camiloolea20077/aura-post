import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { ManualError, ManualModulo } from './manual/manual.model';
import {
  buscarEnManual,
  MANUAL,
  MANUAL_POR_GRUPO,
  moduloPorRuta,
  ResultadoBusqueda,
} from './manual/manual';
import { ManualPdfService } from './services/manual-pdf.service';

/**
 * Centro de ayuda: el manual de cada módulo con sus errores frecuentes. Se abre
 * desde el botón (?) de la barra superior en el tema de la pantalla donde está
 * el usuario, y se puede descargar en PDF por tema o completo.
 */
@Component({
  selector: 'app-ayuda',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule],
  templateUrl: './ayuda.component.html',
  styleUrls: ['./ayuda.component.scss'],
})
export class AyudaComponent implements OnInit {
  @ViewChild('contenido') contenido?: ElementRef<HTMLElement>;

  readonly grupos = MANUAL_POR_GRUPO;
  modulo: ManualModulo = MANUAL[0];
  consulta = '';
  resultados: ResultadoBusqueda[] = [];
  /** Error que se abrió desde la búsqueda: se resalta y se lleva a la vista. */
  resaltado: ManualError | null = null;
  /** En pantallas angostas el índice se despliega con un botón. */
  indiceAbierto = false;
  generandoPdf = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly pdf: ManualPdfService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    const porId = MANUAL.find((m) => m.id === q.get('tema'));
    this.modulo = porId ?? moduloPorRuta(q.get('desde')) ?? MANUAL[0];
  }

  get posicion(): number {
    return MANUAL.indexOf(this.modulo);
  }

  get anterior(): ManualModulo | null {
    return MANUAL[this.posicion - 1] ?? null;
  }

  get siguiente(): ManualModulo | null {
    return MANUAL[this.posicion + 1] ?? null;
  }

  elegir(m: ManualModulo, error: ManualError | null = null): void {
    this.modulo = m;
    this.resaltado = error;
    this.consulta = '';
    this.resultados = [];
    this.indiceAbierto = false;
    // El enlace queda compartible: /ayuda?tema=compras
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tema: m.id },
      replaceUrl: true,
    });
    this.cdr.markForCheck();
    setTimeout(() => this.llevarAVista(), 0);
  }

  buscar(): void {
    this.resultados = buscarEnManual(this.consulta);
    this.cdr.markForCheck();
  }

  limpiarBusqueda(): void {
    this.consulta = '';
    this.resultados = [];
    this.cdr.markForCheck();
  }

  descargarTema(): void {
    this.conPdf(() => this.pdf.descargarModulo(this.modulo));
  }

  descargarTodo(): void {
    this.conPdf(() => this.pdf.descargarCompleto());
  }

  /** pdfmake arma el documento en el mismo hilo: se deja pintar el "generando" antes. */
  private conPdf(accion: () => void): void {
    this.generandoPdf = true;
    this.cdr.markForCheck();
    setTimeout(() => {
      try {
        accion();
      } finally {
        this.generandoPdf = false;
        this.cdr.markForCheck();
      }
    }, 30);
  }

  private llevarAVista(): void {
    const destino = this.resaltado
      ? document.getElementById('ay-error-resaltado')
      : this.contenido?.nativeElement;
    destino?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
