import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { ARViewer } from './components/ar/ARViewer';
import { DoodleCanvas } from './components/ar/DoodleCanvas';
import { MapInterface } from './components/map/MapInterface';
import { Camera } from 'three';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Main map view */}
          <Route
            path="/"
            element={
              <div className="map-container">
                <MapInterface />
              </div>
            }
          />

          {/* AR Graffiti mode */}
          <Route
            path="/ar"
            element={
              <ARViewer
                onBack={() => (window.location.href = '/')}
                onError={error => {
                  console.error('AR Error:', error);
                }}
              >
                {(camera: Camera) => <DoodleCanvas camera={camera} />}
              </ARViewer>
            }
          />

          {/* Redirect any unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
