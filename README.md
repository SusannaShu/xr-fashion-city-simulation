# XR Fashion City Simulation (GitHub Pages Demo)

[This project] (https://susannashu.github.io/xr-fashion-city-simulation/) is a simulation environment for the AR (Augmented Reality) features of the main [SHEYOU Virtual Space application](https://susu-virtual-space.web.app/).

## Purpose

This version is intended for:

- **Public Demonstration:** To showcase the AR interactions and 3D model viewing capabilities on GitHub Pages.
- **Development & Emulation:** It simulates the experience a user would have when they physically arrive at a designated AR location within the main application.

It is a modified version of the core `virtual_space` codebase, adapted to run as a static site on GitHub Pages and may have certain backend-dependent features (like live Firebase data synchronization) disabled or mocked.

The primary application, with full Firebase integration and live deployment, can be found at [susu-virtual-space.web.app](https://susu-virtual-space.web.app/).

---

# SHEYOU Virtual Space - Mixed Reality Fashion Experiences

## Overview

SHEYOU Virtual Space is an innovative mixed reality platform that enables fashion designers and brands to create interactive virtual experiences in public spaces. Part of the SHEYOU ecosystem, it bridges the gap between physical and digital fashion, allowing users to discover, interact with, and collect virtual fashion pieces that can be traded on the SHEYOU marketplace.

## Key Features

### For Designers & Brands

- Create location-based AR experiences
- Upload and position 3D fashion models
- Configure interaction rules and rewards
- Track engagement and collection metrics
- Link virtual pieces to physical products

### For Users

- Discover virtual fashion experiences nearby
- Interact through doodling and virtual try-ons
- Collect virtual fashion pieces
- Trade virtual items on SHEYOU marketplace
- Participate in virtual fashion campaigns

## Technical Stack

- **AR Technology**: AR.js for web-based augmented reality
- **3D Rendering**: Three.js for model visualization
- **Location Services**: Mapbox for experience placement
- **Backend Integration**: Shared authentication with SHEYOU platform
- **Asset Management**: Cloud storage with optimized delivery

## Integration with SHEYOU Ecosystem

### 1. Unified Authentication

- Single sign-on across SHEYOU platforms
- Seamless designer/brand verification
- Shared user profiles and preferences

### 2. Virtual Asset Bridge

- Virtual items tradeable on SHEYOU marketplace
- Direct links to physical products
- Shared inventory management

### 3. Social Features

- Community interaction through doodles
- Shared achievements and rewards
- Cross-platform social sharing

## Getting Started

### For Designers

The designer dashboard provides tools for:

- 3D model management
- Location-based experience creation
- Interaction rule configuration
- Analytics and tracking

### For Users

The mobile web application allows you to:

- Browse nearby experiences
- Interact with virtual fashion
- Collect digital items
- Connect with the SHEYOU marketplace

## Development

### Prerequisites

- Node.js 18+
- NPM or Yarn
- Modern mobile browser with AR support
- Git

### Setup

```bash
# Clone the repository
git clone [repository-url]
cd virtual-space

# Install dependencies
npm install

# Set up Git hooks
npm run prepare

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id

# Mapbox Configuration
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Check TypeScript types
- `npm test` - Run tests

### Development Tools

- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Husky for Git hooks
- lint-staged for pre-commit checks

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Related Projects

- SHEYOU Platform
- SUSU Closet

## Firebase Storage Setup

### CORS Configuration

1. Install the Firebase CLI if you haven't already:

```bash
npm install -g firebase-tools
```

2. Login to Firebase:

```bash
firebase login
```

3. Set up CORS for Firebase Storage:

```bash
# Navigate to the project directory
cd virtual_space

# Deploy the CORS configuration
gsutil cors set cors.json gs://<YOUR-STORAGE-BUCKET>
```

Replace `<YOUR-STORAGE-BUCKET>` with your Firebase Storage bucket name (found in Firebase Console > Storage).

### Storage Rules

1. Deploy the storage rules:

```bash
firebase deploy --only storage
```

This will apply the rules defined in `storage.rules`.
