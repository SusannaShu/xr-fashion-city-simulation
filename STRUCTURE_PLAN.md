# Virtual Space Project Structure

## 🏗️ Project Architecture

### Frontend Structure

```typescript
virtual_space/
├── src/
│   ├── components/
│   │   ├── ar/
│   │   │   ├── ARViewer.tsx           # AR scene container & WebXR management
│   │   │   ├── ARViewer.module.css    # AR viewer styles
│   │   │   ├── ARControls.tsx         # AR interaction controls
│   │   │   ├── ARControls.module.css  # Controls styles
│   │   │   ├── DrawingCanvas.tsx      # Drawing functionality
│   │   │   └── DrawingCanvas.module.css # Drawing styles
│   │   ├── map/
│   │   │   ├── MapInterface.tsx       # Mapbox integration
│   │   │   ├── MapInterface.module.css # Map styles
│   │   │   ├── LocationPicker.tsx     # Location selection
│   │   │   └── LocationPicker.module.css # Picker styles
│   │   ├── model/
│   │   │   ├── ModelUploader.tsx      # Model upload interface
│   │   │   ├── ModelUploader.module.css # Uploader styles
│   │   │   ├── ModelViewer.tsx        # 3D model display
│   │   │   ├── ModelViewer.module.css # Viewer styles
│   │   │   ├── ModelControls.tsx      # Model manipulation
│   │   │   └── ModelControls.module.css # Controls styles
│   │   └── shared/
│   │       ├── LoadingSpinner.tsx     # Loading states
│   │       ├── LoadingSpinner.module.css # Spinner styles
│   │       ├── ErrorBoundary.tsx      # Error handling
│   │       ├── Toast.tsx              # Notifications
│   │       └── Toast.module.css       # Toast styles
│   ├── services/
│   │   ├── firebase/
│   │   │   ├── config.ts             # Firebase setup
│   │   │   ├── storage.ts            # Model storage
│   │   │   ├── metadata.ts           # Model metadata
│   │   │   └── sync.ts               # Real-time sync
│   │   ├── strapi/
│   │   │   ├── auth.ts               # Authentication
│   │   │   ├── user.ts               # User management
│   │   │   └── api.ts                # API client
│   │   ├── ar/
│   │   │   ├── arEngine.ts           # WebXR & scene management
│   │   │   ├── locationService.ts    # Geolocation & anchors
│   │   │   └── drawingService.ts     # 3D drawing management
│   │   └── model/
│   │       ├── ModelLoader.ts        # Model loading & processing
│   │       ├── ModelTransformer.ts   # Model transformations
│   │       └── MaterialManager.ts    # Material handling
│   ├── store/
│   │   ├── index.ts                  # Store configuration
│   │   ├── models/
│   │   │   ├── modelSlice.ts         # Model state
│   │   │   └── transformSlice.ts     # Transform state
│   │   ├── ar/
│   │   │   └── drawingSlice.ts       # Drawing state
│   │   └── map/
│   │       └── locationSlice.ts      # Location state
│   ├── types/
│   │   ├── env.d.ts                  # Environment types
│   │   ├── firebase.d.ts             # Firebase types
│   │   ├── model.d.ts                # Model types
│   │   └── ar.d.ts                   # AR/WebXR types
│   ├── utils/
│   │   ├── three/                    # Three.js utilities
│   │   ├── geo/                      # Geolocation utilities
│   │   └── model/                    # Model processing
│   ├── hooks/                        # Custom React hooks
│   │   ├── useAR.ts                  # AR functionality
│   │   ├── useModel.ts               # Model management
│   │   └── useLocation.ts            # Location tracking
│   ├── assets/                       # Static assets
│   └── styles/                       # Global styles
```

### Component Features

#### AR Components

- **ARViewer**

  - WebXR session management
  - Scene initialization
  - Camera calibration
  - Model placement
  - Lighting setup

- **ARControls**

  - Mode switching (view/draw/place)
  - Drawing controls
  - Model placement controls
  - Camera controls
  - Action buttons

- **DrawingCanvas**
  - 3D drawing interface
  - Color picker
  - Stroke width control
  - Drawing preview
  - Pressure sensitivity

#### Map Components

- **MapInterface**

  - Mapbox integration
  - Model location visualization
  - Interaction handling
  - Custom markers
  - Selective colorization system
    - Grayscale base map
    - Color highlights for active areas
    - Dynamic color transitions
    - Area-based color activation
  - Offline support
  - 3D terrain visualization

- **LocationPicker**
  - Location search
  - Coordinate selection
  - Geofencing interface
  - Distance calculation
  - Area selection

#### Model Components

- **ModelUploader**

  - Drag and drop interface
  - File validation
  - Upload progress
  - Format conversion
  - Preview generation

- **ModelViewer**

  - 3D model rendering
  - Camera controls
  - Lighting setup
  - Material preview
  - Animation playback

- **ModelControls**
  - Transform controls
  - Material controls
  - Animation controls
  - Save/reset functionality
  - History management

#### Shared Components

- **LoadingSpinner**

  - Configurable loading states with progress
  - Accessible and responsive design

- **ErrorBoundary**

  - Error catching and recovery
  - Fallback UI with debug info
  - Error reporting integration

- **Toast**
  - Multiple notification types
  - Auto-dismiss and action support
  - Queue management

### Service Layer

#### Firebase Services

- Model storage and retrieval
- Real-time synchronization
- Metadata management
- Version control
- Asset optimization

#### AR Services

- WebXR integration
- Geolocation tracking
- Spatial anchoring
- Drawing management
- Scene optimization

#### Model Services

- Model loading and processing
- Transformation handling
- Material management
- Animation control
- Optimization pipeline

#### Strapi Services

- Authentication
- User management
- Content management
- API integration
- Data validation

### State Management

#### Model State

- Model metadata
- Transform state
- Material state
- Animation state
- History management

#### AR State

- Drawing state
- Camera state
- Scene state
- Interaction state
- Performance metrics

#### Map State

- Location state
- Area activation state
  - Active zones tracking
  - Color transition management
  - Model presence indicators
  - Drawing area highlights
- View state
- Search history

### Testing Strategy

#### Unit Tests

- Component testing
- Service testing
- State management
- Utility functions
- Type checking

#### Integration Tests

- Component interaction
- Service integration
- State flow
- API integration
- Error handling

#### Performance Tests

- Load testing
- Memory management
- Network optimization
- Asset loading
- WebXR performance

### Documentation

#### Technical Docs

- API documentation
- Component documentation
- Service documentation
- State management
- Testing guide

#### User Docs

- User guide
- Designer guide
- Best practices
- Troubleshooting
- FAQ

## 🔄 Core Features

### AR Experience

- Location-based AR viewing
- 3D model placement
- Real-time drawing
- Gesture controls
- Environment mapping

### Model Management

- Model upload and storage
- Version control
- Format conversion
- Optimization pipeline
- Preview generation

### Location Services

- Geofencing
- Proximity detection
- Location persistence
- Map visualization
- Place marking

### Map Experience

- Grayscale base visualization
- Dynamic area activation
  - Color activation around models (Hot Pink #FF69B4)
  - Drawing area highlighting
  - Transition animations
  - Activity zone management
- Location-based content
- Interactive elements
- Visual feedback system
  - Primary color: Hot Pink (#FF69B4)
  - Secondary color: Deep Pink (#FF1493)
  - Accent colors: White and grayscale
  - Interactive elements use pink gradients
  - Hover states use deeper pink shades

## 🔌 Integrations

### Firebase Integration (3D Models)

- Cloud storage for models
- Real-time model sync
- Model metadata
- Asset optimization
- Version control

### Strapi Integration

- Authentication
- User management
- Profile data
- Activity tracking
- Permissions management

### External Services

- Mapbox for mapping
- AR.js for augmented reality
- Three.js for 3D rendering
- Cloud CDN for assets
- Analytics services

## 📱 User Interfaces

### Designer Dashboard

- Model management
- Experience creation
- Analytics view
- User management
- Content moderation

### User Experience

- AR viewer
- Model interaction
- Drawing tools
- Location browser
- Social features

## 🔒 Security & Performance

### Security Measures

- Authentication
- Data validation
- Asset verification
- Access control
- Rate limiting

### Performance Optimization

- Asset compression
- Lazy loading
- Caching strategy
- Progressive loading
- Memory management

## 📊 Analytics & Monitoring

### Usage Analytics

- User engagement
- Feature usage
- Error tracking
- Performance metrics
- User flow analysis

### System Monitoring

- Server health
- API performance
- Storage usage
- Network metrics
- Error rates

## 🚀 Deployment

### Development

- Local development setup
  - Vite development server
  - Hot module replacement
  - Environment variables
  - TypeScript compilation
- Testing environment
  - Unit test setup
  - Integration testing
  - Performance testing
- Staging deployment
  - Firebase hosting preview
  - Automated builds
- CI/CD pipeline
  - GitHub Actions workflow
  - Automated testing
  - Build verification
- Code quality checks
  - ESLint configuration
  - Prettier formatting
  - TypeScript type checking

### Production

- Cloud hosting
  - Firebase hosting
  - SPA configuration
  - Cache control
  - Error pages
- Database configuration
  - Firestore setup
  - Indexes configuration
  - Security rules
  - Backup strategy
- CDN configuration
  - Asset delivery
  - Cache optimization
  - Geographic distribution
- Monitoring setup
  - Firebase Analytics
  - Error tracking
  - Performance monitoring
- Scaling strategy
  - Load balancing
  - Database sharding
  - Cache distribution

## ✅ Completed Setup

### Configuration

```typescript
// Environment configuration
├── .env                        # Environment variables
├── src/
│   └── config.ts              # Typed configuration
```
