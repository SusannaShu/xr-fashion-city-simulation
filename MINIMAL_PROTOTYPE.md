# SHEYOU Virtual Space - Minimal Prototype

## Overview

Minimal implementation of SHEYOU Virtual Space platform, focusing on presenting the Susanna Heel as a monumental digital sculpture in a clean web environment.

## Core Features

### Map Interface

- [x] Interactive Mapbox map with 3D buildings
- [x] Distinctive pink marker for Susanna Heel location
- [x] Marker popup with model information
- [x] "View in AR" button appears only when Susanna marker is selected
- [x] Smooth camera transitions to selected locations
- [x] Grayscale map style for focus on markers

### AR Viewer

- [x] Full viewport A-Frame scene
- [x] Optimized camera settings (80° FOV)
- [x] Louvre courtyard background
- [x] Proper model scaling and positioning
- [x] Smooth model rotation
- [x] Mobile-friendly controls

## Technical Implementation

### Map Component

- Light theme Mapbox implementation
- 3D building layer with 60° pitch
- Marker system with conditional styling
- Location-based model discovery
- Offline mode support
- Geolocation controls

### AR Component

- A-Frame scene setup
- Camera controls optimization
- Background image integration
- Model loading and positioning
- Animation system
- Error handling

### Model Management

- Firebase-based model metadata service
- Preloaded model initialization
- Location-based model queries
- Metadata synchronization

## Development

```bash
npm run dev     # Local development
npm run build   # Production build
firebase deploy # Deploy to production
```

## Next Steps

1. [ ] Enhanced model interactions
2. [ ] Multiple model support
3. [ ] Environmental effects
4. [ ] Advanced AR features
5. [ ] User customization options

## Dependencies

- React
- TypeScript
- A-Frame
- Mapbox GL
- Firebase
