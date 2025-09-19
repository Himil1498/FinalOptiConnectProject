import React, { useEffect, useState } from 'react';

interface DebugInfo {
  apiKeyPresent: boolean;
  googleMapsLoaded: boolean;
  googleMapsVersion: string | null;
  librariesLoaded: string[];
  errors: string[];
}

const GoogleMapsDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    apiKeyPresent: false,
    googleMapsLoaded: false,
    googleMapsVersion: null,
    librariesLoaded: [],
    errors: [],
  });

  useEffect(() => {
    const checkGoogleMaps = () => {
      const errors: string[] = [];
      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

      // Check API key
      const apiKeyPresent = !!apiKey;
      if (!apiKeyPresent) {
        errors.push('Google Maps API key is missing');
      }

      // Check if Google Maps is loaded
      const googleMapsLoaded = !!(window as any).google?.maps;
      if (!googleMapsLoaded) {
        errors.push('Google Maps JavaScript API not loaded');
      }

      // Get version info
      const googleMapsVersion = googleMapsLoaded
        ? (window as any).google?.maps?.version || 'Unknown'
        : null;

      // Check loaded libraries
      const librariesLoaded: string[] = [];
      if (googleMapsLoaded) {
        if ((window as any).google?.maps?.geometry) librariesLoaded.push('geometry');
        if ((window as any).google?.maps?.places) librariesLoaded.push('places');
        if ((window as any).google?.maps?.drawing) librariesLoaded.push('drawing');
      }

      setDebugInfo({
        apiKeyPresent,
        googleMapsLoaded,
        googleMapsVersion,
        librariesLoaded,
        errors,
      });
    };

    // Check immediately
    checkGoogleMaps();

    // Check again after a delay to catch async loading
    const timer = setTimeout(checkGoogleMaps, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm">
      <h3 className="font-bold text-lg mb-3 text-gray-800">Google Maps Debug Info</h3>

      <div className="space-y-2 text-sm">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${debugInfo.apiKeyPresent ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>API Key: {debugInfo.apiKeyPresent ? 'Present' : 'Missing'}</span>
        </div>

        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${debugInfo.googleMapsLoaded ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>Google Maps: {debugInfo.googleMapsLoaded ? 'Loaded' : 'Not Loaded'}</span>
        </div>

        {debugInfo.googleMapsVersion && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Version: {debugInfo.googleMapsVersion}</span>
          </div>
        )}

        {debugInfo.librariesLoaded.length > 0 && (
          <div>
            <span className="font-medium">Libraries:</span>
            <div className="ml-4">
              {debugInfo.librariesLoaded.map(lib => (
                <div key={lib} className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span>{lib}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {debugInfo.errors.length > 0 && (
          <div>
            <span className="font-medium text-red-600">Errors:</span>
            <div className="ml-4">
              {debugInfo.errors.map((error, index) => (
                <div key={index} className="text-red-600 text-xs">
                  • {error}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <div>Current URL: {window.location.href}</div>
          <div>Timestamp: {new Date().toLocaleTimeString()}</div>
        </div>
      </div>
    </div>
  );
};

export default GoogleMapsDebug;