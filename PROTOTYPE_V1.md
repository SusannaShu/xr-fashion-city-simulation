# Virtual Space Prototype V1 - Simple AR Fashion Viewer

## Overview

A simplified prototype focusing on the core AR fashion viewing experience. This version strips away location-based complexity to provide immediate visual feedback and test basic AR interactions.

## Core Features

### Map View

- Single marker on the Louvre location
- Click to view model details
- "Start AR" button to enter AR view

### AR View

- Immediate model display in user's space
- Model appears directly in front of user (3 meters away)
- Life-sized shoe model (approximately 2x scale)
- Basic camera controls (look around)
- Clean, focused viewing experience

## Technical Implementation

### AR Setup

- Using A-Frame for web-based AR
- Direct model placement without GPS
- Fixed position relative to camera
- Ambient lighting for better visibility

### Model Configuration

```javascript
// Model placement
position: '0 0 -3'  // 3 meters in front of user
scale: '2 2 2'      // Life-sized scale
rotation: '0 0 0'   // Default orientation

// Lighting
ambient light: {
  color: '#ffffff',
  intensity: 1.5
}
```

## User Flow

1. User opens application
2. Sees marker on Louvre location
3. Clicks marker to view details
4. Taps "Start AR" button
5. Grants camera permissions
6. Immediately sees shoe model in their space

## Design Decisions

### Simplified Placement

- Removed GPS-based positioning
- Fixed position relative to user
- Ensures immediate visual feedback
- Better for testing and demos

### Scale and Distance

- Life-sized model (2x scale)
- 3-meter viewing distance
- Optimal for room-scale viewing
- Clear visibility of details

### Lighting

- Enhanced ambient lighting
- Better model visibility
- Consistent appearance across environments

## Next Steps

### Immediate Improvements

- [ ] Add model rotation controls
- [ ] Implement basic scaling gestures
- [ ] Add screenshot capability
- [ ] Improve model loading feedback

### Future Enhancements

- [ ] Reintroduce location-based features
- [ ] Add model animation
- [ ] Implement surface detection
- [ ] Add virtual try-on features

## Notes

This prototype prioritizes immediate visual feedback and basic interaction over complex features. It serves as a foundation for testing core AR functionality and user experience before adding more advanced features.
