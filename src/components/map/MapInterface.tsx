import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ModelMetadataService } from '../../services/firebase/metadata';
import type { ModelMetadata } from '../../services/firebase/metadata';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { toast } from '../shared/ToastContainer';
import { LocationPicker } from './LocationPicker';
import styles from './MapInterface.module.css';

// Initialize Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

interface MapInterfaceProps {
  onMarkerClick?: (modelId: string) => void;
  onMapClick?: (lngLat: { lng: number; lat: number }) => void;
  selectedModelId?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
}

export const MapInterface: React.FC<MapInterfaceProps> = ({
  onMarkerClick,
  onMapClick,
  selectedModelId,
  initialCenter = [2.3364, 48.861], // Louvre Museum coordinates
  initialZoom = 16, // Increased zoom level for better 3D building visibility
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const geolocateControl = useRef<mapboxgl.GeolocateControl | null>(null);
  const markers = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const isInitialized = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const retryDelay = 5000;
  const navigate = useNavigate();

  useEffect(() => {
    if (!mapContainer.current || isInitialized.current) return;

    console.log('Initializing map interface');
    isInitialized.current = true;

    // Initialize map
    mapInstance.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: initialCenter,
      zoom: initialZoom,
      pitch: 60,
      bearing: -30,
      antialias: true,
    });

    const map = mapInstance.current;

    // Enable 3D buildings and apply grayscale style
    map.on('style.load', () => {
      // Add grayscale filter to the map
      const grayscaleFilter = [
        'grayscale',
        0.9, // 90% grayscale
      ];
      map.setFilter('background', grayscaleFilter);

      // Add 3D building layer
      const layers = map.getStyle().layers;
      const labelLayerId = layers.find(
        layer =>
          layer.type === 'symbol' && layer.layout && layer.layout['text-field']
      )?.id;

      map.addLayer(
        {
          id: '3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 15,
          paint: {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'height'],
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'min_height'],
            ],
            'fill-extrusion-opacity': 0.6,
          },
        },
        labelLayerId
      );
    });

    // Add navigation controls to bottom-right
    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    // Initialize geolocation control
    geolocateControl.current = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
      showAccuracyCircle: false,
    });

    // Trigger geolocation on map load
    map.on('load', () => {
      setIsLoading(false);
      void loadNearbyModels();
    });

    map.on('click', e => {
      onMapClick?.({
        lng: e.lngLat.lng,
        lat: e.lngLat.lat,
      });
    });

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      console.log('Cleaning up map interface');
      if (mapInstance.current) {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        markers.current.forEach(marker => marker.remove());
        markers.current.clear();
        mapInstance.current.remove();
        mapInstance.current = null;
        geolocateControl.current = null;
        isInitialized.current = false;
      }
    };
  }, []);

  const handleOnline = () => {
    setIsOffline(false);
    void loadNearbyModels();
    toast.success('Connection restored. Updating map...');
  };

  const handleOffline = () => {
    setIsOffline(true);
    toast.warning('You are offline. Some features may be limited.');
  };

  // Load and display nearby models with retry logic
  const loadNearbyModels = async () => {
    const map = mapInstance.current;
    if (!map) return;

    try {
      const bounds = map.getBounds();
      const center = bounds.getCenter();
      const radius = calculateRadius(bounds);

      const models = await ModelMetadataService.findModelsByLocation(
        center.lat,
        center.lng,
        radius
      );

      setRetryCount(0); // Reset retry count on success
      setIsOffline(false);
      updateMarkers(models);
    } catch (error) {
      console.error('Failed to load nearby models:', error);

      if (
        error instanceof Error &&
        error.message.includes('Could not reach Cloud Firestore backend')
      ) {
        setIsOffline(true);
        if (retryCount < maxRetries) {
          toast.warning(
            `Connection issue. Retrying in ${retryDelay / 1000} seconds...`
          );
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            void loadNearbyModels();
          }, retryDelay);
        } else {
          toast.error(
            'Unable to connect to the server. Please check your internet connection.'
          );
        }
      } else {
        toast.error('Failed to load nearby models');
      }
    }
  };

  // Update markers on the map
  const updateMarkers = (models: ModelMetadata[]) => {
    const map = mapInstance.current;
    if (!map) return;

    // Remove old markers
    markers.current.forEach(marker => marker.remove());
    markers.current.clear();

    // Add new markers
    models.forEach(model => {
      if (!model.location) return;

      const markerElement = document.createElement('div');
      markerElement.className = styles.marker;
      if (model.id === selectedModelId) {
        markerElement.classList.add(styles.selected);
      }

      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([model.location.longitude, model.location.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div class="${styles.popup}">
                <img src="${model.thumbnailUrl}" alt="${model.name}" />
                <h3>${model.name}</h3>
                <p>${model.description || 'No description'}</p>
              </div>
            `)
        )
        .addTo(map);

      marker.getElement().addEventListener('click', () => {
        onMarkerClick?.(model.id);
      });

      markers.current.set(model.id, marker);
    });
  };

  // Update selected marker
  useEffect(() => {
    markers.current.forEach((marker, id) => {
      const element = marker.getElement();
      if (id === selectedModelId) {
        element.classList.add(styles.selected);
      } else {
        element.classList.remove(styles.selected);
      }
    });
  }, [selectedModelId]);

  // Helper function to calculate radius in km from map bounds
  const calculateRadius = (bounds: mapboxgl.LngLatBounds): number => {
    const center = bounds.getCenter();
    const ne = bounds.getNorthEast();

    // Calculate distance from center to corner (rough approximation)
    const R = 6371; // Earth's radius in km
    const lat1 = (center.lat * Math.PI) / 180;
    const lat2 = (ne.lat * Math.PI) / 180;
    const lon1 = (center.lng * Math.PI) / 180;
    const lon2 = (ne.lng * Math.PI) / 180;

    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const handleLocationSelect = (location: { lng: number; lat: number }) => {
    const map = mapInstance.current;
    if (!map) return;

    map.flyTo({
      center: [location.lng, location.lat],
      zoom: 15,
      duration: 1500,
    });

    onMapClick?.(location);
  };

  return (
    <div className={styles.container}>
      <div ref={mapContainer} className={styles.map} />
      <LocationPicker
        onLocationSelect={handleLocationSelect}
        geolocateControl={geolocateControl.current}
        map={mapInstance.current}
      />
      <button className={styles.arButton} onClick={() => navigate('/ar')}>
        Start Air Graffiti
      </button>
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <LoadingSpinner size="large" theme="light" />
        </div>
      )}
      {isOffline && (
        <div className={styles.offlineIndicator}>
          <span className={styles.offlineIcon}>📡</span>
          Offline Mode
        </div>
      )}
    </div>
  );
};

export default MapInterface;
