import { app, analytics } from './firebase-config.js';
import { config } from './config.js';
import { getFirestore, collection, addDoc, getDocs, query, where, GeoPoint } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

// Initialize Three.js loader for GLB files
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Initialize Firestore
const db = getFirestore(app);

// Constants for location-based queries
const DRAWING_VISIBILITY_RADIUS = 0.1; // 100 meters in kilometers

// Mapbox access token
mapboxgl.accessToken = config.mapbox.accessToken;
console.log('Mapbox Access Token:', config.mapbox.accessToken);

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

// Add custom layer for 3D model
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

    // Create custom layer for 3D model
    const modelOrigin = [2.3378, 48.8644]; // Adjusted to be in the courtyard space
    const modelAltitude = 0;
    const modelRotate = [Math.PI / 2, 0, 0];

    const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
        modelOrigin,
        modelAltitude
    );

    // Create a custom layer for the 3D model
    const customLayer = {
        id: '3d-model',
        type: 'custom',
        renderingMode: '3d',
        onAdd: function(map, gl) {
            this.camera = new THREE.Camera();
            this.scene = new THREE.Scene();

            // Create ambient and directional lights
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
            directionalLight.position.set(0, -70, 100).normalize();
            
            this.scene.add(ambientLight);
            this.scene.add(directionalLight);

            // Load the 3D model
            const loader = new GLTFLoader();
            loader.load(
                './models/susanna_heel.glb',
                (gltf) => {
                    this.scene.add(gltf.scene);
                    
                    // Scale the model to fit the space
                    const scale = modelAsMercatorCoordinate.meterInMercatorCoordinateUnits();
                    gltf.scene.scale.set(scale * 20, scale * 20, scale * 20);
                    
                    // Rotate and position the model
                    gltf.scene.rotation.set(...modelRotate);
                },
                undefined,
                (error) => {
                    console.error('Error loading 3D model:', error);
                }
            );

            this.map = map;
            this.renderer = new THREE.WebGLRenderer({
                canvas: map.getCanvas(),
                context: gl,
                antialias: true
            });

            this.renderer.autoClear = false;
        },
        render: function(gl, matrix) {
            const rotationX = new THREE.Matrix4().makeRotationAxis(
                new THREE.Vector3(1, 0, 0),
                modelRotate[0]
            );
            const rotationY = new THREE.Matrix4().makeRotationAxis(
                new THREE.Vector3(0, 1, 0),
                modelRotate[1]
            );
            const rotationZ = new THREE.Matrix4().makeRotationAxis(
                new THREE.Vector3(0, 0, 1),
                modelRotate[2]
            );

            const m = new THREE.Matrix4().fromArray(matrix);
            const l = new THREE.Matrix4()
                .makeTranslation(
                    modelAsMercatorCoordinate.x,
                    modelAsMercatorCoordinate.y,
                    modelAsMercatorCoordinate.z
                )
                .scale(new THREE.Vector3(1, -1, 1));

            this.camera.projectionMatrix = m.multiply(l);
            this.renderer.resetState();
            this.renderer.render(this.scene, this.camera);
            this.map.triggerRepaint();
        }
    };

    map.addLayer(customLayer);

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
    }
    // ,
    // {
    //     name: 'Centre Pompidou',
    //     coordinates: [2.3522, 48.8606]
    // }
];

// Add markers to the map with click handlers
locations.forEach(location => {
    const marker = new mapboxgl.Marker()
        .setLngLat(location.coordinates)
        .setPopup(new mapboxgl.Popup().setHTML(`<h3>${location.name}</h3>`))
        .addTo(map);

    // Add click handler to marker
    marker.getElement().addEventListener('click', () => {
        map.flyTo({
            center: location.coordinates,
            zoom: 18,
            pitch: 75,
            bearing: Math.random() * 360, // Random viewing angle
            duration: 2000, // Animation duration in milliseconds
            essential: true
        });
    });
});

// Handle AR mode
const startARButton = document.getElementById('start-ar');
const arScene = document.getElementById('ar-scene');
const uiContainer = document.getElementById('ui-container');

let isDrawing = false;
let currentStroke = {
    points: [],
    color: '#FF1493',
    width: 0.02
};

let camera;
let raycaster;
let drawingDistance = -1; // Default drawing distance in meters

async function requestPermissions() {
    try {
        // Request camera permission
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        cameraStream.getTracks().forEach(track => track.stop()); // Stop the stream as AR.js will handle it
        
        // Request geolocation permission
        const geoPermission = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        // Request device orientation permission if needed (iOS)
        if (typeof DeviceOrientationEvent !== 'undefined' && 
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            const orientationPermission = await DeviceOrientationEvent.requestPermission();
            if (orientationPermission !== 'granted') {
                throw new Error('Device orientation permission denied');
            }
        }

        return true;
    } catch (error) {
        console.error('Permission error:', error);
        alert('Please grant camera and location permissions to use AR features');
        return false;
    }
}

startARButton.addEventListener('click', async () => {
    const permissionsGranted = await requestPermissions();
    
    if (permissionsGranted) {
        uiContainer.style.display = 'none';
        arScene.style.display = 'block';
        initAR();
    }
});

function initAR() {
    camera = document.querySelector('[gps-camera]');
    raycaster = new THREE.Raycaster();
    const drawingsContainer = document.getElementById('drawings');

    // Initialize AR scene
    const scene = document.querySelector('a-scene');
    scene.addEventListener('loaded', () => {
        console.log('AR Scene loaded');
        // Load existing drawings once we have the user's location
        loadNearbyDrawings();
    });

    // Add error handling for GPS
    camera.addEventListener('gps-camera-update-position', () => {
        console.log('GPS position updated');
    });

    camera.addEventListener('gps-camera-update-position-error', (error) => {
        console.error('GPS error:', error);
        alert('GPS position error. Please ensure location services are enabled.');
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
        width: Math.random() * 0.03 + 0.01
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
        
        // Save the drawing to Firebase
        saveDrawingToFirebase(currentStroke);
    }
    currentStroke.points = [];
}

function addPoint(touch) {
    // Convert touch coordinates to normalized device coordinates
    const ndcX = (touch.clientX / window.innerWidth) * 2 - 1;
    const ndcY = -(touch.clientY / window.innerHeight) * 2 + 1;

    // Get camera direction
    const cameraEl = document.querySelector('[gps-camera]');
    const cameraObject3D = cameraEl.object3D;
    const cameraPosition = new THREE.Vector3();
    const cameraDirection = new THREE.Vector3();
    
    cameraObject3D.getWorldPosition(cameraPosition);
    cameraObject3D.getWorldDirection(cameraDirection);

    // Calculate point position based on camera direction
    const point = new THREE.Vector3(
        cameraPosition.x + cameraDirection.x * drawingDistance + ndcX,
        cameraPosition.y + cameraDirection.y * drawingDistance + ndcY,
        cameraPosition.z + cameraDirection.z * drawingDistance
    );

    currentStroke.points.push(point);
}

function createCurvedLine(points, color, width) {
    if (points.length < 2) return;

    const curve = new THREE.CatmullRomCurve3(points);

    const geometry = new THREE.TubeGeometry(
        curve,
        points.length * 3,
        width,
        8,
        false
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

// Function to save drawing to Firebase
async function saveDrawingToFirebase(stroke) {
    try {
        const docRef = await addDoc(collection(db, "drawings"), {
            points: stroke.points.map(p => ({ x: p.x, y: p.y, z: p.z })),
            color: stroke.color,
            width: stroke.width,
            timestamp: new Date(),
            location: {
                lat: camera.getAttribute('gps-camera').latitude,
                lng: camera.getAttribute('gps-camera').longitude
            }
        });
        console.log("Drawing saved with ID: ", docRef.id);
    } catch (e) {
        console.error("Error saving drawing: ", e);
    }
}

// Function to calculate distance between two points in kilometers
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

// Function to load nearby drawings from Firebase
async function loadNearbyDrawings() {
    if (!camera) return;
    
    const userLat = camera.getAttribute('gps-camera').latitude;
    const userLng = camera.getAttribute('gps-camera').longitude;
    
    try {
        // Create a ~100m box around the user's location
        const lat = 0.001; // roughly 100m in latitude
        const lng = 0.001 / Math.cos(userLat * Math.PI / 180); // adjust for longitude
        
        const drawingsRef = collection(db, "drawings");
        const q = query(drawingsRef, 
            where('location.lat', '>=', userLat - lat),
            where('location.lat', '<=', userLat + lat)
        );
        
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
            const drawing = doc.data();
            
            // Additional longitude filter (since we can only query on one field)
            if (drawing.location.lng >= userLng - lng && 
                drawing.location.lng <= userLng + lng) {
                    
                const points = drawing.points.map(p => new THREE.Vector3(p.x, p.y, p.z));
                createCurvedLine(points, drawing.color, drawing.width);
            }
        });
        
        console.log("Nearby drawings loaded successfully");
    } catch (e) {
        console.error("Error loading nearby drawings: ", e);
    }
} 