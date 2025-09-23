import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useInfrastructureData } from '../../hooks/useInfrastructureData';
import {
  InfrastructureCategory,
  Coordinates,
  User
} from '../../types';
import { InfrastructureItem, InfrastructureFilter } from '../../hooks/useInfrastructureData';
import { ExportUtils, ExportFormat } from '../../utils/exportUtils';
import AddPOPLocationForm, { POPLocationData } from '../map/AddPOPLocationForm';
import {
  InfrastructureDataTable,
  InfrastructureFilters,
  InfrastructureAddForm,
  KMLDataTab,
  InfrastructureCategoriesTab,
  InfrastructureReportsTab
} from './infrastructure';

export interface InfrastructureDataManagementProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  userRole: User['role'];
  kmlData?: any[];
  toggleKMLLayer?: (layerName: string) => void;
  isKMLLayerVisible?: (layerName: string) => boolean;
  map?: google.maps.Map | null;
  onLocationAdd?: (location: POPLocationData) => void;
}

const InfrastructureDataManagement: React.FC<InfrastructureDataManagementProps> = ({
  isOpen,
  onClose,
  currentUserId,
  userRole,
  kmlData = [],
  toggleKMLLayer,
  isKMLLayerVisible,
  map,
  onLocationAdd,
}) => {
  const { uiState } = useTheme();
  const isDark = uiState.theme.mode === 'dark';

  // Use our custom hook for infrastructure data management
  const infrastructureHook = useInfrastructureData();
  const {
    data: filteredData,
    allData,
    filters,
    selectedItems,
    setSelectedItems,
    updateFilter,
    addItem,
    updateItem,
    deleteItem,
    bulkDelete,
    setData
  } = infrastructureHook;

  // Local state for UI management
  const [activeTab, setActiveTab] = useState<'data' | 'add' | 'categories' | 'reports' | 'kml'>('data');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InfrastructureItem | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<Coordinates | null>(null);
  const [formData, setFormData] = useState<Partial<InfrastructureItem>>({});
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showExportFormatModal, setShowExportFormatModal] = useState(false);
  const [exportType, setExportType] = useState<'bulk' | 'single'>('bulk');

  // KML Data state
  const [kmlSearchTerm, setKmlSearchTerm] = useState('');
  const [kmlTypeFilter, setKmlTypeFilter] = useState<'all' | 'pop' | 'subPop'>('all');

  // Map interaction state
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [pendingCoordinates, setPendingCoordinates] = useState<Coordinates | null>(null);
  const [showAddLocationForm, setShowAddLocationForm] = useState(false);
  const [mapClickListener, setMapClickListener] = useState<google.maps.MapsEventListener | null>(null);

  // Mock categories data
  const categories: any[] = useMemo(() => [
    {
      id: 'network',
      name: 'Network Infrastructure',
      icon: '🌐',
      description: 'Core network components and connectivity',
      subCategories: [
        { id: 'fiber', name: 'Fiber Optic Cables', attributes: { priority: 'high', count: 45 } },
        { id: 'switches', name: 'Network Switches', attributes: { priority: 'high', count: 23 } },
        { id: 'routers', name: 'Core Routers', attributes: { priority: 'critical', count: 12 } }
      ]
    },
    {
      id: 'power',
      name: 'Power Systems',
      icon: '⚡',
      description: 'Power supply and backup systems',
      subCategories: [
        { id: 'ups', name: 'UPS Systems', attributes: { priority: 'critical', count: 18 } },
        { id: 'generators', name: 'Backup Generators', attributes: { priority: 'high', count: 8 } },
        { id: 'solar', name: 'Solar Panels', attributes: { priority: 'medium', count: 15 } }
      ]
    },
    {
      id: 'transmission',
      name: 'Transmission Equipment',
      icon: '📡',
      description: 'Wireless and transmission infrastructure',
      subCategories: [
        { id: 'towers', name: 'Cell Towers', attributes: { priority: 'critical', count: 32 } },
        { id: 'antennas', name: 'Antennas', attributes: { priority: 'high', count: 67 } },
        { id: 'microwave', name: 'Microwave Links', attributes: { priority: 'medium', count: 28 } }
      ]
    },
    {
      id: 'facilities',
      name: 'Facilities',
      icon: '🏢',
      description: 'Physical infrastructure and buildings',
      subCategories: [
        { id: 'datacenters', name: 'Data Centers', attributes: { priority: 'critical', count: 5 } },
        { id: 'cabinets', name: 'Equipment Cabinets', attributes: { priority: 'medium', count: 89 } },
        { id: 'shelters', name: 'Equipment Shelters', attributes: { priority: 'medium', count: 34 } }
      ]
    }
  ], []);

  // Mock infrastructure data
  useEffect(() => {
    const mockData: InfrastructureItem[] = [
      {
        id: '1',
        name: 'Mumbai Central Tower',
        type: 'Cell Tower',
        location: 'Mumbai, Maharashtra',
        coordinates: { lat: 19.0760, lng: 72.8777 },
        status: 'active',
        category: 'transmission',
        subCategory: 'towers',
        priority: 'critical',
        cost: 2500000,
        description: 'Primary transmission tower serving Mumbai central area',
        createdDate: '2023-01-15',
        lastUpdated: '2024-01-10'
      },
      {
        id: '2',
        name: 'Delhi Hub Router',
        type: 'Core Router',
        location: 'New Delhi',
        coordinates: { lat: 28.6139, lng: 77.2090 },
        status: 'active',
        category: 'network',
        subCategory: 'routers',
        priority: 'critical',
        cost: 1800000,
        description: 'Main routing hub for North India operations',
        createdDate: '2023-03-20',
        lastUpdated: '2024-01-08'
      },
      {
        id: '3',
        name: 'Bangalore DC UPS',
        type: 'UPS System',
        location: 'Bangalore, Karnataka',
        coordinates: { lat: 12.9716, lng: 77.5946 },
        status: 'maintenance',
        category: 'power',
        subCategory: 'ups',
        priority: 'high',
        cost: 950000,
        description: 'Backup power system for Bangalore data center',
        createdDate: '2023-06-10',
        lastUpdated: '2024-01-05'
      }
    ];
    setData(mockData);
  }, [setData]);

  // Filtered KML data
  const filteredKMLData = useMemo(() => {
    let filtered = kmlData;

    if (kmlTypeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === kmlTypeFilter);
    }

    if (kmlSearchTerm) {
      const searchLower = kmlSearchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.extendedData?.status?.toLowerCase().includes(searchLower) ||
        item.coordinates?.lat?.toString().includes(searchLower) ||
        item.coordinates?.lng?.toString().includes(searchLower) ||
        item.lat?.toString().includes(searchLower) ||
        item.lng?.toString().includes(searchLower)
      );
    }

    return filtered;
  }, [kmlData, kmlTypeFilter, kmlSearchTerm]);

  const manuallyAddedData = useMemo(() =>
    kmlData.filter(item => item.extendedData?.isManuallyAdded),
    [kmlData]
  );

  // ESC key handler
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  // Permission helpers
  const canAdd = useCallback(() => {
    return ['admin', 'manager'].includes(userRole);
  }, [userRole]);

  const canEdit = useCallback((item: InfrastructureItem) => {
    if (userRole === 'admin') return true;
    if (userRole === 'manager') return true;
    return false;
  }, [userRole]);

  const canDelete = useCallback((item: InfrastructureItem) => {
    return userRole === 'admin';
  }, [userRole]);

  // Handlers
  const handleFilterChange = useCallback((key: keyof InfrastructureFilter, value: string) => {
    updateFilter(key, value);
  }, [updateFilter]);

  const handleItemSelect = useCallback((itemId: string, selected: boolean) => {
    if (selected) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  }, [setSelectedItems]);

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedItems(filteredData.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  }, [filteredData, setSelectedItems]);

  const handleEditItem = useCallback((item: InfrastructureItem) => {
    setEditingItem(item);
    setFormData(item);
    setShowEditModal(true);
  }, []);

  const handleDeleteItem = useCallback((itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteItem(itemId);
    }
  }, [deleteItem]);

  const handleBulkAction = useCallback((action: string) => {
    switch (action) {
      case 'delete':
        if (window.confirm(`Delete ${selectedItems.length} selected items?`)) {
          bulkDelete();
        }
        break;
      case 'export':
        setExportType('bulk');
        setShowExportFormatModal(true);
        break;
      case 'activate':
        selectedItems.forEach(id => {
          updateItem(id, { status: 'active' });
        });
        setSelectedItems([]);
        break;
      case 'maintenance':
        selectedItems.forEach(id => {
          updateItem(id, { status: 'maintenance' });
        });
        setSelectedItems([]);
        break;
    }
  }, [selectedItems, bulkDelete, updateItem, setSelectedItems]);

  const handleQuickAdd = useCallback((category: InfrastructureCategory, subCategory: any) => {
    setFormData({
      category: category.name,
      subCategory: subCategory.id,
      status: 'active',
      priority: 'medium'
    });
    setShowAddModal(true);
  }, []);

  // Map integration handlers
  const handleSelectLocationFromMap = useCallback(() => {
    if (!map) {
      console.warn('No map instance available for location selection');
      return;
    }

    console.log('Starting map location selection...');
    setIsSelectingLocation(true);

    if (mapClickListener) {
      google.maps.event.removeListener(mapClickListener);
      setMapClickListener(null);
    }

    const listener = map.addListener('click', (event: google.maps.MapMouseEvent) => {
      console.log('Map clicked!', event.latLng?.toJSON());
      if (event.latLng) {
        const coordinates = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        };
        console.log('Setting coordinates:', coordinates);
        setPendingCoordinates(coordinates);
        setShowAddLocationForm(true);
        setIsSelectingLocation(false);
        google.maps.event.removeListener(listener);
        setMapClickListener(null);
      }
    });

    setMapClickListener(listener);
    console.log('Map click listener added, listener ID:', listener);
  }, [map, mapClickListener]);

  const handleAddManually = useCallback(() => {
    setPendingCoordinates(null);
    setShowAddLocationForm(true);
  }, []);

  const handleCancelLocationSelection = useCallback(() => {
    setIsSelectingLocation(false);
    if (mapClickListener) {
      google.maps.event.removeListener(mapClickListener);
      setMapClickListener(null);
    }
  }, [mapClickListener]);

  const handleSaveLocation = useCallback((locationData: POPLocationData) => {
    onLocationAdd?.(locationData);
    setShowAddLocationForm(false);
    setPendingCoordinates(null);
  }, [onLocationAdd]);

  const handleCloseAddLocationForm = useCallback(() => {
    setShowAddLocationForm(false);
    setPendingCoordinates(null);
    handleCancelLocationSelection();
  }, [handleCancelLocationSelection]);

  const handleViewLocationOnMap = useCallback((item: any) => {
    if (!map) {
      console.warn('No map instance available');
      return;
    }

    let coordinates;
    if (item.coordinates) {
      coordinates = item.coordinates;
    } else if (item.lat && item.lng) {
      coordinates = { lat: item.lat, lng: item.lng };
    } else {
      console.warn('No coordinates found for item:', item);
      return;
    }

    map.panTo(coordinates);
    map.setZoom(15);

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="max-width: 300px;">
          <h4 style="margin: 0 0 8px 0; color: #1f2937;">${item.name || 'Unknown Location'}</h4>
          <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;"><strong>Type:</strong> ${item.type || 'N/A'}</p>
          <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;"><strong>Coordinates:</strong> ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}</p>
          ${item.description ? `<p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;"><strong>Description:</strong> ${item.description}</p>` : ''}
          ${item.extendedData?.status ? `<p style="margin: 0; color: #6b7280; font-size: 14px;"><strong>Status:</strong> ${item.extendedData.status}</p>` : ''}
        </div>
      `,
      position: coordinates
    });

    infoWindow.open(map);

    setTimeout(() => {
      infoWindow.close();
    }, 5000);
  }, [map]);

  const handleViewDetails = useCallback((item: any) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  }, []);

  const handleExportItem = useCallback((item: any) => {
    setSelectedItem(item);
    setExportType('single');
    setShowExportFormatModal(true);
  }, []);

  const highlightSearchTerm = useCallback((text: string, term: string): React.ReactNode => {
    if (!term) return text;

    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 rounded px-1">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }, []);

  // Tab configuration
  const tabs = [
    { id: 'data', label: 'Infrastructure Data', icon: '📊', description: 'View and manage data' },
    { id: 'add', label: 'Add New', icon: '➕', description: 'Create new entries' },
    { id: 'categories', label: 'Categories', icon: '📂', description: 'Organize by type' },
    { id: 'reports', label: 'Reports', icon: '📈', description: 'Analytics & insights' },
    { id: 'kml', label: `KML Data (${kmlData.length})`, icon: '📍', description: 'Map visualization' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-7xl h-full max-h-[90vh] rounded-lg shadow-xl overflow-hidden ${
        isDark ? 'bg-gray-900' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600'
            }`}>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Infrastructure Data Management
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                📋 Manage telecom infrastructure with manual entry, coordinate input, and visualization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className={`px-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? isDark
                      ? 'border-blue-400 text-blue-400'
                      : 'border-blue-500 text-blue-600'
                    : isDark
                      ? 'border-transparent text-gray-400 hover:text-gray-200'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Infrastructure Data Tab */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <InfrastructureFilters
                filter={filters}
                onFilterChange={handleFilterChange}
                categories={categories}
                selectedItems={selectedItems}
                onBulkAction={handleBulkAction}
                onAddNew={() => setShowAddModal(true)}
                canAdd={canAdd()}
              />

              <InfrastructureDataTable
                data={filteredData}
                selectedItems={selectedItems}
                onItemSelect={handleItemSelect}
                onSelectAll={handleSelectAll}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
                onViewLocation={handleViewLocationOnMap}
                canEdit={canEdit}
                canDelete={canDelete}
              />
            </div>
          )}

          {/* Add New Tab */}
          {activeTab === 'add' && (
            <InfrastructureAddForm
              categories={categories}
              formData={formData}
              selectedCoordinates={selectedCoordinates}
              map={map}
              isSelectingLocation={isSelectingLocation}
              pendingCoordinates={pendingCoordinates}
              showAddLocationForm={showAddLocationForm}
              onFormDataChange={setFormData}
              onCoordinatesChange={setSelectedCoordinates}
              onShowMapPicker={() => setShowMapPicker(true)}
              onQuickAdd={handleQuickAdd}
              onSelectLocationFromMap={handleSelectLocationFromMap}
              onAddManually={handleAddManually}
              onCancelLocationSelection={handleCancelLocationSelection}
              onSaveLocation={handleSaveLocation}
              onCloseAddLocationForm={handleCloseAddLocationForm}
            />
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <InfrastructureCategoriesTab
              categories={categories}
              isDark={isDark}
            />
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <InfrastructureReportsTab
              isDark={isDark}
              dataLength={allData.length}
            />
          )}

          {/* KML Data Tab */}
          {activeTab === 'kml' && (
            <KMLDataTab
              kmlData={kmlData}
              filteredKMLData={filteredKMLData}
              manuallyAddedData={manuallyAddedData}
              kmlTypeFilter={kmlTypeFilter}
              kmlSearchTerm={kmlSearchTerm}
              isDark={isDark}
              map={map}
              isSelectingLocation={isSelectingLocation}
              onKmlTypeFilterChange={(filter) => {
                setKmlTypeFilter(filter);
              }}
              onKmlSearchChange={setKmlSearchTerm}
              onExportData={() => {
                setExportType('bulk');
                setShowExportFormatModal(true);
              }}
              onViewLocationOnMap={handleViewLocationOnMap}
              onViewDetails={handleViewDetails}
              onExportItem={handleExportItem}
              onSelectLocationFromMap={handleSelectLocationFromMap}
              onAddManually={handleAddManually}
              onCancelLocationSelection={handleCancelLocationSelection}
              highlightSearchTerm={highlightSearchTerm}
            />
          )}
        </div>

        {/* Add POP Location Form */}
        <AddPOPLocationForm
          isOpen={showAddLocationForm}
          onClose={handleCloseAddLocationForm}
          onSave={handleSaveLocation}
          initialCoordinates={pendingCoordinates || undefined}
        />
      </div>
    </div>
  );
};

export default InfrastructureDataManagement;