import { useState, useCallback, useMemo } from 'react';
import { useDataStore, InfrastructureData } from '../contexts/DataStoreContext';

export interface POPLocationData {
  id?: string;
  name: string;
  type: 'pop' | 'subPop';
  coordinates: { lat: number; lng: number };
  status?: string;
  description?: string;
  properties?: Record<string, any>;
}

export interface KMLData {
  id: string;
  name: string;
  type: 'pop' | 'subPop';
  lat: number;
  lng: number;
  coordinates?: { lat: number; lng: number };
  extendedData?: Record<string, any>;
  isManuallyAdded?: boolean;
}

// Legacy interface for backward compatibility
export interface InfrastructureItem {
  id: string;
  name: string;
  type: string;
  location: string;
  coordinates: { lat: number; lng: number };
  status: 'active' | 'maintenance' | 'planned' | 'decommissioned';
  category: string;
  subCategory?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  cost?: number;
  description?: string;
  createdDate: string;
  lastUpdated: string;
}

export interface InfrastructureFilter {
  category?: string;
  status?: string;
  priority?: string;
  search?: string;
  subCategories?: string[];
}

/**
 * Enhanced hook to manage infrastructure data integration with the global data store
 */
export const useInfrastructureData = () => {
  const { saveData, getDataByType, updateData, deleteData } = useDataStore();
  const [filters, setFilters] = useState<InfrastructureFilter>({
    category: '',
    status: '',
    priority: '',
    search: ''
  });
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Save KML data to global store
  const saveKMLData = useCallback(async (
    kmlData: KMLData[],
    name?: string,
    description?: string
  ): Promise<string> => {
    const infraData: Omit<InfrastructureData, 'id' | 'createdAt' | 'updatedAt' | 'metadata'> = {
      name: name || `KML Import - ${new Date().toLocaleDateString()}`,
      type: 'kml',
      description: description || 'Imported KML infrastructure data',
      category: 'Infrastructure',
      tags: ['kml', 'infrastructure', 'imported'],
      source: 'kml',
      data: {
        locations: kmlData.map(item => ({
          id: item.id,
          name: item.name,
          lat: item.lat,
          lng: item.lng,
          type: item.type,
          status: item.extendedData?.status || 'unknown',
          properties: item.extendedData || {}
        })),
        totalCount: kmlData.length,
        categories: ['pop', 'subPop'].filter(cat =>
          kmlData.some(item => item.type === cat)
        )
      }
    };

    return await saveData(infraData);
  }, [saveData]);

  // Save manually added POP location
  const savePOPLocation = useCallback(async (
    locationData: POPLocationData
  ): Promise<string> => {
    const existing = getDataByType('infrastructure').find(
      item => item.name === 'Manual POP Locations'
    ) as InfrastructureData | undefined;

    if (existing) {
      // Update existing manual locations collection
      const updatedData = {
        ...existing,
        data: {
          ...existing.data,
          locations: [...existing.data.locations, {
            id: locationData.id || `manual_${Date.now()}`,
            name: locationData.name,
            lat: locationData.coordinates.lat,
            lng: locationData.coordinates.lng,
            type: locationData.type,
            status: locationData.status || 'active',
            properties: locationData.properties || {}
          }],
          totalCount: existing.data.locations.length + 1
        }
      };

      await updateData(existing.id, updatedData);
      return existing.id;
    } else {
      // Create new manual locations collection
      const infraData: Omit<InfrastructureData, 'id' | 'createdAt' | 'updatedAt' | 'metadata'> = {
        name: 'Manual POP Locations',
        type: 'infrastructure',
        description: 'Manually added POP and Sub-POP locations',
        category: 'Infrastructure',
        tags: ['manual', 'pop', 'infrastructure'],
        source: 'manual',
        data: {
          locations: [{
            id: locationData.id || `manual_${Date.now()}`,
            name: locationData.name,
            lat: locationData.coordinates.lat,
            lng: locationData.coordinates.lng,
            type: locationData.type,
            status: locationData.status || 'active',
            properties: locationData.properties || {}
          }],
          totalCount: 1,
          categories: [locationData.type]
        }
      };

      return await saveData(infraData);
    }
  }, [saveData, getDataByType, updateData]);

  // Get all infrastructure data
  const getAllInfrastructureData = useCallback(() => {
    return getDataByType('infrastructure').concat(getDataByType('kml')) as InfrastructureData[];
  }, [getDataByType]);

  // Get infrastructure data as flat location array (for backward compatibility)
  const getInfrastructureLocations = useCallback((): KMLData[] => {
    const infraItems = getAllInfrastructureData();
    const allLocations: KMLData[] = [];

    infraItems.forEach(item => {
      item.data.locations.forEach(location => {
        allLocations.push({
          id: location.id,
          name: location.name,
          type: (location.type === 'custom' ? 'pop' : location.type) as 'pop' | 'subPop',
          lat: location.lat,
          lng: location.lng,
          coordinates: { lat: location.lat, lng: location.lng },
          extendedData: {
            status: location.status,
            ...location.properties,
            isManuallyAdded: item.source === 'manual'
          },
          isManuallyAdded: item.source === 'manual'
        });
      });
    });

    return allLocations;
  }, [getAllInfrastructureData]);

  // Convert to legacy format for backward compatibility
  const getLegacyInfrastructureData = useCallback((): InfrastructureItem[] => {
    const locations = getInfrastructureLocations();
    return locations.map(loc => ({
      id: loc.id,
      name: loc.name,
      type: loc.type,
      location: `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`,
      coordinates: { lat: loc.lat, lng: loc.lng },
      status: (loc.extendedData?.status as any) || 'active',
      category: loc.type === 'pop' ? 'POP' : 'Sub POP',
      priority: 'medium' as const,
      description: loc.extendedData?.description || '',
      createdDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }));
  }, [getInfrastructureLocations]);

  // Filter infrastructure data
  const filterInfrastructureData = useCallback((
    filters: InfrastructureFilter
  ): InfrastructureItem[] => {
    const data = getLegacyInfrastructureData();
    return data.filter(item => {
      if (filters.category && item.category !== filters.category) return false;
      if (filters.status && item.status !== filters.status) return false;
      if (filters.priority && item.priority !== filters.priority) return false;
      if (filters.search && !item.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.subCategories && item.subCategory && !filters.subCategories.includes(item.subCategory)) return false;
      return true;
    });
  }, [getLegacyInfrastructureData]);

  // Delete infrastructure collection
  const deleteInfrastructureData = useCallback(async (id: string): Promise<void> => {
    await deleteData(id);
  }, [deleteData]);

  // Get infrastructure statistics
  const getInfrastructureStats = useCallback(() => {
    const infraData = getAllInfrastructureData();
    const stats = {
      totalCollections: infraData.length,
      totalLocations: infraData.reduce((sum, item) => sum + item.data.totalCount, 0),
      popCount: 0,
      subPopCount: 0,
      manualCount: 0,
      kmlCount: 0,
      categories: new Set<string>()
    };

    infraData.forEach(item => {
      if (item.source === 'manual') stats.manualCount += item.data.totalCount;
      if (item.source === 'kml') stats.kmlCount += item.data.totalCount;

      item.data.locations.forEach(location => {
        if (location.type === 'pop') stats.popCount++;
        if (location.type === 'subPop') stats.subPopCount++;
        stats.categories.add(location.type);
      });
    });

    return {
      ...stats,
      categories: Array.from(stats.categories)
    };
  }, [getAllInfrastructureData]);

  // Export infrastructure data in various formats
  const exportInfrastructureData = useCallback(async (
    format: 'json' | 'csv' | 'kml' = 'json'
  ): Promise<Blob> => {
    const locations = getInfrastructureLocations();

    switch (format) {
      case 'json':
        return new Blob([JSON.stringify(locations, null, 2)], {
          type: 'application/json'
        });

      case 'csv': {
        const headers = ['ID', 'Name', 'Type', 'Latitude', 'Longitude', 'Status', 'Source'];
        const csvRows = [
          headers.join(','),
          ...locations.map(loc => [
            loc.id,
            `"${loc.name}"`,
            loc.type,
            loc.lat,
            loc.lng,
            loc.extendedData?.status || 'unknown',
            loc.isManuallyAdded ? 'manual' : 'kml'
          ].join(','))
        ];
        return new Blob([csvRows.join('\n')], { type: 'text/csv' });
      }

      case 'kml': {
        const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>OptiConnect Infrastructure Data</name>
    ${locations.map(loc => `
    <Placemark>
      <name>${loc.name}</name>
      <description>Type: ${loc.type}, Status: ${loc.extendedData?.status || 'unknown'}</description>
      <Point>
        <coordinates>${loc.lng},${loc.lat},0</coordinates>
      </Point>
    </Placemark>`).join('')}
  </Document>
</kml>`;
        return new Blob([kmlContent], {
          type: 'application/vnd.google-earth.kml+xml'
        });
      }

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }, [getInfrastructureLocations]);

  // Additional legacy methods for backward compatibility
  const updateFilter = useCallback((key: keyof InfrastructureFilter, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const addItem = useCallback(async (item: Omit<InfrastructureItem, 'id'>) => {
    const locationData: POPLocationData = {
      name: item.name,
      type: item.type === 'POP' ? 'pop' : 'subPop',
      coordinates: item.coordinates,
      status: item.status,
      description: item.description,
      properties: { priority: item.priority, cost: item.cost }
    };
    return await savePOPLocation(locationData);
  }, [savePOPLocation]);

  const updateItem = useCallback(async (id: string, updates: Partial<InfrastructureItem>) => {
    // This is a simplified update - in practice you'd need to find the correct collection
    // and update the specific location within it
    console.warn('updateItem not fully implemented - use updateData with proper infrastructure collection ID');
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    // This would need to find and remove the specific location from its collection
    console.warn('deleteItem not fully implemented - use deleteInfrastructureData with collection ID');
  }, []);

  const bulkDelete = useCallback(async () => {
    // Bulk delete selected items
    console.warn('bulkDelete not fully implemented');
    setSelectedItems([]);
  }, []);

  const setData = useCallback((data: InfrastructureItem[]) => {
    // Convert and save legacy data format
    console.warn('setData not fully implemented - use saveKMLData or savePOPLocation instead');
  }, []);

  return {
    // New data store methods
    saveKMLData,
    savePOPLocation,
    getAllInfrastructureData,
    getInfrastructureLocations,
    deleteInfrastructureData,
    getInfrastructureStats,
    exportInfrastructureData,

    // Legacy compatibility methods
    data: getLegacyInfrastructureData(),
    allData: getLegacyInfrastructureData(),
    filterInfrastructureData,
    filters,
    selectedItems,
    setSelectedItems,
    updateFilter,
    addItem,
    updateItem,
    deleteItem,
    bulkDelete,
    setData,

    // Raw data access
    getDataByType
  };
};