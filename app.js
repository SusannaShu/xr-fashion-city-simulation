// Replace with your Mapbox access token
mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN';

// Initialize map centered on Paris
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: [2.3522, 48.8566], // Paris coordinates
    zoom: 12
});

// Add markers for our locations of interest
const locations = [
    {
        name: 'Palais Royal',
        coordinates: [2.3376, 48.8642]
    },
    {
        name: 'Centre Pompidou',
        coordinates: [2.3522, 48.8606]
    }
];

// Add markers to the map
locations.forEach(location => {
    new mapboxgl.Marker()
        .setLngLat(location.coordinates)
        .setPopup(new mapboxgl.Popup().setHTML(`<h3>${location.name}</h3>`))
        .addTo(map);
});

// Handle AR mode
const startARButton = document.getElementById('start-ar');
const arScene = document.getElementById('ar-scene');
const uiContainer = document.getElementById('ui-container');

let isDrawing = false;
let currentLine = [];

startARButton.addEventListener('click', () => {
    // Hide map UI and show AR scene
    uiContainer.style.display = 'none';
    arScene.style.display = 'block';
    
    // Request device orientation and geolocation permissions
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(response => {
                if (response == 'granted') {
                    initAR();
                }
            })
            .catch(console.error);
    } else {
        initAR();
    }
});

function initAR() {
    // Initialize AR drawing functionality
    const camera = document.querySelector('[gps-camera]');
    const drawingsContainer = document.getElementById('drawings');

    // Get user's current position
    navigator.geolocation.getCurrentPosition(position => {
        console.log('User position:', position.coords.latitude, position.coords.longitude);
    });

    // Add touch event listeners for drawing
    document.addEventListener('touchstart', startDrawing);
    document.addEventListener('touchmove', draw);
    document.addEventListener('touchend', endDrawing);
}

function startDrawing(event) {
    isDrawing = true;
    currentLine = [];
    // Convert touch position to 3D coordinates
    const touch = event.touches[0];
    addPoint(touch);
}

function draw(event) {
    if (!isDrawing) return;
    const touch = event.touches[0];
    addPoint(touch);
}

function endDrawing() {
    isDrawing = false;
    if (currentLine.length > 1) {
        // Create 3D line from points
        createLine(currentLine);
    }
    currentLine = [];
}

function addPoint(touch) {
    // Convert 2D touch coordinates to 3D world coordinates
    // This is a simplified version - you'll need to implement proper coordinate conversion
    const point = {
        x: (touch.clientX / window.innerWidth) * 2 - 1,
        y: -(touch.clientY / window.innerHeight) * 2 + 1,
        z: -1 // Fixed distance from camera
    };
    currentLine.push(point);
}

function createLine(points) {
    // Create a new line entity in AR
    const line = document.createElement('a-entity');
    line.setAttribute('line', {
        start: points[0],
        end: points[points.length - 1],
        color: '#FF0000'
    });
    document.querySelector('#drawings').appendChild(line);
} 