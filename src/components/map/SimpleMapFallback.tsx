import React from 'react';
import { MapIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const SimpleMapFallback: React.FC = () => {
  return (
    <div className="h-full w-full bg-gray-100 flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-md">
        {/* Map Icon */}
        <div className="mx-auto h-24 w-24 text-blue-500 mb-6">
          <MapIcon />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Map Loading...
        </h2>

        {/* Description */}
        <p className="text-gray-600 mb-6">
          The Google Maps component is initializing. This may take a moment while we load the necessary resources.
        </p>

        {/* Status Indicators */}
        <div className="space-y-3 text-left bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-sm text-gray-700">Loading Google Maps API...</span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="h-4 w-4 bg-blue-500 rounded-full opacity-50"></div>
            <span className="text-sm text-gray-500">Initializing map components...</span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="h-4 w-4 bg-gray-300 rounded-full"></div>
            <span className="text-sm text-gray-400">Setting up interactive features...</span>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-start space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div className="text-left">
              <h4 className="text-sm font-medium text-yellow-800 mb-1">
                Taking longer than expected?
              </h4>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• Check your internet connection</li>
                <li>• Verify Google Maps API key is valid</li>
                <li>• Ensure Maps JavaScript API is enabled</li>
                <li>• Check browser console for errors</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Demo Info */}
        <div className="mt-6 text-xs text-gray-500">
          <p>Opti Connect - Network Infrastructure Optimization Platform</p>
          <p className="mt-1">Advanced GIS tools for telecom infrastructure management</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleMapFallback;