# AR Feature Development TODO

- [x] ~~Debug why model doesn't show in production~~ (Resolved)

## Location-Based AR Enhancements

- [ ] **Integrate GPS for True Location-Based AR:**
  - [ ] Modify AR engine (`AREngine.ts` or similar) to use actual device GPS data via `gps-camera` / `gps-projected-entity-place` (or equivalent AR.js location features) instead of a static 360 view for model placement.
  - [ ] Ensure camera permissions for GPS and device orientation are correctly handled.
- [ ] **Define Fixed Model Locations:**
  - [ ] Create a data structure or configuration (e.g., JSON file, or Firestore collection) to store model details (ID, path, scale, rotation) and their specific GPS coordinates (latitude, longitude).
  - [ ] Implement logic to fetch this location data.
- [ ] **Proximity-Based Model Viewing:**
  - [ ] Implement logic to only display/enable interaction with a model when the user's physical GPS location is within a defined radius of the model's fixed coordinates.
  - [ ] Provide user feedback about nearby models and distance.
- [ ] **Mapbox Integration for Model Discovery (Optional but Recommended):**
  - [ ] Display model locations as points of interest (POIs) on the existing Mapbox map.
  - [ ] Allow users to tap on a POI to get more information or a hint to go to that location.

## Development Workflow & Emulation

- [ ] **Git Branching for New Features:**
  - [ ] Ensure current `main` branch is stable and reflects the working state (with the model loading fix).
  - [ ] Create a new feature branch (e.g., `feature/location-based-ar`) from `main` to start development on these new AR enhancements.
- [ ] **Location Emulation for Development/Testing:**
  - [ ] Investigate and set up browser-based GPS emulation tools (e.g., Chrome DevTools location sensor override) for testing location-based features without being physically at the target coordinates.
  - [ ] Consider adding debug UI within the app to manually set/override GPS coordinates for easier testing.

## Code Refinements (Ongoing)

- [ ] Review and refactor AR.js setup (`arjsSetup.ts`, `aframe-init.ts`) to resolve any component registration conflicts (e.g., `arjs-look-controls` warning) and ensure clean initialization.
- [ ] Improve error handling and user feedback for AR permission denials (camera, GPS, device orientation).
