import { ModelMetadataService } from '../firebase/metadata';
import type { ModelMetadata } from '../firebase/metadata';

// Extend DeviceOrientationEvent for iOS
interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  requestPermission?: () => Promise<'granted' | 'denied' | 'default'>;
}

interface DeviceOrientationEventConstructor {
  new (
    type: string,
    eventInitDict?: DeviceOrientationEventInit
  ): DeviceOrientationEvent;
  prototype: DeviceOrientationEvent;
  requestPermission?: () => Promise<'granted' | 'denied' | 'default'>;
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
}

export interface SpatialAnchor {
  id: string;
  location: Location;
  orientation: {
    alpha: number; // Device orientation around z-axis
    beta: number; // Device orientation around x-axis
    gamma: number; // Device orientation around y-axis
  };
  timestamp: number;
}

export class LocationService {
  private static instance: LocationService;
  private watchId: number | null = null;
  private currentLocation: Location | null = null;
  private anchors: Map<string, SpatialAnchor> = new Map();
  private locationUpdateCallbacks: Set<(location: Location) => void> =
    new Set();
  private orientationUpdateCallbacks: Set<
    (orientation: DeviceOrientationEvent) => void
  > = new Set();

  private constructor() {
    // Initialize device orientation event listener
    if (typeof window !== 'undefined') {
      window.addEventListener(
        'deviceorientation',
        this.handleOrientation.bind(this)
      );
    }
  }

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      // Request geolocation permission
      const geoPermission = await this.requestGeolocationPermission();

      // Request device orientation permission (iOS 13+)
      const orientationPermission = await this.requestOrientationPermission();

      return geoPermission && orientationPermission;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  private async requestGeolocationPermission(): Promise<boolean> {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state === 'granted';
    } catch (error) {
      console.error('Error requesting geolocation permission:', error);
      return false;
    }
  }

  private async requestOrientationPermission(): Promise<boolean> {
    // Check if we need to request permission (iOS 13+)
    const DeviceOrientationEvent =
      window.DeviceOrientationEvent as DeviceOrientationEventConstructor;

    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        return permission === 'granted';
      } catch (error) {
        console.error('Error requesting device orientation permission:', error);
        return false;
      }
    }
    // No permission needed for other platforms
    return true;
  }

  startTracking(): void {
    if (!this.watchId) {
      this.watchId = navigator.geolocation.watchPosition(
        this.handleLocationUpdate.bind(this),
        this.handleLocationError.bind(this),
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 5000,
        }
      );
    }
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  getCurrentLocation(): Location | null {
    return this.currentLocation;
  }

  onLocationUpdate(callback: (location: Location) => void): () => void {
    this.locationUpdateCallbacks.add(callback);
    return () => this.locationUpdateCallbacks.delete(callback);
  }

  onOrientationUpdate(
    callback: (orientation: DeviceOrientationEvent) => void
  ): () => void {
    this.orientationUpdateCallbacks.add(callback);
    return () => this.orientationUpdateCallbacks.delete(callback);
  }

  async createSpatialAnchor(modelId: string): Promise<SpatialAnchor | null> {
    if (!this.currentLocation) {
      throw new Error('Current location not available');
    }

    // Get device orientation
    const orientation = await this.getCurrentOrientation();
    if (!orientation) {
      throw new Error('Device orientation not available');
    }

    const anchor: SpatialAnchor = {
      id: modelId,
      location: { ...this.currentLocation },
      orientation: {
        alpha: orientation.alpha || 0,
        beta: orientation.beta || 0,
        gamma: orientation.gamma || 0,
      },
      timestamp: Date.now(),
    };

    this.anchors.set(modelId, anchor);

    // Update model metadata with location
    await ModelMetadataService.updateMetadata(modelId, {
      location: {
        latitude: anchor.location.latitude,
        longitude: anchor.location.longitude,
      },
    });

    return anchor;
  }

  async getNearbyModels(radiusKm = 0.1): Promise<ModelMetadata[]> {
    if (!this.currentLocation) {
      throw new Error('Current location not available');
    }

    return ModelMetadataService.findModelsByLocation(
      this.currentLocation.latitude,
      this.currentLocation.longitude,
      radiusKm
    );
  }

  private handleLocationUpdate(position: GeolocationPosition): void {
    this.currentLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude ?? undefined,
      altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
      heading: position.coords.heading ?? undefined,
      speed: position.coords.speed ?? undefined,
    };

    // Notify subscribers
    this.locationUpdateCallbacks.forEach(callback => {
      callback(this.currentLocation!);
    });
  }

  private handleLocationError(error: GeolocationPositionError): void {
    console.error('Geolocation error:', error.message);
    // You might want to implement retry logic or error handling here
  }

  private handleOrientation(event: DeviceOrientationEvent): void {
    // Notify subscribers
    this.orientationUpdateCallbacks.forEach(callback => {
      callback(event);
    });
  }

  private getCurrentOrientation(): Promise<DeviceOrientationEvent> {
    return new Promise(resolve => {
      const handleOrientation = (event: DeviceOrientationEvent) => {
        window.removeEventListener('deviceorientation', handleOrientation);
        resolve(event);
      };
      window.addEventListener('deviceorientation', handleOrientation, {
        once: true,
      });
    });
  }

  dispose(): void {
    this.stopTracking();
    if (typeof window !== 'undefined') {
      window.removeEventListener(
        'deviceorientation',
        this.handleOrientation.bind(this)
      );
    }
    this.locationUpdateCallbacks.clear();
    this.orientationUpdateCallbacks.clear();
    this.anchors.clear();
  }
}
