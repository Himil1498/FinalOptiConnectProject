import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useDataStore } from '../contexts/DataStoreContext';
import NavigationBar from '../components/common/NavigationBar';
import InfrastructureDataManagement from '../components/admin/InfrastructureDataManagement';

const InfrastructurePage: React.FC = () => {
  const { user } = useAuth();
  const { getDataByType } = useDataStore();
  const [kmlData, setKmlData] = useState<any[]>([]);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [kmlLayerVisibility, setKmlLayerVisibility] = useState<{[key: string]: boolean}>({
    pop: false,
    subPop: false
  });

  // Load infrastructure data from DataStore
  useEffect(() => {
    const loadInfrastructureData = () => {
      const infrastructureData = getDataByType('infrastructure');
      const kmlInfraData = getDataByType('kml');

      // Combine and transform data for display
      const combinedData = [...infrastructureData, ...kmlInfraData].reduce((acc: any[], item) => {
        if ((item.type === 'infrastructure' || item.type === 'kml') && 'locations' in item.data) {
          return [...acc, ...item.data.locations];
        }
        return acc;
      }, []);

      // Set the combined data (no sample data)
      setKmlData(combinedData);
    };

    loadInfrastructureData();
  }, [getDataByType]);

  // Toggle KML layer visibility
  const toggleKMLLayer = useCallback((layerName: string) => {
    setKmlLayerVisibility(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
  }, []);

  // Check if KML layer is visible
  const isKMLLayerVisible = useCallback((layerName: string) => {
    return kmlLayerVisibility[layerName] || false;
  }, [kmlLayerVisibility]);

  // Handle location add
  const handleLocationAdd = useCallback((location: any) => {
    setKmlData(prev => [...prev, {
      id: `manual-${Date.now()}`,
      name: location.name,
      type: location.type,
      lat: location.coordinates.lat,
      lng: location.coordinates.lng,
      status: location.status || 'active',
      extendedData: {
        ...location.properties,
        isManuallyAdded: true
      },
      source: 'manual'
    }]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />
      <InfrastructureDataManagement
        isOpen={true}
        onClose={() => window.history.back()}
        currentUserId={user?.id || ""}
        userRole={user?.role || "viewer"}
        kmlData={kmlData}
        toggleKMLLayer={toggleKMLLayer}
        isKMLLayerVisible={isKMLLayerVisible}
        map={mapInstance}
        onLocationAdd={handleLocationAdd}
      />
    </div>
  );
};

export default InfrastructurePage;