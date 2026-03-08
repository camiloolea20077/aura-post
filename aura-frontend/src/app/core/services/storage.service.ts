import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly api = `${environment.apiUrl}storage/upload`;

  constructor(private readonly http: HttpClient) {}

  uploadImagen(file: File, carpeta = 'general'): Observable<{ url: string }> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('carpeta', carpeta);
    return this.http.post<{ url: string }>(this.api, fd);
  }
}
