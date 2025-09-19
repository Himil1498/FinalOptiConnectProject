import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { toggleDrawingMode, toggleMeasurementMode, toggleLayer } from '../../store/slices/mapSlice';
import {
  MapIcon,
  PencilIcon,
  HomeIcon,
  PlusIcon,
  MinusIcon,
  Square3Stack3DIcon
} from '@heroicons/react/24/outline';

interface GoogleMapControlsProps {
  map: google.maps.Map | null;
}

const GoogleMapControls: React.FC<GoogleMapControlsProps> = ({ map }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { drawingMode, measurementMode, layers } = useSelector((state: RootState) => state.map);

  const handleZoomIn = () => {
    if (map) {
      const currentZoom = map.getZoom();
      if (currentZoom !== undefined) {
        map.setZoom(currentZoom + 1);
      }
    }
  };

  const handleZoomOut = () => {
    if (map) {
      const currentZoom = map.getZoom();
      if (currentZoom !== undefined) {
        map.setZoom(currentZoom - 1);
      }
    }
  };

  const handleResetView = () => {
    if (map) {
      map.setCenter({ lat: 20.5937, lng: 78.9629 });
      map.setZoom(5);
    }
  };

  const handleToggleDrawing = () => {
    dispatch(toggleDrawingMode());
    // You can add Google Maps Drawing Manager here
  };

  const handleToggleMeasurement = () => {
    dispatch(toggleMeasurementMode());
    // You can add Google Maps measurement tools here
  };

  const handleToggleLayer = (layerId: string) => {
    dispatch(toggleLayer(layerId));
  };

  return (
    <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-2 space-y-2">
      <div className="flex flex-col space-y-1">
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Zoom In"
        >
          <PlusIcon className="h-5 w-5" />
        </button>

        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Zoom Out"
        >
          <MinusIcon className="h-5 w-5" />
        </button>

        <button
          onClick={handleResetView}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Reset View"
        >
          <HomeIcon className="h-5 w-5" />
        </button>
      </div>

      <hr className="border-gray-200" />

      <div className="flex flex-col space-y-1">
        <button
          onClick={handleToggleDrawing}
          className={`p-2 rounded transition-colors ${
            drawingMode
              ? 'bg-primary-100 text-primary-600'
              : 'hover:bg-gray-100'
          }`}
          title="Drawing Tools"
        >
          <PencilIcon className="h-5 w-5" />
        </button>

        <button
          onClick={handleToggleMeasurement}
          className={`p-2 rounded transition-colors ${
            measurementMode
              ? 'bg-primary-100 text-primary-600'
              : 'hover:bg-gray-100'
          }`}
          title="Measurement Tools"
        >
          <MapIcon className="h-5 w-5" />
        </button>
      </div>

      <hr className="border-gray-200" />

      <div className="flex flex-col space-y-1">
        <div className="p-2">
          <Square3Stack3DIcon className="h-5 w-5 text-gray-600 mb-2" />
          <div className="space-y-1">
            {layers.map(layer => (
              <label key={layer.id} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={layer.visible}
                  onChange={() => handleToggleLayer(layer.id)}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <span className="text-xs">{layer.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleMapControls;