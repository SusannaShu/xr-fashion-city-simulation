import React, { useState, useCallback, useEffect, useRef } from 'react';
import { debounce } from 'lodash';
import mapboxgl from 'mapbox-gl';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import styles from './LocationPicker.module.css';

interface LocationPickerProps {
  onLocationSelect: (location: { lng: number; lat: number }) => void;
  geolocateControl: mapboxgl.GeolocateControl | null;
  map: mapboxgl.Map | null;
}

interface SearchResult {
  place_name: string;
  center: [number, number];
  place_type: string[];
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  geolocateControl,
  map,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const geolocateContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (geolocateControl && map && geolocateContainerRef.current) {
      // Add the control to our custom container
      geolocateContainerRef.current.appendChild(geolocateControl.onAdd(map));

      // Trigger geolocation when control is ready
      geolocateControl.trigger();
    }
  }, [geolocateControl, map]);

  const searchLocations = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query
          )}.json?access_token=${
            import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
          }&types=place,address&limit=5`
        );
        const data = await response.json();
        setSearchResults(data.features);
      } catch (error) {
        console.error('Error searching locations:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    void searchLocations(query);
  };

  const handleResultClick = (result: SearchResult) => {
    onLocationSelect({
      lng: result.center[0],
      lat: result.center[1],
    });
    setSearchQuery(result.place_name);
    setSearchResults([]);
  };

  return (
    <div className={styles.container}>
      <div className={styles.searchBox}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search location..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
        <div
          className={styles.geolocateContainer}
          ref={geolocateContainerRef}
        />
        {isSearching && (
          <div className={styles.searchingIndicator}>
            <LoadingSpinner size="small" theme="light" />
          </div>
        )}
      </div>
      {searchResults.length > 0 && (
        <div className={styles.searchResults}>
          {searchResults.map((result, index) => (
            <button
              key={index}
              className={styles.searchResult}
              onClick={() => handleResultClick(result)}
            >
              <span className={styles.placeName}>{result.place_name}</span>
              <span className={styles.placeType}>
                {result.place_type.join(', ')}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
