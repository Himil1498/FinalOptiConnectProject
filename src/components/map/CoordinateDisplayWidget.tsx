import React, { useState, useCallback } from 'react';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

interface CoordinateDisplayWidgetProps {
  coordinates: google.maps.LatLngLiteral;
  format: 'decimal' | 'dms';
  precision: number;
  className?: string;
}

const CoordinateDisplayWidget: React.FC<CoordinateDisplayWidgetProps> = ({
  coordinates,
  format,
  precision,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  // Convert decimal degrees to DMS (Degrees, Minutes, Seconds)
  const convertToDMS = useCallback((decimal: number, isLatitude: boolean): string => {
    const direction = isLatitude
      ? (decimal >= 0 ? 'N' : 'S')
      : (decimal >= 0 ? 'E' : 'W');

    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutesFloat = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesFloat);
    const seconds = (minutesFloat - minutes) * 60;

    return `${degrees}°${minutes}'${seconds.toFixed(2)}"${direction}`;
  }, []);

  // Format coordinates based on the selected format
  const formatCoordinates = useCallback((): { lat: string; lng: string; combined: string } => {
    if (format === 'dms') {
      const lat = convertToDMS(coordinates.lat, true);
      const lng = convertToDMS(coordinates.lng, false);
      return {
        lat,
        lng,
        combined: `${lat}, ${lng}`,
      };
    } else {
      const lat = coordinates.lat.toFixed(precision);
      const lng = coordinates.lng.toFixed(precision);
      return {
        lat,
        lng,
        combined: `${lat}, ${lng}`,
      };
    }
  }, [coordinates, format, precision, convertToDMS]);

  const handleCopyToClipboard = useCallback(async () => {
    try {
      const formatted = formatCoordinates();
      await navigator.clipboard.writeText(formatted.combined);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy coordinates:', error);
    }
  }, [formatCoordinates]);

  const formatted = formatCoordinates();

  return (
    <div className={`absolute bottom-4 left-4 z-10 ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-3 min-w-64">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-xs text-gray-500 mb-1 font-medium">
              Coordinates ({format.toUpperCase()})
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-600 w-8">Lat:</span>
                <span className="text-sm font-mono text-gray-900">
                  {formatted.lat}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-600 w-8">Lng:</span>
                <span className="text-sm font-mono text-gray-900">
                  {formatted.lng}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleCopyToClipboard}
            className="ml-2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Copy coordinates"
            aria-label="Copy coordinates to clipboard"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4 text-green-600" />
            ) : (
              <ClipboardDocumentIcon className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Elevation Display (if available) */}
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">
              Precision: ±{format === 'decimal' ? `${Math.pow(10, -precision)} deg` : '1"'}
            </span>
            <span className="text-gray-400 text-xs">
              Hover to update
            </span>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-2 text-xs text-gray-400">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-medium">Format:</span>{' '}
              {format === 'decimal' ? 'Decimal' : 'DMS'}
            </div>
            <div>
              <span className="font-medium">Datum:</span> WGS84
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoordinateDisplayWidget;