import React, { useState } from 'react';
import { ARViewer } from './components/ar/ARViewer';
import { DoodleCanvas } from './components/ar/DoodleCanvas';
import { MapInterface } from './components/map/MapInterface';
import { Camera } from 'three';
import './App.css';

const App: React.FC = () => {
  const [isARMode, setIsARMode] = useState(false);

  const handleStartAR = () => {
    setIsARMode(true);
  };

  const handleBackToMap = () => {
    setIsARMode(false);
  };

  return (
    <div className="app-container">
      {!isARMode ? (
        <div className="map-container">
          <MapInterface />
          <button className="start-ar-button" onClick={handleStartAR}>
            Start Air Graffiti
          </button>
        </div>
      ) : (
        <ARViewer
          onBack={handleBackToMap}
          onError={error => {
            console.error('AR Error:', error);
            // Optionally show error toast here
          }}
        >
          {(camera: Camera) => <DoodleCanvas camera={camera} />}
        </ARViewer>
      )}
    </div>
  );
};

export default App;
