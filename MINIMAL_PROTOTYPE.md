# SHEYOU Virtual Space - Minimal Prototype

## Overview

Minimal implementation of SHEYOU Virtual Space platform, presenting fashion items as monumental digital sculptures in a clean web environment.

## Features

- [x] Immersive 3D viewer with A-Frame
- [x] Monumental presentation (19x scale, -15 depth, 40s rotation)
- [x] Optimized lighting (ambient: 0.7, directional: 0.8, spot: 0.5)
- [x] Distraction-free UI
- [x] Production deployment setup

## Technical Details

### Core Implementation

- **ARViewer**: Main viewing component
  - Full viewport rendering
  - Error handling
  - Camera & lighting setup
  - Animation system

### Model Setup

- Position & Scale: `0 -1 -15`, `19 19 19`
- Model deployment: GLB files in `dist/models/` copied to Firebase hosting
- Lighting: Ambient + 2 Directional + 1 Spot light

### Deployment

- Firebase hosting with CORS & content-type headers
- URL: https://susu-virtual-space.web.app/ar

## Limitations & Next Steps

### Current Limitations

- Single model view
- Fixed distance
- No interactions
- Basic lighting
- No AR features

### Next Steps

1. Model interactions
2. AR markers
3. Environmental effects
4. Multiple models
5. User controls

## Development

```bash
npm run dev     # Local development
npm run build   # Build (copies models to dist/models)
firebase deploy # Deploy to production
```

## Dependencies

- A-Frame 1.4.2
- React 17.0.2
- TypeScript 4.9.5
