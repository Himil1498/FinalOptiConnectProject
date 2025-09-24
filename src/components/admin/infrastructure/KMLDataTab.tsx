import React from 'react';
import { usePagination } from '../../../hooks/usePagination';

interface KMLDataTabProps {
  kmlData: any[];
  filteredKMLData: any[];
  manuallyAddedData: any[];
  kmlTypeFilter: 'all' | 'pop' | 'subPop';
  kmlSearchTerm: string;
  isDark: boolean;
  map?: google.maps.Map | null;
  isSelectingLocation: boolean;
  showPOPData: boolean;
  showSubPOPData: boolean;
  onKmlTypeFilterChange: (filter: 'all' | 'pop' | 'subPop') => void;
  onKmlSearchChange: (search: string) => void;
  onTogglePOPData: (show: boolean) => void;
  onToggleSubPOPData: (show: boolean) => void;
  onExportData: () => void;
  onViewLocationOnMap: (item: any) => void;
  onViewDetails: (item: any) => void;
  onExportItem: (item: any) => void;
  onSelectLocationFromMap: () => void;
  onAddManually: () => void;
  onCancelLocationSelection: () => void;
  highlightSearchTerm: (text: string, term: string) => React.ReactNode;
}

const KMLDataTab: React.FC<KMLDataTabProps> = ({
  kmlData,
  filteredKMLData,
  manuallyAddedData,
  kmlTypeFilter,
  kmlSearchTerm,
  isDark,
  map,
  isSelectingLocation,
  showPOPData,
  showSubPOPData,
  onKmlTypeFilterChange,
  onKmlSearchChange,
  onTogglePOPData,
  onToggleSubPOPData,
  onExportData,
  onViewLocationOnMap,
  onViewDetails,
  onExportItem,
  onSelectLocationFromMap,
  onAddManually,
  onCancelLocationSelection,
  highlightSearchTerm
}) => {
  const pagination = usePagination(filteredKMLData, { itemsPerPage: 10 });
  const { paginatedData, currentPage, totalPages, goToFirst, goToLast, goToPrevious, goToNext, goToPage, pageRange } = pagination;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          KML Infrastructure Data ({filteredKMLData.length} items)
        </h3>
        <div className="flex space-x-2">
          <select
            value={kmlTypeFilter}
            onChange={(e) => onKmlTypeFilterChange(e.target.value as 'all' | 'pop' | 'subPop')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="pop">POP Only</option>
            <option value="subPop">Sub POP Only</option>
          </select>
          <button
            onClick={onExportData}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            Export Data ({filteredKMLData.length})
          </button>
        </div>
      </div>

      {/* Data Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-lg border ${
          isDark ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-full ${
              isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600'
            }`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Total Locations
              </p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {filteredKMLData.length}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${
          isDark ? 'bg-gray-700 border-gray-600' : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-full ${
              isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-600'
            }`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Manually Added
              </p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {manuallyAddedData.length}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${
          isDark ? 'bg-gray-700 border-gray-600' : 'bg-purple-50 border-purple-200'
        }`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-full ${
              isDark ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-600'
            }`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 104 0 2 2 0 00-4 0zm6 0a2 2 0 104 0 2 2 0 00-4 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                From KML Files
              </p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {kmlData.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Layer Controls */}
      <div className={`p-6 rounded-lg border ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
      }`}>
        <h4 className={`text-lg font-semibold mb-4 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          🗺️ Map Layer Visibility
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* POP Layer Toggle */}
          <div className={`p-4 rounded-lg border transition-all duration-200 ${
            showPOPData
              ? isDark
                ? 'bg-blue-900/30 border-blue-700'
                : 'bg-blue-100 border-blue-300'
              : isDark
                ? 'bg-gray-700 border-gray-600'
                : 'bg-white border-gray-200'
          }`}>
            <label className="flex items-start cursor-pointer group">
              <div className="flex items-center">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={showPOPData}
                    onChange={(e) => onTogglePOPData(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`relative w-11 h-6 rounded-full transition-all duration-300 peer-focus:outline-none peer-focus:ring-4 ${
                    isDark
                      ? 'bg-gray-600 peer-checked:bg-blue-600 peer-focus:ring-blue-800'
                      : 'bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-blue-300'
                  }`}>
                    <div className={`absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-all duration-300 ${
                      showPOPData ? 'translate-x-full border-white' : ''
                    }`}></div>
                  </div>
                </div>
              </div>

              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📍</span>
                    <div>
                      <h5 className={`font-semibold ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        POP Locations
                      </h5>
                      <p className={`text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Point of Presence locations
                      </p>
                    </div>
                  </div>
                  <span className={`text-lg font-bold px-3 py-1 rounded-full ${
                    showPOPData
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                      : isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {kmlData.filter(item => item.type === 'pop').length}
                  </span>
                </div>
                {showPOPData && (
                  <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Active on map
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* Sub POP Layer Toggle */}
          <div className={`p-4 rounded-lg border transition-all duration-200 ${
            showSubPOPData
              ? isDark
                ? 'bg-green-900/30 border-green-700'
                : 'bg-green-100 border-green-300'
              : isDark
                ? 'bg-gray-700 border-gray-600'
                : 'bg-white border-gray-200'
          }`}>
            <label className="flex items-start cursor-pointer group">
              <div className="flex items-center">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={showSubPOPData}
                    onChange={(e) => onToggleSubPOPData(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`relative w-11 h-6 rounded-full transition-all duration-300 peer-focus:outline-none peer-focus:ring-4 ${
                    isDark
                      ? 'bg-gray-600 peer-checked:bg-green-600 peer-focus:ring-green-800'
                      : 'bg-gray-200 peer-checked:bg-green-600 peer-focus:ring-green-300'
                  }`}>
                    <div className={`absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-all duration-300 ${
                      showSubPOPData ? 'translate-x-full border-white' : ''
                    }`}></div>
                  </div>
                </div>
              </div>

              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🏢</span>
                    <div>
                      <h5 className={`font-semibold ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        Sub POP Locations
                      </h5>
                      <p className={`text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Sub Point of Presence locations
                      </p>
                    </div>
                  </div>
                  <span className={`text-lg font-bold px-3 py-1 rounded-full ${
                    showSubPOPData
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                      : isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {kmlData.filter(item => item.type === 'subPop').length}
                  </span>
                </div>
                {showSubPOPData && (
                  <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Active on map
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Quick Info */}
        <div className={`mt-4 p-3 rounded-lg ${
          isDark ? 'bg-gray-700/50' : 'bg-blue-50/50'
        }`}>
          <p className={`text-sm ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            💡 <strong>Tip:</strong> Toggle these switches to show or hide POP and Sub POP locations on the map.
            The count shows how many locations of each type are available in your data.
          </p>
        </div>
      </div>

      {/* Add New Location Section */}
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
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={onAddManually}
                  className="flex-1 px-3 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                >
                  ✏️ Add Manually Instead
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Primary Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={onSelectLocationFromMap}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center space-x-2"
                >
                  <span>📍</span>
                  <span>Select from Map</span>
                </button>
                <button
                  onClick={onAddManually}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm flex items-center justify-center space-x-2"
                >
                  <span>✏️</span>
                  <span>Add Manually</span>
                </button>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-600 mt-3">
            Add new POP or Sub POP locations directly to the map. All required fields including coordinates will be collected in the form.
          </p>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, coordinates, status, or any detail..."
            value={kmlSearchTerm}
            onChange={(e) => onKmlSearchChange(e.target.value)}
            className="w-96 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          Advanced Search
        </button>
      </div>

      {/* Data Table */}
      {filteredKMLData.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No KML Data Loaded</h3>
            <p className="text-sm text-gray-500 mb-4">
              No infrastructure data from KML files is available. Load KML files to view infrastructure locations.
            </p>
            <div className="space-y-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                Load KML Files
              </button>
              <p className="text-xs text-gray-400">
                Supported formats: .kml, .kmz
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coordinates
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {highlightSearchTerm(item.name, kmlSearchTerm)}
                      </div>
                      {item.extendedData?.isManuallyAdded && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Manual
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.type === 'pop' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {item.type === 'pop' ? '📡 POP' : '📶 Sub POP'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    <div className="space-y-1">
                      <div>{highlightSearchTerm(`${item.coordinates?.lat?.toFixed(6) || item.lat?.toFixed(6) || 'N/A'}`, kmlSearchTerm)}</div>
                      <div>{highlightSearchTerm(`${item.coordinates?.lng?.toFixed(6) || item.lng?.toFixed(6) || 'N/A'}`, kmlSearchTerm)}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.extendedData?.status === 'active' ? 'bg-green-100 text-green-800' :
                      item.extendedData?.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {highlightSearchTerm(item.extendedData?.status || 'Unknown', kmlSearchTerm)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => onViewLocationOnMap(item)}
                      className="text-blue-600 hover:text-blue-900 mr-3 font-medium"
                      title="View location on map"
                    >
                      📍 View Location
                    </button>
                    <button
                      onClick={() => onViewDetails(item)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3 font-medium"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => onExportItem(item)}
                      className="text-green-600 hover:text-green-900 font-medium"
                    >
                      Export
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Enhanced Pagination Controls */}
      {totalPages > 1 && (
        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={goToPrevious}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={goToNext}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{pagination.startIndex}</span>{' '}
                to{' '}
                <span className="font-medium">{pagination.endIndex}</span>{' '}
                of{' '}
                <span className="font-medium">{filteredKMLData.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                {/* First Button */}
                <button
                  onClick={goToFirst}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="First page"
                >
                  <span className="sr-only">First</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Previous Button */}
                <button
                  onClick={goToPrevious}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous page"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Page Numbers with Scroll */}
                <div className="flex overflow-x-auto max-w-xs scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {pageRange.map(page => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium whitespace-nowrap ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                {/* Next Button */}
                <button
                  onClick={goToNext}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next page"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Last Button */}
                <button
                  onClick={goToLast}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Last page"
                >
                  <span className="sr-only">Last</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414zm6 0a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L14.586 10l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KMLDataTab;