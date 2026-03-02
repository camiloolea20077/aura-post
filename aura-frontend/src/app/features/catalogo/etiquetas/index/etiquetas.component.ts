import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import { ProductoSinCodigo } from '../../../../core/models/etiquetas.model';
import { ProductoService } from '../../../../core/services/producto.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { filterTable } from '../../../../shared/utils/filter-post.model';

@Component({
  selector: 'app-etiquetas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
    ToastModule,
    TooltipModule,
    TagModule,
    ProgressSpinnerModule,
  ],
  providers: [MessageService],
  templateUrl: './etiquetas.component.html',
  styleUrls: ['./etiquetas.component.scss'],
})
export class EtiquetasComponent implements OnInit {
  public productos: ProductoSinCodigo[] = [];
  public isLoading = false;
  public busqueda = '';

  public get productosFiltrados(): ProductoSinCodigo[] {
    return filterTable(this.productos, this.busqueda, 0, 20);
  }

  public get seleccionados(): ProductoSinCodigo[] {
    return this.productos.filter((p) => p.seleccionado);
  }

  public get totalEtiquetas(): number {
    return this.seleccionados.reduce((a, p) => a + (p.copias || 1), 0);
  }

  public get todosSeleccionados(): boolean {
    return (
      this.productosFiltrados.length > 0 &&
      this.productosFiltrados.every((p) => p.seleccionado)
    );
  }

  constructor(
    private readonly productoService: ProductoService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarJsBarcode();
    this.cargarProductos();
  }

  private cargarJsBarcode(): void {
    if ((window as any).JsBarcode) return;
    const script = document.createElement('script');
    script.src =
      'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js';
    document.head.appendChild(script);
  }

  async cargarProductos(): Promise<void> {
    this.isLoading = true;
    try {
      const res = await lastValueFrom(this.productoService.list());
      if (res?.data) {
        this.productos = (res.data as any[])
          .filter((p) => !p.codigoBarras)
          .map((p) => ({
            id: p.id,
            nombre: p.nombre,
            sku: p.sku ?? null,
            precio: p.precio ?? 0,
            categoriaId: p.categoriaId ?? null,
            categoriaNombre: p.categoriaNombre ?? null,
            codigoBarras: null,
            seleccionado: false,
            copias: 1,
            codigoGenerado: null,
            generando: false,
            guardado: false,
          }));
      }
    } catch {
      this.alertService.showError(
        'Error',
        'No se pudieron cargar los productos.',
      );
    } finally {
      this.isLoading = false;
    }
  }

  toggleTodos(): void {
    const nuevoEstado = !this.todosSeleccionados;
    this.productosFiltrados.forEach((p) => (p.seleccionado = nuevoEstado));
  }

  generarCodigoEan13(id: number): string {
    const base = `200${String(id).padStart(9, '0')}`;
    let suma = 0;
    for (let i = 0; i < 12; i++) {
      suma += parseInt(base[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const control = (10 - (suma % 10)) % 10;
    return base + control;
  }

  async generarCodigo(p: ProductoSinCodigo): Promise<void> {
    p.generando = true;
    try {
      const codigo = this.generarCodigoEan13(p.id);
      await lastValueFrom(
        this.productoService.actualizarCodigoBarras(p.id, {
          codigoBarras: codigo,
        }),
      );
      p.codigoGenerado = codigo;
      p.codigoBarras = codigo;
      p.guardado = true;
      this.alertService.showSuccess(
        'Código generado',
        `${p.nombre} → ${codigo}`,
      );
      setTimeout(() => {
        this.productos = this.productos.filter((x) => x.id !== p.id);
      }, 1500);
    } catch {
      this.alertService.showError('Error', 'No se pudo guardar el código.');
    } finally {
      p.generando = false;
      this.cdr.detectChanges();
    }
  }

  async generarTodosSeleccionados(): Promise<void> {
    const pendientes = this.seleccionados.filter((p) => !p.guardado);
    if (!pendientes.length) return;
    for (const p of pendientes) {
      await this.generarCodigo(p);
    }
  }

  async imprimirSeleccionados(): Promise<void> {
    const paraPrint = this.seleccionados.filter(
      (p) => p.guardado || p.codigoGenerado,
    );
    if (!paraPrint.length) {
      this.alertService.showWarn(
        'Sin etiquetas',
        'Genera primero los códigos de los productos seleccionados.',
      );
      return;
    }

    await this.cargarJsBarcodePromise();

    // Expandir copias correctamente
    const lista: { nombre: string; codigo: string }[] = [];
    for (const p of paraPrint) {
      const copias = Math.max(1, Math.floor(Number(p.copias) || 1));
      for (let i = 0; i < copias; i++) {
        lista.push({
          nombre: this.truncarNombre(p.nombre),
          codigo: p.codigoGenerado ?? p.codigoBarras ?? '',
        });
      }
    }

    // ── Dimensiones a 300 DPI para alta calidad ─────────────────────────
    // Etiqueta física: 1.25" × 0.98"
    // Papel total (3 cols): 4.09" × 0.98"
    //
    // A 300 DPI:
    //   ETQ_W  = 1.25  × 300 = 375px
    //   ETQ_H  = 0.98  × 300 = 294px
    //   GAP    = 0.12  × 300 = 36px
    //   MARG   = 0.05  × 300 = 15px
    //   FILA_W = 15 + 375×3 + 36×2 + 15 = 1227px  (= 4.09" × 300)
    //
    // Al imprimir la imagen indicamos que tiene 300 DPI vía CSS:
    //   image-resolution o width fijado en pulgadas → el browser/driver
    //   sabe que 1227px = 4.09" y NO reescala el papel.

    const DPI = 300;
    const ETQ_W = Math.round(1.25 * DPI); // 375
    const ETQ_H = Math.round(0.98 * DPI); // 294
    const GAP = Math.round(0.12 * DPI); // 36
    const MARG = Math.round(0.05 * DPI); // 15
    const COLS = 3;
    const FILA_W = MARG + ETQ_W * COLS + GAP * (COLS - 1) + MARG; // 1227

    // Agrupar en filas de 3
    const filas: { nombre: string; codigo: string }[][] = [];
    for (let i = 0; i < lista.length; i += COLS) {
      filas.push(lista.slice(i, i + COLS));
    }

    const canvas = document.createElement('canvas');
    canvas.width = FILA_W;
    canvas.height = ETQ_H * filas.length;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let fi = 0; fi < filas.length; fi++) {
      const fila = filas[fi];
      const filaY = fi * ETQ_H;

      // Línea separadora entre filas
      if (fi > 0) {
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, filaY);
        ctx.lineTo(FILA_W, filaY);
        ctx.stroke();
      }

      for (let col = 0; col < fila.length; col++) {
        const etq = fila[col];
        const etqX = MARG + col * (ETQ_W + GAP);

        // Línea separadora entre columnas
        if (col > 0) {
          ctx.strokeStyle = '#cccccc';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(etqX - GAP / 2, filaY);
          ctx.lineTo(etqX - GAP / 2, filaY + ETQ_H);
          ctx.stroke();
        }

        // ── Nombre ────────────────────────────────────────────────
        ctx.fillStyle = '#000000';
        ctx.font = `bold ${Math.round(18 * (DPI / 96))}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(
          etq.nombre,
          etqX + ETQ_W / 2,
          filaY + Math.round(10 * (DPI / 96)),
          ETQ_W - Math.round(10 * (DPI / 96)),
        );

        // ── Barcode en canvas temporal ────────────────────────────
        try {
          const bcCanvas = document.createElement('canvas');
          (window as any).JsBarcode(bcCanvas, etq.codigo, {
            format: 'EAN13',
            width: 3, // px por barra — grueso para 300 DPI
            height: Math.round(100 * (DPI / 96)), // ~312px de alto neto
            displayValue: false,
            margin: 0,
            background: '#ffffff',
            lineColor: '#000000',
          });

          const bW = ETQ_W - Math.round(20 * (DPI / 96));
          const bH = Math.round(130 * (DPI / 96));
          const bX = etqX + Math.round(10 * (DPI / 96));
          const bY = filaY + Math.round(38 * (DPI / 96));
          ctx.drawImage(bcCanvas, bX, bY, bW, bH);
        } catch (e) {
          console.error('Barcode error:', etq.codigo, e);
          ctx.fillStyle = '#ff0000';
          ctx.font = `${Math.round(14 * (DPI / 96))}px Arial`;
          ctx.fillText('ERROR', etqX + ETQ_W / 2, filaY + ETQ_H / 2);
        }

        // ── Texto código ──────────────────────────────────────────
        ctx.fillStyle = '#000000';
        ctx.font = `${Math.round(14 * (DPI / 96))}px "Courier New"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(
          etq.codigo,
          etqX + ETQ_W / 2,
          filaY + ETQ_H - Math.round(10 * (DPI / 96)),
        );
      }
    }

    // ── Abrir ventana de impresión con tamaño de papel fijo ──────────────
    // La imagen se muestra con width/height en pulgadas exactas usando CSS.
    // Así el driver de la JALTECH recibe exactamente 4.09" × (0.98" × filas)
    // sin importar la resolución de pantalla.
    const dataUrl = canvas.toDataURL('image/png');
    const filaHeightIn = (ETQ_H / DPI).toFixed(4); // 0.98"
    const totalHeightIn = ((ETQ_H * filas.length) / DPI).toFixed(4);
    const filaWidthIn = (FILA_W / DPI).toFixed(4); // 4.09"

    const ventana = window.open('', '_blank', 'width=900,height=400');
    if (!ventana) return;

    ventana.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Etiquetas</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      /* Tamaño exacto del papel configurado en el driver JALTECH */
      size: ${filaWidthIn}in ${totalHeightIn}in;
      margin: 0;
    }

    html, body {
      width:  ${filaWidthIn}in;
      height: ${totalHeightIn}in;
      overflow: hidden;
      background: #fff;
    }

    img {
      /* Forzar que la imagen ocupe exactamente el tamaño físico real.
         Al fijar width/height en pulgadas + DPI correcto, el driver
         no reescala ni cambia el tamaño del papel. */
      display: block;
      width:  ${filaWidthIn}in;
      height: ${totalHeightIn}in;
      image-rendering: crisp-edges;
    }
  </style>
</head>
<body>
  <img src="${dataUrl}" />
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 300);
    };
  </script>
</body>
</html>`);
    ventana.document.close();
  }

  private cargarJsBarcodePromise(): Promise<void> {
    return new Promise((resolve) => {
      if ((window as any).JsBarcode) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src =
        'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }

  private truncarNombre(nombre: string, max = 35): string {
    return nombre.length > max ? nombre.substring(0, max) + '…' : nombre;
  }
}
