import React, { useState } from 'react';
import { convertStringToMapTypeId } from '../../utils/mapRestrictions';
import {
  MapIcon,
  PhotoIcon,
  GlobeAltIcon,
  EyeIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

interface MapTypeOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

interface StyleOption {
  id: string;
  name: string;
  description: string;
}

interface MapTypeSelectorProps {
  currentMapType: string;
  onMapTypeChange: (mapTypeId: google.maps.MapTypeId) => void;
  onStyleChange: (styleId: string) => void;
  className?: string;
}

const MapTypeSelector: React.FC<MapTypeSelectorProps> = ({
  currentMapType,
  onMapTypeChange,
  onStyleChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'types' | 'styles'>('types');

  const mapTypes: MapTypeOption[] = [
    {
      id: "roadmap",
      name: 'Map',
      icon: <MapIcon className="h-4 w-4" />,
      description: 'Default roadmap view',
    },
    {
      id: "satellite",
      name: 'Satellite',
      icon: <PhotoIcon className="h-4 w-4" />,
      description: 'Satellite imagery',
    },
    {
      id: "hybrid",
      name: 'Hybrid',
      icon: <GlobeAltIcon className="h-4 w-4" />,
      description: 'Satellite with labels',
    },
    {
      id: "terrain",
      name: 'Terrain',
      icon: <EyeIcon className="h-4 w-4" />,
      description: 'Terrain features',
    },
  ];

  const styleOptions: StyleOption[] = [
    {
      id: 'default',
      name: 'Default',
      description: 'Standard Google Maps styling',
    },
    {
      id: 'dark',
      name: 'Dark Mode',
      description: 'Dark theme for night viewing',
    },
    {
      id: 'retro',
      name: 'Retro',
      description: 'Vintage map appearance',
    },
  ];

  const getCurrentMapType = () => {
    return mapTypes.find(type => type.id === currentMapType) || mapTypes[0];
  };

  const handleMapTypeSelect = (mapTypeId: google.maps.MapTypeId) => {
    onMapTypeChange(mapTypeId);
    setIsOpen(false);
  };

  const handleStyleSelect = (styleId: string) => {
    onStyleChange(styleId);
    setIsOpen(false);
  };

  const currentType = getCurrentMapType();

  return (
    <div className={`absolute top-4 right-4 z-10 ${className}`}>
      <div className="relative">
        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-3 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group"
          aria-label="Map type selector"
        >
          <div className="text-blue-600">
            {currentType.icon}
          </div>
          <span className="group-hover:text-blue-600 transition-colors">{currentType.name}</span>
          <ChevronDownIcon
            className={`h-4 w-4 transition-all duration-200 group-hover:text-blue-600 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <div className="absolute top-full right-0 mt-3 w-80 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200/50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('types')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'types'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Map Types
              </button>
              <button
                onClick={() => setActiveTab('styles')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'styles'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Styles
              </button>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {activeTab === 'types' && (
                <div className="p-2">
                  <div className="space-y-1">
                    {mapTypes.map((mapType) => (
                      <button
                        key={mapType.id}
                        onClick={() => handleMapTypeSelect(convertStringToMapTypeId(mapType.id))}
                        className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors ${
                          currentMapType === mapType.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <div className={`p-2 rounded-md ${
                          currentMapType === mapType.id
                            ? 'bg-blue-200 text-blue-600'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {mapType.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{mapType.name}</div>
                          <div className="text-xs text-gray-500">
                            {mapType.description}
                          </div>
                        </div>
                        {currentMapType === mapType.id && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'styles' && (
                <div className="p-2">
                  <div className="space-y-1">
                    {styleOptions.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => handleStyleSelect(style.id)}
                        className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left hover:bg-gray-100 text-gray-700 transition-colors"
                      >
                        <div className="w-6 h-6 rounded border-2 border-gray-300 flex-shrink-0">
                          {/* Style preview could go here */}
                          <div className={`w-full h-full rounded ${
                            style.id === 'dark' ? 'bg-gray-800' :
                            style.id === 'retro' ? 'bg-yellow-100' :
                            'bg-white'
                          }`}></div>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{style.name}</div>
                          <div className="text-xs text-gray-500">
                            {style.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-3 bg-gray-50">
              <div className="text-xs text-gray-500 text-center">
                Click outside to close • ESC to cancel
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default MapTypeSelector;