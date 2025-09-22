import React, { useState, useCallback, useMemo } from 'react';
import {
  InfrastructureItem,
  InfrastructureCategory,
  InfrastructureFilter,
  InfrastructureExport,
  Coordinates,
  User
} from '../../types';

interface InfrastructureDataManagementProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  userRole: User['role'];
}

const InfrastructureDataManagement: React.FC<InfrastructureDataManagementProps> = ({
  isOpen,
  onClose,
  currentUserId,
  userRole,
}) => {
  const [activeTab, setActiveTab] = useState<'data' | 'add' | 'categories' | 'reports'>('data');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filter, setFilter] = useState<InfrastructureFilter>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InfrastructureItem | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<Coordinates | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [formData, setFormData] = useState<Partial<InfrastructureItem>>({});

  // Mock categories for infrastructure
  const categories: InfrastructureCategory[] = [
    {
      id: 'towers',
      name: 'Telecom Towers',
      description: 'Cell towers and communication infrastructure',
      icon: '📡',
      color: '#3B82F6',
      subCategories: [
        {
          id: 'cell-tower',
          name: 'Cell Tower',
          description: 'Mobile communication towers',
          icon: '📡',
          color: '#3B82F6',
          attributes: [
            { name: 'height', label: 'Height', type: 'number', required: true, unit: 'meters' },
            { name: 'frequency', label: 'Frequency', type: 'select', required: true, options: ['2G', '3G', '4G', '5G'] },
            { name: 'coverage_radius', label: 'Coverage Radius', type: 'number', required: false, unit: 'km' }
          ]
        },
        {
          id: 'microwave',
          name: 'Microwave Tower',
          description: 'Microwave communication towers',
          attributes: [
            { name: 'frequency_band', label: 'Frequency Band', type: 'text', required: true },
            { name: 'power_output', label: 'Power Output', type: 'number', required: true, unit: 'watts' }
          ]
        }
      ],
      requiredAttributes: ['height', 'status'],
      optionalAttributes: ['vendor', 'model'],
      defaultAttributes: { status: 'active' },
      permissions: ['view', 'edit', 'delete'],
      isActive: true
    },
    {
      id: 'equipment',
      name: 'Network Equipment',
      description: 'Routers, switches, and other network hardware',
      icon: '🔧',
      color: '#10B981',
      subCategories: [
        {
          id: 'router',
          name: 'Router',
          description: 'Network routing equipment',
          attributes: [
            { name: 'ip_address', label: 'IP Address', type: 'text', required: true },
            { name: 'ports', label: 'Number of Ports', type: 'number', required: true },
            { name: 'throughput', label: 'Throughput', type: 'number', required: false, unit: 'Mbps' }
          ]
        },
        {
          id: 'switch',
          name: 'Network Switch',
          description: 'Network switching equipment',
          attributes: [
            { name: 'ports', label: 'Number of Ports', type: 'number', required: true },
            { name: 'vlan_support', label: 'VLAN Support', type: 'boolean', required: false }
          ]
        }
      ],
      requiredAttributes: ['model', 'serialNumber'],
      optionalAttributes: ['warranty', 'vendor'],
      defaultAttributes: { status: 'active' },
      permissions: ['view', 'edit'],
      isActive: true
    },
    {
      id: 'fiber',
      name: 'Fiber Infrastructure',
      description: 'Fiber optic cables and related infrastructure',
      icon: '🌐',
      color: '#F59E0B',
      subCategories: [
        {
          id: 'fiber-cable',
          name: 'Fiber Cable',
          description: 'Fiber optic cables',
          attributes: [
            { name: 'length', label: 'Length', type: 'number', required: true, unit: 'meters' },
            { name: 'fiber_count', label: 'Fiber Count', type: 'number', required: true },
            { name: 'type', label: 'Cable Type', type: 'select', required: true, options: ['Single-mode', 'Multi-mode'] }
          ]
        },
        {
          id: 'splice-closure',
          name: 'Splice Closure',
          description: 'Fiber splice points',
          attributes: [
            { name: 'capacity', label: 'Splice Capacity', type: 'number', required: true },
            { name: 'environment', label: 'Environment', type: 'select', required: true, options: ['Outdoor', 'Indoor', 'Underground'] }
          ]
        }
      ],
      requiredAttributes: ['length', 'type'],
      optionalAttributes: ['installation_date'],
      defaultAttributes: { status: 'active' },
      permissions: ['view', 'edit'],
      isActive: true
    }
  ];

  // Mock infrastructure data
  const mockInfrastructure: InfrastructureItem[] = [
    {
      id: 'tower-001',
      name: 'Mumbai Central Tower',
      category: categories[0],
      subCategory: 'cell-tower',
      description: 'Primary 5G tower serving Mumbai Central area',
      coordinates: { lat: 19.0760, lng: 72.8777 },
      address: 'Mumbai Central, Mumbai, Maharashtra',
      customAttributes: {
        height: 45,
        frequency: '5G',
        coverage_radius: 2.5,
        power_consumption: 12.5
      },
      status: 'active',
      priority: 'high',
      owner: 'Opti Connect',
      assignedTo: 'tech-team-mumbai',
      installationDate: '2023-06-15',
      maintenanceSchedule: '2024-06-15',
      warrantyExpiry: '2025-06-15',
      cost: 2500000,
      vendor: 'Nokia',
      model: 'AirScale 5G',
      serialNumber: 'NK-5G-001-MUM',
      attachments: [],
      tags: ['5G', 'Mumbai', 'Primary'],
      metadata: {
        createdBy: currentUserId,
        createdAt: '2023-06-01T00:00:00Z',
        updatedBy: currentUserId,
        updatedAt: '2024-01-15T10:30:00Z',
        lastInspected: '2024-01-10T09:00:00Z',
        inspectedBy: 'inspector-001',
        version: 1
      },
      permissions: {
        view: ['all'],
        edit: ['admin', 'manager', 'technician'],
        delete: ['admin', 'manager']
      },
      isVisible: true,
      layerId: 'towers-layer'
    },
    {
      id: 'router-001',
      name: 'Pune Core Router',
      category: categories[1],
      subCategory: 'router',
      description: 'Core network router for Pune region',
      coordinates: { lat: 18.5204, lng: 73.8567 },
      address: 'Pune IT Park, Pune, Maharashtra',
      customAttributes: {
        ip_address: '192.168.1.1',
        ports: 48,
        throughput: 10000,
        firmware_version: 'v2.1.4'
      },
      status: 'active',
      priority: 'critical',
      owner: 'Opti Connect',
      assignedTo: 'network-team-pune',
      installationDate: '2023-03-10',
      cost: 850000,
      vendor: 'Cisco',
      model: 'ASR 9000',
      serialNumber: 'CS-ASR9K-001-PUN',
      attachments: [],
      tags: ['Core', 'Pune', 'Critical'],
      metadata: {
        createdBy: currentUserId,
        createdAt: '2023-03-01T00:00:00Z',
        updatedBy: currentUserId,
        updatedAt: '2024-01-12T14:20:00Z',
        version: 2
      },
      permissions: {
        view: ['all'],
        edit: ['admin', 'manager'],
        delete: ['admin']
      },
      isVisible: true,
      layerId: 'equipment-layer'
    },
    {
      id: 'fiber-001',
      name: 'Mumbai-Pune Fiber Link',
      category: categories[2],
      subCategory: 'fiber-cable',
      description: 'Primary fiber link between Mumbai and Pune',
      coordinates: { lat: 18.8, lng: 73.2 },
      address: 'Mumbai-Pune Expressway',
      customAttributes: {
        length: 148000,
        fiber_count: 144,
        type: 'Single-mode',
        burial_depth: 1.2
      },
      status: 'active',
      priority: 'high',
      owner: 'Opti Connect',
      installationDate: '2022-12-20',
      cost: 15000000,
      vendor: 'Corning',
      model: 'SMF-28e+',
      serialNumber: 'CR-SMF28-001-MH',
      attachments: [],
      tags: ['Fiber', 'Backbone', 'Interstate'],
      metadata: {
        createdBy: currentUserId,
        createdAt: '2022-12-01T00:00:00Z',
        updatedBy: currentUserId,
        updatedAt: '2024-01-08T11:15:00Z',
        version: 1
      },
      permissions: {
        view: ['all'],
        edit: ['admin', 'manager'],
        delete: ['admin']
      },
      isVisible: true,
      layerId: 'fiber-layer'
    }
  ];

  // Filter infrastructure data
  const filteredData = useMemo(() => {
    return mockInfrastructure.filter(item => {
      if (filter.categories && !filter.categories.includes(item.category.id)) return false;
      if (filter.subCategories && !filter.subCategories.includes(item.subCategory!)) return false;
      if (filter.status && !filter.status.includes(item.status)) return false;
      if (filter.priority && !filter.priority.includes(item.priority)) return false;
      if (filter.tags && !filter.tags.some(tag => item.tags.includes(tag))) return false;
      if (filter.searchTerm) {
        const term = filter.searchTerm.toLowerCase();
        if (!item.name.toLowerCase().includes(term) &&
            !item.description?.toLowerCase().includes(term) &&
            !item.address?.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [filter]);

  const handleAddItem = useCallback(() => {
    setFormData({
      category: categories[0],
      status: 'active',
      priority: 'medium',
      owner: 'Opti Connect',
      customAttributes: {},
      tags: [],
      attachments: [],
      permissions: {
        view: ['all'],
        edit: ['admin', 'manager'],
        delete: ['admin']
      },
      isVisible: true
    });
    setShowAddModal(true);
  }, []);

  const handleEditItem = useCallback((item: InfrastructureItem) => {
    setEditingItem(item);
    setFormData(item);
    setShowEditModal(true);
  }, []);

  const handleSaveItem = useCallback(() => {
    // In real app, this would save to backend
    setShowAddModal(false);
    setShowEditModal(false);
    setFormData({});
    setEditingItem(null);
  }, [formData]);

  const handleDeleteItem = useCallback((itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      // In real app, this would delete from backend
    }
  }, []);

  const handleBulkAction = useCallback((action: string) => {
    // In real app, this would perform bulk action on backend
    setSelectedItems([]);
  }, [selectedItems]);

  const handleExport = useCallback((exportConfig: Partial<InfrastructureExport>) => {
    // In real app, this would export data
    setShowExportModal(false);
  }, []);

  const handleMapClick = useCallback((coordinates: Coordinates) => {
    setSelectedCoordinates(coordinates);
    setFormData(prev => ({ ...prev, coordinates }));
    setShowMapPicker(false);
  }, []);

  const canEdit = useCallback((item: InfrastructureItem) => {
    return item.permissions.edit.includes('all') ||
           item.permissions.edit.includes(userRole) ||
           item.metadata.createdBy === currentUserId;
  }, [userRole, currentUserId]);

  const canDelete = useCallback((item: InfrastructureItem) => {
    return item.permissions.delete.includes('all') ||
           item.permissions.delete.includes(userRole) ||
           item.metadata.createdBy === currentUserId;
  }, [userRole, currentUserId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute inset-4 bg-white rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Infrastructure Data Management</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage telecom infrastructure with manual entry, coordinate input, and visualization
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'data', label: 'Infrastructure Data', icon: '🏗️' },
            { id: 'add', label: 'Add New', icon: '➕' },
            { id: 'categories', label: 'Categories', icon: '📂' },
            { id: 'reports', label: 'Reports', icon: '📊' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Infrastructure Data Tab */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              {/* Filters and Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Search */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search infrastructure..."
                      value={filter.searchTerm || ''}
                      onChange={(e) => setFilter(prev => ({ ...prev, searchTerm: e.target.value }))}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                  </div>

                  {/* Category Filter */}
                  <select
                    value={filter.categories?.[0] || ''}
                    onChange={(e) => setFilter(prev => ({
                      ...prev,
                      categories: e.target.value ? [e.target.value] : undefined
                    }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>

                  {/* Status Filter */}
                  <select
                    value={filter.status?.[0] || ''}
                    onChange={(e) => setFilter(prev => ({
                      ...prev,
                      status: e.target.value ? [e.target.value as any] : undefined
                    }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="planned">Planned</option>
                    <option value="decommissioned">Decommissioned</option>
                  </select>

                  {/* Priority Filter */}
                  <select
                    value={filter.priority?.[0] || ''}
                    onChange={(e) => setFilter(prev => ({
                      ...prev,
                      priority: e.target.value ? [e.target.value as any] : undefined
                    }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  {selectedItems.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {selectedItems.length} selected
                      </span>
                      <button
                        onClick={() => handleBulkAction('update_status')}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        Update Status
                      </button>
                      <button
                        onClick={() => handleBulkAction('delete')}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setShowExportModal(true)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Export
                  </button>

                  <button
                    onClick={handleAddItem}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add New
                  </button>
                </div>
              </div>

              {/* Infrastructure Grid/Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            className="rounded"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItems(filteredData.map(item => item.id));
                              } else {
                                setSelectedItems([]);
                              }
                            }}
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name & Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Priority
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cost
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredData.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(item.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedItems(prev => [...prev, item.id]);
                                } else {
                                  setSelectedItems(prev => prev.filter(id => id !== item.id));
                                }
                              }}
                              className="rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-2xl mr-3">{item.category.icon}</div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                <div className="text-sm text-gray-500">
                                  {item.coordinates.lat.toFixed(4)}, {item.coordinates.lng.toFixed(4)}
                                </div>
                                <div className="text-xs text-gray-400">{item.address}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.category.name}</div>
                            <div className="text-sm text-gray-500">{item.subCategory}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              item.status === 'active' ? 'bg-green-100 text-green-800' :
                              item.status === 'inactive' ? 'bg-red-100 text-red-800' :
                              item.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                              item.status === 'planned' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              item.priority === 'critical' ? 'bg-red-100 text-red-800' :
                              item.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {item.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.cost ? `₹${(item.cost / 100000).toFixed(1)}L` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {/* In real app, this would pan map to coordinates */}}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                📍
                              </button>
                              {canEdit(item) && (
                                <button
                                  onClick={() => handleEditItem(item)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  ✏️
                                </button>
                              )}
                              {canDelete(item) && (
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Add New Tab */}
          {activeTab === 'add' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Add Cards */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Quick Add</h3>
                  {categories.map(category => (
                    <div key={category.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="text-3xl">{category.icon}</div>
                        <div>
                          <h4 className="font-medium text-gray-900">{category.name}</h4>
                          <p className="text-sm text-gray-500">{category.description}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {category.subCategories.slice(0, 3).map(sub => (
                          <button
                            key={sub.id}
                            onClick={() => {
                              setFormData({
                                category,
                                subCategory: sub.id,
                                status: 'active',
                                priority: 'medium',
                                customAttributes: {},
                                tags: [],
                                attachments: [],
                                permissions: {
                                  view: ['all'],
                                  edit: ['admin', 'manager'],
                                  delete: ['admin']
                                },
                                isVisible: true
                              });
                              setShowAddModal(true);
                            }}
                            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          >
                            Add {sub.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coordinate Picker */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Coordinate Input</h3>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Manual Coordinate Entry
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                            <input
                              type="number"
                              step="any"
                              placeholder="19.0760"
                              value={selectedCoordinates?.lat || ''}
                              onChange={(e) => setSelectedCoordinates(prev => ({
                                lat: parseFloat(e.target.value) || 0,
                                lng: prev?.lng || 0
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                            <input
                              type="number"
                              step="any"
                              placeholder="72.8777"
                              value={selectedCoordinates?.lng || ''}
                              onChange={(e) => setSelectedCoordinates(prev => ({
                                lat: prev?.lat || 0,
                                lng: parseFloat(e.target.value) || 0
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-sm text-gray-500 mb-2">OR</div>
                        <button
                          onClick={() => setShowMapPicker(true)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          📍 Pick from Map
                        </button>
                      </div>

                      {selectedCoordinates && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-sm text-green-800">
                            Selected: {selectedCoordinates.lat.toFixed(6)}, {selectedCoordinates.lng.toFixed(6)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Locations */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Recent Locations</h4>
                    <div className="space-y-2">
                      {mockInfrastructure.slice(0, 3).map(item => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedCoordinates(item.coordinates)}
                          className="w-full text-left p-2 hover:bg-gray-50 rounded border border-gray-100"
                        >
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500">
                            {item.coordinates.lat.toFixed(4)}, {item.coordinates.lng.toFixed(4)}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Infrastructure Categories</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Add Category
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map(category => (
                  <div key={category.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-3xl">{category.icon}</div>
                        <div>
                          <h4 className="font-medium text-gray-900">{category.name}</h4>
                          <p className="text-sm text-gray-500">{category.description}</p>
                        </div>
                      </div>
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700">Sub-categories</h5>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {category.subCategories.map(sub => (
                            <span
                              key={sub.id}
                              className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                            >
                              {sub.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-gray-700">Required Attributes</h5>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {category.requiredAttributes.map(attr => (
                            <span
                              key={attr}
                              className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                            >
                              {attr}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex space-x-2">
                      <button className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
                        Edit
                      </button>
                      <button className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                        Manage
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Infrastructure Reports</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Generate Report
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Items</p>
                      <p className="text-3xl font-bold">{mockInfrastructure.length}</p>
                    </div>
                    <span className="text-4xl opacity-80">🏗️</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Active</p>
                      <p className="text-3xl font-bold">
                        {mockInfrastructure.filter(i => i.status === 'active').length}
                      </p>
                    </div>
                    <span className="text-4xl opacity-80">✅</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-100 text-sm">Maintenance</p>
                      <p className="text-3xl font-bold">
                        {mockInfrastructure.filter(i => i.status === 'maintenance').length}
                      </p>
                    </div>
                    <span className="text-4xl opacity-80">⚠️</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Total Value</p>
                      <p className="text-3xl font-bold">
                        ₹{(mockInfrastructure.reduce((sum, i) => sum + (i.cost || 0), 0) / 10000000).toFixed(0)}Cr
                      </p>
                    </div>
                    <span className="text-4xl opacity-80">💰</span>
                  </div>
                </div>
              </div>

              {/* Category Distribution */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h4>
                <div className="space-y-3">
                  {categories.map(category => {
                    const count = mockInfrastructure.filter(item => item.category.id === category.id).length;
                    const percentage = (count / mockInfrastructure.length) * 100;
                    return (
                      <div key={category.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{category.icon}</span>
                          <span className="text-sm text-gray-600">{category.name}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: category.color
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-8">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {(showAddModal || showEditModal) && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {showAddModal ? 'Add Infrastructure Item' : 'Edit Infrastructure Item'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setFormData({});
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="Infrastructure item name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={formData.category?.id || ''}
                      onChange={(e) => {
                        const category = categories.find(c => c.id === e.target.value);
                        setFormData(prev => ({ ...prev, category, subCategory: undefined }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.category && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sub-category</label>
                      <select
                        value={formData.subCategory || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, subCategory: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select sub-category</option>
                        {formData.category.subCategories.map(sub => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status || 'active'}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="planned">Planned</option>
                      <option value="decommissioned">Decommissioned</option>
                    </select>
                  </div>
                </div>

                {/* Coordinates */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coordinates</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      step="any"
                      placeholder="Latitude"
                      value={formData.coordinates?.lat || selectedCoordinates?.lat || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        coordinates: {
                          lat: parseFloat(e.target.value) || 0,
                          lng: prev.coordinates?.lng || selectedCoordinates?.lng || 0
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="Longitude"
                      value={formData.coordinates?.lng || selectedCoordinates?.lng || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        coordinates: {
                          lat: prev.coordinates?.lat || selectedCoordinates?.lat || 0,
                          lng: parseFloat(e.target.value) || 0
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Detailed description of the infrastructure item"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setFormData({});
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveItem}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {showAddModal ? 'Add Item' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Export Modal */}
        {showExportModal && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Export Data</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                  <div className="space-y-2">
                    {['csv', 'xlsx', 'kml', 'geojson', 'pdf'].map(format => (
                      <label key={format} className="flex items-center">
                        <input
                          type="radio"
                          name="format"
                          value={format}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 uppercase">{format}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span className="text-sm text-gray-700">Include coordinates</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm text-gray-700">Include attachments</span>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleExport({})}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Export
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Map Picker Modal */}
        {showMapPicker && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Pick Location from Map</h3>
                <button
                  onClick={() => setShowMapPicker(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="h-64 bg-gradient-to-br from-blue-100 via-green-50 to-blue-200 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-4">🗺️</div>
                  <p className="text-gray-600">Interactive map for coordinate selection</p>
                  <p className="text-sm text-gray-500 mt-2">Click anywhere to select coordinates</p>
                  <button
                    onClick={() => handleMapClick({ lat: 19.0760, lng: 72.8777 })}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Select Mumbai Central (Demo)
                  </button>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowMapPicker(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfrastructureDataManagement;