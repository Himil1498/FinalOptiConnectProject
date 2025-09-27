import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

// Enhanced data types for all tools
export interface BaseDataItem {
  id: string;
  name: string;
  type: 'distance' | 'elevation' | 'polygon' | 'infrastructure' | 'kml';
  createdAt: Date;
  updatedAt: Date;
  description?: string;
  tags: string[];
  category: string;
  metadata: {
    version: number;
    size: number;
    author?: string;
    source?: string;
  };
}

export interface DistanceMeasurement extends BaseDataItem {
  type: 'distance';
  data: {
    points: Array<{
      id: string;
      lat: number;
      lng: number;
      x: number;
      y: number;
    }>;
    totalDistance: number;
    unit: 'km' | 'miles';
    segments: Array<{
      startPoint: { lat: number; lng: number };
      endPoint: { lat: number; lng: number };
      distance: number;
    }>;
  };
  notes?: string;
}

export interface ElevationAnalysis extends BaseDataItem {
  type: 'elevation';
  data: {
    points: Array<{
      lat: number;
      lng: number;
      elevation: number;
      index: number;
    }>;
    totalDistance: number;
    elevationGain: number;
    elevationLoss: number;
    maxElevation: number;
    minElevation: number;
    averageGrade: number;
    unit: 'km' | 'miles';
  };
  analysisType: 'path' | 'area' | 'point';
}

export interface PolygonMeasurement extends BaseDataItem {
  type: 'polygon';
  data: {
    points: Array<{
      id: string;
      lat: number;
      lng: number;
      x: number;
      y: number;
    }>;
    area: number;
    perimeter: number;
    unit: 'metric' | 'imperial';
    center: { lat: number; lng: number };
  };
  geometryType: 'polygon' | 'circle' | 'rectangle';
}

export interface InfrastructureData extends BaseDataItem {
  type: 'infrastructure' | 'kml';
  data: {
    locations: Array<{
      id: string;
      name: string;
      lat: number;
      lng: number;
      type: 'pop' | 'subPop' | 'custom';
      status?: string;
      properties?: Record<string, any>;
    }>;
    totalCount: number;
    categories: string[];
  };
  source: 'kml' | 'manual' | 'imported';
}

export type SavedDataItem = DistanceMeasurement | ElevationAnalysis | PolygonMeasurement | InfrastructureData;

interface DataStoreContextType {
  // Data management
  allData: SavedDataItem[];
  getDataByType: (type: SavedDataItem['type']) => SavedDataItem[];
  saveData: (data: Omit<SavedDataItem, 'id' | 'createdAt' | 'updatedAt' | 'metadata'>) => Promise<string>;
  updateData: (id: string, updates: Partial<SavedDataItem>) => Promise<void>;
  deleteData: (id: string) => Promise<void>;
  getData: (id: string) => SavedDataItem | undefined;

  // Search and filter
  searchData: (query: string, type?: SavedDataItem['type']) => SavedDataItem[];
  filterByTags: (tags: string[]) => SavedDataItem[];
  filterByCategory: (category: string) => SavedDataItem[];
  filterByDateRange: (startDate: Date, endDate: Date) => SavedDataItem[];

  // Statistics
  getDataStats: () => {
    totalItems: number;
    byType: Record<SavedDataItem['type'], number>;
    totalSize: number;
    recentActivity: SavedDataItem[];
  };

  // Export/Import
  exportData: (ids: string[], format: 'json' | 'csv' | 'kml') => Promise<Blob>;
  importData: (file: File) => Promise<void>;

  // Utility functions
  generateDataName: (type: SavedDataItem['type'], prefix?: string) => string;
  calculateDataSize: (data: any) => number;
}

const DataStoreContext = createContext<DataStoreContextType | undefined>(undefined);

interface DataStoreProviderProps {
  children: ReactNode;
}

export const DataStoreProvider: React.FC<DataStoreProviderProps> = ({ children }) => {
  const [allData, setAllData] = useState<SavedDataItem[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const storedData = localStorage.getItem('opticonnect_saved_data');
      if (storedData) {
        const parsed = JSON.parse(storedData);
        // Convert date strings back to Date objects
        const processedData = parsed.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt)
        }));
        setAllData(processedData);
      }
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
    }
  }, []);

  // Save data to localStorage whenever allData changes
  useEffect(() => {
    try {
      localStorage.setItem('opticonnect_saved_data', JSON.stringify(allData));
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
    }
  }, [allData]);

  const calculateDataSize = useCallback((data: any): number => {
    return new Blob([JSON.stringify(data)]).size;
  }, []);

  const generateDataName = useCallback((type: SavedDataItem['type'], prefix?: string): string => {
    const timestamp = new Date().toISOString().split('T')[0];
    const count = allData.filter(item => item.type === type).length + 1;
    const typeEmoji = {
      distance: '📏',
      elevation: '⛰️',
      polygon: '🔺',
      infrastructure: '🏗️',
      kml: '🗺️'
    };
    return `${typeEmoji[type]} ${prefix || type} ${count} - ${timestamp}`;
  }, [allData]);

  const saveData = useCallback(async (data: Omit<SavedDataItem, 'id' | 'createdAt' | 'updatedAt' | 'metadata'>): Promise<string> => {
    const id = `${data.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const dataSize = calculateDataSize(data);

    const newItem: SavedDataItem = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      metadata: {
        version: 1,
        size: dataSize,
        author: 'Current User'
      }
    } as SavedDataItem;

    setAllData(prev => [...prev, newItem]);
    return id;
  }, [calculateDataSize]);

  const updateData = useCallback(async (id: string, updates: Partial<SavedDataItem>): Promise<void> => {
    setAllData(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = {
          ...item,
          ...updates,
          updatedAt: new Date(),
          metadata: {
            ...item.metadata,
            version: item.metadata.version + 1,
            size: updates.data ? calculateDataSize(updates.data) : item.metadata.size
          }
        };
        return updatedItem as SavedDataItem;
      }
      return item;
    }));
  }, [calculateDataSize]);

  const deleteData = useCallback(async (id: string): Promise<void> => {
    setAllData(prev => prev.filter(item => item.id !== id));
  }, []);

  const getData = useCallback((id: string): SavedDataItem | undefined => {
    return allData.find(item => item.id === id);
  }, [allData]);

  const getDataByType = useCallback((type: SavedDataItem['type']): SavedDataItem[] => {
    return allData.filter(item => item.type === type);
  }, [allData]);

  const searchData = useCallback((query: string, type?: SavedDataItem['type']): SavedDataItem[] => {
    const filteredByType = type ? getDataByType(type) : allData;
    const lowerQuery = query.toLowerCase();

    return filteredByType.filter(item =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.description?.toLowerCase().includes(lowerQuery) ||
      item.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      item.category.toLowerCase().includes(lowerQuery)
    );
  }, [allData, getDataByType]);

  const filterByTags = useCallback((tags: string[]): SavedDataItem[] => {
    return allData.filter(item =>
      tags.some(tag => item.tags.includes(tag))
    );
  }, [allData]);

  const filterByCategory = useCallback((category: string): SavedDataItem[] => {
    return allData.filter(item => item.category === category);
  }, [allData]);

  const filterByDateRange = useCallback((startDate: Date, endDate: Date): SavedDataItem[] => {
    return allData.filter(item =>
      item.createdAt >= startDate && item.createdAt <= endDate
    );
  }, [allData]);

  const getDataStats = useCallback(() => {
    const byType = allData.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<SavedDataItem['type'], number>);

    const totalSize = allData.reduce((sum, item) => sum + item.metadata.size, 0);

    const recentActivity = allData
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5);

    return {
      totalItems: allData.length,
      byType,
      totalSize,
      recentActivity
    };
  }, [allData]);

  const exportData = useCallback(async (ids: string[], format: 'json' | 'csv' | 'kml'): Promise<Blob> => {
    const itemsToExport = allData.filter(item => ids.includes(item.id));

    switch (format) {
      case 'json':
        return new Blob([JSON.stringify(itemsToExport, null, 2)], { type: 'application/json' });

      case 'csv': {
        const headers = ['ID', 'Name', 'Type', 'Category', 'Created', 'Description'];
        const csvRows = [
          headers.join(','),
          ...itemsToExport.map(item => [
            item.id,
            `"${item.name}"`,
            item.type,
            item.category,
            item.createdAt.toISOString(),
            `"${item.description || ''}"`
          ].join(','))
        ];
        return new Blob([csvRows.join('\n')], { type: 'text/csv' });
      }

      case 'kml': {
        // Basic KML export for location-based data
        const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>OptiConnect Data Export</name>
    ${itemsToExport.map(item => {
      if (item.type === 'distance' || item.type === 'polygon' || item.type === 'infrastructure') {
        // Extract coordinate data based on type
        const coordinates = item.type === 'infrastructure'
          ? (item as InfrastructureData).data.locations.map(loc => `${loc.lng},${loc.lat},0`)
          : item.type === 'distance'
          ? (item as DistanceMeasurement).data.points.map(p => `${p.lng},${p.lat},0`)
          : (item as PolygonMeasurement).data.points.map(p => `${p.lng},${p.lat},0`);

        return `
    <Placemark>
      <name>${item.name}</name>
      <description>${item.description || ''}</description>
      <${item.type === 'polygon' ? 'Polygon' : 'LineString'}>
        <coordinates>${coordinates.join(' ')}</coordinates>
      </${item.type === 'polygon' ? 'Polygon' : 'LineString'}>
    </Placemark>`;
      }
      return '';
    }).join('')}
  </Document>
</kml>`;
        return new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
      }

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }, [allData]);

  const importData = useCallback(async (file: File): Promise<void> => {
    try {
      const text = await file.text();
      const importedData = JSON.parse(text) as SavedDataItem[];

      // Validate and process imported data
      const processedData = importedData.map(item => ({
        ...item,
        id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(),
        tags: [...(item.tags || []), 'imported']
      }));

      setAllData(prev => [...prev, ...processedData]);
    } catch (error) {
      throw new Error(`Failed to import data: ${error}`);
    }
  }, []);

  const contextValue: DataStoreContextType = {
    allData,
    getDataByType,
    saveData,
    updateData,
    deleteData,
    getData,
    searchData,
    filterByTags,
    filterByCategory,
    filterByDateRange,
    getDataStats,
    exportData,
    importData,
    generateDataName,
    calculateDataSize
  };

  return (
    <DataStoreContext.Provider value={contextValue}>
      {children}
    </DataStoreContext.Provider>
  );
};

export const useDataStore = (): DataStoreContextType => {
  const context = useContext(DataStoreContext);
  if (!context) {
    throw new Error('useDataStore must be used within a DataStoreProvider');
  }
  return context;
};