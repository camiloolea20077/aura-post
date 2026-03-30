export interface GeoApiResponse<T> {
  data: T[];
  limit: number;
  page: number;
  total: number;
}

export interface GeoApiState {
  id: number;
  name: string;
  state_code: string;
  country_id: number;
  country_code: string;
  latitude: string;
  longitude: string;
}

export interface GeoCityMetadata {
  dane_code: string;
  dane_name_oficial: string;
  dept_code: string;
  dept_name: string;
}

export interface GeoApiCity {
  id: number;
  name: string;
  state_id: number;
  state_code: string;
  country_id: number;
  country_code: string;
  latitude: string;
  longitude: string;
  metadata?: GeoCityMetadata;
}
