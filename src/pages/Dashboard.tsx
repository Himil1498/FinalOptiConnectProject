import React, { useState } from "react";
import ComprehensiveGoogleMapInterface from "../components/map/ComprehensiveGoogleMapInterface";
import NavigationBar from "../components/common/NavigationBar";
import Footer from "../components/common/Footer";

const Dashboard: React.FC = () => {
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [isFooterCollapsed, setIsFooterCollapsed] = useState(true);

  return (
    <div className="dashboard-layout h-screen bg-gray-50">
      {/* Navigation */}
      <NavigationBar mapInstance={mapInstance} />

      {/* Main Content */}
      <div
        className={`dashboard-main ${isFooterCollapsed ? "pb-10" : "pb-20"}`}
        id="main-content"
        role="main"
      >
        <ComprehensiveGoogleMapInterface onMapReady={setMapInstance} />
      </div>

      {/* Footer */}
      <Footer
        isMapView={true}
        isCollapsed={isFooterCollapsed}
        onToggleCollapse={() => setIsFooterCollapsed(!isFooterCollapsed)}
      />
    </div>
  );
};

export default Dashboard;
