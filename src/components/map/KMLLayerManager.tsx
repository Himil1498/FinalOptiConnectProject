import React, { useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useKMLLayers, KMLLayerConfig } from '../../hooks/useKMLLayers';
import AddPOPLocationForm, { POPLocationData } from './AddPOPLocationForm';

interface KMLLayerManagerProps {
  map: google.maps.Map | null;
  onLayerToggle?: (layerType: string, isVisible: boolean) => void;
  onDataLoaded?: (data: any[]) => void;
  onLocationAdd?: (location: POPLocationData) => void;
}

const KMLLayerManager: React.FC<KMLLayerManagerProps> = ({
  map,
  onLayerToggle,
  onDataLoaded,
  onLocationAdd
}) => {
  const { uiState } = useTheme();
  const [showAddForm, setShowAddForm] = useState(false);
  const [mapClickListener, setMapClickListener] = useState<google.maps.MapsEventListener | null>(null);
  const [pendingCoordinates, setPendingCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);

  // Configure KML layers
  const kmlLayerConfigs: KMLLayerConfig[] = [
    {
      url: `${window.location.origin}/pop_location.kml`,
      name: 'pop',
      type: 'pop' as const,
      visible: false
    },
    {
      url: `${window.location.origin}/sub_pop_location.kml`,
      name: 'subPop',
      type: 'subPop' as const,
      visible: false
    }
  ];

  const {
    toggleLayer,
    isLayerVisible,
    getAllData,
    getDataByType,
    loading,
    error
  } = useKMLLayers(map, kmlLayerConfigs);

  // Handle layer toggle with callback
  const handleLayerToggle = (layerName: string) => {
    toggleLayer(layerName);
    const newVisibility = !isLayerVisible(layerName);
    onLayerToggle?.(layerName, newVisibility);

    // Notify parent component of loaded data when layers are shown
    if (newVisibility && onDataLoaded) {
      const allData = getAllData();
      onDataLoaded(allData);
    }
  };

  // Handle enabling map click for location selection
  const handleSelectLocationFromMap = () => {
    if (!map) return;

    setIsSelectingLocation(true);

    // Add click listener to map
    const listener = map.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const coordinates = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        };

        setPendingCoordinates(coordinates);
        setShowAddForm(true);
        setIsSelectingLocation(false);

        // Remove the click listener
        if (mapClickListener) {
          google.maps.event.removeListener(mapClickListener);
          setMapClickListener(null);
        }
      }
    });

    setMapClickListener(listener);
  };

  // Handle canceling location selection
  const handleCancelLocationSelection = () => {
    setIsSelectingLocation(false);
    if (mapClickListener) {
      google.maps.event.removeListener(mapClickListener);
      setMapClickListener(null);
    }
  };

  // Handle opening form with manual coordinates
  const handleAddManually = () => {
    setPendingCoordinates(null);
    setShowAddForm(true);
  };

  // Handle saving new location
  const handleSaveLocation = (locationData: POPLocationData) => {
    onLocationAdd?.(locationData);
    setShowAddForm(false);
    setPendingCoordinates(null);
  };

  // Handle closing form
  const handleCloseForm = () => {
    setShowAddForm(false);
    setPendingCoordinates(null);
    handleCancelLocationSelection();
  };

  const isDark = uiState.theme.mode === 'dark';

  if (loading) {
    return (
      <div className={`kml-layer-manager p-4 rounded-lg shadow-lg ${
        isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm">Loading infrastructure data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`kml-layer-manager p-4 rounded-lg shadow-lg ${
        isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        <div className="text-red-600 text-sm">
          <p className="font-medium">Error loading KML data:</p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`kml-layer-manager p-4 rounded-lg shadow-lg ${
      isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
    }`}>
      <div className="mb-3">
        <h3 className="text-lg font-semibold mb-3">Infrastructure Layers</h3>

        <div className="space-y-3">
          {/* POP Layer Toggle */}
          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isLayerVisible('pop')}
                onChange={() => handleLayerToggle('pop')}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="ml-2 text-sm font-medium">
                POP Locations ({getDataByType('pop').length})
              </span>
            </label>
            <span className={`text-xs px-2 py-1 rounded ${
              isLayerVisible('pop')
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              {isLayerVisible('pop') ? 'Visible' : 'Hidden'}
            </span>
          </div>

          {/* Sub POP Layer Toggle */}
          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isLayerVisible('subPop')}
                onChange={() => handleLayerToggle('subPop')}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="ml-2 text-sm font-medium">
                Sub POP Locations ({getDataByType('subPop').length})
              </span>
            </label>
            <span className={`text-xs px-2 py-1 rounded ${
              isLayerVisible('subPop')
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              {isLayerVisible('subPop') ? 'Visible' : 'Hidden'}
            </span>
          </div>
        </div>

        {/* Add New Location Section */}
        <div className={`mt-4 p-3 rounded border-t ${
          isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
        }`}>
          <h4 className="text-sm font-medium mb-3">Add New Location</h4>

          {isSelectingLocation ? (
            <div className="space-y-2">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                📍 Click on the map to select location
              </p>
              <button
                onClick={handleCancelLocationSelection}
                className={`w-full px-3 py-2 text-xs rounded border ${
                  isDark
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-600'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Cancel Selection
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleSelectLocationFromMap}
                className={`w-full px-3 py-2 text-xs rounded ${
                  isDark
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                📍 Select from Map
              </button>
              <button
                onClick={handleAddManually}
                className={`w-full px-3 py-2 text-xs rounded border ${
                  isDark
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-600'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                ✏️ Add Manually
              </button>
            </div>
          )}
        </div>

        {/* Layer Info */}
        {(isLayerVisible('pop') || isLayerVisible('subPop')) && (
          <div className={`mt-4 p-3 rounded ${
            isDark ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Click on markers to view detailed information about each location.
            </p>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
              Total infrastructure points: {getAllData().length}
            </div>
          </div>
        )}
      </div>

      {/* Add Location Form */}
      <AddPOPLocationForm
        isOpen={showAddForm}
        onClose={handleCloseForm}
        onSave={handleSaveLocation}
        initialCoordinates={pendingCoordinates || undefined}
      />
    </div>
  );
};

export default KMLLayerManager;