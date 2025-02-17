import React, { useState } from 'react';
import styles from './ARControls.module.css';
import { DrawingService } from '../../services/ar/drawingService';
import { LocationService } from '../../services/ar/locationService';

interface ARControlsProps {
  onModeChange?: (mode: 'view' | 'draw' | 'place') => void;
  onClearDrawings?: () => void;
  onSaveDrawing?: () => void;
  onCapturePhoto?: () => void;
  isReady?: boolean;
}

export const ARControls: React.FC<ARControlsProps> = ({
  onModeChange,
  onClearDrawings,
  onSaveDrawing,
  onCapturePhoto,
  isReady = false,
}) => {
  const [activeMode, setActiveMode] = useState<'view' | 'draw' | 'place'>(
    'view'
  );
  const [isDrawing, setIsDrawing] = useState(false);

  const handleModeChange = (mode: 'view' | 'draw' | 'place') => {
    if (mode === activeMode) return;
    setActiveMode(mode);
    onModeChange?.(mode);

    // Clean up previous mode
    if (activeMode === 'draw') {
      const drawingService = DrawingService.getInstance();
      drawingService.endStroke();
    }
  };

  const handleDrawingStart = () => {
    if (!isReady || activeMode !== 'draw') return;

    setIsDrawing(true);
    const drawingService = DrawingService.getInstance();
    drawingService.startStroke({
      color: '#ffffff',
      width: 0.01,
      opacity: 0.8,
    });
  };

  const handleDrawingEnd = () => {
    if (!isReady || !isDrawing) return;

    setIsDrawing(false);
    const drawingService = DrawingService.getInstance();
    drawingService.endStroke();
  };

  const handleClearDrawings = () => {
    if (!isReady) return;

    const drawingService = DrawingService.getInstance();
    drawingService.clearStrokes();
    onClearDrawings?.();
  };

  const handleSaveDrawing = async () => {
    if (!isReady) return;

    const drawingService = DrawingService.getInstance();
    const locationService = LocationService.getInstance();

    try {
      const location = locationService.getCurrentLocation();
      if (!location) {
        throw new Error('Location not available');
      }

      const drawingData = await drawingService.saveDrawing();
      onSaveDrawing?.();
    } catch (error) {
      console.error('Failed to save drawing:', error);
    }
  };

  return (
    <div className={styles.controls}>
      <button
        className={styles.button}
        data-active={activeMode === 'view'}
        onClick={() => handleModeChange('view')}
        disabled={!isReady}
      >
        <span className="material-icons">view_in_ar</span>
        <span className={styles.tooltip}>View Mode</span>
      </button>

      <button
        className={styles.button}
        data-active={activeMode === 'draw'}
        onClick={() => handleModeChange('draw')}
        onPointerDown={handleDrawingStart}
        onPointerUp={handleDrawingEnd}
        onPointerLeave={handleDrawingEnd}
        disabled={!isReady}
      >
        <span className="material-icons">brush</span>
        <span className={styles.tooltip}>Air Graffiti</span>
      </button>

      <button
        className={styles.button}
        data-active={activeMode === 'place'}
        onClick={() => handleModeChange('place')}
        disabled={!isReady}
      >
        <span className="material-icons">add_location</span>
        <span className={styles.tooltip}>Place Model</span>
      </button>

      <button
        className={styles.button}
        onClick={handleClearDrawings}
        disabled={!isReady}
      >
        <span className="material-icons">clear_all</span>
        <span className={styles.tooltip}>Clear Drawings</span>
      </button>

      <button
        className={styles.button}
        onClick={handleSaveDrawing}
        disabled={!isReady}
      >
        <span className="material-icons">save</span>
        <span className={styles.tooltip}>Save Drawing</span>
      </button>

      <button
        className={styles.button}
        onClick={onCapturePhoto}
        disabled={!isReady}
      >
        <span className="material-icons">photo_camera</span>
        <span className={styles.tooltip}>Take Photo</span>
      </button>
    </div>
  );
};

export default ARControls;
