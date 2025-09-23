import { useState, useCallback, useMemo } from 'react';

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

export const useInfrastructureData = () => {
  const [data, setData] = useState<InfrastructureItem[]>([]);
  const [filters, setFilters] = useState<InfrastructureFilter>({
    category: '',
    status: '',
    priority: '',
    search: ''
  });
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filters.category && item.category !== filters.category) return false;
      if (filters.status && item.status !== filters.status) return false;
      if (filters.priority && item.priority !== filters.priority) return false;
      if (filters.search && !item.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.subCategories && item.subCategory && !filters.subCategories.includes(item.subCategory)) return false;
      return true;
    });
  }, [data, filters]);

  const updateFilter = useCallback((key: keyof InfrastructureFilter, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const addItem = useCallback((item: Omit<InfrastructureItem, 'id'>) => {
    const newItem: InfrastructureItem = {
      ...item,
      id: Date.now().toString()
    };
    setData(prev => [...prev, newItem]);
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<InfrastructureItem>) => {
    setData(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates, lastUpdated: new Date().toISOString() } : item
    ));
  }, []);

  const deleteItem = useCallback((id: string) => {
    setData(prev => prev.filter(item => item.id !== id));
    setSelectedItems(prev => prev.filter(itemId => itemId !== id));
  }, []);

  const bulkDelete = useCallback(() => {
    setData(prev => prev.filter(item => !selectedItems.includes(item.id)));
    setSelectedItems([]);
  }, [selectedItems]);

  return {
    data: filteredData,
    allData: data,
    filters,
    selectedItems,
    setSelectedItems,
    updateFilter,
    addItem,
    updateItem,
    deleteItem,
    bulkDelete,
    setData
  };
};