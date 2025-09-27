import React from 'react';
import { InfrastructureCategory, Coordinates } from '../../../types';
import { InfrastructureItem } from '../../../hooks/useInfrastructureData';

interface InfrastructureAddFormProps {
  categories: InfrastructureCategory[];
  formData: Partial<InfrastructureItem>;
  selectedCoordinates: Coordinates | null;
  map?: google.maps.Map | null;
  isSelectingLocation: boolean;
  pendingCoordinates: Coordinates | null;
  showAddLocationForm: boolean;
  onFormDataChange: (data: Partial<InfrastructureItem>) => void;
  onCoordinatesChange: (coordinates: Coordinates | null) => void;
  onShowMapPicker: () => void;
  onQuickAdd: (category: InfrastructureCategory, subCategory: any) => void;
  onSelectLocationFromMap: () => void;
  onAddManually: () => void;
  onCancelLocationSelection: () => void;
  onSaveLocation: (data: any) => void;
  onCloseAddLocationForm: () => void;
}

const InfrastructureAddForm: React.FC<InfrastructureAddFormProps> = ({
  categories,
  formData,
  selectedCoordinates,
  map,
  isSelectingLocation,
  pendingCoordinates,
  showAddLocationForm,
  onFormDataChange,
  onCoordinatesChange,
  onShowMapPicker,
  onQuickAdd,
  onSelectLocationFromMap,
  onAddManually,
  onCancelLocationSelection,
  onSaveLocation,
  onCloseAddLocationForm
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Add Cards */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Quick Add</h3>
          {categories.map(category => (
            <div key={category.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">{category.icon}</div>
                <div>
                  <h4 className="font-medium text-gray-900">{category.name}</h4>
                  <p className="text-sm text-gray-500">{category.description}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {category.subCategories.slice(0, 3).map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => onQuickAdd(category, sub)}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    Add {sub.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Manual Location Entry and Map Integration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Location Input</h3>

          {/* Map Integration Section */}
          {map && (
            <div className="bg-gray-50 rounded-lg p-4 border">
              <h4 className="text-md font-medium text-gray-900 mb-3">Add New POP/Sub POP Location</h4>

              {isSelectingLocation ? (
                <div className="relative">
                  {/* Prominent Selection Banner */}
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-lg mb-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                        <div>
                          <h4 className="font-semibold">Map Selection Active</h4>
                          <p className="text-sm opacity-90">📍 Click anywhere on the map to place a location</p>
                        </div>
                      </div>
                      <button
                        onClick={onCancelLocationSelection}
                        className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Click on any location on the map (this dialog will remain open)</li>
                      <li>• A form will open with coordinates pre-filled</li>
                      <li>• Complete the form to add your POP or Sub POP location</li>
                      <li>• You can minimize this dialog using the minimize button above</li>
                    </ul>
                  </div>

                  {/* Quick Actions while selecting */}
                  <div className="mt-4">
                    <button
                      onClick={onAddManually}
                      className="w-full group relative overflow-hidden bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white rounded-xl px-4 py-3 transform transition-all duration-300 hover:scale-102 hover:shadow-xl hover:from-orange-600 hover:via-red-600 hover:to-pink-600 active:scale-98"
                    >
                      <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative flex items-center justify-center space-x-2">
                        <span className="text-xl">✏️</span>
                        <span className="font-medium">Add Manually Instead</span>
                      </div>
                      <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -translate-y-8 translate-x-8 group-hover:translate-y-0 group-hover:translate-x-0 transition-transform duration-500"></div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Primary Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Select from Map Button */}
                    <button
                      onClick={onSelectLocationFromMap}
                      className="group relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white rounded-xl px-6 py-4 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700 active:scale-95"
                    >
                      <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative flex items-center justify-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors duration-300">
                          <span className="text-2xl">📍</span>
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-lg">Select from Map</div>
                          <div className="text-blue-100 text-sm">Click on map location</div>
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-10 translate-x-10 group-hover:translate-y-0 group-hover:translate-x-0 transition-transform duration-500"></div>
                    </button>

                    {/* Add Manually Button */}
                    <button
                      onClick={onAddManually}
                      className="group relative overflow-hidden bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white rounded-xl px-6 py-4 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 active:scale-95"
                    >
                      <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative flex items-center justify-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors duration-300">
                          <span className="text-2xl">✏️</span>
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-lg">Add Manually</div>
                          <div className="text-green-100 text-sm">Enter coordinates</div>
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-10 translate-x-10 group-hover:translate-y-0 group-hover:translate-x-0 transition-transform duration-500"></div>
                    </button>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-600 mt-3">
                Add new POP or Sub POP locations directly to the map. All required fields including coordinates will be collected in the form.
              </p>
            </div>
          )}

          {/* Manual Coordinate Entry */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manual Coordinate Entry
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="19.0760"
                      value={selectedCoordinates?.lat || ''}
                      onChange={(e) => onCoordinatesChange({
                        lat: parseFloat(e.target.value) || 0,
                        lng: selectedCoordinates?.lng || 0
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="72.8777"
                      value={selectedCoordinates?.lng || ''}
                      onChange={(e) => onCoordinatesChange({
                        lat: selectedCoordinates?.lat || 0,
                        lng: parseFloat(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className="text-sm text-gray-500 mb-2">OR</div>
                <button
                  onClick={onShowMapPicker}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  📍 Pick from Map
                </button>
              </div>

              {selectedCoordinates && (
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                  <p className="text-sm text-green-800">
                    <span className="font-medium">Selected:</span> {selectedCoordinates.lat.toFixed(6)}, {selectedCoordinates.lng.toFixed(6)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Template Selection */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Templates</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'Cell Tower', icon: '📡', priority: 'high' },
                { type: 'Fiber Node', icon: '🔗', priority: 'medium' },
                { type: 'Data Center', icon: '🏢', priority: 'critical' },
                { type: 'Relay Station', icon: '📶', priority: 'medium' }
              ].map(template => (
                <button
                  key={template.type}
                  onClick={() => onFormDataChange({
                    name: template.type,
                    priority: template.priority as any,
                    status: 'planned'
                  })}
                  className="p-3 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="text-2xl mb-1">{template.icon}</div>
                  <div className="text-xs font-medium text-gray-900">{template.type}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-gray-50 rounded-lg p-4 border">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            💡 <strong>Tip:</strong> Use quick add cards for common infrastructure types, or manually enter coordinates for precise placement.
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors">
              📋 Templates
            </button>
            <button className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors">
              📤 Import CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfrastructureAddForm;