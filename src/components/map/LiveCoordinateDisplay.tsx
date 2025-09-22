import React, { useState, useEffect, useCallback, useRef } from 'react';
import { themeClasses, iconColors } from '../../utils/lightThemeHelper';

interface LiveCoordinateDisplayProps {
  map: google.maps.Map | null;
}

interface Coordinates {
  lat: number;
  lng: number;
  elevation?: number;
}

const LiveCoordinateDisplay: React.FC<LiveCoordinateDisplayProps> = ({ map }) => {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [elevationHistory, setElevationHistory] = useState<Array<{lat: number, lng: number, elevation: number}>>([]);
  const [elevationService, setElevationService] = useState<google.maps.ElevationService | null>(null);

  // Get elevation for coordinates
  const getElevation = useCallback(async (lat: number, lng: number) => {
    if (!elevationService) return null;

    return new Promise<number | null>((resolve) => {
      elevationService.getElevationForLocations({
        locations: [{ lat, lng }]
      }, (results, status) => {
        if (status === google.maps.ElevationStatus.OK && results && results[0]) {
          resolve(results[0].elevation);
        } else {
          resolve(null);
        }
      });
    });
  }, [elevationService]);

  // Use refs to maintain stable references and prevent useEffect loops
  const handleMouseMoveRef = useRef<((event: google.maps.MapMouseEvent) => void) | undefined>(undefined);
  const handleMouseOutRef = useRef<(() => void) | undefined>(undefined);

  // Update refs with current functions
  handleMouseMoveRef.current = (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      // Immediately show coordinates for responsiveness
      setCoordinates({ lat, lng, elevation: undefined });
      setIsVisible(true);

      // Get elevation for current position (non-blocking)
      getElevation(lat, lng).then(elevation => {
        setCoordinates({ lat, lng, elevation: elevation || undefined });

        // Add to elevation history (keep last 50 points for high/low calculation)
        if (elevation !== null) {
          setElevationHistory(prev => {
            const newHistory = [...prev, { lat, lng, elevation }];
            return newHistory.slice(-50); // Keep only last 50 points
          });
        }
      }).catch(error => {
        // Handle elevation service errors gracefully
        setCoordinates({ lat, lng, elevation: undefined });
      });
    }
  };

  handleMouseOutRef.current = () => {
    setIsVisible(false);
  };

  useEffect(() => {
    if (!map) return;

    // Initialize elevation service only once
    if (!elevationService) {
      setElevationService(new google.maps.ElevationService());
    }

    // Ensure map options are set for cursor tracking
    map.setOptions({
      disableDefaultUI: false,
      clickableIcons: true
    });

    // Create stable wrapper functions that call the current refs
    const stableMouseMove = (event: google.maps.MapMouseEvent) => {
      if (handleMouseMoveRef.current) {
        handleMouseMoveRef.current(event);
      }
    };

    const stableMouseOut = () => {
      if (handleMouseOutRef.current) {
        handleMouseOutRef.current();
      }
    };

    // Add multiple event listeners for better coverage
    const mouseMoveListener = map.addListener('mousemove', stableMouseMove);
    const mouseOutListener = map.addListener('mouseout', stableMouseOut);

    // Also listen for center_changed to ensure coordinates update on map interaction
    const centerChangedListener = map.addListener('center_changed', () => {
      const center = map.getCenter();
      if (center) {
        setCoordinates({
          lat: center.lat(),
          lng: center.lng(),
          elevation: undefined
        });
        setIsVisible(true);
      }
    });

    return () => {
      if (mouseMoveListener) mouseMoveListener.remove();
      if (mouseOutListener) mouseOutListener.remove();
      if (centerChangedListener) centerChangedListener.remove();
    };
  }, [map]); // Minimal dependencies

  // Calculate high and low points from elevation history
  const getHighLowPoints = useCallback(() => {
    if (elevationHistory.length < 2) return { highPoint: null, lowPoint: null };

    let highPoint = elevationHistory[0];
    let lowPoint = elevationHistory[0];

    elevationHistory.forEach(point => {
      if (point.elevation > highPoint.elevation) {
        highPoint = point;
      }
      if (point.elevation < lowPoint.elevation) {
        lowPoint = point;
      }
    });

    return { highPoint, lowPoint };
  }, [elevationHistory]);

  // Format coordinates for display
  const formatCoordinate = (value: number, type: 'lat' | 'lng') => {
    const direction = type === 'lat'
      ? (value >= 0 ? 'N' : 'S')
      : (value >= 0 ? 'E' : 'W');

    const absValue = Math.abs(value);
    const degrees = Math.floor(absValue);
    const minutes = Math.floor((absValue - degrees) * 60);
    const seconds = ((absValue - degrees - minutes / 60) * 3600).toFixed(2);

    return {
      decimal: value.toFixed(6),
      dms: `${degrees}° ${minutes}' ${seconds}" ${direction}`
    };
  };

  if (!isVisible || !coordinates) {
    return null;
  }

  const latFormatted = formatCoordinate(coordinates.lat, 'lat');
  const lngFormatted = formatCoordinate(coordinates.lng, 'lng');
  const { highPoint, lowPoint } = getHighLowPoints();

  return (
    <div className="w-auto min-w-max">
      <div className="font-mono text-xs space-y-0.5 leading-tight">
        <div className="text-gray-700">
          <span className="text-blue-600 font-medium">Lat:</span> <span className="font-semibold text-gray-800">{latFormatted.decimal}</span>
        </div>
        <div className="text-gray-700">
          <span className="text-green-600 font-medium">Lng:</span> <span className="font-semibold text-gray-800">{lngFormatted.decimal}</span>
        </div>
        {coordinates.elevation !== undefined && (
          <div className="text-gray-700">
            <span className="text-purple-600 font-medium">Elev:</span> <span className="font-semibold text-gray-800">{coordinates.elevation.toFixed(1)}m</span>
          </div>
        )}
        {highPoint && lowPoint && elevationHistory.length > 5 && (
          <div className="border-t border-gray-200 pt-1 mt-1">
            <div className="text-red-600 text-xs">
              <span className="font-medium">High:</span> <span className="font-bold">{highPoint.elevation.toFixed(1)}m</span>
            </div>
            <div className="text-green-600 text-xs">
              <span className="font-medium">Low:</span> <span className="font-bold">{lowPoint.elevation.toFixed(1)}m</span>
            </div>
            <div className="text-gray-500 text-xs">
              <span className="font-medium">Range:</span> <span className="font-bold">{(highPoint.elevation - lowPoint.elevation).toFixed(1)}m</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveCoordinateDisplay;