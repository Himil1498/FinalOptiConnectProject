import React from 'react';

const SimpleMapTest: React.FC = () => {
  return (
    <div className="h-full w-full bg-gray-100 flex items-center justify-center">
      <div className="text-center p-8">
        <div className="bg-blue-500 text-white p-6 rounded-lg mb-4">
          <h2 className="text-xl font-bold mb-2">Simple Map Test</h2>
          <p>This is a fallback map component to test if the container is working</p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="bg-green-100 p-3 rounded">
            <h3 className="font-semibold text-green-800">Delhi</h3>
            <p className="text-green-600">28.6139°N, 77.2090°E</p>
          </div>
          <div className="bg-blue-100 p-3 rounded">
            <h3 className="font-semibold text-blue-800">Mumbai</h3>
            <p className="text-blue-600">19.0760°N, 72.8777°E</p>
          </div>
          <div className="bg-purple-100 p-3 rounded">
            <h3 className="font-semibold text-purple-800">Bangalore</h3>
            <p className="text-purple-600">12.9716°N, 77.5946°E</p>
          </div>
        </div>

        <div className="mt-6 text-gray-600">
          <p className="text-xs">If you see this, the map container is loading correctly.</p>
          <p className="text-xs">The issue is likely with Google Maps API initialization.</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleMapTest;