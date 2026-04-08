import { Injectable } from '@angular/core';
import {
  HttpBackend,
  HttpEvent,
  HttpParams,
  HttpRequest,
  HttpResponse,
  HttpHeaders,
} from '@angular/common/http';
import { filter, map, Observable } from 'rxjs';

export interface GeocodingResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    road?: string;
    house_number?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    municipality?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org';

  constructor(private readonly http: HttpBackend) {}

  searchAddress(
    query: string,
    limit: number = 5,
  ): Observable<GeocodingResult[]> {
    const params = new HttpParams()
      .set('format', 'json')
      .set('q', query)
      .set('limit', limit)
      .set('addressdetails', '1');

    const req = new HttpRequest<GeocodingResult[]>('GET', `${this.baseUrl}/search`, {
      params,
      responseType: 'json',
      headers: new HttpHeaders({
        'User-Agent': 'Aura-POS-Geocoding-Service/1.0',
      }),
    });

    return this.http.handle(req).pipe(
      filter(
        (event: HttpEvent<any>): event is HttpResponse<GeocodingResult[]> =>
          event instanceof HttpResponse,
      ),
      map((res: HttpResponse<GeocodingResult[]>) => res.body || []),
    );
  }

  reverseGeocode(lat: number, lon: number): Observable<GeocodingResult> {
    const params = new HttpParams()
      .set('format', 'json')
      .set('lat', lat.toString())
      .set('lon', lon.toString())
      .set('addressdetails', '1');

    const req = new HttpRequest<any>('GET', `${this.baseUrl}/reverse`, {
      params,
      responseType: 'json',
      headers: new HttpHeaders({
        'User-Agent': 'Aura-POS-Geocoding-Service/1.0',
      }),
    });

    return this.http.handle(req).pipe(
      filter(
        (event: HttpEvent<any>): event is HttpResponse<GeocodingResult> =>
          event instanceof HttpResponse,
      ),
      map((res: HttpResponse<GeocodingResult>) => res.body!),
    );
  }
}
