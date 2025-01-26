// Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1Ijoic3VzYW5uYXNodSIsImEiOiJjbTZkajNkbWYwb3EyMmlxczdpeDljamxtIn0.0UgPtm1Ag2ai0QbmRszBBg';

// Initialize map centered on Paris
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: [2.3522, 48.8566], // Paris coordinates
    zoom: 15,
    pitch: 60, // Tilt the map for 3D view
    bearing: -30,
    antialias: true
});

// Add 3D buildings layer
map.on('style.load', () => {
    // Add 3D building layer
    map.addLayer({
        'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['==', 'extrude', 'true'],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'height']
            ],
            'fill-extrusion-base': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.6
        }
    });

    // Fly to Palais Royal
    map.flyTo({
        center: [2.3376, 48.8642],
        zoom: 17,
        pitch: 60,
        bearing: -30
    });
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
let currentStroke = {
    points: [],
    color: '#FF1493', // Hot pink color
    width: 0.02
};

startARButton.addEventListener('click', () => {
    uiContainer.style.display = 'none';
    arScene.style.display = 'block';
    
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
    const camera = document.querySelector('[gps-camera]');
    const drawingsContainer = document.getElementById('drawings');

    navigator.geolocation.getCurrentPosition(position => {
        console.log('User position:', position.coords.latitude, position.coords.longitude);
    });

    document.addEventListener('touchstart', startDrawing);
    document.addEventListener('touchmove', draw);
    document.addEventListener('touchend', endDrawing);
}

function startDrawing(event) {
    isDrawing = true;
    currentStroke = {
        points: [],
        color: getRandomPinkShade(),
        width: Math.random() * 0.03 + 0.01 // Random width between 0.01 and 0.04
    };
    const touch = event.touches[0];
    addPoint(touch);
}

function getRandomPinkShade() {
    const pinkShades = [
        '#FF1493', // Deep pink
        '#FF69B4', // Hot pink
        '#FFB6C1', // Light pink
        '#FF82AB', // Pale violet red
        '#FF34B3'  // Rose pink
    ];
    return pinkShades[Math.floor(Math.random() * pinkShades.length)];
}

function draw(event) {
    if (!isDrawing) return;
    const touch = event.touches[0];
    addPoint(touch);
    if (currentStroke.points.length >= 2) {
        createCurvedLine(currentStroke.points, currentStroke.color, currentStroke.width);
    }
}

function endDrawing() {
    isDrawing = false;
    if (currentStroke.points.length >= 2) {
        createCurvedLine(currentStroke.points, currentStroke.color, currentStroke.width);
    }
    currentStroke.points = [];
}

function addPoint(touch) {
    const point = {
        x: (touch.clientX / window.innerWidth) * 2 - 1,
        y: -(touch.clientY / window.innerHeight) * 2 + 1,
        z: -1 + Math.random() * 0.2 // Add some depth variation
    };
    currentStroke.points.push(point);
}

function createCurvedLine(points, color, width) {
    if (points.length < 2) return;

    const curve = new THREE.CatmullRomCurve3(
        points.map(p => new THREE.Vector3(p.x, p.y, p.z))
    );

    const geometry = new THREE.TubeGeometry(
        curve,
        points.length * 3, // segments
        width,
        8, // radiusSegments
        false // closed
    );

    const material = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.5,
        roughness: 0.5,
        emissive: color,
        emissiveIntensity: 0.2
    });

    const mesh = new THREE.Mesh(geometry, material);
    const entity = document.createElement('a-entity');
    entity.setObject3D('mesh', mesh);
    document.querySelector('#drawings').appendChild(entity);
} 