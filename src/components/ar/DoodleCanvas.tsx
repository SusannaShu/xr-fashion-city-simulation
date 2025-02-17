import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { DatabaseService } from '../../services/firebase/database';

interface DoodleCanvasProps {
  camera: THREE.Camera;
  drawingDistance?: number;
}

interface Stroke {
  points: THREE.Vector3[];
  color: string;
  width: number;
}

export const DoodleCanvas: React.FC<DoodleCanvasProps> = ({
  camera,
  drawingDistance = -1,
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStrokeRef = useRef<Stroke>({
    points: [],
    color: getRandomPinkShade(),
    width: Math.random() * 0.03 + 0.01,
  });

  useEffect(() => {
    const handleTouchStart = async (event: TouchEvent) => {
      if (
        typeof DeviceOrientationEvent !== 'undefined' &&
        typeof (DeviceOrientationEvent as any).requestPermission === 'function'
      ) {
        try {
          const response = await (
            DeviceOrientationEvent as any
          ).requestPermission();
          if (response === 'granted') {
            startDrawing(event);
          }
        } catch (error) {
          console.error(
            'Error requesting device orientation permission:',
            error
          );
        }
      } else {
        startDrawing(event);
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!isDrawing) return;
      const touch = event.touches[0];
      addPoint(touch);
      if (currentStrokeRef.current.points.length >= 2) {
        createCurvedLine();
      }
    };

    const handleTouchEnd = () => {
      if (!isDrawing) return;
      setIsDrawing(false);
      if (currentStrokeRef.current.points.length >= 2) {
        createCurvedLine();
        saveDrawing();
      }
      currentStrokeRef.current.points = [];
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDrawing, camera]);

  const startDrawing = (event: TouchEvent) => {
    setIsDrawing(true);
    currentStrokeRef.current = {
      points: [],
      color: getRandomPinkShade(),
      width: Math.random() * 0.03 + 0.01,
    };
    const touch = event.touches[0];
    addPoint(touch);
  };

  const addPoint = (touch: Touch) => {
    const ndcX = (touch.clientX / window.innerWidth) * 2 - 1;
    const ndcY = -(touch.clientY / window.innerHeight) * 2 + 1;

    const cameraPosition = new THREE.Vector3();
    const cameraDirection = new THREE.Vector3();

    camera.getWorldPosition(cameraPosition);
    camera.getWorldDirection(cameraDirection);

    const point = new THREE.Vector3(
      cameraPosition.x + cameraDirection.x * drawingDistance + ndcX,
      cameraPosition.y + cameraDirection.y * drawingDistance + ndcY,
      cameraPosition.z + cameraDirection.z * drawingDistance
    );

    currentStrokeRef.current.points.push(point);
  };

  const createCurvedLine = () => {
    const { points, color, width } = currentStrokeRef.current;
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
      color,
      metalness: 0.5,
      roughness: 0.5,
      emissive: color,
      emissiveIntensity: 0.2,
    });

    const mesh = new THREE.Mesh(geometry, material);
    const drawingsContainer = document.querySelector('#drawings');
    if (drawingsContainer) {
      const entity = document.createElement('a-entity');
      entity.setObject3D('mesh', mesh);
      drawingsContainer.appendChild(entity);
    }
  };

  const saveDrawing = async () => {
    const { points, color, width } = currentStrokeRef.current;
    if (!camera || points.length < 2) return;

    try {
      const cameraEl = camera.el;
      if (!cameraEl) return;

      const gpsCamera = cameraEl.components['gps-camera'];
      if (!gpsCamera) return;

      await DatabaseService.saveDrawing({
        points: points.map(p => ({ x: p.x, y: p.y, z: p.z })),
        color,
        width,
        location: {
          lat: gpsCamera.latitude,
          lng: gpsCamera.longitude,
        },
      });
    } catch (error) {
      console.error('Error saving drawing:', error);
    }
  };

  return null; // This is a behavior component, no rendering needed
};

const getRandomPinkShade = (): string => {
  const pinkShades = [
    '#FF1493', // Deep pink
    '#FF69B4', // Hot pink
    '#FFB6C1', // Light pink
    '#FF82AB', // Pale violet red
    '#FF34B3', // Rose pink
  ];
  return pinkShades[Math.floor(Math.random() * pinkShades.length)];
};

export default DoodleCanvas;
