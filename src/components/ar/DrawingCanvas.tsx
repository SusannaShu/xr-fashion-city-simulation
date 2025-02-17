import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { DrawingService } from '../../services/ar/drawingService';
import styles from './DrawingCanvas.module.css';

interface DrawingCanvasProps {
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

  const startDrawing = (event: React.PointerEvent) => {
    if (!isActive || !canvasRef.current) return;

    setIsDrawing(true);
    onDrawingStart?.();

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    drawingService.startStroke({
      color: selectedColor,
      width: strokeWidth,
      opacity: 0.8,
    });

    addPoint(event);
  };

  const addPoint = (event: React.PointerEvent) => {
    if (!isDrawing || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    // Convert 2D screen coordinates to 3D world coordinates
    // This is a simplified version - in reality, you'd need to use
    // raycasting or other techniques to get proper 3D coordinates
    const point = new THREE.Vector3(
      (x * 2 - 1) * 2, // Scale to world space
      -(y * 2 - 1) * 2, // Flip Y and scale to world space
      -2 // Fixed distance from camera
    );

    drawingService.addPoint(point, event.pressure);
  };

  const endDrawing = () => {
    if (!isDrawing) return;

    setIsDrawing(false);
    drawingService.endStroke();
    onDrawingEnd?.();
  };

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
