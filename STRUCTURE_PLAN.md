# Virtual Space Project Structure - MVP

## 🎯 MVP Focus

Simplified location-based AR experience using A-Frame, supporting both drawing and 3D models

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
│   │   │   ├── ModelViewer.module.css # Viewer styles
│   │   │   ├── ModelUploader.tsx      # Model upload handling
│   │   │   ├── ModelUploader.module.css # Uploader styles
│   │   │   ├── ModelList.tsx          # Model list/gallery
│   │   │   └── ModelInteraction.tsx   # Model interactions
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
│   │   │   ├── metadata.ts          # Content metadata handling
│   │   │   └── database.ts          # Database operations
│   │   └── model/
│   │       ├── ModelTransformer.ts   # Model transformations
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
│   ├── _reference_js/               # Reference implementations
│   │   ├── app.js                  # Original app implementation
│   │   ├── modelList.js            # Model list reference
│   │   ├── modelInteraction.js     # Model interaction reference
│   │   └── firebase-config.js      # Firebase config reference
│   ├── App.tsx                      # Main application component
│   ├── App.css                      # App-specific styles
│   ├── main.tsx                     # Application entry point
│   ├── config.ts                    # Global configuration
│   └── styles.css                   # Global styles
├── .github/workflows/              # GitHub Actions
│   ├── firebase-hosting-merge.yml        # Production deployment
│   └── firebase-hosting-pull-request.yml # PR previews
├── models/                         # 3D model assets
├── docs/                          # Documentation
│   ├── STRUCTURE_PLAN.md          # Project structure
│   ├── TODO.md                    # Development tasks
│   ├── README.md                  # Project overview
│   └── CONTRIBUTING.md            # Contribution guide
├── Development Config
│   ├── .vscode/                   # VS Code settings
│   ├── .husky/                    # Git hooks
│   ├── .eslintrc.json            # ESLint configuration
│   ├── .prettierrc               # Prettier configuration
│   ├── .lintstagedrc             # Lint-staged config
│   └── .gitignore                # Git ignore rules
├── Build Config
│   ├── package.json              # NPM configuration
│   ├── package-lock.json         # Dependency lock
│   ├── tsconfig.json            # TypeScript config
│   ├── tsconfig.node.json       # Node TypeScript config
│   └── vite.config.ts           # Vite configuration
├── Firebase Config
│   ├── .firebase/               # Firebase cache
│   ├── firebase.json            # Firebase configuration
│   ├── firestore.rules          # Firestore security rules
│   ├── firestore.indexes.json   # Firestore indexes
│   └── .firebaserc             # Firebase project config
├── Environment
│   ├── .env                     # Default environment
│   ├── .env.local              # Local overrides
│   └── .env.example            # Environment template
├── Build Output
│   ├── dist/                   # Production build
│   └── node_modules/           # Dependencies
├── Web Entry
│   ├── index.html             # Main entry point
│   ├── 404.html              # Error page
│   └── susu_doodle_logo.png  # Logo asset
└── config.js                  # Legacy configuration
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
- Simple model placement
- Camera view with AR overlay
- Touch interaction
- Location awareness

#### Drawing Features

- Single color (Hot Pink #FF69B4)
- Point-based drawing
- Basic persistence
- Location anchoring

#### Model Features

- GLTF/GLB support
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
- Metadata management
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
- Preview generation
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
4. Enable model loading
5. Integrate with map
6. Add content persistence

### Future Enhancements

(Post-MVP)

1. Content Tools

   - Multiple colors
   - Line styles
   - Advanced model controls
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

### AR Services

#### AREngine Service

- WebXR session management
- AR.js context handling
- Scene management
- Model placement
- Camera calibration
- Location-based positioning
- Device orientation tracking
- Permission state management
  - Camera access handling
  - Motion sensor access
  - Permission persistence
  - Error recovery

#### LocationService

- Geolocation tracking
- Spatial anchoring
- Location persistence
- Proximity detection
- Area activation
- Location-based content loading

#### DrawingService

- 3D drawing capabilities
- Stroke management
- Real-time sync
- Drawing persistence
- Multi-browser compatibility
- Canvas/WebGL rendering
- Touch/motion input handling

### Browser Support Strategy

#### iOS Devices

- Safari: WebXR (primary)
- Chrome/Firefox: AR.js with location-based AR
- Fallback: WebRTC camera feed with basic AR

#### Android Devices

- Chrome: WebXR (primary)
- Firefox/Samsung: AR.js with location-based AR
- Fallback: WebRTC camera feed with basic AR

#### Permission Management

- Camera access workflow
  - Permission request
  - State persistence
  - Error handling
  - Recovery options
- Motion sensor access
  - iOS-specific handling
  - Permission request
  - State management
- Location services
  - Permission request
  - Accuracy levels
  - State management
