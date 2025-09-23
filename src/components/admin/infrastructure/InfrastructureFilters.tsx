import React from 'react';
import { InfrastructureCategory } from '../../../types';
import { InfrastructureFilter } from '../../../hooks/useInfrastructureData';

interface InfrastructureFiltersProps {
  filter: InfrastructureFilter;
  onFilterChange: (key: keyof InfrastructureFilter, value: string) => void;
  categories: InfrastructureCategory[];
  selectedItems: string[];
  onBulkAction: (action: string) => void;
  onAddNew: () => void;
  canAdd: boolean;
}

const InfrastructureFilters: React.FC<InfrastructureFiltersProps> = ({
  filter,
  onFilterChange,
  categories,
  selectedItems,
  onBulkAction,
  onAddNew,
  canAdd
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search infrastructure..."
            value={filter.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Category Filter */}
        <select
          value={filter.category || ''}
          onChange={(e) => onFilterChange('category', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filter.status || ''}
          onChange={(e) => onFilterChange('status', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="maintenance">Maintenance</option>
          <option value="planned">Planned</option>
          <option value="decommissioned">Decommissioned</option>
        </select>

        {/* Priority Filter */}
        <select
          value={filter.priority || ''}
          onChange={(e) => onFilterChange('priority', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {selectedItems.length} selected
            </span>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  onBulkAction(e.target.value);
                  e.target.value = '';
                }
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Bulk Actions</option>
              <option value="export">Export Selected</option>
              <option value="delete">Delete Selected</option>
              <option value="activate">Mark Active</option>
              <option value="maintenance">Mark Maintenance</option>
            </select>
          </div>
        )}

        {/* Add New Button */}
        {canAdd && (
          <button
            onClick={onAddNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Infrastructure
          </button>
        )}
      </div>
    </div>
  );
};

export default InfrastructureFilters;