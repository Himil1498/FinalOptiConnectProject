import { useState, useCallback, useEffect } from 'react';

export interface TempDataItem {
  id: string;
  name: string;
  data: any[];
  type: 'export' | 'visualization' | 'analysis';
  createdAt: Date;
  source: string;
}

export interface UseTempDataStateReturn {
  tempData: TempDataItem[];
  saveTempData: (data: any[], name: string, type?: TempDataItem['type'], source?: string) => string;
  getTempData: (id: string) => TempDataItem | undefined;
  deleteTempData: (id: string) => void;
  clearAllTempData: () => void;
  moveTempDataToPermanent: (id: string, onSave: (data: any[], name: string) => Promise<void>) => Promise<void>;
  getTempDataStats: () => {
    totalItems: number;
    totalDataPoints: number;
    byType: Record<string, number>;
  };
}

/**
 * Hook for managing temporary data state - data that can be previewed, manipulated,
 * and either saved permanently or discarded
 */
export const useTempDataState = (): UseTempDataStateReturn => {
  const [tempData, setTempData] = useState<TempDataItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('opticonnect_temp_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        const processedData = parsed.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt)
        }));
        setTempData(processedData);
      }
    } catch (error) {
      console.error('Failed to load temp data from localStorage:', error);
    }
  }, []);

  // Save to localStorage whenever tempData changes
  useEffect(() => {
    try {
      localStorage.setItem('opticonnect_temp_data', JSON.stringify(tempData));
    } catch (error) {
      console.error('Failed to save temp data to localStorage:', error);
    }
  }, [tempData]);

  const saveTempData = useCallback((
    data: any[],
    name: string,
    type: TempDataItem['type'] = 'export',
    source: string = 'unknown'
  ): string => {
    const id = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newItem: TempDataItem = {
      id,
      name,
      data,
      type,
      createdAt: new Date(),
      source
    };

    setTempData(prev => [...prev, newItem]);
    return id;
  }, []);

  const getTempData = useCallback((id: string): TempDataItem | undefined => {
    return tempData.find(item => item.id === id);
  }, [tempData]);

  const deleteTempData = useCallback((id: string): void => {
    setTempData(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearAllTempData = useCallback((): void => {
    setTempData([]);
  }, []);

  const moveTempDataToPermanent = useCallback(async (
    id: string,
    onSave: (data: any[], name: string) => Promise<void>
  ): Promise<void> => {
    const tempItem = getTempData(id);
    if (!tempItem) {
      throw new Error('Temporary data item not found');
    }

    try {
      await onSave(tempItem.data, tempItem.name);
      deleteTempData(id);
    } catch (error) {
      throw new Error(`Failed to move temp data to permanent: ${error}`);
    }
  }, [getTempData, deleteTempData]);

  const getTempDataStats = useCallback(() => {
    const byType = tempData.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalDataPoints = tempData.reduce((sum, item) => {
      return sum + (Array.isArray(item.data) ? item.data.length : 0);
    }, 0);

    return {
      totalItems: tempData.length,
      totalDataPoints,
      byType
    };
  }, [tempData]);

  return {
    tempData,
    saveTempData,
    getTempData,
    deleteTempData,
    clearAllTempData,
    moveTempDataToPermanent,
    getTempDataStats
  };
};