import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Camera } from 'three';
import { DrawingService } from '../../services/ar/drawingService';
import styles from './DrawingCanvas.module.css';

interface DrawingCanvasProps {
  camera: Camera;
  isActive?: boolean;
  onDrawingStart?: () => void;
  onDrawingEnd?: () => void;
}

const COLORS = [
  '#FFFFFF', // White
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
];

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  camera,
  isActive = false,
  onDrawingStart,
  onDrawingEnd,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState(0.01);
  const drawingService = DrawingService.getInstance();

  useEffect(() => {
    if (!isActive) {
      endDrawing();
    }
  }, [isActive]);

  const calculateDrawingPoint = (
    clientX: number,
    clientY: number
  ): THREE.Vector3 => {
    const position = new THREE.Vector3();
    const direction = new THREE.Vector3();

    // Get camera position and direction
    position.copy(camera.position);
    camera.getWorldDirection(direction);

    // Calculate point in 3D space
    const point = new THREE.Vector3(
      (clientX / window.innerWidth) * 2 - 1,
      -(clientY / window.innerHeight) * 2 + 1,
      0.5
    );

    // Project point into 3D space
    point.unproject(camera);
    point.sub(position).normalize();

    // Set drawing point at a fixed distance from camera
    const drawingDistance = 2; // meters
    point.multiplyScalar(drawingDistance);
    point.add(position);

    return point;
  };

  const startDrawing = (event: React.PointerEvent | TouchEvent) => {
    if (!isActive || !canvasRef.current) return;

    setIsDrawing(true);
    onDrawingStart?.();

    drawingService.startStroke({
      color: selectedColor,
      width: strokeWidth,
      opacity: 0.8,
    });

    const clientX =
      'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY =
      'touches' in event ? event.touches[0].clientY : event.clientY;
    const point = calculateDrawingPoint(clientX, clientY);
    drawingService.addPoint(point);
  };

  const addPoint = (event: React.PointerEvent | TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;

    const clientX =
      'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY =
      'touches' in event ? event.touches[0].clientY : event.clientY;
    const point = calculateDrawingPoint(clientX, clientY);

    const pressure = 'pressure' in event ? event.pressure : 1;
    drawingService.addPoint(point, pressure);
  };

  const endDrawing = () => {
    if (!isDrawing) return;

    setIsDrawing(false);
    drawingService.endStroke();
    onDrawingEnd?.();
  };

  useEffect(() => {
    if (!camera) return;

    const handleTouchStart = (event: TouchEvent) => {
      event.preventDefault();
      startDrawing(event);
    };

    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault();
      addPoint(event);
    };

    const handleTouchEnd = () => {
      endDrawing();
    };

    // Add touch event listeners for mobile
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [camera, isDrawing]);

  return (
    <>
      <div
        ref={canvasRef}
        className={styles.canvas}
        data-active={isActive}
        onPointerDown={startDrawing}
        onPointerMove={addPoint}
        onPointerUp={endDrawing}
        onPointerLeave={endDrawing}
      />
      {isActive && (
        <div className={styles.colorPicker}>
          {COLORS.map(color => (
            <button
              key={color}
              className={styles.colorButton}
              style={{ backgroundColor: color }}
              data-active={color === selectedColor}
              onClick={() => setSelectedColor(color)}
            />
          ))}
          <input
            type="range"
            className={styles.sizeControl}
            min="0.001"
            max="0.05"
            step="0.001"
            value={strokeWidth}
            onChange={e => setStrokeWidth(parseFloat(e.target.value))}
          />
        </div>
      )}
    </>
  );
};

export default DrawingCanvas;
