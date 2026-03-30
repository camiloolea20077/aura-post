import {
  Component,
  Input,
  Output,
  EventEmitter,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import maplibregl from 'maplibre-gl';

export interface MapCoordinates {
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-map-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="map-wrapper">
      <div class="map-container" #mapContainer></div>
      <div class="map-hint">
        Haz clic en el mapa para seleccionar una ubicación
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .map-wrapper {
      position: relative;
    }
    .map-container {
      width: 100%;
      height: 300px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--aura-border);
    }
    .map-hint {
      position: absolute;
      bottom: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      z-index: 10;
      pointer-events: none;
    }
  `],
})
export class MapPickerComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  @Input() lat: number | null = null;
  @Input() lng: number | null = null;
  @Input() zoom = 13;
  @Input() markerColor = '#ef4444';

  @Output() coordinatesChange = new EventEmitter<MapCoordinates>();

  private map: maplibregl.Map | null = null;
  private marker: maplibregl.Marker | null = null;
  private mapReady = false;

  private readonly defaultLat = 4.711;
  private readonly defaultLng = -74.0721;

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.mapReady && (changes['lat'] || changes['lng'])) {
      this.updateMapPosition();
    }
  }

  ngOnDestroy(): void {
    this.marker?.remove();
    this.map?.remove();
  }

  private initMap(): void {
    const centerLat = this.lat ?? this.defaultLat;
    const centerLng = this.lng ?? this.defaultLng;

    this.map = new maplibregl.Map({
      container: this.mapContainer.nativeElement,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [centerLng, centerLat],
      zoom: this.zoom,
    });

    this.map.addControl(new maplibregl.NavigationControl(), 'top-right');

    this.map.on('load', () => {
      this.mapReady = true;
      if (this.lat && this.lng) {
        this.setMarker(this.lat, this.lng);
      }
    });

    this.map.on('click', (e) => {
      this.setMarker(e.lngLat.lat, e.lngLat.lng);
      this.coordinatesChange.emit({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });
  }

  private updateMapPosition(): void {
    if (!this.map || !this.mapReady) return;

    if (this.lat && this.lng) {
      this.map.flyTo({ center: [this.lng, this.lat], zoom: this.zoom });
      this.setMarker(this.lat, this.lng);
    } else {
      this.marker?.remove();
      this.marker = null;
    }
  }

  private setMarker(lat: number, lng: number): void {
    this.marker?.remove();
    this.marker = new maplibregl.Marker({ color: this.markerColor })
      .setLngLat([lng, lat])
      .addTo(this.map!);
    this.cdr.markForCheck();
  }
}
