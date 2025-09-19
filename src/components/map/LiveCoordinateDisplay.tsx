import React, { useState, useEffect, useCallback } from 'react';
import { themeClasses, iconColors } from '../../utils/lightThemeHelper';

interface LiveCoordinateDisplayProps {
  map: google.maps.Map | null;
}

interface Coordinates {
  lat: number;
  lng: number;
}

const LiveCoordinateDisplay: React.FC<LiveCoordinateDisplayProps> = ({ map }) => {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const handleMouseMove = useCallback((event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      setCoordinates({ lat, lng });
      setIsVisible(true);
    }
  }, []);

  const handleMouseOut = useCallback(() => {
    setIsVisible(false);
  }, []);

  useEffect(() => {
    if (map) {
      const mouseMoveListener = map.addListener('mousemove', handleMouseMove);
      const mouseOutListener = map.addListener('mouseout', handleMouseOut);

      return () => {
        if (mouseMoveListener) mouseMoveListener.remove();
        if (mouseOutListener) mouseOutListener.remove();
      };
    }
  }, [map, handleMouseMove, handleMouseOut]);

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

  return (
    <div className="w-auto min-w-max">
      <div className="font-mono text-xs space-y-0.5 leading-tight">
        <div className="text-gray-700">
          <span className="text-blue-600 font-medium">Lat:</span> <span className="font-semibold text-gray-800">{latFormatted.decimal}</span>
        </div>
        <div className="text-gray-700">
          <span className="text-green-600 font-medium">Lng:</span> <span className="font-semibold text-gray-800">{lngFormatted.decimal}</span>
        </div>
      </div>
    </div>
  );
};

export default LiveCoordinateDisplay;