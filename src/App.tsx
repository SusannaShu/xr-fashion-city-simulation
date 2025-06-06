import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { ARViewer } from './components/ar/ARViewer';
import { MapInterface } from './components/map/MapInterface';
import { Camera } from 'three';
import './App.css';

// Component to handle redirect from 404.html
const RedirectHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const redirectPath = urlParams.get('redirect');
    
    if (redirectPath) {
      // Clean up the URL and navigate to the intended path
      navigate(redirectPath, { replace: true });
    }
  }, [navigate, location.search]);

  return null;
};

const App: React.FC = () => {
  return (
    <Router basename="/xr-fashion-city-simulation">
      <div className="app-container">
        <RedirectHandler />
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
                onStart={() => console.log('AR Started')}
                onEnd={() => console.log('AR Ended')}
                onError={error => console.error('AR Error:', error)}
                onBack={() => (window.location.href = '/')}
              />
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
