import React, { useState, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useDataStore } from '../../contexts/DataStoreContext';

export interface POPLocationData {
  id?: string;
  name: string;
  unique_id: string;
  network_id: string;
  ref_code: string;
  status: 'RFS' | 'L1' | 'L2' | 'L3';
  address: string;
  contact_name: string;
  contact_no: string;
  is_rented?: boolean;
  rent_amount?: number;
  agreement_start_date?: string;
  agreement_end_date?: string;
  nature_of_business?: string;
  structure_type?: string;
  ups_availability?: boolean;
  backup_capacity?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  type: 'pop' | 'subPop';
  icon?: string;
  color?: string;
  description?: string;
  created_date?: string;
  last_updated?: string;
}

interface AddPOPLocationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: POPLocationData) => void;
  initialCoordinates?: { lat: number; lng: number };
  editingData?: POPLocationData | null;
}

const AddPOPLocationForm: React.FC<AddPOPLocationFormProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCoordinates,
  editingData
}) => {
  const { addNotification } = useTheme();
  const { saveData, generateDataName } = useDataStore();

  const [formData, setFormData] = useState<POPLocationData>({
    id: '',
    name: '',
    unique_id: '',
    network_id: '',
    ref_code: '',
    status: 'RFS',
    address: '',
    contact_name: '',
    contact_no: '',
    is_rented: false,
    rent_amount: 0,
    agreement_start_date: '',
    agreement_end_date: '',
    nature_of_business: '',
    structure_type: '',
    ups_availability: false,
    backup_capacity: '',
    coordinates: initialCoordinates || { lat: 0, lng: 0 },
    type: 'pop',
    icon: '📡',
    color: '#3B82F6'
  });

  const [currentTab, setCurrentTab] = useState<'basic' | 'location' | 'business'>('basic');

  // Check if form is valid to show Save button
  const isFormValid = formData.name.trim() !== '' &&
                     formData.coordinates.lat !== 0 &&
                     formData.coordinates.lng !== 0 &&
                     formData.status &&
                     formData.type;

  // Icon options for different types
  const iconOptions = {
    pop: [
      { icon: '📡', name: 'Antenna', color: '#3B82F6' },
      { icon: '🗼', name: 'Tower', color: '#1E40AF' },
      { icon: '🎯', name: 'Target', color: '#2563EB' },
      { icon: '🔴', name: 'Red Circle', color: '#DC2626' },
      { icon: '🟢', name: 'Green Circle', color: '#16A34A' },
      { icon: '🔵', name: 'Blue Circle', color: '#2563EB' }
    ],
    subPop: [
      { icon: '📶', name: 'Signal', color: '#10B981' },
      { icon: '📋', name: 'Node', color: '#059669' },
      { icon: '🟪', name: 'Purple Square', color: '#7C3AED' },
      { icon: '🟡', name: 'Yellow Circle', color: '#EAB308' },
      { icon: '🟠', name: 'Orange Circle', color: '#EA580C' },
      { icon: '⚡', name: 'Lightning', color: '#F59E0B' }
    ]
  };

  useEffect(() => {
    if (editingData) {
      setFormData(editingData);
    } else if (initialCoordinates) {
      setFormData(prev => ({ ...prev, coordinates: initialCoordinates }));
    }
  }, [editingData, initialCoordinates]);

  useEffect(() => {
    // Generate unique IDs when type changes
    if (!editingData) {
      const prefix = formData.type === 'pop' ? 'POP' : 'SPOP';
      const uniqueId = `${prefix}.${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const networkId = `BHARAT-${uniqueId}`;
      const numericId = Math.floor(Math.random() * 9000) + 1000; // Generate 4-digit ID

      setFormData(prev => ({
        ...prev,
        id: numericId.toString(),
        unique_id: uniqueId,
        network_id: networkId,
        icon: formData.type === 'pop' ? '📡' : '📶',
        color: formData.type === 'pop' ? '#3B82F6' : '#10B981'
      }));
    }
  }, [formData.type, editingData]);

  const handleInputChange = (field: keyof POPLocationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCoordinateChange = (field: 'lat' | 'lng', value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setFormData(prev => ({
        ...prev,
        coordinates: { ...prev.coordinates, [field]: numValue }
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      alert('Name is required');
      return;
    }

    if (!formData.coordinates.lat || !formData.coordinates.lng) {
      alert('Valid coordinates are required');
      return;
    }

    try {
      // Add timestamps
      const now = new Date().toISOString();
      const finalData = {
        ...formData,
        id: editingData?.id || Date.now().toString(),
        created_on: editingData?.id ? undefined : now,
        updated_on: now
      };

      // Save to DataStore as Infrastructure data
      const infrastructureData = {
        name: formData.name,
        type: 'infrastructure' as const,
        category: 'Infrastructure',
        description: `${formData.type.toUpperCase()} location: ${formData.address || 'Manual entry'}`,
        tags: ['manual', formData.type, 'infrastructure'],
        data: {
          locations: [{
            id: finalData.id,
            name: formData.name,
            lat: formData.coordinates.lat,
            lng: formData.coordinates.lng,
            type: formData.type as 'pop' | 'subPop',
            status: formData.status,
            properties: {
              unique_id: formData.unique_id,
              network_id: formData.network_id,
              ref_code: formData.ref_code,
              address: formData.address,
              contact_name: formData.contact_name,
              contact_no: formData.contact_no,
              is_rented: formData.is_rented,
              rent_amount: formData.rent_amount,
              agreement_start_date: formData.agreement_start_date,
              agreement_end_date: formData.agreement_end_date,
              nature_of_business: formData.nature_of_business,
              structure_type: formData.structure_type,
              ups_availability: formData.ups_availability,
              backup_capacity: formData.backup_capacity,
              icon: formData.icon,
              color: formData.color
            }
          }],
          totalCount: 1,
          categories: [formData.type.toUpperCase()]
        },
        source: 'manual' as const
      };

      const savedId = await saveData(infrastructureData);

      addNotification({
        type: 'success',
        title: 'Location Saved',
        message: `${formData.type.toUpperCase()} location "${formData.name}" has been saved successfully!`,
        duration: 4000
      });

      // Also call the original onSave for backward compatibility
      onSave(finalData);
      onClose();

    } catch (error) {
      console.error('Failed to save location:', error);
      addNotification({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save the location. Please try again.',
        duration: 5000
      });
    }
  };

  const handleReset = () => {
    setFormData({
      id: '',
      name: '',
      unique_id: '',
      network_id: '',
      ref_code: '',
      status: 'RFS',
      address: '',
      contact_name: '',
      contact_no: '',
      is_rented: false,
      rent_amount: 0,
      agreement_start_date: '',
      agreement_end_date: '',
      nature_of_business: '',
      structure_type: '',
      ups_availability: false,
      backup_capacity: '',
      coordinates: initialCoordinates || { lat: 0, lng: 0 },
      type: 'pop',
      icon: '📡',
      color: '#3B82F6'
    });
    setCurrentTab('basic');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full ${
          false ? 'bg-gray-800' : 'bg-white'
        }`}>
          {/* Enhanced Header */}
          <div className={`px-6 py-5 border-b ${false ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${formData.type === 'pop' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                  <span className="text-2xl">{formData.icon}</span>
                </div>
                <div>
                  <h3 className={`text-xl font-semibold ${false ? 'text-white' : 'text-gray-900'}`}>
                    {editingData ? 'Edit' : 'Add New'} {formData.type === 'pop' ? 'POP' : 'Sub POP'} Location
                  </h3>
                  <p className={`text-sm ${false ? 'text-gray-400' : 'text-gray-600'}`}>
                    {formData.id && `ID: ${formData.id} • `}
                    {formData.unique_id && `${formData.unique_id}`}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`rounded-md p-2 hover:bg-gray-100 transition-colors ${false ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-400'}`}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-4">
              <nav className="flex space-x-8">
                {[
                  { id: 'basic', label: 'Basic Info' },
                  { id: 'location', label: 'Location & Contact' },
                  { id: 'business', label: 'Business Details' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      currentTab === tab.id
                        ? `border-blue-500 ${false ? 'text-blue-400' : 'text-blue-600'}`
                        : `border-transparent ${false ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="px-6 py-4">
            {/* Enhanced Basic Info Tab */}
            {currentTab === 'basic' && (
              <div className="space-y-6">
                {/* Type Selection */}
                <div className={`p-4 rounded-lg border ${false ? 'bg-gray-750 border-gray-600' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'}`}>
                  <label className={`block text-sm font-semibold mb-3 ${false ? 'text-gray-300' : 'text-gray-700'}`}>
                    Location Type *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.type === 'pop'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : false ? 'border-gray-600 hover:border-gray-500 text-gray-300' : 'border-gray-300 hover:border-blue-300 text-gray-700'
                    }`}>
                      <input
                        type="radio"
                        value="pop"
                        checked={formData.type === 'pop'}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">📡</span>
                        <span className="font-medium">POP Location</span>
                      </div>
                    </label>
                    <label className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.type === 'subPop'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : false ? 'border-gray-600 hover:border-gray-500 text-gray-300' : 'border-gray-300 hover:border-green-300 text-gray-700'
                    }`}>
                      <input
                        type="radio"
                        value="subPop"
                        checked={formData.type === 'subPop'}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">📶</span>
                        <span className="font-medium">Sub POP Location</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Icon Selection */}
                <div>
                  <label className={`block text-sm font-semibold mb-3 ${false ? 'text-gray-300' : 'text-gray-700'}`}>
                    Choose Icon
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {iconOptions[formData.type].map((option) => (
                      <button
                        key={option.icon}
                        type="button"
                        onClick={() => {
                          handleInputChange('icon', option.icon);
                          handleInputChange('color', option.color);
                        }}
                        className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                          formData.icon === option.icon
                            ? `border-2 shadow-lg`
                            : false ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-blue-300'
                        }`}
                        style={{
                          borderColor: formData.icon === option.icon ? option.color : undefined,
                          backgroundColor: formData.icon === option.icon ? `${option.color}20` : undefined
                        }}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">{option.icon}</div>
                          <div className="text-xs font-medium">{option.name}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ID Fields */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Numeric ID */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${false ? 'text-gray-300' : 'text-gray-700'}`}>
                      ID *
                    </label>
                    <input
                      type="text"
                      value={formData.id}
                      readOnly
                      className={`w-full px-3 py-2 border rounded-md ${
                        false
                          ? 'bg-gray-600 border-gray-500 text-gray-300 cursor-not-allowed'
                          : 'bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed'
                      }`}
                      placeholder="Auto-generated"
                    />
                  </div>

                  {/* Unique ID */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${false ? 'text-gray-300' : 'text-gray-700'}`}>
                      Unique ID
                    </label>
                    <input
                      type="text"
                      value={formData.unique_id}
                      readOnly
                      className={`w-full px-3 py-2 border rounded-md ${
                        false
                          ? 'bg-gray-600 border-gray-500 text-gray-300 cursor-not-allowed'
                          : 'bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed'
                      }`}
                      placeholder="Auto-generated"
                    />
                  </div>

                  {/* Network ID */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${false ? 'text-gray-300' : 'text-gray-700'}`}>
                      Network ID
                    </label>
                    <input
                      type="text"
                      value={formData.network_id}
                      readOnly
                      className={`w-full px-3 py-2 border rounded-md ${
                        false
                          ? 'bg-gray-600 border-gray-500 text-gray-300 cursor-not-allowed'
                          : 'bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed'
                      }`}
                      placeholder="Auto-generated"
                    />
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${false ? 'text-gray-300' : 'text-gray-700'}`}>
                    Location Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                      false
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter descriptive location name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Reference Code */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${false ? 'text-gray-300' : 'text-gray-700'}`}>
                      Reference Code
                    </label>
                    <input
                      type="text"
                      value={formData.ref_code}
                      onChange={(e) => handleInputChange('ref_code', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        false
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Enter reference code"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${false ? 'text-gray-300' : 'text-gray-700'}`}>
                      Status *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                        false
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      required
                    >
                      <option value="RFS">🟢 RFS (Ready for Service)</option>
                      <option value="L1">🟡 L1 (Level 1)</option>
                      <option value="L2">🟠 L2 (Level 2)</option>
                      <option value="L3">🔴 L3 (Level 3)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Location & Contact Tab */}
            {currentTab === 'location' && (
              <div className="space-y-4">
                {/* Coordinates */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${false ? 'text-gray-300' : 'text-gray-700'}`}>
                    Coordinates *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-xs mb-1 ${false ? 'text-gray-400' : 'text-gray-500'}`}>
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.coordinates.lat}
                        onChange={(e) => handleCoordinateChange('lat', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          false
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="0.000000"
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-xs mb-1 ${false ? 'text-gray-400' : 'text-gray-500'}`}>
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.coordinates.lng}
                        onChange={(e) => handleCoordinateChange('lng', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          false
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="0.000000"
                        required
                      />
                    </div>
                  </div>
                  <p className={`text-xs mt-1 ${false ? 'text-gray-400' : 'text-gray-500'}`}>
                    Click on the map to automatically fill coordinates
                  </p>
                </div>

                {/* Address */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${false ? 'text-gray-300' : 'text-gray-700'}`}>
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      false
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter full address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Contact Name */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${false ? 'text-gray-300' : 'text-gray-700'}`}>
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={formData.contact_name}
                      onChange={(e) => handleInputChange('contact_name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        false
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Contact person name"
                    />
                  </div>

                  {/* Contact Number */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${false ? 'text-gray-300' : 'text-gray-700'}`}>
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      value={formData.contact_no}
                      onChange={(e) => handleInputChange('contact_no', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        false
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Business Details Tab */}
            {currentTab === 'business' && (
              <div className="space-y-4">
                {/* Rental Information */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_rented || false}
                      onChange={(e) => handleInputChange('is_rented', e.target.checked)}
                      className="mr-2"
                    />
                    <span className={`text-sm font-medium ${false ? 'text-gray-300' : 'text-gray-700'}`}>
                      Is Rented
                    </span>
                  </label>
                </div>

                {formData.is_rented && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      {/* Rent Amount */}
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${false ? 'text-gray-300' : 'text-gray-700'}`}>
                          Rent Amount
                        </label>
                        <input
                          type="number"
                          value={formData.rent_amount || 0}
                          onChange={(e) => handleInputChange('rent_amount', parseFloat(e.target.value) || 0)}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            false
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="0"
                        />
                      </div>

                      {/* Agreement Start Date */}
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${false ? 'text-gray-300' : 'text-gray-700'}`}>
                          Agreement Start Date
                        </label>
                        <input
                          type="date"
                          value={formData.agreement_start_date}
                          onChange={(e) => handleInputChange('agreement_start_date', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            false
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>

                      {/* Agreement End Date */}
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${false ? 'text-gray-300' : 'text-gray-700'}`}>
                          Agreement End Date
                        </label>
                        <input
                          type="date"
                          value={formData.agreement_end_date}
                          onChange={(e) => handleInputChange('agreement_end_date', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            false
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {/* Nature of Business */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${false ? 'text-gray-300' : 'text-gray-700'}`}>
                      Nature of Business
                    </label>
                    <input
                      type="text"
                      value={formData.nature_of_business}
                      onChange={(e) => handleInputChange('nature_of_business', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        false
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Type of business"
                    />
                  </div>

                  {/* Structure Type */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${false ? 'text-gray-300' : 'text-gray-700'}`}>
                      Structure Type
                    </label>
                    <input
                      type="text"
                      value={formData.structure_type}
                      onChange={(e) => handleInputChange('structure_type', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        false
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Building/structure type"
                    />
                  </div>
                </div>

                {/* UPS Availability */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.ups_availability || false}
                      onChange={(e) => handleInputChange('ups_availability', e.target.checked)}
                      className="mr-2"
                    />
                    <span className={`text-sm font-medium ${false ? 'text-gray-300' : 'text-gray-700'}`}>
                      UPS Available
                    </span>
                  </label>
                </div>

                {formData.ups_availability && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${false ? 'text-gray-300' : 'text-gray-700'}`}>
                      Backup Capacity (In KVA)
                    </label>
                    <input
                      type="text"
                      value={formData.backup_capacity}
                      onChange={(e) => handleInputChange('backup_capacity', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        false
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Backup capacity"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Enhanced Form Actions */}
            <div className={`mt-8 pt-6 border-t ${false ? 'border-gray-700' : 'border-gray-200'}`}>
              {/* Form Validation Status */}
              {!isFormValid && (
                <div className={`mb-4 p-3 rounded-lg ${false ? 'bg-yellow-900/20 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'}`}>
                  <div className="flex items-center">
                    <span className="text-yellow-500 mr-2">⚠️</span>
                    <span className={`text-sm ${false ? 'text-yellow-300' : 'text-yellow-700'}`}>
                      Please fill in all required fields to enable saving
                    </span>
                  </div>
                  <ul className={`mt-2 text-xs ${false ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    {!formData.name.trim() && <li>• Location name is required</li>}
                    {(formData.coordinates.lat === 0 || formData.coordinates.lng === 0) && <li>• Valid coordinates are required</li>}
                    {!formData.status && <li>• Status selection is required</li>}
                  </ul>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className={`px-4 py-2 border rounded-lg font-medium text-sm transition-colors ${
                      false
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    🔄 Reset
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className={`px-4 py-2 border rounded-lg font-medium text-sm transition-colors ${
                      false
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    ❌ Cancel
                  </button>
                </div>

                {/* Conditional Save Button */}
                {isFormValid && (
                  <button
                    type="submit"
                    className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 shadow-lg ${
                      formData.type === 'pop'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                        : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
                    }`}
                  >
                    {formData.icon} {editingData ? 'Update' : 'Save'} Location
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPOPLocationForm;