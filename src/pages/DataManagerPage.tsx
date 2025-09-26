import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EnhancedDataManager from '../components/data/EnhancedDataManager';
import { useDataStore } from '../contexts/DataStoreContext';

const DataManagerPage: React.FC = () => {
  const navigate = useNavigate();
  const { getDataStats } = useDataStore();
  const [showDataManager, setShowDataManager] = useState(true);

  const stats = getDataStats();

  const handleShowOnMap = (data: any[]) => {
    // Navigate to dashboard/basemap with the data to display
    // Store the data in session storage for the map to pick up
    sessionStorage.setItem('mapVisualizationData', JSON.stringify(data));
    navigate('/dashboard', { state: { showMapData: true } });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <span className="text-4xl mr-3">📊</span>
                  Data Manager
                </h1>
                <p className="mt-2 text-gray-600">
                  Manage all your saved data from Distance, Elevation, Polygon tools and Infrastructure data
                </p>
              </div>

              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <span>←</span>
                <span>Back to Dashboard</span>
              </button>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Items</p>
                    <p className="text-2xl font-bold">{stats.totalItems}</p>
                  </div>
                  <div className="text-3xl opacity-80">📊</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Distance Measurements</p>
                    <p className="text-2xl font-bold">{stats.byType.distance || 0}</p>
                  </div>
                  <div className="text-3xl opacity-80">📏</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Elevation Profiles</p>
                    <p className="text-2xl font-bold">{stats.byType.elevation || 0}</p>
                  </div>
                  <div className="text-3xl opacity-80">⛰️</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Infrastructure Items</p>
                    <p className="text-2xl font-bold">{(stats.byType.infrastructure || 0) + (stats.byType.kml || 0)}</p>
                  </div>
                  <div className="text-3xl opacity-80">🏗️</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="text-2xl mr-2">🗂️</span>
                Your Saved Data
              </h2>

              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  Total Data Size: {(stats.totalSize / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>

            {/* Getting Started Guide */}
            {stats.totalItems === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-blue-800 mb-3 flex items-center">
                  <span className="text-2xl mr-2">🚀</span>
                  Getting Started
                </h3>
                <div className="text-blue-700 space-y-2">
                  <p>• Use the Distance, Elevation, or Polygon tools on the map to create measurements</p>
                  <p>• Import KML files with infrastructure data</p>
                  <p>• Add manual POP locations through the map interface</p>
                  <p>• All saved data will appear here for management and export</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Start Creating Data →
                  </button>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            {stats.recentActivity.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                  <span className="text-xl mr-2">⏰</span>
                  Recent Activity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {stats.recentActivity.slice(0, 6).map(item => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">
                          {item.type === 'distance' ? '📏' :
                           item.type === 'elevation' ? '⛰️' :
                           item.type === 'polygon' ? '🔺' : '🏗️'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            {item.updatedAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Open Data Manager Button */}
            <div className="text-center">
              <button
                onClick={() => setShowDataManager(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 mx-auto"
              >
                <span>📊</span>
                <span>Open Data Manager</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Data Manager Dialog */}
      <EnhancedDataManager
        isOpen={showDataManager}
        onClose={() => setShowDataManager(false)}
        onShowOnMap={handleShowOnMap}
      />
    </div>
  );
};

export default DataManagerPage;