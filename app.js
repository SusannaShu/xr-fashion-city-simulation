// Initialize locations
const locations = [
    {
        name: 'Palais Royal',
        coordinates: [48.8642, 2.3376]
    },
    {
        name: 'Centre Pompidou',
        coordinates: [48.8606, 2.3522]
    }
];

// Initialize Google Earth
let ge;
google.load("earth", "1");

function init() {
    google.earth.createInstance('map', initCallback, failureCallback);
}

function initCallback(instance) {
    ge = instance;
    ge.getWindow().setVisibility(true);
    
    // Set initial view to Paris
    const lookAt = ge.createLookAt('');
    lookAt.setLatitude(48.8566);
    lookAt.setLongitude(2.3522);
    lookAt.setRange(2000); // Zoom level
    lookAt.setTilt(45); // Tilt for 3D view
    lookAt.setHeading(0);
    ge.getView().setAbstractView(lookAt);

    // Add place markers
    locations.forEach(location => {
        const placemark = ge.createPlacemark('');
        placemark.setName(location.name);
        
        const point = ge.createPoint('');
        point.setLatitude(location.coordinates[0]);
        point.setLongitude(location.coordinates[1]);
        placemark.setGeometry(point);
        
        ge.getFeatures().appendChild(placemark);
    });
}

function failureCallback(error) {
    console.error('Failed to initialize Google Earth:', error);
}

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
        
        // Update Google Earth view to match AR position
        const lookAt = ge.createLookAt('');
        lookAt.setLatitude(position.coords.latitude);
        lookAt.setLongitude(position.coords.longitude);
        lookAt.setRange(100); // Close-up view
        lookAt.setTilt(90); // Looking straight ahead
        ge.getView().setAbstractView(lookAt);
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

// Initialize Google Earth when the page loads
google.setOnLoadCallback(init);