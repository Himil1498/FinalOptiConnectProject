import React, { useState } from 'react';
import ComprehensiveGoogleMapInterface from '../components/map/ComprehensiveGoogleMapInterface';
import WorkingMapFallback from '../components/map/WorkingMapFallback';
import NavigationBar from '../components/common/NavigationBar';

const Dashboard: React.FC = () => {
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  return (
    <div className="dashboard-layout h-screen bg-gray-50">
      {/* Navigation */}
      <NavigationBar mapInstance={mapInstance} />

      {/* Main Content */}
      <div className="dashboard-main" id="main-content" role="main">
        <ComprehensiveGoogleMapInterface onMapReady={setMapInstance} />
      </div>
    </div>
  );
};

export default Dashboard;