import type { Map } from 'mapbox-gl';

declare global {
  interface Window {
    map?: Map;
  }
}

export {};
