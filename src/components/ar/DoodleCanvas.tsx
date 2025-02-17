import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { Camera } from 'three';
import { DrawingService } from '../../services/ar/drawingService';
import styles from './DoodleCanvas.module.css';

interface DoodleCanvasProps {
  camera: Camera;
}

export const DoodleCanvas: React.FC<DoodleCanvasProps> = ({ camera }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const drawingService = DrawingService.getInstance();

  const addPoint = (point: THREE.Vector3) => {
    drawingService.addPoint(point);
  };

  const startDrawing = () => {
    setIsDrawing(true);
    drawingService.startStroke({
      color: '#ffffff',
      width: 0.01,
      opacity: 0.8,
    });
  };

  const endDrawing = () => {
    setIsDrawing(false);
    drawingService.endStroke();
  };

  useEffect(() => {
    if (!camera) return;

    const handleTouchStart = async (event: TouchEvent) => {
      if (!isDrawing || !event.touches || event.touches.length === 0 || !camera)
        return;

      const touch = event.touches[0];
      const position = new THREE.Vector3();
      const direction = new THREE.Vector3();

      // Get camera position and direction
      position.copy(camera.position);
      camera.getWorldDirection(direction);

      // Calculate touch point in 3D space
      const touchPoint = new THREE.Vector3(
        (touch.clientX / window.innerWidth) * 2 - 1,
        -(touch.clientY / window.innerHeight) * 2 + 1,
        0.5
      );

      // Project touch point into 3D space
      touchPoint.unproject(camera);
      touchPoint.sub(position).normalize();

      // Set drawing point at a fixed distance from camera
      const drawingDistance = 2; // meters
      touchPoint.multiplyScalar(drawingDistance);
      touchPoint.add(position);

      addPoint(touchPoint);
    };

    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault();
      handleTouchStart(event);
    };

    const handleTouchEnd = () => {
      if (isDrawing) {
        endDrawing();
      }
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

  return (
    <div
      className={styles.canvas}
      onTouchStart={startDrawing}
      onTouchEnd={endDrawing}
    />
  );
};

export default DoodleCanvas;
