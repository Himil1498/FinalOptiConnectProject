import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import NavigationBar from "../components/common/NavigationBar";
import EnhancedDataManager from "../components/data/EnhancedDataManager";

const DataManagerPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showDataManager] = useState(true);

  const handleShowOnMap = (data: any[]) => {
    // Navigate to dashboard/basemap with the data to display
    // Store the data in session storage for the map to pick up
    sessionStorage.setItem("mapVisualizationData", JSON.stringify(data));
    navigate("/dashboard", { state: { showMapData: true } });
  };

  const handleClose = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Data Manager */}
        <EnhancedDataManager
          isOpen={showDataManager}
          onClose={handleClose}
          onShowOnMap={handleShowOnMap}
        />
      </div>
    </div>
  );
};

export default DataManagerPage;
