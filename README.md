# Mixed Reality Public Spaces – Virtual Graffiti for Cultural Heritage

Play on your phone: https://susannashu.github.io/air-graffiti/
(only available on mobile devices, as it's easier to doodle on there!)

## Overview
This project explores the intersection of public space, technology, and creativity through mixed reality. Inspired by urban graffiti culture, it introduces a web-based AR application that allows users to doodle in iconic Parisian locations like **Palais Royal** and **Pompidou**. Leveraging **AR.js** and **Mapbox**, users can place virtual drawings at specific GPS coordinates, enabling interaction with space while preserving cultural heritage. This experiment envisions an open, collaborative canvas that evolves over time without impacting physical environments.

your-project/
├── models/
│   └── model.glb
├── docs/
│   └── 3D-MODELS.md
├── app.js
├── index.html
└── ...

## Concept
**How it works:**`
- Users access the web app via their smartphone and see the public space in AR.
- They can doodle in the air by drawing on their phone screens.
- The doodles stay in the same location for others to see and interact with.
- No physical harm to historical sites, offering a creative and respectful way to interact with public spaces.

## Technical Overview
**Tech Stack:**
- **[AR.js](https://ar-js-org.github.io/AR.js-docs/)** – Location-based augmented reality in the web browser.
- **[Mapbox](https://www.mapbox.com/)** – 3D map visualization for showing doodle locations.
- **[Three.js](https://threejs.org/)** – Rendering 3D doodles.
- **[Firebase](https://firebase.google.com/)** (optional) – Storing user-generated doodles temporarily.

**Key Features:**
1. **Web-Based Experience:** No app download required, just a QR code scan.
2. **Geolocation-Based Placement:** Doodles stay at specific locations.
3. **Minimal UI:** Simple drawing interface for users to interact easily.
4. **Prototype Demonstration:** Example doodle placed at Palais Royal and Pompidou.

