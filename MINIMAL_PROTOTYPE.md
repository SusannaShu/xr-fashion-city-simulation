# SHEYOU Virtual Space - Minimal Prototype

## Overview

Minimal implementation of SHEYOU Virtual Space platform, focusing on presenting the Susanna Heel as a monumental digital sculpture in a clean web environment.

## Core Features

### Map Interface

- [x] Interactive Mapbox map with 3D buildings and grayscale style
- [x] Distinctive pink marker (30px) for Susanna Heel location
- [x] Marker popup with model information
- [x] "View in AR" button appears only when Susanna Heel marker is selected
- [x] Smooth camera transitions (zoom: 19, pitch: 60)
- [x] Offline mode support with retry mechanism

### AR Viewer

- [x] Full viewport A-Frame scene
- [x] Optimized camera settings (80° FOV)
- [x] Monumental model presentation (scale: 19, depth: -15)
- [x] 40-second rotation animation
- [x] Optimized lighting setup (ambient: 0.7, directional: 0.8, spot: 0.5)
- [x] Mobile-friendly controls

## Technical Implementation

### Map Component

- Light theme Mapbox implementation (light-v11)
- 3D building layer with 60° pitch
- Marker system with hover effects and popups
- Location-based model discovery with radius calculation
- Offline mode with 3 retry attempts
- Geolocation controls with high accuracy

### AR Component

- A-Frame scene setup with logarithmic depth buffer
- Wasd-controls and look-controls
- Model positioning at (0, -1, -15)
- Model scaling at (19, 19, 19)
- Continuous 360° rotation animation
- Progressive loading with error handling

### Model Management

- Firebase-based model metadata service
- Model path: /dist/models/susanna_heel.glb
- Preloaded Susanna model initialization
- Location-based model queries
- Production URL fallback for model loading
- CORS and content-type headers configuration

## Development

```bash
npm run dev     # Local development
npm run build   # Production build (copies models to dist/models)
firebase deploy # Deploy to production
```

## Next Steps

1. [ ] Enhanced model interactions
2. [ ] Multiple model support
3. [ ] Environmental effects
4. [ ] Advanced AR features
5. [ ] User customization options

## Dependencies

- React 17.0.2
- TypeScript 4.9.5
- A-Frame 1.4.2
- Mapbox GL 2.15.0
- Firebase 9.23.0
