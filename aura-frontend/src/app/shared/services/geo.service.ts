import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GeoApiCity, GeoApiResponse, GeoApiState } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class GeoService {
  private readonly geoBase = 'https://geo-api.cloudtecnology.cloud';

  constructor(private readonly http: HttpClient) {}

  getDepartamentos(
    countryCode: string = 'CO',
    page: number = 1,
    limit: number = 300,
  ): Observable<GeoApiResponse<GeoApiState>> {
    return this.http.get<GeoApiResponse<GeoApiState>>(
      `${this.geoBase}/countries/${countryCode}/states?page=${page}&limit=${limit}`,
    );
  }

  getCiudades(
    stateId: number,
    page: number = 1,
    limit: number = 300,
  ): Observable<GeoApiResponse<GeoApiCity>> {
    return this.http.get<GeoApiResponse<GeoApiCity>>(
      `${this.geoBase}/states/${stateId}/cities?page=${page}&limit=${limit}`,
    );
  }
}
