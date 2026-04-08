import { Injectable } from '@angular/core';

export interface GpsLocation {
  latitud: number;
  longitud: number;
}

@Injectable({ providedIn: 'root' })
export class GpsService {
  async getCurrentPosition(): Promise<GpsLocation | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitud: position.coords.latitude,
            longitud: position.coords.longitude,
          });
        },
        () => {
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    });
  }
}