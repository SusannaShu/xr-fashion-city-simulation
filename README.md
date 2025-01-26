# Mixed Reality Public Spaces – Virtual Graffiti for Cultural Heritage

## Overview
This project explores the intersection of public space, technology, and creativity through mixed reality. Inspired by urban graffiti culture, it introduces a web-based AR application that allows users to doodle in iconic Parisian locations like **Palais Royal** and **Pompidou**. Using AR technology, users can place virtual drawings at specific GPS coordinates, enabling interaction with space while preserving cultural heritage. This experiment envisions an open, collaborative canvas that evolves over time without impacting physical environments.

## Concept
**How it works:**
- Users access the web app via their smartphone and see the public space in AR
- They can doodle in the air by drawing on their phone screens
- The doodles appear in pink shades with varying thicknesses and curved lines
- The doodles stay in the same location for others to see and interact with
- No physical harm to historical sites, offering a creative and respectful way to interact with public spaces

## Technical Overview
**Tech Stack:**
- **[AR.js](https://ar-js-org.github.io/AR.js-docs/)** – Location-based augmented reality in the web browser
- **[Three.js](https://threejs.org/)** – 3D graphics and curved line rendering
- **[A-Frame](https://aframe.io/)** – WebXR framework for AR experiences

**Key Features:**
1. **Web-Based Experience:** No app download required, just a QR code scan
2. **Geolocation-Based Placement:** Doodles stay at specific locations
3. **Dynamic Drawing:**
   - Curved lines with varying thickness
   - Pink color palette for artistic expression
   - Real-time 3D rendering
4. **Location Support:**
   - Palais Royal coordinates: 48.8642° N, 2.3376° E
   - Centre Pompidou coordinates: 48.8606° N, 2.3522° E

## Setup and Development
1. Clone the repository:
```bash
git clone https://github.com/SusannaShu/air-graffiti.git
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Access the application:
- Open `http://localhost:8080` on your mobile device
- Allow camera and location permissions when prompted
- Point your camera at one of the supported locations to start drawing

## Requirements
- Modern mobile browser with WebXR support
- Camera and GPS access
- Location services enabled

