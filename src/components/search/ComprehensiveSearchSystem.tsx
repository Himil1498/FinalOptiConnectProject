import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  SearchResult,
  SearchQuery,
  SearchFilters,
  SpatialSearch,
  SearchHistory,
  SavedSearch,
  SearchSuggestion,
  AddressSearchResult,
  PlaceSearchResult,
  CoordinateSearchResult,
  Coordinates,
  User
} from '../../types';
import { themeClasses, buttonVariants, focusStyles, componentPatterns, iconColors } from '../../utils/lightThemeHelper';
import { XMarkIcon, MagnifyingGlassIcon, AdjustmentsHorizontalIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

interface ComprehensiveSearchSystemProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  userRole: User['role'];
  onResultSelect: (result: SearchResult) => void;
  onNavigateToLocation: (coordinates: Coordinates) => void;
}

const ComprehensiveSearchSystem: React.FC<ComprehensiveSearchSystemProps> = ({
  isOpen,
  onClose,
  currentUserId,
  userRole,
  onResultSelect,
  onNavigateToLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'history' | 'saved' | 'filters'>('search');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [spatialSearch, setSpatialSearch] = useState<SpatialSearch | undefined>();
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<SearchResult['type'][]>(['address', 'place', 'infrastructure']);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSpatialSearch, setShowSpatialSearch] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Mock data for search functionality
  const mockSuggestions: SearchSuggestion[] = [
    { id: '1', text: 'Mumbai Central', type: 'place', frequency: 45, icon: '📍', coordinates: { lat: 19.0760, lng: 72.8777 } },
    { id: '2', text: 'Pune IT Park', type: 'place', frequency: 32, icon: '🏢', coordinates: { lat: 18.5204, lng: 73.8567 } },
    { id: '3', text: 'Tower Sites Maharashtra', type: 'infrastructure', frequency: 28, icon: '📡' },
    { id: '4', text: '19.0760, 72.8777', type: 'coordinate', frequency: 15, icon: '🌐' },
    { id: '5', text: 'Fiber Cable Routes', type: 'infrastructure', frequency: 22, icon: '🌐' },
    { id: '6', text: 'Mumbai, Maharashtra', type: 'address', frequency: 67, icon: '📮' },
  ];

  const mockSearchHistory: SearchHistory[] = [
    {
      id: 'h1',
      query: 'Mumbai Central Tower',
      type: 'infrastructure',
      timestamp: '2024-01-15T10:30:00Z',
      userId: currentUserId,
      resultsCount: 5
    },
    {
      id: 'h2',
      query: 'Pune Network Equipment',
      type: 'infrastructure',
      timestamp: '2024-01-15T09:15:00Z',
      userId: currentUserId,
      resultsCount: 12
    },
    {
      id: 'h3',
      query: '18.5204, 73.8567',
      type: 'coordinate',
      timestamp: '2024-01-14T16:45:00Z',
      userId: currentUserId,
      resultsCount: 1
    }
  ];

  const mockSavedSearches: SavedSearch[] = [
    {
      id: 's1',
      name: 'Active Towers in Maharashtra',
      description: 'All active telecom towers in Maharashtra state',
      query: {
        query: 'towers',
        types: ['infrastructure'],
        filters: { states: ['Maharashtra'], status: ['active'] },
        limit: 50,
        offset: 0
      },
      isPublic: false,
      createdBy: currentUserId,
      createdAt: '2024-01-10T00:00:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      usageCount: 8,
      tags: ['towers', 'maharashtra', 'monitoring'],
      notifications: {
        enabled: true,
        frequency: 'daily',
        conditions: ['new_items', 'status_changes']
      }
    },
    {
      id: 's2',
      name: 'Critical Network Equipment',
      description: 'High priority network infrastructure requiring attention',
      query: {
        query: 'equipment',
        types: ['infrastructure'],
        filters: { priority: ['critical', 'high'], status: ['active', 'maintenance'] },
        limit: 25,
        offset: 0
      },
      isPublic: true,
      createdBy: currentUserId,
      createdAt: '2024-01-08T00:00:00Z',
      updatedAt: '2024-01-12T14:20:00Z',
      usageCount: 15,
      tags: ['critical', 'equipment', 'monitoring'],
      notifications: {
        enabled: true,
        frequency: 'immediate',
        conditions: ['status_changes', 'new_critical']
      }
    }
  ];

  // Generate mock search results based on query
  const generateMockResults = useCallback((query: string, types: SearchResult['type'][]): SearchResult[] => {
    const results: SearchResult[] = [];

    // Address results
    if (types.includes('address') && query.toLowerCase().includes('mumbai')) {
      results.push({
        id: 'addr1',
        type: 'address',
        title: 'Mumbai Central Railway Station',
        subtitle: 'Major railway junction in Mumbai',
        description: 'One of the busiest railway stations in Mumbai, Maharashtra',
        coordinates: { lat: 19.0760, lng: 72.8777 },
        address: 'Mumbai Central, Mumbai, Maharashtra 400008',
        relevanceScore: 0.95,
        category: 'transport',
        icon: '🚉',
        actions: [
          { id: 'nav1', label: 'Navigate', icon: '🧭', action: 'navigate' },
          { id: 'share1', label: 'Share', icon: '📤', action: 'share' }
        ]
      } as AddressSearchResult);
    }

    // Place results
    if (types.includes('place') && (query.toLowerCase().includes('pune') || query.toLowerCase().includes('it park'))) {
      results.push({
        id: 'place1',
        type: 'place',
        title: 'Pune IT Park',
        subtitle: 'Information Technology Park',
        description: 'Major IT hub with multiple technology companies',
        coordinates: { lat: 18.5204, lng: 73.8567 },
        address: 'Pune IT Park, Pune, Maharashtra',
        relevanceScore: 0.88,
        category: 'business',
        icon: '🏢',
        actions: [
          { id: 'nav2', label: 'Navigate', icon: '🧭', action: 'navigate' },
          { id: 'view2', label: 'View Details', icon: '👁️', action: 'view' }
        ]
      } as PlaceSearchResult);
    }

    // Infrastructure results
    if (types.includes('infrastructure') && (query.toLowerCase().includes('tower') || query.toLowerCase().includes('mumbai'))) {
      results.push({
        id: 'infra1',
        type: 'infrastructure',
        title: 'Mumbai Central Tower',
        subtitle: 'Primary 5G tower serving Mumbai Central area',
        description: 'Active telecom tower with 5G capability, 45m height',
        coordinates: { lat: 19.0760, lng: 72.8777 },
        address: 'Mumbai Central, Mumbai, Maharashtra',
        relevanceScore: 0.92,
        category: 'towers',
        icon: '📡',
        metadata: {
          height: 45,
          frequency: '5G',
          status: 'active',
          owner: 'Opti Connect'
        },
        actions: [
          { id: 'view3', label: 'View Details', icon: '👁️', action: 'view' },
          { id: 'edit3', label: 'Edit', icon: '✏️', action: 'edit', permissions: ['admin', 'manager'] },
          { id: 'nav3', label: 'Navigate', icon: '🧭', action: 'navigate' }
        ]
      });
    }

    // Coordinate results
    if (types.includes('coordinate') && /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(query.trim())) {
      const [lat, lng] = query.split(',').map(s => parseFloat(s.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        results.push({
          id: 'coord1',
          type: 'coordinate',
          title: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          subtitle: 'Geographic Coordinates',
          description: 'Precise location coordinates in decimal degrees',
          coordinates: { lat, lng },
          relevanceScore: 1.0,
          category: 'coordinates',
          icon: '🌐',
          actions: [
            { id: 'nav4', label: 'Navigate', icon: '🧭', action: 'navigate' },
            { id: 'share4', label: 'Share', icon: '📤', action: 'share' }
          ]
        } as CoordinateSearchResult);
      }
    }

    // State results
    if (types.includes('state') && query.toLowerCase().includes('maharashtra')) {
      results.push({
        id: 'state1',
        type: 'state',
        title: 'Maharashtra',
        subtitle: 'Indian State',
        description: 'Western state of India with capital Mumbai',
        bounds: {
          north: 22.0,
          south: 15.6,
          east: 80.9,
          west: 72.6
        },
        relevanceScore: 0.85,
        category: 'administrative',
        icon: '🗺️',
        metadata: {
          capital: 'Mumbai',
          area: '307,713 km²',
          population: '112,372,972'
        },
        actions: [
          { id: 'view5', label: 'View Boundary', icon: '👁️', action: 'view' },
          { id: 'nav5', label: 'Zoom to Fit', icon: '🔍', action: 'navigate' }
        ]
      });
    }

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }, []);

  // Perform search with debouncing
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    // Simulate API delay
    setTimeout(() => {
      const results = generateMockResults(query, selectedTypes);
      setSearchResults(results);
      setIsSearching(false);

      // Add to search history
      const historyEntry: SearchHistory = {
        id: `h${Date.now()}`,
        query,
        type: 'mixed',
        timestamp: new Date().toISOString(),
        userId: currentUserId,
        resultsCount: results.length,
        filters: searchFilters,
        spatialSearch
      };
      setSearchHistory(prev => [historyEntry, ...prev.slice(0, 9)]);
    }, 500);
  }, [selectedTypes, searchFilters, spatialSearch, currentUserId, generateMockResults]);

  // Handle search input changes
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);

    if (value.length > 0) {
      // Show suggestions
      const filteredSuggestions = mockSuggestions.filter(s =>
        s.text.toLowerCase().includes(value.toLowerCase()) &&
        selectedTypes.includes(s.type)
      ).sort((a, b) => b.frequency - a.frequency);
      setSuggestions(filteredSuggestions.slice(0, 5));
      setShowSuggestions(true);

      // Perform search if query is long enough
      if (value.length >= 3) {
        performSearch(value);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setSearchResults([]);
    }
  }, [selectedTypes, performSearch]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.text);
    setShowSuggestions(false);
    performSearch(suggestion.text);
  }, [performSearch]);

  // Handle search result selection
  const handleResultSelect = useCallback((result: SearchResult) => {
    onResultSelect(result);
    if (result.coordinates) {
      onNavigateToLocation(result.coordinates);
    }
  }, [onResultSelect, onNavigateToLocation]);

  // Handle spatial search
  const handleSpatialSearchChange = useCallback((spatial: Partial<SpatialSearch>) => {
    setSpatialSearch(prev => ({ ...prev, ...spatial } as SpatialSearch));
  }, []);

  // Initialize data
  useEffect(() => {
    setSearchHistory(mockSearchHistory);
    setSavedSearches(mockSavedSearches);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className={`absolute inset-4 ${componentPatterns.modal} flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${themeClasses.border.default}`}>
          <div>
            <h2 className={`text-2xl font-bold ${themeClasses.text.primary}`}>🔍 Comprehensive Search</h2>
            <p className={`text-sm ${themeClasses.text.secondary} mt-1`}>
              Search addresses, coordinates, places, infrastructure, and saved data
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${themeClasses.interactive.subtle} transition-colors ${focusStyles.default}`}
          >
            <XMarkIcon className={`h-6 w-6 ${iconColors.default}`} />
          </button>
        </div>

        {/* Search Input */}
        <div className={`p-6 border-b ${themeClasses.border.default}`}>
          <div className="relative">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setShowSuggestions(suggestions.length > 0)}
                placeholder="Search for addresses, coordinates, places, infrastructure..."
                className={`w-full pl-12 pr-4 py-3 text-lg rounded-lg border-2 transition-all ${themeClasses.form.input} ${focusStyles.default}`}
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <MagnifyingGlassIcon className={`h-5 w-5 ${iconColors.default}`} />
              </div>
              {isSearching && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>

            {/* Search Type Filters */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {[
                { type: 'address' as const, label: 'Addresses', icon: '📮' },
                { type: 'coordinate' as const, label: 'Coordinates', icon: '🌐' },
                { type: 'place' as const, label: 'Places', icon: '📍' },
                { type: 'infrastructure' as const, label: 'Infrastructure', icon: '🏗️' },
                { type: 'imported_data' as const, label: 'Imported Data', icon: '📤' },
                { type: 'state' as const, label: 'States', icon: '🗺️' }
              ].map(({ type, label, icon }) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedTypes(prev =>
                      prev.includes(type)
                        ? prev.filter(t => t !== type)
                        : [...prev, type]
                    );
                  }}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    selectedTypes.includes(type)
                      ? `${themeClasses.status.active} border-blue-300`
                      : `${themeClasses.interactive.buttonSecondary} ${themeClasses.border.default} ${themeClasses.text.secondary} ${themeClasses.interactive.subtle}`
                  }`}
                >
                  <span className="mr-1">{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            {/* Advanced Options */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`px-3 py-1 text-sm rounded border transition-colors flex items-center space-x-1 ${
                  showAdvancedFilters
                    ? 'bg-purple-100 border-purple-300 text-purple-700'
                    : `${themeClasses.interactive.buttonSecondary} ${themeClasses.border.default} ${themeClasses.text.secondary} ${themeClasses.interactive.subtle}`
                }`}
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
                <span>Filters</span>
              </button>
              <button
                onClick={() => setShowSpatialSearch(!showSpatialSearch)}
                className={`px-3 py-1 text-sm rounded border transition-colors flex items-center space-x-1 ${
                  showSpatialSearch
                    ? 'bg-green-100 border-green-300 text-green-700'
                    : `${themeClasses.interactive.buttonSecondary} ${themeClasses.border.default} ${themeClasses.text.secondary} ${themeClasses.interactive.subtle}`
                }`}
              >
                <GlobeAltIcon className="h-4 w-4" />
                <span>Spatial Search</span>
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className={`absolute top-full left-0 right-0 mt-1 ${componentPatterns.panel} ${themeClasses.shadow.lg} z-10`}>
                {suggestions.map(suggestion => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 ${themeClasses.interactive.subtle} first:rounded-t-lg last:rounded-b-lg border-b ${themeClasses.border.light} last:border-b-0`}
                  >
                    <span className="text-lg">{suggestion.icon}</span>
                    <div className="flex-1 text-left">
                      <div className={`text-sm font-medium ${themeClasses.text.primary}`}>{suggestion.text}</div>
                      <div className={`text-xs ${themeClasses.text.secondary} capitalize`}>{suggestion.type}</div>
                    </div>
                    <div className={`text-xs ${themeClasses.text.muted}`}>{suggestion.frequency} searches</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className={`mt-4 p-4 ${themeClasses.background.secondary} rounded-lg`}>
              <h4 className={`text-sm font-medium ${themeClasses.text.primary} mb-3`}>Advanced Filters</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-xs font-medium ${themeClasses.form.label} mb-1`}>Status</label>
                  <select
                    multiple
                    value={searchFilters.status || []}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setSearchFilters(prev => ({ ...prev, status: values }));
                    }}
                    className={`w-full px-2 py-1 text-sm rounded ${themeClasses.form.select} ${focusStyles.default}`}
                    size={3}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">States</label>
                  <select
                    multiple
                    value={searchFilters.states || []}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setSearchFilters(prev => ({ ...prev, states: values }));
                    }}
                    className={`w-full px-2 py-1 text-sm rounded ${themeClasses.form.select} ${focusStyles.default}`}
                    size={3}
                  >
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Rajasthan">Rajasthan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    multiple
                    value={searchFilters.priority || []}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setSearchFilters(prev => ({ ...prev, priority: values }));
                    }}
                    className={`w-full px-2 py-1 text-sm rounded ${themeClasses.form.select} ${focusStyles.default}`}
                    size={3}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Spatial Search */}
          {showSpatialSearch && (
            <div className={`mt-4 p-4 ${themeClasses.background.secondary} rounded-lg`}>
              <h4 className={`text-sm font-medium ${themeClasses.text.primary} mb-3`}>Spatial Search</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Search Type</label>
                  <select
                    value={spatialSearch?.shape || 'circle'}
                    onChange={(e) => handleSpatialSearchChange({ shape: e.target.value as any })}
                    className={`w-full px-2 py-1 text-sm rounded ${themeClasses.form.select} ${focusStyles.default}`}
                  >
                    <option value="circle">Circle (Radius)</option>
                    <option value="rectangle">Rectangle (Bounding Box)</option>
                    <option value="polygon">Polygon</option>
                  </select>
                </div>

                {spatialSearch?.shape === 'circle' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Radius (km)</label>
                    <input
                      type="number"
                      value={spatialSearch?.radius || 10}
                      onChange={(e) => handleSpatialSearchChange({ radius: parseFloat(e.target.value) })}
                      className={`w-full px-2 py-1 text-sm rounded ${themeClasses.form.select} ${focusStyles.default}`}
                      min="0.1"
                      step="0.1"
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Center Coordinates</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Latitude"
                      value={spatialSearch?.center?.lat || ''}
                      onChange={(e) => handleSpatialSearchChange({
                        center: {
                          lat: parseFloat(e.target.value) || 0,
                          lng: spatialSearch?.center?.lng || 0
                        }
                      })}
                      className={`w-full px-2 py-1 text-sm rounded ${themeClasses.form.select} ${focusStyles.default}`}
                      step="any"
                    />
                    <input
                      type="number"
                      placeholder="Longitude"
                      value={spatialSearch?.center?.lng || ''}
                      onChange={(e) => handleSpatialSearchChange({
                        center: {
                          lat: spatialSearch?.center?.lat || 0,
                          lng: parseFloat(e.target.value) || 0
                        }
                      })}
                      className={`w-full px-2 py-1 text-sm rounded ${themeClasses.form.select} ${focusStyles.default}`}
                      step="any"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className={`flex border-b ${themeClasses.border.default}`}>
          {[
            { id: 'search', label: 'Results', icon: '🔍', count: searchResults.length },
            { id: 'history', label: 'History', icon: '📚', count: searchHistory.length },
            { id: 'saved', label: 'Saved', icon: '⭐', count: savedSearches.length }
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
              {tab.count > 0 && (
                <span className="ml-2 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto" ref={resultsRef}>
          {/* Search Results */}
          {activeTab === 'search' && (
            <div className="p-6">
              {searchResults.length === 0 && searchQuery.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Start Searching</h3>
                  <p className="text-gray-600">
                    Enter a search term to find addresses, coordinates, places, infrastructure, and more
                  </p>
                </div>
              )}

              {searchResults.length === 0 && searchQuery.length > 0 && !isSearching && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🤷</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
                  <p className="text-gray-600">
                    Try adjusting your search terms or filters
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {searchResults.map(result => (
                  <div
                    key={result.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleResultSelect(result)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="text-2xl">{result.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{result.title}</h3>
                            {result.subtitle && (
                              <p className="text-sm text-gray-600">{result.subtitle}</p>
                            )}
                            {result.description && (
                              <p className="text-sm text-gray-500 mt-1">{result.description}</p>
                            )}
                            {result.address && (
                              <p className="text-xs text-gray-400 mt-1">📍 {result.address}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900 capitalize">
                              {result.type.replace('_', ' ')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {(result.relevanceScore * 100).toFixed(0)}% match
                            </div>
                          </div>
                        </div>

                        {/* Metadata */}
                        {result.metadata && Object.keys(result.metadata).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(result.metadata).slice(0, 3).map(([key, value]) => (
                              <span
                                key={key}
                                className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                              >
                                {key}: {String(value)}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        {result.actions && result.actions.length > 0 && (
                          <div className="mt-3 flex space-x-2">
                            {result.actions.filter(action =>
                              !action.permissions ||
                              action.permissions.includes(userRole) ||
                              action.permissions.includes('all')
                            ).map(action => (
                              <button
                                key={action.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Handle action in real implementation
                                }}
                                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                              >
                                <span className="mr-1">{action.icon}</span>
                                {action.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search History */}
          {activeTab === 'history' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Search History</h3>
                <button
                  onClick={() => setSearchHistory([])}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Clear History
                </button>
              </div>

              <div className="space-y-3">
                {searchHistory.map(entry => (
                  <div
                    key={entry.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSearchQuery(entry.query);
                      setActiveTab('search');
                      performSearch(entry.query);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{entry.query}</h4>
                        <div className="text-sm text-gray-500">
                          {entry.resultsCount} results • {new Date(entry.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 capitalize">{entry.type}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Saved Searches */}
          {activeTab === 'saved' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Saved Searches</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Save Current Search
                </button>
              </div>

              <div className="space-y-4">
                {savedSearches.map(saved => (
                  <div key={saved.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">{saved.name}</h4>
                          {saved.isPublic && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                              Public
                            </span>
                          )}
                          {saved.notifications.enabled && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                              Notifications
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{saved.description}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {saved.tags.map(tag => (
                            <span
                              key={tag}
                              className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <div className="text-xs text-gray-400 mt-2">
                          Used {saved.usageCount} times • Updated {new Date(saved.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSearchQuery(saved.query.query);
                            setSelectedTypes(saved.query.types);
                            setSearchFilters(saved.query.filters);
                            setActiveTab('search');
                            performSearch(saved.query.query);
                          }}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          Run
                        </button>
                        <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveSearchSystem;