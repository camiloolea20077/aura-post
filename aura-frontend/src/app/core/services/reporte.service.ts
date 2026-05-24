import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly api = `${environment.apiUrl}reportes`;

  constructor(private http: HttpClient) {}

  // ── Ventas ────────────────────────────────────────────────
  ventasExcel(
    desde?: string,
    hasta?: string,
    tipo: 'detallado' | 'simple' = 'detallado',
  ): Observable<Blob> {
    return this.http.get(`${this.api}/ventas/excel`, {
      responseType: 'blob',
      params: this.params(desde, hasta, tipo),
    });
  }

  ventasPdf(
    desde?: string,
    hasta?: string,
    tipo: 'detallado' | 'simple' = 'detallado',
  ): Observable<Blob> {
    return this.http.get(`${this.api}/ventas/pdf`, {
      responseType: 'blob',
      params: this.params(desde, hasta, tipo),
    });
  }

  // ── Inventario ────────────────────────────────────────────
  inventarioExcel(): Observable<Blob> {
    return this.http.get(`${this.api}/inventario/excel`, {
      responseType: 'blob',
    });
  }

  inventarioPdf(): Observable<Blob> {
    return this.http.get(`${this.api}/inventario/pdf`, {
      responseType: 'blob',
    });
  }

  // ── Helper: dispara descarga en el browser ────────────────
  descargar(blob: Blob, nombre: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
  }

  visualizarPdf(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  private params(
    desde?: string,
    hasta?: string,
    tipo?: string,
  ): Record<string, string> {
    const p: Record<string, string> = {};
    if (desde) p['desde'] = desde;
    if (hasta) p['hasta'] = hasta;
    if (tipo) p['tipo'] = tipo;
    return p;
  }
}
