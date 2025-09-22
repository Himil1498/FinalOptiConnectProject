import React, { useState } from 'react';
import NavigationBar from '../components/common/NavigationBar';
import BaseMapExample from '../components/map/BaseMapExample';
import Footer from '../components/common/Footer';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const BaseMapPage: React.FC = () => {
  const [isFooterCollapsed, setIsFooterCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Link
              to="/dashboard"
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors mr-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Base Map System</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Base Map Functionality</h2>
          <p className="text-gray-600 mb-6">
            A comprehensive base map system providing foundational mapping capabilities for the telecom GIS platform.
          </p>
        </div>

        {/* Features Overview */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">🗺️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Interactive Map</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Full-featured Google Maps integration with zoom controls, map type switching, and India boundary display.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">📍</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Marker System</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Dynamic marker placement, management, and customization with support for different marker types and icons.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-xl">🎯</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Location Services</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Geolocation support, address geocoding, reverse geocoding, and distance calculations.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 text-xl">🔧</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Map Controls</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Custom control panel with zoom, map type switching, fullscreen toggle, and location finding.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600 text-xl">🌍</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">India Focus</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Optimized for India with boundary restrictions, center focus, and region-specific features.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-indigo-600 text-xl">⚙️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Context Provider</h3>
            </div>
            <p className="text-gray-600 text-sm">
              React Context API integration for easy state management and component communication.
            </p>
          </div>
        </div>

        {/* Interactive Demo */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Interactive Demo</h3>
            <p className="text-gray-600 text-sm">
              Click anywhere on the map to place markers. Use the controls to zoom, change map types, and find your location.
            </p>
          </div>
          <div className="h-96">
            <BaseMapExample />
          </div>
        </div>

        {/* Technical Information */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Components</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span><strong>BaseMap:</strong> Core mapping component with Google Maps integration</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span><strong>BaseMapProvider:</strong> React Context provider for state management</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span><strong>useBaseMap:</strong> Custom hook for map functionality</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span><strong>MapControlsPanel:</strong> Interactive controls for map manipulation</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span><strong>LiveCoordinateDisplay:</strong> Real-time coordinate tracking</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Examples</h3>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Basic Implementation</h4>
                <code className="text-xs text-gray-600">
                  {`<BaseMapProvider>
  <BaseMap showControls showCoordinates />
</BaseMapProvider>`}
                </code>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">With Custom Markers</h4>
                <code className="text-xs text-gray-600">
                  {`const { addMarker } = useBaseMap();
addMarker({
  position: { lat: 28.6139, lng: 77.2090 },
  title: "New Delhi"
});`}
                </code>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Event Handling</h4>
                <code className="text-xs text-gray-600">
                  {`<BaseMap
  onMapClick={(coordinates) => {
    // Handle click coordinates
  }}
/>`}
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add bottom padding to prevent content overlap with footer */}
      <div className={`${isFooterCollapsed ? 'pb-10' : 'pb-20'}`}></div>

      <Footer
        isMapView={true}
        isCollapsed={isFooterCollapsed}
        onToggleCollapse={() => setIsFooterCollapsed(!isFooterCollapsed)}
      />
    </div>
  );
};

export default BaseMapPage;