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
import { SplitButtonModule } from 'primeng/splitbutton';
import { DialogModule } from 'primeng/dialog';
import { SliderModule } from 'primeng/slider';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MessageService, MenuItem } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import { ProductoSinCodigo } from '../../../../core/models/etiquetas.model';
import { ProductoService } from '../../../../core/services/producto.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { filterTable } from '../../../../shared/utils/filter-post.model';

const STORAGE_KEY = 'aura_pos_print_settings';

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
    SplitButtonModule,
    DialogModule,
    SliderModule,
    ToggleButtonModule,
    SelectButtonModule,
  ],
  providers: [MessageService],
  templateUrl: './etiquetas.component.html',
  styleUrls: ['./etiquetas.component.scss'],
})
export class EtiquetasComponent implements OnInit {
  public productos: ProductoSinCodigo[] = [];
  public isLoading = false;
  public busqueda = '';
  public showSettings = false;
  public settings = {
    columnas: 1,
    fontSizeTitulo: 14,
    fontSizeCodigo: 12,
    mostrarPrecio: true,
    mostrarNombre: true,
    maxCaracteresNombre: 50,
    espaciado: 10,
    anchoEtiqueta: 100, // porcentaje
    marginVertical: 5,
    marginHorizontal: 5,
    saltarEtiquetas: 0,
    alinearFinal: true,
    ahorrarPapel: false,
  };

  public opcionesColumnas = [
    { label: '1 Col', value: 1 },
    { label: '2 Col', value: 2 },
    { label: '3 Col', value: 3 },
    { label: '4 Col', value: 4 },
  ];

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
    this.cargarSettings();
    this.cargarJsBarcode();
    this.cargarProductos();
  }

  private cargarSettings(): void {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Error al cargar settings:', e);
      }
    }
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
      // setTimeout(() => {
      //   this.productos = this.productos.filter((x) => x.id !== p.id);
      // }, 1500);
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

  abrirConfiguracion(): void {
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
    this.showSettings = true;
  }

  imprimir(): void {
    this.showSettings = false;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    this.imprimirOpPersonalizada();
  }

  async imprimirOpPersonalizada(): Promise<void> {
    const paraPrint = this.seleccionados.filter(
      (p) => p.guardado || p.codigoGenerado,
    );

    await this.cargarJsBarcodePromise();
    const settings = this.settings;
    const lista: {
      nombre: string;
      codigo: string;
      precio: number;
      isPlaceholder?: boolean;
    }[] = [];

    // Agregar espacios vacíos si se solicita
    if (settings.saltarEtiquetas > 0) {
      for (let i = 0; i < settings.saltarEtiquetas; i++) {
        lista.push({ nombre: '', codigo: '', precio: 0, isPlaceholder: true });
      }
    }

    for (const p of paraPrint) {
      const copias = Math.max(1, Math.floor(Number(p.copias) || 1));
      for (let i = 0; i < copias; i++) {
        lista.push({
          nombre: this.truncarNombre(
            p.nombre,
            this.settings.maxCaracteresNombre,
          ),
          codigo: p.codigoGenerado ?? p.codigoBarras ?? '',
          precio: p.precio,
        });
      }
    }

    const ventana = window.open('', '_blank', 'width=800,height=600');
    if (!ventana) return;

    const gridTemplateCols = `repeat(${this.settings.columnas}, 1fr)`;

    ventana.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Imprimir Etiquetas Personalizadas</title>
  <style>
    @page { margin: 0; size: auto; }
    body { margin: 0; font-family: Arial, sans-serif; background: #eee; padding: 20px; }
    
    .grid-container {
      display: grid;
      grid-template-columns: ${gridTemplateCols};
      gap: ${this.settings.espaciado}px;
      width: 100%;
      max-width: 1000px;
      margin: 0 auto;
      background: #fff;
      padding: ${this.settings.marginVertical}px ${this.settings.marginHorizontal}px;
      box-sizing: border-box;
      ${
        this.settings.ahorrarPapel
          ? 'min-height: auto;'
          : this.settings.alinearFinal
          ? 'align-content: end; min-height: 97vh;'
          : ''
      }
    }

    .label {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 1px solid #eee;
      padding: 10px;
      box-sizing: border-box;
      text-align: center;
      overflow: hidden;
    }

    .nombre {
      font-size: ${this.settings.fontSizeTitulo}px;
      font-weight: bold;
      margin-bottom: 5px;
      width: 100%;
      word-wrap: break-word;
    }

    .barcode-container {
      width: ${this.settings.anchoEtiqueta}%;
      margin: 5px 0;
    }

    .barcode-img {
      width: 100%;
      height: auto;
    }

    .codigo-texto {
      font-size: ${this.settings.fontSizeCodigo}px;
      font-family: "Courier New", Courier, monospace;
      margin-top: 2px;
    }

    .precio {
      font-size: ${this.settings.fontSizeTitulo + 2}px;
      font-weight: 800;
      margin-top: 5px;
      color: #000;
    }

    @media print {
      body { padding: 0; background: #fff; }
      .grid-container { border: none; max-width: none; }
      .label { border: none; page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="grid-container" id="labels"></div>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
  <script>
    const labels = ${JSON.stringify(lista)};
    const settings = ${JSON.stringify(this.settings)};
    const container = document.getElementById('labels');
    
    labels.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'label';
      
      if (item.isPlaceholder) {
        div.style.border = 'none';
        container.appendChild(div);
        return;
      }

      if (settings.mostrarNombre) {
        const nombre = document.createElement('div');
        nombre.className = 'nombre';
        nombre.innerText = item.nombre;
        div.appendChild(nombre);
      }

      if (settings.mostrarPrecio) {
        const precio = document.createElement('div');
        precio.className = 'precio';
        precio.innerText = '$' + new Intl.NumberFormat('es-CO').format(item.precio);
        div.appendChild(precio);
      }
      
      const bcContainer = document.createElement('div');
      bcContainer.className = 'barcode-container';
      const canvas = document.createElement('canvas');
      canvas.id = 'bc-' + index;
      canvas.className = 'barcode-img';
      bcContainer.appendChild(canvas);
      div.appendChild(bcContainer);
      
      const codigo = document.createElement('div');
      codigo.className = 'codigo-texto';
      codigo.innerText = item.codigo;
      div.appendChild(codigo);

      container.appendChild(div);
      
      try {
        JsBarcode('#bc-' + index, item.codigo, {
          format: 'EAN13',
          width: 2,
          height: 50,
          displayValue: false,
          margin: 0
        });
      } catch(e) {
        console.error(e);
      }
    });

    window.onload = function() {
      if (settings.ahorrarPapel) {
        const height = container.offsetHeight;
        const style = document.createElement('style');
        style.innerHTML = '@page { size: auto ' + height + 'px; margin: 0; }';
        document.head.appendChild(style);
      }
      
      setTimeout(() => {
        window.print();
      }, 500);
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
