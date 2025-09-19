import React, { useRef, useEffect, useCallback } from 'react';
import { DrawingMode } from '../../types';

interface DrawingManagerProps {
  map: google.maps.Map | null;
  drawingMode: DrawingMode;
  onOverlayComplete?: (overlay: google.maps.drawing.OverlayCompleteEvent) => void;
  onDrawingModeChanged?: (mode: google.maps.drawing.OverlayType | null) => void;
}

const DrawingManager: React.FC<DrawingManagerProps> = ({
  map,
  drawingMode,
  onOverlayComplete,
  onDrawingModeChanged,
}) => {
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);

  const initializeDrawingManager = useCallback(() => {
    if (!map || !window.google?.maps?.drawing) {
      console.warn('Google Maps Drawing library not loaded');
      return;
    }

    if (drawingManagerRef.current) {
      drawingManagerRef.current.setMap(null);
    }

    const drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: drawingMode.enabled ? getGoogleDrawingMode(drawingMode.mode) : null,
      drawingControl: false, // We'll use custom controls
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [
          google.maps.drawing.OverlayType.MARKER,
          google.maps.drawing.OverlayType.POLYGON,
          google.maps.drawing.OverlayType.POLYLINE,
          google.maps.drawing.OverlayType.CIRCLE,
          google.maps.drawing.OverlayType.RECTANGLE,
        ],
      },
      markerOptions: {
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#FF4444"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 24),
        },
        draggable: true,
      },
      polygonOptions: {
        fillColor: '#3B82F6',
        fillOpacity: 0.2,
        strokeWeight: 2,
        strokeColor: '#3B82F6',
        clickable: true,
        editable: true,
        zIndex: 1,
      },
      polylineOptions: {
        strokeColor: '#EF4444',
        strokeWeight: 3,
        clickable: true,
        editable: true,
        zIndex: 1,
      },
      circleOptions: {
        fillColor: '#10B981',
        fillOpacity: 0.2,
        strokeWeight: 2,
        strokeColor: '#10B981',
        clickable: true,
        editable: true,
        zIndex: 1,
      },
      rectangleOptions: {
        fillColor: '#F59E0B',
        fillOpacity: 0.2,
        strokeWeight: 2,
        strokeColor: '#F59E0B',
        clickable: true,
        editable: true,
        zIndex: 1,
      },
      ...drawingMode.options,
    });

    // Add event listeners
    if (onOverlayComplete) {
      drawingManager.addListener('overlaycomplete', onOverlayComplete);
    }

    if (onDrawingModeChanged) {
      drawingManager.addListener('drawingmode_changed', () => {
        const mode = drawingManager.getDrawingMode();
        onDrawingModeChanged(mode);
      });
    }

    drawingManagerRef.current = drawingManager;
    drawingManager.setMap(map);
  }, [map, drawingMode, onOverlayComplete, onDrawingModeChanged]);

  // Helper function to convert our drawing mode to Google's enum
  const getGoogleDrawingMode = (mode: DrawingMode['mode']): google.maps.drawing.OverlayType | null => {
    switch (mode) {
      case 'marker':
        return google.maps.drawing.OverlayType.MARKER;
      case 'polygon':
        return google.maps.drawing.OverlayType.POLYGON;
      case 'polyline':
        return google.maps.drawing.OverlayType.POLYLINE;
      case 'circle':
        return google.maps.drawing.OverlayType.CIRCLE;
      case 'rectangle':
        return google.maps.drawing.OverlayType.RECTANGLE;
      default:
        return null;
    }
  };

  // Initialize drawing manager when map or drawing mode changes
  useEffect(() => {
    if (map && window.google?.maps?.drawing) {
      initializeDrawingManager();
    }

    return () => {
      if (drawingManagerRef.current) {
        drawingManagerRef.current.setMap(null);
      }
    };
  }, [initializeDrawingManager]);

  // Update drawing mode when it changes
  useEffect(() => {
    if (drawingManagerRef.current) {
      const googleMode = drawingMode.enabled ? getGoogleDrawingMode(drawingMode.mode) : null;
      drawingManagerRef.current.setDrawingMode(googleMode);
    }
  }, [drawingMode.enabled, drawingMode.mode]);

  // Methods to control drawing
  const setDrawingMode = useCallback((mode: google.maps.drawing.OverlayType | null) => {
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(mode);
    }
  }, []);

  const clearDrawing = useCallback(() => {
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }
  }, []);

  // This component doesn't need imperative handle for now
  // If you need to expose methods, you can do it through props or context

  return null; // This component doesn't render anything visible
};

export default DrawingManager;