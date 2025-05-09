# Virtual Space Project Structure - MVP

## 🎯 MVP Focus

Simplified location-based AR experience using A-Frame, supporting drawing and viewing pre-loaded models

### Current Codebase Structure

```typescript
virtual_space/
├── src/                            # Source code
│   ├── components/
│   │   ├── ar/
│   │   │   ├── ARViewer.tsx           # Main AR component
│   │   │   ├── ARViewer.module.css    # AR viewer styles
│   │   │   ├── DrawingCanvas.tsx      # Drawing functionality
│   │   │   ├── DrawingCanvas.module.css # Drawing styles
│   │   │   ├── ARControls.tsx         # AR interaction controls
│   │   │   └── ARControls.module.css  # Controls styles
│   │   ├── map/
│   │   │   ├── MapInterface.tsx       # Main map component
│   │   │   ├── MapInterface.module.css # Map styles
│   │   │   ├── LocationPicker.tsx     # Location selection
│   │   │   └── LocationPicker.module.css # Picker styles
│   │   ├── model/
│   │   │   ├── ModelViewer.tsx        # 3D model viewer
│   │   │   └── ModelViewer.module.css # Viewer styles
│   │   └── shared/
│   │       ├── ErrorBoundary.tsx      # Error handling
│   │       ├── ErrorBoundary.module.css # Error styles
│   │       ├── LoadingSpinner.tsx     # Loading indicator
│   │       ├── LoadingSpinner.module.css # Spinner styles
│   │       ├── Toast.tsx              # Toast notifications
│   │       ├── Toast.module.css       # Toast styles
│   │       ├── ToastContainer.tsx     # Toast manager
│   │       └── ToastContainer.module.css # Container styles
│   ├── services/
│   │   ├── ar/
│   │   │   ├── arEngine.ts           # AR core functionality
│   │   │   ├── arjsSetup.ts          # AR.js initialization
│   │   │   ├── aframe-init.ts        # A-Frame setup
│   │   │   ├── drawingService.ts     # Drawing functionality
│   │   │   └── locationService.ts    # Location handling
│   │   ├── firebase/
│   │   │   ├── config.ts             # Firebase configuration
│   │   │   ├── storage.ts            # File storage handling
│   │   │   ├── sync.ts              # Real-time synchronization
│   │   │   └── database.ts          # Database operations
│   │   └── model/
│   │       └── ModelLoader.ts        # Model loading & processing
│   ├── store/                        # State management
│   │   ├── index.ts                 # Store configuration
│   │   └── models/                  # Model-related state
│   │       └── modelSlice.ts        # Model state management
│   ├── hooks/                        # Custom React hooks
│   │   └── useModel.ts             # Model management hook
│   ├── utils/                        # Utility functions
│   │   └── classNames.ts           # CSS class utilities
│   ├── types/                        # TypeScript definitions
│   │   ├── ar.d.ts                 # AR type definitions
│   │   ├── models.ts               # Model type definitions
│   │   ├── global.d.ts             # Global type declarations
│   │   ├── env.d.ts                # Environment variables types
│   │   └── aframe.d.ts             # A-Frame type definitions
│   ├── config/                       # Configuration files
│   │   └── firebase-config.d.ts    # Firebase config types
│   ├── App.tsx                      # Main application component
│   ├── App.css                      # App-specific styles
│   ├── main.tsx                     # Application entry point
│   ├── config.ts                    # Global configuration
│   └── styles.css                   # Global styles
```

### Component Features

#### AR Components (Using A-Frame)

- **ARViewer**

  - Camera permission handling
  - A-Frame scene setup
  - Drawing & model interaction
  - Location tracking
  - Basic UI controls

- **DrawingCanvas**
  - Drawing functionality
  - Touch interaction
  - Point-based drawing
  - Hot pink color (#FF69B4)

#### Map Components

- **MapInterface**
  - Mapbox integration
  - Content location visualization
  - Area-based navigation
  - Simple grayscale with color highlights

### Core Features

#### AR Experience

- Basic 3D drawing in AR space
- View pre-loaded models
- Camera view with AR overlay
- Touch interaction
- Location awareness

#### Drawing Features

- Single color (Hot Pink #FF69B4)
- Point-based drawing
- Basic persistence
- Location anchoring

#### Model Features

- View pre-loaded GLTF/GLB models
- Basic transformations
- Location anchoring
- Simple interactions

#### Map Experience

- Content location markers
- Simple navigation
- Area activation
- Basic visual feedback

### Services

#### Firebase Services

- Content storage
- Location data
- Basic persistence

#### AR Services

- Location tracking
- Drawing management
- Model handling
- Scene management

#### Model Services

- Model loading
- Basic transformations
- Format handling

### Technical Stack

- A-Frame for AR & 3D
- React for UI
- Firebase for storage
- Mapbox for mapping

### Development Priority

1. Set up basic A-Frame AR scene
2. Implement location tracking
3. Add drawing capabilities
4. Enable pre-loaded model viewing
5. Integrate with map
6. Add content persistence

### Future Enhancements

(Post-MVP)

1. Content Tools

   - Multiple colors
   - Line styles
   - Model uploading
   - Animation support

2. Social Features

   - User accounts
   - Content sharing
   - Likes/comments

3. Advanced AR

   - Surface detection
   - Object occlusion
   - Advanced anchoring

4. Enhanced Map
   - Custom styling
   - Advanced navigation
   - Content filtering

## 🔄 Core Features

### AR Experience

- Location-based AR viewing
- Pre-loaded model viewing
- Real-time drawing
- Gesture controls
- Environment mapping

### Model Management

- Pre-loaded model viewing
- Basic transformations
- Location persistence
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

### Firebase Integration

- Content storage
- Real-time sync
- Basic persistence
- Asset serving

### External Services

- Mapbox for mapping
- AR.js for augmented reality
- Three.js for 3D rendering
- Cloud CDN for assets
- Analytics services

## 📱 User Interfaces

### User Experience

- AR viewer
- Model viewing
- Drawing tools
- Location browser

## 🔒 Security & Performance

### Security Measures

- Authentication
- Data validation
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
