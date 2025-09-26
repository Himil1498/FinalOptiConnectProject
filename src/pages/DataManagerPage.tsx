import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import EnhancedDataManager from "../components/data/EnhancedDataManager";
import { useDataStore } from "../contexts/DataStoreContext";

const DataManagerPage: React.FC = () => {
  const navigate = useNavigate();
  const { getDataStats } = useDataStore();
  const [showDataManager, setShowDataManager] = useState(true);

  const stats = getDataStats();

  const handleShowOnMap = (data: any[]) => {
    // Navigate to dashboard/basemap with the data to display
    // Store the data in session storage for the map to pick up
    sessionStorage.setItem("mapVisualizationData", JSON.stringify(data));
    navigate("/dashboard", { state: { showMapData: true } });
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
