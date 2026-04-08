import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Subject } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  takeUntil,
} from 'rxjs/operators';
import * as L from 'leaflet';

export interface AddressResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

export interface SelectedLocation {
  lat: number;
  lng: number;
  displayName: string;
  address: AddressResult['address'];
}

@Component({
  selector: 'app-address-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './address-search.component.html',
  styleUrl: './address-search.component.css',
})
export class AddressSearchComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  @ViewChild('searchInput') searchInput!: ElementRef;

  searchQuery = '';
  suggestions: AddressResult[] = [];
  selectedLocation: SelectedLocation | null = null;
  isLoading = false;
  showSuggestions = false;
  highlightedIndex = -1;
  copied = false;

  private map!: L.Map;
  private marker!: L.Marker;
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    // Debounce the search input
    this.searchSubject
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((query) => {
          if (query.length < 3) {
            this.suggestions = [];
            this.isLoading = false;
            return [];
          }
          this.isLoading = true;
          return this.http.get<AddressResult[]>(
            'https://nominatim.openstreetmap.org/search',
            {
              params: {
                q: `${query}, Medellín, Colombia`,
                format: 'json',
                addressdetails: '1',
                limit: '7',
                countrycodes: 'co', // Colombia — elimina esta línea para búsqueda global
                'accept-language': 'es',
              },
              headers: {
                'Accept-Language': 'es',
              },
            },
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (results) => {
          this.ngZone.run(() => {
            this.suggestions = results as AddressResult[];
            this.isLoading = false;
            this.highlightedIndex = -1;
          });
        },
        error: () => {
          this.ngZone.run(() => {
            this.isLoading = false;
            this.suggestions = [];
          });
        },
      });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.map) this.map.remove();
  }

  private initMap(): void {
    // Default center: Colombia
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [4.7109886, -74.072092],
      zoom: 6,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '',
    }).addTo(this.map);

    // Custom marker icon (avoids broken default Leaflet icon in Angular)
    const icon = L.divIcon({
      className: '',
      html: `
        <div style="
          width: 32px; height: 40px;
          display: flex; align-items: center; justify-content: center;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25));
        ">
          <svg viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C9.37 0 4 5.37 4 12c0 9 12 28 12 28s12-19 12-28c0-6.63-5.37-12-12-12z" fill="#1a7a5e"/>
            <circle cx="16" cy="12" r="5" fill="white"/>
          </svg>
        </div>
      `,
      iconSize: [32, 40],
      iconAnchor: [16, 40],
    });

    this.marker = L.marker([4.7109886, -74.072092], { icon, draggable: false });
  }

  onQueryChange(value: string): void {
    this.searchQuery = value;
    this.showSuggestions = true;
    this.searchSubject.next(value);
  }

  onFocus(): void {
    if (this.suggestions.length > 0) {
      this.showSuggestions = true;
    }
  }

  onBlur(): void {
    // Small delay so click on suggestion registers first
    setTimeout(() => {
      this.showSuggestions = false;
    }, 150);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (!this.showSuggestions || this.suggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.highlightedIndex = Math.min(
        this.highlightedIndex + 1,
        this.suggestions.length - 1,
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0);
    } else if (event.key === 'Enter' && this.highlightedIndex >= 0) {
      event.preventDefault();
      this.selectSuggestion(this.suggestions[this.highlightedIndex]);
    } else if (event.key === 'Escape') {
      this.showSuggestions = false;
    }
  }

  selectSuggestion(item: AddressResult): void {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);

    this.searchQuery = this.getMainName(item);
    this.showSuggestions = false;
    this.suggestions = [];

    this.selectedLocation = {
      lat,
      lng,
      displayName: item.display_name,
      address: item.address,
    };

    // Move map and marker
    this.map.setView([lat, lng], 15, { animate: true });

    if (this.map.hasLayer(this.marker)) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker.addTo(this.map);
      this.marker.setLatLng([lat, lng]);
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.suggestions = [];
    this.showSuggestions = false;
    this.selectedLocation = null;
    if (this.map.hasLayer(this.marker)) {
      this.map.removeLayer(this.marker);
    }
  }

  getMainName(item: AddressResult): string {
    const parts = item.display_name.split(',');
    return parts[0].trim();
  }

  getSubName(item: AddressResult): string {
    const parts = item.display_name.split(',');
    return parts
      .slice(1, 3)
      .map((p) => p.trim())
      .join(', ');
  }

  copyCoords(): void {
    if (!this.selectedLocation) return;
    const text = `${this.selectedLocation.lat.toFixed(6)}, ${this.selectedLocation.lng.toFixed(6)}`;
    navigator.clipboard.writeText(text).then(() => {
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    });
  }
}
